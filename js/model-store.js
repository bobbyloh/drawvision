import { createSceneGraph, addNode } from './scene-graph.js';
import { executeCommand } from './command-executor.js';

export function createModelStore() {
  return {
    sceneGraph: createSceneGraph(),
    commandHistory: [],
    undoStack: [],
    redoStack: [],
    nextId: 1,
  };
}

export function createIdFactory(modelStore) {
  return prefix => `${prefix}_${modelStore.nextId++}`;
}

export function dispatchCommand(modelStore, command) {
  const result = executeCommand(command, {
    idFactory: createIdFactory(modelStore),
  });

  if (!result.ok) return result;

  for (const object of result.created || []) {
    addNode(modelStore.sceneGraph, object);
  }

  modelStore.commandHistory.push(command);
  modelStore.undoStack.push({
    command,
    createdIds: (result.created || []).map(object => object.id),
  });

  modelStore.redoStack = [];

  return {
    ...result,
    sceneGraph: modelStore.sceneGraph,
  };
}
