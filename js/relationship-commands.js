import {
  attachCabinetToWall,
  connectService,
  containObjectInRoom,
} from './relationship-engine.js';

export function executeRelationshipCommand(modelStore, command) {
  switch (command.cmd) {
    case 'cabinet.attach_to_wall':
      return attachCabinetToWall(
        modelStore,
        command.cabinet_id,
        command.wall_id,
      );

    case 'service.connect':
      return connectService(
        modelStore,
        command.object_id,
        command.service_id,
      );

    case 'room.contains':
      return containObjectInRoom(
        modelStore,
        command.object_id,
        command.room_id,
      );

    default:
      return {
        ok: false,
        errors: [
          {
            code: 'RELATIONSHIP_COMMAND_UNSUPPORTED',
            message: `Unsupported relationship command: ${command.cmd}`,
          },
        ],
      };
  }
}
