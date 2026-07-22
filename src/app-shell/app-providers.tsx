'use client';

/**
 * Client provider tree — full App Router port of V1 _app.tsx (minus
 * next-i18next appWithTranslation and next-auth SessionProvider, both shimmed).
 * The RSC route tree arrives as {children} (stays server-rendered).
 *
 * V1 per-page concerns handled elsewhere:
 *  - getLayout        → route groups / page bodies render their own layout
 *  - authenticationRequired → <PrivateRoute> wrapped inside gated page bodies
 *  - standalone       → those pages simply don't use the Maintenance gate
 */

import * as React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { SearchProvider } from '@/components/ui/search/search.context';
import { ModalProvider } from '@/components/ui/modal/modal.context';
import ManagedModal from '@/components/ui/modal/managed-modal';
import ManagedDrawer from '@/components/ui/drawer/managed-drawer';
import FirstVisitLanguageModal from '@/components/ui/first-visit-language-modal';
import DefaultSeo from '@/components/seo/default-seo';
import { CartProvider } from '@/store/quick-cart/cart.context';
import SocialLogin from '@/components/auth/social-login';
import Maintenance from '@/components/maintenance/layout';
import { NotificationProvider } from '@/context/notify-content';
import CitySync from '@/components/layouts/city-sync';
import GlobalFetchBar from '@/components/ui/global-fetch-bar';
import LocationGate from '@/components/location/location-gate';
import TrackingBridge from '@/lib/analytics/tracking-bridge';
import DesignSystemApplier from '@/lib/design-system-applier';
// Static import (no next/dynamic — hydration-loop trap); the component itself
// gates on mounted-state + staging/localhost hostname, so prod renders nothing.
import AgentationToolbar from '@/components/dev/agentation-toolbar';

// STATIC import — V1's _app.tsx imported ToastContainer statically; the port's
// dynamic() made it the last always-rendered React.lazy in the shell, which is
// the known React-19 hydration-suspension livelock pattern (resolveLazy pending
// → sync re-render per microtask → starves the very stream it waits on).
import { ToastContainer, Bounce } from 'react-toastify';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      }),
  );
  return (
    <div dir="ltr">
      <QueryClientProvider client={queryClient}>
        <SearchProvider>
          <ModalProvider>
            <CartProvider>
              <>
                <GlobalFetchBar />
                {/* Applies the design system + the single website font (Inter). */}
                <DesignSystemApplier />
                <TrackingBridge />
                <DefaultSeo />
                <CitySync />
                <LocationGate />
                <Maintenance>
                  <NotificationProvider>{children}</NotificationProvider>
                </Maintenance>
                <ManagedModal />
                <ManagedDrawer />
                {/* React 19 removed defaultProps on function/forwardRef components,
                    which react-toastify v9 relies on — most critically
                    `transition: Bounce`. Without it every toast rendered an
                    <undefined> element and crashed the whole app ("Application
                    error") the moment any toast fired. Every former defaultProp a
                    toast renders with must be passed EXPLICITLY here. */}
                <ToastContainer
                  position="top-center"
                  transition={Bounce}
                  autoClose={3000}
                  newestOnTop
                  theme="light"
                  closeOnClick
                  pauseOnHover
                  pauseOnFocusLoss
                  draggable
                  draggablePercent={80}
                  draggableDirection="x"
                  role="alert"
                  closeButton={({ closeToast }: any) => (
                    <button
                      type="button"
                      className="Toastify__close-button Toastify__close-button--light"
                      aria-label="close"
                      onClick={closeToast}
                    >
                      <svg aria-hidden="true" viewBox="0 0 14 16" width="14" height="16" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M7.71 8.23l3.75 3.75-1.48 1.48-3.75-3.75-3.75 3.75L1 11.98l3.75-3.75L1 4.48 2.48 3l3.75 3.75L9.98 3l1.48 1.48-3.75 3.75z"
                        />
                      </svg>
                    </button>
                  )}
                />
                <SocialLogin />
                <FirstVisitLanguageModal />
                <AgentationToolbar />
              </>
            </CartProvider>
          </ModalProvider>
        </SearchProvider>
      </QueryClientProvider>
    </div>
  );
}
