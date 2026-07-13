import cn from 'classnames';
import { useTranslation } from 'next-i18next';

interface Props {
  text?: string;
  className?: string;
}

/* Branded empty state — same plant-pot glyph as EmptyProducts, replacing the
   legacy Pickbazar "cat on a shelf" illustration. Kept prop-compatible with the
   old component (used by offers, search, wishlists, shops…). */
const NotFound: React.FC<Props> = ({ className, text }) => {
  const { t } = useTranslation();
  return (
    <div className={cn('flex flex-col items-center py-10', className)}>
      <div className="relative grid h-36 w-36 place-items-center rounded-full bg-[radial-gradient(circle_at_50%_35%,#EAF4E6,#F6FAF7)] sm:h-44 sm:w-44">
        <svg viewBox="0 0 120 120" fill="none" className="h-24 w-24 sm:h-28 sm:w-28" aria-hidden>
          <path d="M36 74h48l-5 28a6 6 0 0 1-6 5H47a6 6 0 0 1-6-5L36 74Z" fill="#E9E3D6" stroke="#C9B79A" strokeWidth="2" />
          <rect x="33" y="68" width="54" height="10" rx="3" fill="#D7C9AE" stroke="#C9B79A" strokeWidth="2" />
          <path d="M60 70c0-16-8-26-22-30 0 15 7 25 22 30Z" fill="#6E8B4A" />
          <path d="M60 70c0-20 9-32 26-36 0 18-9 30-26 36Z" fill="#4E8B31" />
          <path d="M60 70c0-12-2-24 0-36 4 10 5 24 0 36Z" fill="#35C46A" />
          <path d="M60 36v34" stroke="#2E5E2A" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      {text && (
        <h3 className="my-7 w-full text-center font-pahserif text-xl font-semibold text-forest-900">
          {t(text)}
        </h3>
      )}
    </div>
  );
};

export default NotFound;
