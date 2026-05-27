import assert from 'node:assert/strict';
import test from 'node:test';

import { createModelStore, dispatchCommand } from './model-store.js';
import { getNode } from './scene-graph.js';
import { executeRelationshipCommand } from './relationship-commands.js';

test('dispatchCommand inserts room.detect into scene graph', () => {
  const store = createModelStore();

  const result = dispatchCommand(store, {
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

  assert.equal(result.ok, true);

  const room = getNode(store.sceneGraph, 'room_1');

  assert.equal(room.kind, 'room');
  assert.equal(room.roomType, 'kitchen');
});

test('room.contains relationship assigns object to room', () => {
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

  dispatchCommand(store, {
    cmd: 'cabinet.create',
    type: 'base_cabinet',
    width: 600,
    depth: 560,
    height: 850,
    position: [100, 100, 0],
    orientation: 0,
  });

  const result = executeRelationshipCommand(store, {
    cmd: 'room.contains',
    room_id: 'room_1',
    object_id: 'cabinet_2',
  });

  assert.equal(result.ok, true);

  const room = getNode(store.sceneGraph, 'room_1');
  const cabinet = getNode(store.sceneGraph, 'cabinet_2');

  assert.deepEqual(room.containedObjects, ['cabinet_2']);
  assert.equal(cabinet.parentRoom, 'room_1');
});
