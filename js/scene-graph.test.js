import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createSceneGraph,
  addNode,
  getNode,
  removeNode,
  addRelationship,
  getChildren,
} from './scene-graph.js';

test('scene graph stores nodes', () => {
  const graph = createSceneGraph();

  addNode(graph, {
    id: 'wall_1',
    kind: 'wall',
  });

  const wall = getNode(graph, 'wall_1');

  assert.equal(wall.kind, 'wall');
});

test('scene graph supports parent child relationships', () => {
  const graph = createSceneGraph();

  addNode(graph, {
    id: 'wall_1',
    kind: 'wall',
  });

  addNode(graph, {
    id: 'cabinet_1',
    kind: 'cabinet',
  });

  addRelationship(graph, {
    type: 'attached_to',
    parent: 'wall_1',
    child: 'cabinet_1',
  });

  const children = getChildren(graph, 'wall_1');

  assert.equal(children.length, 1);
  assert.equal(children[0].id, 'cabinet_1');
});

test('scene graph removes nodes', () => {
  const graph = createSceneGraph();

  addNode(graph, {
    id: 'wall_1',
    kind: 'wall',
  });

  removeNode(graph, 'wall_1');

  assert.equal(getNode(graph, 'wall_1'), null);
});
