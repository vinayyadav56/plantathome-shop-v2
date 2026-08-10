/**
 * Size-guide content, shared by the SIZE_GUIDE modal (opened from the size
 * picker) and the below-the-fold "Size guide" page section. Renders the
 * per-product chart image when one is uploaded, otherwise the standard
 * PlantAtHome size explainer built from the product's size options.
 */
export function SizeGuideContent({
  sizeGuide,
  sizes,
  name,
}: {
  sizeGuide?: { original?: string } | null;
  sizes: { id?: number | string; value: string }[];
  name?: string;
}) {
  if (sizeGuide?.original) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={sizeGuide.original}
        alt={`${name ?? 'Product'} size guide`}
        loading="lazy"
        className="h-auto w-full rounded-2xl border border-kraft-300/70 bg-white"
      />
    );
  }
  return (
    <dl className="divide-y divide-[#ECECEC] text-[13px]">
      {sizes.map((s) => {
        const v = String(s?.value ?? '').toLowerCase();
        const note = v.includes('small')
          ? 'Compact — typically a 4–6" nursery pot; sits happily on desks and shelves.'
          : v.includes('medium')
            ? 'Mid-size — typically an 8–10" nursery pot; tabletops and bright corners.'
            : v.includes('large') || v.includes('xl')
              ? 'Statement — typically a 12"+ nursery pot; a floor plant with presence.'
              : 'Sized as delivered by our nursery partners for this plant.';
        return (
          <div key={s?.id ?? s?.value} className="flex items-start gap-4 py-2.5 first:pt-0 last:pb-0">
            <dt className="w-16 shrink-0 font-semibold text-forest-900">{s?.value}</dt>
            <dd className="text-[#5B5B5B]">{note}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export default SizeGuideContent;
