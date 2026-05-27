import { getNode, addRelationship } from './scene-graph.js';

export function attachCabinetToWall(modelStore, cabinetId, wallId) {
  const cabinet = getNode(modelStore.sceneGraph, cabinetId);
  const wall = getNode(modelStore.sceneGraph, wallId);

  if (!cabinet) return fail('CABINET_NOT_FOUND', `Cabinet not found: ${cabinetId}`);
  if (!wall) return fail('WALL_NOT_FOUND', `Wall not found: ${wallId}`);
  if (cabinet.kind !== 'cabinet') return fail('INVALID_CABINET', `${cabinetId} is not a cabinet`);
  if (wall.kind !== 'wall') return fail('INVALID_WALL', `${wallId} is not a wall`);

  cabinet.parentWall = wallId;

  addRelationship(modelStore.sceneGraph, {
    type: 'attached_to',
    parent: wallId,
    child: cabinetId,
  });

  return { ok: true, cabinet, wall };
}

export function connectService(modelStore, objectId, serviceId) {
  const object = getNode(modelStore.sceneGraph, objectId);
  const service = getNode(modelStore.sceneGraph, serviceId);

  if (!object) return fail('OBJECT_NOT_FOUND', `Object not found: ${objectId}`);
  if (!service) return fail('SERVICE_NOT_FOUND', `Service not found: ${serviceId}`);
  if (service.kind !== 'service') return fail('INVALID_SERVICE', `${serviceId} is not a service`);

  object.connectedServices = object.connectedServices || [];
  object.connectedServices.push(serviceId);

  service.connectedTo = service.connectedTo || [];
  service.connectedTo.push(objectId);

  addRelationship(modelStore.sceneGraph, {
    type: 'connected_to',
    parent: objectId,
    child: serviceId,
  });

  return { ok: true, object, service };
}

export function validateServiceDependencies(modelStore, objectId) {
  const object = getNode(modelStore.sceneGraph, objectId);
  if (!object) return fail('OBJECT_NOT_FOUND', `Object not found: ${objectId}`);

  const requirements = object.serviceRequirement || [];
  const connectedServices = (object.connectedServices || [])
    .map(id => getNode(modelStore.sceneGraph, id))
    .filter(Boolean)
    .map(service => service.serviceType);

  const missing = requirements.filter(required => !connectedServices.includes(required));

  if (missing.length) {
    return {
      ok: false,
      errors: missing.map(serviceType => ({
        code: 'SERVICE_DEPENDENCY_MISSING',
        message: `${object.id} requires ${serviceType}`,
        serviceType,
      })),
    };
  }

  return { ok: true };
}

function fail(code, message) {
  return {
    ok: false,
    errors: [{ code, message }],
  };
}


export function containObjectInRoom(modelStore, objectId, roomId) {
  const object = getNode(modelStore.sceneGraph, objectId);
  const room = getNode(modelStore.sceneGraph, roomId);

  if (!object) return fail('OBJECT_NOT_FOUND', `Object not found: ${objectId}`);
  if (!room) return fail('ROOM_NOT_FOUND', `Room not found: ${roomId}`);
  if (room.kind !== 'room') return fail('INVALID_ROOM', `${roomId} is not a room`);

  object.parentRoom = roomId;
  room.containedObjects = room.containedObjects || [];

  if (!room.containedObjects.includes(objectId)) {
    room.containedObjects.push(objectId);
  }

  addRelationship(modelStore.sceneGraph, {
    type: 'contained_in',
    parent: roomId,
    child: objectId,
  });

  return { ok: true, object, room };
}
