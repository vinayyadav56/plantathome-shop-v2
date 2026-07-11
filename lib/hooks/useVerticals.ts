'use client';

import { useMemo } from 'react';
import { VERTICALS, type VerticalMeta } from '@/lib/verticals';
import { useCategoryTree, type CatNode } from './useCategoryTree';

export type ResolvedVertical = VerticalMeta & {
  /** live category uuid (null until the catalog has this world's top-level category) */
  categoryUuid: string | null;
  /** subcategories of this world, from the live tree */
  subcategories: CatNode[];
  /** the world's whole category subtree (top + all descendant uuids) for product scoping */
  categoryUuids: string[];
  /** true when there's no live category or it's flagged coming-soon */
  isComingSoon: boolean;
};

function collectUuids(node: CatNode | undefined): string[] {
  if (!node) return [];
  const out = [node.uuid];
  for (const c of node.children) out.push(...collectUuids(c));
  return out;
}

/** Joins static vertical presentation with the live category tree. */
export function useVerticals() {
  const { bySlug, isLoading } = useCategoryTree();

  const verticals = useMemo<ResolvedVertical[]>(() => {
    return VERTICALS.map((v) => {
      const node = bySlug.get(v.categorySlug);
      return {
        ...v,
        categoryUuid: node?.uuid ?? null,
        subcategories: node?.children ?? [],
        categoryUuids: collectUuids(node),
        isComingSoon: v.comingSoon || !node,
      };
    });
  }, [bySlug]);

  return { verticals, isLoading };
}

export function useVertical(slug: string): ResolvedVertical | undefined {
  const { verticals } = useVerticals();
  return verticals.find((v) => v.key === slug);
}
