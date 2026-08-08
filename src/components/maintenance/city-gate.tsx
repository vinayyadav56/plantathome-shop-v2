import { useQuery } from 'react-query';
import { HttpClient } from '@/framework/client/http-client';
import { useCustomerCity } from '@/lib/use-customer-city';
import {
  adminOnly,
  getAuthCredentials,
  hasAccess,
} from '@/framework/utils/auth-utils';

/**
 * City Operations takeover — the customer-facing face of `cities.status`.
 *
 * When the shopper's delivery city is blocked (paused / disabled /
 * maintenance), the whole storefront is replaced by a full-screen state:
 *
 *  - MAINTENANCE renders the admin-authored content from
 *    cities.settings.maintenance (title, description, image, ETA, support
 *    contact), which the `service-availability/check` endpoint attaches to
 *    its response when the blocked reason is `city_maintenance`.
 *  - PAUSED / DISABLED render a plain "not serviceable here" screen with a
 *    change-city CTA (the existing pah:open-location event).
 *
 * This screen is the FACE, not the enforcement: checkout and order creation
 * are blocked server-side regardless (City::acceptsOrders). Fail-open by
 * construction — no city, request error, endpoint missing → children render.
 * Admins bypass, mirroring the platform maintenance gate.
 */
export default function CityOpsGate({ children }: { children: React.ReactNode }) {
  const { city } = useCustomerCity();
  const { permissions } = getAuthCredentials();
  const isAdmin = hasAccess(adminOnly, permissions);

  const { data } = useQuery<any>(
    // Same key SHAPE as the PDP's own vertical check (['svc-availability', vertical, city]),
    // so on a plants page the two share ONE cache entry and ONE request instead of firing
    // byte-identical calls under different keys. Any product vertical resolves the city tier;
    // plants is always known.
    ['svc-availability', 'plants', city],
    () =>
      HttpClient.get<any>('service-availability/check', {
        vertical: 'plants',
        city: city as string,
      }),
    // refetchOnWindowFocus dropped: the app default is false (app-providers.tsx) and this one
    // query silently overrode it, costing a request on every tab refocus site-wide.
    { enabled: !!city && !isAdmin, retry: 0, staleTime: 60_000 },
  );

  const reason: string | null = data?.reason ?? null;
  // ONLY whole-city blocks take the screen over. A vertical-level block
  // (city_vertical_*) keeps the storefront browsable — other verticals work.
  const cityBlocked =
    data?.available === false &&
    typeof reason === 'string' &&
    reason.startsWith('city_') &&
    !reason.startsWith('city_vertical');

  if (!cityBlocked || isAdmin) return <>{children}</>;

  const m = (data?.maintenance ?? {}) as {
    title?: string;
    description?: string;
    image?: string;
    until?: string;
    supportContact?: string;
    buttonTitle?: string;
  };
  const isMaintenance = reason === 'city_maintenance';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream-50 px-6 text-center">
      {isMaintenance && m.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={m.image}
          alt=""
          className="mb-8 max-h-56 w-auto rounded-[22px] object-cover"
        />
      ) : (
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-sage-100">
          <svg viewBox="0 0 24 24" className="h-10 w-10 text-forest-700" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.95-6.95l-1.414 1.414M7.464 16.536L6.05 17.95m11.9 0l-1.414-1.414M7.464 7.464L6.05 6.05" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </div>
      )}

      <h1 className="max-w-xl text-2xl font-semibold text-forest-900 sm:text-3xl">
        {isMaintenance
          ? m.title || `We’re improving our services in ${city}`
          : `${city} is currently unavailable`}
      </h1>
      <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-stone-600">
        {isMaintenance
          ? m.description || 'We’ll be back shortly. Thank you for your patience.'
          : data?.message ||
            'We’re not delivering to this city right now. You can browse another city meanwhile.'}
      </p>

      {isMaintenance && m.until ? (
        <p className="mt-4 text-sm font-semibold text-forest-700">
          Expected back: {new Date(m.until).toLocaleString()}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('pah:open-location'))}
          className="rounded-[14px] bg-[#14532D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0D4324]"
        >
          {m.buttonTitle || 'Change delivery city'}
        </button>
        {isMaintenance && m.supportContact ? (
          <a
            href={
              m.supportContact.includes('@')
                ? `mailto:${m.supportContact}`
                : `tel:${m.supportContact}`
            }
            className="rounded-[14px] border border-forest-700 px-6 py-3 text-sm font-semibold text-forest-800 transition hover:bg-sage-100"
          >
            Contact support
          </a>
        ) : null}
      </div>
    </div>
  );
}
