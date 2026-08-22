/**
 * The ONE column ladder every product-card grid uses.
 *
 * Three different ladders had grown up independently — the listing grid stepped
 * 2 → 3 (at 900px) → 4 (xl), the popular/best-selling rails used
 * `auto-fill minmax()` whose minimum SHRANK to 200px at `lg`, and the featured row
 * jumped straight to 3 at `sm`. They disagreed at every iPad width, which is what made
 * the sections look unrelated on a tablet:
 *
 *   width  listing  rails  featured
 *   768      2        2       3
 *   834      2        2       3
 *   1024     3        4       3
 *   1194     3        5       3      <- rails showed 5 cramped cards beside 3 large ones
 *   1366     4        5       3
 *
 * The `lg:minmax(200px)` step was the worst of it: it lowered the minimum card width
 * exactly at 1024, the iPad landscape width, so the rails fragmented into narrow cards
 * precisely where every other section widened.
 *
 * Fixed steps, not `auto-fill`: auto-fill derives the count from available width, so two
 * sections with different padding produce different counts at the same viewport. Fixed
 * columns are identical everywhere by construction, which is the property being fixed.
 *
 * 900px is a deliberate custom stop rather than `lg` (1024): iPad portrait at 834 stays
 * 2-up (3-up is cramped there), while landscape at 1024+ gets 3-up.
 *
 * Import this instead of writing grid-cols on a product grid — a fourth ladder is how the
 * first three happened.
 */
export const PRODUCT_GRID_CLASS =
  'grid grid-cols-2 gap-3 gap-y-5 sm:gap-4 md:gap-5 md:gap-y-8 min-[900px]:grid-cols-3 lg:gap-6 xl:grid-cols-4 xl:gap-8 xl:gap-y-12 2xl:grid-cols-5';
