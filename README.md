# Geospace

A high-performance 2D geometry library with spatial indexing capabilities. Features numerically stable operations, quadratic-split R-tree indexing, and optimized polygon routines.

## Features

- **Comprehensive Geometry Support**: Points, lines, circles, and polygons with full type safety
- **Spatial Indexing**: R-tree implementation with bulk-loading and nearest-neighbor search
- **Numerical Stability**: Epsilon-based comparisons for robust geometric operations
- **Memory Efficient**: Cached bounding boxes and optimized data structures
- **Type Safe**: Full TypeScript support with comprehensive interfaces

## Installation

```bash
npm install @internal/geospace
```

## Quick Start

```typescript
import { GeometryEngine, Point2D, Circle2D, distance } from '@internal/geospace';

// Create a geometry engine with Euclidean distance
const engine = new GeometryEngine(distance);

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
- **Polygon**: Polygon defined by ordered vertices

### Key Operations

- Distance calculations between any geometry types
- Intersection testing
- Containment checks
- Area and perimeter calculations
- Affine transformations (translate, rotate, scale)

### Spatial Index

The R-tree implementation provides efficient spatial queries:

```typescript
import { RTree, SpatialItem } from '@internal/geospace';

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
- Consider using the spatial index for large datasets
- Pre-compute and store complex polygon operations

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

## API Documentation

See inline TypeScript interfaces and comments for detailed API documentation:

- `GeometryOperations`: Core geometric operations interface
- `Transform`: Chainable geometric transformations
- `SpatialIndex`: Spatial indexing operations
- `Bounded`: Interface for anything that can be bounded by a box

## Testing

Run the comprehensive test suite:

```bash
npm test
```

## Internal Use Only

This code is for internal use and is not licensed for external distribution.
