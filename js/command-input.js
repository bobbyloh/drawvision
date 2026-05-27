import { dispatchCommand } from './model-store.js';

export function dispatchJsonCommand(modelStore, jsonText) {
  let command;

  try {
    command = JSON.parse(jsonText);
  } catch {
    return {
      ok: false,
      errors: [
        {
          code: 'JSON_PARSE_ERROR',
          message: 'Command input must be valid JSON',
        },
      ],
    };
  }

  return dispatchCommand(modelStore, command);
}
