import { motion } from 'framer-motion';
import Link from 'next/link';
import SafeImage from '@/components/ui/safe-image';
import { Icon } from './icons';
import { productPlaceholder } from '@/lib/placeholders';
import type { Category } from '@/types';

/** Immersive category tile → links to the vertical's search filtered by category. */
export function StorefrontCategoryCard({
  category,
  typeSlug,
}: {
  category: Category;
  typeSlug: string;
}) {
  const image = category?.image?.original || category?.image?.thumbnail || productPlaceholder;
  // Dedicated category page (banner + products). typeSlug retained for callers/back-compat.
  const href = `/c/${category?.slug}`;
  const subtitle = (category as any)?.products_count
    ? `${(category as any).products_count} products`
    : 'Explore';

  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.3 }}>
      <Link
        href={href}
        className="group relative block h-44 overflow-hidden rounded-2xl sm:h-52"
      >
        {/* Rendered in a 2-col grid on phones and a ~5-6 across rail at lg+
            (sections/category-grid.tsx sets --rail-w). */}
        <SafeImage
          src={image}
          alt={category?.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 38vw, 20vw"
          quality={65}
          className="object-cover transition duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deep/85 via-deep/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading text-[15px] font-medium leading-tight text-white">
              {category?.name}
            </h3>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition group-hover:bg-gold">
              <Icon.arrow className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-0.5 text-[11px] font-medium text-white/75">{subtitle}</p>
        </div>
      </Link>
    </motion.div>
  );
}
