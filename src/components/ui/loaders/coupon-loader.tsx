import ContentLoader from 'react-content-loader';
import { skeletonTint } from '@/components/ui/loaders/skeleton-tint';

const CouponLoader = (props: any) => (
  <ContentLoader
    speed={2}
    width={'100%'}
    height={'100%'}
    viewBox="0 0 480 450"
    {...skeletonTint}
    {...props}
  >
    <rect x="0" y="0" rx="6" ry="6" width="100%" height="340" />
    <rect x="10%" y="350" rx="6" ry="6" width="80%" height="70" />
  </ContentLoader>
);

export default CouponLoader;
