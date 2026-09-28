export interface LatLng {
  lat: number;
  lng: number;
}

/** Great-circle distance between two coordinates, in kilometres (Haversine). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // earth radius km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Coerce a GoogleMapLocation-style lat/lng (number | string | null) to LatLng. */
export function toLatLng(loc?: {
  lat?: number | string | null;
  lng?: number | string | null;
} | null): LatLng | null {
  if (loc?.lat == null || loc?.lng == null) return null;
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Human-friendly distance label. */
export function formatDistance(km: number): string {
  // A persisted verification from an older shape can carry no distance; `undefined.toFixed`
  // would take the whole checkout to the route error boundary for a cosmetic label.
  if (!Number.isFinite(km)) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}
