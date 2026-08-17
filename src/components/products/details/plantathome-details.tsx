'use client';
import React, { useMemo, useState } from 'react';
import { goToSignin } from '@/lib/go-to-signin';
import Link from 'next/link';
import { useRouter } from '@/compat/next-router';
import classNames from 'classnames';
import { plantQuickFacts } from '@/components/products/cards/card-helpers';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';

import { useQuery } from 'react-query';
import { Routes } from '@/config/routes';
import Breadcrumb from '@/components/ui/breadcrumb';
import type { Product } from '@/types';
import usePrice from '@/lib/use-price';
import { HttpClient } from '@/framework/client/http-client';
import { getStoredCity } from '@/lib/customer-location';
// '@/framework/*' maps to src/framework/rest/* (see tsconfig paths).
import { useCityPrice } from '@/framework/use-city-price';
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
import { Star, Heart, Sparkles, ChevronRight, ShoppingBag, Plus, Minus, Ruler } from '@/components/ui/icon';
import { useProduct } from '@/framework/product';

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
  // ONE resolver for every price on this page — the range, the selected variant
  // and the sticky bar. It used to be three independent paths, and the range one
  // read the SSR prop, which is fetched WITHOUT a city (that fetch is ISR-cached,
  // so it cannot be city-specific) — hence a city-correct selected price sitting
  // next to a master-catalogue range on the same screen.
  const {
    minAmount,
    maxAmount,
    selectedAmount,
    hasVendorPrice,
    fulfillment,
  } = useCityPrice({
    product,
    selectedVariationId: isSelected ? selectedVariation?.id : null,
  });

  // Still needed outside pricing: the vertical availability check and the
  // delivery card's "to {city}" copy.
  const customerCity = getStoredCity();

  // Sizes are only offered when a vendor actually supplies them in the city —
  // attachCityPricing marks variation_options[].city_available on the
  // city-aware fetch. Same react-query key useCityPrice uses internally, so
  // this adds ZERO network requests. Fail-open: no city / data not yet in /
  // nothing available in the city ⇒ every size shows (browse-only cards and
  // the delivery notices handle the nothing-deliverable case downstream).
  const { product: cityProduct } = useProduct({
    slug: slug ?? '',
    enabled: !!customerCity,
  });
  const unavailableSizes = useMemo(() => {
    const set = new Set<string>();
    for (const o of (cityProduct as any)?.variation_options ?? []) {
      if (o?.city_available === false) {
        const v = (o?.options ?? []).find(
          (x: any) => String(x?.name ?? '').toLowerCase() === 'size',
        )?.value;
        if (v != null) set.add(String(v));
      }
    }
    return set;
  }, [cityProduct]);
  const anySizeAvailable = useMemo(
    () => ((variations as any)?.size ?? []).some((o: any) => !unavailableSizes.has(String(o.value))),
    [variations, unavailableSizes],
  );
  // A selection that just became city-unavailable must not persist (e.g. the
  // customer switched city with a size already picked).
  React.useEffect(() => {
    const sel = (attributes as any)?.size;
    if (sel && anySizeAvailable && unavailableSizes.has(String(sel))) {
      setAttributes((p: any) => {
        const next = { ...p };
        delete next.size;
        return next;
      });
    }
  }, [unavailableSizes, anySizeAvailable, attributes, setAttributes]);

  const { price: minPrice } = usePrice({ amount: minAmount });
  const { price: maxPrice } = usePrice({ amount: maxAmount });
  const { price: vendorPrice } = usePrice({ amount: Number(selectedAmount ?? 0) });
  const displayPrice = hasVendorPrice ? vendorPrice : price;
  const displayBasePrice = hasVendorPrice ? null : basePrice;

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

  /**
   * The price, rendered in one of two places: inline with the first variation
   * picker's label when the product has variations, or in its own row when it
   * does not. Defined once so the two positions can never drift.
   *
   * Slightly smaller in the range state (20px vs 22px) because "₹359.00 –
   * ₹929.00" is roughly twice the width of a single price and would otherwise
   * crowd the label it now shares a row with.
   */
  const priceBlock = needsSelection ? (
    <span className="whitespace-nowrap text-[15px] font-bold leading-none text-[#14532D] sm:text-[17px] lg:text-[20px]">
      {/* Paints the master range on the first frame (from the SSR product) and quietly
          refines to the city range when it arrives — no blank skeleton. */}
      {minPrice} – {maxPrice}
    </span>
  ) : (
    <>
      <span className="whitespace-nowrap text-[17px] font-bold leading-none text-[#14532D] sm:text-[19px] lg:text-[22px]">{displayPrice}</span>
      {displayBasePrice && (
        <del className="text-[13.5px] font-medium leading-none text-[#A0A0A0]">{displayBasePrice}</del>
      )}
      {!hasVendorPrice && discount && (
        <span className="rounded-[8px] bg-[#FFEAEA] px-2 py-1 text-[11.5px] font-bold leading-none text-[#D73C3C]">
          {discount} OFF
        </span>
      )}
    </>
  );

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
    if (hasVendorPrice && selectedAmount != null) {
      const vp = Number(selectedAmount);
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

  /* breadcrumb crumbs — omission over dead links. When the API returns a product without its
     `type`, this used to render "Home / Shop / All Products / <name>" with both middle crumbs
     pointing at `/`: a trail that describes nothing and navigates nowhere. A crumb we cannot
     link truthfully is simply left out. */
  const firstCat = categories?.[0];
  const crumbs: { label: string; href?: string }[] = [
    { label: 'Home', href: Routes.home },
    ...(type?.slug ? [{ label: type.name, href: `/${type.slug}` }] : []),
    ...(type?.slug && firstCat
      ? [{ label: firstCat.name, href: `/${type.slug}/search?category=${firstCat.slug}` }]
      : []),
    { label: name },
  ];

  /* quick-glance plant chips (plant business — pet/air/light/water up front).
     Only REAL plant_attribute values render; nothing is invented. Shared with
     the product card so both surfaces state the same facts. */
  const pa = (product as any)?.plant_attribute;
  const quickChips = plantQuickFacts(product as any);

  return (
    <article className="bg-cream-100">
      <div className="mx-auto w-full max-w-7xl px-4 pb-36 pt-5 sm:px-6 lg:px-10 lg:pb-12">
        {/* breadcrumb */}
        {!isModal && (
          <>
            <Breadcrumb items={crumbs} />
            <div className="mt-5 h-px w-full bg-kraft-300/70" />
          </>
        )}

        {/* main grid — media slightly dominant; gallery pins while the info
            column scrolls (modern PDP convention). Sticky only outside the
            quick-view modal (the modal has its own scroll context). */}
        <div className="mt-7 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 xl:gap-16">
          <div className={classNames('relative', !isModal && 'lg:sticky lg:top-24 lg:self-start')}>
            <PlantAtHomeGallery gallery={previewImages} productId={id} productName={name} badge={badge} />
            {/* Over the image, matching where the wishlist heart sits on every
                product card. It used to share the title row, where it also ate
                width from the product name. */}
            <button
              type="button"
              onClick={onWishlist}
              aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              className="absolute right-3 top-3 z-[2] grid h-10 w-10 place-items-center rounded-full border border-black/5 bg-white/90 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white sm:right-4 sm:top-4 sm:h-11 sm:w-11"
            >
              <Heart
                fill={inWishlist ? '#C26B45' : 'none'}
                style={{ color: inWishlist ? '#C26B45' : '#374151' }}
                className="h-[18px] w-[18px] sm:h-5 sm:w-5"
                aria-hidden
              />
            </button>

            {/*
              Ask AI lives ON the image, bottom-left — the one corner the gallery
              leaves free (thumbnails run down the top-left, the prev/next arrows
              sit bottom-right, the wishlist heart is top-right).

              It was the last pill in the attribute chip row, which is a single
              horizontal scroller: on a 1440px screen it sat half-clipped past the
              right edge, so the feature was effectively hidden again. On the
              image it is unmissable and costs the info column no width.
            */}
            {askAiEnabled && (
              <button
                type="button"
                onClick={onAskAi}
                className="absolute bottom-3 left-3 z-[2] inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white/90 px-3 py-2 text-[12px] font-bold text-clay-700 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white sm:bottom-4 sm:left-4 sm:gap-2 sm:px-3.5 sm:text-[13px]"
              >
                <Sparkles size={16} fill="currentColor" className="text-clay-600" aria-hidden /> Ask AI
              </button>
            )}
          </div>

          {/* info panel — min-w-0 is load-bearing: as a grid item its default
              min-width:auto lets the pot-picker rail's intrinsic width inflate
              the whole column (pot toggle blew out to ~1400px when the pot
              list opened); min-w-0 keeps the rail scrolling inside instead. */}
          <div className="flex min-w-0 flex-col">
            {/* title row + wishlist heart. The "New arrival" pill sits inline
                with the name rather than in the rating row below it — it labels
                the product, so it belongs next to what it labels. It wraps to
                its own line on narrow columns instead of squeezing the name. */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <h1
                  className={classNames(
                    // Myntra-scale: small, quiet name — weight and colour carry
                    // the hierarchy, not size (annotation: "small fonts").
                    'min-w-0 text-[19px] font-medium leading-snug tracking-tight text-forest-900 sm:text-[22px]',
                    { 'cursor-pointer transition-colors hover:text-forest-700': isModal },
                  )}
                  {...(isModal && { onClick: () => navigate(Routes.product(slug)) })}
                >
                  {name}
                </h1>
                {reviewCount === 0 && (
                  <span className="shrink-0 rounded-full bg-sage-100 px-2.5 py-1 text-[11px] font-medium leading-none text-forest-800">
                    New arrival
                  </span>
                )}
              </div>
            </div>

            {/* botanical subline */}
            {(pa?.scientific_name || pa?.hindi_name) && (
              <p className="mt-1 text-[13px] text-[#8A8A8A]">
                {pa?.scientific_name}
                {pa?.scientific_name && pa?.hindi_name ? ' · ' : ''}
                {pa?.hindi_name}
              </p>
            )}

            {/* REAL rating anchor → scrolls to reviews. Unrated products show
                the "New arrival" pill up in the title row instead, so this row
                renders nothing at all rather than an empty 12px gap. */}
            {reviewCount > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <a href="#reviews" className="group flex items-center gap-2">
                  <Star size={14} fill="currentColor" strokeWidth={0} style={{ color: '#FDBA12' }} aria-hidden />
                  <span className="text-[13.5px] font-semibold text-gray-900">{ratingVal.toFixed(1)}</span>
                  <span className="text-[12.5px] text-stone-500 underline-offset-2 group-hover:underline">
                    ({reviewCount.toLocaleString('en-IN')} review{reviewCount === 1 ? '' : 's'})
                  </span>
                </a>
              </div>
            )}

            {/* quick-glance plant chips. Ask AI is NOT here any more — it moved
                onto the gallery image, where it can't be scrolled out of sight. */}
            {quickChips.length > 0 && (
              <div className="pah-chip-row mt-3 flex items-center gap-1.5 overflow-x-auto sm:gap-2">
                {quickChips.map((c) => (
                  <span
                    key={c.label}
                    className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-[#F3F8EC] px-2 py-1 text-[11px] font-semibold text-[#24693E] sm:gap-1.5 sm:px-2.5 sm:text-[11.5px]"
                  >
                    <LineIcon name={c.icon} className="h-3.5 w-3.5" />
                    {c.label}
                  </span>
                ))}
              </div>
            )}

            {/*
              Price sits on the SAME ROW as the first variation picker's label
              (label left, price right) rather than in a row of its own further
              up. Selecting a size is what changes the price, so putting them on
              one line makes that cause and effect visible instead of leaving the
              reader to connect two separate blocks.

              Products with no variations keep the standalone row — there is no
              picker to pair it with.
            */}
            {!hasVariations && (
              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1">
                {priceBlock}
              </div>
            )}

            <div className="mt-4 h-px w-full bg-kraft-300/70" />

            {/* short description (the ONLY teaser — full text lives in the
                "Plant care & details" section below the fold) */}
            {content && (
              <div className="mt-4 react-editor-description text-[13.5px] leading-6 text-stone-600">
                {/* 120 not 180: three teaser lines plus a Read more pushed the
                    pot picker below the fold, and the full text is a section
                    away under "Plant care & details" anyway. */}
                <Truncate character={120}>{content}</Truncate>
              </div>
            )}

            {/* bundle contents — the real bundle_items (compact in quick view) */}
            <div className="mt-4">
              <BundleContents product={product} compact={isModal} />
            </div>

            {/* variation pickers */}
            {hasVariations &&
              Object.keys(variations).map((groupName, groupIndex) => {
                const allOptions = variations[groupName] as any[];
                const isSizeGroup = groupName.toLowerCase() === 'size';
                // Only vendor-supplied sizes for the customer's city; fail-open
                // to the full list when the filter would empty it.
                const cityFiltered =
                  isSizeGroup && unavailableSizes.size > 0
                    ? allOptions.filter((o) => !unavailableSizes.has(String(o.value)))
                    : allOptions;
                const options = cityFiltered.length > 0 ? cityFiltered : allOptions;
                const color = isColorGroup(groupName, options);
                const selected = attributes[groupName];
                return (
                  <div key={groupName} className="mt-5">
                    <div className="mb-2 flex items-center justify-between gap-x-3">
                      <span className="flex min-w-0 items-center gap-x-2.5">
                        <p className="shrink-0 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.08em] text-forest-900 sm:text-[12px]">
                          {`Select ${groupName.replace(/-/g, ' ')}`}
                        </p>
                        {/* Popup size guide, right where the sizes are chosen —
                            works on the full PDP AND in the quick-view modal. */}
                        {isSizeGroup && (size_guide?.original || allOptions.length > 0) && (
                          <button
                            type="button"
                            onClick={() =>
                              openModal('SIZE_GUIDE', {
                                sizeGuide: size_guide,
                                sizes: (variations as any)?.size ?? [],
                                name,
                              })
                            }
                            className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-forest-700 underline underline-offset-2 hover:text-forest-900"
                          >
                            <Ruler size={12} aria-hidden />
                            Size guide
                          </button>
                        )}
                      </span>
                      {/* first picker only — repeating the price above every
                          group would read as a different price per group. */}
                      {groupIndex === 0 && (
                        <span className="flex min-w-0 items-center justify-end gap-x-2 whitespace-nowrap">
                          {priceBlock}
                        </span>
                      )}
                    </div>
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
                  <Minus size={16} aria-hidden />
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
                  <Plus size={16} aria-hidden />
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
                <ShoppingBag size={20} aria-hidden />
                {ctaLabel}
              </button>
            </div>

            {/* trust strip — modern convention: guarantees directly under the
                CTA. Single-line rows: the 3-column tiles wrapped every label
                onto two lines (owner feedback). */}
            {!isModal && (
              <div className="mt-5 divide-y divide-[#ECECEC] rounded-[14px] border border-[#ECECEC] bg-white px-4">
                {[
                  { icon: 'shield', label: '30-day healthy-arrival guarantee' },
                  { icon: 'box', label: 'Secure eco-friendly packaging' },
                  { icon: 'leaf', label: 'Expert plant support' },
                ].map((t) => (
                  <div key={t.label} className="flex items-center gap-2.5 py-2.5">
                    <LineIcon name={t.icon} className="h-[18px] w-[18px] shrink-0 text-[#24693E]" />
                    <span className="whitespace-nowrap text-[12px] font-medium text-stone-600">{t.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* What's included — admin-configured list (Product Page Sections) */}
            {!isModal && includedItems.length > 0 && (
              <div className="mt-4 rounded-[14px] border border-[#ECECEC] bg-white p-4">
                <h3 className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#184A31]">What&rsquo;s included</h3>
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
