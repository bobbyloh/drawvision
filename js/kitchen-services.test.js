import assert from 'node:assert/strict';
import test from 'node:test';

import { createModelStore, dispatchCommand } from './model-store.js';
import { getNode } from './scene-graph.js';
import { provisionKitchenServices } from './kitchen-services.js';
import { validateServiceDependencies } from './relationship-engine.js';

test('provisionKitchenServices creates and connects sink services', () => {
  const store = createModelStore();

  dispatchCommand(store, {
    cmd: 'cabinet.create',
    type: 'sink_base',
    width: 600,
    depth: 560,
    height: 850,
    position: [100, 100, 0],
    orientation: 0,
  });

  const cabinet = getNode(store.sceneGraph, 'cabinet_1');
  const result = provisionKitchenServices(store, cabinet);

  assert.equal(result.ok, true);
  assert.equal(result.createdServices.length, 2);
  assert.deepEqual(cabinet.connectedServices, ['service_2', 'service_3']);

  const validation = validateServiceDependencies(store, 'cabinet_1');
  assert.equal(validation.ok, true);
});

test('provisionKitchenServices creates hob services', () => {
  const store = createModelStore();

  dispatchCommand(store, {
    cmd: 'cabinet.create',
    type: 'hob_base',
    width: 600,
    depth: 560,
    height: 850,
    position: [100, 100, 0],
    orientation: 0,
  });

  const cabinet = getNode(store.sceneGraph, 'cabinet_1');
  const result = provisionKitchenServices(store, cabinet);

  assert.equal(result.ok, true);
  assert.equal(result.createdServices.length, 2);
});
