import { useRouter } from '@/compat/next-router';
import { goToSignin } from '@/lib/go-to-signin';
import { motion } from 'framer-motion';
import { NavbarIcon } from '@/components/icons/navbar-icon';
import { HomeIcon } from '@/components/icons/home-icon';
import { ShoppingBagIcon } from '@/components/icons/shopping-bag-icon';
import { UserIcon } from '@/components/icons/user-icon';
import { useTranslation } from 'next-i18next';
import { useCart } from '@/store/quick-cart/cart.context';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { useAtom } from 'jotai';
import { drawerAtom } from '@/store/drawer-atom';
import { authorizationAtom } from '@/store/authorization-atom';
import { useIsRTL } from '@/lib/locals';

export default function MobileNavigation({
  children,
}: React.PropsWithChildren<{}>) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { openModal } = useModalAction();
  const [isAuthorize] = useAtom(authorizationAtom);
  const [_, setDrawerView] = useAtom(drawerAtom);
  const { isRTL } = useIsRTL();

  const { totalUniqueItems } = useCart();

  function handleSidebar(view: string) {
    setDrawerView({ display: true, view });
  }

  function handleJoin() {
    return goToSignin();
  }

  return (
    <nav className="visible fixed bottom-0 z-10 flex h-14 w-full justify-around border-t border-forest-900/10 bg-white/90 py-1.5 px-2 backdrop-blur-xl ltr:left-0 rtl:right-0 md:hidden">
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => handleSidebar('MAIN_MENU_VIEW')}
        className="flex h-full items-center justify-center p-2 text-forest-800 focus:text-[#1B6B50] focus:outline-0"
      >
        <span className="sr-only">{t('text-burger-menu')}</span>
        <NavbarIcon className={`${isRTL && 'rotate-180 transform'}`} />
      </motion.button>

      {children}

      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => router.push('/')}
        className="flex h-full items-center justify-center p-2 text-forest-800 focus:text-[#1B6B50] focus:outline-0"
      >
        <span className="sr-only">{t('text-home')}</span>
        <HomeIcon />
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => handleSidebar('cart')}
        className="product-cart relative flex h-full items-center justify-center p-2 text-forest-800 focus:text-[#1B6B50] focus:outline-0"
      >
        <span className="sr-only">{t('text-cart')}</span>
        <ShoppingBagIcon />
        {totalUniqueItems > 0 && (
          <span className="absolute top-0 mt-0.5 rounded-full bg-[#0D3B2E] py-1 px-1.5 text-[11px] font-semibold leading-none text-white ltr:right-0 ltr:-mr-0.5 rtl:left-0 rtl:-ml-0.5">
            {totalUniqueItems}
          </span>
        )}
      </motion.button>

      {isAuthorize ? (
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => handleSidebar('AUTH_MENU_VIEW')}
          className="flex h-full items-center justify-center p-2 text-forest-800 focus:text-[#1B6B50] focus:outline-0"
        >
          <span className="sr-only">{t('text-user')}</span>
          <UserIcon />
        </motion.button>
      ) : (
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handleJoin}
          className="flex h-full items-center justify-center p-2 text-forest-800 focus:text-[#1B6B50] focus:outline-0"
        >
          <span className="sr-only">{t('text-user')}</span>
          <UserIcon />
        </motion.button>
      )}
    </nav>
  );
}
