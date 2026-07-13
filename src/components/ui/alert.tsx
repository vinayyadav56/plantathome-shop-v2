import cn from 'classnames';
import { CloseIcon } from '@/components/icons/close-icon';
import { twMerge } from 'tailwind-merge';

type AlertProps = {
  message: string | null;
  variant?:
    | 'info'
    | 'warning'
    | 'error'
    | 'success'
    | 'infoOutline'
    | 'warningOutline'
    | 'errorOutline'
    | 'successOutline';
  closeable?: boolean;
  onClose?: React.Dispatch<React.SetStateAction<any>>;
  className?: string;
  children?: React.ReactNode;
  childClassName?: string;
};

// Brand-token palette: sage/forest for positive states, gold for warnings,
// clay for errors — matches the storefront design language.
const variantClasses = {
  info: 'bg-sage-100 text-forest-700',
  warning: 'bg-[#F7EFD8] text-[#8a6a24]',
  error: 'bg-[#F6E3DC] text-[#a8542f]',
  success: 'bg-sage-100 text-forest-700',
  infoOutline: 'border border-sage-300 text-forest-700',
  warningOutline: 'border border-[#DBC98F] text-[#8a6a24]',
  errorOutline: 'border border-[#E0A989] text-[#a8542f]',
  successOutline: 'border border-sage-300 text-forest-700',
};

const Alert: React.FC<AlertProps> = ({
  message,
  closeable = false,
  variant = 'info',
  className,
  onClose,
  children,
  childClassName,
}) => {
  if (!message) return null;
  return (
    <div
      className={twMerge(
        cn(
          'relative flex items-center justify-between rounded py-4 px-5 shadow-sm',
          variantClasses[variant],
          className
        )
      )}
      role="alert"
    >
      <div className={twMerge(cn(childClassName))}>
        <p className="text-sm">{message}</p>
        {children}
      </div>
      {closeable && (
        <button
          data-dismiss="alert"
          aria-label="Close"
          onClick={onClose}
          title="Close alert"
          className="absolute top-1/2 -mt-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-red-500 transition-colors duration-200 hover:bg-gray-300 hover:bg-opacity-25 focus:bg-gray-300 focus:bg-opacity-25 focus:outline-0 ltr:right-2 ltr:-mr-0.5 rtl:left-2 rtl:-ml-0.5"
        >
          <span aria-hidden="true">
            <CloseIcon className="h-3 w-3" />
          </span>
        </button>
      )}
    </div>
  );
};

export default Alert;
