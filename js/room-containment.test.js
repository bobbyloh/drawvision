import assert from 'node:assert/strict';
import test from 'node:test';

import { createModelStore, dispatchCommand } from './model-store.js';
import { getNode } from './scene-graph.js';
import {
  autoContainObjectInRooms,
  autoContainAllObjects,
} from './room-containment.js';

test('autoContainObjectInRooms assigns cabinet to containing room', () => {
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

  const result = autoContainObjectInRooms(store, 'cabinet_2');

  assert.equal(result.ok, true);

  const cabinet = getNode(store.sceneGraph, 'cabinet_2');
  const room = getNode(store.sceneGraph, 'room_1');

  assert.equal(cabinet.parentRoom, 'room_1');
  assert.deepEqual(room.containedObjects, ['cabinet_2']);
});

test('autoContainAllObjects assigns multiple objects', () => {
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

  dispatchCommand(store, {
    cmd: 'service.create',
    service_type: 'water_supply',
    position: [100, 100, 0],
  });

  dispatchCommand(store, {
    cmd: 'cabinet.create',
    type: 'vanity',
    width: 900,
    depth: 500,
    height: 850,
    position: [300, 100, 0],
    orientation: 0,
  });

  const result = autoContainAllObjects(store);

  assert.equal(result.ok, true);
  assert.equal(getNode(store.sceneGraph, 'service_2').parentRoom, 'room_1');
  assert.equal(getNode(store.sceneGraph, 'cabinet_3').parentRoom, 'room_1');
});
