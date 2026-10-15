'use client';
import { useEffect, useMemo, useState } from 'react';
import cn from 'classnames';
import isEqual from 'lodash/isEqual';
import { toast } from 'react-toastify';
import type { Product, VariationOption } from '@/types';
import { getVariations } from '@/lib/get-variations';
import { isVariationSelected } from '@/lib/is-variation-selected';
import { availableValues, findVariant, pick, sellable, type Picks } from '@/lib/variant-match';
import usePrice from '@/lib/use-price';
import { useCitySupply } from '@/lib/use-city-supply';
import { isCityBased, isNationwideOutOfStock } from '@/lib/is-city-based';
// '@/framework/*' maps to src/framework/rest/* (see tsconfig paths).
import { useCityPrice } from '@/framework/use-city-price';
import { useProduct } from '@/framework/product';
import { useCart } from '@/store/quick-cart/cart.context';
import { generateCartItem } from '@/store/quick-cart/generate-cart-item';
import {
  AttributesProvider,
  useAttributes,
} from '@/components/products/details/attributes.context';
import { useModalAction } from '@/components/ui/modal/modal.context';
import Button from '@/components/ui/button';
import SafeImage from '@/components/ui/safe-image';
import { PlantLoader } from '@/components/ui/plant-loader';
import { Minus, Plus, X } from '@/components/ui/icon';

const PANEL = 'shadow-box w-[95vw] max-w-md rounded-2xl bg-white p-5 sm:p-6';
const MAX_QTY = 10;

type Option = { id: number | string; value: string };
type CartInputs = Parameters<typeof generateCartItem>;

