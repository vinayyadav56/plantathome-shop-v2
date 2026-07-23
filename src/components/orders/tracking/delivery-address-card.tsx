import Link from '@/components/ui/link';
import { Routes } from '@/config/routes';
import { MapPinIcon } from './icons';

/**
 * Sidebar delivery-address card. "Change Address" routes to support — an
 * in-flight order's address can only be changed by the team, not self-serve.
 */
export default function DeliveryAddressCard({ order }: { order: any }) {
  const addr = order?.shipping_address ?? {};
  const line2 = [addr?.city, addr?.state].filter(Boolean).join(', ');
  const line2WithZip = [line2, addr?.zip].filter(Boolean).join(' - ');

  return (
    <div className="rounded-2xl border border-[#E7E5DC] bg-white px-5 py-5 shadow-sm sm:px-6">
      <h3 className="mb-3 text-base font-semibold text-forest-900">Delivery Address</h3>

      <div className="flex gap-2.5">
        <MapPinIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--ds-accent,#4E8B31)]" />
        <div className="text-[13px] leading-relaxed text-[#6F6D64]">
          {order?.customer_name ? (
            <p className="font-semibold text-forest-900">{order.customer_name}</p>
          ) : null}
          {addr?.street_address ? <p>{addr.street_address}</p> : null}
          {line2WithZip ? <p>{line2WithZip}</p> : null}
          {addr?.country ? <p>{addr.country}</p> : null}
          {order?.customer_contact ? <p>Phone: {order.customer_contact}</p> : null}
          {order?.delivery_time ? (
            <p className="mt-1 text-[12px] text-[#9B998F]">Preferred slot: {order.delivery_time}</p>
          ) : null}
        </div>
      </div>

      <Link
        href={Routes.contactUs}
        className="mt-4 block w-full rounded-lg border border-[var(--ds-accent,#4E8B31)] py-2.5 text-center text-sm font-semibold text-[var(--ds-accent-ink,#2E5E2A)] transition-colors hover:bg-[var(--ds-accent-soft,#EAF4E6)]"
      >
        Change Address
      </Link>
    </div>
  );
}
