import cn from 'classnames';

const Card: React.FC<React.AllHTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-kraft-200 bg-light p-5 shadow-box md:p-6',
        className,
      )}
      {...props}
    />
  );
};

export default Card;
