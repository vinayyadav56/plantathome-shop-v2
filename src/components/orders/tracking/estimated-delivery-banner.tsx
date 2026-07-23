import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import type { OrderShipment } from '@/types';
import { OrderStatus } from '@/types';
import { PottedPlantIcon } from './icons';

/**
 * Soft-green band under the stepper. Prefers a real courier ETA
 * (expected_delivery_at → eta_days) from the shipments; falls back to a warm
 * generic line so the band doesn't vanish for orders without shipment rows.
 * Delivered orders get a "Delivered on …" variant.
 */
export default function EstimatedDeliveryBanner({
  order,
  shipments,
}: {
  order: any;
  shipments: OrderShipment[];
}) {
  const delivered = order?.order_status === OrderStatus.COMPLETED;

  let headline: ReactNode;
  let subline: string;

  if (delivered) {
    const deliveredTimes = shipments
      .map((s) => s.delivered_at)
      .filter(Boolean)
      .sort();
    const last = deliveredTimes[deliveredTimes.length - 1];
    headline = (
      <>
        Delivered{last ? <> on <strong>{dayjs(last).format('D MMM, YYYY (dddd)')}</strong></> : null}
      </>
    );
    subline = 'We hope your greens are settling in beautifully!';
  } else {
    const pending = shipments.filter(
      (s) => !s.delivered_at && (s.status ?? '').toLowerCase() !== 'cancelled',
    );
    const expectedDates = pending
      .map((s) => s.expected_delivery_at)
      .filter(Boolean)
      .sort();
    let expected = expectedDates[0] ? dayjs(expectedDates[0]) : null;

    if (!expected) {
      const etas = pending
        .map((s) => s.eta_days)
        .filter((n): n is number => n !== null && n !== undefined)
        .sort((a, b) => a - b);
      if (etas.length) expected = dayjs().add(Math.max(etas[0], 0), 'day');
    }

    if (expected) {
      headline = (
        <>
          Estimated Delivery: <strong>{expected.format('D MMM, YYYY (dddd)')}</strong>
        </>
      );
      subline = 'Your order is on its way and will reach you soon!';
    } else {
      headline = <>Your order is being prepared with care</>;
      subline = 'We’ll share the estimated delivery date as soon as it ships.';
    }
  }

  return (
    <div className="rounded-2xl bg-[var(--ds-accent-soft,#EAF4E6)] px-6 py-5 text-center">
      <p className="flex flex-wrap items-center justify-center gap-2 text-[15px] text-forest-900">
        <PottedPlantIcon className="h-5 w-5 text-[var(--ds-accent-ink,#2E5E2A)]" />
        <span>{headline}</span>
      </p>
      <p className="mt-1 text-[13px] text-[#637560]">{subline}</p>
    </div>
  );
}
