'use client';
import React, { useMemo, useState } from 'react';
import { goToSignin } from '@/lib/go-to-signin';
import Link from 'next/link';
import { useRouter } from '@/compat/next-router';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';

import { useQuery } from 'react-query';
import { Routes } from '@/config/routes';
import type { Product } from '@/types';
import usePrice from '@/lib/use-price';
import { HttpClient } from '@/framework/client/http-client';
import { getStoredLatLng, getStoredCity } from '@/lib/customer-location';
import VendorAvailabilityNote from '@/components/products/details/vendor-availability-note';
import Truncate from '@/components/ui/truncate';
import { useTranslation } from 'next-i18next';
import { useSanitizeContent } from '@/lib/sanitize-content';
import { displayImage } from '@/lib/display-product-preview-images';
import { getVariations } from '@/lib/get-variations';
import { isVariationSelected } from '@/lib/is-variation-selected';
import { useAttributes } from './attributes.context';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { useUser } from '@/framework/user';
import { useAskAiEnabled } from '@/framework/ask-ai';
import { useCart } from '@/store/quick-cart/cart.context';
import { useCitySupply } from '@/lib/use-city-supply';
import { generateCartItem } from '@/store/quick-cart/generate-cart-item';
import PotPicker, { type SelectedPot } from './pot-picker';
import { cartAnimation } from '@/lib/cart-animation';
import PlantAtHomeGallery from './plantathome/gallery';
import BundleContents from './plantathome/bundle-contents';
import DeliveryCard from './plantathome/delivery-card';
import StickyAtcBar from './plantathome/sticky-atc-bar';
import { LineIcon } from '@/components/icons/line-icons';
import { usePdpContent } from '@/lib/use-home-config';
import { useToggleWishlist, useInWishlist } from '@/framework/wishlist';

/* ── small inline icons ─────────────────────────────────────────── */
const GoldStar = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="#FDBA12" aria-hidden>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const Bag = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
  </svg>
);
const Spark = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2l1.9 5.6L19.5 9.5 13.9 11.4 12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2z" />
  </svg>
);
const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
);

/* ── badge from tags / flash sale ───────────────────────────────── */
function getBadge(product: Product): string | null {
  if ((product as any)?.in_flash_sale) return 'Sale';
  const tags = (product as any)?.tags ?? [];
  for (const t of tags) {
    const k = (t?.slug ?? t?.name ?? '').toLowerCase();
    if (k.includes('best')) return 'Hot';
    if (k.includes('new')) return 'New';
    if (k.includes('editor')) return "Editor's Pick";
  }
  return null;
}

