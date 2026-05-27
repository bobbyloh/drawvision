const EPSILON = 1e-9;

export function createWallGeometry(command, options = {}) {
  const errors = validateWallCreate(command);
  if (errors.length) {
    return { ok: false, errors };
  }

  const id = command.id || options.idFactory?.('wall') || `wall_${Date.now()}`;
  const path = normalizeWallPath(command);
  const finish = normalizeFinishLayers(command.finishLayers || []);
  const coreThickness = command.thickness;
  const totalThickness = coreThickness + finish.interiorThickness + finish.exteriorThickness;
  const centerline = referencePathToCenterline(path, {
    reference: command.reference || { line: 'centerline', offset: 0, side: 'left' },
    coreThickness,
    totalThickness,
  });

  const openings = (command.openings || []).map((opening, index) => ({
    id: opening.id || options.idFactory?.('opening') || `opening_${id}_${index + 1}`,
    kind: opening.kind,
    centerlineOffset: opening.centerlineOffset,
    width: opening.width,
    height: opening.height,
    sillHeight: opening.sillHeight || 0,
    headHeight: (opening.sillHeight || 0) + opening.height,
    jambDepth: opening.jambDepth ?? totalThickness,
    swing: opening.swing || null,
    material: opening.material || null,
  }));

  return {
    ok: true,
    wall: {
      id,
      kind: 'wall',
      path: centerline,
      sourcePath: path,
      reference: command.reference || { line: 'centerline', offset: 0, side: 'left' },
      height: command.height,
      baseOffset: command.baseOffset || 0,
      coreThickness,
      totalThickness,
      finishLayers: finish.layers,
      material: command.material,
      layer: command.layer || 'A-WALL',
      openings,
      joins: [],
      derived: deriveWallBody(centerline, totalThickness, command.height),
    },
  };
}

export function validateWallCreate(command) {
  const errors = [];
  if (!command || command.cmd !== 'wall.create') {
    errors.push(failure('WALL_COMMAND_REQUIRED', 'Expected wall.create command', ['cmd']));
    return errors;
  }

  const path = normalizeWallPath(command, errors);
  if (path && path.length <= EPSILON) {
    errors.push(failure('WALL_ZERO_LENGTH', 'wall.create requires a non-zero wall path', ['path']));
  }

  if (!isPositive(command.height)) errors.push(failure('WALL_HEIGHT_INVALID', 'Wall height must be positive', ['height']));
  if (!isPositive(command.thickness)) errors.push(failure('WALL_THICKNESS_INVALID', 'Wall core thickness must be positive', ['thickness']));
  if (!command.material) errors.push(failure('WALL_MATERIAL_REQUIRED', 'Wall material is required', ['material']));

  validateReference(command.reference, errors);
  validateFinishLayers(command.finishLayers || [], errors);
  const finish = normalizeFinishLayers(command.finishLayers || []);
  const totalThickness = (Number.isFinite(command.thickness) ? command.thickness : 0) + finish.interiorThickness + finish.exteriorThickness;
  if (path?.type === 'arc' && totalThickness >= path.radius * 2) {
    errors.push(failure('WALL_ARC_THICKNESS_INVALID', 'Curved wall total thickness must be less than twice the radius', ['thickness']));
  }

  const length = path?.length || 0;
  (command.openings || []).forEach((opening, index) => {
    validateOpening(opening, index, length, command.height, errors);
  });

  return errors;
}

export function normalizeWallPath(command, errors = []) {
  if (command.path?.type === 'line') {
    const start = command.path.start;
    const end = command.path.end;
    if (!isPoint3(start)) errors.push(failure('WALL_START_INVALID', 'Line wall start must be [x,y,z]', ['path', 'start']));
    if (!isPoint3(end)) errors.push(failure('WALL_END_INVALID', 'Line wall end must be [x,y,z]', ['path', 'end']));
    if (!isPoint3(start) || !isPoint3(end)) return null;
    return linePath(start, end);
  }

  if (command.path?.type === 'arc') {
    const { center, radius, startAngle, endAngle } = command.path;
    if (!isPoint3(center)) errors.push(failure('WALL_ARC_CENTER_INVALID', 'Arc center must be [x,y,z]', ['path', 'center']));
    if (!isPositive(radius)) errors.push(failure('WALL_ARC_RADIUS_INVALID', 'Arc radius must be positive', ['path', 'radius']));
    if (!Number.isFinite(startAngle)) errors.push(failure('WALL_ARC_START_INVALID', 'Arc startAngle must be finite degrees', ['path', 'startAngle']));
    if (!Number.isFinite(endAngle)) errors.push(failure('WALL_ARC_END_INVALID', 'Arc endAngle must be finite degrees', ['path', 'endAngle']));
    if (!isPoint3(center) || !isPositive(radius) || !Number.isFinite(startAngle) || !Number.isFinite(endAngle)) return null;
    return arcPath(center, radius, startAngle, endAngle);
  }

  if (isPoint3(command.start) && isPoint3(command.end)) {
    return linePath(command.start, command.end);
  }

  errors.push(failure('WALL_PATH_REQUIRED', 'Wall requires start/end or path', ['path']));
  return null;
}

