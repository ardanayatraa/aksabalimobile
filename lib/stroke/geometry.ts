export type Point = { x: number; y: number };

export const Geom = {
  distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.hypot(x2 - x1, y2 - y1);
  },
  angle(x1: number, y1: number, x2: number, y2: number): number {
    return (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  },
  angleDiff(a1: number, a2: number): number {
    let diff = a1 - a2;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return Math.abs(diff);
  }
};
