'use client';

import DashboardSidebar from '@/components/dashboard/sidebar';
import GeneralLayout from '@/components/layouts/_general';
import { BrandSpinner } from '@/components/ui/plant-loader';
import PrivateRoute from '@/lib/private-route';

/**
 * Persistent chrome for every account tab, hoisted into app/(account)/layout.tsx
 * so switching tabs swaps only the right-hand pane. Before this, each page body
 * rebuilt Header+Sidebar per route (ported getLayout pattern): the header
 * replayed its entrance animation on every tab and /my-packages used its own
 * full-bleed container, shifting the whole page. Chrome sits OUTSIDE
 * PrivateRoute on purpose — the login view / first `/me` resolve render between
 * header and footer instead of replacing them.
 *
 * Container = the header bar's own box (md:px-5 outside, max-w-[1360px] inside)
 * so the account cards line up with the header from 768px up. Flat light
 * background and a plain ring loader: the account area carries no decoration
 * (owner brief 2026-10-03 — "less decoration, more design").
 */
export default function AccountShell({ children }: React.PropsWithChildren) {
  return (
    <GeneralLayout layout="general">
      <PrivateRoute
        fallback={
          <div className="grid min-h-[60vh] place-items-center bg-sage-50">
            <BrandSpinner className="h-6 w-6 text-forest-700" />
          </div>
        }
      >
        <div className="pah-account bg-sage-50">
          <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-5 lg:flex-row lg:items-start lg:py-10">
            <DashboardSidebar className="min-w-0 lg:w-[264px] lg:shrink-0" />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </div>
      </PrivateRoute>
    </GeneralLayout>
  );
}