export function deriveWallBody(path, totalThickness, height) {
  if (path.type === 'line') {
    const half = totalThickness / 2;
    const leftStart = offsetPoint(path.start, path.normal, half);
    const leftEnd = offsetPoint(path.end, path.normal, half);
    const rightEnd = offsetPoint(path.end, path.normal, -half);
    const rightStart = offsetPoint(path.start, path.normal, -half);
    return {
      footprint: [leftStart, leftEnd, rightEnd, rightStart],
      bounds: boundsForPoints([leftStart, leftEnd, rightEnd, rightStart], height),
      length: path.length,
    };
  }

  const half = totalThickness / 2;
  const outerRadius = path.radius + half;
  const innerRadius = path.radius - half;
  return {
    footprint: sampleArcBand(path, innerRadius, outerRadius, 24),
    bounds: boundsForPoints(sampleArcBand(path, innerRadius, outerRadius, 24), height),
    length: path.length,
  };
}

function validateReference(reference, errors) {
  if (!reference) return;
  const lines = ['centerline', 'interior_face', 'exterior_face'];
  const sides = ['left', 'right'];
  if (!lines.includes(reference.line)) {
    errors.push(failure('WALL_REFERENCE_LINE_INVALID', 'Wall reference line must be centerline, interior_face, or exterior_face', ['reference', 'line']));
  }
  if (reference.side !== undefined && !sides.includes(reference.side)) {
    errors.push(failure('WALL_REFERENCE_SIDE_INVALID', 'Wall reference side must be left or right', ['reference', 'side']));
  }
  if (reference.offset !== undefined && !Number.isFinite(reference.offset)) {
    errors.push(failure('WALL_REFERENCE_OFFSET_INVALID', 'Wall reference offset must be finite', ['reference', 'offset']));
  }
}

function validateFinishLayers(layers, errors) {
  layers.forEach((layer, index) => {
    if (!['interior', 'exterior', 'core'].includes(layer.side)) {
      errors.push(failure('FINISH_SIDE_INVALID', 'Finish side must be interior, exterior, or core', ['finishLayers', index, 'side']));
    }
    if (!isPositive(layer.thickness)) {
      errors.push(failure('FINISH_THICKNESS_INVALID', 'Finish thickness must be positive', ['finishLayers', index, 'thickness']));
    }
    if (!layer.material) {
      errors.push(failure('FINISH_MATERIAL_REQUIRED', 'Finish material is required', ['finishLayers', index, 'material']));
    }
  });
}

function validateOpening(opening, index, wallLength, wallHeight, errors) {
  const path = ['openings', index];
  if (!['door', 'window', 'void'].includes(opening.kind)) {
    errors.push(failure('OPENING_KIND_INVALID', 'Opening kind must be door, window, or void', [...path, 'kind']));
  }
  if (!isPositive(opening.width)) errors.push(failure('OPENING_WIDTH_INVALID', 'Opening width must be positive', [...path, 'width']));
  if (!isPositive(opening.height)) errors.push(failure('OPENING_HEIGHT_INVALID', 'Opening height must be positive', [...path, 'height']));
  if (!Number.isFinite(opening.centerlineOffset)) {
    errors.push(failure('OPENING_OFFSET_INVALID', 'Opening centerlineOffset must be finite', [...path, 'centerlineOffset']));
  }
  const sillHeight = opening.sillHeight || 0;
  if (sillHeight < 0) errors.push(failure('OPENING_SILL_INVALID', 'Opening sillHeight cannot be negative', [...path, 'sillHeight']));
  if (isPositive(opening.height) && sillHeight + opening.height > wallHeight) {
    errors.push(failure('OPENING_HEIGHT_EXCEEDS_WALL', 'Opening head height exceeds wall height', path));
  }
  if (Number.isFinite(opening.centerlineOffset) && isPositive(opening.width)) {
    const halfWidth = opening.width / 2;
    if (opening.centerlineOffset - halfWidth < -EPSILON || opening.centerlineOffset + halfWidth > wallLength + EPSILON) {
      errors.push(failure('OPENING_OUTSIDE_WALL', 'Opening must fit along the wall centerline span', [...path, 'centerlineOffset']));
    }
  }
}

