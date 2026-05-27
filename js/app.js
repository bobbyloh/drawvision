import { menuCommands, state, toolDefinitions, viewDefinitions } from './state.js';

const els = {
  toolRail: document.getElementById('toolRail'),
  viewPalette: document.getElementById('viewPalette'),
  gridLayer: document.getElementById('gridLayer'),
  modelLayer: document.getElementById('modelLayer'),
  previewLayer: document.getElementById('previewLayer'),
  canvas: document.getElementById('canvas'),
  viewport: document.getElementById('viewport'),
  hud: document.getElementById('hud'),
  status: document.getElementById('status'),
  measurementBox: document.getElementById('measurementBox'),
  commandHistory: document.getElementById('commandHistory'),
  promptForm: document.getElementById('promptForm'),
  promptInput: document.getElementById('promptInput'),
  quickCommand: document.getElementById('quickCommand'),
  commandInput: document.getElementById('commandInput'),
  trayBody: document.getElementById('trayBody'),
  openFileInput: document.getElementById('openFileInput'),
  commandWindow: document.getElementById('commandWindow'),
  menuPanel: document.getElementById('menuPanel'),
  contextMenu: document.getElementById('contextMenu'),
  homeScreen: document.getElementById('homeScreen'),
  recentList: document.getElementById('recentList'),
  saveStatus: document.getElementById('saveStatus'),
  settingsDialog: document.getElementById('settingsDialog'),
  memoryMeter: document.getElementById('memoryMeter'),
  memoryText: document.getElementById('memoryText'),
};

const initialObjects = JSON.parse(JSON.stringify(state.objects));
const initialLayers = JSON.parse(JSON.stringify(state.layers));
const storage = {
  current: 'drawvision.currentModel',
  recent: 'drawvision.recentModels',
  settings: 'drawvision.settings',
};

const toolHints = {
  select: 'Select: click entity, right-click properties, Space returns to select.',
  line: 'Line: click or . to pick points. Type a length in Measurements, Enter to create exact next segment.',
  poly: 'Poly: click or . for points. Type close to finish later; current prototype closes after 3+ points.',
  circle: 'Circle: first pick center, second pick radius. Type radius or diameter in Measurements.',
  rect: 'Rectangle: pick opposite corners. Type width,height in Measurements for an exact face.',
  text: 'Text: pick insertion point. Command: input text Your label.',
  move: 'Move: pick base point then destination. X/Y/Z constrains axis.',
  measure: 'Measure: pick from point, then to point.',
  camera: 'Camera: pick eye then target. Mouse wheel zoom keeps active tool.',
};

function screenPoint(point) {
  const [x, y, z = 0] = point;
  const env = state.env;
  if (state.ui.activeView === 'axon') {
    const isoX = (x - y) * env.pxPerFoot * 0.82;
    const isoY = (x + y) * env.pxPerFoot * 0.42 - z * env.pxPerFoot * 0.92;
    return [
      env.gridOrigin.x + env.gridFeet * env.pxPerFoot * 0.68 + isoX,
      env.gridOrigin.y + env.gridFeet * env.pxPerFoot * 0.9 - isoY,
    ];
  }
  if (state.ui.activeView === 'north') {
    return [
      env.gridOrigin.x + x * env.pxPerFoot,
      env.gridOrigin.y + env.gridFeet * env.pxPerFoot - z * env.pxPerFoot,
    ];
  }
  if (state.ui.activeView === 'east') {
    return [
      env.gridOrigin.x + y * env.pxPerFoot,
      env.gridOrigin.y + env.gridFeet * env.pxPerFoot - z * env.pxPerFoot,
    ];
  }
  return [
    env.gridOrigin.x + x * env.pxPerFoot,
    env.gridOrigin.y + (env.gridFeet - y) * env.pxPerFoot,
  ];
}

function screenRadius(radius) {
  return Math.max(1, radius * state.env.pxPerFoot * (state.ui.activeView === 'axon' ? 0.82 : 1));
}

function topPoint(point, height) {
  return [point[0], point[1], (point[2] || 0) + height];
}

function svgPoints(points) {
  return points.map(point => screenPoint(point).join(',')).join(' ');
}

function faceColor(color, opacity = 0.42) {
  if (color === 'transparent') return `rgba(36,180,126,${opacity})`;
  if (color.startsWith('rgba')) return color;
  if (!color.startsWith('#')) return color;
  const hex = color.slice(1);
  const value = hex.length === 3
    ? hex.split('').map(char => char + char).join('')
    : hex;
  const number = Number.parseInt(value, 16);
  const r = (number >> 16) & 255;
  const g = (number >> 8) & 255;
  const b = number & 255;
  return `rgba(${r},${g},${b},${opacity})`;
}

function modelPointFromEvent(event) {
  const svgPoint = els.canvas.createSVGPoint();
  svgPoint.x = event.clientX;
  svgPoint.y = event.clientY;
  const point = svgPoint.matrixTransform(els.canvas.getScreenCTM().inverse());
  const env = state.env;
  const x = (point.x - env.gridOrigin.x) / env.pxPerFoot;
  const y = (env.gridOrigin.y + env.gridFeet * env.pxPerFoot - point.y) / env.pxPerFoot;
  return [
    Math.max(0, Math.min(env.gridFeet, x)),
    Math.max(0, Math.min(env.gridFeet, y)),
    0,
  ];
}

function nearestNode(point) {
  const nodes = [];
  state.objects.forEach(object => {
    if (object.points) nodes.push(...object.points);
    if (object.center) nodes.push(object.center);
    if (object.point) nodes.push(object.point);
  });
  if (!nodes.length) return point;
  return nodes.reduce((nearest, node) => (
    Math.hypot(node[0] - point[0], node[1] - point[1]) < Math.hypot(nearest[0] - point[0], nearest[1] - point[1])
      ? node
      : nearest
  ), nodes[0]);
}

function snapPoint(point) {
  if (state.ui.snapNearestNode) return nearestNode(point);
  if (state.ui.snapGridIntersection) {
    return [
      Math.round(point[0] / state.env.gridSnapFeet) * state.env.gridSnapFeet,
      Math.round(point[1] / state.env.gridSnapFeet) * state.env.gridSnapFeet,
      Math.round((point[2] || 0) / state.env.gridSnapFeet) * state.env.gridSnapFeet,
    ];
  }
  return point;
}

function constrainedPoint(point) {
  if (!state.ui.axisLock || !state.pending.firstPoint) return point;
  const [baseX, baseY, baseZ = 0] = state.pending.firstPoint;
  const [x, y, z = 0] = point;
  if (state.ui.axisLock === 'x') return [x, baseY, baseZ];
  if (state.ui.axisLock === 'y') return [baseX, y, baseZ];
  if (state.ui.axisLock === 'z') return [baseX, baseY, z];
  return point;
}

function activePointFromEvent(event) {
  return constrainedPoint(snapPoint(modelPointFromEvent(event)));
}

function svgPointFromEvent(event) {
  const svgPoint = els.canvas.createSVGPoint();
  svgPoint.x = event.clientX;
  svgPoint.y = event.clientY;
  const point = svgPoint.matrixTransform(els.canvas.getScreenCTM().inverse());
  return [point.x, point.y];
}

function fmtPoint(point) {
  return `${point[0]}',${point[1]}',${point[2] || 0}'`;
}

function log(line) {
  state.ui.commandHistory.push(line);
  state.ui.commandHistory = state.ui.commandHistory.slice(-50);
  els.commandHistory.textContent = state.ui.commandHistory.join('\n');
  els.commandHistory.scrollTop = els.commandHistory.scrollHeight;
}

function setMeasurement(value) {
  state.ui.measurement = value;
  els.measurementBox.value = value;
}

function saveSettings() {
  localStorage.setItem(storage.settings, JSON.stringify(state.settings));
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(storage.settings) || '{}');
    state.settings = { ...state.settings, ...saved };
  } catch {
    state.settings = { ...state.settings };
  }
}

function applySettingsToUi() {
  document.documentElement.style.setProperty('--red', state.settings.axisX);
  document.documentElement.style.setProperty('--blue', state.settings.axisY);
  document.documentElement.style.setProperty('--gold', state.settings.inference);
  document.body.classList.toggle('high-contrast', state.settings.highContrast);
  state.env.gridFeet = Number(state.env.gridFeet);
  state.env.gridSnapFeet = Number(state.env.gridSnapFeet);
}

function settingInput(id) {
  return document.getElementById(id);
}

function estimateMemoryUsage() {
  const bytes = new Blob([JSON.stringify(modelSnapshot()), JSON.stringify(state.undoStack)]).size;
  const softLimit = 5 * 1024 * 1024;
  const percent = Math.min(100, Math.round(bytes / softLimit * 100));
  return { bytes, percent };
}

function renderSettingsDialog() {
  const ids = {
    settingAutosave: state.settings.autosave,
    settingAutosaveInterval: state.settings.autosaveInterval,
    settingTemplate: state.settings.template,
    settingGridFeet: state.env.gridFeet,
    settingGridSnap: state.env.gridSnapFeet,
    settingAxisX: state.settings.axisX,
    settingAxisY: state.settings.axisY,
    settingInference: state.settings.inference,
    settingHighContrast: state.settings.highContrast,
    settingInputDevice: state.settings.inputDevice,
    settingInvertZoom: state.settings.invertZoom,
    settingInvertPan: state.settings.invertPan,
    settingZoomSensitivity: state.settings.zoomSensitivity,
    settingPanSensitivity: state.settings.panSensitivity,
    settingOrbitSensitivity: state.settings.orbitSensitivity,
    settingMemoryWarnings: state.settings.memoryWarnings,
    settingMemoryThreshold: state.settings.memoryThreshold,
    settingClearUndo: state.settings.clearUndoOnOptimize,
  };
  Object.entries(ids).forEach(([id, value]) => {
    const input = settingInput(id);
    if (!input) return;
    if (input.type === 'checkbox') input.checked = Boolean(value);
    else input.value = value;
  });
  const usage = estimateMemoryUsage();
  if (els.memoryMeter) els.memoryMeter.style.width = `${usage.percent}%`;
  if (els.memoryText) els.memoryText.textContent = `${(usage.bytes / 1024).toFixed(1)} KB model + undo estimate (${usage.percent}% of local soft limit)`;
}

function readSettingsDialog() {
  state.settings.autosave = settingInput('settingAutosave').checked;
  state.settings.autosaveInterval = Number(settingInput('settingAutosaveInterval').value || 30);
  state.settings.template = settingInput('settingTemplate').value;
  state.env.gridFeet = Number(settingInput('settingGridFeet').value || 20);
  state.env.gridSnapFeet = Number(settingInput('settingGridSnap').value || 1);
  state.settings.axisX = settingInput('settingAxisX').value;
  state.settings.axisY = settingInput('settingAxisY').value;
  state.settings.inference = settingInput('settingInference').value;
  state.settings.highContrast = settingInput('settingHighContrast').checked;
  state.settings.inputDevice = settingInput('settingInputDevice').value;
  state.settings.invertZoom = settingInput('settingInvertZoom').checked;
  state.settings.invertPan = settingInput('settingInvertPan').checked;
  state.settings.zoomSensitivity = Number(settingInput('settingZoomSensitivity').value || 1);
  state.settings.panSensitivity = Number(settingInput('settingPanSensitivity').value || 1);
  state.settings.orbitSensitivity = Number(settingInput('settingOrbitSensitivity').value || 1);
  state.settings.memoryWarnings = settingInput('settingMemoryWarnings').checked;
  state.settings.memoryThreshold = Number(settingInput('settingMemoryThreshold').value || 80);
  state.settings.clearUndoOnOptimize = settingInput('settingClearUndo').checked;
}

