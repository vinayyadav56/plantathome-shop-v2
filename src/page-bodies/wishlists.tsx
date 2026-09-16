'use client';

import Card from '@/components/ui/cards/card';
import Seo from '@/components/seo/seo';
import WishlistProducts from '@/components/products/wishlist-products';

const MyWishlistPage = () => {
  return (
    <>
      <Seo noindex={true} nofollow={true} />
      <Card className="w-full shadow-none sm:shadow">
        <WishlistProducts />
      </Card>
    </>
  );
};



export default MyWishlistPage;


/* ── App Router body wrapper — chrome + auth live in app/(account)/layout.tsx ── */

export function PageBody(props: any) {
  return <MyWishlistPage {...props} />;
}
