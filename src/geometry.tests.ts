// ==========================
// Test suite

import {
  Circle,
  EPSILON,
  euclideanDistance,
  GeometryEngine,
  LineSegment,
  Point,
  Polygon2D,
} from "./geometry";

// ==========================
function runTests() {
  function assert(condition: boolean, message: string) {
    if (!condition) {
      throw new Error("Assertion failed: " + message);
    }
  }
  console.log("Running tests...");

  // Use Euclidean distance for the engine.
  const engine = new GeometryEngine(euclideanDistance);

  // --- Point-to-point distance ---
  const p1: Point = { x: 0, y: 0 };
  const p2: Point = { x: 3, y: 4 };
  assert(
    Math.abs(engine.pointToPointDistance(p1, p2) - 5) < EPSILON,
    "Point-to-point distance"
  );

  // --- Point-to-line distance ---
  const line: LineSegment = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } };
  const p3: Point = { x: 5, y: 5 };
  assert(
    Math.abs(engine.pointToLineDistance(p3, line) - 5) < EPSILON,
    "Point-to-line distance"
  );

  // --- Point-to-circle distance ---
  const circle: Circle = { center: { x: 0, y: 0 }, radius: 5 };
  const p4: Point = { x: 0, y: 10 };
  assert(
    Math.abs(engine.pointToCircleDistance(p4, circle) - 5) < EPSILON,
    "Point-to-circle distance"
  );
  assert(
    engine.pointToCircleDistance({ x: 0, y: 0 }, circle) === 0,
    "Point inside circle"
  );

  // --- Point-to-polygon distance & pointInPolygon ---
  const square = new Polygon2D([
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ]);
  const p5: Point = { x: 5, y: 5 };
  assert(
    engine.pointToPolygonDistance(p5, square) === 0,
    "Point inside polygon"
  );
  const p6: Point = { x: -5, y: 5 };
  assert(
    Math.abs(engine.pointToPolygonDistance(p6, square) - 5) < EPSILON,
    "Point outside polygon"
  );

  // --- Line-to-line distance ---
  const line2: LineSegment = { start: { x: 0, y: 5 }, end: { x: 10, y: 5 } };
  assert(engine.lineToLineDistance(line, line2) === 5, "Line-to-line distance");

  // --- Line-to-circle distance ---
  assert(
    engine.lineToCircleDistance(line, circle) === 0,
    "Line intersects circle"
  );
  const line3: LineSegment = { start: { x: 6, y: 6 }, end: { x: 10, y: 6 } };
  assert(engine.lineToCircleDistance(line3, circle) > 0, "Line outside circle");

  // --- Line-to-polygon distance ---
  const line4: LineSegment = { start: { x: -5, y: 5 }, end: { x: -1, y: 5 } };
  assert(
    Math.abs(engine.lineToPolygonDistance(line4, square) - 1) < EPSILON,
    "Line-to-polygon distance"
  );

  // --- Circle-to-circle distance ---
  const circle2: Circle = { center: { x: 15, y: 0 }, radius: 5 };
  assert(
    engine.circleToCircleDistance(circle, circle2) === 5,
    "Circle-to-circle distance"
  );

  // --- Circle-to-polygon distance ---
  const triangle = new Polygon2D([
    { x: 20, y: 20 },
    { x: 30, y: 20 },
    { x: 25, y: 30 },
  ]);
  assert(
    engine.circleToPolygonDistance(circle, square) === 0,
    "Circle intersects square"
  );
  const circle3: Circle = { center: { x: -10, y: -10 }, radius: 2 };
  assert(
    engine.circleToPolygonDistance(circle3, square) > 0,
    "Circle outside square"
  );

  // --- Polygon-to-polygon distance ---
  const square2 = new Polygon2D([
    { x: 20, y: 20 },
    { x: 30, y: 20 },
    { x: 30, y: 30 },
    { x: 20, y: 30 },
  ]);
  assert(
    Math.abs(
      engine.polygonToPolygonDistance(square, square2) - 14.142135623730951
    ) < EPSILON,
    "Polygon-to-polygon distance"
  );

  // --- Intersection tests ---
  assert(engine.intersects(p1, p1), "Point equals point intersection");
  assert(engine.intersects(p1, line), "Point on line intersection");
  assert(
    !engine.intersects({ x: 5, y: 5 }, line),
    "Point not on line intersection"
  );
  assert(engine.intersects(circle, p1), "Circle contains point");
  assert(engine.intersects(square, p5), "Polygon contains point");
  assert(engine.intersects(line, line), "Line intersects itself");

  // --- Contains tests ---
  assert(engine.contains(circle, p1), "Circle contains point");
  assert(
    !engine.contains(circle, p4),
    "Circle does not contain point on boundary"
  );
  assert(engine.contains(square, p5), "Square contains point");
  assert(engine.contains(square, line), "Square contains line");
  assert(!engine.contains(square, circle), "Square does not contain circle");

  // --- Area and Perimeter ---
  assert(Math.abs(engine.area(circle) - Math.PI * 25) < EPSILON, "Circle area");
  assert(
    Math.abs(engine.perimeter(circle) - 2 * Math.PI * 5) < EPSILON,
    "Circle perimeter"
  );
  assert(Math.abs(engine.area(square) - 100) < EPSILON, "Square area");
  assert(Math.abs(engine.perimeter(square) - 40) < EPSILON, "Square perimeter");
  assert(Math.abs(engine.perimeter(line) - 10) < EPSILON, "Line perimeter");

  console.log("All tests passed.");
}

runTests();
