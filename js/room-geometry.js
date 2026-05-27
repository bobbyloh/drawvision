export function createRoomGeometry(command, options = {}) {
  const errors = validateRoomDetect(command);
  if (errors.length) return { ok: false, errors };

  const id = command.id || options.idFactory?.('room') || `room_${Date.now()}`;
  const boundary = command.boundary;

  return {
    ok: true,
    room: {
      id,
      kind: 'room',
      roomType: command.room_type || 'generic',
      name: command.name || id,
      boundary,
      area: polygonArea(boundary),
      parentLevel: command.parent_level || null,
      containedObjects: [],
      derived: {
        centroid: polygonCentroid(boundary),
        bounds: boundsForPoints(boundary),
      },
    },
  };
}

export function validateRoomDetect(command) {
  const errors = [];

  if (!command || command.cmd !== 'room.detect') {
    errors.push({ code: 'ROOM_COMMAND_REQUIRED', message: 'Expected room.detect command' });
    return errors;
  }

  if (!Array.isArray(command.boundary) || command.boundary.length < 3) {
    errors.push({ code: 'ROOM_BOUNDARY_INVALID', message: 'Room boundary must have at least 3 points' });
    return errors;
  }

  for (const point of command.boundary) {
    if (!isPoint3(point)) {
      errors.push({ code: 'ROOM_BOUNDARY_POINT_INVALID', message: 'Room boundary points must be [x,y,z]' });
      break;
    }
  }

  if (polygonArea(command.boundary) <= 0) {
    errors.push({ code: 'ROOM_AREA_INVALID', message: 'Room area must be greater than zero' });
  }

  return errors;
}

export function polygonArea(points) {
  const sum = points.reduce((total, point, index) => {
    const next = points[(index + 1) % points.length];
    return total + point[0] * next[1] - next[0] * point[1];
  }, 0);

  return Math.abs(sum) / 2;
}

export function polygonCentroid(points) {
  const x = points.reduce((total, point) => total + point[0], 0) / points.length;
  const y = points.reduce((total, point) => total + point[1], 0) / points.length;
  const z = points.reduce((total, point) => total + (point[2] || 0), 0) / points.length;

  return [x, y, z];
}

export function boundsForPoints(points) {
  return {
    min: [
      Math.min(...points.map(point => point[0])),
      Math.min(...points.map(point => point[1])),
      Math.min(...points.map(point => point[2] || 0)),
    ],
    max: [
      Math.max(...points.map(point => point[0])),
      Math.max(...points.map(point => point[1])),
      Math.max(...points.map(point => point[2] || 0)),
    ],
  };
}

export function pointInRoom(point, room) {
  return pointInPolygon(point, room.boundary);
}

export function pointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersects = ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-9) + xi);

    if (intersects) inside = !inside;
  }

  return inside;
}

function isPoint3(value) {
  return Array.isArray(value)
    && value.length === 3
    && value.every(Number.isFinite);
}
