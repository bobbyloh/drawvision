export function sceneGraphToRenderableObjects(sceneGraph) {
  return Object.values(sceneGraph.nodes || {}).map(nodeToRenderable).filter(Boolean);
}

export function nodeToRenderable(node) {
  if (!node) return null;

  if (node.kind === 'wall') {
    return {
      id: node.id,
      type: 'wall',
      points: node.derived?.footprint || [],
      height: node.height,
      material: node.material,
      layer: node.layer,
      source: node,
    };
  }

  if (node.kind === 'cabinet') {
    return {
      id: node.id,
      type: 'cabinet',
      position: node.position,
      width: node.width,
      depth: node.depth,
      height: node.height,
      material: node.material,
      source: node,
    };
  }

  if (node.kind === 'service') {
    return {
      id: node.id,
      type: 'service',
      serviceType: node.serviceType,
      position: node.position,
      source: node,
    };
  }

  return null;
}
