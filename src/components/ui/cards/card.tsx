import cn from 'classnames';

const Card: React.FC<React.AllHTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-kraft-200 bg-light p-5 shadow-sm md:p-8',
        className,
      )}
      {...props}
    />
  );
};

export default Card;
