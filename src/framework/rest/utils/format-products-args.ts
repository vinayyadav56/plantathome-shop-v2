import { ProductQueryOptions } from '@/types';

export const formatProductsArgs = (options?: Partial<ProductQueryOptions>) => {
  // Destructure
  const {
    limit = 30,
    price,
    categories,
    name,
    searchType,
    searchQuery,
    text,
    ...restOptions
  } = options || {};

  return {
    limit,
    // Price is a "min,max" range string. Send the WHOLE range as one min_price
    // field — do NOT split into separate min_price/max_price. The products
    // endpoint's min_price is a Prettus `between` filter: it does
    // explode(',', value) and only runs whereBetween when it gets a 2-element
    // pair. "min_price:200,800" -> [200,800] -> whereBetween(min_price,[200,800])
    // (works). Splitting to "min_price:200;max_price:800" yields 1-element
    // arrays -> value=null -> the whereBetween is SKIPPED for both, silently
    // disabling price filtering (verified against staging: a split high range
    // returned all rows, the comma pair returned the correct subset).
    ...(price && { min_price: price as string }),
    ...(name && { name: name.toString() }),
    ...(categories && { categories: categories.toString() }),
    ...(searchType && { type: searchType.toString() }),
    ...(searchQuery && { name: searchQuery.toString() }),
    ...(text && { name: text.toString() }),
    ...restOptions,
  };
};
