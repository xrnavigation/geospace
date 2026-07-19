# Geospace

Geospace is a TypeScript library for two-dimensional geometry, spatial indexing, raycasting, affine transformations, and GeoJSON conversion. It ships ESM, CommonJS, and UMD builds with declarations for both ESM and CommonJS consumers.

## Installation

```bash
npm install @xrnavigation/geospace
```

ESM and TypeScript:

```typescript
import {
  Circle2D,
  GeometryEngine,
  Point2D,
  euclideanDistance,
} from "@xrnavigation/geospace";
```

CommonJS:

```javascript
const { Point2D, Polygon2D } = require("@xrnavigation/geospace");
```

## Quick start

```typescript
import {
  Circle2D,
  GeometryEngine,
  Point2D,
  Polygon2D,
  euclideanDistance,
} from "@xrnavigation/geospace";

const engine = new GeometryEngine(euclideanDistance);
const point = new Point2D(15, 5);
const circle = new Circle2D({ x: 3, y: 4 }, 5);
const polygon = new Polygon2D([
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
]);

console.log(engine.pointToCircleDistance(point, circle));
console.log(engine.pointToPolygonDistance(point, polygon));
console.log(engine.intersects(circle, polygon));
```

`GeometryEngine` provides distances for every supported pair of points, line segments, circles, and polygons. It also provides intersection, containment, area, perimeter, and raycasting operations.

## Geometry types

Geospace exports structural interfaces and concrete bounded classes:

| Interface | Concrete class | Description |
| --- | --- | --- |
| `Point` | `Point2D` | An `{ x, y }` coordinate |
| `LineSegment` | `LineSegment2D` | A segment with `start` and `end` points |
| `Circle` | `Circle2D` | A positive radius around a center point |
| `Polygon` | `Polygon2D` | An exterior ring with optional interior rings |
| `MultiPoint` | `MultiPoint2D` | A non-empty collection of points |

Concrete classes implement `getBoundingBox()`. Operations such as `getBBox`, `intersects`, and the distance methods also accept matching structural objects, so callers do not have to wrap every value in a class.

Polygon rings contain each vertex once; do not repeat the first vertex at the end:

```typescript
import { Polygon2D } from "@xrnavigation/geospace";

const polygonWithHole = new Polygon2D(
  [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ],
  [[
    { x: 4, y: 4 },
    { x: 6, y: 4 },
    { x: 6, y: 6 },
    { x: 4, y: 6 },
  ]],
);
```

## Affine transformations

`AffineTransform` accumulates operations on the same transform and applies the result to a new geometry value:

```typescript
import { AffineTransform, Point2D } from "@xrnavigation/geospace";

const transform = new AffineTransform()
  .translate({ x: 10, y: 0 })
  .rotate(Math.PI / 4)
  .scale(2);

const transformed = transform.apply(new Point2D(1, 1));
```

Rotation and scaling default to the origin and accept an optional center point. Circles support uniform scaling only.

## Spatial indexing

`RTree<T>` indexes `SpatialItem` values and supports insertion, removal, bounding-box search, nearest-neighbor search, bulk loading, and clearing:

```typescript
import {
  Point2D,
  RTree,
  type SpatialItem,
} from "@xrnavigation/geospace";

const geometry = new Point2D(5, 5);
const item: SpatialItem = {
  id: "point-1",
  geometry,
  metadata: { category: "example" },
  getBoundingBox: () => geometry.getBoundingBox(),
};

const index = new RTree<SpatialItem>();
index.insert(item);

const matches = index.search({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
const nearest = index.nearest({ x: 0, y: 0 }, 1);
```

Use `bulkLoad(items)` when constructing an index from an existing collection. `SpatialItem.metadata` accepts `Record<string, unknown> | null`.

## Raycasting

Use the direct intersection functions when testing one shape, or `GeometryEngine.raycastAll` to select the closest hit:

```typescript
import {
  Circle2D,
  GeometryEngine,
  LineSegment2D,
  Point2D,
  raySegmentIntersection,
  euclideanDistance,
  type Ray,
} from "@xrnavigation/geospace";

const ray: Ray = {
  origin: { x: 0, y: 0 },
  direction: { x: 1, y: 0 },
};
const segment = new LineSegment2D({ x: 2, y: -1 }, { x: 2, y: 1 });

console.log(raySegmentIntersection(ray, segment));

const engine = new GeometryEngine(euclideanDistance);
const hit = engine.raycastAll(
  new Point2D(0, 0),
  { x: 1, y: 0 },
  [segment, new Circle2D({ x: 5, y: 0 }, 1)],
);
console.log(hit);
```

The direct exports are `raySegmentIntersection`, `rayCircleIntersection`, and `rayPolygonIntersection`. A miss returns `null`.

## GeoJSON

The fluent `GeoJSON` API converts supported geometry values to and from GeoJSON features. Conversion results contain the converted `value` and a `warnings` array.

```typescript
import { Circle2D, GeoJSON } from "@xrnavigation/geospace";

const circle = new Circle2D({ x: 5, y: 5 }, 2);
const encoded = GeoJSON.from(circle)
  .withCircleAsPolygon()
  .withCircleSegments(32)
  .build();

console.log(encoded.value);
console.log(encoded.warnings);

const decoded = GeoJSON.to(encoded.value);
console.log(decoded.value);
```

Circles default to 64-segment polygon output. Use `withCircleAsPointRadius()` for point-plus-radius encoding, or `withCoordinateTransformation()` to transform positions during conversion.

For untrusted input, use the exported guards before conversion:

```typescript
import { isFeature, isGeoJSON } from "@xrnavigation/geospace";

if (isGeoJSON(input)) {
  // input is now narrowed to a valid GeoJSON value
}

if (isFeature(input)) {
  // input is now narrowed to a GeoJSON Feature
}
```

Geospace also exports guards for feature collections, positions, points, multipoints, line strings, and polygons. Validation and conversion failures use `ValidationError` and `ConversionError`, both derived from `GeoJSONError`. Geometry constructors throw `Error` for invalid values such as non-positive circle radii or undersized polygon rings.

## Floating-point comparisons

Use the exported `EPSILON` constant when comparing computed values:

```typescript
import { EPSILON } from "@xrnavigation/geospace";

const approximatelyEqual = Math.abs(actual - expected) <= EPSILON;
```

## TypeScript configuration

The package exports separate declarations for ESM and CommonJS. A strict ESM project can use bundler resolution:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true
  }
}
```

Node projects can instead use matching `Node16` or `NodeNext` values for `module` and `moduleResolution`.

## Development

```bash
npm ci
npm test
npx tsc --noEmit
npm run build
npm run benchmark
```

`npm run build` writes ESM, CommonJS, and UMD bundles, source maps, and TypeScript declarations to `dist/`.

See the repository's [benchmark guide](https://github.com/xrnavigation/geospace/blob/master/benchmarks/README.md) for the fixed workloads, measurement rules, and machine-readable result command.
