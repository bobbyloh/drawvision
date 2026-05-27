import assert from 'node:assert/strict';
import test from 'node:test';

import { createModelStore, dispatchCommand } from './model-store.js';
import { getChildren } from './scene-graph.js';
import {
  attachCabinetToWall,
  connectService,
  validateServiceDependencies,
} from './relationship-engine.js';

test('cabinet attaches to wall relationship', () => {
  const store = createModelStore();

  dispatchCommand(store, {
    cmd: 'wall.create',
    start: [0, 0, 0],
    end: [5000, 0, 0],
    height: 3200,
    thickness: 200,
    material: 'default_wall',
  });

  dispatchCommand(store, {
    cmd: 'cabinet.create',
    type: 'base_cabinet',
    width: 600,
    depth: 560,
    height: 850,
    position: [0, 0, 0],
    orientation: 0,
    material: 'timber_veneer',
  });

  const result = attachCabinetToWall(store, 'cabinet_2', 'wall_1');

  assert.equal(result.ok, true);
  assert.equal(result.cabinet.parentWall, 'wall_1');

  const children = getChildren(store.sceneGraph, 'wall_1');
  assert.equal(children.length, 1);
  assert.equal(children[0].id, 'cabinet_2');
});

test('service connects to cabinet relationship', () => {
  const store = createModelStore();

  dispatchCommand(store, {
    cmd: 'cabinet.create',
    type: 'sink_base',
    width: 600,
    depth: 560,
    height: 850,
    position: [0, 0, 0],
    orientation: 0,
    material: 'timber_veneer',
    service_requirement: ['water_supply'],
  });

  dispatchCommand(store, {
    cmd: 'service.create',
    service_type: 'water_supply',
    position: [100, 0, 0],
  });

  const result = connectService(store, 'cabinet_1', 'service_2');

  assert.equal(result.ok, true);
  assert.deepEqual(result.object.connectedServices, ['service_2']);

  const validation = validateServiceDependencies(store, 'cabinet_1');
  assert.equal(validation.ok, true);
});

test('service dependency validation reports missing services', () => {
  const store = createModelStore();

  dispatchCommand(store, {
    cmd: 'cabinet.create',
    type: 'sink_base',
    width: 600,
    depth: 560,
    height: 850,
    position: [0, 0, 0],
    orientation: 0,
    material: 'timber_veneer',
    service_requirement: ['water_supply', 'waste_pipe'],
  });

  const validation = validateServiceDependencies(store, 'cabinet_1');

  assert.equal(validation.ok, false);
  assert.equal(validation.errors.length, 2);
});