function openSettingsDialog() {
  renderSettingsDialog();
  els.settingsDialog.classList.add('open');
  state.ui.status = 'app settings open';
}

function applySettingsFromDialog() {
  readSettingsDialog();
  saveSettings();
  applySettingsToUi();
  saveLocal();
  renderAll();
  state.ui.status = 'app settings applied';
}

function resetSettings() {
  localStorage.removeItem(storage.settings);
  state.settings = {
    autosave: true,
    autosaveInterval: 30,
    template: 'architectural',
    axisX: '#e45d5d',
    axisY: '#5aa8ff',
    inference: '#e1b955',
    highContrast: false,
    inputDevice: 'mouse',
    invertZoom: false,
    invertPan: false,
    zoomSensitivity: 1,
    panSensitivity: 1,
    orbitSensitivity: 1,
    memoryWarnings: true,
    memoryThreshold: 80,
    clearUndoOnOptimize: true,
  };
  applySettingsToUi();
  renderSettingsDialog();
  renderAll();
  state.ui.status = 'app settings reset';
}

function optimizeMemory() {
  if (state.settings.clearUndoOnOptimize) state.undoStack = [];
  localStorage.removeItem(storage.recent);
  saveLocal();
  renderSettingsDialog();
  state.ui.status = 'memory optimized';
}

function commandCatalog() {
  const menuItems = Object.values(menuCommands).flat().map(([name, command]) => ({ name, command }));
  const toolItems = toolDefinitions.map(tool => ({ name: tool.label, command: tool.command }));
  const conceptItems = [
    { name: 'Raise or lower geometry', command: 'move from point to point', tags: 'raise lower vertical z move' },
    { name: 'Arrange or copy objects', command: 'rep n 3 x', tags: 'arrange copy array repeat duplicate' },
    { name: 'Make 3D from face', command: 'extrude selected z 10', tags: 'push pull raise solid height' },
    { name: 'Hide or dashed geometry', command: 'hidden line', tags: 'hide hidden dashed xray display' },
    { name: 'Materials and styles', command: 'visualization panel', tags: 'material style environment render color' },
    { name: 'Location and terrain', command: 'add location', tags: 'geo map terrain site north coordinate' },
    { name: 'AI command help', command: 'ai assistant', tags: 'assistant help generate render prompt ai' },
  ];
  return [...menuItems, ...toolItems, ...conceptItems];
}

