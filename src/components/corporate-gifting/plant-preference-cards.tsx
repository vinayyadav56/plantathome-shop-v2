'use client';

import type { UseFormRegister } from 'react-hook-form';
import SafeImage from '@/components/ui/safe-image';
import { Check } from '@/components/ui/icon';
import { FORM, PLANT_PREFS } from './content';
import type { EnquiryValues } from './enquiry-section';

/**
 * Step 3: six photo tiles, each a REAL checkbox — native keyboard and screen-reader
 * semantics, and RHF returns the ticked keys as string[]. The tile styles itself off its own
 * (visually hidden) checkbox with `has-[:checked]`, so the tick mark inside it can follow too;
 * `peer-*` only reaches siblings.
 */
export default function PlantPreferenceCards({
  register,
  error,
}: {
  register: UseFormRegister<EnquiryValues>;
  error?: string;
}) {
  return (
    <fieldset aria-invalid={error ? 'true' : undefined}>
      <legend className="text-sm font-semibold leading-none text-body-dark">{FORM.prefsLegend}</legend>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-500">
          {error}
        </p>
      )}
      {/* 6-up only from xl: at lg a tile is 88px and the three-word labels cross its border. */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {PLANT_PREFS.map((p) => (
          <label
            key={p.key}
            className="group block cursor-pointer rounded-2xl border border-kraft-200 bg-white p-2 transition-colors has-[:checked]:border-forest-700 has-[:checked]:bg-sage-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-forest-700 has-[:focus-visible]:ring-offset-1"
          >
            <input type="checkbox" value={p.key} className="sr-only" {...register('plant_preferences')} />
            <SafeImage
              src={p.image}
              width={600}
              height={400}
              quality={65}
              sizes="(min-width: 1024px) 140px, 45vw"
              className="aspect-[3/2] w-full rounded-control bg-sage-50 object-cover"
              alt=""
            />
            <span className="mt-2 flex items-start gap-2">
              <span
                aria-hidden
                className="mt-px grid h-4 w-4 shrink-0 place-items-center rounded-full border border-border-base bg-white text-transparent group-has-[:checked]:border-forest-700 group-has-[:checked]:bg-forest-700 group-has-[:checked]:text-white"
              >
                <Check size={12} />
              </span>
              <span className="break-words text-[13px] font-medium leading-snug text-forest-900 hyphens-auto">{p.label}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
