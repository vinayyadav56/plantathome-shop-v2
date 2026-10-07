'use client';
import dayjs from 'dayjs';
import cn from 'classnames';
import { useState, type ComponentType } from 'react';
import { ChevronDown } from '@/components/ui/icon';
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
    <div className="rounded-2xl border border-kraft-200 bg-white px-4 py-6 shadow-box sm:px-8 sm:py-8">
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

/** Opens the Live Tracking card (live-tracking-card.tsx listens for this and
 *  for #live-tracking) — the card owns its own collapsed state. */
export const OPEN_LIVE_TRACKING_EVENT = 'pah:open-live-tracking';

/** The blinking "you are here" dot. Bright green, and it only pulses for people
 *  who have not asked for reduced motion. */
function LiveDot({ size = 'h-3 w-3' }: { size?: string }) {
  return (
    <span className={cn('relative flex shrink-0', size)} aria-hidden="true">
      <span className="absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75 motion-safe:animate-ping" />
      <span className={cn('relative inline-flex rounded-full bg-[#22C55E]', size)} />
    </span>
  );
}

function MiniCircle({ step }: { step: Step }) {
  if (step.state === 'done') {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ds-accent,#4E8B31)] text-white">
        <CheckBoldIcon className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (step.state === 'current') {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#DCF5D0] ring-2 ring-[#22C55E]">
        <LiveDot size="h-2.5 w-2.5" />
      </span>
    );
  }
  const Icon = step.icon;
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#E4E2D9] bg-white text-[#BDBBB1]">
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

/**
 * Order status as a section of the "Order Details" card (owner annotation:
 * "this should be on the right side inside the order details with tracking
 * button and collapsible section with bright green color animation with
 * blinking"). Replaces the full-width stepper that used to sit above the page.
 * Collapsed, it still says where the order is; the current step blinks green.
 */
export function OrderStatusPanel({
  order,
  shipments,
  trackable,
}: {
  order: any;
  shipments: OrderShipment[];
  /** Show "Track order" — only when the Live Tracking card is on the page. */
  trackable: boolean;
}) {
  const steps = buildSteps(order, shipments);
  const current = steps.find((s) => s.state === 'current') ?? steps[steps.length - 1];
  const delivered = steps[steps.length - 1].state !== 'upcoming';
  const [open, setOpen] = useState(true);

  function track() {
    window.dispatchEvent(new Event(OPEN_LIVE_TRACKING_EVENT));
    document.getElementById('live-tracking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section aria-label="Order status" className="mb-4 overflow-hidden rounded-xl border border-[#CDEBC0] bg-[#F4FBF0]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#22C55E]"
      >
        {delivered ? (
          <span className="flex h-3 w-3 shrink-0 rounded-full bg-[var(--ds-accent,#4E8B31)]" aria-hidden="true" />
        ) : (
          <LiveDot />
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3F7A2A]">
            Order status
          </span>
          <span className="block truncate text-sm font-semibold text-forest-900">
            {current.label}
            {current.timeLabel ? (
              <span className="font-normal text-[#6F6D64]"> · {current.timeLabel}</span>
            ) : null}
          </span>
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-[#6F6D64] transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="border-t border-[#DCEFD3] bg-white/60 px-4 pb-4 pt-3">
          <ol className="flex flex-col">
            {steps.map((step, i) => (
              <li key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <MiniCircle step={step} />
                  {i !== steps.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'min-h-[14px] w-0 flex-1 border-l-2',
                        steps[i + 1].state !== 'upcoming'
                          ? 'border-[var(--ds-accent,#4E8B31)]'
                          : 'border-dashed border-[#DBD9CF]',
                      )}
                    />
                  ) : null}
                </div>
                <div className={cn('min-w-0 pb-3 pt-1', i === steps.length - 1 && 'pb-0')}>
                  <p
                    className={cn(
                      'text-[13px] leading-tight',
                      step.state === 'current'
                        ? 'font-semibold text-[#15803D]'
                        : step.state === 'done'
                          ? 'font-medium text-forest-900'
                          : 'text-[#9B998F]',
                    )}
                  >
                    {step.label}
                    {step.state === 'current' ? <span className="sr-only"> (current step)</span> : null}
                  </p>
                  {step.timeLabel ? (
                    <p className="mt-0.5 text-[11.5px] text-[#9B998F]">{step.timeLabel}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>

          {trackable ? (
            <button
              type="button"
              onClick={track}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-control bg-ds-btn px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-ds-btn-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-btn focus-visible:ring-offset-2"
            >
              <TruckIcon className="h-4 w-4" />
              Track order
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
