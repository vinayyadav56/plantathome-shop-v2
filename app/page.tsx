import { DesktopHome } from '@/components/home/DesktopHome';
import { MobileHome } from '@/components/home/MobileHome';

export default function HomePage() {
  return (
    <>
      <div className="md:hidden">
        <MobileHome />
      </div>
      <div className="hidden md:block">
        <DesktopHome />
      </div>
    </>
  );
}
