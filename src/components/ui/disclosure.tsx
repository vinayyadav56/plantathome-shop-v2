import { Disclosure as HeadlessDisclosure } from '@headlessui/react';
import { ArrowDownIcon } from '@/components/icons/arrow-down';
import { useTranslation } from 'next-i18next';

type DisclosureProps = {
  title: string;
  children: React.ReactNode;
  /** Selected-item count — shows a small accent badge next to the title. */
  count?: number;
  /** Whether the section starts expanded (default true). A collapsed section
   *  doesn't mount its children, so secondary filter lists can defer their
   *  network fetch until the shopper opens them. */
  defaultOpen?: boolean;
};

export const CustomDisclosure: React.FC<DisclosureProps> = ({
  title,
  children,
  count,
  defaultOpen = true,
  ...props
}) => {
  const { t } = useTranslation('common');
  return (
    <HeadlessDisclosure defaultOpen={defaultOpen} {...props}>
      {({ open }) => (
        <>
          {/* focus-VISIBLE, not focus: with plain `focus:` the accent ring stayed
              painted after every mouse click, so opening or closing any filter
              section left what looked like a stray border around its heading. */}
          <HeadlessDisclosure.Button className="flex w-full items-center justify-between rounded-sm focus:outline-0 focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-opacity-40">
            <span className="flex items-center gap-2 text-[13px] font-semibold leading-none text-heading">
              {t(title)}
              {count ? (
                <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white">
                  {count}
                </span>
              ) : null}
            </span>
            <ArrowDownIcon
              className={`h-2.5 w-2.5 ${open ? 'rotate-180 transform' : ''}`}
            />
          </HeadlessDisclosure.Button>
          <HeadlessDisclosure.Panel className="pt-4">
            {children}
          </HeadlessDisclosure.Panel>
        </>
      )}
    </HeadlessDisclosure>
  );
};
