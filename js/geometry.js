export function distance(a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = (b[2] || 0) - (a[2] || 0);
  return Math.hypot(dx, dy, dz);
}

export function translatePoint([x, y, z = 0], dx, dy, dz = 0) {
  return [x + dx, y + dy, z + dz];
}

export function rotatePoint([x, y, z = 0], axis = 'x', degrees = 90) {
  const radians = degrees * Math.PI / 180;
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  if (axis === 'y') return [round(x * c + z * s), y, round(-x * s + z * c)];
  if (axis === 'z') return [round(x * c - y * s), round(x * s + y * c), z];
  return [x, round(y * c - z * s), round(y * s + z * c)];
}

export function cloneObject(object, suffix) {
  return JSON.parse(JSON.stringify({ ...object, id: `${object.id}_${suffix}` }));
}

export function translateObject(object, dx, dy, dz = 0) {
  const copy = JSON.parse(JSON.stringify(object));
  if (copy.points) copy.points = copy.points.map(point => translatePoint(point, dx, dy, dz));
  if (copy.center) copy.center = translatePoint(copy.center, dx, dy, dz);
  if (copy.point) copy.point = translatePoint(copy.point, dx, dy, dz);
  return copy;
}

export function rotateObject(object, axis = 'x', degrees = 90) {
  const copy = JSON.parse(JSON.stringify(object));
  if (copy.points) copy.points = copy.points.map(point => rotatePoint(point, axis, degrees));
  if (copy.center) copy.center = rotatePoint(copy.center, axis, degrees);
  if (copy.point) copy.point = rotatePoint(copy.point, axis, degrees);
  copy.attrs = { ...copy.attrs, rotated: `${axis.toUpperCase()} ${degrees}` };
  return copy;
}

export function extrudeObject(object, height) {
  if (!['poly', 'circle'].includes(object.type)) return object;
  const copy = JSON.parse(JSON.stringify(object));
  copy.extrudeHeight = height;
  copy.attrs = { ...copy.attrs, extrudeHeight: `${height}'` };
  return copy;
}

export function flattenObject(object) {
  const copy = JSON.parse(JSON.stringify(object));
  copy.extrudeHeight = 0;
  if (copy.points) copy.points = copy.points.map(([x, y]) => [x, y, 0]);
  if (copy.center) copy.center = [copy.center[0], copy.center[1], 0];
  if (copy.point) copy.point = [copy.point[0], copy.point[1], 0];
  return copy;
}

export function polygonArea(points = []) {
  if (points.length < 3) return 0;
  const sum = points.reduce((total, point, index) => {
    const next = points[(index + 1) % points.length];
    return total + point[0] * next[1] - next[0] * point[1];
  }, 0);
  return Math.abs(sum) / 2;
}

export function objectLength(object) {
  if (object.type === 'line') return distance(object.points[0], object.points[1]);
  if (object.type === 'circle') return 2 * Math.PI * object.radius;
  if (!object.points) return 0;
  return object.points.reduce((total, point, index) => {
    const next = object.points[(index + 1) % object.points.length];
    if (!next || (!object.closed && index === object.points.length - 1)) return total;
    return total + distance(point, next);
  }, 0);
}

export function offsetPolygon(points, offset) {
  const cx = points.reduce((total, point) => total + point[0], 0) / points.length;
  const cy = points.reduce((total, point) => total + point[1], 0) / points.length;
  return points.map(([x, y, z = 0]) => {
    const dx = x - cx;
    const dy = y - cy;
    const length = Math.hypot(dx, dy) || 1;
    return [round(x + dx / length * offset), round(y + dy / length * offset), z];
  });
}

function round(value) {
  return Math.abs(value) < 1e-9 ? 0 : Number(value.toFixed(9));
}
