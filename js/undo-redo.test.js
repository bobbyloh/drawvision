import assert from 'node:assert/strict';
import test from 'node:test';

import { createModelStore, dispatchCommand } from './model-store.js';
import { getNode } from './scene-graph.js';
import { undo, redo } from './undo-redo.js';

test('undo removes wall created by wall.create', () => {
  const store = createModelStore();

  dispatchCommand(store, {
    cmd: 'wall.create',
    start: [0, 0, 0],
    end: [5000, 0, 0],
    height: 3200,
    thickness: 200,
    material: 'default_wall',
  });

  assert.equal(getNode(store.sceneGraph, 'wall_1').kind, 'wall');

  const result = undo(store);

  assert.equal(result.ok, true);
  assert.equal(getNode(store.sceneGraph, 'wall_1'), null);
  assert.equal(store.redoStack.length, 1);
});

test('redo restores wall removed by undo', () => {
  const store = createModelStore();

  dispatchCommand(store, {
    cmd: 'wall.create',
    start: [0, 0, 0],
    end: [5000, 0, 0],
    height: 3200,
    thickness: 200,
    material: 'default_wall',
  });

  undo(store);
  const result = redo(store);

  assert.equal(result.ok, true);
  assert.equal(getNode(store.sceneGraph, 'wall_1').kind, 'wall');
  assert.equal(store.undoStack.length, 1);
});
