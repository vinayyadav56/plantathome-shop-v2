'use client';

import DashboardSidebar from '@/components/dashboard/sidebar';
import GeneralLayout from '@/components/layouts/_general';
import classNames from 'classnames';
import { usePathname } from 'next/navigation';

type Props = {
  layout?: string;
  className?: string;
};

export default function DashboardLayout({
  children,
  className,
}: React.PropsWithChildren<Props>) {
  const pathname = usePathname();

  return (
    <GeneralLayout layout="general">
      <div className="_dashboard g-light-a">
        <div className={classNames('mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12', className)}>
          <div className="flex flex-col gap-6 lg:flex-row">
            <DashboardSidebar className="shrink-0 lg:w-[300px]" />
            {/* Keyed on the route so only the RIGHT pane animates: the nav stays put and the
                content fades in, which is the behaviour the sidebar jumping used to hide.
                A true cross-fade would need the sidebar to stop remounting — that means an
                app/(account)/layout.tsx route group, which is a bigger structural change. */}
            <div key={pathname} className="min-w-0 flex-1 motion-safe:animate-[pah-fade-in_.22s_ease-out]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </GeneralLayout>
  );
}
