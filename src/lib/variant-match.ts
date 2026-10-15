/**
 * Variant selection, shared by the product page, its size sheet and "Frequently bought together".
 *
 * A variant row's identity is its (axis name, value) pairs from `variation_options[].options`,
 * compared case-insensitively — never by position, and never by sorted values alone: two axes
 * can share a value ("6 in" blade × "6 in" handle), which picked the wrong row and price.
 */
type AxisValue = { value: string; attribute?: { name?: string | null } | null };
/** getVariations(product.variations): each axis's values, keyed by attribute slug. */
export type Groups = Record<string, AxisValue[]>;
/** The shopper's picks, keyed by attribute slug (the AttributesProvider state). */
export type Picks = Record<string, string | undefined>;
export type VariantRow = {
  id: number | string;
  options?: { name?: string | null; value?: string | null }[] | null;
  is_disable?: boolean | number | null;
  city_available?: boolean | null;
};

const norm = (s: unknown) => String(s ?? '').trim().toLowerCase();
const nameOf = (groups: Groups, axis: string) => norm(groups[axis]?.[0]?.attribute?.name);

/** The row's value on `axis`, spelled as the axis spells it; undefined = the row has none. */
function valueOn(row: VariantRow, groups: Groups, axis: string): string | undefined {
  const values = groups[axis] ?? [];
  const opts = row.options ?? [];
  const opt =
    opts.find((o) => nameOf(groups, axis) !== '' && norm(o.name) === nameOf(groups, axis)) ??
    // An axis renamed since the row was saved: by value, among the options no other axis names.
    opts.find(
      (o) =>
        values.some((v) => norm(v.value) === norm(o.value)) &&
        !Object.keys(groups).some((k) => k !== axis && norm(o.name) === nameOf(groups, k)),
    );
  if (opt?.value == null) return undefined;
  return values.find((v) => norm(v.value) === norm(opt.value))?.value ?? String(opt.value);
}

const has = (row: VariantRow, groups: Groups, axis: string, value: unknown) => {
  const v = valueOn(row, groups, axis);
  return v != null && norm(v) === norm(value);
};

/** Switched on, and not flagged unavailable — the flag is trusted only while some row is flagged
 *  available (fail-open: a city or seller with nothing flagged hides nothing). */
export function sellable(row: VariantRow, rows: VariantRow[]): boolean {
  if (Number(row.is_disable)) return false;
  return row.city_available !== false || !rows.some((r) => r.city_available === true);
}

/** The row matching the picks on EVERY axis (a sellable one first); undefined = an incomplete
 *  pick, or a combination no row has. */
export function findVariant(rows: VariantRow[], groups: Groups, sel: Picks): VariantRow | undefined {
  const axes = Object.keys(groups);
  if (!axes.length || axes.some((k) => sel[k] == null)) return undefined;
  const hits = rows.filter((r) => axes.every((k) => has(r, groups, k, sel[k])));
  return hits.find((r) => sellable(r, rows)) ?? hits[0];
}

/** Values of `axis` that still reach a sellable row, given the picks on the OTHER axes. */
export function availableValues(rows: VariantRow[], groups: Groups, sel: Picks, axis: string): Set<string> {
  const others = Object.keys(groups).filter((k) => k !== axis && sel[k] != null);
  const out = new Set<string>();
  for (const r of rows) {
    if (!sellable(r, rows) || !others.every((k) => has(r, groups, k, sel[k]))) continue;
    const v = valueOn(r, groups, axis);
    if (v != null) out.add(v);
  }
  return out;
}

/** Pick `value` on `axis`. Every other pick stays only while a sellable row still has it together
 *  with the new pick and the picks kept before it, so what is left always exists. A value no
 *  sellable row has (shown only when its whole axis has none) keeps the other picks, so the
 *  selection can still complete and the CTA say why it can't be bought. */
export function pick(rows: VariantRow[], groups: Groups, sel: Picks, axis: string, value: string): Picks {
  if (!availableValues(rows, groups, {}, axis).has(value)) return { ...sel, [axis]: value };
  const next: Picks = { [axis]: value };
  for (const k of Object.keys(groups)) {
    if (k === axis || sel[k] == null) continue;
    if (availableValues(rows, groups, next, k).has(String(sel[k]))) next[k] = sel[k];
  }
  return next;
}
