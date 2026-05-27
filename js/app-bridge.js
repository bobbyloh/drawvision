import { createModelStore, dispatchCommand } from './model-store.js';
import { executeModuleCommand } from './module-orchestrator.js';
import { sceneGraphToRenderableObjects } from './render-adapter.js';

export function createAppBridge(state) {
  const modelStore = createModelStore();

  return {
    modelStore,

    dispatchCore(command) {
      const result = dispatchCommand(modelStore, command);
      if (result.ok) syncSceneGraphToLegacyState(state, modelStore);
      return result;
    },

    dispatchModule(command) {
      const result = executeModuleCommand(modelStore, command);
      if (result.ok) syncSceneGraphToLegacyState(state, modelStore);
      return result;
    },

    sync() {
      syncSceneGraphToLegacyState(state, modelStore);
    },
  };
}

export function syncSceneGraphToLegacyState(state, modelStore) {
  const renderables = sceneGraphToRenderableObjects(modelStore.sceneGraph);

  const legacyObjects = renderables.map(renderableToLegacyObject).filter(Boolean);

  state.objects = [
    ...state.objects.filter(object => !object.generatedFromSceneGraph),
    ...legacyObjects,
  ];

  return legacyObjects;
}

export function renderableToLegacyObject(renderable) {
  if (renderable.type === 'wall') {
    return {
      id: renderable.id,
      type: 'poly',
      layer: 'walls',
      points: renderable.points,
      fill: 'rgba(36,180,126,.18)',
      stroke: '#24b47e',
      weight: 2,
      closed: true,
      generatedFromSceneGraph: true,
      attrs: {
        source: 'sceneGraph',
        kind: 'wall',
        material: renderable.material || '',
      },
    };
  }

  if (renderable.type === 'room') {
    return {
      id: renderable.id,
      type: 'poly',
      layer: 'floor',
      points: renderable.points,
      fill: 'rgba(90,168,255,.10)',
      stroke: '#5aa8ff',
      weight: 2,
      closed: true,
      generatedFromSceneGraph: true,
      attrs: {
        source: 'sceneGraph',
        kind: 'room',
        roomType: renderable.roomType || '',
        area: String(renderable.area || ''),
      },
    };
  }

  if (renderable.type === 'cabinet') {
    const [x, y, z = 0] = renderable.position;
    const w = renderable.width;
    const d = renderable.depth;

    return {
      id: renderable.id,
      type: 'poly',
      layer: 'furniture',
      points: [
        [x, y, z],
        [x + w, y, z],
        [x + w, y + d, z],
        [x, y + d, z],
      ],
      fill: 'rgba(225,185,85,.18)',
      stroke: '#e1b955',
      weight: 2,
      closed: true,
      generatedFromSceneGraph: true,
      attrs: {
        source: 'sceneGraph',
        kind: 'cabinet',
        material: renderable.material || '',
      },
    };
  }

  if (renderable.type === 'service') {
    return {
      id: renderable.id,
      type: 'circle',
      layer: 'services',
      center: renderable.position,
      radius: 80,
      segments: 16,
      fill: 'rgba(245,158,11,.20)',
      stroke: '#f59e0b',
      weight: 2,
      generatedFromSceneGraph: true,
      attrs: {
        source: 'sceneGraph',
        kind: 'service',
        serviceType: renderable.serviceType || '',
      },
    };
  }

  return null;
}
