/**
 * Storefront non-functional audit: performance, accessibility, SEO/meta, responsive.
 * Runs against staging by default. Usage:
 *   node e2e/nonfunctional-audit.mjs [baseUrl] [pdpSlug]
 *
 * Perf: LCP, CLS, TTFB, DOMContentLoaded, JS transfer weight, long-task main-thread time.
 * A11y: axe-core serious/critical violations on home, PDP, signin, checkout.
 * SEO: title, meta description, canonical, og tags, robots, sitemap.xml.
 * Responsive: horizontal overflow + small tap targets at 375/768/1280.
 */
import { chromium } from 'playwright';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axeSource = require('axe-core').source;

const BASE = process.argv[2] || 'https://plantathome-shop-staging.vercel.app';
const SLUG = process.argv[3] || 'camellia-sasanqua';
const PDP = `${BASE}/products/${SLUG}`;

const results = { perf: {}, a11y: {}, seo: {}, responsive: {} };

async function measurePerf(page, url, label) {
  const jsBytes = { total: 0, count: 0 };
  const onResp = async (resp) => {
    try {
      const ct = resp.headers()['content-type'] || '';
      if (ct.includes('javascript')) {
        const len = Number(resp.headers()['content-length'] || 0);
        jsBytes.total += len; jsBytes.count++;
      }
    } catch {}
  };
  page.on('response', onResp);
  await page.addInitScript(() => {
    window.__cls = 0; window.__lcp = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => {
      const es = l.getEntries(); window.__lcp = es[es.length - 1].renderTime || es[es.length - 1].loadTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    window.__longtask = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__longtask += e.duration; })
      .observe({ type: 'longtask', buffered: true });
  });
  const t0 = Date.now();
  const resp = await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(4000); // settle hydration + late shifts
  const nav = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0] || {};
    return { ttfb: n.responseStart, dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd,
      cls: window.__cls, lcp: window.__lcp, longtask: window.__longtask,
      transfer: n.transferSize, resources: performance.getEntriesByType('resource').length };
  });
  page.off('response', onResp);
  results.perf[label] = {
    status: resp.status(), wallMs: Date.now() - t0,
    ttfbMs: Math.round(nav.ttfb), dclMs: Math.round(nav.dcl), loadMs: Math.round(nav.load),
    lcpMs: Math.round(nav.lcp), cls: +nav.cls.toFixed(4), longTaskMs: Math.round(nav.longtask),
    jsRequests: jsBytes.count, jsKB: Math.round(jsBytes.total / 1024), resources: nav.resources,
  };
}

async function runAxe(page, url, label) {
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.evaluate(axeSource);
  const res = await page.evaluate(async () => {
    return await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    });
  });
  const bad = res.violations.filter(v => ['serious', 'critical'].includes(v.impact));
  results.a11y[label] = bad.map(v => ({
    id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length,
    sample: v.nodes[0]?.target?.join(' '), htmlSample: (v.nodes[0]?.html || '').slice(0, 120),
  }));
}

async function checkSeo(page, url, label) {
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  const meta = await page.evaluate(() => {
    const g = (sel, attr = 'content') => document.querySelector(sel)?.getAttribute(attr) || null;
    return {
      title: document.title || null,
      description: g('meta[name="description"]'),
      canonical: g('link[rel="canonical"]', 'href'),
      robots: g('meta[name="robots"]'),
      ogTitle: g('meta[property="og:title"]'),
      ogImage: g('meta[property="og:image"]'),
      ogType: g('meta[property="og:type"]'),
      twitterCard: g('meta[name="twitter:card"]'),
      h1Count: document.querySelectorAll('h1').length,
      lang: document.documentElement.getAttribute('lang'),
    };
  });
  results.seo[label] = meta;
}

async function checkResponsive(page, url, label) {
  const out = {};
  for (const w of [375, 768, 1280]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(2000);
    const data = await page.evaluate(() => {
      const de = document.documentElement;
      const overflow = de.scrollWidth - de.clientWidth;
      let offenders = [];
      if (overflow > 0) {
        for (const el of document.querySelectorAll('*')) {
          const r = el.getBoundingClientRect();
          if (r.right > window.innerWidth + 2 && r.width > 40) {
            offenders.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 50), right: Math.round(r.right) });
          }
          if (offenders.length > 6) break;
        }
      }
      // small tap targets among links/buttons
      let smallTargets = 0;
      for (const el of document.querySelectorAll('a,button,[role=button]')) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && (r.width < 40 || r.height < 40) && r.top < window.innerHeight) smallTargets++;
      }
      return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, overflow, offenders, smallTargets };
    });
    out[w] = data;
  }
  results.responsive[label] = out;
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  // PERF (fresh page each, desktop)
  for (const [label, url] of [['home', BASE], ['pdp', PDP]]) {
    const p = await ctx.newPage();
    try { await measurePerf(p, url, label); } catch (e) { results.perf[label] = { error: String(e).slice(0, 120) }; }
    await p.close();
  }

  // A11Y
  for (const [label, url] of [['home', BASE], ['pdp', PDP], ['signin', `${BASE}/signin`], ['checkout', `${BASE}/checkout`]]) {
    const p = await ctx.newPage();
    try { await runAxe(p, url, label); } catch (e) { results.a11y[label] = { error: String(e).slice(0, 120) }; }
    await p.close();
  }

  // SEO
  for (const [label, url] of [['home', BASE], ['pdp', PDP], ['signin', `${BASE}/signin`]]) {
    const p = await ctx.newPage();
    try { await checkSeo(p, url, label); } catch (e) { results.seo[label] = { error: String(e).slice(0, 120) }; }
    await p.close();
  }
  // sitemap + robots
  for (const path of ['/robots.txt', '/sitemap.xml']) {
    const p = await ctx.newPage();
    const r = await p.goto(BASE + path, { waitUntil: 'load' }).catch(() => null);
    results.seo[path] = r ? { status: r.status(), len: (await p.content()).length } : { error: 'failed' };
    await p.close();
  }

  // RESPONSIVE
  {
    const p = await ctx.newPage();
    try { await checkResponsive(p, BASE, 'home'); } catch (e) { results.responsive.home = { error: String(e).slice(0, 120) }; }
    await p.close();
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})();
