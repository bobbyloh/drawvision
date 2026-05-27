import assert from 'node:assert/strict';
import test from 'node:test';

import { createModelStore } from './model-store.js';
import { dispatchJsonCommand } from './command-input.js';
import { getNode } from './scene-graph.js';

test('dispatchJsonCommand accepts wall.create JSON', () => {
  const store = createModelStore();

  const result = dispatchJsonCommand(store, JSON.stringify({
    cmd: 'wall.create',
    start: [0, 0, 0],
    end: [5000, 0, 0],
    height: 3200,
    thickness: 200,
    material: 'default_wall',
  }));

  assert.equal(result.ok, true);
  assert.equal(getNode(store.sceneGraph, 'wall_1').kind, 'wall');
});

test('dispatchJsonCommand rejects invalid JSON', () => {
  const store = createModelStore();

  const result = dispatchJsonCommand(store, '{bad json');

  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, 'JSON_PARSE_ERROR');
});
