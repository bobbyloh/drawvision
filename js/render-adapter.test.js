import assert from 'node:assert/strict';
import test from 'node:test';

import { createModelStore, dispatchCommand } from './model-store.js';
import { sceneGraphToRenderableObjects } from './render-adapter.js';

test('scene graph render adapter converts wall node to renderable object', () => {
  const store = createModelStore();

  dispatchCommand(store, {
    cmd: 'wall.create',
    start: [0, 0, 0],
    end: [5000, 0, 0],
    height: 3200,
    thickness: 200,
    material: 'default_wall',
  });

  const renderables = sceneGraphToRenderableObjects(store.sceneGraph);

  assert.equal(renderables.length, 1);
  assert.equal(renderables[0].type, 'wall');
  assert.equal(renderables[0].id, 'wall_1');
});
