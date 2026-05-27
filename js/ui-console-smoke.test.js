import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('visible JSON command console exists in index and app binding exists', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const app = fs.readFileSync('js/app.js', 'utf8');

  assert.equal(html.includes('dvJsonCommandPanel'), true);
  assert.equal(html.includes('DrawVision Command Console'), true);
  assert.equal(html.includes('dvFillBathroomCommand'), true);
  assert.equal(app.includes('setupJsonCommandPanel'), true);
  assert.equal(app.includes('bathroom.generate'), true);
});
