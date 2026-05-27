import assert from 'node:assert/strict';
import test from 'node:test';

import { createAppBridge } from './app-bridge.js';

test('app bridge syncs wall scene graph into legacy state.objects', () => {
  const state = {
    objects: [],
  };

  const bridge = createAppBridge(state);

  const result = bridge.dispatchCore({
    cmd: 'wall.create',
    start: [0, 0, 0],
    end: [5000, 0, 0],
    height: 3200,
    thickness: 200,
    material: 'default_wall',
  });

  assert.equal(result.ok, true);
  assert.equal(state.objects.length, 1);
  assert.equal(state.objects[0].generatedFromSceneGraph, true);
  assert.equal(state.objects[0].type, 'poly');
});

test('app bridge syncs kitchen module into legacy state.objects', () => {
  const state = {
    objects: [],
  };

  const bridge = createAppBridge(state);

  bridge.dispatchCore({
    cmd: 'room.detect',
    boundary: [
      [0, 0, 0],
      [5000, 0, 0],
      [5000, 3000, 0],
      [0, 3000, 0],
    ],
  });

  const result = bridge.dispatchModule({
    cmd: 'kitchen.generate',
    room_id: 'room_1',
    layout_type: 'linear',
    start: [100, 100, 0],
  });

  assert.equal(result.ok, true);
  assert.equal(state.objects.length > 1, true);
  assert.equal(state.objects.every(object => object.generatedFromSceneGraph), true);
});
