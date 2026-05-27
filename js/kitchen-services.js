import { dispatchCommand } from './model-store.js';
import { executeRelationshipCommand } from './relationship-commands.js';
import { validateServiceDependencies } from './relationship-engine.js';

export function provisionKitchenServices(modelStore, cabinet) {
  const requirements = cabinet.serviceRequirement || [];
  const createdServices = [];
  const connections = [];

  for (const serviceType of requirements) {
    const position = servicePositionForCabinet(cabinet, serviceType);

    const serviceResult = dispatchCommand(modelStore, {
      cmd: 'service.create',
      service_type: serviceType,
      position,
      parent_room: cabinet.parentRoom || null,
    });

    if (!serviceResult.ok) return serviceResult;

    const service = serviceResult.created[0];
    createdServices.push(service);

    const connection = executeRelationshipCommand(modelStore, {
      cmd: 'service.connect',
      object_id: cabinet.id,
      service_id: service.id,
    });

    if (!connection.ok) return connection;

    connections.push(connection);
  }

  const validation = validateServiceDependencies(modelStore, cabinet.id);

  return {
    ok: validation.ok,
    cabinet,
    createdServices,
    connections,
    validation,
    errors: validation.errors || [],
  };
}

export function servicePositionForCabinet(cabinet, serviceType) {
  const [x, y, z = 0] = cabinet.position;
  const width = cabinet.width || 600;
  const depth = cabinet.depth || 560;

  const centerX = x + width / 2;
  const backY = y;
  const frontY = y + depth;

  switch (serviceType) {
    case 'water_supply':
      return [centerX - 75, backY, z + 450];

    case 'waste_pipe':
      return [centerX + 75, backY, z + 150];

    case 'electrical_point':
      return [centerX, backY, z + 1100];

    case 'gas_point':
      return [centerX, backY, z + 650];

    case 'exhaust_point':
      return [centerX, backY, z + 2200];

    case 'lighting_point':
      return [centerX, frontY, z + 2200];

    default:
      return [centerX, backY, z];
  }
}
