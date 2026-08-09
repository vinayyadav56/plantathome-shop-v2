import { ExternalLink } from '@/components/ui/icon';

export const ExternalIcon = ({ ...props }) => {
  return <ExternalLink aria-hidden {...(props as any)} />;
};

export const ExternalIconNew: React.FC<React.SVGAttributes<{}>> = (props) => {
  return <ExternalLink aria-hidden {...(props as any)} />;
};
