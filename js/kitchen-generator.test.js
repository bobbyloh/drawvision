import assert from 'node:assert/strict';
import test from 'node:test';

import { createModelStore, dispatchCommand } from './model-store.js';
import { generateKitchen } from './kitchen-generator.js';
import { getNode } from './scene-graph.js';
import { validateServiceDependencies } from './relationship-engine.js';

test('kitchen.generate creates cabinet sequence inside room', () => {
  const store = createModelStore();

  dispatchCommand(store, {
    cmd: 'room.detect',
    name: 'Kitchen',
    room_type: 'kitchen',
    boundary: [
      [0, 0, 0],
      [5000, 0, 0],
      [5000, 3000, 0],
      [0, 3000, 0],
    ],
  });

  const result = generateKitchen(store, {
    cmd: 'kitchen.generate',
    room_id: 'room_1',
    layout_type: 'linear',
    start: [100, 100, 0],
    sequence: ['sink_base', 'drawer_unit', 'hob_base'],
  });

  assert.equal(result.ok, true);
  assert.equal(result.created.length, 3);

  const room = getNode(store.sceneGraph, 'room_1');
  assert.deepEqual(room.containedObjects, ['cabinet_2', 'cabinet_3', 'cabinet_4']);

  const sink = getNode(store.sceneGraph, 'cabinet_2');
  assert.deepEqual(sink.serviceRequirement, ['water_supply', 'waste_pipe']);

  const validation = validateServiceDependencies(store, 'cabinet_2');
  assert.equal(validation.ok, true);
  assert.equal(result.services.length, 4);
});
