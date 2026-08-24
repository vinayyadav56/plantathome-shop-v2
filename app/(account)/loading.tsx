import { PlantLoader } from '@/components/ui/plant-loader';

/**
 * Fills only the account content pane — header and sidebar persist via the
 * group layout while a tab's payload loads.
 */
export default function Loading() {
  return (
    <div className="grid min-h-[40vh] w-full place-items-center py-16">
      <PlantLoader size="lg" label="Growing your page…" />
    </div>
  );
}
