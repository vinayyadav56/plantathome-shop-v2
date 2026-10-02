import { Image } from '@/components/ui/image';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { siteSettings } from '@/config/site';
import { fadeInOut } from '@/lib/motion/fade-in-out';
import usePrice from '@/lib/use-price';
import { useCart } from '@/store/quick-cart/cart.context';
import { Minus, Plus } from '@/components/ui/icon';
import { useToggleWishlist } from '@/framework/wishlist';
import { useUser } from '@/framework/user';
import { goToSignin } from '@/lib/go-to-signin';

interface CartItemProps {
  item: any;
}

const CartItem = ({ item }: CartItemProps) => {
  const { clearItemFromCart, addItemToCart, removeItemFromCart } = useCart();
  const { isAuthorized } = useUser();
  // Variation lines are `${productId}.${variationId}`; the wishlist wants the product.
  const { toggleWishlist, isLoading: wishlistBusy } = useToggleWishlist(
    item?.productId ?? item?.id,
  );

  const { price } = usePrice({ amount: item.price });
  const { price: itemTotal } = usePrice({ amount: item.itemTotal });
  // City-inventory model: cart items are always orderable; never out of stock.

  function handleIncrement(e: React.MouseEvent) {
    e.stopPropagation();
    addItemToCart(item, 1);
  }
  function handleDecrement(e: React.MouseEvent) {
    e.stopPropagation();
    removeItemFromCart(item.id);
  }

  return (
    <motion.div
      layout
      initial="from"
      animate="to"
      exit="from"
      variants={fadeInOut(0.25)}
      className="pa-cart-item"
    >
      {/* Product image */}
      <div className="pa-cart-item-img">
        <Image
          src={item?.image ?? siteSettings?.product?.placeholderImage}
          alt={item.name}
          fill
          sizes="72px"
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="pa-cart-item-body">
        <h3 className="pa-cart-item-name" title={item.name}>{item.name}</h3>
        {item.unit && (
          <p className="pa-cart-item-unit">{item.unit}</p>
        )}
        <div className="pa-cart-item-bottom">
          {/* Quantity stepper */}
          <div className="pa-qty-stepper">
            <button
              className="pa-qty-btn"
              onClick={handleDecrement}
              aria-label="Decrease quantity"
            >
              <Minus size={12} aria-hidden />
            </button>
            <span className="pa-qty-val">{item.quantity}</span>
            <button
              className="pa-qty-btn"
              onClick={handleIncrement}
              aria-label="Increase quantity"
            >
              <Plus size={12} aria-hidden />
            </button>
          </div>
          <span className="pa-cart-item-total">{itemTotal}</span>
        </div>
        <p className="pa-cart-item-price">{price} each</p>
      {/* Flipkart-style text actions (annotation 2026-10-03) instead of the floating
            x-circle: explicit words, bigger touch targets, same row in drawer and /cart. */}
        <div className="pa-cart-actions">
          <button
            type="button"
            disabled={wishlistBusy}
            onClick={() => {
              if (!isAuthorized) return goToSignin();
              toggleWishlist({ product_id: item?.productId ?? item?.id });
              clearItemFromCart(item.id);
              toast.success('Moved to your wishlist');
            }}
          >
            Move to Wishlist
          </button>
          <span aria-hidden className="pa-cart-actions-divider" />
          <button type="button" onClick={() => clearItemFromCart(item.id)}>
            Remove
          </button>
        </div>
      </div>


    </motion.div>
  );
};

export default CartItem;
