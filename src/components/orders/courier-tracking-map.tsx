'use client';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { GoogleMap, MarkerF, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { HttpClient } from '@/framework/client/http-client';
import { GMAPS_LOADER_OPTIONS } from '@/lib/gmaps-loader';

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

/**
 * Customer "where's my plant" — live courier position for an order, polled every
 * ~10s. Only shows while the order is out for delivery (the API gates it); hidden
 * otherwise. Route + ETA from the courier to the drop, computed client-side.
 */
export default function CourierTrackingMap({ tracking }: { tracking?: string }) {
  const { data } = useQuery<any>(
    ['courier-loc', tracking],
    () => HttpClient.get(`orders/${tracking}/courier-location`),
    { enabled: !!tracking, refetchInterval: 10_000, retry: 0 },
  );
  // Shared loader config — must match the Places autocomplete loader, else
  // @react-google-maps/api throws and crashes the order page.
  const { isLoaded } = useJsApiLoader(GMAPS_LOADER_OPTIONS);
  const [directions, setDirections] = useState<any>(null);
  const [eta, setEta] = useState<{ distance: string; duration: string } | null>(null);

  const available = data?.available;
  const courier = available ? pt(data?.courier) : null;
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
        if (status === 'OK' && res) {
          setDirections(res);
          const leg = res.routes?.[0]?.legs?.[0];
          if (leg) setEta({ distance: leg.distance?.text ?? '', duration: leg.duration?.text ?? '' });
        }
      },
    );
  }, [isLoaded, cLat, cLng, dLat, dLng]);

  if (!available) return null; // hidden until the order is out for delivery
  if (!KEY) return null;
  if (!isLoaded) {
    return <div className="grid h-[200px] place-items-center rounded-xl bg-gray-50 text-sm text-gray-500">Loading live map…</div>;
  }

  const center = courier ?? drop ?? pickup ?? { lat: 20.5937, lng: 78.9629 };

  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Out for delivery</h3>
        {eta && <span className="text-xs font-medium text-emerald-700">≈ {eta.duration} · {eta.distance} away</span>}
      </div>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: 260, borderRadius: 12 }}
        center={center as any}
        zoom={13}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
      >
        {pickup && <MarkerF position={pickup as any} label={{ text: 'P', color: '#fff' }} title="Nursery" />}
        {drop && <MarkerF position={drop as any} label={{ text: 'You', color: '#fff' }} title="Your address" />}
        {courier && (
          <MarkerF
            position={courier as any}
            title={data?.courier?.name ? `${data.courier.name} (live)` : 'Courier (live)'}
            // @ts-ignore
            icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#2563eb', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }}
          />
        )}
        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#0e7c4a', strokeWeight: 4 } }} />}
      </GoogleMap>
      {data?.courier?.name && (
        <p className="mt-2 text-xs text-gray-500">
          Your delivery partner <span className="font-medium text-gray-700">{data.courier.name}</span> is on the way
          {data?.courier?.stale ? ' · location updating…' : ''}.
        </p>
      )}
    </div>
  );
}
