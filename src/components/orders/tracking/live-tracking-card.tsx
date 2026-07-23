'use client';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import dayjs from 'dayjs';
import CopyToClipboard from 'react-copy-to-clipboard';
import { toast } from 'react-toastify';
import {
  GoogleMap,
  MarkerF,
  DirectionsRenderer,
  useJsApiLoader,
} from '@react-google-maps/api';
import { HttpClient } from '@/framework/client/http-client';
import { GMAPS_LOADER_OPTIONS } from '@/lib/gmaps-loader';
import type { OrderShipment } from '@/types';
import {
  ChevronRightIcon,
  CopyIcon,
  MapPinIcon,
  PhoneIcon,
  RefreshIcon,
} from './icons';

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;

function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function pt(o: any) {
  if (!o) return null;
  const lat = num(o.lat);
  const lng = num(o.lng);
  return lat != null && lng != null ? { lat, lng } : null;
}

// Muted, paper-toned map so the live view sits inside the page's palette.
const MAP_STYLES: any[] = [
  { elementType: 'geometry', stylers: [{ color: '#f4f1e8' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8c8a81' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbe7d3' }] },
];

// Dashed green route (DirectionsRenderer's own polyline is hidden).
const DASHED_ROUTE: any = {
  strokeOpacity: 0,
  icons: [
    {
      icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeWeight: 3, strokeColor: '#3E7D32', scale: 2.4 },
      offset: '0',
      repeat: '16px',
    },
  ],
};

