import { createWallGeometry } from './wall-geometry.js';

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
