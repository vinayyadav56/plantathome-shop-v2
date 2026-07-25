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

  // Price arrives as a "min,max" range string from the slider. The products
  // endpoint expects SEPARATE min_price / max_price search params — split and
  // send both so the upper bound actually filters. Previously the whole
  // "min,max" string was sent as min_price (and max_price was never sent), so
  // the slider's max had no effect on results.
  const [minPrice, maxPrice] =
    typeof price === 'string' && price.length ? price.split(',') : [];

  return {
    limit,
    ...(minPrice !== undefined && minPrice !== '' && { min_price: minPrice }),
    ...(maxPrice !== undefined && maxPrice !== '' && { max_price: maxPrice }),
    ...(name && { name: name.toString() }),
    ...(categories && { categories: categories.toString() }),
    ...(searchType && { type: searchType.toString() }),
    ...(searchQuery && { name: searchQuery.toString() }),
    ...(text && { name: text.toString() }),
    ...restOptions,
  };
};
