/** Titles go through the root template "%s | PlantAtHome" — drop a brand suffix
 *  an admin (or a page) already typed, or Google sees "… | PlantAtHome | PlantAtHome". */
export const pageTitle = (t: string) => t.replace(/\s*[|—–-]\s*Plant\s?At\s?Home\s*$/i, '').trim();

/** Product <title> (before the "| PlantAtHome" template): plants get the buying
 *  intent ("Buy Monstera Deliciosa Plant Online") when it fits Google's ~60
 *  chars; pots/tools and long names keep the bare name. Admin seo_title wins
 *  upstream of this. */
export function productTitle(name: string, isPlant: boolean): string {
  const fits = (t: string) => t.length + ' | PlantAtHome'.length <= 60;
  if (!isPlant) return name;
  const noun = /\bplants?\b/i.test(name) ? '' : ' Plant';
  return [`${name}${noun} Online | Buy & Get Delivered`, `Buy ${name}${noun} Online`].find(fits) ?? name;
}
