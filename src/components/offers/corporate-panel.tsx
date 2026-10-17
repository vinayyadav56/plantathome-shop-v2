import Link from 'next/link';
import { useGiftingTemplates } from '@/framework/garden';
import GiftingTiers from '@/components/corporate-gifting/gifting-tiers';
import { Gift } from '@/components/ui/icon';

export default function CorporatePanel() {
  // The same query GiftingTiers reads (one request): this panel owns the empty state.
  const { data, isLoading } = useGiftingTemplates();
  const tiers = data?.data ?? [];

  return (
    <div className="w-full">
      <p className="max-w-2xl text-stone-600">
        Memorable, sustainable plant gifts for clients and teams — buy a
        ready-to-gift hamper below, or explore the full corporate experience for
        custom branding &amp; bulk enquiries.
      </p>

      {!isLoading && tiers.length === 0 ? (
        <div className="shadow-box mt-8 rounded-2xl border border-kraft-200 bg-white p-10 text-center">
          <Gift size={40} className="mx-auto text-forest-600" aria-hidden />
          <h3 className="mt-3 font-pahserif text-lg font-medium text-forest-900">
            Corporate gifting, made effortless
          </h3>
          <p className="mt-1 text-stone-500">
            Custom branded plant hampers for teams, clients &amp; festive
            occasions — get a tailored quote.
          </p>
          <Link
            href="/corporate-gifting"
            className="pa-btn pa-btn-primary mt-5 inline-block"
          >
            Explore corporate gifting →
          </Link>
        </div>
      ) : (
        <>
          <GiftingTiers className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" />

          {!isLoading && (
            <div className="shadow-box mt-10 rounded-2xl border border-kraft-200 bg-white p-6 text-center sm:p-8">
              <h3 className="font-pahserif text-xl font-medium text-forest-900">
                Need custom branding or bulk quantities?
              </h3>
              <p className="mx-auto mt-1 max-w-xl text-sm text-stone-500">
                Custom pots, tags &amp; packaging with your logo, split-shipped
                pan-India — send an enquiry and our gifting team will tailor a
                proposal.
              </p>
              <Link
                href="/corporate-gifting"
                className="pa-btn pa-btn-primary mt-5 inline-block"
              >
                Explore corporate gifting →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
