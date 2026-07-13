import { Image } from '@/components/ui/image';
import cn from 'classnames';
import Link from '@/components/ui/link';
import { useSettings } from '@/framework/settings';

const Logo: React.FC<React.AnchorHTMLAttributes<{}>> = ({
  className,
  ...props
}) => {
  const {
    settings: { logo, siteTitle },
  }: any = useSettings();
  return (
    <Link href="/" className={cn('inline-flex', className)} {...props}>
      <span className="relative h-[2.875rem] w-[13rem] overflow-hidden">
        <Image
          src={logo?.original ?? '/logo.svg'}
          alt={siteTitle || 'PlantAtHome'}
          fill
          sizes="(max-width: 768px) 100vw"
          loading="eager"
          className="object-contain object-left"
        />
      </span>
    </Link>
  );
};

export default Logo;
