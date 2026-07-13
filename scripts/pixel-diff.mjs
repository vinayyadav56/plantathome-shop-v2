import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'node:fs';

const V1 = process.env.V1_URL ?? 'https://www.plantathome.in';
const V2 = process.env.V2_URL ?? 'http://localhost:3011';
const OUT = process.env.SHOT ?? '/tmp';

// key surfaces + a representative product/category slug that exists on both
const ROUTES = [
  ['/', 'home'],
  ['/plants', 'plants'],
  ['/plants/search', 'search'],
  ['/products/monstera-deliciosa', 'pdp'],
  ['/signin', 'signin'],
];
const VIEWPORTS = [
  { w: 1280, h: 900, tag: 'desktop' },
  { w: 390, h: 844, tag: 'mobile' },
];

// hide volatile chrome (Ken-Burns hero swaps, toasts, cart badge, dev overlays)
const MASK_CSS = `
  video, .kenburns, [class*="hero"] img, [class*="slide"] img,
  .Toastify, [data-nextjs-toast], #nextjs__container_errors,
  [class*="badge"], [class*="count"] { visibility: hidden !important; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
`;

async function shoot(page, base, path, vp) {
  await page.setViewportSize({ width: vp.w, height: vp.h });
  await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => {});
  await page.addStyleTag({ content: MASK_CSS }).catch(() => {});
  await page.waitForTimeout(6000);
  // clamp to a fixed above-the-fold region for a stable comparison
  const clip = { x: 0, y: 0, width: vp.w, height: Math.min(vp.h * 2, 1700) };
  const buf = await page.screenshot({ clip, timeout: 25000 }).catch(() => null);
  return buf;
}

const b = await chromium.launch();
const p1 = await (await b.newContext()).newPage();
const p2 = await (await b.newContext()).newPage();
const rows = [];
for (const [path, name] of ROUTES) {
  for (const vp of VIEWPORTS) {
    const [a, c] = await Promise.all([shoot(p1, V1, path, vp), shoot(p2, V2, path, vp)]);
    if (!a || !c) { rows.push([`${name} ${vp.tag}`, 'shot-failed']); continue; }
    const iA = PNG.sync.read(a), iB = PNG.sync.read(c);
    const w = Math.min(iA.width, iB.width), h = Math.min(iA.height, iB.height);
    // crop both to common size
    const crop = (img) => { const o = new PNG({ width: w, height: h }); PNG.bitblt(img, o, 0, 0, w, h, 0, 0); return o; };
    const cA = crop(iA), cB = crop(iB);
    const diff = new PNG({ width: w, height: h });
    const mismatch = pixelmatch(cA.data, cB.data, diff.data, w, h, { threshold: 0.12 });
    const pct = ((mismatch / (w * h)) * 100).toFixed(2);
    fs.writeFileSync(`${OUT}/diff-${name}-${vp.tag}.png`, PNG.sync.write(diff));
    fs.writeFileSync(`${OUT}/v2-${name}-${vp.tag}.png`, PNG.sync.write(cB));
    rows.push([`${name} ${vp.tag}`, `${pct}% differing`]);
  }
}
await b.close();
console.log('\n=== PIXEL DIFF vs live V1 (www.plantathome.in) ===');
for (const [label, res] of rows) console.log(`  ${label.padEnd(20)} ${res}`);
process.exit(0);
