'use client';
import { useEffect, useRef, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  getStoredCity,
  setStoredCity,
  setStoredPincode,
} from '@/lib/customer-location';
import { getCityFromIP } from '@/lib/geocode';
import { track } from '@/lib/analytics/track';
import { authorizationAtom } from '@/store/authorization-atom';
import {
  deliveryModeAtom,
  isNonServiceableAtom,
  detectedCityAtom,
  serviceableCityAtom,
} from '@/store/serviceability';
import { saveShoppingCityToProfile, normalizeCityClient } from '@/lib/shopping-city';
import { useAllCities } from '@/framework/location';
import CityPickerDialog from './city-picker-dialog';

/**
 * Shopping-City gate (mounted next to CitySync). The shopping city is a
 * MANDATORY, EXPLICIT choice: on first visit (no stored city) a blocking,
 * non-dismissable picker asks the shopper to select their Shopping City —
 * IP/GPS only power a one-tap SUGGESTION inside the picker and never decide
 * silently. Once chosen, the city is stored locally (+ pushed to the signed-in
 * profile) and every listing/cart/checkout flow keys off it.
 */
export default function LocationGate() {
  const setDeliveryMode = useSetAtom(deliveryModeAtom);
  const setIsNonServiceable = useSetAtom(isNonServiceableAtom);
  const setDetectedCityAtom = useSetAtom(detectedCityAtom);
  const setServiceableCity = useSetAtom(serviceableCityAtom);
  const [isAuthorized] = useAtom(authorizationAtom);

  const [mustPick, setMustPick] = useState(false);
  const [suggested, setSuggested] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current || typeof window === 'undefined') return;
    ranRef.current = true;

    const stored = getStoredCity();
    if (!stored) {
      // First visit — block until the shopper explicitly chooses.
      setMustPick(true);
    }

    // IP lookup is a SUGGESTION source only (pre-highlights inside the picker).
    getCityFromIP()
      .then((addr) => {
        if (!addr?.city) return;
        track('location_detected', { label: addr.city, meta: { source: 'ip' } });
        setDetectedCityAtom(addr.city);
        setSuggested(addr.city);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to the stored city being cleared elsewhere (e.g. sign-out cleanup).
  useEffect(() => {
    const onChange = () => {
      if (!getStoredCity()) setMustPick(true);
      else setMustPick(false);
    };
    window.addEventListener('pah-location-changed', onChange);
    return () => window.removeEventListener('pah-location-changed', onChange);
  }, []);

  // Migration guard: pre-redesign builds auto-set the city from IP, so a
  // returning shopper may carry a NON-SERVICEABLE stored city (e.g. Noida) —
  // which would silently scope the catalog to an empty list. Once the
  // serviceable list is known, a stored city outside it re-opens the blocking
  // picker. Fail-open: an empty/failed cities fetch never blocks anyone.
  const { data: serviceableCities } = useAllCities();
  useEffect(() => {
    if (!serviceableCities?.length) return;
    const stored = getStoredCity();
    if (!stored) return;
    const ok = serviceableCities.some(
      (c) => normalizeCityClient(c.name) === normalizeCityClient(stored),
    );
    if (!ok) setMustPick(true);
  }, [serviceableCities]);

  function pickCity(name: string) {
    track('city_changed', { label: name, meta: { source: 'first_visit_gate' } });
    setStoredCity(name);
    setStoredPincode(null);
    setDeliveryMode('standard');
    setIsNonServiceable(false);
    setServiceableCity(name);
    if (isAuthorized) saveShoppingCityToProfile(name);
    setMustPick(false);
  }

  return (
    <CityPickerDialog
      open={mustPick}
      blocking
      title="Select your shopping city"
      subtitle="Plants, pots and prices are specific to your city. You can change it anytime from the top of the page."
      suggestedCity={suggested}
      onClose={() => {}}
      onPick={pickCity}
    />
  );
}