function normalizeFinishLayers(layers) {
  return layers.reduce((acc, layer) => {
    const normalized = {
      side: layer.side,
      material: layer.material,
      thickness: layer.thickness,
      function: layer.function || 'finish',
    };
    acc.layers.push(normalized);
    if (layer.side === 'interior') acc.interiorThickness += layer.thickness;
    if (layer.side === 'exterior') acc.exteriorThickness += layer.thickness;
    return acc;
  }, { interiorThickness: 0, exteriorThickness: 0, layers: [] });
}

function referencePathToCenterline(path, { reference, totalThickness }) {
  const offset = reference.offset || 0;
  if (reference.line === 'centerline') return offsetPath(path, signedOffset(reference.side, offset));
  const faceOffset = totalThickness / 2;
  if (reference.line === 'interior_face') return offsetPath(path, signedOffset(reference.side, faceOffset + offset));
  if (reference.line === 'exterior_face') return offsetPath(path, signedOffset(reference.side, -faceOffset + offset));
  return path;
}

function signedOffset(side = 'left', distance = 0) {
  return side === 'right' ? -distance : distance;
}

function offsetPath(path, distance) {
  if (Math.abs(distance) <= EPSILON) return path;
  if (path.type === 'line') {
    return linePath(offsetPoint(path.start, path.normal, distance), offsetPoint(path.end, path.normal, distance));
  }
  return arcPath(path.center, path.radius + distance, path.startAngle, path.endAngle);
}

function linePath(start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const dz = end[2] - start[2];
  const length = Math.hypot(dx, dy, dz);
  const ux = length ? dx / length : 0;
  const uy = length ? dy / length : 0;
  return {
    type: 'line',
    start: [...start],
    end: [...end],
    length,
    direction: [ux, uy, length ? dz / length : 0],
    normal: [-uy, ux, 0],
  };
}

function arcPath(center, radius, startAngle, endAngle) {
  const radians = Math.abs((endAngle - startAngle) * Math.PI / 180);
  return {
    type: 'arc',
    center: [...center],
    radius,
    startAngle,
    endAngle,
    length: radius * radians,
  };
}

function sampleArcBand(path, innerRadius, outerRadius, segments) {
  const points = [];
  const start = path.startAngle * Math.PI / 180;
  const end = path.endAngle * Math.PI / 180;
  for (let i = 0; i <= segments; i += 1) {
    const t = start + (end - start) * (i / segments);
    points.push(pointOnArc(path.center, outerRadius, t));
  }
  for (let i = segments; i >= 0; i -= 1) {
    const t = start + (end - start) * (i / segments);
    points.push(pointOnArc(path.center, innerRadius, t));
  }
  return points;
}

function pointOnArc(center, radius, radians) {
  return [
    center[0] + Math.cos(radians) * radius,
    center[1] + Math.sin(radians) * radius,
    center[2],
  ];
}

function offsetPoint(point, normal, distance) {
  return [
    point[0] + normal[0] * distance,
    point[1] + normal[1] * distance,
    point[2] + normal[2] * distance,
  ];
}

function boundsForPoints(points, height) {
  const xs = points.map(point => point[0]);
  const ys = points.map(point => point[1]);
  const zs = points.map(point => point[2]);
  return {
    min: [Math.min(...xs), Math.min(...ys), Math.min(...zs)],
    max: [Math.max(...xs), Math.max(...ys), Math.max(...zs) + height],
  };
}

function isPoint3(point) {
  return Array.isArray(point) && point.length === 3 && point.every(Number.isFinite);
}

function isPositive(value) {
  return Number.isFinite(value) && value > 0;
}

function failure(code, message, path) {
  return { code, message, path };
}
