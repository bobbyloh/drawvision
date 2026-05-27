import assert from 'node:assert/strict';
import test from 'node:test';
import { createWallGeometry } from './wall-geometry.js';

test('creates straight wall geometry from a centerline command', () => {
  const result = createWallGeometry({
    cmd: 'wall.create',
    id: 'wall_test',
    start: [0, 0, 0],
    end: [5000, 0, 0],
    height: 3200,
    thickness: 200,
    material: 'default_wall',
  });

  assert.equal(result.ok, true);
  assert.equal(result.wall.id, 'wall_test');
  assert.equal(result.wall.path.length, 5000);
  assert.equal(result.wall.totalThickness, 200);
  assert.deepEqual(result.wall.derived.footprint, [
    [0, 100, 0],
    [5000, 100, 0],
    [5000, -100, 0],
    [0, -100, 0],
  ]);
});

test('adds finish layers to total wall thickness without changing core thickness', () => {
  const result = createWallGeometry({
    cmd: 'wall.create',
    start: [0, 0, 0],
    end: [1000, 0, 0],
    height: 3000,
    thickness: 150,
    material: 'stud_wall',
    finishLayers: [
      { side: 'interior', thickness: 16, material: 'gyp_board' },
      { side: 'exterior', thickness: 25, material: 'sheathing' },
    ],
  }, { idFactory: prefix => `${prefix}_01` });

  assert.equal(result.ok, true);
  assert.equal(result.wall.coreThickness, 150);
  assert.equal(result.wall.totalThickness, 191);
  assert.equal(result.wall.finishLayers.length, 2);
});

test('validates door and window openings against wall span and height', () => {
  const result = createWallGeometry({
    cmd: 'wall.create',
    start: [0, 0, 0],
    end: [5000, 0, 0],
    height: 3200,
    thickness: 200,
    material: 'default_wall',
    openings: [
      { kind: 'door', centerlineOffset: 900, width: 900, height: 2100, sillHeight: 0 },
      { kind: 'window', centerlineOffset: 3200, width: 1200, height: 1200, sillHeight: 900 },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.wall.openings.length, 2);
  assert.equal(result.wall.openings[0].headHeight, 2100);
  assert.equal(result.wall.openings[1].headHeight, 2100);
});

test('rejects openings that do not fit along the wall centerline', () => {
  const result = createWallGeometry({
    cmd: 'wall.create',
    start: [0, 0, 0],
    end: [1000, 0, 0],
    height: 3000,
    thickness: 200,
    material: 'default_wall',
    openings: [
      { kind: 'door', centerlineOffset: 100, width: 900, height: 2100 },
    ],
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, 'OPENING_OUTSIDE_WALL');
});

test('supports arc wall centerline geometry', () => {
  const result = createWallGeometry({
    cmd: 'wall.create',
    path: {
      type: 'arc',
      center: [0, 0, 0],
      radius: 2000,
      startAngle: 0,
      endAngle: 90,
    },
    height: 3200,
    thickness: 200,
    material: 'default_wall',
  });

  assert.equal(result.ok, true);
  assert.equal(result.wall.path.type, 'arc');
  assert.equal(Math.round(result.wall.path.length), 3142);
  assert.equal(result.wall.derived.footprint.length, 50);
});
