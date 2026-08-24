'use client';

import Card from '@/components/ui/cards/card';
import Seo from '@/components/seo/seo';
import WishlistProducts from '@/components/products/wishlist-products';
import { useWindowSize } from '@/lib/use-window-size';
import dynamic from 'next/dynamic';

const CartCounterButton = dynamic(
  () => import('@/components/cart/cart-counter-button'),
  { ssr: false }
);
const MyWishlistPage = () => {
  const { width } = useWindowSize();
  return (
    <>
      <Seo noindex={true} nofollow={true} />
      <Card className="w-full shadow-none sm:shadow">
        <WishlistProducts />
      </Card>
      {width > 767 && <CartCounterButton />}
    </>
  );
};



export default MyWishlistPage;


/* ── App Router body wrapper — chrome + auth live in app/(account)/layout.tsx ── */

export function PageBody(props: any) {
  return <MyWishlistPage {...props} />;
}
