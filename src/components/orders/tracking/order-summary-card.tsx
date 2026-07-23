import dayjs from 'dayjs';
import CopyToClipboard from 'react-copy-to-clipboard';
import { toast } from 'react-toastify';
import { SpinnerLoader } from '@/components/ui/loaders/spinner/spinner';
import { CopyIcon, HeadsetIcon } from './icons';

/**
 * "Order #… / Placed on …" header card with a copy button and a Need Help?
 * shortcut that scrolls to the help card in the sidebar.
 */
export default function OrderSummaryCard({ order, loading }: { order: any; loading?: boolean }) {
  const placed = order?.created_at ? dayjs(order.created_at) : null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#E7E5DC] bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-forest-900">
            Order #{order?.tracking_number}
          </h2>
          {loading ? <SpinnerLoader /> : null}
          <CopyToClipboard
            text={String(order?.tracking_number ?? '')}
            onCopy={() => toast.success('Order number copied')}
          >
            <button
              type="button"
              aria-label="Copy order number"
              className="text-[#A6A49B] transition-colors hover:text-[var(--ds-accent-ink,#2E5E2A)]"
            >
              <CopyIcon className="h-4 w-4" />
            </button>
          </CopyToClipboard>
        </div>
        {placed ? (
          <p className="mt-1 text-[13px] text-[#8C8A81]">
            Placed on {placed.format('D MMM, YYYY')}
            <span className="mx-2 text-[#D8D6CC]">|</span>
            {placed.format('h:mm A')}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() =>
          document.getElementById('need-help')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-[var(--ds-accent,#4E8B31)] px-4 py-2 text-sm font-semibold text-[var(--ds-accent-ink,#2E5E2A)] transition-colors hover:bg-[var(--ds-accent-soft,#EAF4E6)] sm:self-auto"
      >
        <HeadsetIcon className="h-[18px] w-[18px]" />
        Need Help?
      </button>
    </div>
  );
}
