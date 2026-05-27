import { getNode, removeNode, addNode } from './scene-graph.js';

export function undo(modelStore) {
  const entry = modelStore.undoStack.pop();

  if (!entry) {
    return {
      ok: false,
      message: 'Nothing to undo',
    };
  }

  const removedObjects = [];

  for (const id of entry.createdIds || []) {
    const object = getNode(modelStore.sceneGraph, id);
    if (object) {
      removedObjects.push(object);
      removeNode(modelStore.sceneGraph, id);
    }
  }

  modelStore.redoStack.push({
    ...entry,
    removedObjects,
  });

  return {
    ok: true,
    undone: entry,
  };
}

export function redo(modelStore) {
  const entry = modelStore.redoStack.pop();

  if (!entry) {
    return {
      ok: false,
      message: 'Nothing to redo',
    };
  }

  for (const object of entry.removedObjects || []) {
    addNode(modelStore.sceneGraph, object);
  }

  modelStore.undoStack.push({
    command: entry.command,
    createdIds: entry.createdIds,
  });

  return {
    ok: true,
    redone: entry,
  };
}
