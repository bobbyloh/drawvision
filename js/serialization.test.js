import assert from 'node:assert/strict';
import test from 'node:test';

import { createModelStore, dispatchCommand } from './model-store.js';
import { serializeModel, deserializeModel } from './serialization.js';
import { getNode } from './scene-graph.js';

test('model serializes and reloads wall.create result', () => {
  const store = createModelStore();

  dispatchCommand(store, {
    cmd: 'wall.create',
    start: [0, 0, 0],
    end: [5000, 0, 0],
    height: 3200,
    thickness: 200,
    material: 'default_wall',
  });

  const json = serializeModel(store);
  const reloaded = deserializeModel(json);
  const wall = getNode(reloaded.sceneGraph, 'wall_1');

  assert.equal(wall.kind, 'wall');
  assert.equal(reloaded.commandHistory.length, 1);
});
