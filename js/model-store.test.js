import assert from 'node:assert/strict';
import test from 'node:test';

import { createModelStore, dispatchCommand } from './model-store.js';
import { getNode } from './scene-graph.js';

test('dispatchCommand inserts wall.create result into scene graph', () => {
  const store = createModelStore();

  const result = dispatchCommand(store, {
    cmd: 'wall.create',
    start: [0, 0, 0],
    end: [5000, 0, 0],
    height: 3200,
    thickness: 200,
    material: 'default_wall',
  });

  assert.equal(result.ok, true);

  const wall = getNode(store.sceneGraph, 'wall_1');

  assert.equal(wall.kind, 'wall');
  assert.equal(store.commandHistory.length, 1);
  assert.equal(store.undoStack.length, 1);
});
