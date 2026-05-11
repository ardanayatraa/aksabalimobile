import { Geom, type Point } from "./geometry";
import { pathToPolyline } from "./pathSampler";

const TARGET_POINT_COUNT = 48;
const EPSILON = 0.00001;

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export type Metric = {
  score: number;
  shapeScore: number;
  directionScore: number;
  lengthScore: number;
  positionScore: number;
  smoothnessScore: number;
  dtwDistance: number;
  hausdorffDistance: number;
  startDistance: number;
  endDistance: number;
  centroidDistance: number;
  lengthRatio: number;
  isDirectionReversed: boolean;
  feedbackCode: string;
  feedbackMessage: string;
};

export type EvaluationResult = {
  normalizedPoints: Point[];
  metric: Metric;
};

export function pointsToPath(points: Point[]): string {
  if (!points.length) return "";
  const [first, ...rest] = points;
  return [
    `M${first.x.toFixed(2)},${first.y.toFixed(2)}`,
    ...rest.map((p) => `L${p.x.toFixed(2)},${p.y.toFixed(2)}`)
  ].join(" ");
}

export function pathLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Geom.distance(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
  }
  return total;
}

function centroid(points: Point[]): Point {
  if (!points.length) return { x: 0, y: 0 };
  const total = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: total.x / points.length, y: total.y / points.length };
}

function smoothPoints(points: Point[], radius = 2): Point[] {
  if (points.length <= 2) return points;
  return points.map((point, index) => {
    if (index === 0 || index === points.length - 1) return point;
    const start = Math.max(0, index - radius);
    const end = Math.min(points.length - 1, index + radius);
    return centroid(points.slice(start, end + 1));
  });
}

export function resample(points: Point[], count = TARGET_POINT_COUNT): Point[] {
  if (points.length === 0) return [];
  if (points.length === 1) return Array.from({ length: count }, () => points[0]);
  const totalLength = pathLength(points);
  if (totalLength <= EPSILON) return Array.from({ length: count }, () => points[0]);

  const interval = totalLength / (count - 1);
  const sampled: Point[] = [{ ...points[0] }];
  let distanceSinceLast = 0;
  let previous = { ...points[0] };

  for (let i = 1; i < points.length; i += 1) {
    let current = { ...points[i] };
    let segmentLength = Geom.distance(previous.x, previous.y, current.x, current.y);
    while (distanceSinceLast + segmentLength >= interval && segmentLength > EPSILON) {
      const ratio = (interval - distanceSinceLast) / segmentLength;
      const nextPoint: Point = {
        x: previous.x + ratio * (current.x - previous.x),
        y: previous.y + ratio * (current.y - previous.y)
      };
      sampled.push(nextPoint);
      previous = nextPoint;
      segmentLength = Geom.distance(previous.x, previous.y, current.x, current.y);
      distanceSinceLast = 0;
    }
    distanceSinceLast += segmentLength;
    previous = current;
  }
  while (sampled.length < count) sampled.push({ ...points[points.length - 1] });
  return sampled.slice(0, count);
}

export function pathToPoints(pathD: string, count = TARGET_POINT_COUNT): Point[] {
  if (!pathD) return [];
  return resample(pathToPolyline(pathD), count);
}

function dtwDistance(a: Point[], b: Point[]): number {
  if (!a.length || !b.length) return Number.POSITIVE_INFINITY;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => new Array<number>(cols).fill(Number.POSITIVE_INFINITY));
  dp[0][0] = 0;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = Geom.distance(a[i - 1].x, a[i - 1].y, b[j - 1].x, b[j - 1].y);
      dp[i][j] = cost + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length] / (a.length + b.length);
}

function directedHausdorff(a: Point[], b: Point[]): number {
  if (!a.length || !b.length) return Number.POSITIVE_INFINITY;
  let maxMin = 0;
  for (const point of a) {
    let minD = Number.POSITIVE_INFINITY;
    for (const other of b) {
      minD = Math.min(minD, Geom.distance(point.x, point.y, other.x, other.y));
    }
    maxMin = Math.max(maxMin, minD);
  }
  return maxMin;
}

