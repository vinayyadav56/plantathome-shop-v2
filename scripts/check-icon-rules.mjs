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
).filter((l) => !l.startsWith('src/components/ui/icon.tsx') && !l.includes('src/components/ui/icon-set/'));
fail('The icon library was imported outside the barrel.', importHits);

// ---- Rule 4: sizes stay on the scale ----------------------------------------
const SCALE = new Set([12, 14, 16, 18, 20, 24, 32, 40, 48]);
const sizeHits = sh(`grep -rnoE "size=\\{[0-9]+\\}" src --include="*.tsx" || true`)
  .filter((l) => { const m = l.match(/size=\{(\d+)\}/); return m && !SCALE.has(+m[1]); });
fail('An icon size is off the scale 12/14/16/18/20/24/32/40/48.', sizeHits);

if (failures) { console.error(`\n${failures} icon-rule violation(s).\n`); process.exit(1); }
console.log('✓ icon rules: leaf-means-plant, currentColor-only, single-door imports, size scale');
