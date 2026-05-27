import { generateKitchen } from './kitchen-generator.js';
import { generateBathroom } from './bathroom-generator.js';
import { autoContainAllObjects } from './room-containment.js';
import { validateServiceDependencies } from './relationship-engine.js';

export function executeModuleCommand(modelStore, command) {
  if (!command || !command.cmd) {
    return fail('MODULE_COMMAND_INVALID', 'Module command must include cmd');
  }

  switch (command.cmd) {
    case 'kitchen.generate':
      return generateKitchen(modelStore, command);

    case 'bathroom.generate':
      return generateBathroom(modelStore, command);

    case 'room.auto_contain':
      return autoContainAllObjects(modelStore);

    case 'service.validate':
      return validateServiceDependencies(modelStore, command.object_id);

    default:
      return fail('MODULE_COMMAND_UNSUPPORTED', `Unsupported module command: ${command.cmd}`);
  }
}

function fail(code, message) {
  return {
    ok: false,
    errors: [{ code, message }],
  };
}
