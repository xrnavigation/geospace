import { Circle, Geometry, LineSegment, Point, Polygon2D, Ray, rayCircleIntersection, rayPolygonIntersection, raySegmentIntersection } from "./geometry";

// --- Raycasting tests ---
{
  // Ray vs line segment: hit
  const ray1: Ray = { origin: { x: 0, y: 0 }, direction: { x: 1, y: 0 } };
  const seg1: LineSegment = { start: { x: 2, y: -1 }, end: { x: 2, y: 1 } };
  const inter1 = raySegmentIntersection(ray1, seg1);
  assert(
    inter1 !== null &&
      Math.abs(inter1.x - 2) < EPSILON &&
      Math.abs(inter1.y - 0) < EPSILON,
    "Ray-segment intersection (hit)"
  );

  // Ray vs line segment: miss
  const seg2: LineSegment = { start: { x: 0, y: 1 }, end: { x: 1, y: 1 } };
  const inter2 = raySegmentIntersection(ray1, seg2);
  assert(inter2 === null, "Ray-segment intersection (miss)");

  // Ray vs circle: hit
  const circle2: Circle = { center: { x: 5, y: 0 }, radius: 1 };
  const inter3 = rayCircleIntersection(ray1, circle2);
  assert(
    inter3 !== null && Math.abs(inter3.x - 4) < EPSILON,
    "Ray-circle intersection (hit)"
  );

  // Ray vs circle: miss
  const circle3: Circle = { center: { x: 0, y: 5 }, radius: 1 };
  const inter4 = rayCircleIntersection(ray1, circle3);
  assert(inter4 === null, "Ray-circle intersection (miss)");

  // Ray vs polygon: hit
  const square2 = new Polygon2D([
    { x: 3, y: 3 },
    { x: 7, y: 3 },
    { x: 7, y: 7 },
    { x: 3, y: 7 },
  ]);
  const ray2: Ray = { origin: { x: 0, y: 0 }, direction: { x: 1, y: 1 } };
  const inter5 = rayPolygonIntersection(ray2, square2);
  assert(
    inter5 !== null &&
      Math.abs(inter5.x - 3) < EPSILON &&
      Math.abs(inter5.y - 3) < EPSILON,
    "Ray-polygon intersection (hit)"
  );

  // Ray vs polygon: miss
  const square3 = new Polygon2D([
    { x: -7, y: -7 },
    { x: -3, y: -7 },
    { x: -3, y: -3 },
    { x: -7, y: -3 },
  ]);
  const inter6 = rayPolygonIntersection(ray2, square3);
  assert(inter6 === null, "Ray-polygon intersection (miss)");
}

// --- Unified raycasting tests using GeometryEngine methods ---
{
  const rayOrigin: Point = { x: 0, y: 0 };
  const rayDirection: Point = { x: 1, y: 0 };

  // Test raycast on line segment
  const seg: LineSegment = { start: { x: 2, y: -1 }, end: { x: 2, y: 1 } };
  const resultSeg = engine.raycast(rayOrigin, rayDirection, seg);
  assert(
    resultSeg !== null && Math.abs(resultSeg.point.x - 2) < EPSILON,
    "Unified raycast line segment"
  );

  // Test raycast on circle
  const circle: Circle = { center: { x: 5, y: 0 }, radius: 1 };
  const resultCircle = engine.raycast(rayOrigin, rayDirection, circle);
  assert(
    resultCircle !== null && Math.abs(resultCircle.point.x - 4) < EPSILON,
    "Unified raycast circle"
  );

  // Test raycast on polygon
  const poly = new Polygon2D([
    { x: 3, y: 3 },
    { x: 7, y: 3 },
    { x: 7, y: 7 },
    { x: 3, y: 7 },
  ]);
  const resultPoly = engine.raycast(rayOrigin, rayDirection, poly);
  assert(
    resultPoly !== null && Math.abs(resultPoly.point.x - 3) < EPSILON,
    "Unified raycast polygon"
  );

  // Test raycastAll on multiple geometries
  const geometries: Geometry[] = [seg, circle, poly];
  const resultAll = engine.raycastAll(rayOrigin, rayDirection, geometries);
  // Expect the closest intersection: line segment at x=2 should be closest to origin
  assert(
    resultAll !== null && Math.abs(resultAll.point.x - 2) < EPSILON,
    "Unified raycastAll"
  );
}
