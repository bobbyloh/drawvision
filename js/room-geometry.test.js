import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createRoomGeometry,
  pointInRoom,
} from './room-geometry.js';

test('creates room geometry from boundary', () => {
  const result = createRoomGeometry({
    cmd: 'room.detect',
    name: 'Kitchen',
    room_type: 'kitchen',
    boundary: [
      [0, 0, 0],
      [5000, 0, 0],
      [5000, 3000, 0],
      [0, 3000, 0],
    ],
  }, {
    idFactory: prefix => `${prefix}_1`,
  });

  assert.equal(result.ok, true);
  assert.equal(result.room.id, 'room_1');
  assert.equal(result.room.kind, 'room');
  assert.equal(result.room.area, 15000000);
});

test('pointInRoom detects inside point', () => {
  const result = createRoomGeometry({
    cmd: 'room.detect',
    boundary: [
      [0, 0, 0],
      [5000, 0, 0],
      [5000, 3000, 0],
      [0, 3000, 0],
    ],
  });

  assert.equal(pointInRoom([2500, 1500, 0], result.room), true);
  assert.equal(pointInRoom([6000, 1500, 0], result.room), false);
});
