import assert from 'node:assert/strict';
import test from 'node:test';

import { createModelStore, dispatchCommand } from './model-store.js';
import { executeRelationshipCommand } from './relationship-commands.js';

test('cabinet.attach_to_wall command works', () => {
  const store = createModelStore();

  dispatchCommand(store, {
    cmd: 'wall.create',
    start: [0, 0, 0],
    end: [5000, 0, 0],
    height: 3200,
    thickness: 200,
    material: 'default_wall',
  });

  dispatchCommand(store, {
    cmd: 'cabinet.create',
    type: 'base_cabinet',
    width: 600,
    depth: 560,
    height: 850,
    position: [0, 0, 0],
    orientation: 0,
  });

  const result = executeRelationshipCommand(store, {
    cmd: 'cabinet.attach_to_wall',
    cabinet_id: 'cabinet_2',
    wall_id: 'wall_1',
  });

  assert.equal(result.ok, true);
});

test('service.connect command works', () => {
  const store = createModelStore();

  dispatchCommand(store, {
    cmd: 'cabinet.create',
    type: 'sink_base',
    width: 600,
    depth: 560,
    height: 850,
    position: [0, 0, 0],
    orientation: 0,
    service_requirement: ['water_supply'],
  });

  dispatchCommand(store, {
    cmd: 'service.create',
    service_type: 'water_supply',
    position: [100, 0, 0],
  });

  const result = executeRelationshipCommand(store, {
    cmd: 'service.connect',
    object_id: 'cabinet_1',
    service_id: 'service_2',
  });

  assert.equal(result.ok, true);
});
