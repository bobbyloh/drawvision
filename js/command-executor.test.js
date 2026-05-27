import assert from 'node:assert/strict';
import test from 'node:test';
import { executeCommand } from './command-executor.js';

test('execute wall.create returns a created wall object', () => {
  const command = {
    cmd: 'wall.create',
    start: [0, 0, 0],
    end: [5000, 0, 0],
    height: 3200,
    thickness: 200,
    material: 'default_wall',
  };

  let nextId = 1;
  const result = executeCommand(command, {
    idFactory: prefix => `${prefix}_${nextId++}`,
  });

  assert.equal(result.ok, true);
  assert.equal(result.created.length, 1);
  assert.equal(result.created[0].id, 'wall_1');
  assert.equal(result.created[0].kind, 'wall');
});
