// Renamed from `category-breadcrumb-card`: this is a row of category FILTER pills, not a
// breadcrumb — the old name kept surfacing in every search for breadcrumb code. The one page
// breadcrumb lives in components/ui/breadcrumb.tsx.
import { useRouter } from '@/compat/next-router';
import { Image } from '@/components/ui/image';
import CategoryImg from '@/assets/category-img.png';
import ArrowForward from '@/assets/arrow-forward.png';
import FilterPillButton from '@/components/ui/filter-pill-button';
import { useTranslation } from 'next-i18next';

interface FilterPillButtonProps {
  text: string;
  image?: any;
  onClick: () => void;
}

const BreadcrumbWithIndicator: React.FC<FilterPillButtonProps> = ({
  text,
  image,
  onClick,
}) => (
  <>
    <span className="relative h-[32px] w-[18px] flex-shrink-0">
      <Image
        className="h-full w-full"
        src={ArrowForward}
        alt=">"
        width={18}
        height={32}
      />
    </span>
    <FilterPillButton text={text} image={image} onClick={onClick} />
  </>
);

interface CategoryFilterPillsProps {
  categories: any;
}

const CategoryFilterPills: React.FC<CategoryFilterPillsProps> = ({
  categories,
}) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { pathname, query } = router;

  const resetCategoryClick = () => {
    const { category, ...rest } = query;
    router.push(
      {
        pathname,
        query: { ...rest },
      },
      undefined,
      {
        scroll: false,
      }
    );
  };

  const onCategoryClick = (slug: string) => {
    const { category, ...rest } = query;
    router.push(
      {
        pathname,
        query: { ...rest, category: slug },
      },
      undefined,
      {
        scroll: false,
      }
    );
  };

  return (
    <div className="flex items-center space-x-5 rtl:space-x-reverse">
      <FilterPillButton
        text={t('text-all-categories')}
        onClick={resetCategoryClick}
      />

      {categories?.map((category: any) => (
        <BreadcrumbWithIndicator
          key={category?.slug}
          text={category?.name}
          image={category?.image?.original}
          onClick={() => onCategoryClick(category?.slug)}
        />
      ))}
    </div>
  );
};

export default CategoryFilterPills;
