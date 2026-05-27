import assert from 'node:assert/strict';
import test from 'node:test';

import { createModelStore, dispatchCommand } from './model-store.js';
import { generateBathroom } from './bathroom-generator.js';
import { getNode } from './scene-graph.js';
import { validateServiceDependencies } from './relationship-engine.js';

test('bathroom.generate creates fixtures inside room with services', () => {
  const store = createModelStore();

  dispatchCommand(store, {
    cmd: 'room.detect',
    name: 'Bathroom',
    room_type: 'bathroom',
    boundary: [
      [0, 0, 0],
      [4000, 0, 0],
      [4000, 3000, 0],
      [0, 3000, 0],
    ],
  });

  const result = generateBathroom(store, {
    cmd: 'bathroom.generate',
    room_id: 'room_1',
    start: [100, 100, 0],
  });

  assert.equal(result.ok, true);
  assert.equal(result.created.length, 4);
  assert.equal(result.services.length, 8);

  const room = getNode(store.sceneGraph, 'room_1');

  assert.deepEqual(room.containedObjects, [
    'cabinet_2',
    'cabinet_6',
    'cabinet_9',
    'cabinet_12',
  ]);

  const vanity = getNode(store.sceneGraph, 'cabinet_2');
  assert.equal(vanity.kind, 'fixture');
  assert.equal(vanity.fixtureType, 'vanity');

  const validation = validateServiceDependencies(store, 'cabinet_2');
  assert.equal(validation.ok, true);
});
