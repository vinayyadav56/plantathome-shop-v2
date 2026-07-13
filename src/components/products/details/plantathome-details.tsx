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
import { generateCartItem } from '@/store/quick-cart/generate-cart-item';
import { cartAnimation } from '@/lib/cart-animation';
import PlantAtHomeGallery from './plantathome/gallery';
import PlantAtHomeAccordion, { AccordionItem } from './plantathome/accordion';

/** Long product descriptions collapse to a preview with a View More toggle
 *  so the details panel stays compact until the shopper opts in. */
function ClampedDescription({ html }: { html: string }) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  // Short copy doesn't need the toggle — render it plainly.
  const isLong = (html?.replace(/<[^>]+>/g, '') ?? '').length > 320;
  if (!isLong) {
    return <div className="react-editor-description" dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return (
    <div>
      <div className="relative">
        <div
          className={`react-editor-description overflow-hidden ${open ? '' : 'max-h-[150px]'}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {!open && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-forest-700 transition-colors hover:text-forest-900"
      >
        {open ? t('text-view-less') : t('text-view-more')}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}

/* ── small inline icons ─────────────────────────────────────────── */
const Star = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2z" />
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
const isPotGroup = (name: string) => name.toLowerCase() === 'pot';

/** Cheapest effective price among variation_options whose options include the
 *  given attribute value (sale_price wins) — used to show "+₹N" on pot cards. */
const minPriceForValue = (variationOptions: any[], value: string): number | null => {
  const prices = (variationOptions ?? [])
    .filter((vo) => (vo?.options ?? []).some((o: any) => o?.value === value))
    .map((vo) => Number(vo?.sale_price ? vo.sale_price : vo?.price))
    .filter((n) => Number.isFinite(n));
  return prices.length ? Math.min(...prices) : null;
};

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
    quantity, slug, ratings, product_type, total_reviews,
  } = (product ?? {}) as any;

  const [qty, setQty] = useState(1);

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
    { enabled: !!id, retry: 0, staleTime: 60_000 },
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
  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!inStock || needsSelection) return;
    const item = generateCartItem(product as any, selectedVariation);
    if (item?.language && item.language !== language) updateCartLanguage(item.language);
    addItemToCart(item, qty);
    cartAnimation(e as any);
  };

  const navigate = (path: string) => { router.push(path); closeModal(); };
  const onAskAi = () => (isAuthorized ? openModal('ASK_AI', { product }) : goToSignin());

  const ratingInt = Math.round(Number(ratings) || 5);
  const trustCount = Number(total_reviews) > 0 ? `${total_reviews}` : '12,000+';

  /* breadcrumb crumbs */
  const firstCat = categories?.[0];
  const crumbs: { label: string; href?: string }[] = [
    { label: 'Home', href: Routes.home },
    { label: type?.name ?? 'Shop', href: type?.slug ? `/${type.slug}` : Routes.home },
    ...(firstCat ? [{ label: firstCat.name, href: `/${type?.slug}/search?category=${firstCat.slug}` }] : [{ label: 'All Products', href: type?.slug ? `/${type.slug}` : Routes.home }]),
    { label: name },
  ];

  /* accordion */
  const pa = (product as any)?.plant_attribute;
  const careSpecs: { label: string; value?: string | null }[] = pa
    ? [
        { label: 'Sunlight', value: pa.sunlight },
        { label: 'Water', value: pa.water_requirement },
        { label: 'Temperature', value: pa.temperature_range ? `${pa.temperature_range} °C` : null },
        { label: 'Placement', value: pa.indoor_outdoor },
        { label: 'Height', value: pa.height_range },
        { label: 'Growth rate', value: pa.growth_rate },
        { label: 'Native region', value: pa.native_region },
      ].filter((s) => s.value)
    : [];

  const accordionItems: AccordionItem[] = [];
  if (content) {
    accordionItems.push({
      title: 'Description',
      content: <ClampedDescription html={content} />,
    });
  }
  if (careSpecs.length) {
    accordionItems.push({
      title: 'Plant Care',
      content: (
        <dl className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
          {careSpecs.map((s) => (
            <div key={s.label} className="flex justify-between gap-4 border-b border-kraft-200/60 py-1.5 last:border-0">
              <dt className="text-forest-800">{s.label}</dt>
              <dd className="text-right font-medium text-stone-700">{s.value}</dd>
            </div>
          ))}
        </dl>
      ),
    });
  }
  accordionItems.push({
    title: 'Size Guide',
    content: <p>We recommend choosing the larger size for a relaxed, comfortable fit and easy repotting room.</p>,
  });
  accordionItems.push({
    title: 'Shipping Information',
    content: <p>Carefully hand-packed and dispatched within 24–48 hours. Same-day delivery available in select cities. Every plant ships with a 30-day healthy-arrival guarantee.</p>,
  });

  return (
    <article className="bg-cream-100">
      <div className="mx-auto w-full max-w-7xl px-4 pb-36 pt-5 sm:px-6 lg:px-10 lg:pb-12">
        {/* breadcrumb */}
        {!isModal && (
          <>
            <nav className="flex flex-wrap items-center gap-2 text-[15px]">
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

        {/* main grid */}
        <div className="mt-7 grid gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <PlantAtHomeGallery gallery={previewImages} productId={id} productName={name} badge={badge} />

          {/* info panel */}
          <div className="flex flex-col">
            <h1
              className={classNames(
                'font-cormorant text-[2.4rem] font-semibold leading-[1.05] tracking-tight text-forest-900 sm:text-[3rem]',
                { 'cursor-pointer transition-colors hover:text-forest-700': isModal },
              )}
              {...(isModal && { onClick: () => navigate(Routes.product(slug)) })}
            >
              {name}
            </h1>

            {/* rating row */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`grid h-[22px] w-[22px] place-items-center rounded-[5px] ${i < ratingInt ? 'bg-forest-600' : 'bg-forest-600/25'}`}>
                    <Star className="h-3 w-3 text-white" />
                  </span>
                ))}
              </div>
              <span className="text-[15px] text-stone-500">Loved by {trustCount}+ plant parents</span>
            </div>

            {/* price row */}
            <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-base text-forest-900/90">Sale price:</span>
              {needsSelection ? (
                <span className="text-2xl font-bold text-forest-900">{minPrice} – {maxPrice}</span>
              ) : (
                <>
                  <span className="text-2xl font-bold text-forest-900">{displayPrice}</span>
                  {displayBasePrice && <del className="text-lg text-stone-400">{displayBasePrice}</del>}
                  {!useVendorPrice && discount && <span className="text-lg font-semibold text-clay-600">{discount} Discount</span>}
                </>
              )}
            </div>

            <div className="mt-5 h-px w-full bg-kraft-300/70" />

            {/* description */}
            {content && (
              <div className="mt-5 react-editor-description text-[15px] leading-7 text-stone-600">
                <Truncate character={180}>{content}</Truncate>
              </div>
            )}

            <div className="mt-5 h-px w-full bg-kraft-300/70" />

            {/* variation pickers */}
            {hasVariations &&
              Object.keys(variations).map((groupName) => {
                const options = variations[groupName] as any[];
                const color = isColorGroup(groupName, options);
                const pot = isPotGroup(groupName);
                const selected = attributes[groupName];
                // pot cards show the price delta vs the cheaper choice
                const potMins = pot
                  ? options.map((o) => minPriceForValue(product?.variation_options as any[], o.value))
                  : [];
                const potBase = pot
                  ? Math.min(...potMins.filter((n): n is number => n != null))
                  : 0;
                return (
                  <div key={groupName} className="mt-6">
                    <p className="mb-3 text-base font-semibold capitalize text-forest-900">
                      {pot ? 'Choose your pot' : `Product ${groupName.replace(/-/g, ' ')}`}
                    </p>
                    {pot ? (
                      <div className="grid grid-cols-2 gap-3">
                        {options.map((o, i) => {
                          const active = selected === o.value;
                          const withPot = /with\s?pot/i.test(o.value) && !/without/i.test(o.value);
                          const delta = potMins[i] != null && Number.isFinite(potBase) ? (potMins[i] as number) - potBase : null;
                          return (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => setAttributes((p: any) => ({ ...p, [groupName]: o.value }))}
                              className={classNames(
                                'flex flex-col items-start gap-1 rounded-2xl border-2 px-4 py-3.5 text-left transition',
                                active
                                  ? 'border-forest-700 bg-forest-700/[0.06] shadow-[0_4px_14px_rgba(22,48,26,0.10)]'
                                  : 'border-kraft-300 bg-white hover:border-forest-500',
                              )}
                            >
                              <span className="flex w-full items-center justify-between">
                                <span
                                  className={classNames(
                                    'grid h-8 w-8 place-items-center rounded-full',
                                    active ? 'bg-forest-700 text-white' : 'bg-sage-100 text-forest-700',
                                  )}
                                >
                                  {withPot ? (
                                    /* plant in pot */
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 11V6" /><path d="M12 6c0-2 1.5-3.5 4-4-.3 2.5-1.8 4-4 4Z" /><path d="M12 8c0-1.6-1.2-2.8-3.2-3.2.2 2 1.4 3.2 3.2 3.2Z" /><path d="M5 11h14l-1 4a4 4 0 0 1-4 3h-4a4 4 0 0 1-4-3l-1-4Z" /></svg>
                                  ) : (
                                    /* bare roots */
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 13V7" /><path d="M12 7c0-2 1.5-3.5 4-4-.3 2.5-1.8 4-4 4Z" /><path d="M12 9c0-1.6-1.2-2.8-3.2-3.2.2 2 1.4 3.2 3.2 3.2Z" /><path d="M12 13c0 2-1 4-2.5 5.5M12 13c0 2 1 4 2.5 5.5M12 13v7" /></svg>
                                  )}
                                </span>
                                {active && (
                                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-forest-700"><path d="m5 13 4 4L19 7" /></svg>
                                )}
                              </span>
                              <span className="text-[13.5px] font-semibold text-forest-900">{o.value}</span>
                              <span className="text-[12px] font-medium text-forest-600">
                                {delta == null ? '' : delta > 0 ? `+₹${delta.toLocaleString('en-IN')}` : 'Included'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : color ? (
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
                                'min-w-[3.25rem] rounded-full border px-5 py-2 text-sm font-medium transition',
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

            {/* vendor availability ("we'll confirm within 6h" when cost = 0) */}
            <VendorAvailabilityNote
              productId={id}
              variationOptionId={isSelected ? selectedVariation?.id : null}
            />

            {/* Delivery timing — local same-city vs courier (never names the vendor) */}
            {fulfillment?.eta_days != null && customerCity && (
              <div className="mt-4 flex items-center gap-2 text-sm text-forest-900">
                <span aria-hidden>🚚</span>
                <span>
                  {fulfillment.fulfillment_mode === 'local' ? (
                    <>
                      <span className="font-semibold">Local delivery</span> to {customerCity} in{' '}
                      ~{fulfillment.eta_days} day{fulfillment.eta_days === 1 ? '' : 's'}.
                    </>
                  ) : (
                    <>
                      Ships to {customerCity} by <span className="font-semibold">courier</span> in{' '}
                      ~{fulfillment.eta_days} day{fulfillment.eta_days === 1 ? '' : 's'}.
                    </>
                  )}
                </span>
              </div>
            )}

            {/* quantity + add to cart */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch">
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
                <span className="min-w-[1.5rem] text-center text-base font-semibold text-forest-900">
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
                disabled={!inStock || needsSelection || verticalBlocked}
                className={classNames(
                  'flex flex-1 items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-base font-semibold text-white transition',
                  !inStock || needsSelection || verticalBlocked
                    ? 'cursor-not-allowed bg-stone-300'
                    : 'bg-ds-btn shadow-[0_14px_30px_-12px_rgba(46,94,42,0.65)] hover:bg-ds-btn-hover',
                )}
              >
                <Bag className="h-5 w-5" />
                {verticalBlocked
                  ? 'Unavailable in your city'
                  : !inStock
                  ? 'Out of Stock'
                  : needsSelection
                  ? 'Select Options'
                  : 'Add to Cart'}
              </button>
            </div>

            {/* Operations Control Center — vertical paused/unavailable in city. */}
            {verticalBlocked ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {verticalMessage}
              </div>
            ) : null}

            {/* Ask AI */}
            {askAiEnabled && (
              <button
                type="button"
                onClick={onAskAi}
                className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-forest-600/30 bg-white/50 px-4 py-2 text-sm font-semibold text-forest-800 transition hover:border-forest-600 hover:bg-white"
              >
                <Spark className="h-4 w-4 text-clay-600" /> Ask AI about this plant
              </button>
            )}
          </div>
        </div>

        {/* additional information */}
        {accordionItems.length > 0 && (
          <div className="mt-14 grid gap-8 border-t border-kraft-300/70 pt-12 lg:mt-20 lg:grid-cols-[0.9fr_1.6fr] lg:gap-16 lg:pt-16">
            <h2 className="font-cormorant text-[2rem] font-semibold leading-tight text-forest-900 sm:text-[2.5rem]">
              Additional information
            </h2>
            <PlantAtHomeAccordion items={accordionItems} />
          </div>
        )}
      </div>

      {/* Sticky mobile Add-to-Cart bar (Flipkart/Amazon-style). Sits just above the
          app's bottom navigation (h-14) and is hidden on lg+ where the inline CTA
          is always visible. Reuses the same handler + disabled states as the inline
          button so behaviour can't drift. */}
      <div className="fixed inset-x-0 bottom-14 z-20 flex items-center gap-3 border-t border-kraft-300/70 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-16px_rgba(0,0,0,0.45)] backdrop-blur md:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] uppercase tracking-wide text-stone-400">
            {product?.name}
          </p>
          <p className="text-lg font-semibold leading-tight text-forest-900">
            {displayPrice}
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inStock || needsSelection || verticalBlocked}
          aria-label="Add to cart"
          className={classNames(
            'flex min-h-[44px] items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition',
            !inStock || needsSelection || verticalBlocked
              ? 'cursor-not-allowed bg-stone-300'
              : 'bg-ds-btn hover:bg-ds-btn-hover',
          )}
        >
          <Bag className="h-4 w-4" />
          {verticalBlocked
            ? 'Unavailable'
            : !inStock
            ? 'Out of Stock'
            : needsSelection
            ? 'Select Options'
            : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
};

export default PlantAtHomeProductDetails;
