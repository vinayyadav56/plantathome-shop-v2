import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { sanitizeContent } from '@/lib/sanitize-content';

type TruncateProps = {
  expandedText?: string;
  compressText?: string;
  character: number;
  children: string;
  btnClassName?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

const Truncate: React.FC<TruncateProps> = ({
  children,
  expandedText = 'common:text-less',
  compressText = 'common:text-read-more',
  character = 150,
  btnClassName,
  onClick,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const toggleLines = () => {
    setExpanded((prev) => !prev);
  };
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (onClick) {
      return onClick(e);
    }
    toggleLines();
  }
  if (!children) return null;
  // Sanitize vendor/admin-supplied HTML (shop & author descriptions) before it
  // reaches dangerouslySetInnerHTML — stored-XSS defense. Sanitizing AFTER the
  // substring also repairs any tag cut mid-way by the truncation.
  const isCharacterLimitExceeded = children?.length > character;
  if (!isCharacterLimitExceeded) {
    return <div dangerouslySetInnerHTML={{ __html: sanitizeContent(children) }} />;
  }
  return (
    <>
      {!expanded ? (
        <div
          dangerouslySetInnerHTML={{
            __html: sanitizeContent(children?.substring(0, character) + '...'),
          }}
        />
      ) : (
        <div dangerouslySetInnerHTML={{ __html: sanitizeContent(children) }} />
      )}
      <br />
      <span>
        <button
          onClick={handleClick}
          className={`mt-1 inline-block font-bold text-accent ${
            btnClassName ? btnClassName : ''
          }`}
        >
          {t(!expanded ? compressText : expandedText)}
        </button>
      </span>
    </>
  );
};
export default Truncate;
