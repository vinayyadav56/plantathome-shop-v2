/**
 * Client-side mirror of the API's Address::missingFields (identical util
 * shipped in admin). Determines whether a saved address has everything the
 * routed address endpoints require: street_address, city, state and a valid
 * 6-digit PIN. `house_no` is deliberately NOT gated so legacy addresses
 * (saved before the field existed) stay usable without forced re-entry.
 */
export type AnyAddress = Record<string, any> | null | undefined;
const PIN_RE = /^[1-9][0-9]{5}$/;
export function missingAddressFields(addr: AnyAddress): string[] {
  const a = addr ?? {};
  const inner = a.address && typeof a.address === 'object' ? a.address : (a as any);
  const missing: string[] = [];
  for (const key of ['street_address', 'city', 'state']) {
    if (!String(inner?.[key] ?? '').trim()) missing.push(key);
  }
  const zip = String(inner?.zip ?? inner?.pincode ?? inner?.postal_code ?? '').replace(/\s+/g, '');
  if (!PIN_RE.test(zip)) missing.push('zip');
  return missing;
}
export function isAddressComplete(addr: AnyAddress): boolean {
  return missingAddressFields(addr).length === 0;
}
