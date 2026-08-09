import { UserRound } from '@/components/ui/icon';

export const AnonymousIcon = ({ ...props }) => {
  return <UserRound aria-hidden {...(props as any)} />;
};