const SizeSheet = ({ product }: { product: Product }) => {
  const { closeModal } = useModalAction();
  const { attributes, setAttributes } = useAttributes();
  const { addItemToCart, updateCartLanguage, language } = useCart();
  const { city, displayOnly } = useCitySupply();
  const [qty, setQty] = useState(1);

  // This product is the city-aware fetch, so its rows carry city_available.
  const rows = useMemo(
    () => (product.variation_options ?? []) as VariationOption[],
    [product.variation_options],
  );
  const groups = useMemo(
    () => getVariations(product.variations) as Record<string, Option[]>,
    [product.variations],
  );
  // Per group, the values some sellable row has: city-unavailable and switched-off
  // ones are hidden. Fail-open like the PDP: a group none reaches shows whole.
  const offered = useMemo(
    () => Object.fromEntries(Object.keys(groups).map((k) => [k, availableValues(rows, groups, {}, k)])),
    [rows, groups],
  );

  const isVariable = product.product_type?.toLowerCase() === 'variable';
  const isSelected = isVariationSelected(groups, attributes);
  // The PDP's match: every group's pick, by attribute name and value.
  const selectedRow = findVariant(rows, groups, attributes) as VariationOption | undefined;

  // Keep the picks that still reach a sellable row together (a city switch while
  // open can break them), then fill each empty group with its first value that
  // still does, group by group, so the preselection always exists and can be sold.
  // Nothing sellable at all: the picks are left to the shopper (the CTA says why).
  useEffect(() => {
    if (!rows.some((r) => sellable(r, rows))) return;
    const next: Picks = {};
    for (const k of Object.keys(groups)) {
      const v = attributes[k];
      if (v != null && availableValues(rows, groups, next, k).has(String(v))) next[k] = String(v);
    }
    for (const [k, list] of Object.entries(groups)) {
      if (next[k] != null) continue;
      const ok = availableValues(rows, groups, next, k);
      const first = list.find((o) => ok.has(String(o.value)));
      if (first) next[k] = String(first.value);
    }
    if (!isEqual(next, attributes)) setAttributes(next);
  }, [rows, groups, attributes, setAttributes]);

  const { minAmount, maxAmount, selectedAmount, hasVendorPrice } = useCityPrice({
    product,
    selectedVariationId: selectedRow?.id ?? null,
  });
  const priceSource: { price?: number; sale_price?: number | null } = selectedRow ?? product;
  const { price, basePrice } = usePrice({
    amount: Number(priceSource.sale_price || priceSource.price || 0),
    baseAmount: Number(priceSource.price || 0),
  });
  const { price: vendorPrice } = usePrice({ amount: Number(selectedAmount ?? 0) });
  const { price: minPrice } = usePrice({ amount: minAmount });
  const { price: maxPrice } = usePrice({ amount: maxAmount });
  // A variable product is never added without its variant (that was a ₹0 ghost line).
  const showRange = isVariable && !selectedRow;

  // Gates, in the order the PDP applies them; the reason doubles as the CTA label.
  // City gates apply to city-based products only; nationwide ones (Tools) carry their own stock.
  const cityBased = isCityBased(product);
  const cityUnavailable = cityBased && (product as { available_in_city?: boolean }).available_in_city === false;
  const blocked = cityUnavailable
    ? `Not available in ${city ?? 'your city'} yet`
    : cityBased && displayOnly
      ? `Out of stock in ${city}`
      : (selectedRow && !sellable(selectedRow, rows)) || isNationwideOutOfStock(product)
        ? 'Out of stock'
        : showRange
          ? isSelected
            ? "This combination isn't available"
            : 'Select a size'
          : null;

  const handleAdd = () => {
    if (blocked) return;
    const item = generateCartItem(
      // generateCartItem reads shop.id for a variation line; the single-product
      // payload carries `shop`, the pot-picker's shop_id fallback is kept as a guard.
      {
        ...product,
        shop: product.shop ?? { id: (product as { shop_id?: number }).shop_id },
      } as unknown as CartInputs[0],
      (selectedRow ?? {}) as unknown as CartInputs[1],
    );
    // Same price-integrity override as the PDP: with a vendor cost sheet the
    // server charges the city price, so the cart line must carry it too.
    if (hasVendorPrice && selectedAmount != null) {
      const vp = Number(selectedAmount);
      if (Number.isFinite(vp) && vp > 0) item.price = vp;
    }
    if (item.language && item.language !== language) updateCartLanguage(item.language);
    addItemToCart(item, qty); // the cart context tracks add_to_cart
    toast.success('Added to cart');
    closeModal();
  };

  const botanical = product.scientific_name ?? product.plant_attribute?.scientific_name;
  const stepperBtn =
    'grid h-9 w-9 place-items-center rounded-full text-forest-900 transition hover:bg-page disabled:opacity-40';

  return (
    <div className={PANEL}>
      <div className="flex items-start gap-3">
        <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-sage-50">
          <SafeImage
            src={product.image?.thumbnail ?? product.image?.original ?? ''}
            alt=""
            fill
            sizes="72px"
            quality={65}
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="text-[15px] font-semibold leading-snug text-forest-900">{product.name}</h3>
          {botanical && <p className="mt-0.5 text-[12px] text-stone-500">{botanical}</p>}
        </div>
        {/* Below lg the modal shell renders its own floating X in this corner;
            `invisible` keeps the slot (so the name never runs under it) without
            doubling the button. */}
        <button
          type="button"
          onClick={closeModal}
          aria-label="Close"
          className="invisible -mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 lg:visible"
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      {Object.entries(groups).map(([group, list]) => {
        // Hidden: values no sellable row has. Muted: unavailable only with the other
        // picks — still clickable; picking one drops those picks.
        const reach = offered[group];
        const shown = reach.size > 0 ? list.filter((o) => reach.has(String(o.value))) : list;
        const avail = availableValues(rows, groups, attributes, group);
        return (
          <div key={group} className="mt-5">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-forest-900">
              Select {group.replace(/-/g, ' ')}
            </p>
            <div className="flex flex-wrap gap-2">
              {shown.map((o) => {
                const active = attributes[group] === o.value;
                const muted = !avail.has(String(o.value));
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={active}
                    aria-label={muted ? `${o.value}, not available with your other choices` : undefined}
                    onClick={() => setAttributes((prev: Picks) => pick(rows, groups, prev, group, String(o.value)))}
                    className={cn(
                      'min-w-[3.25rem] rounded-full border px-4 py-1.5 text-[13px] font-medium transition',
                      active
                        ? 'border-forest-700 bg-forest-700 text-white'
                        : 'border-kraft-300 text-forest-900 hover:border-forest-500',
                      muted && 'opacity-50 line-through',
                    )}
                  >
                    {o.value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          {showRange ? (
            <span className="text-[18px] font-bold text-forest-900">
              {minPrice} – {maxPrice}
            </span>
          ) : (
            <>
              <span className="text-[18px] font-bold text-forest-900">
                {hasVendorPrice ? vendorPrice : price}
              </span>
              {!hasVendorPrice && basePrice && (
                <del className="text-[13px] text-stone-400">{basePrice}</del>
              )}
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center rounded-full border border-kraft-300 px-1 py-0.5">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={qty <= 1}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className={stepperBtn}
          >
            <Minus size={16} aria-hidden />
          </button>
          <span className="min-w-[1.75rem] text-center text-[14px] font-semibold tabular-nums text-forest-900">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={qty >= MAX_QTY}
            onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
            className={stepperBtn}
          >
            <Plus size={16} aria-hidden />
          </button>
        </div>
      </div>

      <Button
        type="button"
        variant="custom"
        onClick={handleAdd}
        disabled={!!blocked}
        className="mt-5 h-12 w-full rounded-control bg-ds-btn text-[14px] text-white hover:bg-ds-btn-hover disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        {blocked ?? 'Add to cart'}
      </Button>
    </div>
  );
};

/**
 * The size sheet: the `SELECT_PRODUCT_VARIATION` modal view, rendered by
 * managed-modal as `<ProductVariation productSlug={data} />`.
 *
 * Open it with `openModal('SELECT_PRODUCT_VARIATION', product.slug)` (every PLP
 * card's "Add to cart" and the wishlist's variable rows). It fetches the product
 * city-aware itself, offers the sizes a vendor supplies in the city, prices the
 * chosen size the way the PDP does and adds the line to the cart.
 *
 * @prop productSlug — the product to sell; nothing else is needed.
 */
const ProductVariation = ({ productSlug }: { productSlug: string }) => {
  const { closeModal } = useModalAction();
  const { product, isLoading, error } = useProduct({ slug: productSlug });
  if (isLoading) {
    return (
      <div className={cn(PANEL, 'grid min-h-[220px] place-items-center')}>
        <PlantLoader size="md" />
      </div>
    );
  }
  if (error || !product) {
    return (
      <div className={cn(PANEL, 'text-center')}>
        <p className="text-[14px] text-forest-900">Couldn&rsquo;t load this product. Please try again.</p>
        <Button type="button" variant="formSecondary" size="small" onClick={closeModal} className="mt-4">
          Close
        </Button>
      </div>
    );
  }
  return (
    <AttributesProvider>
      <SizeSheet product={product} />
    </AttributesProvider>
  );
};

export default ProductVariation;
