export function createSceneGraph() {
  return {
    nodes: {},
    relationships: [],
    layers: {},
    metadata: {
      version: 1,
    },
  };
}

export function addNode(sceneGraph, object) {
  if (!object.id) {
    throw new Error('Scene graph object requires id');
  }

  sceneGraph.nodes[object.id] = object;

  return object;
}

export function getNode(sceneGraph, id) {
  return sceneGraph.nodes[id] || null;
}

export function removeNode(sceneGraph, id) {
  delete sceneGraph.nodes[id];
}

export function addRelationship(sceneGraph, relationship) {
  sceneGraph.relationships.push(relationship);
}

export function getChildren(sceneGraph, parentId) {
  return sceneGraph.relationships
    .filter(rel => rel.parent === parentId)
    .map(rel => getNode(sceneGraph, rel.child))
    .filter(Boolean);
}
