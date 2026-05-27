import assert from 'node:assert/strict';
import test from 'node:test';

import { createModelStore, dispatchCommand } from './model-store.js';
import { getNode } from './scene-graph.js';

test('dispatchCommand inserts cabinet.create into scene graph', () => {
  const store = createModelStore();

  const result = dispatchCommand(store, {
    cmd: 'cabinet.create',
    type: 'base_cabinet',
    width: 600,
    depth: 560,
    height: 850,
    position: [0, 0, 0],
    orientation: 0,
    material: 'timber_veneer',
  });

  assert.equal(result.ok, true);

  const cabinet = getNode(store.sceneGraph, 'cabinet_1');

  assert.equal(cabinet.kind, 'cabinet');
  assert.equal(cabinet.cabinetType, 'base_cabinet');
});

test('dispatchCommand inserts service.create into scene graph', () => {
  const store = createModelStore();

  const result = dispatchCommand(store, {
    cmd: 'service.create',
    service_type: 'electrical_point',
    position: [300, 0, 0],
  });

  assert.equal(result.ok, true);

  const service = getNode(store.sceneGraph, 'service_1');

  assert.equal(service.kind, 'service');
  assert.equal(service.serviceType, 'electrical_point');
});
