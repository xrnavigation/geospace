# Geospace

A high-performance 2D geometry library with spatial indexing capabilities. Features numerically stable operations, quadratic-split R-tree indexing, and optimized polygon routines.

![Build Status](https://img.shields.io/github/workflow/status/xrnavigation/geospace/CI)
![Coverage](https://img.shields.io/codecov/c/github/xrnavigation/geospace)
![Version](https://img.shields.io/npm/v/@xrnavigation/geospace)

## Features

- **Comprehensive Geometry Support**: Points, lines, circles, polygons, and rays with full type safety
- **Raycasting**: Intersection testing for rays with line segments, circles, and polygons
- **Spatial Indexing**: R-tree implementation with bulk-loading and nearest-neighbor search
- **Numerical Stability**: Epsilon-based comparisons for robust geometric operations
- **Memory Efficient**: Cached bounding boxes and optimized data structures
- **Type Safe**: Full TypeScript support with comprehensive interfaces
- **Enhanced Polygon Operations**: Support for polygons with holes, advanced interior routines, and cached bounding boxes for optimum performance

## Quick Start

```typescript
import { GeometryEngine, Point2D, Circle2D, euclideanDistance } from '@xrnavigation/geospace';

// Create a geometry engine with Euclidean distance
const engine = new GeometryEngine(euclideanDistance);

// Create some geometric objects
const point = new Point2D(0, 0);
const circle = new Circle2D({ x: 3, y: 4 }, 5);

// Calculate distance
const dist = engine.pointToCircleDistance(point, circle);
console.log(`Distance from point to circle: ${dist}`);
```

## Core Components

### Geometry Types

- **Point**: 2D point with x,y coordinates
- **LineSegment**: Line segment defined by start and end points
- **Circle**: Circle defined by center point and radius
- **Polygon**: Polygon defined by ordered vertices, supporting holes and enhanced with advanced routines including optimized interior edge detection and cached bounding box computation

### Key Operations

- Distance calculations between any geometry types
- Intersection testing
- Containment checks
- Area and perimeter calculations
- Affine transformations (translate, rotate, scale)

### Spatial Index

The R-tree implementation provides efficient spatial queries:

```typescript
import { RTree, SpatialItem } from '@xrnavigation/geospace';

// Create an R-tree
const rtree = new RTree<SpatialItem>();

// Add items
rtree.insert(item);

// Spatial search
const results = rtree.search(bbox);

// Find nearest neighbors
const nearest = rtree.nearest(point, k);
```

## Performance Considerations

- Use bulk loading for better R-tree performance when adding many items
- Cache bounding boxes when possible
- Consider using the spatial index for large datasets (>1000 items)
- Pre-compute and store complex polygon operations
- Use the appropriate epsilon value for your use case (default: 1e-10)
- Avoid creating temporary geometries in tight loops
- Consider using TypeScript's const assertions for immutable geometries
- Profile and optimize raycasting operations for specific use cases

### Memory Usage

The library uses several techniques to minimize memory usage:

```typescript
// Use shared vertices for polygons
const sharedVertices = [
  { x: 0, y: 0 }, { x: 1, y: 0 }, 
  { x: 1, y: 1 }, { x: 0, y: 1 }
];
const poly1 = new Polygon2D(sharedVertices);
const poly2 = new Polygon2D(sharedVertices);

// Take advantage of bounding box caching
const item: SpatialItem = {
  id: "cached",
  geometry: new Polygon2D(...),
  getBoundingBox() {
    return this._cachedBox ??= this.geometry.getBoundingBox();
  }
};
```

### Numerical Stability

The library uses the exported `EPSILON` constant for floating-point comparisons:

```typescript
import { EPSILON } from '@xrnavigation/geospace';

// Example of stable point-on-line test
const isOnLine = engine.pointToLineDistance(point, line) < EPSILON;
```

## Examples

### Distance Calculations

```typescript
// Point to polygon distance
const polygon = new Polygon2D([
  { x: 0, y: 0 }, 
  { x: 10, y: 0 }, 
  { x: 10, y: 10 }, 
  { x: 0, y: 10 }
]);
const point = new Point2D(15, 5);
const distance = engine.pointToPolygonDistance(point, polygon);
```

### Intersection Testing

```typescript
// Test if circle intersects polygon
const circle = new Circle2D({ x: 5, y: 5 }, 3);
const intersects = engine.intersects(circle, polygon);
```

### Transformations

```typescript
// Create and chain transformations
const transform = new AffineTransform()
  .translate({ x: 10, y: 0 })
  .rotate(Math.PI / 4)
  .scale(2);

// Apply to geometry
const transformed = transform.apply(polygon);
```

### Raycasting Intersection Testing

In addition to direct raycasting functions (raySegmentIntersection, rayCircleIntersection, and rayPolygonIntersection) that allow you to test individual geometries, the library now offers unified raycasting methods integrated into the GeometryEngine. These methods provide a convenient way to cast rays against a single geometry or multiple geometries.

For example, using direct functions:

```typescript
import { Circle2D, LineSegment2D, Polygon2D, Ray, raySegmentIntersection, rayCircleIntersection, rayPolygonIntersection } from '@xrnavigation/geospace';

const ray: Ray = { origin: { x: 0, y: 0 }, direction: { x: 1, y: 0 } };

const seg = new LineSegment2D({ x: 5, y: -1 }, { x: 5, y: 1 });
const interSeg = raySegmentIntersection(ray, seg);
console.log("Ray-segment intersection:", interSeg);

const circle = new Circle2D({ x: 5, y: 0 }, 1);
const interCircle = rayCircleIntersection(ray, circle);
console.log("Ray-circle intersection:", interCircle);

const polygon = new Polygon2D([{ x: 3, y: 3 }, { x: 7, y: 3 }, { x: 7, y: 7 }, { x: 3, y: 7 }]);
const interPoly = rayPolygonIntersection(ray, polygon);
console.log("Ray-polygon intersection:", interPoly);
```

Alternatively, using the unified GeometryEngine methods:

```typescript
import { GeometryEngine, Point2D, Circle2D, Polygon2D, LineSegment2D, euclideanDistance } from '@xrnavigation/geospace';

const engine = new GeometryEngine(euclideanDistance);

const rayOrigin = new Point2D(0, 0);
const rayDirection = { x: 1, y: 0 };

const seg = new LineSegment2D({ x: 2, y: -1 }, { x: 2, y: 1 });
const resultSeg = engine.raycast(rayOrigin, rayDirection, seg);
console.log("Unified raycast line segment:", resultSeg);

const circle = new Circle2D({ x: 5, y: 0 }, 1);
const resultCircle = engine.raycast(rayOrigin, rayDirection, circle);
console.log("Unified raycast circle:", resultCircle);

const polygon = new Polygon2D([{ x: 3, y: 3 }, { x: 7, y: 3 }, { x: 7, y: 7 }, { x: 3, y: 7 }]);
const resultPoly = engine.raycast(rayOrigin, rayDirection, polygon);
console.log("Unified raycast polygon:", resultPoly);

const resAll = engine.raycastAll(rayOrigin, rayDirection, [seg, circle, polygon]);
console.log("Unified raycast all (closest):", resAll);
```

## GeoJSON Conversion

The library provides conversion methods to and from GeoJSON through the `GeoJSON` fluent API.
These methods allow you to convert geometry objects (such as Point2D, LineSegment2D, Circle2D, and Polygon2D)
into GeoJSON Features and FeatureCollections, and to reconstruct geometry objects from GeoJSON data.
You can also integrate GeoJSON conversion with spatial indices like the RTree for enhanced import/export capabilities.

Example usage:

```typescript
import { GeoJSON, Point2D } from '@xrnavigation/geospace';

const point = new Point2D(1, 2);
const geoJSONFeature = GeoJSON.from(point).build().value;
console.log("GeoJSON Feature:", geoJSONFeature);

const converted = GeoJSON.to(geoJSONFeature).value;
console.log("Converted Geometry:", converted);
```

## TypeScript Configuration

The library requires TypeScript 4.8+ and these compiler options:

```typescript
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "lib": ["ES2020"],
    "moduleResolution": "node"
  }
}
```

## Error Handling

Geometry constructors throw standard `Error` instances for invalid inputs. GeoJSON validation failures use the exported `ValidationError` type.

```typescript
try {
  const polygon = new Polygon2D([{x:0,y:0}, {x:1,y:1}]); 
} catch (error) {
  if (error instanceof Error) {
    console.error("Invalid geometry:", error.message);
  }
}
```

## Troubleshooting

Common issues and solutions:

1. Numerical Precision
   - Use appropriate epsilon value
   - Consider input coordinate ranges
   - Watch for accumulated errors

2. Performance
   - Profile with Chrome DevTools
   - Use bulk operations
   - Optimize spatial index usage

3. Memory Leaks
   - Clear spatial indices
   - Avoid circular references
   - Use WeakMap for caches

## API Documentation

See inline TypeScript interfaces and comments for detailed API documentation:

- `GeometryOperations`: Core geometric operations interface
- `Transform`: Chainable geometric transformations
- `SpatialIndex`: Spatial indexing operations
- `Bounded`: Interface for anything that can be bounded by a box
- `GeometryEngine`: Main entry point for all operations
- `RTree`: Spatial indexing implementation
- `AffineTransform`: Transformation utilities

## Comprehensive Usage Examples

This section demonstrates how to use all major features of the library.

### Geometry Creation and Operations
```typescript
import { Point2D, Circle2D, LineSegment2D, Polygon2D, euclideanDistance, GeometryEngine } from '@xrnavigation/geospace';

const pt = new Point2D(1, 2);
const circle = new Circle2D({ x: 5, y: 5 }, 3);
const line = new LineSegment2D(new Point2D(0, 0), new Point2D(10, 0));
const polygon = new Polygon2D([
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
]);

const engine = new GeometryEngine(euclideanDistance);
console.log("Distance from point to circle:", engine.pointToCircleDistance(pt, circle));
console.log("Line to polygon distance:", engine.lineToPolygonDistance(line, polygon));
```

### Affine Transformations
```typescript
import { AffineTransform, Point2D } from '@xrnavigation/geospace';

const transform = new AffineTransform()
  .translate({ x: 2, y: 3 })
  .rotate(Math.PI / 4)
  .scale(1.5);

const original = new Point2D(1, 1);
const transformed = transform.apply(original);
console.log("Transformed Point:", transformed);
```

### Spatial Indexing with RTree
```typescript
import { RTree, Point2D } from '@xrnavigation/geospace';

// Create and populate an R-tree
const rtree = new RTree();
rtree.insert({ id: "pt1", geometry: new Point2D(1, 1), metadata: {}, getBoundingBox: () => new Point2D(1, 1).getBoundingBox() });
rtree.insert({ id: "pt2", geometry: new Point2D(5, 5), metadata: {}, getBoundingBox: () => new Point2D(5, 5).getBoundingBox() });

// Perform search and nearest neighbor query
console.log("Items in box:", rtree.search({ minX: 0, minY: 0, maxX: 3, maxY: 3 }));
console.log("Nearest to (0,0):", rtree.nearest(new Point2D(0, 0), 1));
```

### Raycasting
```typescript
import { Point2D, LineSegment2D, raySegmentIntersection, Ray } from '@xrnavigation/geospace';

const ray: Ray = {
  origin: new Point2D(0, 0),
  direction: new Point2D(1, 0)
};

const seg = new LineSegment2D(new Point2D(2, -1), new Point2D(2, 1));
const intersection = raySegmentIntersection(ray, seg);
console.log("Ray-Segment Intersection:", intersection);
```

### GeoJSON Conversion
```typescript
import { GeoJSON, Point2D } from '@xrnavigation/geospace';

const geoPoint = new Point2D(1, 2);
const feature = GeoJSON.from(geoPoint).build().value;
console.log("GeoJSON Feature:", feature);

const converted = GeoJSON.to(feature).value;
console.log("Converted Geometry:", converted);
```

## Testing

Run the comprehensive test suite:

```bash
npm test
```

