import { describe, expect, it } from 'vitest';
import {
  Circle,
  EPSILON,
  euclideanDistance,
  GeometryEngine,
  LineSegment,
  Point,
  Polygon2D,
} from "./geometry";

describe('GeometryEngine', () => {
  const engine = new GeometryEngine(euclideanDistance);
  
  describe('Point Operations', () => {
    const p1: Point = { x: 0, y: 0 };
    const p2: Point = { x: 3, y: 4 };
    const p3: Point = { x: 5, y: 5 };
    const p4: Point = { x: 0, y: 10 };
    const p5: Point = { x: 5, y: 5 };
    const p6: Point = { x: -5, y: 5 };

    it('calculates point-to-point distance', () => {
      expect(Math.abs(engine.pointToPointDistance(p1, p2) - 5)).toBeLessThan(EPSILON);
    });

    const line: LineSegment = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } };
    it('calculates point-to-line distance', () => {
      expect(Math.abs(engine.pointToLineDistance(p3, line) - 5)).toBeLessThan(EPSILON);
    });

    const circle: Circle = { center: { x: 0, y: 0 }, radius: 5 };
    it('calculates point-to-circle distance', () => {
      expect(Math.abs(engine.pointToCircleDistance(p4, circle) - 5)).toBeLessThan(EPSILON);
      expect(engine.pointToCircleDistance({ x: 0, y: 0 }, circle)).toBe(0);
    });

    const square = new Polygon2D([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]);
    
    it('calculates point-to-polygon distance', () => {
      expect(engine.pointToPolygonDistance(p5, square)).toBe(0);
      expect(Math.abs(engine.pointToPolygonDistance(p6, square) - 5)).toBeLessThan(EPSILON);
    });
  });

  describe('Line Operations', () => {
    const line: LineSegment = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } };
    const line2: LineSegment = { start: { x: 0, y: 5 }, end: { x: 10, y: 5 } };
    const line3: LineSegment = { start: { x: 6, y: 6 }, end: { x: 10, y: 6 } };
    const line4: LineSegment = { start: { x: -5, y: 5 }, end: { x: -1, y: 5 } };
    const circle: Circle = { center: { x: 0, y: 0 }, radius: 5 };
    const square = new Polygon2D([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]);

    it('calculates line-to-line distance', () => {
      expect(engine.lineToLineDistance(line, line2)).toBe(5);
    });

    it('calculates line-to-circle distance', () => {
      expect(engine.lineToCircleDistance(line, circle)).toBe(0);
      expect(engine.lineToCircleDistance(line3, circle)).toBeGreaterThan(0);
    });

    it('calculates line-to-polygon distance', () => {
      expect(Math.abs(engine.lineToPolygonDistance(line4, square) - 1)).toBeLessThan(EPSILON);
    });
  });

  describe('Circle Operations', () => {
    const circle: Circle = { center: { x: 0, y: 0 }, radius: 5 };
    const circle2: Circle = { center: { x: 15, y: 0 }, radius: 5 };
    const circle3: Circle = { center: { x: -10, y: -10 }, radius: 2 };
    const square = new Polygon2D([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]);

    it('calculates circle-to-circle distance', () => {
      expect(engine.circleToCircleDistance(circle, circle2)).toBe(5);
    });

    it('calculates circle-to-polygon distance', () => {
      expect(engine.circleToPolygonDistance(circle, square)).toBe(0);
      expect(engine.circleToPolygonDistance(circle3, square)).toBeGreaterThan(0);
    });
  });

  describe('Polygon Operations', () => {
    const square = new Polygon2D([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]);
    const square2 = new Polygon2D([
      { x: 20, y: 20 },
      { x: 30, y: 20 },
      { x: 30, y: 30 },
      { x: 20, y: 30 },
    ]);

    it('calculates polygon-to-polygon distance', () => {
      expect(Math.abs(
        engine.polygonToPolygonDistance(square, square2) - 14.142135623730951
      )).toBeLessThan(EPSILON);
    });
  });

  describe('Intersection Tests', () => {
    const p1: Point = { x: 0, y: 0 };
    const line: LineSegment = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } };
    const circle: Circle = { center: { x: 0, y: 0 }, radius: 5 };
    const square = new Polygon2D([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]);
    const p5: Point = { x: 5, y: 5 };

    it('detects various intersections', () => {
      expect(engine.intersects(p1, p1)).toBe(true);
      expect(engine.intersects(p1, line)).toBe(true);
      expect(engine.intersects({ x: 5, y: 5 }, line)).toBe(false);
      expect(engine.intersects(circle, p1)).toBe(true);
      expect(engine.intersects(square, p5)).toBe(true);
      expect(engine.intersects(line, line)).toBe(true);
    });
  });

  describe('Contains Tests', () => {
    const p1: Point = { x: 0, y: 0 };
    const p4: Point = { x: 0, y: 10 };
    const p5: Point = { x: 5, y: 5 };
    const circle: Circle = { center: { x: 0, y: 0 }, radius: 5 };
    const line: LineSegment = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } };
    const square = new Polygon2D([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]);

    it('checks containment relationships', () => {
      expect(engine.contains(circle, p1)).toBe(true);
      expect(engine.contains(circle, p4)).toBe(false);
      expect(engine.contains(square, p5)).toBe(true);
      expect(engine.contains(square, line)).toBe(true);
      expect(engine.contains(square, circle)).toBe(false);
    });
  });

  describe('Area and Perimeter', () => {
    const circle: Circle = { center: { x: 0, y: 0 }, radius: 5 };
    const square = new Polygon2D([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]);
    const line: LineSegment = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } };

    it('calculates areas correctly', () => {
      expect(Math.abs(engine.area(circle) - Math.PI * 25)).toBeLessThan(EPSILON);
      expect(Math.abs(engine.area(square) - 100)).toBeLessThan(EPSILON);
    });

    it('calculates perimeters correctly', () => {
      expect(Math.abs(engine.perimeter(circle) - 2 * Math.PI * 5)).toBeLessThan(EPSILON);
      expect(Math.abs(engine.perimeter(square) - 40)).toBeLessThan(EPSILON);
      expect(Math.abs(engine.perimeter(line) - 10)).toBeLessThan(EPSILON);
    });
  });
});
