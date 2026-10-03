'use client';
/**
 * One shell for every authentication surface (auth redesign spec §1-§3).
 *
 * Login, Sign Up, Phone OTP and Forgot all render inside this card so they are
 * literally two states of the same component, not four separately styled
 * screens. The modal views AND /signin both use it; /signin passes
 * `inline` so the card chrome (radius/shadow/close) comes from the page
 * instead.
 */
import { X } from '@/components/ui/icon';

export function AuthTabs({
  active,
  onLogin,
  onRegister,
}: {
  active: 'login' | 'register';
  onLogin: () => void;
  onRegister: () => void;
}) {
  const tab = (key: 'login' | 'register', label: string, onClick: () => void) => (
    <button
      type="button"
      role="tab"
      aria-selected={active === key}
      onClick={onClick}
      className={`relative -mb-px rounded-sm pb-3 text-[16px] transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-offset-2 ${
        active === key
          ? 'font-bold text-forest-800 after:bg-forest-700'
          : 'font-medium text-stone-400 after:bg-transparent hover:text-forest-700'
      }`}
    >
      {label}
    </button>
  );
  return (
    <div role="tablist" aria-label="Login or sign up" className="mb-7 flex gap-8 border-b border-stone-200">
      {tab('login', 'Login', onLogin)}
      {tab('register', 'Sign Up', onRegister)}
    </div>
  );
}

export default function AuthShell({
  tab,
  onLogin,
  onRegister,
  onClose,
  title,
  subtitle,
  children,
}: {
  /** Which tab is active; omit to hide the tab row (OTP / forgot screens). */
  tab?: 'login' | 'register';
  onLogin?: () => void;
  onRegister?: () => void;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex max-h-dvh min-h-dvh w-screen flex-col overflow-y-auto bg-white px-5 py-6 sm:px-9 sm:py-8 md:min-h-0 md:h-auto md:max-h-[92dvh] md:w-[540px] md:max-w-[92vw] md:rounded-2xl md:shadow-box">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-stone-100 text-forest-900 transition hover:bg-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600"
        >
          <X size={18} aria-hidden />
        </button>
      )}
      {tab && onLogin && onRegister && (
        <AuthTabs active={tab} onLogin={onLogin} onRegister={onRegister} />
      )}
      {title && (
        <h1 className="text-center font-heading text-[30px] font-bold leading-tight text-forest-900 sm:text-[36px]">
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="mt-2 mb-8 text-center text-[16px] text-stone-500 sm:text-[17px]">{subtitle}</p>
      )}
      {children}
    </div>
  );
}
