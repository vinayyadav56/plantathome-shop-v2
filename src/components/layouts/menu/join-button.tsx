import Button from '@/components/ui/button';
import { goToSignin } from '@/lib/go-to-signin';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { useTranslation } from 'next-i18next';

export default function JoinButton() {
  const { t } = useTranslation('common');
  const { openModal } = useModalAction();
  function handleJoin() {
    return goToSignin();
  }
  return (
    <Button className="font-semibold" size="small" onClick={handleJoin}>
      {t('join-button')}
    </Button>
  );
}
