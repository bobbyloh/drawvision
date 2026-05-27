const SERVICE_TYPES = [
  'water_supply',
  'waste_pipe',
  'electrical_point',
  'lighting_point',
  'switch_point',
  'exhaust_point',
  'gas_point',
  'data_point',
];

export function createServiceGeometry(command, options = {}) {
  const errors = validateServiceCreate(command);
  if (errors.length) return { ok: false, errors };

  const id = command.id || options.idFactory?.('service') || `service_${Date.now()}`;

  return {
    ok: true,
    service: {
      id,
      kind: 'service',
      serviceType: command.service_type,
      position: command.position,
      capacity: command.capacity || null,
      parentRoom: command.parent_room || null,
      connectedTo: command.connected_to || [],
      metadata: command.metadata || {},
    },
  };
}

export function validateServiceCreate(command) {
  const errors = [];

  if (!command || command.cmd !== 'service.create') {
    errors.push({ code: 'SERVICE_COMMAND_REQUIRED', message: 'Expected service.create command' });
    return errors;
  }

  if (!SERVICE_TYPES.includes(command.service_type)) {
    errors.push({ code: 'SERVICE_TYPE_INVALID', message: 'Invalid service type' });
  }

  if (!isPoint3(command.position)) {
    errors.push({ code: 'SERVICE_POSITION_INVALID', message: 'Service position must be [x,y,z]' });
  }

  return errors;
}

function isPoint3(value) {
  return Array.isArray(value)
    && value.length === 3
    && value.every(Number.isFinite);
}
