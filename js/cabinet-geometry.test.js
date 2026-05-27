import assert from 'node:assert/strict';
import test from 'node:test';

import { createCabinetGeometry } from './cabinet-geometry.js';

test('creates parametric cabinet geometry', () => {
  const result = createCabinetGeometry({
    cmd: 'cabinet.create',
    type: 'base_cabinet',
    width: 600,
    depth: 560,
    height: 850,
    position: [0, 0, 0],
    orientation: 0,
    material: 'timber_veneer',
  }, {
    idFactory: prefix => `${prefix}_1`,
  });

  assert.equal(result.ok, true);
  assert.equal(result.cabinet.id, 'cabinet_1');
  assert.equal(result.cabinet.kind, 'cabinet');
  assert.equal(result.cabinet.derived.footprint.length, 4);
});
