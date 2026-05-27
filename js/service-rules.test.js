import assert from 'node:assert/strict';
import test from 'node:test';

import { applyServiceRules } from './service-rules.js';

test('sink_base receives required services', () => {
  const cabinet = {
    cabinetType: 'sink_base',
  };

  applyServiceRules(cabinet);

  assert.deepEqual(cabinet.serviceRequirement, [
    'water_supply',
    'waste_pipe',
  ]);
});

test('vanity receives lighting requirement', () => {
  const vanity = {
    cabinetType: 'vanity',
  };

  applyServiceRules(vanity);

  assert.equal(vanity.serviceRequirement.includes('lighting_point'), true);
});
