'use client';

import { HomeHero } from './HomeHero';
import { VerticalsBand } from './VerticalsBand';
import { CategoryRow, WhyPlants, SpringSaleBand, TrustRow, GiftingBand } from './sections';
import { ProductRail } from '@/components/products/ProductRail';
import { useVerticals } from '@/lib/hooks/useVerticals';

export function DesktopHome() {
  const { verticals } = useVerticals();
  const uuids = (key: string) => verticals.find((v) => v.key === key)?.categoryUuids ?? [];

  return (
    <>
      <HomeHero />
      <CategoryRow />
      <ProductRail eyebrow="Fresh from the nursery" title="Best-selling plants" categoryUuids={uuids('plants')} limit={8} viewAllHref="/plants" />
      <VerticalsBand />
      <ProductRail eyebrow="Tools & planters" title="Loved by gardeners" categoryUuids={uuids('tools')} limit={4} viewAllHref="/tools" />
      <WhyPlants />
      <SpringSaleBand />
      <ProductRail eyebrow="Farm-fresh" title="This week’s FarmBox" categoryUuids={uuids('farmbox')} limit={4} viewAllHref="/farmbox" />
      <GiftingBand />
      <TrustRow />
    </>
  );
}
