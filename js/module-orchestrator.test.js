import assert from 'node:assert/strict';
import test from 'node:test';

import { createModelStore, dispatchCommand } from './model-store.js';
import { executeModuleCommand } from './module-orchestrator.js';
import { getNode } from './scene-graph.js';

test('module orchestrator routes kitchen.generate', () => {
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

  const result = executeModuleCommand(store, {
    cmd: 'kitchen.generate',
    room_id: 'room_1',
    layout_type: 'linear',
    start: [100, 100, 0],
  });

  assert.equal(result.ok, true);
  assert.equal(result.created.length, 3);
});

test('module orchestrator routes bathroom.generate', () => {
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

  const result = executeModuleCommand(store, {
    cmd: 'bathroom.generate',
    room_id: 'room_1',
    start: [100, 100, 0],
  });

  assert.equal(result.ok, true);
  assert.equal(result.created.length, 4);
});

test('module orchestrator routes room.auto_contain', () => {
  const store = createModelStore();

  dispatchCommand(store, {
    cmd: 'room.detect',
    boundary: [
      [0, 0, 0],
      [3000, 0, 0],
      [3000, 3000, 0],
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

  const result = executeModuleCommand(store, {
    cmd: 'room.auto_contain',
  });

  assert.equal(result.ok, true);
  assert.equal(getNode(store.sceneGraph, 'cabinet_2').parentRoom, 'room_1');
});

test('module orchestrator routes service.validate', () => {
  const store = createModelStore();

  dispatchCommand(store, {
    cmd: 'cabinet.create',
    type: 'sink_base',
    width: 600,
    depth: 560,
    height: 850,
    position: [0, 0, 0],
    orientation: 0,
  });

  const result = executeModuleCommand(store, {
    cmd: 'service.validate',
    object_id: 'cabinet_1',
  });

  assert.equal(result.ok, false);
});