const isColorGroup = (name: string, options: any[]) =>
  name.toLowerCase().includes('color') ||
  name.toLowerCase().includes('colour') ||
  options?.some((o) => typeof o?.meta === 'string' && /^#|rgb/.test(o.meta));

/** "Buy with pot / without pot" — the marvel `Pot` attribute gets a bespoke
 *  card-toggle treatment instead of default chips. */
type Props = { product: Product; isModal?: boolean };

const PlantAtHomeProductDetails: React.FC<Props> = ({ product, isModal = false }) => {
  const router = useRouter();
  const { closeModal, openModal } = useModalAction();
  const { attributes, setAttributes } = useAttributes();
  const { isAuthorized } = useUser();
  const { data: askAiSettings } = useAskAiEnabled();
  const askAiEnabled = Boolean(askAiSettings?.data?.enabled);

  const {
    id, name, description, gallery, image, type, categories,
    quantity, slug, ratings, product_type, total_reviews, size_guide,
  } = (product ?? {}) as any;

  const [qty, setQty] = useState(1);
  // Pots are separate products chosen alongside a plant (user decision
  // 2026-07-14): the picked pot rides into the cart as its own line item.
  const [selectedPot, setSelectedPot] = useState<SelectedPot | null>(null);

  const variations = useMemo(
    () => (product_type?.toLowerCase() === 'variable' ? getVariations(product?.variations) : {}),
    [product?.variations, product_type],
  );
  const hasVariations = !isEmpty(variations) && product_type?.toLowerCase() === 'variable';
  const isSelected = isVariationSelected(variations, attributes);

  let selectedVariation: any = {};
  if (isSelected) {
    selectedVariation = product?.variation_options?.find((o: any) =>
      isEqual(o.options.map((v: any) => v.value).sort(), Object.values(attributes).sort()),
    );
  }

  // A matched variation exists only when isSelected AND find() returned a row —
  // an incomplete/unmatched selection falls back to the whole product so the
  // range still shows instead of ₹0.
  const hasSelectedVariation =
    hasVariations && isSelected && !isEmpty(selectedVariation);
  const priceSource: any = hasSelectedVariation ? selectedVariation : product;
  const { price, basePrice, discount } = usePrice({
    // variation_options[].price/sale_price arrive from the API as STRINGS —
    // usePrice returns '' for a non-number amount, which blanked the price when
    // a size was picked. Coerce to Number like every other call site.
    amount: Number(
      priceSource?.sale_price ? priceSource.sale_price : priceSource?.price ?? 0,
    ),
    baseAmount: Number(priceSource?.price ?? 0),
  });
  const { price: minPrice } = usePrice({ amount: product?.min_price ?? 0 });
  const { price: maxPrice } = usePrice({ amount: product?.max_price ?? 0 });

  // Location-derived selling price (margin over the nearest vendor's hidden cost).
  // Only overrides the displayed price when this product actually has a vendor
  // cost sheet — otherwise the catalog price above is shown unchanged.
  const loc = getStoredLatLng();
  const customerCity = getStoredCity();
  const { data: vendorPriceData } = useQuery(
    ['location-price', id, isSelected ? selectedVariation?.id : null, loc?.lat, loc?.lng, customerCity],
    () =>
      HttpClient.get<any>('location-price', {
        product_id: id,
        ...(isSelected && selectedVariation?.id ? { variation_option_id: selectedVariation.id } : {}),
        ...(loc ? { lat: loc.lat, lng: loc.lng } : {}),
        ...(customerCity ? { city: customerCity } : {}),
      }),
    // keepPreviousData: hold the last result while re-fetching for a newly
    // selected size, so the delivery line + price don't collapse/jump (the query
    // key changes with the variation). Prevents the section from fluctuating.
    { enabled: !!id, retry: 0, staleTime: 60_000, keepPreviousData: true },
  );
  const fulfillment = vendorPriceData?.fulfillment as
    | { fulfillment_mode?: 'local' | 'courier'; eta_days?: number }
    | null
    | undefined;
  const { price: vendorPrice } = usePrice({ amount: Number(vendorPriceData?.price ?? 0) });
  const useVendorPrice = Boolean(vendorPriceData?.has_vendor_cost && vendorPriceData?.available);
  const displayPrice = useVendorPrice ? vendorPrice : price;
  const displayBasePrice = useVendorPrice ? null : basePrice;

  // Operations Control Center — is this product's vertical available in the
  // customer's city? Only checked when a city is known; fail open otherwise.
  const { data: svcAvail } = useQuery<any>(
    ['svc-availability', type?.slug, customerCity],
    () =>
      HttpClient.get<any>('service-availability/check', {
        vertical: type?.slug,
        ...(customerCity ? { city: customerCity } : {}),
      }),
    { enabled: !!type?.slug && !!customerCity, retry: 0, staleTime: 60_000 },
  );
  const verticalBlocked = svcAvail?.available === false;
  const verticalMessage: string | null =
    svcAvail?.message ||
    (verticalBlocked ? `Currently unavailable in ${customerCity}.` : null);

  const previewImages = displayImage(selectedVariation?.image, gallery, image);
  const content = useSanitizeContent({ description });
  const badge = getBadge(product);

  const availableQty = hasVariations && isSelected ? Number(selectedVariation?.quantity) : Number(quantity);
  // City-inventory model: never out of stock — keep only the intentional
  // variation "disable" toggle. Stock quantity does not gate orderability.
  const inStock = !(selectedVariation?.is_disable);
  const needsSelection = hasVariations && !isSelected;

  /* cart */
  const { addItemToCart, updateCartLanguage, language } = useCart();
  // Display-only city (no nursery supply): browse-only, add-to-cart gated.
  const { city: shoppingCity, displayOnly } = useCitySupply();
  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (displayOnly) return;
    if (!inStock || needsSelection) return;
    const item = generateCartItem(product as any, selectedVariation);
    // Price integrity: when this product has a vendor cost sheet the server
    // charges the location/margin price (also what the PDP displays), NOT the
    // raw catalog variation price. The cart line must carry that same price or
    // the displayed cart total diverges from the amount actually charged.
    if (useVendorPrice && vendorPriceData?.price != null) {
      const vp = Number(vendorPriceData.price);
      if (Number.isFinite(vp) && vp > 0) (item as any).price = vp;
    }
    if (item?.language && item.language !== language) updateCartLanguage(item.language);
    addItemToCart(item, qty);
    // The chosen pot is its own product line (one pot per plant) — the server
    // re-prices both lines from their variation_option ids at checkout.
    if (selectedPot?.option) {
      const potProduct = {
        ...selectedPot.product,
        shop: selectedPot.product.shop ?? { id: selectedPot.product.shop_id },
      };
      addItemToCart(generateCartItem(potProduct, selectedPot.option), qty);
    }
    // The sticky bar invokes this without an event — fly-to-cart only when
    // there is a real click source to animate from.
    if (e) cartAnimation(e as any);
  };

  const navigate = (path: string) => { router.push(path); closeModal(); };
  const onAskAi = () => (isAuthorized ? openModal('ASK_AI', { product }) : goToSignin());

  // REAL rating values only — no invented defaults (annotation-era bug: the
  // page rendered 5 stars and "Loved by 12,000++ plant parents" for unrated
  // products).
  const ratingVal = Number(ratings) || 0;
  const reviewCount = Number(total_reviews) || 0;

  // Wishlist (first affordance on the PDP — same pattern as the cards)
  const { toggleWishlist } = useToggleWishlist(id);
  const { inWishlist } = useInWishlist({ product_id: id, enabled: isAuthorized });
  const onWishlist = () => (isAuthorized ? toggleWishlist({ product_id: id }) : goToSignin());

  // ONE source of truth for both CTAs (inline + sticky bar) so copy/state
  // can never drift between them.
  const ctaDisabled = !inStock || needsSelection || verticalBlocked || displayOnly;
  const ctaLabel = displayOnly
    ? `Out of Stock in ${shoppingCity}`
    : verticalBlocked
    ? 'Unavailable in your city'
    : !inStock
    ? 'Out of Stock'
    : needsSelection
    ? 'Select Options'
    : 'Add to Cart';
  const atcSentinelRef = React.useRef<HTMLDivElement>(null);

  // Admin-configurable "What's included" list (Configuration → Product Page
  // Sections); the shipped defaults are the fallback.
  const pdpContent = usePdpContent();
  const includedItems =
    pdpContent?.included?.filter((s) => s && s.trim()).slice(0, 6) ?? [
      `Healthy ${name}`,
      'Premium Designer Pot',
      'PlantAtHome Care Guide',
      'Nutrient Feed Pack',
      'Premium Packaging',
      'Plant Replacement Guarantee',
    ];

  /* breadcrumb crumbs */
  const firstCat = categories?.[0];
  const crumbs: { label: string; href?: string }[] = [
    { label: 'Home', href: Routes.home },
    { label: type?.name ?? 'Shop', href: type?.slug ? `/${type.slug}` : Routes.home },
    ...(firstCat ? [{ label: firstCat.name, href: `/${type?.slug}/search?category=${firstCat.slug}` }] : [{ label: 'All Products', href: type?.slug ? `/${type.slug}` : Routes.home }]),
    { label: name },
  ];

  /* quick-glance plant chips (plant business — pet/air/light/water up front).
     Only REAL plant_attribute values render; nothing is invented. */
  const pa = (product as any)?.plant_attribute;
  const quickChips: { icon: string; label: string }[] = [];
  if (pa) {
    if (pa.pet_friendly != null)
      quickChips.push({ icon: 'shield', label: pa.pet_friendly ? 'Pet friendly' : 'Keep from pets' });
    if (pa.air_purifying) quickChips.push({ icon: 'leaf', label: 'Air purifying' });
    if (pa.sunlight) quickChips.push({ icon: 'lotus', label: String(pa.sunlight).split(/[,/]/)[0].trim() });
    if (pa.water_requirement)
      quickChips.push({ icon: 'droplet', label: `${String(pa.water_requirement).split(/[,/]/)[0].trim()} water` });
    if (pa.indoor_outdoor) quickChips.push({ icon: 'box', label: pa.indoor_outdoor });
  }

  return (
    <article className="bg-cream-100">
      <div className="mx-auto w-full max-w-7xl px-4 pb-36 pt-5 sm:px-6 lg:px-10 lg:pb-12">
        {/* breadcrumb */}
        {!isModal && (
          <>
            <nav className="flex flex-wrap items-center gap-2 text-[12.5px]">
              {crumbs.map((c, i) => {
                const last = i === crumbs.length - 1;
                return (
                  <span key={i} className="flex items-center gap-2">
                    {c.href && !last ? (
                      <Link href={c.href} className="text-forest-800/80 transition hover:text-forest-900">{c.label}</Link>
                    ) : (
                      <span className={last ? 'font-medium text-clay-600' : 'text-forest-800/80'}>{c.label}</span>
                    )}
                    {!last && <span className="text-forest-800/40"><Chevron /></span>}
                  </span>
                );
              })}
            </nav>
            <div className="mt-5 h-px w-full bg-kraft-300/70" />
          </>
        )}

        {/* main grid — media slightly dominant; gallery pins while the info
            column scrolls (modern PDP convention). Sticky only outside the
            quick-view modal (the modal has its own scroll context). */}
        <div className="mt-7 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 xl:gap-16">
          <div className={!isModal ? 'lg:sticky lg:top-24 lg:self-start' : undefined}>
            <PlantAtHomeGallery gallery={previewImages} productId={id} productName={name} badge={badge} />
          </div>

          {/* info panel — min-w-0 is load-bearing: as a grid item its default
              min-width:auto lets the pot-picker rail's intrinsic width inflate
              the whole column (pot toggle blew out to ~1400px when the pot
              list opened); min-w-0 keeps the rail scrolling inside instead. */}
          <div className="flex min-w-0 flex-col">
            {/* title row + wishlist heart */}
            <div className="flex items-start justify-between gap-3">
              <h1
                className={classNames(
                  // Myntra-scale: small, quiet name — weight and colour carry
                  // the hierarchy, not size (annotation: "small fonts").
                  'min-w-0 text-[19px] font-semibold leading-snug tracking-tight text-forest-900 sm:text-[22px]',
                  { 'cursor-pointer transition-colors hover:text-forest-700': isModal },
                )}
                {...(isModal && { onClick: () => navigate(Routes.product(slug)) })}
              >
                {name}
              </h1>
              <button
                type="button"
                onClick={onWishlist}
                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#ECECEC] bg-white shadow-sm transition hover:scale-105"
              >
                <svg viewBox="0 0 24 24" fill={inWishlist ? '#C26B45' : 'none'} stroke={inWishlist ? '#C26B45' : '#374151'} strokeWidth="1.8" className="h-[21px] w-[21px]" aria-hidden>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>

            {/* botanical subline */}
            {(pa?.scientific_name || pa?.hindi_name) && (
              <p className="mt-1 text-[13px] text-[#8A8A8A]">
                {pa?.scientific_name}
                {pa?.scientific_name && pa?.hindi_name ? ' · ' : ''}
                {pa?.hindi_name}
              </p>
            )}

            {/* REAL rating anchor → scrolls to reviews; "New" pill when unrated */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {reviewCount > 0 ? (
                <a href="#reviews" className="group flex items-center gap-2">
                  <GoldStar className="h-[15px] w-[15px]" />
                  <span className="text-[13.5px] font-semibold text-gray-900">{ratingVal.toFixed(1)}</span>
                  <span className="text-[12.5px] text-stone-500 underline-offset-2 group-hover:underline">
                    ({reviewCount.toLocaleString('en-IN')} review{reviewCount === 1 ? '' : 's'})
                  </span>
                </a>
              ) : (
                <span className="rounded-full bg-sage-100 px-2.5 py-1 text-[11px] font-semibold text-forest-800">
                  New arrival
                </span>
              )}
            </div>

            {/* quick-glance plant chips */}
            {quickChips.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {quickChips.map((c) => (
                  <span
                    key={c.label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F8EC] px-2.5 py-1 text-[11.5px] font-semibold text-[#24693E]"
                  >
                    <LineIcon name={c.icon} className="h-3.5 w-3.5" />
                    {c.label}
                  </span>
                ))}
              </div>
            )}

            {/* price row */}
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1">
              {needsSelection ? (
                <span className="text-[20px] font-bold leading-none text-[#14532D]">{minPrice} – {maxPrice}</span>
              ) : (
                <>
                  <span className="text-[22px] font-bold leading-none text-[#14532D]">{displayPrice}</span>
                  {displayBasePrice && <del className="text-[13.5px] font-medium leading-none text-[#A0A0A0]">{displayBasePrice}</del>}
                  {!useVendorPrice && discount && (
                    <span className="rounded-[8px] bg-[#FFEAEA] px-2 py-1 text-[11.5px] font-bold leading-none text-[#D73C3C]">
                      {discount} OFF
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="mt-5 h-px w-full bg-kraft-300/70" />

            {/* short description (the ONLY teaser — full text lives in the
                "Plant care & details" section below the fold) */}
            {content && (
              <div className="mt-5 react-editor-description text-[13.5px] leading-6 text-stone-600">
                <Truncate character={180}>{content}</Truncate>
              </div>
            )}

            {/* bundle contents — the real bundle_items (compact in quick view) */}
            <div className="mt-5">
              <BundleContents product={product} compact={isModal} />
            </div>

            {/* variation pickers */}
            {hasVariations &&
              Object.keys(variations).map((groupName) => {
                const options = variations[groupName] as any[];
                const color = isColorGroup(groupName, options);
                const selected = attributes[groupName];
                return (
                  <div key={groupName} className="mt-6">
                    <p className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-forest-900">
                      {`Select ${groupName.replace(/-/g, ' ')}`}
                    </p>
                    {color ? (
                      <div className="flex flex-wrap items-center gap-3">
                        {options.map((o) => {
                          const active = selected === o.value;
                          return (
                            <button
                              key={o.id}
                              type="button"
                              aria-label={o.value}
                              onClick={() => setAttributes((p: any) => ({ ...p, [groupName]: o.value }))}
                              className={classNames(
                                'grid h-10 w-10 place-items-center rounded-full border-2 transition',
                                active ? 'border-forest-600' : 'border-transparent hover:border-kraft-300',
                              )}
                            >
                              <span className="h-7 w-7 rounded-full border border-black/10" style={{ backgroundColor: o.meta || o.value }} />
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {options.map((o) => {
                          const active = selected === o.value;
                          return (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => setAttributes((p: any) => ({ ...p, [groupName]: o.value }))}
                              className={classNames(
                                'min-w-[3.25rem] rounded-full border px-4 py-1.5 text-[13px] font-medium transition',
                                active
                                  ? 'border-forest-700 bg-forest-700 text-white'
                                  : 'border-kraft-300 bg-transparent text-forest-900 hover:border-forest-500',
                              )}
                            >
                              {o.value}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Size Guide — per-product image behind a native disclosure so the
                info column stays compact. Plain <img> (like the pot picker) so
                any chart shape renders at its natural aspect ratio without
                next/image's fixed-dimension letterboxing. Hidden in the modal. */}
            {size_guide?.original && !isModal && (
              <details className="group mt-6 rounded-[14px] border border-[#ECECEC] bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[13px] font-semibold text-forest-900 [&::-webkit-details-marker]:hidden">
                  Size guide
                  <LineIcon name="chevronRight" className="h-4 w-4 text-stone-400 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-4 pb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={size_guide.original}
                    alt={`${name} size guide`}
                    loading="lazy"
                    className="h-auto w-full rounded-2xl border border-kraft-300/70 bg-white"
                  />
                </div>
              </details>
            )}

            {/* pot picker — plants only; pots are real products added as their
                own cart line, size-matched to the selected plant size */}
            {type?.slug === 'plants' && (
              <PotPicker
                plantSize={(attributes as any)?.size ?? null}
                fallbackSize={((variations as any)?.size?.[0]?.value as string) ?? null}
                selected={selectedPot}
                onSelect={setSelectedPot}
              />
            )}

            {/* ONE coherent "Delivery & availability" card — merges the ETA
                line, the vendor-availability note, the vertical-blocked and
                browse-only notices that used to be four scattered rows. */}
            <div className="mt-5">
              <DeliveryCard
                city={customerCity}
                etaDays={fulfillment?.eta_days ?? null}
                fulfillmentMode={fulfillment?.fulfillment_mode ?? null}
                product={product}
                variationOptionId={isSelected ? selectedVariation?.id ?? null : null}
                verticalBlocked={verticalBlocked}
                verticalMessage={verticalMessage}
                displayOnly={displayOnly}
              />
            </div>

            {/* quantity + add to cart (the div is also the sticky-bar sentinel:
                the condensed bar appears once this row scrolls above the fold) */}
            <div ref={atcSentinelRef} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <div className="flex items-center justify-between gap-2 rounded-full border border-kraft-300 px-2 py-1.5 sm:w-[140px]">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-10 w-10 place-items-center rounded-full text-forest-900 transition hover:bg-cream-100 disabled:opacity-40"
                  disabled={qty <= 1}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14" /></svg>
                </button>
                <span className="min-w-[1.5rem] text-center text-[14px] font-semibold text-forest-900">
                  {String(qty).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQty((q) => (availableQty ? Math.min(availableQty, q + 1) : q + 1))}
                  className="grid h-10 w-10 place-items-center rounded-full text-forest-900 transition hover:bg-cream-100"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={ctaDisabled}
                className={classNames(
                  'flex flex-1 items-center justify-center gap-2.5 rounded-[14px] px-7 py-3.5 text-[14px] font-bold uppercase tracking-[0.04em] text-white transition',
                  ctaDisabled
                    ? 'cursor-not-allowed bg-stone-300'
                    : 'bg-[#14532D] shadow-[0_14px_30px_-12px_rgba(20,83,45,0.6)] hover:bg-[#0D4324]',
                )}
              >
                <Bag className="h-5 w-5" />
                {ctaLabel}
              </button>
            </div>

            {/* trust strip — modern convention: guarantees directly under the CTA */}
            {!isModal && (
              <div className="mt-5 grid grid-cols-3 gap-2.5">
                {[
                  { icon: 'shield', label: '30-day healthy-arrival guarantee' },
                  { icon: 'box', label: 'Secure eco-friendly packaging' },
                  { icon: 'leaf', label: 'Expert plant support' },
                ].map((t) => (
                  <div key={t.label} className="flex flex-col items-center gap-1.5 rounded-[14px] border border-[#ECECEC] bg-white px-2 py-3 text-center">
                    <LineIcon name={t.icon} className="h-5 w-5 text-[#24693E]" />
                    <span className="text-[11px] font-medium leading-snug text-stone-600">{t.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* What's included — admin-configured list (Product Page Sections) */}
            {!isModal && includedItems.length > 0 && (
              <div className="mt-4 rounded-[14px] border border-[#ECECEC] bg-white p-4">
                <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#184A31]">What&rsquo;s included</h3>
                <ul className="mt-2.5 grid gap-x-4 gap-y-2 sm:grid-cols-2">
                  {includedItems.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px] text-stone-600">
                      <LineIcon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-[#24693E]" strokeWidth={2.4} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ask AI */}
            {askAiEnabled && (
              <button
                type="button"
                onClick={onAskAi}
                className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-forest-600/30 bg-white/50 px-4 py-2 text-[13px] font-semibold text-forest-800 transition hover:border-forest-600 hover:bg-white"
              >
                <Spark className="h-4 w-4 text-clay-600" /> Ask AI about this plant
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Scroll-triggered condensed ATC bar — appears only after the inline
          CTA leaves the viewport; same computed state/copy as the inline
          button (single source of truth). Never renders in the quick-view. */}
      {!isModal && (
        <StickyAtcBar
          sentinel={atcSentinelRef}
          name={name}
          priceText={needsSelection ? `${minPrice} – ${maxPrice}` : displayPrice}
          disabled={ctaDisabled}
          label={ctaLabel}
          onAdd={() => handleAdd(undefined as any)}
        />
      )}
    </article>
  );
};

export default PlantAtHomeProductDetails;
