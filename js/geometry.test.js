import assert from 'node:assert/strict';
import test from 'node:test';
import {
  distance,
  extrudeObject,
  flattenObject,
  objectLength,
  offsetPolygon,
  polygonArea,
  rotateObject,
  translateObject,
} from './geometry.js';

test('distance handles 3D points', () => {
  assert.equal(distance([0, 0, 0], [3, 4, 12]), 13);
});

test('polygon area and perimeter support architectural faces', () => {
  const face = { type: 'poly', closed: true, points: [[0, 0, 0], [12, 0, 0], [12, 8, 0], [0, 8, 0]] };
  assert.equal(polygonArea(face.points), 96);
  assert.equal(objectLength(face), 40);
});

test('translate, rotate, extrude, and flatten leave source objects unchanged', () => {
  const source = { id: 'face', type: 'poly', points: [[0, 0, 0], [2, 0, 0], [2, 2, 0]], attrs: {} };
  const moved = translateObject(source, 1, 2, 3);
  const rotated = rotateObject(source, 'z', 90);
  const extruded = extrudeObject(source, 10);
  const flat = flattenObject({ ...extruded, points: moved.points });

  assert.deepEqual(source.points[0], [0, 0, 0]);
  assert.deepEqual(moved.points[0], [1, 2, 3]);
  assert.deepEqual(rotated.points[1], [0, 2, 0]);
  assert.equal(extruded.extrudeHeight, 10);
  assert.deepEqual(flat.points[0], [1, 2, 0]);
});

test('offset polygon expands corners away from centroid', () => {
  const points = [[0, 0, 0], [2, 0, 0], [2, 2, 0], [0, 2, 0]];
  const offset = offsetPolygon(points, Math.SQRT2);
  assert.deepEqual(offset, [[-1, -1, 0], [3, -1, 0], [3, 3, 0], [-1, 3, 0]]);
});
