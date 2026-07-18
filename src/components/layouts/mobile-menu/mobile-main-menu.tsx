import { useRouter } from '@/compat/next-router';
import { useTranslation } from 'next-i18next';
import DrawerWrapper from '@/components/ui/drawer/drawer-wrapper';
import { useAtom } from 'jotai';
import { drawerAtom } from '@/store/drawer-atom';
import { siteSettings } from '@/config/site';
import Link from '@/components/ui/link';
import { useTypes } from '@/framework/type';
import { TYPES_PER_PAGE } from '@/framework/client/variables';

export default function MobileMainMenu() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [_, closeSidebar] = useAtom(drawerAtom);
  const { headerLinks } = siteSettings;
  const { types } = useTypes({ limit: TYPES_PER_PAGE });
  const typeList = types ?? [];
  const homeSlug =
    typeList.find((tp) => tp?.settings?.isHome)?.slug ?? typeList[0]?.slug;
  const currentSlug =
    (router.query.pages as string[] | undefined)?.[0] ?? homeSlug;

  // function handleClick(path: string) {
  //   router.push(path);
  //   closeSidebar({ display: false, view: '' });
  // }

  return (
    <DrawerWrapper>
      {/* Vertical switcher — Plants · Tools · FarmBox */}
      <div className="px-5 pt-5 md:px-6">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
          Shop by world
        </p>
        {/* 3-per-row grid so every vertical (up to six) fits without crushing /
            clipping long labels like "Pots & Planters" on a phone. */}
        <div className="grid grid-cols-3 gap-2">
          {typeList.map((tp) => (
            <Link
              key={tp.slug}
              href={tp.slug === homeSlug ? '/' : `/${tp.slug}`}
              onClick={() => closeSidebar({ display: false, view: '' })}
              className={`flex min-h-[38px] items-center justify-center rounded-full px-1.5 py-1.5 text-center text-[12.5px] font-bold leading-tight transition ${
                currentSlug === tp.slug
                  ? 'bg-leaf text-white'
                  : 'bg-forest/8 text-forest'
              }`}
            >
              {tp.name}
            </Link>
          ))}
        </div>
      </div>
      <ul className="grow pt-4">
        {headerLinks?.map(({ href, label }) => (
          <li key={`${href}${label}`}>
            <Link
              href={href}
              className="flex items-center px-5 py-3 text-sm font-semibold capitalize transition duration-200 cursor-pointer text-heading hover:text-accent md:px-6"
              title={t(label)}
              onClick={() => closeSidebar({ display: false, view: '' })}
            >
              {t(label)}
            </Link>
          </li>
        ))}
      </ul>
    </DrawerWrapper>
  );
}
