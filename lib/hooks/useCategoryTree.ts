'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { listCategories } from '@/lib/api/endpoints';
import { qk } from '@/lib/query-keys';
import type { Category } from '@/lib/api/types';

export type CatNode = Category & { children: CatNode[] };

/** Fetches the flat category list and derives a nested tree + slug→uuid + uuid→node maps. */
export function useCategoryTree() {
  const q = useQuery({ queryKey: qk.categories, queryFn: listCategories, staleTime: 5 * 60_000 });

  const { tree, bySlug, byUuid, roots } = useMemo(() => {
    const flat = q.data ?? [];
    const byUuid = new Map<string, CatNode>();
    const bySlug = new Map<string, CatNode>();
    for (const c of flat) {
      const node: CatNode = { ...c, children: [] };
      byUuid.set(c.uuid, node);
      bySlug.set(c.slug, node);
    }
    const roots: CatNode[] = [];
    for (const node of byUuid.values()) {
      const parent = node.parent_uuid ? byUuid.get(node.parent_uuid) : null;
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
    const bySort = (a: CatNode, b: CatNode) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name);
    roots.sort(bySort);
    for (const n of byUuid.values()) n.children.sort(bySort);
    return { tree: flat, bySlug, byUuid, roots };
  }, [q.data]);

  return { ...q, tree, bySlug, byUuid, roots };
}
