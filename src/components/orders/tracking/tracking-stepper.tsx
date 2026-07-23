import dayjs from 'dayjs';
import cn from 'classnames';
import type { ComponentType } from 'react';
import type { OrderShipment } from '@/types';
import {
  BoxIcon,
  CheckBoldIcon,
  CourierBagIcon,
  FlagIcon,
  ReceiptIcon,
  TruckIcon,
} from './icons';

type StepState = 'done' | 'current' | 'upcoming';

interface Step {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  state: StepState;
  timeLabel: string | null;
}

/**
 * Six-step journey: Placed → Confirmed → Packed → In Transit → Out for
 * Delivery → Delivered. The legacy order carries only a single current status
 * (no per-status history), so timestamps render where the data exists
 * (created_at, shipment shipped_at/delivered_at) and "—" elsewhere,
 * exactly like the design's unreached steps.
 */

// How far along the 6 visual steps each order_status reaches.
const STATUS_REACH: Record<string, number> = {
  'order-pending': 1,
  'order-processing': 2,
  'order-at-local-facility': 3,
  'order-out-for-delivery': 5,
  'order-completed': 6,
};

const IN_TRANSIT_SHIPMENT_STATUSES = ['shipped', 'out_for_delivery', 'delivered'];

function fmt(ts?: string | null): string | null {
  if (!ts) return null;
  const d = dayjs(ts);
  return d.isValid() ? d.format('D MMM, h:mm A') : null;
}

export function buildSteps(order: any, shipments: OrderShipment[]): Step[] {
  const status: string = order?.order_status ?? 'order-pending';
  let reach = STATUS_REACH[status] ?? 1;

  const anyInTransit = shipments.some(
    (s) =>
      Boolean(s.shipped_at) ||
      IN_TRANSIT_SHIPMENT_STATUSES.includes((s.status ?? '').toLowerCase()),
  );
  if (anyInTransit && reach < 4) reach = 4;

  const shippedTimes = shipments
    .map((s) => s.shipped_at)
    .filter(Boolean)
    .sort();
  const deliveredTimes = shipments
    .map((s) => s.delivered_at)
    .filter(Boolean)
    .sort();

  const defs = [
    { key: 'placed', label: 'Order Placed', icon: ReceiptIcon, time: fmt(order?.created_at) },
    { key: 'confirmed', label: 'Confirmed', icon: CheckBoldIcon, time: null },
    { key: 'packed', label: 'Packed', icon: BoxIcon, time: null },
    { key: 'transit', label: 'In Transit', icon: TruckIcon, time: fmt(shippedTimes[0]) },
    { key: 'ofd', label: 'Out for Delivery', icon: CourierBagIcon, time: null },
    {
      key: 'delivered',
      label: 'Delivered',
      icon: FlagIcon,
      time: fmt(deliveredTimes[deliveredTimes.length - 1]),
    },
  ];

  return defs.map((d, i) => ({
    key: d.key,
    label: d.label,
    icon: d.icon,
    state: i + 1 < reach ? 'done' : i + 1 === reach ? 'current' : 'upcoming',
    timeLabel: i + 1 <= reach ? d.time : null,
  }));
}

function StepCircle({ step }: { step: Step }) {
  const Icon = step.icon;
  if (step.state === 'done') {
    return (
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ds-accent,#4E8B31)] text-white shadow-sm">
        <CheckBoldIcon className="h-5 w-5" />
      </span>
    );
  }
  if (step.state === 'current') {
    return (
      <span className="rounded-full bg-[var(--ds-accent-soft,#EAF4E6)] p-1.5">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#DCEDD1] text-[var(--ds-accent-ink,#2E5E2A)]">
          <Icon className="h-[22px] w-[22px]" />
        </span>
      </span>
    );
  }
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E4E2D9] bg-white text-[#BDBBB1]">
      <Icon className="h-[22px] w-[22px]" />
    </span>
  );
}

function Connector({ reached, vertical }: { reached: boolean; vertical?: boolean }) {
  if (vertical) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          'mx-auto min-h-[28px] w-0 flex-1 border-l-2',
          reached ? 'border-[var(--ds-accent,#4E8B31)]' : 'border-dashed border-[#DBD9CF]',
        )}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        'h-0 flex-1 border-t-2',
        reached ? 'border-[var(--ds-accent,#4E8B31)]' : 'border-dashed border-[#DBD9CF]',
      )}
    />
  );
}

function TimeLabel({ step }: { step: Step }) {
  if (step.state === 'current' && step.timeLabel) {
    return (
      <span className="mt-1 inline-block rounded-full bg-[var(--ds-accent-soft,#EAF4E6)] px-2.5 py-0.5 text-xs font-semibold text-[var(--ds-accent-ink,#2E5E2A)]">
        {step.timeLabel}
      </span>
    );
  }
  return (
    <span className="mt-1 block text-xs text-[#9B998F]">{step.timeLabel ?? '—'}</span>
  );
}

export default function TrackingStepper({
  order,
  shipments,
}: {
  order: any;
  shipments: OrderShipment[];
}) {
  const steps = buildSteps(order, shipments);

  return (
    <div className="rounded-2xl border border-[#E7E5DC] bg-white px-4 py-6 shadow-sm sm:px-8 sm:py-8">
      {/* ≥ md: horizontal stepper */}
      <ol className="hidden md:flex">
        {steps.map((step, i) => (
          <li key={step.key} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {i === 0 ? (
                <span className="flex-1" />
              ) : (
                <Connector reached={step.state !== 'upcoming'} />
              )}
              <StepCircle step={step} />
              {i === steps.length - 1 ? (
                <span className="flex-1" />
              ) : (
                <Connector reached={steps[i + 1].state !== 'upcoming'} />
              )}
            </div>
            <p
              className={cn(
                'mt-3 text-center text-sm',
                step.state === 'upcoming'
                  ? 'font-medium text-[#9B998F]'
                  : 'font-semibold text-forest-900',
              )}
            >
              {step.label}
            </p>
            <TimeLabel step={step} />
          </li>
        ))}
      </ol>

      {/* < md: vertical timeline */}
      <ol className="flex flex-col md:hidden">
        {steps.map((step, i) => (
          <li key={step.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <StepCircle step={step} />
              {i !== steps.length - 1 ? (
                <Connector reached={steps[i + 1].state !== 'upcoming'} vertical />
              ) : null}
            </div>
            <div className={cn('pb-6', i === steps.length - 1 && 'pb-0')}>
              <p
                className={cn(
                  'pt-2.5 text-sm',
                  step.state === 'upcoming'
                    ? 'font-medium text-[#9B998F]'
                    : 'font-semibold text-forest-900',
                )}
              >
                {step.label}
              </p>
              <TimeLabel step={step} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
