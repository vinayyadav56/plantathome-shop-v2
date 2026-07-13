import { Disclosure as HeadlessDisclosure } from '@headlessui/react';
import { ArrowDownIcon } from '@/components/icons/arrow-down';
import { useTranslation } from 'next-i18next';

type DisclosureProps = {
  title: string;
  children: React.ReactNode;
  /** Selected-item count — shows a small accent badge next to the title. */
  count?: number;
};

export const CustomDisclosure: React.FC<DisclosureProps> = ({
  title,
  children,
  count,
  ...props
}) => {
  const { t } = useTranslation('common');
  return (
    <HeadlessDisclosure defaultOpen={true} {...props}>
      {({ open }) => (
        <>
          <HeadlessDisclosure.Button className="flex w-full items-center justify-between focus:outline-0 focus:ring-1 focus:ring-accent focus:ring-opacity-40">
            <span className="flex items-center gap-2 font-bold text-heading">
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