function searchCommands(query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  state.ui.searchResults = commandCatalog()
    .map(item => {
      const haystack = `${item.name} ${item.command} ${item.tags || ''}`.toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { ...item, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 10);
  state.ui.activeTray = 'search';
  state.ui.status = `search results for "${query}"`;
}

const systemDocuments = {
  readme: {
    title: 'System README',
    source: 'README.md',
    summary: 'DrawVision is mental CAD: a command-first design system where intent becomes editable geometry instead of dead shapes.',
    points: [
      'Keep the model structured and editable.',
      'Treat prompts, pointer tools, and menus as command producers.',
      'Use the app as a CAD compiler, not a direct viewport mutation surface.',
    ],
  },
  roadmap: {
    title: 'Roadmap',
    source: 'DRAWVISION_ROADMAP.md',
    summary: 'Natural language should produce editable command chains that can be reviewed, repeated, sorted, transformed, and edited later.',
    points: [
      'Command families: create, select, reference, transform, axis, loop, 3D, organize, style, and query.',
      'Borrow precision ideas carefully from command prompts, object snaps, inference locking, groups, and components.',
      'Mental CAD workflow: think it, describe it, review the command chain, run it, select and transform by reference, keep the model editable.',
    ],
  },
  tightening: {
    title: 'Code Tightening',
    source: 'CODE_TIGHTENING_ROADMAP.md',
    summary: 'Professional interiors CAD requires a trustworthy model: parametric objects, deterministic commands, validation, transactions, and exact reload behavior.',
    points: [
      'Move mutation out of UI code and into a command executor.',
      'Separate canonical geometry, scene graph, UI state, serialization, and renderer responsibilities.',
      'Prioritize wall.create, cabinet.create, service dependencies, kitchen.generate, and bathroom.generate as professional interiors milestones.',
    ],
  },
  guidelines: {
    title: 'System Guidelines',
    source: 'DRAWVISION_REALIGNMENT_PLAN.md',
    summary: 'DrawVision is being realigned as an AI-native CAD/geometric compiler with thin UI, validated commands, and parametric objects.',
    points: [
      'AI may propose commands, but it must not mutate geometry, scene graph, renderer, files, or viewport state directly.',
      'Every design element should be parametric and serializable.',
      'Commands own state mutation, validation protects the model, and MCP connects external services.',
    ],
  },
  architecture: {
    title: 'Architecture',
    source: 'DRAWVISION_ARCHITECTURE.md',
    summary: 'User intent flows through structured CAD commands, validation, geometry kernel, scene graph, viewport renderer, and serialization, including coordinated interiors and realization systems.',
    points: [
      'Geometry kernel owns geometry truth.',
      'Wall paneling, furnishing layouts, ceiling treatments, concealed lights, features, services, accessibility, and serviceability are considered in one stream.',
      'Lighting, circuits, wire runs, ducts, diffusers, returns, and ceiling coordination zones are parametric service objects.',
    ],
  },
  geometry: {
    title: 'Geometry Rules',
    source: 'GEOMETRY_RULES.md',
    summary: 'Native project units are millimeters. Persistent objects are created or changed only by validated commands.',
    points: [
      'Object IDs are stable, unique, and centrally generated when omitted.',
      'Validation failures are atomic: no geometry, scene graph, selection, undo, or dirty-state mutation.',
      'Paneling, furniture, ceiling treatments, features, lighting, wiring, mechanical systems, accessibility, and services carry parameters, clearances, dependencies, and serialization state.',
    ],
  },
  modules: {
    title: 'Module System',
    source: 'MODULE_SYSTEM.md',
    summary: 'Modules define parametric object types, command handlers, validation rules, dependencies, serialization contracts, and future MCP interfaces.',
    points: [
      'Core modules: room, cabinet, kitchen, bathroom, furniture, interiors/features, accessibility/serviceability, service connection, lighting/electrical, mechanical, hospitality, rendering, and presentation export.',
      'Modules do not bypass the command executor or mutate the viewport directly.',
      'Module handlers return transaction deltas, created or modified IDs, warnings, and measurements.',
    ],
  },
  mcp: {
    title: 'MCP Contracts',
    source: 'MCP_SERVERS.md',
    summary: 'MCP is DrawVision\'s connected-services layer, not a UI feature or privileged mutation path.',
    points: [
      'Planned servers: filesystem, geometry, rendering, hospitality, presentation, product catalog, and cost estimation.',
      'All MCP writes submit JSON CAD commands and receive command results.',
      'Dry runs validate and plan commands without mutation.',
    ],
  },
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function markDirty(reason = 'edited') {
  state.project.dirty = true;
  state.ui.status = state.ui.status || reason;
  updateSaveStatus();
}

function modelSnapshot() {
  return {
    version: 1,
    project: { ...state.project, savedAt: new Date().toISOString(), dirty: false },
    env: state.env,
    layers: state.layers,
    objects: state.objects,
    groups: state.groups,
    activeGroupId: state.activeGroupId,
    selectedIds: state.selectedIds,
    camera: state.camera,
    viewBox: state.viewBox,
  };
}

function applyModelSnapshot(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.objects)) return false;
  state.project = {
    ...state.project,
    ...(snapshot.project || {}),
    dirty: false,
    savedAt: snapshot.project?.savedAt || new Date().toISOString(),
  };
  if (snapshot.env) state.env = snapshot.env;
  state.layers = snapshot.layers || state.layers;
  state.objects = snapshot.objects;
  state.groups = snapshot.groups || [];
  state.activeGroupId = snapshot.activeGroupId || null;
  state.selectedIds = snapshot.selectedIds || [];
  state.camera = snapshot.camera || state.camera;
  state.viewBox = snapshot.viewBox || state.viewBox;
  resetPending();
  return true;
}

function recentModels() {
  try {
    return JSON.parse(localStorage.getItem(storage.recent) || '[]');
  } catch {
    return [];
  }
}

function writeRecent(snapshot) {
  const recent = recentModels().filter(item => item.name !== snapshot.project.name);
  recent.unshift({
    name: snapshot.project.name,
    savedAt: snapshot.project.savedAt,
    objectCount: snapshot.objects.length,
  });
  localStorage.setItem(storage.recent, JSON.stringify(recent.slice(0, 5)));
}

function saveLocal() {
  const snapshot = modelSnapshot();
  state.project.savedAt = snapshot.project.savedAt;
  state.project.dirty = false;
  localStorage.setItem(storage.current, JSON.stringify(snapshot));
  writeRecent(snapshot);
  updateSaveStatus();
  renderRecentList();
  return snapshot;
}

function updateSaveStatus() {
  if (!els.saveStatus) return;
  const time = state.project.savedAt ? new Date(state.project.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'not saved';
  els.saveStatus.textContent = state.project.dirty ? `Unsaved changes` : `Saved ${time}`;
}

function renderRecentList() {
  if (!els.recentList) return;
  const recent = recentModels();
  els.recentList.innerHTML = recent.length
    ? recent.map(item => `<div class="recent-item"><strong>${item.name}</strong><span>${item.objectCount} objects · ${new Date(item.savedAt).toLocaleString()}</span></div>`).join('')
    : '<div class="recent-item"><strong>No recent local models</strong><span>Create or open a model to populate this list.</span></div>';
}

function downloadText(filename, mimeType, content) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseLength(value) {
  const text = String(value).trim().toLowerCase();
  const match = text.match(/^(-?\d+(?:\.\d+)?)(?:\s*)(mm|cm|m|in|"|ft|')?$/);
  if (!match) return null;
  const number = Number(match[1]);
  const unit = match[2] || "'";
  if (unit === 'mm') return number / 304.8;
  if (unit === 'cm') return number / 30.48;
  if (unit === 'm') return number / 0.3048;
  if (unit === 'in' || unit === '"') return number / 12;
  return number;
}

function pointAtDistance(from, toward, distance) {
  let dx = toward[0] - from[0];
  let dy = toward[1] - from[1];
  let dz = (toward[2] || 0) - (from[2] || 0);
  if (state.ui.axisLock === 'x') { dy = 0; dz = 0; }
  if (state.ui.axisLock === 'y') { dx = 0; dz = 0; }
  if (state.ui.axisLock === 'z') { dx = 0; dy = 0; }
  const length = Math.hypot(dx, dy, dz) || 1;
  return [
    from[0] + dx / length * distance,
    from[1] + dy / length * distance,
    (from[2] || 0) + dz / length * distance,
  ];
}

function selectedObjects() {
  return state.objects.filter(object => state.selectedIds.includes(object.id));
}

function polygonArea(points = []) {
  if (points.length < 3) return 0;
  const sum = points.reduce((total, point, index) => {
    const next = points[(index + 1) % points.length];
    return total + point[0] * next[1] - next[0] * point[1];
  }, 0);
  return Math.abs(sum) / 2;
}

function objectLength(object) {
  if (object.type === 'line') return Math.hypot(
    object.points[1][0] - object.points[0][0],
    object.points[1][1] - object.points[0][1],
    (object.points[1][2] || 0) - (object.points[0][2] || 0),
  );
  if (object.type === 'circle') return 2 * Math.PI * object.radius;
  if (object.points) {
    return object.points.reduce((total, point, index) => {
      const next = object.points[(index + 1) % object.points.length];
      if (!next || (!object.closed && index === object.points.length - 1)) return total;
      return total + Math.hypot(next[0] - point[0], next[1] - point[1], (next[2] || 0) - (point[2] || 0));
    }, 0);
  }
  return 0;
}

function modelStats() {
  return state.objects.reduce((stats, object) => {
    stats.objects += 1;
    if (object.type === 'poly') stats.area += polygonArea(object.points);
    if (object.extrudeHeight) stats.volume += polygonArea(object.points || []) * object.extrudeHeight;
    stats.length += objectLength(object);
    return stats;
  }, { objects: 0, area: 0, volume: 0, length: 0 });
}

function materialById(id) {
  return state.materials.find(material => material.id === id);
}

function renderGrid() {
  const env = state.env;
  const edge = env.gridFeet * env.pxPerFoot;
  const lines = [];
  const gridLine = (klass, a, b) => {
    const [x1, y1] = screenPoint(a);
    const [x2, y2] = screenPoint(b);
    return `<line class="${klass}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>`;
  };

  if (state.ui.activeView !== 'top') {
    for (let i = 0; i <= env.gridFeet; i += env.gridSnapFeet) {
      const klass = i % 5 === 0 ? 'grid-major' : 'grid-minor';
      lines.push(gridLine(klass, [i, 0, 0], [i, env.gridFeet, 0]));
      lines.push(gridLine(klass, [0, i, 0], [env.gridFeet, i, 0]));
      if (i % 5 === 0 || i === env.gridFeet) {
        const [lx, ly] = screenPoint([i, 0, 0]);
        lines.push(`<text class="grid-label" x="${lx - 6}" y="${ly + 18}">${i}'</text>`);
      }
    }
    lines.push(gridLine('axis-x', [0, 0, 0], [env.gridFeet, 0, 0]));
    lines.push(gridLine('axis-y', [0, 0, 0], [0, env.gridFeet, 0]));
    lines.push(`<text class="grid-label" x="${env.gridOrigin.x}" y="${env.gridOrigin.y - 14}">Model space ${env.gridFeet}' x ${env.gridFeet}' - ${state.ui.activeView}</text>`);
    els.gridLayer.innerHTML = lines.join('');
    return;
  }

  for (let i = 0; i <= env.gridFeet; i += env.gridSnapFeet) {
    const p = i * env.pxPerFoot;
    const klass = i % 5 === 0 ? 'grid-major' : 'grid-minor';
    lines.push(`<line class="${klass}" x1="${env.gridOrigin.x + p}" y1="${env.gridOrigin.y}" x2="${env.gridOrigin.x + p}" y2="${env.gridOrigin.y + edge}"></line>`);
    lines.push(`<line class="${klass}" x1="${env.gridOrigin.x}" y1="${env.gridOrigin.y + p}" x2="${env.gridOrigin.x + edge}" y2="${env.gridOrigin.y + p}"></line>`);
    if (i % 5 === 0 || i === env.gridFeet) {
      lines.push(`<text class="grid-label" x="${env.gridOrigin.x + p - 6}" y="${env.gridOrigin.y + edge + 18}">${i}'</text>`);
      lines.push(`<text class="grid-label" x="${env.gridOrigin.x - 30}" y="${env.gridOrigin.y + edge - p + 4}">${i}'</text>`);
    }
  }
  lines.push(`<line class="axis-x" x1="${env.gridOrigin.x}" y1="${env.gridOrigin.y + edge}" x2="${env.gridOrigin.x + edge}" y2="${env.gridOrigin.y + edge}"></line>`);
  lines.push(`<line class="axis-y" x1="${env.gridOrigin.x}" y1="${env.gridOrigin.y}" x2="${env.gridOrigin.x}" y2="${env.gridOrigin.y + edge}"></line>`);
  lines.push(`<text class="grid-label" x="${env.gridOrigin.x}" y="${env.gridOrigin.y - 14}">Model space ${env.gridFeet}' x ${env.gridFeet}' - ${env.scale}</text>`);
  els.gridLayer.innerHTML = lines.join('');
}

function renderObject(object) {
  const selected = state.selectedIds.includes(object.id) ? ' selected' : '';
  const material = materialById(object.attrs?.material);
  const stroke = object.stroke || material?.stroke || '#f1f4f7';
  const fill = object.fill || material?.fill || 'transparent';
  const weight = object.weight || 2;
  const z = object.extrudeHeight || 0;

  if (object.type === 'line') {
    const [a, b] = object.points;
    const [sa, sb] = [a, b].map(screenPoint);
    if (z && state.ui.activeView !== 'top') {
      const [ta, tb] = [topPoint(a, z), topPoint(b, z)].map(screenPoint);
      return `
        <polygon class="object-poly" points="${[sa, sb, tb, ta].map(point => point.join(',')).join(' ')}" fill="${faceColor(stroke, .24)}" stroke="${stroke}" stroke-width="1"></polygon>
        <line data-id="${object.id}" class="object-line${selected}" x1="${sa[0]}" y1="${sa[1]}" x2="${sb[0]}" y2="${sb[1]}" stroke="${stroke}" stroke-width="${weight}"></line>
        <line class="object-line" x1="${ta[0]}" y1="${ta[1]}" x2="${tb[0]}" y2="${tb[1]}" stroke="${stroke}" stroke-width="${weight * .75}"></line>
      `;
    }
    return `<line data-id="${object.id}" class="object-line${selected}" x1="${sa[0]}" y1="${sa[1]}" x2="${sb[0]}" y2="${sb[1]}" stroke="${stroke}" stroke-width="${weight}"></line>`;
  }
  if (object.type === 'poly') {
    const hiddenClass = state.ui.hiddenLineDisplay ? ' hidden-line' : '';
    const basePoints = object.points;
    if (!z || state.ui.activeView === 'top') {
      return `<polygon data-id="${object.id}" class="object-poly${selected}" points="${svgPoints(basePoints)}" fill="${fill}" stroke="${stroke}" stroke-width="${weight}"></polygon>`;
    }
    const topPoints = basePoints.map(point => topPoint(point, z));
    const sides = basePoints.map((point, index) => {
      const next = basePoints[(index + 1) % basePoints.length];
      const topPointAtIndex = topPoints[index];
      const topNext = topPoints[(index + 1) % topPoints.length];
      const shade = index % 2 === 0 ? .34 : .22;
      return `<polygon class="object-poly${hiddenClass}" points="${svgPoints([point, next, topNext, topPointAtIndex])}" fill="${faceColor(stroke, shade)}" stroke="${stroke}" stroke-width="1"></polygon>`;
    }).join('');
    return `
      ${sides}
      <polygon class="object-poly${hiddenClass}" points="${svgPoints(topPoints)}" fill="${faceColor(fill, .72)}" stroke="${stroke}" stroke-width="${weight}"></polygon>
      <polygon data-id="${object.id}" class="object-poly${selected}" points="${svgPoints(basePoints)}" fill="${faceColor(fill, .18)}" stroke="${stroke}" stroke-width="${Math.max(1, weight * .7)}"></polygon>
    `;
  }
  if (object.type === 'circle') {
    const center = screenPoint(object.center);
    const radius = screenRadius(object.radius);
    if (z && state.ui.activeView !== 'top') {
      const top = screenPoint(topPoint(object.center, z));
      const ry = state.ui.activeView === 'axon' ? radius * .58 : radius;
      return `
        <path class="object-poly" d="M ${center[0] - radius} ${center[1]} L ${top[0] - radius} ${top[1]} A ${radius} ${ry} 0 0 1 ${top[0] + radius} ${top[1]} L ${center[0] + radius} ${center[1]} A ${radius} ${ry} 0 0 0 ${center[0] - radius} ${center[1]}" fill="${faceColor(stroke, .24)}" stroke="${stroke}" stroke-width="1"></path>
        <ellipse class="object-circle" cx="${top[0]}" cy="${top[1]}" rx="${radius}" ry="${ry}" fill="${faceColor(fill, .7)}" stroke="${stroke}" stroke-width="${weight}"></ellipse>
        <ellipse data-id="${object.id}" class="object-circle${selected}" cx="${center[0]}" cy="${center[1]}" rx="${radius}" ry="${ry}" fill="${faceColor(fill, .15)}" stroke="${stroke}" stroke-width="${Math.max(1, weight * .7)}"></ellipse>
      `;
    }
    return `<circle data-id="${object.id}" class="object-circle${selected}" cx="${center[0]}" cy="${center[1]}" r="${radius}" fill="${fill === 'transparent' ? 'transparent' : fill}" stroke="${stroke}" stroke-width="${weight}"></circle>`;
  }
  if (object.type === 'text') {
    const point = screenPoint(object.point);
    return `<text data-id="${object.id}" class="object-text${selected}" x="${point[0]}" y="${point[1]}" fill="${stroke}">${object.text}</text>`;
  }
  return '';
}

function objectNodes(object) {
  if (object.points) return object.points;
  if (object.center) return [object.center];
  if (object.point) return [object.point];
  return [];
}

function renderNodeMarkers() {
  if (!state.ui.showNodes) return '';
  return state.objects.flatMap(object => objectNodes(object).map((point, index) => {
    const [x, y] = screenPoint(point);
    return `<g><circle class="node-marker" cx="${x}" cy="${y}" r="4"></circle><text class="node-label" x="${x + 6}" y="${y - 6}">${object.id}:${index}</text></g>`;
  })).join('');
}

function renderModel() {
  els.modelLayer.innerHTML = state.objects
    .filter(object => state.layers.find(layer => layer.id === object.layer)?.visible)
    .map(renderObject)
    .join('') + renderNodeMarkers();
}

function renderPreview() {
  const point = state.pending.lastPoint;
  if (!point) {
    els.previewLayer.innerHTML = '';
    return;
  }
  const [x, y] = screenPoint(point);
  let preview = `<path class="preview" d="M ${x - 8} ${y} L ${x + 8} ${y} M ${x} ${y - 8} L ${x} ${y + 8}"></path><text class="snap-text" x="${x + 12}" y="${y - 12}">${fmtPoint(point)}</text>`;
  if (state.pending.firstPoint) {
    const [a, b] = [state.pending.firstPoint, point].map(screenPoint);
    preview += `<line class="preview" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"></line>`;
  }
  if (state.pending.circleCenter) {
    const c = screenPoint(state.pending.circleCenter);
    preview += `<circle class="preview" cx="${c[0]}" cy="${c[1]}" r="${Math.hypot(x - c[0], y - c[1])}"></circle>`;
  }
  if (state.pending.rectStart) {
    const a = screenPoint(state.pending.rectStart);
    const minX = Math.min(a[0], x);
    const minY = Math.min(a[1], y);
    preview += `<rect class="preview" x="${minX}" y="${minY}" width="${Math.abs(x - a[0])}" height="${Math.abs(y - a[1])}"></rect>`;
  }
  if (state.pending.cameraEye) {
    const eye = screenPoint(state.pending.cameraEye);
    preview += `<line class="preview" x1="${eye[0]}" y1="${eye[1]}" x2="${x}" y2="${y}"></line><text class="snap-text" x="${eye[0] + 10}" y="${eye[1] - 10}">EYE</text><text class="snap-text" x="${x + 10}" y="${y + 18}">TARGET</text>`;
  }
  els.previewLayer.innerHTML = preview;
}

function renderHud() {
  els.status.textContent = state.ui.status;
  els.hud.innerHTML = [
    `Tool ${state.ui.activeTool}`,
    `View ${state.ui.activeView}`,
    `Axis ${state.ui.axisLock || 'free'}`,
    state.ui.graphicSelector ? '. graphic pick' : 'typed pick',
    state.ui.snapNearestNode ? 'F nearest node' : 'F nearest off',
    state.ui.snapGridIntersection ? 'G grid intersection' : 'G grid off',
    state.env.modelUnit,
    `Scale ${state.env.scale}`,
    `Text ${state.env.textSpace}`,
    `${state.selectedIds.length} selected`,
    state.camera.mode === 'perspective' ? `PV ${fmtPoint(state.camera.eye)} to ${fmtPoint(state.camera.target)}` : 'Ortho',
    state.ui.hiddenLineDisplay ? 'Hidden dashed' : 'Hidden off',
    state.ui.showNodes ? 'Nodes all' : 'Nodes off',
  ].map(text => `<span class="chip">${text}</span>`).join('');
}

function renderTools() {
  els.toolRail.innerHTML = toolDefinitions.map(tool => `
    <button class="tool-button ${state.ui.activeTool === tool.id ? 'active' : ''}" data-command="${tool.command}" title="${tool.key}">${tool.label}</button>
  `).join('');
}

function renderViews() {
  els.viewPalette.innerHTML = viewDefinitions.map(view => `
    <button class="${state.ui.activeView === view.id ? 'active' : ''}" data-command="${view.command}">${view.label}</button>
  `).join('');
}

function renderTray() {
  const selected = selectedObjects()[0];
  if (state.ui.activeTray === 'layers') {
    els.trayBody.innerHTML = `<h3 class="tray-section-title">Layers</h3>` + state.layers.map(layer => `
      <div class="tray-card">
        <strong>${layer.name}</strong>
        <span>${layer.visible ? 'visible' : 'hidden'} / ${layer.locked ? 'locked' : 'editable'}</span>
        <button class="tray-action" data-layer-toggle="${layer.id}">${layer.visible ? 'Hide' : 'Show'} layer</button>
      </div>
    `).join('');
    return;
  }
  if (state.ui.activeTray === 'scenes') {
    els.trayBody.innerHTML = `<h3 class="tray-section-title">Views / Scenes</h3>` + viewDefinitions.map(view => `
      <div class="tray-card">
        <strong>${view.label}</strong>
        <span>${view.command}</span>
        <button class="tray-action" data-command="${view.command}">Set view</button>
      </div>
    `).join('');
    return;
  }
  if (state.ui.activeTray === 'outliner') {
    const stats = modelStats();
    els.trayBody.innerHTML = `
      <h3 class="tray-section-title">Model Outliner</h3>
      <div class="tray-card">
        <strong>${state.project.name}</strong>
        <span>${stats.objects} objects / ${stats.area.toFixed(1)} sf faces / ${stats.volume.toFixed(1)} cf massing</span>
      </div>
      ${state.objects.map(object => `
        <div class="tray-card ${state.selectedIds.includes(object.id) ? 'selected-card' : ''}">
          <strong>${object.id}</strong>
          <span>${object.type} / ${object.layer}${object.groupId ? ` / ${object.groupId}` : ''}</span>
          <button class="tray-action" data-select-object="${object.id}">Select</button>
        </div>
      `).join('')}
    `;
    return;
  }
  if (state.ui.activeTray === 'visualization') {
    els.trayBody.innerHTML = `
      <h3 class="tray-section-title">Visualization</h3>
      <div class="tray-card"><strong>Materials</strong><span>Assign color/material attributes to selected elements.</span>${state.materials.map(material => `<button class="tray-action" data-command="material ${material.id}"><span class="material-swatch" style="background:${material.fill}; border-color:${material.stroke}"></span>${material.name}</button>`).join('')}</div>
      <div class="tray-card"><strong>Styles</strong><span>Fast display presets: normal, high contrast, hidden dashed, nodes on.</span><button class="tray-action" data-command="show nodes all">Show nodes</button><button class="tray-action" data-command="app settings">Open style colors</button></div>
      <div class="tray-card"><strong>Environments</strong><span>Background and image-based lighting are staged for future render mode.</span><button class="tray-action" data-command="sv axon">Axon preview</button></div>
    `;
    return;
  }
  if (state.ui.activeTray === 'assistant') {
    els.trayBody.innerHTML = `
      <h3 class="tray-section-title">AI Assistant</h3>
      <div class="tray-card"><strong>AI Help</strong><span>Ask how to use DrawVision commands. Local command help will be wired before generative geometry.</span><button class="tray-action" data-command="help commands">Command help</button></div>
      <div class="tray-card"><strong>Generate Object</strong><span>Future target: convert prompt to DrawVision command chain, then execute after review.</span><button class="tray-action" data-command="line">Start with line tool</button></div>
      <div class="tray-card"><strong>AI Render</strong><span>Future target: combine current viewport SVG with prompt/style for image generation.</span><button class="tray-action" data-command="export svg">Export viewport SVG</button></div>
    `;
    return;
  }
  if (state.ui.activeTray === 'geolocation') {
    els.trayBody.innerHTML = `
      <h3 class="tray-section-title">Add Location</h3>
      <div class="tray-card"><strong>Location Search</strong><span>Future target: address/search box tied to map provider. Current model stores metadata only.</span><button class="tray-action" data-command="model info">Model Info</button></div>
      <div class="tray-card"><strong>True North</strong><span>Current true north: ${state.geolocation.trueNorth} deg. Red/green axes remain model axes.</span><button class="tray-action" data-command="view plan">Plan view</button></div>
      <div class="tray-card"><strong>Site Context</strong><span>Flat site, elevated terrain, map texture, terrain mesh, and 3D buildings are staged as layer/tag targets.</span><button class="tray-action" data-command="tray layers">Geolocation tags</button></div>
    `;
    return;
  }
  if (state.ui.activeTray === 'search') {
    els.trayBody.innerHTML = `
      <h3 class="tray-section-title">Search Results</h3>
      ${state.ui.searchResults.length ? state.ui.searchResults.map(item => `
        <div class="tray-card">
          <strong>${item.name}</strong>
          <span>${item.command}</span>
          <button class="tray-action" data-command="${item.command}">Run command</button>
        </div>
      `).join('') : '<div class="tray-card"><strong>No matches</strong><span>Try search line, search arrange, search material, search location.</span></div>'}
    `;
    return;
  }
  if (state.ui.activeTray === 'system') {
    const activeKey = state.ui.systemPanel || 'readme';
    const active = systemDocuments[activeKey] || systemDocuments.readme;
    els.trayBody.innerHTML = `
      <h3 class="tray-section-title">System</h3>
      <div class="tray-card">
        <strong>${escapeHtml(active.title)}</strong>
        <span>${escapeHtml(active.source)}</span>
        <p>${escapeHtml(active.summary)}</p>
        <table class="attr-table">
          ${active.points.map((point, index) => `<tr><th>${index + 1}</th><td>${escapeHtml(point)}</td></tr>`).join('')}
        </table>
      </div>
      ${Object.entries(systemDocuments).map(([key, doc]) => `
        <div class="tray-card ${key === activeKey ? 'selected-card' : ''}">
          <strong>${escapeHtml(doc.title)}</strong>
          <span>${escapeHtml(doc.source)}</span>
          <button class="tray-action" data-command="system ${key}">Open</button>
        </div>
      `).join('')}
    `;
    return;
  }
  els.trayBody.innerHTML = selected
    ? `<h3 class="tray-section-title">Entity Info</h3><div class="tray-card"><strong>${selected.id}</strong><span>type: ${selected.type}</span><br><span>layer: ${selected.layer}</span><br><span>length/perimeter: ${objectLength(selected).toFixed(2)}'</span><br><span>area: ${selected.type === 'poly' ? `${polygonArea(selected.points).toFixed(2)} sf` : 'n/a'}</span><br><span>z/extrude: ${selected.extrudeHeight || 0}'</span><button class="tray-action" data-command="group selected">Group selected</button><button class="tray-action" data-command="break element .">Break / ungroup</button></div>${renderAttributesTable(selected)}`
    : '<h3 class="tray-section-title">Entity Info</h3><div class="tray-card"><strong>No selection</strong><span>Select an object to inspect it, or right-click an element for properties.</span></div>';
}

function renderAttributesTable(object) {
  const rows = {
    id: object.id,
    type: object.type,
    layer: object.layer,
    points: object.points ? JSON.stringify(object.points) : '',
    center: object.center ? JSON.stringify(object.center) : '',
    radius: object.radius ?? '',
    segments: object.segments ?? '',
    text: object.text ?? '',
    stroke: object.stroke ?? '',
    fill: object.fill ?? '',
    weight: object.weight ?? '',
    extrudeHeight: object.extrudeHeight ?? 0,
    groupId: object.groupId ?? '',
    ...object.attrs,
  };
  return `
    <div class="tray-card">
      <strong>Attributes</strong>
      <table class="attr-table">
        ${Object.entries(rows)
          .filter(([, value]) => value !== '')
          .map(([key, value]) => `<tr><th>${key}</th><td>${value}</td></tr>`)
          .join('')}
      </table>
    </div>
  `;
}

function renderAll() {
  els.canvas.setAttribute('viewBox', state.viewBox.join(' '));
  document.querySelectorAll('[data-tray]').forEach(item => item.classList.toggle('active', item.dataset.tray === state.ui.activeTray));
  renderGrid();
  renderModel();
  renderPreview();
  renderHud();
  renderTools();
  renderViews();
  renderTray();
}

function resetPending() {
  state.pending.firstPoint = null;
  state.pending.polyPoints = [];
  state.pending.circleCenter = null;
  state.pending.rectStart = null;
  state.pending.boxStart = null;
  state.pending.cameraEye = null;
}

function closeMenus() {
  els.menuPanel.classList.remove('open');
  els.contextMenu.classList.remove('open');
}

function pushUndo(label) {
  state.undoStack.push({
    label,
    objects: JSON.parse(JSON.stringify(state.objects)),
    selectedIds: [...state.selectedIds],
  });
  state.undoStack = state.undoStack.slice(-50);
  state.project.dirty = true;
  if (state.settings.autosave) queueMicrotask(() => saveLocal());
}

function afterMutation(reason) {
  markDirty(reason);
  saveLocal();
}

function backtraceStep() {
  if (state.pending.firstPoint || state.pending.polyPoints.length || state.pending.circleCenter || state.pending.boxStart || state.pending.cameraEye) {
    resetPending();
    state.ui.status = 'pending command cancelled';
    setMeasurement('Backtrace pending');
    return;
  }
  const snapshot = state.undoStack.pop();
  if (!snapshot) {
    state.ui.status = 'nothing to backtrace';
    return;
  }
  state.objects = snapshot.objects;
  state.selectedIds = snapshot.selectedIds;
  state.ui.status = `backtrace: ${snapshot.label}`;
  setMeasurement('Backtrace');
}

function setTool(tool) {
  state.ui.activeTool = tool;
  resetPending();
  state.ui.status = toolHints[tool] || `${tool} tool`;
}

function parseNumber(text, fallback = 10) {
  const match = text.match(/(-?\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : fallback;
}

function parseZoomFactor(text, fallback = 2) {
  const match = text.match(/(?:by\s*)?(\d+(?:\.\d+)?)\s*x/i);
  return match ? Number(match[1]) : fallback;
}

function zoomBy(factor) {
  const [x, y, width, height] = state.viewBox;
  const nextWidth = width / factor;
  const nextHeight = height / factor;
  state.viewBox = [
    x + (width - nextWidth) / 2,
    y + (height - nextHeight) / 2,
    nextWidth,
    nextHeight,
  ];
  state.ui.status = `zoom ${factor.toFixed(2)}x`;
  setMeasurement(`${factor.toFixed(2)}x`);
}

function zoomAt(factor, center) {
  const effectiveFactor = factor > 1
    ? 1 + (factor - 1) * state.settings.zoomSensitivity
    : 1 / (1 + ((1 / factor) - 1) * state.settings.zoomSensitivity);
  const [x, y, width, height] = state.viewBox;
  const nextWidth = width / effectiveFactor;
  const nextHeight = height / effectiveFactor;
  const [cx, cy] = center;
  const rx = (cx - x) / width;
  const ry = (cy - y) / height;
  state.viewBox = [
    cx - rx * nextWidth,
    cy - ry * nextHeight,
    nextWidth,
    nextHeight,
  ];
  state.ui.status = effectiveFactor > 1 ? `wheel zoom in ${effectiveFactor.toFixed(2)}x` : `wheel zoom out ${(1 / effectiveFactor).toFixed(2)}x`;
  setMeasurement(state.ui.status);
}

function zoomOutBy(factor) {
  zoomBy(1 / factor);
  state.ui.status = `zoom out ${factor.toFixed(2)}x`;
}

function zoomExtents() {
  state.viewBox = [0, 0, 720, 540];
  state.ui.status = 'zoom extents';
  setMeasurement('Extents');
}

function zoomBoxTo(start, end) {
  const [sx, sy] = start;
  const [ex, ey] = end;
  const minX = Math.min(sx, ex);
  const minY = Math.min(sy, ey);
  const width = Math.max(24, Math.abs(ex - sx));
  const height = Math.max(24, Math.abs(ey - sy));
  state.viewBox = [minX, minY, width, height];
  state.ui.status = 'zoom box';
  setMeasurement('Zoom box');
}

function parseAxis(text, fallback = 'x') {
  const match = text.match(/\b([xyz])\b/);
  return match ? match[1] : fallback;
}

function cloneObject(object, suffix) {
  return JSON.parse(JSON.stringify({ ...object, id: `${object.id}_${suffix}` }));
}

function translateObject(object, dx, dy, dz = 0) {
  if (object.points) object.points = object.points.map(([x, y, z = 0]) => [x + dx, y + dy, z + dz]);
  if (object.center) object.center = [object.center[0] + dx, object.center[1] + dy, (object.center[2] || 0) + dz];
  if (object.point) object.point = [object.point[0] + dx, object.point[1] + dy, (object.point[2] || 0) + dz];
}

function rotatePoint([x, y, z = 0], axis, radians) {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  if (axis === 'y') return [x * c + z * s, y, -x * s + z * c];
  if (axis === 'z') return [x * c - y * s, x * s + y * c, z];
  return [x, y * c - z * s, y * s + z * c];
}

function rotateObject(object, axis, degrees) {
  const radians = degrees * Math.PI / 180;
  if (object.points) object.points = object.points.map(point => rotatePoint(point, axis, radians));
  if (object.center) object.center = rotatePoint(object.center, axis, radians);
  if (object.point) object.point = rotatePoint(object.point, axis, radians);
  object.attrs = { ...object.attrs, rotated: `${axis.toUpperCase()} ${degrees}` };
}

function repeatSelected(command) {
  pushUndo('repeat');
  const countMatch = command.match(/(?:rep|repeat|n|copy)\s+(\d+)/i);
  const count = countMatch ? Math.max(1, Number(countMatch[1])) : 1;
  const axis = parseAxis(command, 'x');
  const spacingMatch = command.match(/(?:by|spacing|step)\s+(-?\d+(?:\.\d+)?)/i);
  const spacing = spacingMatch ? Number(spacingMatch[1]) : 1;
  const delta = {
    x: [spacing, 0, 0],
    y: [0, spacing, 0],
    z: [0, 0, spacing],
  }[axis];
  const source = selectedObjects();
  const created = [];
  for (let index = 1; index <= count; index += 1) {
    source.forEach(object => {
      const copy = cloneObject(object, `rep${index}`);
      translateObject(copy, delta[0] * index, delta[1] * index, delta[2] * index);
      created.push(copy);
    });
  }
  state.objects.push(...created);
  state.selectedIds = created.map(object => object.id);
  state.ui.status = `repeated ${source.length} object(s) ${count}x on ${axis.toUpperCase()}`;
  setMeasurement(`${count}x ${axis.toUpperCase()} step ${spacing}'`);
}

function repeatByMeasurement(value) {
  const text = String(value).trim().toLowerCase();
  const match = text.match(/^(\d+)\s*([x*/])$/);
  if (!match) return false;
  const count = Math.max(1, Number(match[1]));
  const mode = match[2];
  const command = mode === '/'
    ? `rep n ${Math.max(1, count - 1)} x spacing ${1 / count}`
    : `rep n ${count} x`;
  repeatSelected(command);
  state.ui.status = mode === '/' ? `internal array ${count}/` : `external array ${count}${mode}`;
  return true;
}

function rotateSelected(command) {
  pushUndo('rotate');
  const axis = parseAxis(command, 'x');
  const degrees = parseNumber(command, 90);
  selectedObjects().forEach(object => rotateObject(object, axis, degrees));
  state.ui.activeView = 'axon';
  state.ui.status = `rotated selected ${degrees} deg around ${axis.toUpperCase()}`;
  setMeasurement(`${axis.toUpperCase()} ${degrees} deg`);
}

function extrudeSelected(command) {
  pushUndo('extrude');
  const height = parseNumber(command, 10);
  let count = 0;
  selectedObjects().forEach(object => {
    if (['poly', 'circle'].includes(object.type)) {
      object.extrudeHeight = height;
      object.attrs = { ...object.attrs, extrudeHeight: `${height}'` };
      count += 1;
    }
  });
  state.ui.activeView = 'axon';
  setMeasurement(`${height}'`);
  state.ui.status = `extruded ${count} object(s) to ${height}'`;
}

function flattenSelected() {
  pushUndo('flatten');
  selectedObjects().forEach(object => {
    object.extrudeHeight = 0;
    if (object.points) object.points = object.points.map(([x, y]) => [x, y, 0]);
    if (object.center) object.center = [object.center[0], object.center[1], 0];
    if (object.point) object.point = [object.point[0], object.point[1], 0];
  });
  setMeasurement('Z=0');
  state.ui.status = 'flattened selected geometry to Z0';
}

function offsetPolygon(points, distance) {
  const cx = points.reduce((total, point) => total + point[0], 0) / points.length;
  const cy = points.reduce((total, point) => total + point[1], 0) / points.length;
  return points.map(([x, y, z = 0]) => {
    const dx = x - cx;
    const dy = y - cy;
    const length = Math.hypot(dx, dy) || 1;
    return [x + dx / length * distance, y + dy / length * distance, z];
  });
}

function offsetSelected(command) {
  const distance = parseNumber(command, 1);
  const source = selectedObjects().filter(object => object.type === 'poly');
  if (!source.length) {
    state.ui.status = 'offset needs selected face/polygon';
    return;
  }
  pushUndo('offset');
  const created = source.map(object => {
    const copy = cloneObject(object, `offset${Date.now()}`);
    copy.points = offsetPolygon(object.points, distance);
    copy.extrudeHeight = 0;
    copy.attrs = { ...copy.attrs, offsetFrom: object.id, offsetDistance: `${distance}'` };
    return copy;
  });
  state.objects.push(...created);
  state.selectedIds = created.map(object => object.id);
  state.ui.status = `offset ${created.length} face(s) by ${distance}'`;
  setMeasurement(`${distance}' offset`);
}

function assignMaterial(command) {
  const materialId = command.replace(/^material\s+/i, '').trim().toLowerCase();
  const material = materialById(materialId);
  if (!material || !state.selectedIds.length) {
    state.ui.status = material ? 'material needs selected objects' : `unknown material ${materialId}`;
    return;
  }
  pushUndo('material');
  selectedObjects().forEach(object => {
    object.attrs = { ...object.attrs, material: material.id };
    if (object.type !== 'line' && object.type !== 'text') object.fill = material.fill;
    object.stroke = material.stroke;
  });
  state.ui.status = `assigned material ${material.name}`;
  setMeasurement(material.name);
}

function groupSelected() {
  if (!state.selectedIds.length) {
    state.ui.status = 'group needs selected elements';
    return;
  }
  pushUndo('group');
  const groupId = `group_${Date.now()}`;
  const parentId = state.activeGroupId || null;
  state.groups.push({
    id: groupId,
    name: parentId ? `Sub Group ${state.groups.length + 1}` : `Group ${state.groups.length + 1}`,
    parentId,
    objectIds: [...state.selectedIds],
  });
  state.objects.forEach(object => {
    if (state.selectedIds.includes(object.id)) {
      object.groupId = groupId;
      object.attrs = { ...object.attrs, groupId, parentGroupId: parentId || '' };
    }
  });
  state.activeGroupId = groupId;
  state.ui.status = parentId ? `created subgroup ${groupId}` : `created group ${groupId}`;
  setMeasurement(groupId);
}

function breakSelectedElements() {
  pushUndo('break elements');
  const groupIds = new Set();
  state.objects.forEach(object => {
    if (!state.selectedIds.includes(object.id)) return;
    if (object.groupId) groupIds.add(object.groupId);
    delete object.groupId;
    if (object.attrs) {
      delete object.attrs.groupId;
      delete object.attrs.parentGroupId;
    }
  });
  state.groups = state.groups.filter(group => {
    if (!groupIds.has(group.id)) return true;
    return state.objects.some(object => object.groupId === group.id);
  });
  if (state.activeGroupId && groupIds.has(state.activeGroupId)) {
    state.activeGroupId = null;
  }
  state.ui.status = `broke ${state.selectedIds.length} element(s) out of group`;
  setMeasurement('Ungrouped');
}

function deleteSelected() {
  if (!state.selectedIds.length) {
    state.ui.status = 'delete needs selected elements';
    return;
  }
  pushUndo('delete selected');
  const selected = new Set(state.selectedIds);
  state.objects = state.objects.filter(object => !selected.has(object.id));
  state.selectedIds = [];
  state.ui.status = `deleted ${selected.size} element(s)`;
  setMeasurement('Deleted');
}

function convertSelectedText() {
  pushUndo('convert text');
  const converted = [];
  state.objects = state.objects.flatMap(object => {
    if (!state.selectedIds.includes(object.id) || object.type !== 'text') return [object];
    const [x, y, z = 0] = object.point;
    const width = Math.max(1, object.text.length * 0.35);
    const height = 0.4;
    const poly = {
      id: `${object.id}_outline`,
      type: 'poly',
      layer: object.layer,
      points: [[x, y, z], [x + width, y, z], [x + width, y + height, z], [x, y + height, z]],
      fill: 'transparent',
      stroke: object.stroke || '#f1f4f7',
      weight: 1,
      closed: true,
      attrs: { convertedFromText: object.text, conversion: 'placeholder-outline' },
    };
    converted.push(poly.id);
    return [poly];
  });
  state.selectedIds = converted;
  state.ui.status = `converted ${converted.length} text object(s) to outline polygons`;
  setMeasurement('Text converted');
}

function newModel() {
  pushUndo('new model');
  state.project = {
    ...state.project,
    name: `DrawVision Model ${new Date().toISOString().slice(0, 10)}`,
    savedAt: null,
    dirty: true,
  };
  state.objects = JSON.parse(JSON.stringify(initialObjects));
  state.layers = JSON.parse(JSON.stringify(initialLayers));
  state.groups = [];
  state.activeGroupId = null;
  state.selectedIds = [];
  state.viewBox = [0, 0, 720, 540];
  resetPending();
  els.homeScreen?.classList.add('hidden');
  saveLocal();
  state.ui.status = 'new local model created';
}

function demo3d() {
  pushUndo('demo 3d');
  state.objects = [
    {
      id: 'demo_slab',
      type: 'poly',
      layer: 'floor',
      points: [[2, 3, 0], [14, 3, 0], [14, 10, 0], [2, 10, 0]],
      fill: 'rgba(214,170,66,.22)',
      stroke: '#d6aa42',
      weight: 2,
      closed: true,
      extrudeHeight: 1,
      attrs: { material: 'concrete', role: '3d slab' },
    },
    {
      id: 'demo_mass_a',
      type: 'poly',
      layer: 'floor',
      points: [[4, 5, 0], [8, 5, 0], [8, 9, 0], [4, 9, 0]],
      fill: 'rgba(36,180,126,.25)',
      stroke: '#24b47e',
      weight: 2,
      closed: true,
      extrudeHeight: 8,
      attrs: { material: 'site', role: 'massing block' },
    },
    {
      id: 'demo_mass_b',
      type: 'poly',
      layer: 'floor',
      points: [[9, 4, 0], [13, 4, 0], [13, 8, 0], [9, 8, 0]],
      fill: 'rgba(90,168,255,.24)',
      stroke: '#5aa8ff',
      weight: 2,
      closed: true,
      extrudeHeight: 5,
      attrs: { material: 'glass', role: 'lower massing block' },
    },
    {
      id: 'demo_wall_line',
      type: 'line',
      layer: 'walls',
      points: [[2, 11, 0], [14, 11, 0]],
      stroke: '#d95c4f',
      weight: 4,
      extrudeHeight: 7,
      attrs: { role: 'extruded wall line' },
    },
  ];
  state.selectedIds = ['demo_mass_a'];
  state.ui.activeView = 'axon';
  state.viewBox = [0, 0, 720, 540];
  state.ui.status = '3D demo loaded in axon view';
  setMeasurement('3D demo');
  saveLocal();
}

function exportJson() {
  const snapshot = saveLocal();
  const safeName = state.project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'drawvision-model';
  downloadText(`${safeName}.drawvision.json`, 'application/json', JSON.stringify(snapshot, null, 2));
  state.ui.status = 'model downloaded as JSON';
}

function exportSvg() {
  const svg = els.canvas.outerHTML;
  downloadText(`${state.project.name.replace(/[^a-z0-9]+/gi, '-')}.svg`, 'image/svg+xml', svg);
  state.ui.status = 'viewport downloaded as SVG';
}

function loadLocalModel() {
  try {
    const raw = localStorage.getItem(storage.current);
    if (!raw) return false;
    return applyModelSnapshot(JSON.parse(raw));
  } catch {
    return false;
  }
}

function openJsonFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const snapshot = JSON.parse(reader.result);
      if (!applyModelSnapshot(snapshot)) throw new Error('Invalid model');
      state.project.name = snapshot.project?.name || file.name.replace(/\.[^.]+$/, '');
      saveLocal();
      els.homeScreen?.classList.add('hidden');
      state.ui.status = `opened ${file.name}`;
      renderAll();
    } catch {
      state.ui.status = `could not open ${file.name}`;
      renderAll();
    }
  };
  reader.readAsText(file);
}

function executeCommand(raw) {
  const command = raw.trim();
  const text = command.toLowerCase();
  if (!command) return;
  log(`DV> ${command}`);
  els.commandInput.value = command;
  els.promptInput.value = '';

  if (text === 'home' || text === 'home screen') {
    els.homeScreen?.classList.remove('hidden');
    renderRecentList();
    state.ui.status = 'home screen';
  }
  else if (text === 'home close' || text === 'continue current') {
    els.homeScreen?.classList.add('hidden');
    state.ui.status = 'model workspace';
  }
  else if (text === 'file new' || text === 'new model') newModel();
  else if (text === 'demo 3d' || text === '3d demo' || text === 'test 3d') demo3d();
  else if (text === 'file open' || text === 'open model') {
    els.openFileInput.value = '';
    els.openFileInput.click();
    state.ui.status = 'choose DrawVision JSON file';
  }
  else if (text === 'file save' || text === 'save model') {
    saveLocal();
    state.ui.status = 'saved to browser local storage';
  }
  else if (text === 'file save as' || text === 'save as') {
    const name = prompt('Model name', state.project.name);
    if (name) state.project.name = name;
    saveLocal();
    state.ui.status = `saved as ${state.project.name}`;
  }
  else if (text.includes('file export json') || text === 'download model' || text === 'export json') exportJson();
  else if (text === 'export svg' || text === 'download svg') exportSvg();
  else if (text === 'share' || text.includes('link sharing')) {
    saveLocal();
    state.ui.status = 'share link is this browser URL; use export JSON for portable model sharing';
    setMeasurement(location.href);
  }
  else if (text === 'app settings' || text === 'settings') openSettingsDialog();
  else if (text === 'settings apply') applySettingsFromDialog();
  else if (text === 'settings reset') resetSettings();
  else if (text === 'optimize memory') optimizeMemory();
  else if (text.startsWith('search ') || text.startsWith('? ')) searchCommands(command.replace(/^(search|\?)\s+/i, ''));
  else if (text === 'tray entity' || text === 'entity tray') state.ui.activeTray = 'entity';
  else if (text === 'tray layers' || text === 'layers tray') state.ui.activeTray = 'layers';
  else if (text === 'tray scenes' || text === 'scenes tray') state.ui.activeTray = 'scenes';
  else if (text === 'tray outliner' || text === 'outliner tray') state.ui.activeTray = 'outliner';
  else if (text.startsWith('system ')) {
    const key = text
      .replace(/^system\s+/i, '')
      .replace(/\s+/g, '_');
    const aliases = {
      'system_readme': 'readme',
      readme: 'readme',
      roadmap: 'roadmap',
      'code_tightening': 'tightening',
      tightening: 'tightening',
      guidelines: 'guidelines',
      architecture: 'architecture',
      'geometry_rules': 'geometry',
      geometry: 'geometry',
      'module_system': 'modules',
      modules: 'modules',
      'mcp_servers': 'mcp',
      mcp: 'mcp',
      contracts: 'mcp',
    };
    state.ui.systemPanel = aliases[key] || (systemDocuments[key] ? key : 'readme');
    state.ui.activeTray = 'system';
    state.ui.status = `${systemDocuments[state.ui.systemPanel].title} guidelines`;
  }
  else if (text === 'visualization panel' || text === 'materials' || text === 'styles' || text === 'environments') {
    state.ui.activeTray = 'visualization';
    state.ui.status = 'visualization panel: materials, styles, and environments placeholders';
  }
  else if (text === 'add location' || text === 'geolocation' || text === 'site context') {
    state.ui.activeTray = 'geolocation';
    state.ui.status = 'add location panel: set geolocation metadata and future site context';
  }
  else if (text === 'ai assistant' || text === 'ai help' || text === 'generate object' || text === 'ai render') {
    state.ui.activeTray = 'assistant';
    state.ui.status = 'AI assistant panel: help, generate object, and render prompts are staged locally';
  }
  else if (text === 'line' || text.includes('input line') || text.startsWith('type line')) {
    setTool('line');
    if (text.includes('.')) addLine(state.pending.cursorPoint || [0, 0, 0]);
  }
  else if (text === 'rectangle' || text === 'rect' || text.includes('input rect')) setTool('rect');
  else if (text.includes('input poly') || text.startsWith('type poly')) setTool('poly');
  else if (text === ',' || text.includes('input ,') || text.includes('input node')) {
    addNode(state.pending.cursorPoint || [0, 0, 0]);
  }
  else if (text.includes('input text')) {
    state.text.value = command.replace(/input text/i, '').trim() || prompt('Text label', state.text.value) || state.text.value;
    setTool('text');
  } else if (text.includes('gen cir') || text.includes('circle')) {
    const seg = text.match(/seg\s+(\d+)/);
    state.circle.segments = seg ? Number(seg[1]) : state.circle.segments;
    setTool('circle');
  } else if (text.includes('move')) setTool('move');
  else if (text.includes('distance') || text.includes('measure')) setTool('measure');
  else if (text.includes('select in box')) { state.ui.selectionMode = 'in'; setTool('box'); }
  else if (text.includes('select out box')) { state.ui.selectionMode = 'out'; setTool('box'); }
  else if (text.includes('extrude')) extrudeSelected(command);
  else if (text.startsWith('offset')) offsetSelected(command);
  else if (text.startsWith('material ')) assignMaterial(command);
  else if (text.startsWith('rep') || text.includes('repeat by n') || text.includes('repeat n')) repeatSelected(command);
  else if (text.includes('rotate')) rotateSelected(command);
  else if (text.includes('zoom in')) zoomBy(parseZoomFactor(text, 2));
  else if (text.includes('zoom out')) zoomOutBy(parseZoomFactor(text, 2));
  else if (text.includes('zoom extents') || text === 'view all' || text === 'va') zoomExtents();
  else if (text.includes('zoom box')) setTool('zoombox');
  else if (text.includes('pv from') || text.includes('camera')) setTool('camera');
  else if (text.includes('hidden line') || text.includes('hidden dashed')) {
    state.ui.hiddenLineDisplay = text.includes('off') ? false : true;
    state.ui.status = state.ui.hiddenLineDisplay ? 'hidden line display dashed' : 'hidden line display off';
  }
  else if (text.includes('show nodes all')) {
    state.ui.showNodes = true;
    state.ui.status = 'showing all nodes';
  }
  else if (text.includes('hide nodes') || text.includes('nodes off')) {
    state.ui.showNodes = false;
    state.ui.status = 'nodes hidden';
  }
  else if (text === '.' || text.includes('graphic selector')) {
    state.ui.graphicSelector = !state.ui.graphicSelector;
    state.ui.status = state.ui.graphicSelector ? 'graphic selector enabled' : 'graphic selector disabled';
  }
  else if (text.includes('snap nearest')) {
    state.ui.snapNearestNode = !state.ui.snapNearestNode;
    state.ui.snapMode = state.ui.snapNearestNode ? 'nearest-node' : 'grid-intersection';
    state.ui.status = state.ui.snapNearestNode ? 'nearest node snap on' : 'nearest node snap off';
  }
  else if (text.includes('snap grid')) {
    state.ui.snapGridIntersection = !state.ui.snapGridIntersection;
    state.ui.snapMode = state.ui.snapGridIntersection ? 'grid-intersection' : 'free';
    state.ui.status = state.ui.snapGridIntersection ? 'grid intersection snap on' : 'grid intersection snap off';
  }
  else if (text.includes('merge line to 0') || text.includes('flatten')) flattenSelected();
  else if (text.includes('convert text') || text.includes('covert text')) convertSelectedText();
  else if (text.includes('group selected') || text === 'ctrl g') groupSelected();
  else if (text.includes('break element') || text.includes('ungroup') || text.includes('explode')) breakSelectedElements();
  else if (text.includes('delete selected')) deleteSelected();
  else if (text === '-' || text.includes('backtrace')) backtraceStep();
  else if (text.includes('select all')) state.selectedIds = state.objects.map(object => object.id);
  else if (text.includes('select none')) state.selectedIds = [];
  else if (text.includes('set view all plan')) {
    state.ui.activeView = 'top';
    zoomExtents();
    state.ui.status = 'view all plan';
  }
  else if (text.includes('view all 3d') || text.includes('set view all 3d')) {
    state.ui.activeView = 'axon';
    zoomExtents();
    state.ui.status = 'view all 3d';
  }
  else if (text.includes('view all nelev') || text.includes('set view all nelev')) {
    state.ui.activeView = 'north';
    zoomExtents();
    state.ui.status = 'view all north elevation';
  }
  else if (text.includes('set view all')) zoomExtents();
  else if (text.includes('sv nelev')) state.ui.activeView = 'north';
  else if (text.includes('sv 3d') || text.includes('sv axon')) state.ui.activeView = 'axon';
  else if (text.includes('sv plan') || text.includes('sv top')) state.ui.activeView = 'top';
  else if (text.includes('view plan') || text.includes('top')) state.ui.activeView = 'top';
  else if (text.includes('nelev') || text.includes('north')) state.ui.activeView = 'north';
  else if (text.includes('view 3d') || text.includes('axon')) state.ui.activeView = 'axon';

  if (state.project.dirty && state.settings.autosave) saveLocal();
  log(`.. ${state.ui.status}`);
  renderAll();
}

function renderMenu(menuName, anchor) {
  const items = menuCommands[menuName] || [];
  const label = menuName[0].toUpperCase() + menuName.slice(1);
  const left = anchor?.offsetLeft ?? 8;
  els.menuPanel.style.left = `${left}px`;
  els.menuPanel.innerHTML = `
    <h2>${label}</h2>
    ${items.map(([name, command]) => `
      <button data-command="${command}">
        ${name}
        <span>${command}</span>
      </button>
    `).join('')}
  `;
  els.contextMenu.classList.remove('open');
  els.menuPanel.classList.toggle('open');
}

function renderContextMenu(object, x, y) {
  els.contextMenu.style.left = `${x}px`;
  els.contextMenu.style.top = `${y}px`;
  els.contextMenu.innerHTML = `
    <h2>${object.id}</h2>
    <button data-command="tray entity">Properties</button>
    <button data-command="group selected">Group</button>
    <button data-command="break element .">Break / Ungroup</button>
    <button data-command="extrude selected z 10">Extrude 10'</button>
    <button data-command="merge line to 0">Flatten Z0</button>
    <button data-command="delete selected">Delete</button>
  `;
  els.menuPanel.classList.remove('open');
  els.contextMenu.classList.add('open');
}

function addLine(point) {
  if (!state.pending.firstPoint) {
    state.pending.firstPoint = point;
    state.ui.status = `line from ${fmtPoint(point)}; pick next . to continue`;
    return;
  }
  const id = `line_${Date.now()}`;
  pushUndo('add line');
  state.objects.push({ id, type: 'line', layer: 'walls', points: [state.pending.firstPoint, point], stroke: '#24b47e', weight: 3, attrs: {} });
  state.selectedIds = [id];
  state.pending.firstPoint = point;
  state.ui.status = `line created to ${fmtPoint(point)}; next . continues from here`;
}

function addRectangle(point) {
  if (!state.pending.rectStart) {
    state.pending.rectStart = point;
    state.ui.status = `rectangle corner ${fmtPoint(point)}; pick opposite corner`;
    return;
  }
  const [x1, y1, z = 0] = state.pending.rectStart;
  const [x2, y2] = point;
  if (x1 === x2 || y1 === y2) {
    state.ui.status = 'rectangle needs width and depth';
    return;
  }
  const id = `rect_${Date.now()}`;
  pushUndo('add rectangle');
  state.objects.push({
    id,
    type: 'poly',
    layer: 'floor',
    points: [[x1, y1, z], [x2, y1, z], [x2, y2, z], [x1, y2, z]],
    fill: 'rgba(36,180,126,.12)',
    stroke: '#24b47e',
    weight: 2,
    closed: true,
    attrs: { area: `${Math.abs((x2 - x1) * (y2 - y1)).toFixed(2)} sf` },
  });
  state.selectedIds = [id];
  state.pending.rectStart = null;
  setMeasurement(`${Math.abs(x2 - x1).toFixed(2)}' x ${Math.abs(y2 - y1).toFixed(2)}'`);
  state.ui.status = `rectangle created ${fmtPoint(point)}`;
}

function addNode(point) {
  const id = `node_${Date.now()}`;
  pushUndo('add node');
  state.objects.push({ id, type: 'circle', layer: 'guides', center: point, radius: 0.08, segments: 12, stroke: '#f59e0b', weight: 2, attrs: { node: 'true' } });
  state.selectedIds = [id];
  state.ui.status = `node placed ${fmtPoint(point)}`;
}

function addPoly(point) {
  state.pending.polyPoints.push(point);
  state.ui.status = `poly point ${state.pending.polyPoints.length}: ${fmtPoint(point)}`;
  if (state.pending.polyPoints.length >= 3) {
    const id = `poly_${Date.now()}`;
    pushUndo('add poly');
    state.objects.push({ id, type: 'poly', layer: 'floor', points: [...state.pending.polyPoints], fill: 'rgba(36,180,126,.12)', stroke: '#24b47e', weight: 2, closed: true, attrs: {} });
    state.selectedIds = [id];
  }
}

function addCircle(point) {
  if (!state.pending.circleCenter) {
    state.pending.circleCenter = point;
    state.ui.status = `circle center ${fmtPoint(point)}`;
    return;
  }
  const radius = Math.hypot(point[0] - state.pending.circleCenter[0], point[1] - state.pending.circleCenter[1]);
  const id = `circle_${Date.now()}`;
  pushUndo('add circle');
  state.objects.push({ id, type: 'circle', layer: 'guides', center: state.pending.circleCenter, radius, segments: state.circle.segments, stroke: '#5aa8ff', weight: 2, attrs: { radius: `${radius.toFixed(2)}'`, segments: String(state.circle.segments) } });
  state.selectedIds = [id];
  state.pending.circleCenter = null;
  setMeasurement(`R ${radius.toFixed(2)}' / DIA ${(radius * 2).toFixed(2)}'`);
  state.ui.status = `circle created ${state.circle.segments} segments`;
}

function moveSelected(point) {
  if (!state.pending.firstPoint) {
    state.pending.firstPoint = point;
    state.ui.status = `move from ${fmtPoint(point)}`;
    return;
  }
  const dx = point[0] - state.pending.firstPoint[0];
  const dy = point[1] - state.pending.firstPoint[1];
  pushUndo('move');
  selectedObjects().forEach(object => {
    if (object.points) object.points = object.points.map(([x, y, z = 0]) => [x + dx, y + dy, z]);
    if (object.center) object.center = [object.center[0] + dx, object.center[1] + dy, object.center[2] || 0];
    if (object.point) object.point = [object.point[0] + dx, object.point[1] + dy, object.point[2] || 0];
  });
  state.pending.firstPoint = null;
  state.ui.status = `moved dx ${dx}' dy ${dy}'`;
}

function measureDistance(point) {
  if (!state.pending.firstPoint) {
    state.pending.firstPoint = point;
    state.ui.status = `measure from ${fmtPoint(point)}`;
    return;
  }
  const dx = point[0] - state.pending.firstPoint[0];
  const dy = point[1] - state.pending.firstPoint[1];
  const distance = Math.hypot(dx, dy);
  setMeasurement(`${distance.toFixed(2)}'`);
  state.pending.firstPoint = null;
  state.ui.status = `distance ${distance.toFixed(2)}' dx ${dx}' dy ${dy}'`;
}

function addText(point) {
  const id = `text_${Date.now()}`;
  pushUndo('add text');
  state.objects.push({ id, type: 'text', layer: 'notes', point, text: state.text.value, stroke: '#f1f4f7', attrs: {} });
  state.selectedIds = [id];
  state.ui.status = `text placed ${fmtPoint(point)}`;
}

function setPerspectiveCamera(point) {
  if (!state.pending.cameraEye) {
    state.pending.cameraEye = point;
    state.ui.status = `camera eye ${fmtPoint(point)}; pick target`;
    return;
  }
  state.camera.eye = state.pending.cameraEye;
  state.camera.target = point;
  state.camera.mode = 'perspective';
  state.ui.activeView = 'axon';
  state.pending.cameraEye = null;
  state.ui.status = `perspective camera from ${fmtPoint(state.camera.eye)} to ${fmtPoint(point)}`;
  setMeasurement('PV camera');
}

function applyMeasurement(value) {
  const text = String(value).trim();
  if (!text) return;

  if (repeatByMeasurement(text)) {
    renderAll();
    return;
  }

  const rectMatch = text.match(/^(-?\d+(?:\.\d+)?)(?:'|ft|m|in|")?\s*[,x]\s*(-?\d+(?:\.\d+)?)(?:'|ft|m|in|")?$/i);
  if (state.ui.activeTool === 'rect' && state.pending.rectStart && rectMatch) {
    const width = parseLength(rectMatch[1]) ?? Number(rectMatch[1]);
    const depth = parseLength(rectMatch[2]) ?? Number(rectMatch[2]);
    addRectangle(snapPoint([state.pending.rectStart[0] + width, state.pending.rectStart[1] + depth, state.pending.rectStart[2] || 0]));
    renderAll();
    return;
  }

  const length = parseLength(text);
  if (length === null) {
    executeCommand(text);
    return;
  }

  if (state.ui.activeTool === 'line' && state.pending.firstPoint) {
    const target = pointAtDistance(state.pending.firstPoint, state.pending.cursorPoint || [state.pending.firstPoint[0] + 1, state.pending.firstPoint[1], state.pending.firstPoint[2] || 0], length);
    addLine(snapPoint(target));
    setMeasurement(`${length.toFixed(3)}'`);
    renderAll();
    return;
  }

  if (state.ui.activeTool === 'circle' && state.pending.circleCenter) {
    const id = `circle_${Date.now()}`;
    pushUndo('add circle exact');
    state.objects.push({ id, type: 'circle', layer: 'guides', center: state.pending.circleCenter, radius: length, segments: state.circle.segments, stroke: '#5aa8ff', weight: 2, attrs: { radius: `${length.toFixed(2)}'`, segments: String(state.circle.segments), input: text } });
    state.selectedIds = [id];
    state.pending.circleCenter = null;
    state.ui.status = `circle created radius ${length.toFixed(2)}'`;
    setMeasurement(`R ${length.toFixed(2)}' / DIA ${(length * 2).toFixed(2)}'`);
    renderAll();
    return;
  }

  if (state.ui.activeTool === 'move' && state.pending.firstPoint && state.selectedIds.length) {
    const target = pointAtDistance(state.pending.firstPoint, state.pending.cursorPoint || [state.pending.firstPoint[0] + 1, state.pending.firstPoint[1], state.pending.firstPoint[2] || 0], length);
    moveSelected(target);
    setMeasurement(`${length.toFixed(3)}'`);
    renderAll();
    return;
  }

  state.ui.status = `measurement ${text} stored; select a drawing step to apply`;
  setMeasurement(text);
  renderAll();
}

function handleCanvasClick(event) {
  closeMenus();
  const target = event.target.closest('[data-id]');
  if (target) {
    state.selectedIds = [target.dataset.id];
    state.ui.status = `selected ${target.dataset.id}`;
    renderAll();
    return;
  }

  const point = activePointFromEvent(event);
  state.pending.lastPoint = point;
  setMeasurement(fmtPoint(point));

  if (state.ui.activeTool === 'line') addLine(point);
  else if (state.ui.activeTool === 'node') addNode(point);
  else if (state.ui.activeTool === 'rect') addRectangle(point);
  else if (state.ui.activeTool === 'poly') addPoly(point);
  else if (state.ui.activeTool === 'circle') addCircle(point);
  else if (state.ui.activeTool === 'text') addText(point);
  else if (state.ui.activeTool === 'camera') setPerspectiveCamera(point);
  else if (state.ui.activeTool === 'move') moveSelected(point);
  else if (state.ui.activeTool === 'measure') measureDistance(point);
  else state.ui.status = `point ${fmtPoint(point)}`;

  renderAll();
}

function handleCanvasContextMenu(event) {
  event.preventDefault();
  const target = event.target.closest('[data-id]');
  if (!target) {
    closeMenus();
    return;
  }
  const object = state.objects.find(item => item.id === target.dataset.id);
  if (!object) return;
  state.selectedIds = [object.id];
  state.ui.activeTray = 'entity';
  renderAll();
  renderContextMenu(object, event.clientX, event.clientY);
}

function wireUi() {
  let navDrag = null;

  els.toolRail.addEventListener('click', event => {
    const command = event.target.closest('[data-command]')?.dataset.command;
    if (command) executeCommand(command);
  });
  els.viewPalette.addEventListener('click', event => {
    const command = event.target.closest('[data-command]')?.dataset.command;
    if (command) executeCommand(command);
  });
  document.querySelectorAll('[data-menu]').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      renderMenu(button.dataset.menu, button);
    });
  });
  document.querySelectorAll('[data-tray]').forEach(button => {
    button.addEventListener('click', () => {
      state.ui.activeTray = button.dataset.tray;
      document.querySelectorAll('[data-tray]').forEach(item => item.classList.toggle('active', item === button));
      renderTray();
    });
  });
  els.trayBody.addEventListener('click', event => {
    const command = event.target.closest('[data-command]')?.dataset.command;
    const layerId = event.target.closest('[data-layer-toggle]')?.dataset.layerToggle;
    const objectId = event.target.closest('[data-select-object]')?.dataset.selectObject;
    if (command) executeCommand(command);
    if (objectId) {
      state.selectedIds = [objectId];
      state.ui.activeTray = 'entity';
      state.ui.status = `selected ${objectId}`;
      document.querySelectorAll('[data-tray]').forEach(item => item.classList.toggle('active', item.dataset.tray === 'entity'));
      renderAll();
    }
    if (layerId) {
      const layer = state.layers.find(item => item.id === layerId);
      if (layer) layer.visible = !layer.visible;
      renderAll();
    }
  });
  els.menuPanel.addEventListener('click', event => {
    const command = event.target.closest('[data-command]')?.dataset.command;
    if (!command) return;
    closeMenus();
    executeCommand(command);
  });
  els.contextMenu.addEventListener('click', event => {
    const command = event.target.closest('[data-command]')?.dataset.command;
    if (!command) return;
    closeMenus();
    executeCommand(command);
  });
  els.homeScreen?.addEventListener('click', event => {
    const command = event.target.closest('[data-command]')?.dataset.command;
    if (command) executeCommand(command);
  });
  els.settingsDialog?.addEventListener('click', event => {
    if (event.target === els.settingsDialog || event.target.closest('[data-settings-close]')) {
      els.settingsDialog.classList.remove('open');
      renderAll();
      return;
    }
    const command = event.target.closest('[data-command]')?.dataset.command;
    if (command) executeCommand(command);
  });
  els.openFileInput.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (file) openJsonFile(file);
  });
  els.canvas.addEventListener('click', handleCanvasClick);
  els.canvas.addEventListener('contextmenu', handleCanvasContextMenu);
  els.canvas.addEventListener('mousemove', event => {
    const point = activePointFromEvent(event);
    state.pending.cursorPoint = point;
    state.pending.lastPoint = point;
    renderPreview();
    renderHud();
  });
  els.canvas.addEventListener('wheel', event => {
    event.preventDefault();
    const direction = state.settings.invertZoom ? -event.deltaY : event.deltaY;
    const factor = direction < 0 ? 1.18 : 1 / 1.18;
    zoomAt(factor, svgPointFromEvent(event));
    renderAll();
  }, { passive: false });
  els.canvas.addEventListener('pointerdown', event => {
    if (event.button !== 1 && !(event.button === 0 && event.shiftKey)) return;
    event.preventDefault();
    navDrag = {
      mode: event.button === 1 && !event.shiftKey ? 'orbit' : 'pan',
      startX: event.clientX,
      startY: event.clientY,
      viewBox: [...state.viewBox],
    };
    els.canvas.setPointerCapture(event.pointerId);
  });
  els.canvas.addEventListener('pointermove', event => {
    if (!navDrag) return;
    event.preventDefault();
    const dx = event.clientX - navDrag.startX;
    const dy = event.clientY - navDrag.startY;
    if (navDrag.mode === 'pan') {
      const panDirection = state.settings.invertPan ? -1 : 1;
      state.viewBox = [
        navDrag.viewBox[0] - dx * panDirection * state.settings.panSensitivity * navDrag.viewBox[2] / els.canvas.clientWidth,
        navDrag.viewBox[1] - dy * panDirection * state.settings.panSensitivity * navDrag.viewBox[3] / els.canvas.clientHeight,
        navDrag.viewBox[2],
        navDrag.viewBox[3],
      ];
      state.ui.status = 'mouse pan; active tool preserved';
    } else {
      state.ui.activeView = dx * state.settings.orbitSensitivity >= 0 ? 'axon' : 'top';
      state.ui.status = 'middle mouse orbit toggle; active tool preserved';
    }
    renderAll();
  });
  els.canvas.addEventListener('pointerup', event => {
    if (!navDrag) return;
    navDrag = null;
    if (els.canvas.hasPointerCapture(event.pointerId)) els.canvas.releasePointerCapture(event.pointerId);
  });
  els.measurementBox.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    applyMeasurement(els.measurementBox.value);
  });
  els.quickCommand.addEventListener('submit', event => {
    event.preventDefault();
    executeCommand(els.commandInput.value);
  });
  els.promptForm.addEventListener('submit', event => {
    event.preventDefault();
    executeCommand(els.promptInput.value);
  });
  document.getElementById('toggleCommand').addEventListener('click', () => {
    els.commandWindow.classList.toggle('collapsed');
  });
  document.addEventListener('click', event => {
    if (event.target.closest('.menu-panel, .context-menu, [data-menu]')) return;
    closeMenus();
  });
  document.addEventListener('keydown', event => {
    if (['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;
    const key = event.key.toLowerCase();
    if (key === '.') {
      if (['line', 'rect', 'poly', 'circle', 'text', 'move', 'measure', 'camera', 'node'].includes(state.ui.activeTool)) {
        const point = state.pending.cursorPoint || state.pending.lastPoint || [0, 0, 0];
        if (state.ui.activeTool === 'line') addLine(point);
        else if (state.ui.activeTool === 'rect') addRectangle(point);
        else if (state.ui.activeTool === 'poly') addPoly(point);
        else if (state.ui.activeTool === 'circle') addCircle(point);
        else if (state.ui.activeTool === 'text') addText(point);
        else if (state.ui.activeTool === 'move') moveSelected(point);
        else if (state.ui.activeTool === 'measure') measureDistance(point);
        else if (state.ui.activeTool === 'camera') setPerspectiveCamera(point);
        else if (state.ui.activeTool === 'node') addNode(point);
        setMeasurement(fmtPoint(point));
        renderAll();
        return;
      }
      state.ui.graphicSelector = !state.ui.graphicSelector;
      state.ui.status = state.ui.graphicSelector ? 'graphic selector enabled' : 'graphic selector disabled';
      renderAll();
      return;
    }
    if (key === ',') {
      addNode(state.pending.cursorPoint || state.pending.lastPoint || [0, 0, 0]);
      renderAll();
      return;
    }
    if (event.ctrlKey && key === 'g') {
      event.preventDefault();
      groupSelected();
      renderAll();
      return;
    }
    if (event.shiftKey && key === 'z') {
      event.preventDefault();
      zoomExtents();
      renderAll();
      return;
    }
    if ((event.shiftKey && key === 's') || event.key === '?') {
      event.preventDefault();
      els.promptInput.value = 'search ';
      els.promptInput.focus();
      state.ui.status = 'search tools and commands';
      renderAll();
      return;
    }
    if (key === ' ') {
      event.preventDefault();
      setTool('select');
      renderAll();
      return;
    }
    if (key === 'o') {
      state.ui.activeView = 'axon';
      state.ui.status = 'orbit / axon view';
      renderAll();
      return;
    }
    if (key === 'h') {
      state.ui.status = 'pan: hold Shift + drag, or middle mouse for orbit';
      renderAll();
      return;
    }
    if (key === 'f') {
      state.ui.snapNearestNode = !state.ui.snapNearestNode;
      state.ui.snapMode = state.ui.snapNearestNode ? 'nearest-node' : 'grid-intersection';
      state.ui.status = state.ui.snapNearestNode ? 'nearest node snap on' : 'nearest node snap off';
      renderAll();
      return;
    }
    if (key === 'g') {
      state.ui.snapGridIntersection = !state.ui.snapGridIntersection;
      state.ui.snapMode = state.ui.snapGridIntersection ? 'grid-intersection' : 'free';
      state.ui.status = state.ui.snapGridIntersection ? 'grid intersection snap on' : 'grid intersection snap off';
      renderAll();
      return;
    }
    if (['x', 'y', 'z'].includes(key)) {
      state.ui.axisLock = state.ui.axisLock === key ? null : key;
      state.ui.status = state.ui.axisLock ? `axis locked ${state.ui.axisLock.toUpperCase()}` : 'axis free';
      renderAll();
      return;
    }
    const tool = toolDefinitions.find(item => item.key?.toLowerCase() === key);
    if (tool) executeCommand(tool.command);
  });
  window.addEventListener('beforeunload', event => {
    if (!state.project.dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });
}

function bootWorkspace() {
  loadSettings();
  applySettingsToUi();
  const restored = loadLocalModel();
  renderRecentList();
  updateSaveStatus();
  if (restored) {
    state.ui.status = `restored ${state.project.name} from browser local storage`;
  }
}

bootWorkspace();
wireUi();
renderAll();
