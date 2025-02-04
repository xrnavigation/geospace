import { describe, expect, it } from 'vitest';
import {
  Circle,
  Circle2D,
  EPSILON,
  euclideanDistance,
  GeometryEngine,
  LineSegment,
  Point,
  Polygon2D,
  AffineTransform,
  raySegmentIntersection,
  rayCircleIntersection,
  rayPolygonIntersection
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

  describe('Edge Cases - Collinear Segments', () => {
    it('detects overlapping vertical collinear segments', () => {
      const line1 = { start: { x: 5, y: 0 }, end: { x: 5, y: 10 } };
      const line2 = { start: { x: 5, y: 5 }, end: { x: 5, y: 15 } };
      const engineLocal = new GeometryEngine(euclideanDistance);
      expect(engineLocal.intersects(line1, line2)).toBe(true);
    });
  });

  describe('Polygon Holes - Intersection', () => {
    const outer = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 }
    ];
    const hole = [
      { x: 4, y: 4 },
      { x: 6, y: 4 },
      { x: 6, y: 6 },
      { x: 4, y: 6 }
    ];
    const donut = new Polygon2D(outer, [hole]);

    it('line through hole does not intersect polygon', () => {
      const line = { start: { x: 5, y: 3 }, end: { x: 5, y: 7 } };
      const engineLocal = new GeometryEngine(euclideanDistance);
      expect(engineLocal.intersects(line, donut)).toBe(true);
      
      const innerLine = { start: { x: 5, y: 4.5 }, end: { x: 5, y: 5.5 } };
      expect(engineLocal.intersects(innerLine, donut)).toBe(false);
    });

    it('circle in hole does not intersect polygon', () => {
      const circle = new Circle2D({ x: 5, y: 5 }, 0.5);
      const engineLocal = new GeometryEngine(euclideanDistance);
      expect(engineLocal.intersects(circle, donut)).toBe(false);
    });
  });
});

