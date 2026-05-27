import { dispatchCommand } from './model-store.js';
import { executeRelationshipCommand } from './relationship-commands.js';

export function generateKitchen(modelStore, command) {
  const errors = validateKitchenGenerate(command);
  if (errors.length) return { ok: false, errors };

  const created = [];
  const relationships = [];

  const roomId = command.room_id;
  const start = command.start || [0, 0, 0];
  const orientation = command.orientation || 0;

  const sequence = command.sequence || [
    'sink_base',
    'drawer_unit',
    'hob_base',
  ];

  let x = start[0];
  const y = start[1];
  const z = start[2] || 0;

  for (const type of sequence) {
    const cabinetCommand = {
      cmd: 'cabinet.create',
      type,
      width: command.default_width || 600,
      depth: command.default_depth || 560,
      height: command.default_height || 850,
      position: [x, y, z],
      orientation,
      material: command.material || 'default_cabinet',
    };

    const result = dispatchCommand(modelStore, cabinetCommand);
    if (!result.ok) return result;

    const cabinet = result.created[0];
    created.push(cabinet);

    if (roomId) {
      const rel = executeRelationshipCommand(modelStore, {
        cmd: 'room.contains',
        room_id: roomId,
        object_id: cabinet.id,
      });

      if (!rel.ok) return rel;
      relationships.push(rel);
    }

    x += cabinet.width;
  }

  return {
    ok: true,
    created,
    relationships,
  };
}

export function validateKitchenGenerate(command) {
  const errors = [];

  if (!command || command.cmd !== 'kitchen.generate') {
    errors.push({ code: 'KITCHEN_COMMAND_REQUIRED', message: 'Expected kitchen.generate command' });
    return errors;
  }

  const allowedLayouts = ['linear', 'galley', 'L-shaped', 'U-shaped', 'island'];
  if (command.layout_type && !allowedLayouts.includes(command.layout_type)) {
    errors.push({ code: 'KITCHEN_LAYOUT_INVALID', message: 'Invalid kitchen layout type' });
  }

  if (command.start && !isPoint3(command.start)) {
    errors.push({ code: 'KITCHEN_START_INVALID', message: 'Kitchen start must be [x,y,z]' });
  }

  return errors;
}

function isPoint3(value) {
  return Array.isArray(value)
    && value.length === 3
    && value.every(Number.isFinite);
}
