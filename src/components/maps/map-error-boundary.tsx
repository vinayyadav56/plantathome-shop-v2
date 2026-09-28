'use client';
import { Component, type ReactNode } from 'react';

/**
 * Last line of defence for the Google Maps widgets: a Maps failure (library not authorized on
 * the key, SDK API change, bad coordinate data) must degrade to the fallback UI — never
 * white-screen the whole form.
 *
 * Ported verbatim from the admin (admin/rest/src/components/maps/map-error-boundary.tsx), which
 * has had this since its own Maps incident. The storefront never got it, so on the checkout path
 * a Maps outage took the entire address form down with it — and the classic Places <Autocomplete>
 * throws SYNCHRONOUSLY in componentDidMount when `google.maps.places` fails to authorize, which
 * React surfaces as a page-level "Application error". That is a checkout-blocking failure caused
 * by a third party we do not control.
 *
 * 'use client' + a class component: error boundaries have no hook equivalent.
 */
export default class MapErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('[maps] widget crashed, degrading to manual entry:', error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
