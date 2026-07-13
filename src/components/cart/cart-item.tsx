import { Image } from '@/components/ui/image';
import { motion } from 'framer-motion';
import { siteSettings } from '@/config/site';
import { fadeInOut } from '@/lib/motion/fade-in-out';
import usePrice from '@/lib/use-price';
import { useCart } from '@/store/quick-cart/cart.context';

interface CartItemProps {
  item: any;
}

const CartItem = ({ item }: CartItemProps) => {
  const { clearItemFromCart, addItemToCart, removeItemFromCart } = useCart();

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
              <svg width="10" height="2" viewBox="0 0 10 2" fill="currentColor">
                <rect width="10" height="2" rx="1"/>
              </svg>
            </button>
            <span className="pa-qty-val">{item.quantity}</span>
            <button
              className="pa-qty-btn"
              onClick={handleIncrement}
              aria-label="Increase quantity"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <path d="M5 0v10M0 5h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <span className="pa-cart-item-total">{itemTotal}</span>
        </div>
        <p className="pa-cart-item-price">{price} each</p>
      </div>

      {/* Remove button */}
      <button
        className="pa-cart-remove-btn"
        onClick={() => clearItemFromCart(item.id)}
        aria-label="Remove item"
      >
        <svg width="9" height="9" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M1 1l12 12M13 1L1 13"/>
        </svg>
      </button>
    </motion.div>
  );
};

export default CartItem;
