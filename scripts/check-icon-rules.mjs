#!/usr/bin/env node
/**
 * Icon system guard rails. Run in CI and before a deploy.
 *
 * Rule 1 (the owner's standing rule): a leaf glyph means a PLANT. It is never
 *   ornament. Files that legitimately render one are allowlisted below.
 * Rule 2: no icon file hardcodes a colour -- icons follow currentColor.
 * Rule 3: nothing imports the icon library outside the barrel.
 */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const sh = (c) => execSync(c, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
let failures = 0;
const fail = (rule, lines) => {
  if (!lines.length) return;
  failures += lines.length;
  console.error(`\n✗ ${rule}`);
  lines.forEach((l) => console.error('   ' + l));
};

// ---- Rule 1: leaf means plant ------------------------------------------------
const LEAF_ALLOWED = [
  'src/components/ui/icon.tsx',                       // the barrel defines it
  'src/components/icons/line-icons.tsx',              // name->glyph map
  'src/components/storefront/icons.tsx',              // name->glyph map
  'src/components/orders/tracking/icons.tsx',         // name->glyph map
  'src/components/ui/plant-loader.tsx',               // the growing-sprout loader
  'src/components/storefront/logo-mark.tsx',          // brand mark
  'src/components/storefront/pah/bottom-nav.tsx',     // the "Plants" tab
  'src/components/storefront/home/why-plants.tsx',    // a section about plants
  'src/components/storefront/pah/why-plants.tsx',     // same section, phone tree
  'src/components/storefront/home/hero-plant.tsx',    // eyebrow reads "plant store"
  'src/page-bodies/plant-doctor.tsx',                 // a leaf IS the subject here
  'src/components/garden-service/icons.tsx',          // name->glyph map
];
const leafHits = sh(
  `grep -rln "<Leaf\\b\\|<Sprout\\b\\|<Flower2\\b\\|Icon\\.leaf\\|name=\\"leaf\\"\\|name=\\"sprout\\"" src --include="*.tsx" || true`
).filter((f) => !LEAF_ALLOWED.includes(f));
fail('A leaf/sprout glyph is used outside a plant context (owner rule).', leafHits);

// ---- Rule 2: no hardcoded colour inside icon sources -------------------------
const hexHits = sh(
  `grep -rn "#[0-9a-fA-F]\\{3,6\\}" src/components/ui/icon.tsx src/components/ui/icon-set 2>/dev/null || true`
);
fail('An icon source hardcodes a colour; icons must follow currentColor.', hexHits);

// ---- Rule 3: the barrel is the only door ------------------------------------
const importHits = sh(
  `grep -rn "from '@tabler/icons-react'\\|from 'lucide-react'" src app --include="*.tsx" --include="*.ts" || true`
).filter(
  (l) =>
    !l.startsWith('src/components/ui/icon.tsx') &&
    !l.includes('src/components/ui/icon-set/') &&
    // DB-keyed palettes import the raw glyph deliberately; rule 5 below proves
    // each of them still routes through paletteIcon(), so the knob applies.
    !/^src\/components\/icons\/(category|groups|social)\//.test(l) &&
    !/^src\/components\/icons\/(whatsapp|google)\.tsx/.test(l)
);
fail('The icon library was imported outside the barrel.', importHits);

// ---- Rule 4: sizes stay on the scale ----------------------------------------
const SCALE = new Set([12, 14, 16, 18, 20, 24, 32, 40, 48]);
const sizeHits = sh(`grep -rnoE "size=\\{[0-9]+\\}" src --include="*.tsx" || true`)
  .filter((l) => { const m = l.match(/size=\{(\d+)\}/); return m && !SCALE.has(+m[1]); });
fail('An icon size is off the scale 12/14/16/18/20/24/32/40/48.', sizeHits);

// ---- Rule 5: DB-keyed palettes must go through paletteIcon() -------------
const rawPalette = sh(
  `grep -rLn "paletteIcon" src/components/icons/category src/components/icons/groups src/components/icons/social --include="*.tsx" || true`
).filter((f) => f && !f.endsWith('index.tsx'));
fail('A DB-keyed palette glyph bypasses paletteIcon(), so it misses the house stroke.', rawPalette);

// ---- Rule 5b: every LineIcon/GsIcon name used must exist in its map --------
// A name that isn't in the map hits the fallback and renders a neutral dot --
// which looks deliberate, so it ships unnoticed. (This rule caught `grid`.)
const mapKeys = (file) => {
  const src = readFileSync(file, 'utf8');
  const m = src.match(/const GLYPHS[^=]*=\s*\{([\s\S]*?)\n\};/);
  return new Set(m ? [...m[1].matchAll(/^\s{2}([A-Za-z][A-Za-z0-9]*):/gm)].map((x) => x[1]) : []);
};
const unmapped = [];
for (const [tag, file] of [
  ['LineIcon', 'src/components/icons/line-icons.tsx'],
  ['GsIcon', 'src/components/garden-service/icons.tsx'],
]) {
  const have = mapKeys(file);
  const used = sh(`grep -rhoE '<${tag}[^>]*name="[a-zA-Z]+"' src --include="*.tsx" || true`)
    .map((l) => (l.match(/name="([a-zA-Z]+)"/) || [])[1])
    .filter(Boolean);
  for (const u of new Set(used)) if (!have.has(u)) unmapped.push(`${tag} name="${u}" is not in ${file}`);
}
fail('An icon name is used but not mapped, so it silently hits the fallback.', unmapped);

// ---- Rule 6: every brand-ramp class used actually exists in the config ------
// A class for a rung that isn't defined emits NO css and fails silently, which
// is how two icon colours were dead for months.
const cfg = readFileSync('tailwind.config.js', 'utf8');
const rungs = (ramp) => {
  const m = cfg.match(new RegExp(ramp + ':\\s*\\{([^}]*)\\}', 's'));
  if (!m) return new Set();
  return new Set([...m[1].matchAll(/^\s*(\d+|DEFAULT):/gm)].map((x) => x[1]));
};
const deadRamp = [];
// NOTE: only CUSTOM ramps. `stone` is one of Tailwind's own palette names, so
// extend merges into it and every default rung still emits CSS -- verified
// against the built stylesheet.
for (const ramp of ['forest', 'sage', 'clay', 'olive', 'kraft']) {
  const have = rungs(ramp);
  if (!have.size) continue;
  const used = sh(
    `grep -rhoE "(text|bg|border|ring|fill|stroke|from|to|via)-${ramp}-[0-9]+" src --include="*.tsx" || true`
  );
  for (const u of new Set(used)) {
    const rung = u.split('-').pop();
    if (!have.has(rung)) deadRamp.push(`${u}  (no "${rung}" rung in the ${ramp} ramp -- emits no CSS)`);
  }
}
fail('A Tailwind brand-ramp class references a rung that does not exist.', deadRamp);

if (failures) { console.error(`\n${failures} icon-rule violation(s).\n`); process.exit(1); }
console.log('✓ icon rules: leaf-means-plant, currentColor-only, single-door imports, size scale');
