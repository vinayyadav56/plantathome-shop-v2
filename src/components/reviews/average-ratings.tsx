import type { RatingCount } from '@/types';
import { Star } from '@/components/ui/icon';

type AverageRatingsProps = {
  ratings?: number;
  totalReviews?: number;
  ratingCount?: RatingCount[];
  className?: string;
};

/* Gold star — same glyph + #FDBA12 fill as the product cards */
const GoldStar = ({
  filled = true,
  size = 16,
}: {
  filled?: boolean;
  size?: 12 | 16;
}) => (
  <Star
    size={size}
    fill="currentColor"
    strokeWidth={0}
    style={{ color: filled ? '#FDBA12' : '#E8E4D8' }}
    aria-hidden
  />
);

const STARS = [5, 4, 3, 2, 1] as const;

const AverageRatings: React.FC<AverageRatingsProps> = ({
  ratings = 0,
  totalReviews = 0,
  ratingCount,
  className = '',
}) => {
  // Products with no rating breakdown simply skip the summary block.
  if (!ratingCount) return null;

  const ratingVal = Number(ratings) || 0;
  const rows = STARS.map((star) => ({
    star,
    total: Number(
      ratingCount.find((item) => Number(item.rating) === star)?.total ?? 0,
    ),
  }));

  return (
    <div
      className={`flex w-full flex-col gap-6 sm:flex-row sm:items-center sm:gap-10 ${className}`}
    >
      {/* headline number + stars */}
      <div className="shrink-0">
        <div className="flex items-end gap-2">
          <span className="text-[44px] font-bold leading-none text-[#184A31]">
            {ratingVal.toFixed(1)}
          </span>
          <span className="pb-1 text-[15px] font-semibold text-[#8A8A8A]">
            / 5
          </span>
        </div>
        <div className="mt-2.5 flex items-center gap-1">
          {STARS.map((star, index) => (
            <GoldStar key={star} filled={index < Math.round(ratingVal)} />
          ))}
        </div>
        <p className="mt-2 text-[14px] leading-none text-[#8A8A8A]">
          {totalReviews.toLocaleString('en-IN')}{' '}
          {totalReviews === 1 ? 'rating' : 'ratings'}
        </p>
      </div>

      {/* per-star distribution — forest fill on sage track */}
      <div className="w-full min-w-0 flex-1 space-y-2.5">
        {rows.map(({ star, total }) => (
          <div key={star} className="flex items-center gap-3">
            <span className="flex w-8 shrink-0 items-center gap-1 text-[13px] font-semibold leading-none text-[#184A31]">
              {star}
              <GoldStar size={12} />
            </span>
            <div className="relative h-2 min-w-[120px] flex-1 overflow-hidden rounded-full bg-[#F3F8EC]">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#14532D]"
                style={{
                  width: `${
                    totalReviews > 0
                      ? Math.min(100, (total / totalReviews) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
            <span className="w-9 shrink-0 text-right text-[13px] leading-none text-[#8A8A8A]">
              {total.toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AverageRatings;
