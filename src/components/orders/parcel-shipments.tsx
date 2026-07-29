import dayjs from 'dayjs';
import Badge from '@/components/ui/badge';
import { useOrderShipments } from '@/framework/order';
import type { OrderShipment, OrderShipmentItem } from '@/types';

interface ParcelShipmentsProps {
  tracking?: string;
}

/**
 * Per-parcel tracking: one card per shipment with its own status, courier +
 * tracking link, ETA, and contents — so a split order (e.g. same-city plants
 * arriving today + a couriered tool arriving in 3 days) reads like Amazon's
 * "Parcel 1 of 2", instead of the whole order looking stuck on the slowest leg.
 * Renders nothing when the order has no shipments (legacy orders / not
 * permitted), so the page is unchanged for everything else.
 */

// Shipment statuses (pending|assigned|packed|shipped|out_for_delivery|delivered|cancelled)
// mapped onto the same status colour tokens the order badges use.
function chipClass(status?: string | null): string {
  const s = (status ?? '').toLowerCase();
  if (s === 'delivered') {
    return 'bg-status-complete bg-opacity-[.15] text-status-complete';
  }
  if (s === 'out_for_delivery' || s === 'shipped') {
    return 'bg-status-out-for-delivery bg-opacity-[.15] text-status-out-for-delivery';
  }
  if (s === 'cancelled') {
    return 'bg-status-canceled bg-opacity-[.15] text-status-canceled';
  }
  if (s === 'pending') {
    return 'bg-status-pending bg-opacity-[.15] text-status-pending';
  }
  return 'bg-status-processing bg-opacity-[.15] text-status-processing';
}

function statusLabel(status?: string | null): string {
  const s = (status ?? 'processing').replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function etaLine(s: OrderShipment): string | null {
  if (s.delivered_at) {
    return `Delivered on ${dayjs(s.delivered_at).format('MMM D')}`;
  }
  if ((s.status ?? '').toLowerCase() === 'cancelled') {
    return null;
  }
  if (s.expected_delivery_at) {
    return `Arriving by ${dayjs(s.expected_delivery_at).format('MMM D')}`;
  }
  if (s.eta_days !== null && s.eta_days !== undefined) {
    return s.eta_days <= 0 ? 'Arriving today' : `Arriving in ~${s.eta_days} day${s.eta_days === 1 ? '' : 's'}`;
  }
  return null;
}

function itemThumb(image: OrderShipmentItem['image']): string | null {
  if (!image) return null;
  if (typeof image === 'string') return image;
  return image.thumbnail ?? image.original ?? null;
}

export default function ParcelShipments({ tracking }: ParcelShipmentsProps) {
  const { shipments } = useOrderShipments({ tracking_number: tracking });

  if (!shipments.length) return null;

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-xl font-medium text-forest-900">
        {shipments.length > 1 ? `Your parcels (${shipments.length})` : 'Your shipment'}
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {shipments.map((s, idx) => {
          const eta = etaLine(s);
          return (
            <div
              key={idx}
              className="rounded border border-border-200 px-5 py-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-forest-900">
                  {shipments.length > 1 ? `Parcel ${idx + 1} of ${shipments.length}` : 'Parcel'}
                  <span className="ml-2 text-xs font-normal text-body-dark">
                    {s.fulfillment_mode === 'courier' ? 'Courier' : 'Local delivery'}
                  </span>
                </h3>
                <Badge text={statusLabel(s.status)} color={chipClass(s.status)} />
              </div>

              {eta ? (
                <p className="mb-2 text-sm font-medium text-forest-900">{eta}</p>
              ) : null}

              {(s.courier_name || s.awb_number) && (
                <p className="mb-3 text-xs text-body-dark">
                  {s.courier_name ?? 'Courier'}
                  {s.awb_number ? ` · AWB ${s.awb_number}` : ''}
                  {s.tracking_url ? (
                    <>
                      {' · '}
                      <a
                        href={s.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-accent hover:underline"
                      >
                        Track parcel
                      </a>
                    </>
                  ) : null}
                </p>
              )}

              {s.items?.length ? (
                <ul className="space-y-2 border-t border-dashed border-border-200 pt-3">
                  {s.items.map((it, i) => {
                    const thumb = itemThumb(it.image);
                    return (
                      <li key={i} className="flex items-center text-sm text-body-dark">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={it.name ?? ''}
                            className="mr-3 h-8 w-8 rounded object-cover"
                          />
                        ) : null}
                        <span className="flex-1 truncate">{it.name ?? 'Item'}</span>
                        <span className="ml-2 shrink-0 text-xs">× {it.quantity}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
