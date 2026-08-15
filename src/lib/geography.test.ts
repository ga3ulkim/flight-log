import { describe, expect, it } from 'vitest';
import {
  MAP_WIDTH,
  arcGeometry,
  haversine,
  nearestWorldOffset,
  normalizeWorldX,
  projectLongitude,
  quadraticPoint,
  routeCameraScale,
  wrapTowards,
} from './geography';

describe('geographic helpers', () => {
  it('computes a one-degree equatorial haversine distance', () => {
    expect(haversine([0, 0], [0, 1])).toBeCloseTo(111.195, 3);
  });

  it('normalizes user-controlled x positions into one world', () => {
    expect(normalizeWorldX(MAP_WIDTH + 25)).toBe(25);
    expect(normalizeWorldX(-25)).toBe(MAP_WIDTH - 25);
  });

  it('wraps a dateline target toward the closest world copy', () => {
    const reference = projectLongitude(179);
    const [target] = wrapTowards(reference, 0, -179);
    expect(Math.abs(target - reference)).toBeLessThan(10);
    expect(target).toBeGreaterThan(MAP_WIDTH);
  });

  it('selects a stable nearest world offset for a segment', () => {
    expect(nearestWorldOffset(5, 995)).toBe(MAP_WIDTH);
    expect(nearestWorldOffset(995, 5)).toBe(-MAP_WIDTH);
    expect(nearestWorldOffset(500, 510)).toBe(0);
  });

  it('uses the short longitudinal span for a dateline route', () => {
    const geometry = arcGeometry('HNL', 'NRT');
    expect(Math.abs(geometry.x2 - geometry.x1)).toBeLessThan(MAP_WIDTH / 2);
  });

  it('evaluates quadratic route endpoints exactly', () => {
    const geometry = arcGeometry('ICN', 'NRT');
    expect(quadraticPoint(geometry, 0)).toEqual([geometry.x1, geometry.y1]);
    expect(quadraticPoint(geometry, 1)).toEqual([geometry.x2, geometry.y2]);
  });

  it('zooms closer for a short route than a long route', () => {
    const shortScale = routeCameraScale(arcGeometry('ICN', 'CJU'));
    const longScale = routeCameraScale(arcGeometry('ICN', 'JFK'));
    expect(shortScale).toBeGreaterThan(longScale);
  });
});
