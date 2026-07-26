import { PlantLoader } from '@/components/ui/plant-loader';

/**
 * Root Suspense fallback. There was no `loading.tsx` anywhere in the App Router,
 * so a navigation that suspended showed the previous page frozen with no
 * feedback.
 *
 * NOTE on current effectiveness: the settings gate in
 * `components/maintenance/layout.tsx` still renders a blocking spinner above
 * {children}, so today this slot is rarely the thing a customer sees. It is
 * added now so the boundary exists and is styled; removing that gate is the
 * change that makes it matter (audit item 5).
 */
export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center bg-cream px-6 py-24">
      <PlantLoader size="lg" label="Growing your page…" />
    </div>
  );
}