function LocationChip({
  title,
  name,
  city,
  className,
}: {
  title: string;
  name: string;
  city?: string | null;
  className?: string;
}) {
  return (
    <div className={`pointer-events-none rounded-xl bg-white/95 px-3.5 py-2.5 shadow-md ring-1 ring-black/5 ${className ?? ''}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#9B998F]">{title}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-semibold text-forest-900">
        <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-[var(--ds-accent,#4E8B31)]" />
        {name}
      </p>
      {city ? <p className="ml-5 text-[11px] text-[#8C8A81]">{city}</p> : null}
    </div>
  );
}

/** Stylised placeholder "map" for orders without a live courier position. */
function PlaceholderMap() {
  return (
    <svg viewBox="0 0 640 300" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <rect width="640" height="300" fill="#F2EFE6" />
      {/* faint blocks */}
      <g fill="#EAE6D9">
        <rect x="40" y="30" width="120" height="70" rx="8" />
        <rect x="210" y="20" width="90" height="52" rx="8" />
        <rect x="470" y="40" width="130" height="64" rx="8" />
        <rect x="80" y="190" width="110" height="66" rx="8" />
        <rect x="420" y="200" width="100" height="60" rx="8" />
        <rect x="260" y="210" width="90" height="56" rx="8" />
      </g>
      <g fill="#E3EDD9">
        <ellipse cx="580" cy="150" rx="70" ry="34" />
        <ellipse cx="70" cy="140" rx="52" ry="26" />
      </g>
      {/* roads */}
      <g stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" fill="none">
        <path d="M-10 120 C 140 100, 300 160, 650 120" />
        <path d="M180 -10 C 190 90, 170 210, 200 310" />
        <path d="M430 -10 C 440 110, 420 200, 460 310" />
      </g>
      {/* dashed courier route */}
      <path
        d="M115 165 C 220 220, 300 210, 350 180 S 500 130, 545 155"
        fill="none"
        stroke="#3E7D32"
        strokeWidth="3"
        strokeDasharray="7 9"
        strokeLinecap="round"
      />
      {/* origin + destination pins */}
      <circle cx="115" cy="165" r="9" fill="#3E7D32" />
      <circle cx="115" cy="165" r="4" fill="#fff" />
      <path d="M545 132 a12 12 0 0 1 12 12 c0 9-12 20-12 20 s-12-11-12-20 a12 12 0 0 1 12-12z" fill="#E8833A" />
      <circle cx="545" cy="144" r="4.5" fill="#fff" />
      {/* truck badge mid-route */}
      <g transform="translate(330 178)">
        <circle r="17" fill="#fff" stroke="#DCEDD1" strokeWidth="3" />
        <g transform="translate(-9 -8)" fill="none" stroke="#3E7D32" strokeWidth="1.6" strokeLinejoin="round">
          <path d="M1 3.5A1.2 1.2 0 012.2 2.3H9a1.2 1.2 0 011.2 1.2V11H2.2A1.2 1.2 0 011 9.8V3.5z" />
          <path d="M10.2 5h2.4a1.2 1.2 0 011 .5l1.7 2.3a1.2 1.2 0 01.2.7v1.3a1.2 1.2 0 01-1.2 1.2h-.6" />
          <circle cx="4.6" cy="12.4" r="1.5" />
          <circle cx="11.4" cy="12.4" r="1.5" />
        </g>
      </g>
    </svg>
  );
}

function LiveMap({ data }: { data: any }) {
  const { isLoaded } = useJsApiLoader(GMAPS_LOADER_OPTIONS);
  const [directions, setDirections] = useState<any>(null);

  const courier = pt(data?.courier);
  const drop = pt(data?.drop);
  const pickup = pt(data?.pickup?.location);

  const cLat = courier?.lat;
  const cLng = courier?.lng;
  const dLat = drop?.lat;
  const dLng = drop?.lng;

  useEffect(() => {
    if (!isLoaded || cLat == null || dLat == null) return;
    // @ts-ignore
    const svc = new google.maps.DirectionsService();
    svc.route(
      // @ts-ignore
      { origin: { lat: cLat, lng: cLng }, destination: { lat: dLat, lng: dLng }, travelMode: google.maps.TravelMode.DRIVING },
      (res: any, status: any) => {
        if (status === 'OK' && res) setDirections(res);
      },
    );
  }, [isLoaded, cLat, cLng, dLat, dLng]);

  if (!isLoaded) return <PlaceholderMap />;

  const center = courier ?? drop ?? pickup ?? { lat: 20.5937, lng: 78.9629 };

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={center as any}
      zoom={13}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        zoomControl: false,
        styles: MAP_STYLES,
      }}
    >
      {pickup && (
        <MarkerF
          position={pickup as any}
          title="Nursery"
          // @ts-ignore
          icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#3E7D32', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }}
        />
      )}
      {drop && (
        <MarkerF
          position={drop as any}
          title="Your address"
          // @ts-ignore
          icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#E8833A', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }}
        />
      )}
      {courier && (
        <MarkerF
          position={courier as any}
          title={data?.courier?.name ? `${data.courier.name} (live)` : 'Courier (live)'}
          // @ts-ignore
          icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: '#ffffff', fillOpacity: 1, strokeColor: '#3E7D32', strokeWeight: 3 }}
        />
      )}
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{ suppressMarkers: true, polylineOptions: DASHED_ROUTE }}
        />
      )}
    </GoogleMap>
  );
}

/**
 * "Live Tracking" card: map (live courier position while out for delivery,
 * stylised route placeholder otherwise), From/To chips, and the delivery
 * partner / tracking ID / contact strip fed by the customer-safe shipments
 * endpoint.
 */
export default function LiveTrackingCard({
  order,
  shipments,
}: {
  order: any;
  shipments: OrderShipment[];
}) {
  const tracking = order?.tracking_number;
  const { data, refetch, isFetching, dataUpdatedAt } = useQuery<any>(
    ['courier-loc', tracking],
    () => HttpClient.get(`orders/${tracking}/courier-location`),
    { enabled: !!tracking, refetchInterval: 15_000, retry: 0 },
  );

  const live = Boolean(data?.available) && Boolean(KEY);

  // Shipment that carries courier identity (a split order shows the rest in
  // the per-parcel cards below).
  const primary =
    shipments.find((s) => s.awb_number || s.courier_name) ?? shipments[0];

  const partnerName = primary?.courier_name ?? data?.courier?.name ?? null;
  const awb = primary?.awb_number ?? null;
  const riderMobile = data?.courier?.mobile ?? null;

  const fromName = data?.pickup?.name ?? order?.shop?.name ?? 'Plant At Home';
  const fromCity = order?.shop?.address?.city ?? null;
  const toCity = order?.shipping_address?.city ?? null;

  const updated = dayjs(dataUpdatedAt || undefined);
  const updatedLabel = updated.isValid()
    ? updated.isSame(dayjs(), 'day')
      ? `Today, ${updated.format('h:mm A')}`
      : updated.format('D MMM, h:mm A')
    : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E7E5DC] bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 pb-4 pt-5 sm:px-6">
        <h3 className="text-base font-semibold text-forest-900">Live Tracking</h3>
        <div className="flex items-center gap-2 text-xs text-[#9B998F]">
          {updatedLabel ? <span>Last updated: {updatedLabel}</span> : null}
          <button
            type="button"
            aria-label="Refresh tracking"
            onClick={() => refetch()}
            className="rounded-full p-1 text-[#8C8A81] transition-colors hover:bg-[#F3F1EA] hover:text-forest-900"
          >
            <RefreshIcon className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-5 sm:px-6">
        <div className="relative h-[280px] overflow-hidden rounded-xl border border-[#EDEBE2] sm:h-[320px]">
          {live ? <LiveMap data={data} /> : <PlaceholderMap />}
          <LocationChip
            title="From"
            name={fromName}
            city={fromCity}
            className="absolute left-3 top-3 max-w-[45%]"
          />
          <LocationChip
            title="To"
            name="Your Location"
            city={toCity}
            className="absolute bottom-3 right-3 max-w-[45%] sm:bottom-auto sm:top-3"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 divide-y divide-[#EDEBE2] border-t border-[#EDEBE2] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {/* Delivery partner */}
        <a
          href={primary?.tracking_url ?? undefined}
          target={primary?.tracking_url ? '_blank' : undefined}
          rel={primary?.tracking_url ? 'noopener noreferrer' : undefined}
          className={`flex items-center gap-3 px-5 py-4 sm:px-6 ${
            primary?.tracking_url ? 'transition-colors hover:bg-[#FBFAF6]' : 'cursor-default'
          }`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-900 text-base font-bold text-white">
            {(partnerName ?? 'P').charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-[#9B998F]">
              Delivery Partner
            </span>
            <span className="block truncate text-sm font-semibold text-forest-900">
              {partnerName ?? 'To be assigned'}
            </span>
          </span>
          {primary?.tracking_url ? (
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#B8B6AD]" />
          ) : null}
        </a>

        {/* Tracking ID */}
        <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-[#9B998F]">
              Tracking ID
            </span>
            <span className="block truncate text-sm font-semibold text-forest-900">
              {awb ?? '—'}
            </span>
          </span>
          {awb ? (
            <CopyToClipboard text={awb} onCopy={() => toast.success('Tracking ID copied')}>
              <button
                type="button"
                aria-label="Copy tracking ID"
                className="shrink-0 text-[#A6A49B] transition-colors hover:text-[var(--ds-accent-ink,#2E5E2A)]"
              >
                <CopyIcon className="h-4 w-4" />
              </button>
            </CopyToClipboard>
          ) : null}
        </div>

        {/* Contact rider */}
        <a
          href={riderMobile ? `tel:${riderMobile}` : undefined}
          className={`flex items-center gap-3 px-5 py-4 sm:px-6 ${
            riderMobile ? 'transition-colors hover:bg-[#FBFAF6]' : 'cursor-default'
          }`}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-[#9B998F]">
              Contact Rider
            </span>
            <span className="block truncate text-sm font-semibold text-forest-900">
              {riderMobile ?? 'Available on delivery day'}
            </span>
          </span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ds-accent-soft,#EAF4E6)] text-[var(--ds-accent-ink,#2E5E2A)]">
            <PhoneIcon className="h-4 w-4" />
          </span>
        </a>
      </div>

      {data?.courier?.name && live ? (
        <p className="border-t border-[#EDEBE2] px-5 py-3 text-xs text-[#8C8A81] sm:px-6">
          Your delivery partner <span className="font-semibold text-forest-900">{data.courier.name}</span> is on the way
          {data?.courier?.stale ? ' · location updating…' : ''}.
        </p>
      ) : null}
    </div>
  );
}
