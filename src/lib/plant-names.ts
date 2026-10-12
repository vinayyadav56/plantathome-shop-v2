/**
 * The Hindi name with its Hinglish spelling — "तुलसी (Tulsi)" — or whichever one a
 * plant has (owner 2026-10-12: show both).
 */
export function hindiNames(pa?: { hindi_name?: string | null; hinglish_name?: string | null } | null): string {
  const hindi = pa?.hindi_name?.trim() || '';
  const hinglish = pa?.hinglish_name?.trim() || '';
  if (!hindi) return hinglish;
  if (!hinglish || hinglish.toLowerCase() === hindi.toLowerCase()) return hindi;
  return `${hindi} (${hinglish})`;
}
