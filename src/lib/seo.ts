/** Titles go through the root template "%s | PlantAtHome" — drop a brand suffix
 *  an admin (or a page) already typed, or Google sees "… | PlantAtHome | PlantAtHome". */
export const pageTitle = (t: string) => t.replace(/\s*[|—–-]\s*Plant\s?At\s?Home\s*$/i, '').trim();
