/**
 * Coarse "looks automated" test used by proxy.ts to decide whether a page
 * request deserves a server-side tracking ping (non-JS crawlers never run the
 * SDK). This is NOT the classifier — the API names and types the bot. It only
 * has to be a SUBSET of what the API calls a bot (config/tracking.php), so a
 * client can never be counted by both legs.
 */
export const COARSE_BOT_RE =
  /bot|crawl|spider|slurp|scrap|fetch|headless|lighthouse|curl|wget|python|java\/|go-http|okhttp|axios|node-fetch|undici|libwww|httpclient|httpx|aiohttp|postman|preview|facebookexternalhit|whatsapp|telegram|bytespider|gptbot|claudebot|perplexity|phantomjs|selenium|puppeteer|playwright/i;

export function looksAutomated(ua: string | null | undefined): boolean {
  const s = (ua ?? '').trim();
  return s === '' || COARSE_BOT_RE.test(s);
}
