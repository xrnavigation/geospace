import { describe, it, expect } from 'vitest';
import { Circle, Geometry, LineSegment, Point, Polygon2D, Ray, rayCircleIntersection, rayPolygonIntersection, raySegmentIntersection, GeometryEngine } from "./geometry";

const EPSILON = 1e-10;
const engine = new GeometryEngine((a, b) => Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2)));

describe('Ray Intersection Tests', () => {
  describe('Ray vs Line Segment', () => {
    const ray1: Ray = { origin: new Point2D(0, 0), direction: new Point2D(1, 0) };

    it('should detect intersection when ray hits segment', () => {
      const seg1: LineSegment = new LineSegment2D(new Point2D(2, -1), new Point2D(2, 1));
      const inter1 = raySegmentIntersection(ray1, seg1);
      expect(inter1).not.toBeNull();
      expect(Math.abs(inter1!.x - 2)).toBeLessThan(EPSILON);
      expect(Math.abs(inter1!.y - 0)).toBeLessThan(EPSILON);
    });

    it('should return null when ray misses segment', () => {
      const seg2: LineSegment = new LineSegment2D(new Point2D(0, 1), new Point2D(1, 1));
      const inter2 = raySegmentIntersection(ray1, seg2);
      expect(inter2).toBeNull();
    });
  });

  describe('Ray vs Circle', () => {
    const ray1: Ray = { origin: new Point2D(0, 0), direction: new Point2D(1, 0) };

    it('should detect intersection when ray hits circle', () => {
      const circle2: Circle = new Circle2D(new Point2D(5, 0), 1);
      const inter3 = rayCircleIntersection(ray1, circle2);
      expect(inter3).not.toBeNull();
      expect(Math.abs(inter3!.x - 4)).toBeLessThan(EPSILON);
    });

    it('should return null when ray misses circle', () => {
      const circle3: Circle = new Circle2D(new Point2D(0, 5), 1);
      const inter4 = rayCircleIntersection(ray1, circle3);
      expect(inter4).toBeNull();
    });
  });

  describe('Ray vs Polygon', () => {
    const ray2: Ray = { origin: new Point2D(0, 0), direction: new Point2D(1, 1) };

    it('should detect intersection when ray hits polygon', () => {
      const square2 = new Polygon2D([
        new Point2D(3, 3),
        new Point2D(7, 3),
        new Point2D(7, 7),
        new Point2D(3, 7),
      ]);
      const inter5 = rayPolygonIntersection(ray2, square2);
      expect(inter5).not.toBeNull();
      expect(Math.abs(inter5!.x - 3)).toBeLessThan(EPSILON);
      expect(Math.abs(inter5!.y - 3)).toBeLessThan(EPSILON);
    });

    it('should return null when ray misses polygon', () => {
      const square3 = new Polygon2D([
        new Point2D(-7, -7),
        new Point2D(-3, -7),
        new Point2D(-3, -3),
        new Point2D(-7, -3),
      ]);
      const inter6 = rayPolygonIntersection(ray2, square3);
      expect(inter6).toBeNull();
    });
  });
});

describe("Raycast Edge Cases", () => {
  it("returns null for ray with zero direction vector on segment", () => {
    const rayZero: Ray = { origin: new Point2D(0, 0), direction: new Point2D(0, 0) };
    const seg: LineSegment = new LineSegment2D(new Point2D(1, 1), new Point2D(2, 2));
    const inter = raySegmentIntersection(rayZero, seg);
    expect(inter).toBeNull();
  });

  it("detects intersection when ray starts inside a circle", () => {
    const rayInside: Ray = { origin: new Point2D(5, 0), direction: new Point2D(1, 0) };
    const circle: Circle = new Circle2D(new Point2D(5, 0), 2);
    const inter = rayCircleIntersection(rayInside, circle);
    expect(inter).not.toBeNull();
    expect(Math.abs(inter!.x - 7)).toBeLessThan(EPSILON);
  });

  it("detects tangent intersection with circle", () => {
    const ray: Ray = { origin: new Point2D(0, 0), direction: new Point2D(1, 0) };
    const circle: Circle = new Circle2D(new Point2D(5, 1), 1);
    const inter = rayCircleIntersection(ray, circle);
    expect(inter).not.toBeNull();
    expect(Math.abs(inter!.x - 5)).toBeLessThan(EPSILON);
    expect(Math.abs(inter!.y - 0)).toBeLessThan(EPSILON);
  });
});

describe('GeometryEngine Raycast Tests', () => {
  const rayOrigin: Point = new Point2D(0, 0);
  const rayDirection: Point = new Point2D(1, 0);

  it('should detect intersection with line segment', () => {
    const seg: LineSegment = new LineSegment2D(new Point2D(2, -1), new Point2D(2, 1));
    const resultSeg = engine.raycast(rayOrigin, rayDirection, seg);
    expect(resultSeg).not.toBeNull();
    expect(Math.abs(resultSeg!.point.x - 2)).toBeLessThan(EPSILON);
  });

  it('should detect intersection with circle', () => {
    const circle: Circle = new Circle2D(new Point2D(5, 0), 1);
    const resultCircle = engine.raycast(rayOrigin, rayDirection, circle);
    expect(resultCircle).not.toBeNull();
    expect(Math.abs(resultCircle!.point.x - 4)).toBeLessThan(EPSILON);
  });

  it('should detect intersection with polygon', () => {
    const poly = new Polygon2D([
      new Point2D(3, 3),
      new Point2D(7, 3),
      new Point2D(7, 7),
      new Point2D(3, 7),
    ]);
    const resultPoly = engine.raycast(rayOrigin, rayDirection, poly);
    expect(resultPoly).not.toBeNull();
    expect(Math.abs(resultPoly!.point.x - 3)).toBeLessThan(EPSILON);
  });

  it('should find closest intersection when casting against multiple geometries', () => {
    const seg: LineSegment = new LineSegment2D(new Point2D(2, -1), new Point2D(2, 1));
    const circle: Circle = new Circle2D(new Point2D(5, 0), 1);
    const poly = new Polygon2D([
      new Point2D(3, 3),
      new Point2D(7, 3),
      new Point2D(7, 7),
      new Point2D(3, 7),
    ]);
    const geometries: Geometry[] = [seg, circle, poly];
    const resultAll = engine.raycastAll(rayOrigin, rayDirection, geometries);
    expect(resultAll).not.toBeNull();
    expect(Math.abs(resultAll!.point.x - 2)).toBeLessThan(EPSILON);
  });
});
