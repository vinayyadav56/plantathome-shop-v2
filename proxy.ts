import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';
import { looksAutomated } from '@/lib/analytics/bot-ua';

/**
 * The crawler leg of visitor tracking.
 *
 * Most crawlers (GPTBot, AhrefsBot, bingbot, curl…) never execute JavaScript,
 * so the browser SDK (src/lib/analytics/track.ts) cannot see them. For page
 * requests whose User-Agent looks automated — or is empty — this fires ONE
 * fire-and-forget ping to the API's crawl endpoint, which classifies, names
 * and stores the visit as bot traffic. The response is never touched and
 * never waits: `waitUntil` lets the ping finish after the page is served.
 *
 * Humans cost one regex test per request here, nothing else.
 *
 * Geo + IP come from the edge in front of this box: Cloudflare in production
 * (cf-connecting-ip, cf-ipcountry, cf-ipcity with the free "Add visitor
 * location headers" transform), Vercel's x-vercel-ip-* on staging.
 */
export const config = {
  matcher: [
    // Everything except Next internals, the API proxy, the service worker and static assets.
    '/((?!_next/|rest-api/|api/|sw\\.js|favicon|.*\\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|map|json|woff2?|ttf|otf|webmanifest)$).*)',
  ],
};

function clientIp(req: NextRequest): string | null {
  const h = req.headers;
  return (
    h.get('cf-connecting-ip') ||
    h.get('x-real-ip') ||
    (h.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    null
  );
}

function dec(v: string | null): string | null {
  if (!v) return null;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export function proxy(req: NextRequest, event: NextFetchEvent) {
  try {
    const h = req.headers;
    // Client-side navigations fetch RSC payloads with these headers; prefetches too.
    // Neither is a page view a crawler makes, and counting them would inflate humans.
    if (h.get('rsc') || h.get('next-router-prefetch') || h.get('purpose') === 'prefetch') {
      return NextResponse.next();
    }
    const ua = h.get('user-agent') ?? '';
    if (!looksAutomated(ua)) {
      return NextResponse.next();
    }

    const base = (process.env.NEXT_PUBLIC_REST_API_ENDPOINT ?? '').replace(/\/$/, '');
    if (!base) return NextResponse.next();

    const page = req.nextUrl.pathname;
    const body = JSON.stringify({
      page,
      referrer: h.get('referer') || null,
      ip: clientIp(req),
      country_code: h.get('cf-ipcountry') || h.get('x-vercel-ip-country') || null,
      state: dec(h.get('cf-region-code') || h.get('x-vercel-ip-country-region')),
      city: dec(h.get('cf-ipcity') || h.get('x-vercel-ip-city')),
      source: 'server',
      events: [{ type: 'page_view', url: page }],
    });

    event.waitUntil(
      fetch(`${base}/track/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': ua || 'unknown' },
        body,
        signal: AbortSignal.timeout(3000),
      }).catch(() => {}),
    );
  } catch {
    /* tracking must never affect the response */
  }
  return NextResponse.next();
}
