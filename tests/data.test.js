import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeObject, filterObjects, summarize, formatYear } from '../src/data.js';

const sample = [
  { id: 1, title: 'Blue Vase', artist: 'Mira', department: 'Asian Art', medium: 'Ceramic', date: '1700', year: 1700 },
  { id: 2, title: 'Quiet Garden', artist: 'Ari', department: 'European Paintings', medium: 'Oil', date: '1880', year: 1880 },
  { id: 3, title: 'City Lights', artist: 'Mira', department: 'Asian Art', medium: 'Print', date: '1950', year: 1950 },
];

test('normalizes API records with matching artwork details', () => {
  const result = normalizeObject({ objectID: 12, title: '  A work  ', primaryImageSmall: 'image.jpg', artistDisplayName: 'Artist', department: 'Drawings', medium: 'Ink', objectDate: '1901', objectBeginDate: 1901 });
  assert.deepEqual([result.id, result.title, result.image, result.department, result.year], [12, 'A work', 'image.jpg', 'Drawings', 1901]);
  assert.equal(normalizeObject({ objectID: 13, title: 'No image' }), null);
});

test('search, department, and era filters combine while using different attributes', () => {
  assert.deepEqual(filterObjects(sample, 'mira', 'Asian Art', '1900plus').map((item) => item.id), [3]);
  assert.deepEqual(filterObjects(sample, 'garden', 'all', 'all').map((item) => item.id), [2]);
  assert.deepEqual(filterObjects(sample, '', 'Asian Art', 'before1800').map((item) => item.id), [1]);
});

test('statistics describe the loaded sample', () => {
  assert.deepEqual(summarize(sample), { total: 3, departmentCount: 2, earliestYear: 1700, latestYear: 1950, departments: [['Asian Art', 2], ['European Paintings', 1]] });
  assert.equal(formatYear(-500), '500 BCE');
});