function smoothnessOf(points: Point[]): number {
  if (points.length < 4) return 100;
  let angleChange = 0;
  let samples = 0;
  for (let i = 2; i < points.length; i += 1) {
    const a1 = Geom.angle(points[i - 2].x, points[i - 2].y, points[i - 1].x, points[i - 1].y);
    const a2 = Geom.angle(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
    angleChange += Geom.angleDiff(a1, a2);
    samples += 1;
  }
  const avg = samples ? angleChange / samples : 0;
  return clamp(100 - Math.max(0, avg - 18) * 1.8);
}

export function evaluateStroke(userPoints: Point[], referenceD: string): EvaluationResult {
  const cleanedUser = resample(smoothPoints(userPoints), TARGET_POINT_COUNT);
  const refPoints = pathToPoints(referenceD, TARGET_POINT_COUNT);
  const userLength = pathLength(cleanedUser);
  const refLength = pathLength(refPoints);
  const refReversed = [...refPoints].reverse();

  const directDtw = dtwDistance(cleanedUser, refPoints);
  const reverseDtw = dtwDistance(cleanedUser, refReversed);
  const isDirectionReversed = reverseDtw + 1.5 < directDtw;
  const compareRef = isDirectionReversed ? refReversed : refPoints;

  const dtw = Math.min(directDtw, reverseDtw);
  const haus = Math.max(directedHausdorff(cleanedUser, compareRef), directedHausdorff(compareRef, cleanedUser));
  const startD = refPoints.length
    ? Geom.distance(cleanedUser[0]?.x || 0, cleanedUser[0]?.y || 0, refPoints[0].x, refPoints[0].y)
    : 999;
  const endD = refPoints.length
    ? Geom.distance(
        cleanedUser[cleanedUser.length - 1]?.x || 0,
        cleanedUser[cleanedUser.length - 1]?.y || 0,
        refPoints[refPoints.length - 1].x,
        refPoints[refPoints.length - 1].y
      )
    : 999;
  const cu = centroid(cleanedUser);
  const cr = centroid(refPoints);
  const centroidD = Geom.distance(cu.x, cu.y, cr.x, cr.y);
  const lengthRatio = userLength / Math.max(refLength, EPSILON);

  const positionScore = clamp(100 - (startD * 2.2 + endD * 1.5 + centroidD * 2.4));
  const shapeScore = clamp(100 - (dtw * 7.5 + haus * 2.2));
  const directionScore = isDirectionReversed
    ? clamp(45 - reverseDtw)
    : clamp(100 - Math.abs(startD - endD) * 0.8);
  const lengthScore = clamp(100 - Math.abs(1 - lengthRatio) * 95);
  const smoothnessScore = smoothnessOf(cleanedUser);

  const score = clamp(
    shapeScore * 0.42 +
      positionScore * 0.24 +
      directionScore * 0.18 +
      lengthScore * 0.11 +
      smoothnessScore * 0.05
  );

  let feedbackCode = "shape_off";
  let feedbackMessage = "Bentuk stroke belum mengikuti contoh.";
  if (isDirectionReversed) {
    feedbackCode = "direction_reversed";
    feedbackMessage = "Arah goresan terbalik. Ikuti arah awal contoh.";
  } else if (startD > 12) {
    feedbackCode = "start_far";
    feedbackMessage = "Titik mulai terlalu jauh dari contoh.";
  } else if (endD > 14) {
    feedbackCode = "end_far";
    feedbackMessage = "Akhir goresan belum sampai posisi yang tepat.";
  } else if (lengthRatio < 0.72) {
    feedbackCode = "too_short";
    feedbackMessage = "Goresan terlalu pendek.";
  } else if (lengthRatio > 1.38) {
    feedbackCode = "too_long";
    feedbackMessage = "Goresan terlalu panjang.";
  } else if (smoothnessScore < 62) {
    feedbackCode = "jittery";
    feedbackMessage = "Goresan terlalu bergetar. Coba tulis lebih stabil.";
  } else if (score >= 88) {
    feedbackCode = "excellent";
    feedbackMessage = "Presisi sangat bagus.";
  } else if (score >= 76) {
    feedbackCode = "good";
    feedbackMessage = "Bagus, stroke sudah sesuai.";
  } else if (score >= 64) {
    feedbackCode = "close";
    feedbackMessage = "Hampir benar. Rapikan bentuk sedikit lagi.";
  }

  return {
    normalizedPoints: cleanedUser,
    metric: {
      score: Math.round(score),
      shapeScore: Math.round(shapeScore),
      directionScore: Math.round(directionScore),
      lengthScore: Math.round(lengthScore),
      positionScore: Math.round(positionScore),
      smoothnessScore: Math.round(smoothnessScore),
      dtwDistance: Number(dtw.toFixed(2)),
      hausdorffDistance: Number(haus.toFixed(2)),
      startDistance: Number(startD.toFixed(2)),
      endDistance: Number(endD.toFixed(2)),
      centroidDistance: Number(centroidD.toFixed(2)),
      lengthRatio: Number(lengthRatio.toFixed(2)),
      isDirectionReversed,
      feedbackCode,
      feedbackMessage
    }
  };
}
