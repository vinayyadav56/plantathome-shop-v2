import Header from './header';
import Footer from './footer';
import dynamic from 'next/dynamic';

const GreenPicker = dynamic(() => import('@/components/storefront/green-picker'), { ssr: false });

const MobileNavigation = dynamic(
  () => import('@/components/layouts/mobile-navigation'),
  {
    ssr: false,
  }
);
export default function GeneralLayout({
  children,
  layout,
}: React.PropsWithChildren<{ layout?: string }>) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-100 transition-colors duration-150">
      <Header layout={layout} />
      {children}
      <Footer />
      <GreenPicker />
      <MobileNavigation />
    </div>
  );
}

export const getGeneralLayout = (page: React.ReactElement) => (
  <GeneralLayout layout={(page.props as any).layout}>
    {page}
    <MobileNavigation />
  </GeneralLayout>
);
