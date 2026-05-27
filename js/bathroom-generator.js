import { dispatchCommand } from './model-store.js';
import { executeRelationshipCommand } from './relationship-commands.js';
import { provisionKitchenServices } from './kitchen-services.js';

export function generateBathroom(modelStore, command) {
  const errors = validateBathroomGenerate(command);
  if (errors.length) return { ok: false, errors };

  const roomId = command.room_id;
  const start = command.start || [0, 0, 0];

  const fixtures = command.fixtures || [
    { type: 'vanity', width: 900, depth: 500, height: 850 },
    { type: 'wc', width: 700, depth: 750, height: 800 },
    { type: 'shower', width: 900, depth: 900, height: 2100 },
    { type: 'floor_trap', width: 150, depth: 150, height: 20 },
  ];

  const created = [];
  const services = [];
  const relationships = [];

  let x = start[0];
  const y = start[1];
  const z = start[2] || 0;

  for (const fixture of fixtures) {
    const fixtureResult = dispatchCommand(modelStore, {
      cmd: 'cabinet.create',
      type: fixture.type,
      width: fixture.width,
      depth: fixture.depth,
      height: fixture.height,
      position: [x, y, z],
      orientation: command.orientation || 0,
      material: fixture.material || command.material || 'default_bathroom_fixture',
    });

    if (!fixtureResult.ok) return fixtureResult;

    const object = fixtureResult.created[0];
    object.kind = 'fixture';
    object.fixtureType = fixture.type;

    created.push(object);

    if (roomId) {
      const rel = executeRelationshipCommand(modelStore, {
        cmd: 'room.contains',
        room_id: roomId,
        object_id: object.id,
      });

      if (!rel.ok) return rel;
      relationships.push(rel);
    }

    if (command.auto_services !== false && object.serviceRequirement?.length) {
      const serviceResult = provisionKitchenServices(modelStore, object);
      if (!serviceResult.ok) return serviceResult;
      services.push(...serviceResult.createdServices);
    }

    x += fixture.width + (command.spacing || 300);
  }

  return {
    ok: true,
    created,
    services,
    relationships,
  };
}

export function validateBathroomGenerate(command) {
  const errors = [];

  if (!command || command.cmd !== 'bathroom.generate') {
    errors.push({ code: 'BATHROOM_COMMAND_REQUIRED', message: 'Expected bathroom.generate command' });
    return errors;
  }

  if (command.start && !isPoint3(command.start)) {
    errors.push({ code: 'BATHROOM_START_INVALID', message: 'Bathroom start must be [x,y,z]' });
  }

  return errors;
}

function isPoint3(value) {
  return Array.isArray(value)
    && value.length === 3
    && value.every(Number.isFinite);
}
