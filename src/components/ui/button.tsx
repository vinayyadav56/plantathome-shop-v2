import { BrandSpinner } from '@/components/ui/plant-loader';
import cn from 'classnames';
import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant?: 'normal' | 'outline' | 'custom' | 'formPrimary' | 'formSecondary';
  size?: 'big' | 'medium' | 'small';
  active?: boolean;
  loading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}
const classes = {
  root: 'inline-flex items-center justify-center shrink-0 font-semibold leading-none rounded outline-none transition duration-300 ease-in-out focus:outline-0 focus:shadow focus:ring-1 focus:ring-ds-accent',
  // Solid accent button — follows the Design System accent color scheme.
  normal:
    'bg-ds-accent hover:brightness-110 text-white border border-transparent',
  custom: 'border border-transparent',
  outline:
    'border border-border-400 bg-transparent text-body hover:text-light hover:bg-ds-accent-ink hover:border-ds-accent-ink',
  // The FORM design system (auth modal spec, applied to every form on the site):
  // 52px, 14px radius, solid botanical green / white secondary. These variants emit
  // data-variant="formPrimary|formSecondary", so the global pill override
  // (button[data-variant="normal"] in plantathome-overrides.css) can never touch them —
  // that override is exactly why per-form colours silently stopped applying.
  formPrimary:
    'h-[52px] rounded-[14px] bg-ds-btn text-white text-base font-semibold hover:bg-ds-btn-hover focus-visible:ring-2 focus-visible:ring-ds-accent focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-body',
  formSecondary:
    'h-[52px] rounded-[14px] border border-border-base bg-white text-base font-semibold text-heading hover:border-ds-btn hover:text-ds-btn focus-visible:ring-2 focus-visible:ring-ds-accent focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:text-muted',
  disabled:
    'border border-border-base bg-gray-300 hover:bg-gray-300 border-border-400 text-body cursor-not-allowed',
  disabledOutline: 'border border-border-base text-muted cursor-not-allowed',
  small: 'px-3 py-0 h-9 text-sm h-10',
  medium: 'px-5 py-0 h-12',
  big: 'px-10 py-0 h-14',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const {
      className,
      variant = 'normal',
      size = 'medium',
      children,
      active,
      loading = false,
      disabled = false,
      ...rest
    } = props;
    const classesName = cn(
      classes.root,
      {
        [classes.normal]: !disabled && variant === 'normal',
        [classes.disabled]: disabled && variant === 'normal',
        [classes.outline]: !disabled && variant === 'outline',
        [classes.disabledOutline]: disabled && variant === 'outline',
        [classes.formPrimary]: variant === 'formPrimary',
        [classes.formSecondary]: variant === 'formSecondary',
        [classes.small]: size === 'small' && !variant.startsWith('form'),
        [classes.medium]: size === 'medium' && !variant.startsWith('form'),
        [classes.big]: size === 'big' && !variant.startsWith('form'),
        ['px-5']: variant.startsWith('form'),
      },
      className
    );

    return (
      <button
        aria-pressed={active}
        data-variant={variant}
        ref={ref}
        className={classesName}
        disabled={disabled}
        {...rest}
      >
        {children}
        {/* One shared mark for all ~49 loading buttons. BrandSpinner inherits
            currentColor, which is why the old hardcoded '#ffffff' vs
            'currentColor' branch is gone — the button's own text colour is
            already correct on every variant. */}
        {loading && <BrandSpinner className="h-4 w-4 ltr:ml-2 rtl:mr-2" />}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
