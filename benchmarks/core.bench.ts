import { bench, describe } from "vitest";
import {
  AffineTransform,
  Circle2D,
  GeoJSON,
  GeometryEngine,
  LineSegment2D,
  Point2D,
  Polygon2D,
  RTree,
  euclideanDistance,
  type Geometry,
  type Point,
  type SpatialItem,
} from "@xrnavigation/geospace";

const BenchAffineTransform = AffineTransform;
const BenchCircle2D = Circle2D;
const BenchGeoJSON = GeoJSON;
const BenchGeometryEngine = GeometryEngine;
const BenchLineSegment2D = LineSegment2D;
const BenchPoint2D = Point2D;
const BenchPolygon2D = Polygon2D;
const BenchRTree = RTree;
const benchEuclideanDistance = euclideanDistance;

const options = {
  iterations: 20,
  time: 500,
  warmupIterations: 5,
  warmupTime: 100,
  throws: true,
} as const;

let objectSink: unknown;
let numberSink = 0;

function regularPolygon(
  vertexCount: number,
  radius: number,
  centerX = 0,
  centerY = 0,
): Point[] {
  return Array.from({ length: vertexCount }, (_, index) => {
    const angle = (index / vertexCount) * Math.PI * 2;
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  });
}

function pointGrid(width: number, height: number): SpatialItem[] {
  return Array.from({ length: width * height }, (_, index) => {
    const geometry = new BenchPoint2D(index % width, Math.floor(index / width));
    return {
      id: `point-${index}`,
      geometry,
      getBoundingBox: () => geometry.getBoundingBox(),
    };
  });
}

const engine = new BenchGeometryEngine(benchEuclideanDistance);
const polygon256 = new BenchPolygon2D(regularPolygon(256, 100));
const polygon128A = new BenchPolygon2D(regularPolygon(128, 100));
const polygon128B = new BenchPolygon2D(regularPolygon(128, 100, 220));
const outsidePoint = new BenchPoint2D(140, 25);
const transform = new BenchAffineTransform()
  .translate({ x: 50, y: -25 })
  .rotate(Math.PI / 3)
  .scale(1.5);

const rayGeometries: Geometry[] = Array.from(
  { length: 256 },
  (_, index) =>
    new BenchLineSegment2D(
      { x: index + 1, y: -10 },
      { x: index + 1, y: 10 },
    ),
);

const spatialItems = pointGrid(100, 100);
const indexedTree = new BenchRTree<SpatialItem>();
indexedTree.bulkLoad(spatialItems);
const searchBox = { minX: 40, minY: 40, maxX: 60, maxY: 60 };
const nearestPoint = { x: 49.5, y: 49.5 };

const circle = new BenchCircle2D({ x: 10, y: 20 }, 50);
const encodedPolygon = BenchGeoJSON.from(polygon256).build().value;

describe("geometry operations", () => {
  bench(
    "point-to-polygon distance, 256 vertices",
    () => {
      numberSink = engine.pointToPolygonDistance(outsidePoint, polygon256);
    },
    options,
  );

  bench(
    "polygon-to-polygon distance, 128 x 128 vertices",
    () => {
      numberSink = engine.polygonToPolygonDistance(polygon128A, polygon128B);
    },
    options,
  );

  bench(
    "affine transform, 256-vertex polygon",
    () => {
      objectSink = transform.apply(polygon256);
    },
    options,
  );
});

describe("raycasting", () => {
  bench(
    "raycastAll, 256 line segments",
    () => {
      objectSink = engine.raycastAll(
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        rayGeometries,
      );
    },
    options,
  );
});

describe("R-tree", () => {
  bench(
    "bulk load, 10,000 points",
    () => {
      const tree = new BenchRTree<SpatialItem>();
      tree.bulkLoad(spatialItems);
      objectSink = tree;
    },
    options,
  );

  bench(
    "search, 10,000-point tree with 441 matches",
    () => {
      numberSink = indexedTree.search(searchBox).length;
    },
    options,
  );

  bench(
    "nearest 10, 10,000-point tree",
    () => {
      numberSink = indexedTree.nearest(nearestPoint, 10).length;
    },
    options,
  );
});

describe("GeoJSON", () => {
  bench(
    "encode circle as 128-segment polygon",
    () => {
      objectSink = BenchGeoJSON.from(circle).build({ circleSegments: 128 });
    },
    options,
  );

  bench(
    "decode 256-vertex polygon feature",
    () => {
      objectSink = BenchGeoJSON.to(encodedPolygon);
    },
    options,
  );
});

void objectSink;
void numberSink;
