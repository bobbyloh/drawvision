import { getNode } from './scene-graph.js';
import { pointInRoom } from './room-geometry.js';
import { executeRelationshipCommand } from './relationship-commands.js';

export function autoContainObjectInRooms(modelStore, objectId) {
  const object = getNode(modelStore.sceneGraph, objectId);
  if (!object) return fail('OBJECT_NOT_FOUND', `Object not found: ${objectId}`);

  const point = getObjectAnchorPoint(object);
  if (!point) return fail('OBJECT_POINT_MISSING', `Object has no usable anchor point: ${objectId}`);

  const rooms = Object.values(modelStore.sceneGraph.nodes || {})
    .filter(node => node.kind === 'room');

  for (const room of rooms) {
    if (pointInRoom(point, room)) {
      return executeRelationshipCommand(modelStore, {
        cmd: 'room.contains',
        room_id: room.id,
        object_id: object.id,
      });
    }
  }

  return fail('NO_CONTAINING_ROOM', `No containing room found for ${objectId}`);
}

export function autoContainAllObjects(modelStore) {
  const results = [];

  const objects = Object.values(modelStore.sceneGraph.nodes || {})
    .filter(node => node.kind !== 'room' && !node.parentRoom);

  for (const object of objects) {
    const result = autoContainObjectInRooms(modelStore, object.id);
    results.push({
      objectId: object.id,
      ...result,
    });
  }

  return {
    ok: results.every(result => result.ok),
    results,
  };
}

export function getObjectAnchorPoint(object) {
  if (object.position) return object.position;
  if (object.derived?.centroid) return object.derived.centroid;
  if (object.derived?.bounds) {
    const { min, max } = object.derived.bounds;
    return [
      (min[0] + max[0]) / 2,
      (min[1] + max[1]) / 2,
      (min[2] + max[2]) / 2,
    ];
  }
  if (object.derived?.footprint?.length) {
    const points = object.derived.footprint;
    return [
      points.reduce((sum, point) => sum + point[0], 0) / points.length,
      points.reduce((sum, point) => sum + point[1], 0) / points.length,
      points.reduce((sum, point) => sum + (point[2] || 0), 0) / points.length,
    ];
  }
  return null;
}

function fail(code, message) {
  return {
    ok: false,
    errors: [{ code, message }],
  };
}
