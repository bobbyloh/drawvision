import { createWallGeometry } from './wall-geometry.js';
import { createCabinetGeometry } from './cabinet-geometry.js';
import { createServiceGeometry } from './service-geometry.js';
import { createRoomGeometry } from './room-geometry.js';
import { generateKitchen } from './kitchen-generator.js';
import { generateBathroom } from './bathroom-generator.js';

export function executeCommand(command, context = {}) {
  if (!command || !command.cmd) {
    return {
      ok: false,
      errors: [
        {
          code: 'COMMAND_INVALID',
          message: 'Command must include cmd',
        },
      ],
    };
  }

  switch (command.cmd) {
    case 'wall.create':
      return executeWallCreate(command, context);

    case 'cabinet.create':
      return executeCabinetCreate(command, context);

    case 'service.create':
      return executeServiceCreate(command, context);

    case 'room.detect':
      return executeRoomDetect(command, context);

    case 'kitchen.generate':
      return {
        ok: false,
        errors: [{ code: 'KITCHEN_REQUIRES_MODEL_STORE', message: 'kitchen.generate must be dispatched through module orchestration, not bare command executor' }],
      };

    case 'bathroom.generate':
      return {
        ok: false,
        errors: [{ code: 'BATHROOM_REQUIRES_MODEL_STORE', message: 'bathroom.generate must be dispatched through module orchestration, not bare command executor' }],
      };

    default:
      return {
        ok: false,
        errors: [
          {
            code: 'COMMAND_UNSUPPORTED',
            message: `Unsupported command: ${command.cmd}`,
          },
        ],
      };
  }
}

function executeWallCreate(command, context) {
  const result = createWallGeometry(command, {
    idFactory: context.idFactory,
  });

  if (!result.ok) return result;

  const wall = result.wall;

  return {
    ok: true,
    command,
    created: [wall],
    events: [
      {
        type: 'object.created',
        objectId: wall.id,
        objectKind: wall.kind,
      },
    ],
  };
}

function executeCabinetCreate(command, context) {
  const result = createCabinetGeometry(command, {
    idFactory: context.idFactory,
  });

  if (!result.ok) return result;

  const cabinet = result.cabinet;

  return {
    ok: true,
    command,
    created: [cabinet],
    events: [
      {
        type: 'object.created',
        objectId: cabinet.id,
        objectKind: cabinet.kind,
      },
    ],
  };
}

function executeServiceCreate(command, context) {
  const result = createServiceGeometry(command, {
    idFactory: context.idFactory,
  });

  if (!result.ok) return result;

  const service = result.service;

  return {
    ok: true,
    command,
    created: [service],
    events: [
      {
        type: 'object.created',
        objectId: service.id,
        objectKind: service.kind,
      },
    ],
  };
}


function executeRoomDetect(command, context) {
  const result = createRoomGeometry(command, {
    idFactory: context.idFactory,
  });

  if (!result.ok) return result;

  const room = result.room;

  return {
    ok: true,
    command,
    created: [room],
    events: [
      {
        type: 'object.created',
        objectId: room.id,
        objectKind: room.kind,
      },
    ],
  };
}
