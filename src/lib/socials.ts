/**
 * Social profile URLs — one source, consumed by the footer's icon row and the
 * homepage Organization JSON-LD (sameAs). Change a handle here and both stay
 * in step.
 */
export const SOCIAL_URLS = {
  instagram: 'https://instagram.com/plantathome',
  facebook: 'https://facebook.com/plantathome',
  youtube: 'https://youtube.com/@plantathome',
  pinterest: 'https://pinterest.com/plantathome',
} as const;

export const SOCIAL_URL_LIST: string[] = Object.values(SOCIAL_URLS);
