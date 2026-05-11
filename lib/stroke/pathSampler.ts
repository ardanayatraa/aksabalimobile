import type { Point } from "./geometry";

const NUMBER_RE = /[a-zA-Z]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi;

function tokenize(pathD: string): string[] {
  return String(pathD || "").match(NUMBER_RE) || [];
}

function isCommand(token: string): boolean {
  return /^[a-zA-Z]$/.test(token);
}

function cubicPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt ** 3 * p0.x + 3 * mt ** 2 * t * p1.x + 3 * mt * t ** 2 * p2.x + t ** 3 * p3.x,
    y: mt ** 3 * p0.y + 3 * mt ** 2 * t * p1.y + 3 * mt * t ** 2 * p2.y + t ** 3 * p3.y
  };
}

function quadraticPoint(p0: Point, p1: Point, p2: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt ** 2 * p0.x + 2 * mt * t * p1.x + t ** 2 * p2.x,
    y: mt ** 2 * p0.y + 2 * mt * t * p1.y + t ** 2 * p2.y
  };
}

function reflect(point: Point | null, around: Point): Point {
  if (!point) return around;
  return { x: around.x * 2 - point.x, y: around.y * 2 - point.y };
}

function readNumber(tokens: string[], index: number): number | null {
  const token = tokens[index];
  if (token == null || isCommand(token)) return null;
  return Number(token);
}

function addPoint(points: Point[], point: Point) {
  const last = points[points.length - 1];
  if (!last || Math.hypot(point.x - last.x, point.y - last.y) > 0.001) {
    points.push(point);
  }
}

export function pathToPolyline(pathD: string, curveSegments = 18): Point[] {
  const tokens = tokenize(pathD);
  const points: Point[] = [];
  let index = 0;
  let command = "";
  let current: Point = { x: 0, y: 0 };
  let subpathStart: Point = { x: 0, y: 0 };
  let lastCubicControl: Point | null = null;
  let lastQuadraticControl: Point | null = null;

  const readPoint = (relative = false): Point | null => {
    const x = readNumber(tokens, index);
    const y = readNumber(tokens, index + 1);
    if (x == null || y == null) return null;
    index += 2;
    return relative ? { x: current.x + x, y: current.y + y } : { x, y };
  };

  while (index < tokens.length) {
    if (isCommand(tokens[index])) {
      command = tokens[index];
      index += 1;
    }
    if (!command) break;
    const relative = command === command.toLowerCase();
    const upper = command.toUpperCase();

    if (upper === "M") {
      const first = readPoint(relative);
      if (!first) break;
      current = first;
      subpathStart = first;
      addPoint(points, current);
      lastCubicControl = null;
      lastQuadraticControl = null;
      command = relative ? "l" : "L";
      continue;
    }
    if (upper === "L") {
      const point = readPoint(relative);
      if (!point) break;
      current = point;
      addPoint(points, current);
      lastCubicControl = null;
      lastQuadraticControl = null;
      continue;
    }
    if (upper === "H") {
      const x = readNumber(tokens, index);
      if (x == null) break;
      index += 1;
      current = { x: relative ? current.x + x : x, y: current.y };
      addPoint(points, current);
      lastCubicControl = null;
      lastQuadraticControl = null;
      continue;
    }
    if (upper === "V") {
      const y = readNumber(tokens, index);
      if (y == null) break;
      index += 1;
      current = { x: current.x, y: relative ? current.y + y : y };
      addPoint(points, current);
      lastCubicControl = null;
      lastQuadraticControl = null;
      continue;
    }
    if (upper === "C") {
      const p1 = readPoint(relative);
      const p2 = readPoint(relative);
      const p3 = readPoint(relative);
      if (!p1 || !p2 || !p3) break;
      const start = current;
      for (let step = 1; step <= curveSegments; step += 1) {
        addPoint(points, cubicPoint(start, p1, p2, p3, step / curveSegments));
      }
      current = p3;
      lastCubicControl = p2;
      lastQuadraticControl = null;
      continue;
    }
    if (upper === "S") {
      const p1 = reflect(lastCubicControl, current);
      const p2 = readPoint(relative);
      const p3 = readPoint(relative);
      if (!p2 || !p3) break;
      const start = current;
      for (let step = 1; step <= curveSegments; step += 1) {
        addPoint(points, cubicPoint(start, p1, p2, p3, step / curveSegments));
      }
      current = p3;
      lastCubicControl = p2;
      lastQuadraticControl = null;
      continue;
    }
    if (upper === "Q") {
      const p1 = readPoint(relative);
      const p2 = readPoint(relative);
      if (!p1 || !p2) break;
      const start = current;
      for (let step = 1; step <= curveSegments; step += 1) {
        addPoint(points, quadraticPoint(start, p1, p2, step / curveSegments));
      }
      current = p2;
      lastQuadraticControl = p1;
      lastCubicControl = null;
      continue;
    }
    if (upper === "T") {
      const p1 = reflect(lastQuadraticControl, current);
      const p2 = readPoint(relative);
      if (!p2) break;
      const start = current;
      for (let step = 1; step <= curveSegments; step += 1) {
        addPoint(points, quadraticPoint(start, p1, p2, step / curveSegments));
      }
      current = p2;
      lastQuadraticControl = p1;
      lastCubicControl = null;
      continue;
    }
    if (upper === "Z") {
      current = subpathStart;
      addPoint(points, current);
      command = "";
      lastCubicControl = null;
      lastQuadraticControl = null;
      continue;
    }
    break;
  }
  return points;
}
