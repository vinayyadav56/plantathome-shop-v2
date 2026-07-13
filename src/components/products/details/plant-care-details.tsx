import { Icon } from '@/components/storefront/icons';

interface PlantAttribute {
  scientific_name?: string | null;
  hindi_name?: string | null;
  indoor_outdoor?: string | null;
  temperature_range?: string | null;
  height_range?: string | null;
  life_span?: string | null;
  sunlight?: string | null;
  water_requirement?: string | null;
  benefits?: string | null;
  medicinal_uses?: string | null;
  air_purifying?: boolean | null;
  pet_friendly?: boolean | null;
  growth_rate?: string | null;
  flowering_season?: string | null;
  native_region?: string | null;
}

const SPEC_ICON: Record<string, keyof typeof Icon> = {
  Sunlight: 'sun',
  Water: 'droplet',
  Temperature: 'spark',
  Placement: 'leaf',
  Height: 'leaf',
  'Life span': 'shield',
  'Growth rate': 'spark',
  Flowering: 'leaf',
  'Native region': 'leaf',
};

export default function PlantCareDetails({
  plantAttribute,
}: {
  plantAttribute?: PlantAttribute | null;
}) {
  if (!plantAttribute) return null;
  const a = plantAttribute;

  const specs: { label: string; value?: string | null }[] = [
    { label: 'Sunlight', value: a.sunlight },
    { label: 'Water', value: a.water_requirement },
    { label: 'Temperature', value: a.temperature_range ? `${a.temperature_range} °C` : null },
    { label: 'Placement', value: a.indoor_outdoor },
    { label: 'Height', value: a.height_range },
    { label: 'Life span', value: a.life_span },
    { label: 'Growth rate', value: a.growth_rate },
    { label: 'Flowering', value: a.flowering_season },
    { label: 'Native region', value: a.native_region },
  ].filter((s) => s.value);

  const hasAnything =
    specs.length > 0 ||
    a.scientific_name ||
    a.benefits ||
    a.medicinal_uses ||
    a.air_purifying ||
    a.pet_friendly;

  if (!hasAnything) return null;

  return (
    <section className="border-b border-border-200 border-opacity-70 px-5 py-8 lg:px-16 lg:py-12">
      <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-heading text-lg font-bold tracking-tight text-forest md:text-2xl">
          Plant care &amp; details
        </h2>
        {a.scientific_name && (
          <span className="text-sm italic text-body md:text-base">
            {a.scientific_name}
            {a.hindi_name ? ` · ${a.hindi_name}` : ''}
          </span>
        )}
      </div>

      {/* quick badges */}
      {(a.air_purifying || a.pet_friendly) && (
        <div className="mb-6 flex flex-wrap gap-2">
          {a.air_purifying && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3.5 py-1.5 text-xs font-semibold text-forest">
              <Icon.leaf className="h-3.5 w-3.5" /> Air-purifying
            </span>
          )}
          {a.pet_friendly && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3.5 py-1.5 text-xs font-semibold text-forest">
              <Icon.shield className="h-3.5 w-3.5" /> Pet-friendly
            </span>
          )}
        </div>
      )}

      {/* spec grid */}
      {specs.length > 0 && (
        <div className="pah-rail [--rail-w:46%] sm:[--rail-w:42%] lg:[--rail-w:calc((100%_-_36px)/4)] grid grid-cols-2 gap-3">
          {specs.map((s) => {
            const I = Icon[SPEC_ICON[s.label] ?? 'leaf'];
            return (
              <div
                key={s.label}
                className="rounded-2xl border border-border-200 bg-light p-4"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-mint text-forest">
                  <I className="h-4 w-4" />
                </span>
                <div className="mt-3 text-[11px] font-bold uppercase tracking-wider text-muted">
                  {s.label}
                </div>
                <div className="mt-0.5 text-sm font-semibold text-heading">
                  {s.value}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* benefits + medicinal */}
      {(a.benefits || a.medicinal_uses) && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {a.benefits && a.benefits.toLowerCase() !== 'none' && (
            <div className="rounded-2xl bg-mintsoft p-5">
              <h3 className="font-heading text-sm font-bold text-forest">Benefits</h3>
              <p className="mt-1.5 text-sm leading-6 text-body">{a.benefits}</p>
            </div>
          )}
          {a.medicinal_uses && a.medicinal_uses.toLowerCase() !== 'none' && (
            <div className="rounded-2xl bg-mintsoft p-5">
              <h3 className="font-heading text-sm font-bold text-forest">
                Medicinal uses
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-body">
                {a.medicinal_uses}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
