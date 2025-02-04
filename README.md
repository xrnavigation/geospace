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

The library uses epsilon-based comparisons to handle floating-point arithmetic:

```typescript
// Default epsilon: 1e-10
const EPSILON = 1e-10;

// Example of stable point-on-line test
const isOnLine = engine.pointToLineDistance(point, line) < EPSILON;

// Custom epsilon for specific use cases
const customEngine = new GeometryEngine(
  distance,
  undefined,
  1e-6 // Custom epsilon
);
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
import { Ray, raySegmentIntersection, rayCircleIntersection, rayPolygonIntersection } from '@xrnavigation/geospace';

const ray: Ray = { origin: { x: 0, y: 0 }, direction: { x: 1, y: 0 } };

const seg: LineSegment = { start: { x: 5, y: -1 }, end: { x: 5, y: 1 } };
const interSeg = raySegmentIntersection(ray, seg);
console.log("Ray-segment intersection:", interSeg);

const circle: Circle = { center: { x: 5, y: 0 }, radius: 1 };
const interCircle = rayCircleIntersection(ray, circle);
console.log("Ray-circle intersection:", interCircle);

const polygon = new Polygon2D([{ x: 3, y: 3 }, { x: 7, y: 3 }, { x: 7, y: 7 }, { x: 3, y: 7 }]);
const interPoly = rayPolygonIntersection(ray, polygon);
console.log("Ray-polygon intersection:", interPoly);
```

Alternatively, using the unified GeometryEngine methods:

```typescript
import { GeometryEngine, Point2D, Circle2D, Polygon2D, LineSegment, euclideanDistance } from '@xrnavigation/geospace';

const engine = new GeometryEngine(euclideanDistance);

const rayOrigin = new Point2D(0, 0);
const rayDirection = { x: 1, y: 0 };

const seg: LineSegment = { start: { x: 2, y: -1 }, end: { x: 2, y: 1 } };
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
```

## GeoJSON Conversion

The library also provides robust conversion methods to and from GeoJSON via the GeoJSONConverter class.
These methods allow you to convert geometry objects (such as Point2D, LineSegment2D, Circle2D, and Polygon2D)
into GeoJSON Features and FeatureCollections, and to reconstruct geometry objects from GeoJSON data.
You can also integrate GeoJSON conversion with spatial indices like the RTree for enhanced import/export capabilities.

Example usage:

```typescript
import { GeoJSONConverter, Point2D } from '@xrnavigation/geospace';

const point = new Point2D(1, 2);
const geoJSONFeature = GeoJSONConverter.toGeoJSON(point);
console.log("GeoJSON Feature:", geoJSONFeature);

const converted = GeoJSONConverter.fromGeoJSON(geoJSONFeature.geometry);
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

The library throws typed errors for various conditions:

```typescript
try {
  const polygon = new Polygon2D([{x:0,y:0}, {x:1,y:1}]); 
} catch (e) {
  if (e instanceof GeometryError) {
    console.error("Invalid geometry:", e.message);
  }
}

// Custom error types
export class GeometryError extends Error {}
export class InvalidPolygonError extends GeometryError {}
export class InvalidCircleError extends GeometryError {}
export class TransformError extends GeometryError {}
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

## Testing

Run the comprehensive test suite:

```bash
npm test
```

