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
  // reaches dangerouslySetInnerHTML — stored-XSS defense.
  const html = sanitizeContent(children);
  const isCharacterLimitExceeded = children?.length > character;
  if (!isCharacterLimitExceeded) {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }
  // Collapsed: the whole text clamped to three lines, so every line is used (owner
  // 2026-10-14: a blank line sat above "Read more" — it was a <br /> here, and a
  // character cut that counted markup). Empty editor paragraphs would each cost a
  // clamped line, so they go.
  const collapsed = html.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '');
  return (
    <>
      <div
        className={expanded ? undefined : 'line-clamp-3'}
        dangerouslySetInnerHTML={{ __html: expanded ? html : collapsed }}
      />
      <button
        type="button"
        onClick={handleClick}
        className={`mt-1 inline-block font-bold text-accent ${btnClassName ? btnClassName : ''}`}
      >
        {t(!expanded ? compressText : expandedText)}
      </button>
    </>
  );
};
export default Truncate;
