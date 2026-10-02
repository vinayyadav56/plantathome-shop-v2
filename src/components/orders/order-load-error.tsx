'use client';

/**
 * Settled-but-empty state for the order pages. Before this, a failed order
 * fetch (bad/expired token, network) fell through to the tracking view with
 * `order === undefined`, which optional-chained its way into a fully BLANK
 * shell — "Order #", ₹0.00, a dead Pay Now button.
 */
export default function OrderLoadError({
  error,
  onRetry,
}: {
  error?: unknown;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-stone-500">
        Order not available
      </p>
      <h1 className="mb-3 text-2xl font-semibold leading-snug text-forest-900">
        We couldn&apos;t load this order
      </h1>
      <p className="mb-6 text-sm leading-relaxed text-stone-600">
        {error
          ? 'The link may be invalid or expired. Check the link from your email or SMS, or try again.'
          : 'Please try again in a moment.'}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-[14px] bg-ds-btn px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-800"
        >
          Try again
        </button>
        <a
          href="/track-order"
          className="rounded-full border border-forest-700 px-6 py-2.5 text-sm font-semibold text-forest-700 transition hover:bg-forest-700/5"
        >
          Track Order
        </a>
      </div>
    </div>
  );
}
