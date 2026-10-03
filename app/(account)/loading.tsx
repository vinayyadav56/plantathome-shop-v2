import { BrandSpinner } from '@/components/ui/plant-loader';

/**
 * Fills only the account content pane — header and sidebar persist via the
 * group layout while a tab's payload loads. A plain ring, not the leaf loader:
 * the account area carries no botanical decoration (owner brief 2026-10-03).
 */
export default function Loading() {
  return (
    <div className="grid min-h-[40vh] w-full place-items-center py-16">
      <BrandSpinner className="h-6 w-6 text-forest-700" />
    </div>
  );
}
