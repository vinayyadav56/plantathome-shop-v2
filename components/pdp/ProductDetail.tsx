'use client';

import { usePdp } from '@/lib/hooks/usePdp';
import { formatMoney } from '@/lib/money';
import { useSession } from '@/lib/store/session';
import type { Product } from '@/lib/api/types';

export function ProductDetail({ product }: { product: Product }) {
  const pdp = usePdp(product);
  const cityName = useSession((s) => s.cityName);
  const img = product.media?.[0]?.url;

  return (
    <div className="container-wrap grid gap-10 py-10 md:grid-cols-2">
      {/* Gallery */}
      <div className="relative aspect-square overflow-hidden rounded-card bg-gradient-to-br from-forest-soft to-cream">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-forest-accent/30">
            <svg width="96" height="96" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 20c0-5 2.8-8.5 7-10-.3 5-3.4 8.5-7 10Zm0 0c0-4.2-2.5-7.3-6.2-8.5C6.1 16 9 19 12 20Z"
                fill="currentColor"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-6">
        <div className="space-y-1.5">
          {product.category?.name && (
            <p className="text-xs font-semibold uppercase tracking-wide text-forest-accent">
              {product.category.name}
            </p>
          )}
          <h1 className="font-heading text-4xl font-semibold leading-tight text-forest-ink">{product.name}</h1>
          {product.botanical_name && <p className="text-lg italic text-forest-ink/55">{product.botanical_name}</p>}
          {product.hindi_name && <p className="text-forest-ink/70">{product.hindi_name}</p>}
        </div>

        {product.description && <p className="leading-relaxed text-forest-ink/75">{product.description}</p>}

        {/* Size / variant */}
        {pdp.variants.length > 1 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-forest-ink">Size</p>
            <div className="flex flex-wrap gap-2">
              {pdp.variants.map((v) => (
                <button
                  key={v.uuid}
                  onClick={() => pdp.setVariant(v.uuid)}
                  className={`rounded-pill border px-4 py-1.5 text-sm transition ${
                    pdp.variantUuid === v.uuid
                      ? 'border-forest bg-forest text-cream'
                      : 'border-forest/25 text-forest hover:border-forest/50'
                  }`}
                >
                  {v.name || v.size_code || 'Standard'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* City gate */}
        {!pdp.city ? (
          <div className="rounded-card border border-forest-accent/30 bg-forest-soft/50 p-4 text-sm text-forest-ink/80">
            Choose your <b>city</b> (top-right) to see the price and delivery for this plant.
          </div>
        ) : pdp.configLoading ? (
          <div className="h-24 animate-pulse rounded-card bg-forest-soft/60" />
        ) : !pdp.nursery ? (
          <div className="rounded-card border border-clay/30 bg-clay/5 p-4 text-sm text-clay">
            Sorry — no nursery delivers this plant to {cityName ?? 'your city'} yet.
          </div>
        ) : (
          <>
            {/* Option groups */}
            {pdp.config?.groups.map((g) => {
              const err = pdp.violations.find((v) => v.group === g.code);
              return (
                <div key={g.uuid}>
                  <p className="mb-2 text-sm font-semibold text-forest-ink">
                    {g.name}
                    {g.required && <span className="text-clay"> *</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {g.options.map((o) => {
                      const selected = (pdp.selection[g.code] ?? []).includes(o.uuid);
                      return (
                        <button
                          key={o.uuid}
                          disabled={o.in_stock === false}
                          onClick={() => pdp.toggleOption(g, o.uuid)}
                          className={`rounded-pill border px-4 py-1.5 text-sm transition disabled:opacity-40 ${
                            selected
                              ? 'border-forest-accent bg-forest-soft text-forest'
                              : 'border-forest/20 text-forest-ink/80 hover:border-forest/40'
                          }`}
                        >
                          {o.name}
                          {o.price && o.price.amount_minor > 0 && (
                            <span className="ml-1.5 text-forest-ink/50">+{formatMoney(o.price)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {err && <p className="mt-1 text-xs text-clay">{err.message}</p>}
                </div>
              );
            })}

            {/* Qty + price + add */}
            <div className="flex items-center gap-4">
              <div className="flex items-center rounded-pill border border-forest/25">
                <button
                  onClick={() => pdp.setQty(Math.max(1, pdp.qty - 1))}
                  className="px-3 py-1.5 text-forest"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-medium">{pdp.qty}</span>
                <button
                  onClick={() => pdp.setQty(pdp.qty + 1)}
                  className="px-3 py-1.5 text-forest"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <div className="text-2xl font-semibold text-forest-ink" data-testid="pdp-price">
                {pdp.quote ? formatMoney(pdp.quote.total) : '—'}
              </div>
            </div>

            <button
              onClick={() => pdp.add.mutate()}
              disabled={pdp.add.isPending || !pdp.quote}
              className="btn-cta w-full sm:w-auto"
              data-testid="add-to-cart"
            >
              {pdp.add.isPending ? 'Adding…' : 'Add to cart'}
            </button>

            {pdp.add.isError && (
              <p className="text-sm text-clay">{(pdp.add.error as Error)?.message}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
