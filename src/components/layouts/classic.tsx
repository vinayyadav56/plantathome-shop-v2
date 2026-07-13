import Banner from '@/components/banners/banner';
import Categories from '@/components/categories/categories';
import { Element } from 'react-scroll';
import FilterBar from './filter-bar';
import ProductGridHome from '@/components/products/grids/home';
import PaHero from '@/components/pa-hero';
import PaShopByCategory from '@/components/pa-shop-by-category';
import PaFeatures from '@/components/pa-features';
import PaScienceBenefits from '@/components/pa-science-benefits';
import PaStats from '@/components/pa-stats';
import PaCareHub from '@/components/pa-care-hub';
import PaTestimonials from '@/components/pa-testimonials';
import type { HomePageProps } from '@/types';

export default function ClassicLayout({ variables }: HomePageProps) {
  return (
    <>
      {/* 1. Full-width premium hero */}
      <PaHero />

      {/* 2. Trust strip */}
      <PaFeatures />

      {/* 3. Shop by category grid */}
      <PaShopByCategory variables={variables.categories} />

      {/* 4. Why every home needs plants — science benefits */}
      <PaScienceBenefits />

      {/* 5. Why choose us stats */}
      <PaStats />

      {/* 6. Plant care learning hub */}
      <PaCareHub />

      {/* 7. Testimonials */}
      <PaTestimonials />

      {/* 8. Product grid with sidebar categories */}
      <FilterBar variables={variables.categories} />
      <Element
        name="grid"
        className="flex border-t border-solid border-border-200 border-opacity-70"
      >
        <Categories layout="classic" variables={variables.categories} />
        <ProductGridHome
          className="px-4 pt-3.5 pb-16 lg:p-6 xl:p-8"
          variables={variables.products}
        />
      </Element>
    </>
  );
}