describe("Edge Cases", () => {
  it("throws error when creating a polygon with less than 3 vertices", () => {
    expect(() => new Polygon2D([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toThrowError("A polygon must have at least 3 vertices");
  });

  it("throws error when creating a circle with non-positive radius", () => {
    expect(() => { new Circle2D({ x: 0, y: 0 }, 0); }).toThrow();
    expect(() => { new Circle2D({ x: 0, y: 0 }, -5); }).toThrow();
  });

  it("considers a point on the vertex of a polygon as intersecting", () => {
    const square = new Polygon2D([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]);
    const p = { x: 0, y: 0 };
    const engineLocal = new GeometryEngine(euclideanDistance);
    expect(engineLocal.intersects(p, square)).toBe(true);
  });

  it("calculates zero distance for overlapping identical shapes", () => {
    const p: Point = { x: 5, y: 5 };
    const engineLocal = new GeometryEngine(euclideanDistance);
    expect(engineLocal.pointToPointDistance(p, p)).toBe(0);
  });
});

describe('Polygon with Holes', () => {
  const outer = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];
  const hole = [
    { x: 3, y: 3 },
    { x: 7, y: 3 },
    { x: 7, y: 7 },
    { x: 3, y: 7 },
  ];
  const donut = new Polygon2D(outer, [hole]);

  it('detects point inside exterior and outside hole as inside polygon', () => {
    expect(donut.getBoundingBox()).toEqual({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    const engineLocal = new GeometryEngine(euclideanDistance);
    // Points clearly in the exterior but not in the hole
    expect(engineLocal.intersects({ x: 1, y: 1 }, donut)).toBe(true);
    expect(engineLocal.contains(donut, { x: 8, y: 8 })).toBe(true);
  });

  it('detects point inside the hole as outside polygon', () => {
    const engineLocal = new GeometryEngine(euclideanDistance);
    expect(engineLocal.intersects({ x: 5, y: 5 }, donut)).toBe(false);
  });
});

describe('AffineTransform', () => {
  it('translates a point', () => {
    const transform = new AffineTransform().translate({ x: 5, y: 7 });
    const p: Point = { x: 1, y: 2 };
    const p2 = transform.apply(p) as Point;
    expect(p2.x).toBeCloseTo(6, 10);
    expect(p2.y).toBeCloseTo(9, 10);
  });

  it('rotates a point', () => {
    const transform = new AffineTransform().rotate(Math.PI / 2);
    const p: Point = { x: 1, y: 0 };
    const p2 = transform.apply(p) as Point;
    expect(p2.x).toBeCloseTo(0, 10);
    expect(p2.y).toBeCloseTo(1, 10);
  });

  it('scales a point', () => {
    const transform = new AffineTransform().scale(2);
    const p: Point = { x: 3, y: 4 };
    const p2 = transform.apply(p) as Point;
    expect(p2.x).toBeCloseTo(6, 10);
    expect(p2.y).toBeCloseTo(8, 10);
  });

  it('transforms a line segment', () => {
    const line: LineSegment = { start: { x: 0, y: 0 }, end: { x: 2, y: 0 } };
    const transform = new AffineTransform().translate({ x: 1, y: 1 });
    const newLine = transform.apply(line) as { start: Point; end: Point };
    expect(newLine.start.x).toBeCloseTo(1, 10);
    expect(newLine.start.y).toBeCloseTo(1, 10);
    expect(newLine.end.x).toBeCloseTo(3, 10);
    expect(newLine.end.y).toBeCloseTo(1, 10);
  });

  it('transforms a circle', () => {
    const circle: Circle = { center: { x: 0, y: 0 }, radius: 3 };
    const transform = new AffineTransform().translate({ x: 2, y: 2 });
    const newCircle = transform.apply(circle) as Circle;
    expect(newCircle.center.x).toBeCloseTo(2, 10);
    expect(newCircle.center.y).toBeCloseTo(2, 10);
    expect(newCircle.radius).toBeCloseTo(3, 10);
  });

  it('transforms a polygon', () => {
    const polygon = new Polygon2D([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }]);
    const transform = new AffineTransform().scale(2);
    const newPolygon = transform.apply(polygon) as Polygon2D;
    expect(newPolygon.exterior[0].x).toBeCloseTo(0, 10);
    expect(newPolygon.exterior[0].y).toBeCloseTo(0, 10);
    expect(newPolygon.exterior[1].x).toBeCloseTo(8, 10);
    expect(newPolygon.exterior[1].y).toBeCloseTo(0, 10);
    expect(newPolygon.exterior[2].x).toBeCloseTo(8, 10);
    expect(newPolygon.exterior[2].y).toBeCloseTo(6, 10);
  });
});

describe('Ray Intersection', () => {
  it('finds intersection between ray and line segment', () => {
    const ray = { origin: { x: 0, y: 0 }, direction: { x: 1, y: 0 } };
    const seg: LineSegment = { start: { x: 5, y: -1 }, end: { x: 5, y: 1 } };
    const intersection = raySegmentIntersection(ray, seg);
    expect(intersection).not.toBeNull();
    if (intersection) {
      expect(intersection.x).toBeCloseTo(5, 10);
      expect(intersection.y).toBeCloseTo(0, 10);
    }
  });

  it('returns null for ray with no intersection on line segment', () => {
    const ray = { origin: { x: 0, y: 0 }, direction: { x: 0, y: 1 } };
    const seg: LineSegment = { start: { x: 5, y: -1 }, end: { x: 5, y: 1 } };
    const intersection = raySegmentIntersection(ray, seg);
    expect(intersection).toBeNull();
  });

  it('finds intersection between ray and circle', () => {
    const ray = { origin: { x: -10, y: 0 }, direction: { x: 1, y: 0 } };
    const circle: Circle = { center: { x: 0, y: 0 }, radius: 5 };
    const intersection = rayCircleIntersection(ray, circle);
    expect(intersection).not.toBeNull();
    if (intersection) {
      expect(intersection.x).toBeCloseTo(-5, 10);
      expect(intersection.y).toBeCloseTo(0, 10);
    }
  });

  it('finds intersection between ray and polygon', () => {
    const square = new Polygon2D([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]);
    const ray = { origin: { x: -5, y: 5 }, direction: { x: 1, y: 0 } };
    const intersection = rayPolygonIntersection(ray, square);
    expect(intersection).not.toBeNull();
    if (intersection) {
      expect(intersection.x).toBeCloseTo(0, 10);
      expect(intersection.y).toBeCloseTo(5, 10);
    }
  });
});
