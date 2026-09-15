import cn from 'classnames';
import { useTranslation } from 'next-i18next';
import PottedPlantIllustration from '@/components/ui/illustration/potted-plant';

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
        <PottedPlantIllustration />
      </div>
      {text && (
        <h3 className="my-7 w-full text-center font-pahserif text-xl font-medium text-forest-900">
          {t(text)}
        </h3>
      )}
    </div>
  );
};

export default NotFound;
