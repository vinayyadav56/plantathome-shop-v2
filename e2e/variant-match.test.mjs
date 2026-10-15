// Variant selection helpers (src/lib/variant-match.ts) — a local check; CI has no unit step.
// Run: node --experimental-strip-types --test e2e/variant-match.test.mjs   (Node >= 22.6)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { availableValues, findVariant, pick } from '../src/lib/variant-match.ts';

const axis = (name, ...values) => values.map((value) => ({ value, attribute: { name } }));
const groups = { colour: axis('Colour', 'Red', 'Blue'), size: axis('Size', 'S', 'L') };
const row = (id, colour, size, extra = {}) => ({
  id,
  options: [{ name: 'Colour', value: colour }, { name: 'Size', value: size }],
  ...extra,
});
// Red/S, Red/L, Blue/S exist; Blue/L does not. Red/L is switched off.
const rows = [row(1, 'Red', 'S'), row(2, 'Red', 'L', { is_disable: 1 }), row(3, 'Blue', 'S')];
const vals = (s) => [...s].sort();

test('only an existing, complete combination resolves', () => {
  assert.equal(findVariant(rows, groups, { colour: 'Blue', size: 'S' })?.id, 3);
  assert.equal(findVariant(rows, groups, { colour: 'Blue', size: 'L' }), undefined);
  assert.equal(findVariant(rows, groups, { colour: 'Blue' }), undefined);
  assert.equal(findVariant(rows, {}, {}), undefined); // no axes: never "the first row"
});

test('axes sharing value strings match by axis, not by sorted values', () => {
  const g = { blade: axis('Blade length', '6in', '8in'), handle: axis('Handle length', '6in', '8in') };
  const r = (id, blade, handle) => ({
    id,
    options: [{ name: 'Handle length', value: handle }, { name: 'Blade length', value: blade }],
  });
  const tools = [r(1, '8in', '6in'), r(2, '6in', '8in')];
  assert.equal(findVariant(tools, g, { blade: '6in', handle: '8in' })?.id, 2);
  assert.equal(findVariant(tools, g, { blade: '6in', handle: '6in' }), undefined);
});

test('names and values compare case-insensitively; values come back as the axis spells them', () => {
  const sizes = { size: axis('Size', 'Small', 'Medium') };
  const plant = [{ id: 7, options: [{ name: 'size', value: 'medium ' }] }];
  assert.equal(findVariant(plant, sizes, { size: 'Medium' })?.id, 7);
  assert.deepEqual(vals(availableValues(plant, sizes, {}, 'size')), ['Medium']);
});

test('a value is offered only when a sellable row matches the other picks', () => {
  assert.deepEqual(vals(availableValues(rows, groups, {}, 'size')), ['S']); // L: only the disabled Red/L
  assert.deepEqual(vals(availableValues(rows, groups, { size: 'S' }, 'colour')), ['Blue', 'Red']);
  assert.deepEqual(vals(availableValues(rows, groups, { colour: 'Blue' }, 'size')), ['S']);
});

test('city_available=false hides a row, unless no row is available (fail-open)', () => {
  const city = [row(1, 'Red', 'S', { city_available: false }), row(3, 'Blue', 'S', { city_available: true })];
  assert.deepEqual(vals(availableValues(city, groups, {}, 'colour')), ['Blue']);
  const none = city.map((r) => ({ ...r, city_available: false }));
  assert.deepEqual(vals(availableValues(none, groups, {}, 'colour')), ['Blue', 'Red']);
});

test('a duplicate combination resolves to its sellable row', () => {
  const dup = [row(1, 'Red', 'S', { is_disable: true }), row(4, 'Red', 'S')];
  assert.equal(findVariant(dup, groups, { colour: 'Red', size: 'S' })?.id, 4);
});

test('picking a value drops the picks it conflicts with', () => {
  const more = [...rows, row(4, 'Blue', 'L')];
  assert.deepEqual(pick(more, groups, { colour: 'Red', size: 'S' }, 'size', 'L'), { size: 'L' }); // Red/L is off
  assert.deepEqual(pick(more, groups, { colour: 'Blue' }, 'size', 'L'), { colour: 'Blue', size: 'L' });
  // Three axes: each kept pick must still exist WITH the ones kept before it, not just pairwise.
  const g3 = { ...groups, pack: axis('Pack', '1', '2') };
  const r3 = (id, c, s, p) => ({ id, options: [{ name: 'Colour', value: c }, { name: 'Size', value: s }, { name: 'Pack', value: p }] });
  const three = [r3(1, 'Red', 'S', '1'), r3(2, 'Red', 'L', '2'), r3(3, 'Blue', 'S', '2')];
  assert.deepEqual(pick(three, g3, { colour: 'Red', size: 'S' }, 'pack', '2'), { pack: '2', colour: 'Red' });
  // Nothing sellable (every variant off): picks are kept, so the selection completes and the
  // shopper sees "Out of stock" instead of an endless "Select options".
  const off = rows.map((r) => ({ ...r, is_disable: 1 }));
  assert.deepEqual(pick(off, groups, { colour: 'Red' }, 'size', 'S'), { colour: 'Red', size: 'S' });
});

test('Plants: one Size axis, matched by value when the attribute was renamed', () => {
  const sizes = { size: axis('Size', 'Small', 'Medium') };
  const plant = [{ id: 9, options: [{ name: 'Plant size', value: 'Medium' }] }];
  assert.equal(findVariant(plant, sizes, { size: 'Medium' })?.id, 9);
  assert.deepEqual(vals(availableValues(plant, sizes, {}, 'size')), ['Medium']);
});
