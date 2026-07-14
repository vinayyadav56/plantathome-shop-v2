import { useType } from '@/framework/type';
import dynamic from 'next/dynamic';
import ErrorMessage from '@/components/ui/error-message';
import BannerShort from '@/components/banners/banner-short';

const BannerWithSearch = dynamic(
  () => import('@/components/banners/banner-with-search')
);

const BannerWithoutSlider = dynamic(
  () => import('@/components/banners/banner-without-slider')
);
const BannerWithPagination = dynamic(
  () => import('@/components/banners/banner-with-pagination')
);
const MAP_BANNER_TO_GROUP: Record<string, any> = {
  classic: BannerWithSearch,
  modern: BannerShort,
  minimal: BannerWithoutSlider,
  standard: BannerWithSearch,
  compact: BannerWithPagination,
  default: BannerWithSearch,
};

const Banner: React.FC<{ layout: string; variables: any }> = ({
  layout,
  variables,
}) => {
  const { type, error } = useType(variables.type);
  if (error) return <ErrorMessage message={error.message} />;
  const Component = MAP_BANNER_TO_GROUP[layout];
  return (
    <Component banners={type?.banners} layout={layout} slug={type?.slug} />
  );
};

export default Banner;
