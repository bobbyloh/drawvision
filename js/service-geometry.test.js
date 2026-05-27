import assert from 'node:assert/strict';
import test from 'node:test';

import { createServiceGeometry } from './service-geometry.js';

test('creates service connection object', () => {
  const result = createServiceGeometry({
    cmd: 'service.create',
    service_type: 'water_supply',
    position: [100, 200, 0],
  }, {
    idFactory: prefix => `${prefix}_1`,
  });

  assert.equal(result.ok, true);
  assert.equal(result.service.id, 'service_1');
  assert.equal(result.service.kind, 'service');
  assert.equal(result.service.serviceType, 'water_supply');
});
