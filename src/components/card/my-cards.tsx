import CardViewHeader from './card-view-header';
import CardsView from './card-view';
import { useCards } from '@/framework/card';
import ErrorMessage from '@/components/ui/error-message';
import Spinner from '@/components/ui/loaders/spinner/spinner';

const MyCards: React.FC = () => {
  const { cards, isLoading, error } = useCards();

  if (isLoading) {
    return <Spinner simple className="mx-auto my-16 h-6 w-6" />;
  }

  if (error) return <ErrorMessage message={error?.message} />;

  return (
    <>
      <CardViewHeader />
      <CardsView payments={cards} />
    </>
  );
};

export default MyCards;
