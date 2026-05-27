export function serializeModel(modelStore) {
  return JSON.stringify({
    version: 1,
    sceneGraph: modelStore.sceneGraph,
    commandHistory: modelStore.commandHistory,
    nextId: modelStore.nextId,
  }, null, 2);
}

export function deserializeModel(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;

  if (!data || data.version !== 1) {
    throw new Error('Unsupported DrawVision model version');
  }

  return {
    sceneGraph: data.sceneGraph,
    commandHistory: data.commandHistory || [],
    undoStack: [],
    redoStack: [],
    nextId: data.nextId || 1,
  };
}
