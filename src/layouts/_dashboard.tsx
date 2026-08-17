import DashboardSidebar from '@/components/dashboard/sidebar';
import GeneralLayout from '@/components/layouts/_general';
import classNames from 'classnames';

type Props = {
  layout?: string;
  className?: string;
};

export default function DashboardLayout({
  children,
  className,
}: React.PropsWithChildren<Props>) {
  return (
    <GeneralLayout layout="general">
      <div className="_dashboard g-light-a">
        <div className={classNames('mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12', className)}>
          <div className="flex flex-col gap-6 lg:flex-row">
            <DashboardSidebar className="shrink-0 lg:w-[300px]" />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </div>
      </div>
    </GeneralLayout>
  );
}
