const CABINET_TYPES = [
  'base_cabinet',
  'wall_cabinet',
  'tall_cabinet',
  'sink_base',
  'hob_base',
  'drawer_unit',
  'corner_cabinet',
  'appliance_tower',
  'island_cabinet',
];

export function createCabinetGeometry(command, options = {}) {
  const errors = validateCabinetCreate(command);
  if (errors.length) return { ok: false, errors };

  const id = command.id || options.idFactory?.('cabinet') || `cabinet_${Date.now()}`;

  return {
    ok: true,
    cabinet: {
      id,
      kind: 'cabinet',
      cabinetType: command.type,
      width: command.width,
      depth: command.depth,
      height: command.height,
      position: command.position,
      orientation: command.orientation,
      material: command.material || 'default_cabinet',
      clearanceFront: command.clearance_front ?? 900,
      parentWall: command.parent_wall || null,
      parentRoom: command.parent_room || null,
      serviceRequirement: command.service_requirement || [],
      derived: {
        footprint: deriveCabinetFootprint(command),
      },
    },
  };
}

export function validateCabinetCreate(command) {
  const errors = [];

  if (!command || command.cmd !== 'cabinet.create') {
    errors.push({ code: 'CABINET_COMMAND_REQUIRED', message: 'Expected cabinet.create command' });
    return errors;
  }

  if (!CABINET_TYPES.includes(command.type)) {
    errors.push({ code: 'CABINET_TYPE_INVALID', message: 'Invalid cabinet type' });
  }

  if (!isPositive(command.width)) errors.push({ code: 'CABINET_WIDTH_INVALID', message: 'Cabinet width must be positive' });
  if (!isPositive(command.depth)) errors.push({ code: 'CABINET_DEPTH_INVALID', message: 'Cabinet depth must be positive' });
  if (!isPositive(command.height)) errors.push({ code: 'CABINET_HEIGHT_INVALID', message: 'Cabinet height must be positive' });

  if (!isPoint3(command.position)) {
    errors.push({ code: 'CABINET_POSITION_INVALID', message: 'Cabinet position must be [x,y,z]' });
  }

  if (!Number.isFinite(command.orientation)) {
    errors.push({ code: 'CABINET_ORIENTATION_INVALID', message: 'Cabinet orientation must be finite degrees' });
  }

  return errors;
}

function deriveCabinetFootprint(command) {
  const [x, y, z = 0] = command.position;
  const w = command.width;
  const d = command.depth;

  return [
    [x, y, z],
    [x + w, y, z],
    [x + w, y + d, z],
    [x, y + d, z],
  ];
}

function isPositive(value) {
  return Number.isFinite(value) && value > 0;
}

function isPoint3(value) {
  return Array.isArray(value)
    && value.length === 3
    && value.every(Number.isFinite);
}
