import { useTranslation } from 'next-i18next';
import ReviewCard from '@/components/reviews/review-card';
import Pagination from '@/components/ui/pagination';
import { useEffect, useState } from 'react';
import { useReviews } from '@/framework/review';
import AverageRatings from './average-ratings';
import Sorting from './sorting';
import StarFilter from './star-filter';
import { useRouter } from '@/compat/next-router';
import { useUser } from '@/framework/user';
import { goToSignin } from '@/lib/go-to-signin';
import Link from '@/components/ui/link';
import { Routes } from '@/config/routes';
import isEmpty from 'lodash/isEmpty';
import Spinner from '@/components/ui/loaders/spinner/spinner';

type ProductReviewsProps = {
  className?: any;
  productId: string;
  productType?: string;
  ratings?: number;
  totalReviews?: number;
  ratingCount?: Array<{ rating: number; total: number }>;
};

/* ─── inline line icons (shared LineIcon has no pen glyph; local like the
       product card's own GoldStar/TruckIcon) ──────────────────────────── */
const PenIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className="h-[18px] w-[18px] shrink-0"
  >
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className="h-4 w-4 shrink-0"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const LeafGlyph = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className="h-10 w-10"
  >
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6" />
  </svg>
);

const CARD_SHADOW =
  'shadow-[0_4px_10px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,0,0,0.08)]';

const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  ratings = 0,
  totalReviews = 0,
  ratingCount,
}) => {
  const router = useRouter();
  const { query } = router;
  const { t } = useTranslation('common');
  const { isAuthorized } = useUser();
  const [page, setPage] = useState(1);
  // Auth lives in a cookie-backed atom (client-only) — branch markup on it
  // only after mount so server HTML and first client paint stay identical.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Read ONLY the params this query understands, as scalars — spreading the
  // whole router.query re-fired the query (and reset the page) on unrelated
  // URL params, and the object identity broke the effect's deps.
  const rating = query?.rating ? String(query.rating) : undefined;
  const orderBy = query?.orderBy ? String(query.orderBy) : undefined;
  const sortedBy = query?.sortedBy ? String(query.sortedBy) : undefined;

  const { reviews, isLoading, paginatorInfo } = useReviews({
    product_id: productId,
    limit: 5,
    page,
    ...(rating && { rating }),
    ...(orderBy && { orderBy }),
    ...(sortedBy && { sortedBy }),
  });

  useEffect(() => {
    setPage(1);
  }, [rating, orderBy, sortedBy]);

  function onPagination(current: number) {
    setPage(current);
  }

  function handleWriteReview() {
    if (isAuthorized) {
      router.push(Routes.orders);
      return;
    }
    goToSignin();
  }

  if (isLoading && isEmpty(reviews)) {
    return (
      <section
        id="reviews"
        className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-10 sm:px-6 lg:px-10"
      >
        <div
          className={`flex items-center justify-center rounded-[22px] border border-[#ECECEC] bg-white py-20 ${CARD_SHADOW}`}
        >
          <Spinner simple className="h-9 w-9" />
        </div>
      </section>
    );
  }

  const total =
    //@ts-ignore
    paginatorInfo?.total ?? 0;
  const showOrdersLink = mounted && isAuthorized;

  return (
    <section
      id="reviews"
      className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-10 sm:px-6 lg:px-10"
    >
      <div
        className={`overflow-hidden rounded-[22px] border border-[#ECECEC] bg-white ${CARD_SHADOW}`}
      >
        {/* header — title + write-review affordance, ratings summary beside */}
        <div className="flex flex-col gap-8 border-b border-[#ECECEC] p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <div className="shrink-0">
            <p className="text-[12px] font-bold uppercase leading-none tracking-[0.14em] text-[#B58E39]">
              Customer voices
            </p>
            <h2 className="mt-2 text-[15px] font-medium uppercase leading-tight tracking-[0.08em] text-[#184A31]">
              {t('text-product-reviews')}{' '}
              <span className="font-semibold text-[#8A8A8A]">
                ({total.toLocaleString('en-IN')})
              </span>
            </h2>
            <div className="mt-5">
              {showOrdersLink ? (
                <Link
                  href={Routes.orders}
                  className="inline-flex items-center gap-2.5 rounded-[12px] bg-[#F3F8EC] px-4 py-3 text-[14px] font-semibold leading-snug text-[#24693E] transition hover:bg-[#E9F2DD]"
                >
                  Bought this plant? Review it from your orders.
                  <ArrowRightIcon />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleWriteReview}
                  className="inline-flex h-12 items-center gap-2.5 rounded-[14px] bg-[#14532D] px-6 text-[15px] font-semibold text-white transition duration-300 hover:bg-[#0D4324] focus:outline-0"
                >
                  <PenIcon />
                  Write a review
                </button>
              )}
            </div>
          </div>
          {totalReviews > 0 && (
            <AverageRatings
              ratings={ratings}
              totalReviews={totalReviews}
              ratingCount={ratingCount}
              className="lg:max-w-[460px]"
            />
          )}
        </div>

        {/* toolbar — existing sort + star-filter controls */}
        <div className="flex flex-col gap-3 border-b border-[#ECECEC] px-6 py-4 sm:px-8 md:flex-row md:items-center md:justify-between">
          <Sorting />
          <StarFilter />
        </div>

        {/* review list */}
        {!isEmpty(reviews) ? (
          <div className="px-6 sm:px-8">
            {reviews?.map((review: any) => (
              <ReviewCard key={`review-no-${review?.id}`} review={review} />
            ))}

            {/* Pagination */}
            {paginatorInfo && (
              <div className="flex items-center justify-between border-t border-[#ECECEC] py-4">
                <div className="text-[13px] text-[#8A8A8A]">
                  {t('text-page')}{' '}
                  {
                    //@ts-ignore
                    paginatorInfo.currentPage
                  }{' '}
                  {t('text-of')}{' '}
                  {Math.ceil(
                    //@ts-ignore
                    paginatorInfo.total / paginatorInfo.perPage,
                  )}
                </div>

                <div className="mb-2 flex items-center">
                  <Pagination
                    total={
                      //@ts-ignore
                      paginatorInfo.total
                    }
                    current={
                      //@ts-ignore
                      paginatorInfo.currentPage
                    }
                    pageSize={
                      //@ts-ignore
                      paginatorInfo.perPage
                    }
                    onChange={onPagination}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="text-[#24693E]/35">
              <LeafGlyph />
            </span>
            <h3 className="mt-4 text-[17px] font-medium text-[#184A31]">
              {t('text-no-reviews-found')}
            </h3>
            <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-[#8A8A8A]">
              Be the first to share how this plant settled into your home.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductReviews;
