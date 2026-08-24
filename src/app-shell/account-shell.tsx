'use client';

import DashboardSidebar from '@/components/dashboard/sidebar';
import GeneralLayout from '@/components/layouts/_general';
import PrivateRoute from '@/lib/private-route';

/**
 * Persistent chrome for every account tab, hoisted into app/(account)/layout.tsx
 * so switching tabs swaps only the right-hand pane. Before this, each page body
 * rebuilt Header+Sidebar per route (ported getLayout pattern): the header
 * replayed its entrance animation on every tab and /my-packages used its own
 * full-bleed container, shifting the whole page. Chrome sits OUTSIDE
 * PrivateRoute on purpose — the login view / first `/me` resolve render between
 * header and footer instead of replacing them.
 */
export default function AccountShell({ children }: React.PropsWithChildren) {
  return (
    <GeneralLayout layout="general">
      <PrivateRoute>
        <div className="_dashboard g-light-a">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
            <div className="flex flex-col gap-6 lg:flex-row">
              <DashboardSidebar className="shrink-0 lg:w-[300px]" />
              <div className="min-w-0 flex-1">{children}</div>
            </div>
          </div>
        </div>
      </PrivateRoute>
    </GeneralLayout>
  );
}
