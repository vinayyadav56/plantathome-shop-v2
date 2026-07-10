'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  addCartItem,
  getConfiguration,
  priceQuote,
  validateSelection,
} from '@/lib/api/endpoints';
import { qk } from '@/lib/query-keys';
import { useSession } from '@/lib/store/session';
import type { Product } from '@/lib/api/types';

/** Drives the config → nursery-resolution → live quote → validate-on-add flow for
 *  a product page. Nursery is server-resolved from the selected city (config meta). */
export function usePdp(product: Product) {
  const router = useRouter();
  const qc = useQueryClient();
  const city = useSession((s) => s.city);
  const user = useSession((s) => s.user);
  const ready = useSession((s) => s.ready);
  const setPendingCart = useSession((s) => s.setPendingCart);

  const variants = product.variants ?? [];
  const [variantUuid, setVariantUuid] = useState<string | null>(variants[0]?.uuid ?? null);
  const [selection, setSelection] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);
  const [violations, setViolations] = useState<{ group: string; message: string }[]>([]);

  // Configuration (needs a city so the server can resolve the fulfilling nursery).
  const configQ = useQuery({
    queryKey: qk.config(product.uuid, variantUuid ?? '-', city),
    queryFn: () => getConfiguration(product.uuid, variantUuid!, city),
    enabled: !!variantUuid && !!city,
  });
  const config = configQ.data ?? null;
  const nursery = config?.meta.nursery_id ?? null;

  // Seed selection from each group's default options when config (re)loads.
  useEffect(() => {
    if (!config) return;
    const seed: Record<string, string[]> = {};
    for (const g of config.groups) {
      const defaults = g.options.filter((o) => o.is_default).map((o) => o.uuid);
      if (defaults.length) seed[g.code] = g.select_type === 'single' ? [defaults[0]] : defaults;
    }
    setSelection(seed);
    setViolations([]);
  }, [config]);

  const options = useMemo(() => Object.values(selection).flat(), [selection]);

  // Authoritative live price (server recomputes; client never sends a price).
  const quoteQ = useQuery({
    queryKey: qk.quote(variantUuid ?? '-', nursery, city, qty, options),
    queryFn: () =>
      priceQuote({ variant_uuid: variantUuid!, nursery_id: nursery!, qty, city, options }),
    enabled: !!variantUuid && !!nursery,
    placeholderData: (prev) => prev,
  });

  function toggleOption(group: { code: string; select_type: 'single' | 'multi' }, optionUuid: string) {
    setViolations([]);
    setSelection((prev) => {
      const cur = prev[group.code] ?? [];
      if (group.select_type === 'single') return { ...prev, [group.code]: [optionUuid] };
      const next = cur.includes(optionUuid) ? cur.filter((o) => o !== optionUuid) : [...cur, optionUuid];
      return { ...prev, [group.code]: next };
    });
  }

  const add = useMutation({
    mutationFn: async () => {
      if (!variantUuid || !nursery) throw new Error('Select a variant and city first.');

      // Server-authoritative validation before we build a cart line.
      const v = await validateSelection(product.uuid, {
        variant: variantUuid,
        selection,
        city,
        nursery,
      });
      if (!v.valid) {
        setViolations(v.violations.map((x) => ({ group: x.group, message: x.message })));
        throw new Error('Please fix the highlighted options.');
      }

      const intent = { variant_uuid: variantUuid, nursery_id: nursery, selection, qty, city };

      // Require login before cart: stash the resolved intent + bounce to /login.
      if (ready && !user) {
        setPendingCart({ ...intent, slug: product.uuid });
        router.push(`/login?next=/products/${product.uuid}&resume=1`);
        return null;
      }

      await addCartItem(intent);
      await qc.invalidateQueries({ queryKey: qk.cart });
      return 'added' as const;
    },
  });

  return {
    variants,
    variantUuid,
    setVariant: (u: string) => {
      setVariantUuid(u);
      setViolations([]);
    },
    city,
    config,
    configLoading: configQ.isLoading,
    nursery,
    selection,
    toggleOption,
    qty,
    setQty,
    options,
    quote: quoteQ.data ?? null,
    quoteFetching: quoteQ.isFetching,
    violations,
    add,
  };
}
