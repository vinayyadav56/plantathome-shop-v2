import Header from './header';
import Footer from './footer';
import dynamic from 'next/dynamic';

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
      <MobileNavigation />
    </div>
  );
}

// GeneralLayout already mounts MobileNavigation. Passing a second one as a
// child rendered TWO fixed bottom bars on every page using this layout — and
// both carry framer-motion's layoutId="pah-nav-pill", so the shared-layout
// animation had two elements claiming one id and the active pill could jump
// between the stacked bars.
export const getGeneralLayout = (page: React.ReactElement) => (
  <GeneralLayout layout={(page.props as any).layout}>{page}</GeneralLayout>
);
