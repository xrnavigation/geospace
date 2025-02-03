/**
 * @fileoverview Geospace - A comprehensive 2D geometry library
 * 
 * Features:
 * - Numerically stable geometric operations using epsilon-based comparisons
 * - Quadratic-split R-tree implementation with bulk-loading capability
 * - Priority-queue based nearest-neighbor search
 * - Memory-efficient cached bounding boxes
 * - Optimized polygon routines
 * 
 * @version 1.0.0
 * @internal
 */

/** 
 * Global epsilon for numerical stability in floating-point comparisons.
 * Used to handle rounding errors and near-zero comparisons.
 */
const EPSILON = 1e-10;

/**
 * Represents a point in 2D space.
 * All coordinates are immutable after creation.
 * 
 * @example
 * ```typescript
 * const point: Point = { x: 1, y: 2 };
 * ```
 */
export interface Point {
  /** X-coordinate in 2D space */
  readonly x: number;
  /** Y-coordinate in 2D space */
  readonly y: number;
}

/**
 * Represents a circle defined by a center point and radius.
 * All properties are immutable after creation.
 * 
 * @example
 * ```typescript
 * const circle: Circle = { 
 *   center: { x: 0, y: 0 }, 
 *   radius: 5 
 * };
 * ```
 */
export interface Circle {
  /** Center point of the circle */
  readonly center: Point;
  /** Radius of the circle (must be positive) */
  readonly radius: number;
}

/**
 * Represents a line segment defined by start and end points.
 * All properties are immutable after creation.
 * 
 * @example
 * ```typescript
 * const segment: LineSegment = {
 *   start: { x: 0, y: 0 },
 *   end: { x: 1, y: 1 }
 * };
 * ```
 */
export interface LineSegment {
  /** Starting point of the line segment */
  readonly start: Point;
  /** Ending point of the line segment */
  readonly end: Point;
}

/**
 * Represents a polygon defined by an ordered list of vertices.
 * The vertices should form a closed loop but should not repeat the first vertex.
 * All properties are immutable after creation.
 * 
 * @example
 * ```typescript
 * const square: Polygon = {
 *   vertices: [
 *     { x: 0, y: 0 },
 *     { x: 1, y: 0 },
 *     { x: 1, y: 1 },
 *     { x: 0, y: 1 }
 *   ]
 * };
 * ```
 */
export interface Polygon {
  /** Ordered list of polygon vertices */
  readonly vertices: readonly Point[];
  /** 
   * Gets the bounding box of the polygon.
   * @returns The axis-aligned bounding box containing the polygon
   */
  getBoundingBox(): BoundingBox;
}

/**
 * Represents an axis-aligned bounding box.
 * Used for broad-phase collision detection and spatial indexing.
 * All coordinates are immutable after creation.
 */
export interface BoundingBox {
  /** Minimum x-coordinate of the box */
  readonly minX: number;
  /** Minimum y-coordinate of the box */
  readonly minY: number;
  /** Maximum x-coordinate of the box */
  readonly maxX: number;
  /** Maximum y-coordinate of the box */
  readonly maxY: number;
}

/** Interface for anything that can be bounded by a box */
export interface Bounded {
  getBoundingBox(): BoundingBox;
}

/**
 * Interface for chainable geometric transformations.
 * Allows composing multiple transformations that can be applied to any geometry type.
 * All transformations are immutable and return a new Transform instance.
 * 
 * @example
 * ```typescript
 * const transform = new AffineTransform()
 *   .translate({ x: 10, y: 0 })
 *   .rotate(Math.PI / 4)
 *   .scale(2);
 * const transformed = transform.apply(geometry);
 * ```
 */
export interface Transform {
  /**
   * Translates (moves) geometry by the given vector.
   * @param vector The translation vector with x,y components
   * @returns A new Transform with this translation applied
   */
  translate(vector: Point): Transform;

  /**
   * Rotates geometry around a center point by the given angle.
   * Positive angles rotate counter-clockwise.
   * @param angleRadians The rotation angle in radians
   * @param center Optional center of rotation (defaults to origin)
   * @returns A new Transform with this rotation applied
   */
  rotate(angleRadians: number, center?: Point): Transform;

  /**
   * Scales geometry from a center point by the given factor.
   * @param factor The scale factor (must be > 0)
   * @param center Optional center of scaling (defaults to origin)
   * @returns A new Transform with this scaling applied
   */
  scale(factor: number, center?: Point): Transform;

  /**
   * Applies the accumulated transformations to a geometry object.
   * @param geometry The geometry to transform
   * @returns A new transformed geometry of the same type
   * @throws Error if the geometry type is not supported
   */
  apply<T extends Geometry>(geometry: T): T;
}

/** Core geometric operations */
export interface GeometryOperations {
  // Point distances
  pointToPointDistance(a: Point, b: Point): number;
  pointToLineDistance(p: Point, l: LineSegment): number;
  pointToCircleDistance(p: Point, c: Circle): number;
  pointToPolygonDistance(p: Point, poly: Polygon): number;
  
  // Line distances
  lineToLineDistance(a: LineSegment, b: LineSegment): number;
  lineToCircleDistance(l: LineSegment, c: Circle): number;
  lineToPolygonDistance(l: LineSegment, p: Polygon): number;
  
  // Circle distances
  circleToCircleDistance(a: Circle, b: Circle): number;
  circleToPolygonDistance(c: Circle, p: Polygon): number;
  
  // Polygon distances
  polygonToPolygonDistance(a: Polygon, b: Polygon): number;
  
  /** Test if geometries intersect */
  intersects(a: Geometry, b: Geometry): boolean;
  
  /** Test if first geometry fully contains second */
  contains(container: Circle | Polygon, contained: Point | LineSegment | Circle | Polygon): boolean;
  
  /** Calculate area of shape */
  area(shape: Circle | Polygon): number;
  /** Calculate perimeter of shape */
  perimeter(shape: Circle | Polygon | LineSegment): number;
}

/** Union type of all geometry types */
export type Geometry = Point | LineSegment | Circle | Polygon;

/** Spatial index interface for efficient spatial queries */
export interface SpatialIndex<T extends Bounded> {
  /** Add item to index */
  insert(item: T): void;
  /** Remove item from index */
  remove(item: T): boolean;
  /** Find items intersecting box */
  search(bbox: BoundingBox): T[];
  /** Find k nearest items to point */
  nearest(point: Point, k: number): T[];
  /** Remove all items */
  clear(): void;
  /** Bulk–load items into the index */
  bulkLoad(items: T[]): void;
}

/** New interface to support additional metadata */
export interface SpatialItem extends Bounded {
  id: string;
  geometry: Geometry & Bounded;
  metadata?: any;
  getBoundingBox(): BoundingBox;
}

// ==========================
// Concrete classes for geometry types
// ==========================

/**
 * Concrete implementation of a 2D point.
 * Immutable point with x,y coordinates that can be used in spatial operations.
 * 
 * @example
 * ```typescript
 * const point = new Point2D(3, 4);
 * const bbox = point.getBoundingBox(); // Point's bounding box is itself
 * ```
 */
export class Point2D implements Point, Bounded {
  constructor(public readonly x: number, public readonly y: number) {}
  
  /**
   * Gets the bounding box of the point (which is just the point itself).
   * @returns BoundingBox with minX=maxX=x and minY=maxY=y
   */
  getBoundingBox(): BoundingBox {
    return { minX: this.x, minY: this.y, maxX: this.x, maxY: this.y };
  }
}

/**
 * Concrete implementation of a 2D circle.
 * Immutable circle defined by center point and radius.
 * 
 * @example
 * ```typescript
 * const circle = new Circle2D({ x: 0, y: 0 }, 5);
 * const bbox = circle.getBoundingBox(); // Square box containing circle
 * ```
 */
export class Circle2D implements Circle, Bounded {
  constructor(public readonly center: Point, public readonly radius: number) {
    if (radius <= 0) {
      throw new Error("Circle radius must be positive");
    }
  }

  /**
   * Gets the bounding box of the circle.
   * @returns Square bounding box that fully contains the circle
   */
  getBoundingBox(): BoundingBox {
    return {
      minX: this.center.x - this.radius,
      minY: this.center.y - this.radius,
      maxX: this.center.x + this.radius,
      maxY: this.center.y + this.radius
    };
  }
}

/**
 * Concrete implementation of a 2D line segment.
 * Immutable line segment defined by start and end points.
 * 
 * @example
 * ```typescript
 * const line = new LineSegment2D(
 *   { x: 0, y: 0 },
 *   { x: 3, y: 4 }
 * );
 * const bbox = line.getBoundingBox(); // Box containing both endpoints
 * ```
 */
export class LineSegment2D implements LineSegment, Bounded {
  constructor(public readonly start: Point, public readonly end: Point) {}

  /**
   * Gets the bounding box of the line segment.
   * @returns Minimal axis-aligned box containing both endpoints
   */
  getBoundingBox(): BoundingBox {
    return {
      minX: Math.min(this.start.x, this.end.x),
      minY: Math.min(this.start.y, this.end.y),
      maxX: Math.max(this.start.x, this.end.x),
      maxY: Math.max(this.start.y, this.end.y)
    };
  }
}

/**
 * Concrete implementation of a 2D polygon.
 * Immutable polygon defined by an ordered list of vertices.
 * 
 * @example
 * ```typescript
 * const square = new Polygon2D([
 *   { x: 0, y: 0 },
 *   { x: 1, y: 0 },
 *   { x: 1, y: 1 },
 *   { x: 0, y: 1 }
 * ]);
 * ```
 */
export class Polygon2D implements Polygon, Bounded {
  /**
   * Creates a new polygon from vertices.
   * @param vertices Ordered list of vertices (at least 3)
   * @throws Error if fewer than 3 vertices provided
   */
  constructor(public readonly vertices: readonly Point[]) {
    if (vertices.length < 3) {
      throw new Error("A polygon must have at least 3 vertices");
    }
  }

  /**
   * Gets the bounding box of the polygon.
   * @returns Minimal axis-aligned box containing all vertices
   */
  getBoundingBox(): BoundingBox {
    return computePolygonBBox(this);
  }
}

// ==========================
// Affine transform implementation
// ==========================

/**
 * Implements a chainable affine transform using a 3x3 transformation matrix.
 * 
 * An affine transformation preserves:
 * - Collinearity (points on a line remain on a line)
 * - Parallelism (parallel lines remain parallel)
 * - Ratios of distances along a line
 * 
 * The transform is represented internally by a 3×3 matrix:
 * ```
 *    [ a  c  e ]
 *    [ b  d  f ]
 *    [ 0  0  1 ]
 * ```
 * where [a,b,c,d] handle rotation/scaling and [e,f] handle translation.
 * 
 * A point (x,y) is transformed to (x',y') by:
 * ```
 *    x' = a*x + c*y + e
 *    y' = b*x + d*y + f
 * ```
 * 
 * Common transformations:
 * - Translation: [1 0 tx] [0 1 ty] [0 0 1]
 * - Rotation: [cos θ  -sin θ  0] [sin θ   cos θ  0] [0 0 1]
 * - Scale: [sx 0 0] [0 sy 0] [0 0 1]
 * 
 * @example
 * ```typescript
 * const transform = new AffineTransform()
 *   .translate({ x: 10, y: 0 })  // Move right 10 units
 *   .rotate(Math.PI / 4)         // Rotate 45 degrees
 *   .scale(2);                   // Double the size
 * ```
 */
export class AffineTransform implements Transform {
  private m: number[];
  constructor(m?: number[]) {
    if (m && m.length === 6) {
      this.m = m.slice();
    } else {
      // identity transform
      this.m = [1, 0, 0, 1, 0, 0];
    }
  }
  translate(vector: Point): Transform {
    const tx = vector.x, ty = vector.y;
    const t = [1, 0, 0, 1, tx, ty];
    this.m = AffineTransform.multiply(this.m, t);
    return this;
  }
  rotate(angleRadians: number, center?: Point): Transform {
    let cx = 0, cy = 0;
    if (center) { cx = center.x; cy = center.y; }
    this.translate({ x: -cx, y: -cy });
    const cos = Math.cos(angleRadians);
    const sin = Math.sin(angleRadians);
    const r = [cos, sin, -sin, cos, 0, 0];
    this.m = AffineTransform.multiply(this.m, r);
    this.translate({ x: cx, y: cy });
    return this;
  }
  scale(factor: number, center?: Point): Transform {
    let cx = 0, cy = 0;
    if (center) { cx = center.x; cy = center.y; }
    this.translate({ x: -cx, y: -cy });
    const s = [factor, 0, 0, factor, 0, 0];
    this.m = AffineTransform.multiply(this.m, s);
    this.translate({ x: cx, y: cy });
    return this;
  }
  apply<T extends Geometry>(geometry: T): T {
    if (isPoint(geometry)) {
      return transformPoint(geometry, this.m) as T;
    } else if (isLineSegment(geometry)) {
      return new LineSegment2D(
        transformPoint(geometry.start, this.m),
        transformPoint(geometry.end, this.m)
      ) as unknown as T;
    } else if (isCircle(geometry)) {
      return new Circle2D(
        transformPoint(geometry.center, this.m),
        geometry.radius * Math.sqrt(Math.abs(this.m[0] * this.m[3] - this.m[1] * this.m[2]))
      ) as unknown as T;
    } else if (isPolygon(geometry)) {
      return new Polygon2D(
        geometry.vertices.map(v => transformPoint(v, this.m))
      ) as T;
    } else {
      throw new Error("Unsupported geometry type");
    }
  }
  private static multiply(m1: number[], m2: number[]): number[] {
    const a1 = m1[0], b1 = m1[1], c1 = m1[2], d1 = m1[3], e1 = m1[4], f1 = m1[5];
    const a2 = m2[0], b2 = m2[1], c2 = m2[2], d2 = m2[3], e2 = m2[4], f2 = m2[5];
    const a = a1 * a2 + c1 * b2;
    const b = b1 * a2 + d1 * b2;
    const c = a1 * c2 + c1 * d2;
    const d = b1 * c2 + d1 * d2;
    const e = a1 * e2 + c1 * f2 + e1;
    const f = b1 * e2 + d1 * f2 + f1;
    return [a, b, c, d, e, f];
  }
}

function transformPoint(p: Point, m: number[]): Point {
  return { x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] };
}

// ==========================
// Type guards for geometry types
// ==========================
function isPoint(geom: Geometry): geom is Point {
  return (geom as Point).x !== undefined &&
         (geom as Point).y !== undefined &&
         (geom as any).start === undefined &&
         (geom as any).center === undefined &&
         (geom as any).vertices === undefined;
}
function isLineSegment(geom: Geometry): geom is LineSegment {
  return (geom as any).start !== undefined && (geom as any).end !== undefined;
}
function isCircle(geom: Geometry): geom is Circle {
  return (geom as any).center !== undefined && (geom as any).radius !== undefined;
}
function isPolygon(geom: Geometry): geom is Polygon {
  return (geom as any).vertices !== undefined;
}

// ==========================
// GeometryEngine implementation
// ==========================
export class GeometryEngine implements GeometryOperations {
  constructor(
    /** Distance function for point-to-point distance */
    private distanceFunc: (a: Point, b: Point) => number,
    /** Optional spatial index for acceleration */
    private index?: SpatialIndex<Bounded>
  ) {}
  pointToPointDistance(a: Point, b: Point): number {
    return this.distanceFunc(a, b);
  }
  pointToLineDistance(p: Point, l: LineSegment): number {
    const A = l.start;
    const B = l.end;
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq < EPSILON) return this.distanceFunc(p, A);
    const t = ((p.x - A.x) * dx + (p.y - A.y) * dy) / lengthSq;
    if (t < 0) return this.distanceFunc(p, A);
    else if (t > 1) return this.distanceFunc(p, B);
    const proj: Point = { x: A.x + t * dx, y: A.y + t * dy };
    return this.distanceFunc(p, proj);
  }
  pointToCircleDistance(p: Point, c: Circle): number {
    const d = this.distanceFunc(p, c.center);
    return d <= c.radius + EPSILON ? 0 : d - c.radius;
  }
  pointToPolygonDistance(p: Point, poly: Polygon): number {
    if (pointInPolygon(p, poly)) return 0;
    let minDist = Infinity;
    const vertices = poly.vertices;
    for (let i = 0; i < vertices.length; i++) {
      const a = vertices[i];
      const b = vertices[(i + 1) % vertices.length];
      const dist = this.pointToLineDistance(p, { start: a, end: b });
      if (dist < minDist) minDist = dist;
    }
    return minDist;
  }
  lineToLineDistance(a: LineSegment, b: LineSegment): number {
    if (segmentsIntersect(a, b)) return 0;
    const d1 = this.pointToLineDistance(a.start, b);
    const d2 = this.pointToLineDistance(a.end, b);
    const d3 = this.pointToLineDistance(b.start, a);
    const d4 = this.pointToLineDistance(b.end, a);
    return Math.min(d1, d2, d3, d4);
  }
  lineToCircleDistance(l: LineSegment, c: Circle): number {
    if (this.intersects(l, c)) return 0;
    const d = this.pointToLineDistance(c.center, l);
    return d <= c.radius + EPSILON ? 0 : d - c.radius;
  }
  lineToPolygonDistance(l: LineSegment, poly: Polygon): number {
    if (this.intersects(l, poly)) return 0;
    let minDist = Infinity;
    const d1 = this.pointToPolygonDistance(l.start, poly);
    const d2 = this.pointToPolygonDistance(l.end, poly);
    minDist = Math.min(d1, d2);
    const vertices = poly.vertices;
    for (let i = 0; i < vertices.length; i++) {
      const edge: LineSegment = { start: vertices[i], end: vertices[(i + 1) % vertices.length] };
      const d = this.lineToLineDistance(l, edge);
      if (d < minDist) minDist = d;
    }
    return minDist;
  }
  circleToCircleDistance(a: Circle, b: Circle): number {
    const d = this.distanceFunc(a.center, b.center);
    const diff = d - (a.radius + b.radius);
    return diff <= EPSILON ? 0 : diff;
  }
  circleToPolygonDistance(c: Circle, poly: Polygon): number {
    if (this.intersects(c, poly)) return 0;
    let minDist = Infinity;
    const vertices = poly.vertices;
    for (let i = 0; i < vertices.length; i++) {
      const edge: LineSegment = { start: vertices[i], end: vertices[(i + 1) % vertices.length] };
      const d = this.pointToLineDistance(c.center, edge) - c.radius;
      if (d < minDist) minDist = d;
    }
    return minDist < EPSILON ? 0 : minDist;
  }
  polygonToPolygonDistance(a: Polygon, b: Polygon): number {
    if (this.intersects(a, b)) return 0;
    
    let minDist = Infinity;
    
    // Check all edge pairs
    for (let i = 0; i < a.vertices.length; i++) {
      const a1 = a.vertices[i];
      const a2 = a.vertices[(i + 1) % a.vertices.length];
      const edgeA: LineSegment = { start: a1, end: a2 };
      
      for (let j = 0; j < b.vertices.length; j++) {
        const b1 = b.vertices[j];
        const b2 = b.vertices[(j + 1) % b.vertices.length];
        const edgeB: LineSegment = { start: b1, end: b2 };
        
        const d = this.lineToLineDistance(edgeA, edgeB);
        minDist = Math.min(minDist, d);
      }
    }
    
    return minDist;
  }
  intersects(a: Geometry, b: Geometry): boolean {
    // Get bounding boxes, handling each geometry type appropriately
    let bboxA: BoundingBox;
    let bboxB: BoundingBox;

    if (isPoint(a)) {
      bboxA = { minX: a.x, minY: a.y, maxX: a.x, maxY: a.y };
    } else if (isLineSegment(a)) {
      bboxA = {
        minX: Math.min(a.start.x, a.end.x),
        minY: Math.min(a.start.y, a.end.y),
        maxX: Math.max(a.start.x, a.end.x),
        maxY: Math.max(a.start.y, a.end.y)
      };
    } else if (isCircle(a)) {
      bboxA = {
        minX: a.center.x - a.radius,
        minY: a.center.y - a.radius,
        maxX: a.center.x + a.radius,
        maxY: a.center.y + a.radius
      };
    } else if (isPolygon(a)) {
      bboxA = a.getBoundingBox();
    } else {
      throw new Error("Unknown geometry type");
    }

    if (isPoint(b)) {
      bboxB = { minX: b.x, minY: b.y, maxX: b.x, maxY: b.y };
    } else if (isLineSegment(b)) {
      bboxB = {
        minX: Math.min(b.start.x, b.end.x),
        minY: Math.min(b.start.y, b.end.y),
        maxX: Math.max(b.start.x, b.end.x),
        maxY: Math.max(b.start.y, b.end.y)
      };
    } else if (isCircle(b)) {
      bboxB = {
        minX: b.center.x - b.radius,
        minY: b.center.y - b.radius,
        maxX: b.center.x + b.radius,
        maxY: b.center.y + b.radius
      };
    } else if (isPolygon(b)) {
      bboxB = b.getBoundingBox();
    } else {
      throw new Error("Unknown geometry type");
    }

    // Quick reject using bounding boxes
    if (!bboxIntersects(bboxA, bboxB)) return false;

    // Handle all geometry type combinations
    if (isPoint(a)) {
      if (isPoint(b)) return this.distanceFunc(a, b) < EPSILON;
      if (isLineSegment(b)) return pointOnSegment(a, b);
      if (isCircle(b)) return this.distanceFunc(a, b.center) <= b.radius + EPSILON;
      if (isPolygon(b)) return pointInPolygon(a, b);
    }
    
    if (isLineSegment(a)) {
      if (isPoint(b)) return pointOnSegment(b, a);
      if (isLineSegment(b)) return segmentsIntersect(a, b);
      if (isCircle(b)) return this.pointToCircleDistance(nearestPointOnSegment(b.center, a), b) < EPSILON;
      if (isPolygon(b)) {
        if (pointInPolygon(a.start, b) || pointInPolygon(a.end, b)) return true;
        for (let i = 0; i < b.vertices.length; i++) {
          const edge: LineSegment = { 
            start: b.vertices[i], 
            end: b.vertices[(i + 1) % b.vertices.length] 
          };
          if (segmentsIntersect(a, edge)) return true;
        }
        return false;
      }
    }
    
    if (isCircle(a)) {
      if (isPoint(b)) return this.distanceFunc(b, a.center) <= a.radius + EPSILON;
      if (isLineSegment(b)) return this.pointToCircleDistance(nearestPointOnSegment(a.center, b), a) < EPSILON;
      if (isCircle(b)) return this.distanceFunc(a.center, b.center) <= (a.radius + b.radius) + EPSILON;
      if (isPolygon(b)) {
        if (pointInPolygon(a.center, b)) return true;
        for (let i = 0; i < b.vertices.length; i++) {
          const edge: LineSegment = { 
            start: b.vertices[i], 
            end: b.vertices[(i + 1) % b.vertices.length] 
          };
          if (this.pointToCircleDistance(nearestPointOnSegment(a.center, edge), a) < EPSILON) return true;
        }
        return false;
      }
    }
    
    if (isPolygon(a)) {
      if (isPoint(b)) return pointInPolygon(b, a);
      if (isLineSegment(b)) return this.intersects(b, a);
      if (isCircle(b)) return this.intersects(b, a);
      if (isPolygon(b)) {
        // Check if any vertex of either polygon is inside the other
        for (const v of a.vertices) {
          if (pointInPolygon(v, b)) return true;
        }
        for (const v of b.vertices) {
          if (pointInPolygon(v, a)) return true;
        }
        // Check if any edges intersect
        for (let i = 0; i < a.vertices.length; i++) {
          const edgeA: LineSegment = { 
            start: a.vertices[i], 
            end: a.vertices[(i + 1) % a.vertices.length] 
          };
          for (let j = 0; j < b.vertices.length; j++) {
            const edgeB: LineSegment = { 
              start: b.vertices[j], 
              end: b.vertices[(j + 1) % b.vertices.length] 
            };
            if (segmentsIntersect(edgeA, edgeB)) return true;
          }
        }
        return false;
      }
    }
    
    return false;
  }
  contains(container: Circle | Polygon, contained: Point | LineSegment | Circle | Polygon): boolean {
    if (isCircle(container)) {
      if (isPoint(contained)) {
        return this.distanceFunc(container.center, contained) <= container.radius - EPSILON;
      } else if (isLineSegment(contained)) {
        return this.contains(container, contained.start) && this.contains(container, contained.end);
      } else if (isCircle(contained)) {
        return this.distanceFunc(container.center, contained.center) + contained.radius <= container.radius - EPSILON;
      } else if (isPolygon(contained)) {
        return contained.vertices.every(v => this.contains(container, v));
      }
    } else if (isPolygon(container)) {
      if (isPoint(contained)) {
        return pointInPolygon(contained, container);
      } else if (isLineSegment(contained)) {
        if (!(pointInPolygon(contained.start, container) || onPolygonBoundary(contained.start, container)) ||
            !(pointInPolygon(contained.end, container) || onPolygonBoundary(contained.end, container))) return false;
        const vertices = container.vertices;
        for (let i = 0; i < vertices.length; i++) {
          const edge: LineSegment = { start: vertices[i], end: vertices[(i + 1) % vertices.length] };
          if (segmentsIntersect(contained, edge)) {
            if (
              !pointsEqual(contained.start, edge.start) && !pointsEqual(contained.start, edge.end) &&
              !pointsEqual(contained.end, edge.start) && !pointsEqual(contained.end, edge.end)
            ) {
              return false;
            }
          }
        }
        return true;
      } else if (isCircle(contained)) {
        const numSamples = 16;
        for (let i = 0; i < numSamples; i++) {
          const angle = (2 * Math.PI * i) / numSamples;
          const p: Point = { x: contained.center.x + contained.radius * Math.cos(angle),
                             y: contained.center.y + contained.radius * Math.sin(angle) };
          if (!pointInPolygon(p, container)) return false;
        }
        return true;
      } else if (isPolygon(contained)) {
        return contained.vertices.every(v => pointInPolygon(v, container));
      }
    }
    return false;
  }
  area(shape: Circle | Polygon): number {
    if (isCircle(shape)) {
      return Math.PI * shape.radius * shape.radius;
    } else if (isPolygon(shape)) {
      let sum = 0;
      const vertices = shape.vertices;
      for (let i = 0; i < vertices.length; i++) {
        const a = vertices[i];
        const b = vertices[(i + 1) % vertices.length];
        sum += a.x * b.y - b.x * a.y;
      }
      return Math.abs(sum) / 2;
    }
    throw new Error("Unsupported shape for area");
  }
  perimeter(shape: Circle | Polygon | LineSegment): number {
    if (isCircle(shape)) {
      return 2 * Math.PI * shape.radius;
    } else if (isPolygon(shape)) {
      let sum = 0;
      const vertices = shape.vertices;
      for (let i = 0; i < vertices.length; i++) {
        const a = vertices[i];
        const b = vertices[(i + 1) % vertices.length];
        sum += this.distanceFunc(a, b);
      }
      return sum;
    } else if (isLineSegment(shape)) {
      return this.distanceFunc(shape.start, shape.end);
    }
    throw new Error("Unsupported shape for perimeter");
  }

  /**
   * If a spatial index is provided, return all items in the index
   * whose bounding boxes intersect the given geometry.
   */
  query(geometry: Geometry): (Geometry & Bounded)[] {
    if (this.index) {
      let bbox: BoundingBox;
      if ("getBoundingBox" in (geometry as any)) {
        bbox = (geometry as Bounded).getBoundingBox();
      } else if (isPoint(geometry)) {
        bbox = { minX: geometry.x, minY: geometry.y, maxX: geometry.x, maxY: geometry.y };
      } else if (isLineSegment(geometry)) {
        bbox = {
          minX: Math.min(geometry.start.x, geometry.end.x),
          minY: Math.min(geometry.start.y, geometry.end.y),
          maxX: Math.max(geometry.start.x, geometry.end.x),
          maxY: Math.max(geometry.start.y, geometry.end.y)
        };
      } else if (isCircle(geometry)) {
        bbox = { minX: geometry.center.x - geometry.radius, minY: geometry.center.y - geometry.radius,
                 maxX: geometry.center.x + geometry.radius, maxY: geometry.center.y + geometry.radius };
      } else if (isPolygon(geometry)) {
        bbox = computePolygonBBox(geometry);
      } else {
        throw new Error("Unknown geometry type");
      }
      return this.index.search(bbox) as (Geometry & Bounded)[];
    }
    return [];
  }
}

// ==========================
// Helper functions for geometry operations
// ==========================

/**
 * Compute bounding box of a polygon from its vertices.
 */
function computePolygonBBox(poly: Polygon): BoundingBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const v of poly.vertices) {
    if (v.x < minX) minX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.x > maxX) maxX = v.x;
    if (v.y > maxY) maxY = v.y;
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Optimized point–in–polygon using a bounding box check first.
 */
function pointInPolygon(p: Point, poly: Polygon): boolean {
  // Quick bounding box check.
  const bbox = computePolygonBBox(poly);
  if (p.x < bbox.minX - EPSILON || p.x > bbox.maxX + EPSILON ||
      p.y < bbox.minY - EPSILON || p.y > bbox.maxY + EPSILON) {
    return false;
  }
  let inside = false;
  const vertices = poly.vertices;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x, yi = vertices[i].y;
    const xj = vertices[j].x, yj = vertices[j].y;
    const intersect = ((yi > p.y) !== (yj > p.y)) &&
      (p.x < ((xj - xi) * (p.y - yi)) / ((yj - yi) + EPSILON) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
function onPolygonBoundary(p: Point, poly: Polygon): boolean {
  const vertices = poly.vertices;
  for (let i = 0; i < vertices.length; i++) {
    const edge: LineSegment = { start: vertices[i], end: vertices[(i + 1) % vertices.length] };
    if (pointOnSegment(p, edge)) return true;
  }
  return false;
}

/**
 * Check if two segments intersect (using EPSILON for near–zero comparisons).
 */
function segmentsIntersect(a: LineSegment, b: LineSegment): boolean {
  const det = (a.end.x - a.start.x) * (b.end.y - b.start.y) -
              (a.end.y - a.start.y) * (b.end.x - b.start.x);
  if (Math.abs(det) < EPSILON) {
    return collinearOverlap(a, b);
  }
  const t = ((b.start.x - a.start.x) * (b.end.y - b.start.y) -
             (b.start.y - a.start.y) * (b.end.x - b.start.x)) / det;
  const u = ((b.start.x - a.start.x) * (a.end.y - a.start.y) -
             (b.start.y - a.start.y) * (a.end.x - a.start.x)) / det;
  return t >= -EPSILON && t <= 1 + EPSILON && u >= -EPSILON && u <= 1 + EPSILON;
}

/**
 * When segments are collinear, check if they overlap.
 */
function collinearOverlap(a: LineSegment, b: LineSegment): boolean {
  if (!collinear(a.start, a.end, b.start)) return false;
  const points = [a.start, a.end, b.start, b.end];
  points.sort((p1, p2) => p1.x - p2.x || p1.y - p2.y);
  const aMax = Math.max(a.start.x, a.end.x);
  const bMin = Math.min(b.start.x, b.end.x);
  return bMin <= aMax + EPSILON;
}

/**
 * Check if three points are collinear.
 */
function collinear(p: Point, q: Point, r: Point): boolean {
  const area = p.x * (q.y - r.y) + q.x * (r.y - p.y) + r.x * (p.y - q.y);
  return Math.abs(area) < EPSILON;
}

/**
 * Check if point p lies on the segment.
 */
function pointOnSegment(p: Point, seg: LineSegment): boolean {
  const d1 = distance(p, seg.start);
  const d2 = distance(p, seg.end);
  const dSeg = distance(seg.start, seg.end);
  return Math.abs(d1 + d2 - dSeg) < EPSILON;
}

/**
 * Check if two points are equal.
 */
function pointsEqual(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) < EPSILON && Math.abs(a.y - b.y) < EPSILON;
}

/**
 * Return the nearest point on the segment from point p.
 */
function nearestPointOnSegment(p: Point, seg: LineSegment): Point {
  const A = seg.start;
  const B = seg.end;
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq < EPSILON) return A;
  let t = ((p.x - A.x) * dx + (p.y - A.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return { x: A.x + t * dx, y: A.y + t * dy };
}

/**
 * Euclidean distance between two points.
 */
function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if two bounding boxes intersect.
 */
function bboxIntersects(a: BoundingBox, b: BoundingBox): boolean {
  return a.minX <= b.maxX + EPSILON && a.maxX >= b.minX - EPSILON &&
         a.minY <= b.maxY + EPSILON && a.maxY >= b.minY - EPSILON;
}

/**
 * Compute area of a bounding box.
 */
function bboxArea(bbox: BoundingBox): number {
  return Math.max(0, bbox.maxX - bbox.minX) * Math.max(0, bbox.maxY - bbox.minY);
}

/**
 * Compute the union of two bounding boxes.
 */
function unionBBox(a: BoundingBox, b: BoundingBox): BoundingBox {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY)
  };
}

/**
 * Compute the increase in area needed to include addition.
 */
function bboxEnlargement(bbox: BoundingBox, addition: BoundingBox): number {
  const union = unionBBox(bbox, addition);
  return bboxArea(union) - bboxArea(bbox);
}

// ==========================
// Priority Queue Implementation (Min–Heap)
// ==========================
class PriorityQueue<T> {
  private items: { priority: number; item: T }[] = [];
  push(item: T, priority: number): void {
    this.items.push({ item, priority });
    this.bubbleUp(this.items.length - 1);
  }
  pop(): T | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0].item;
    const end = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = end;
      this.sinkDown(0);
    }
    return top;
  }
  size(): number {
    return this.items.length;
  }
  private bubbleUp(n: number): void {
    const element = this.items[n];
    while (n > 0) {
      const parentN = Math.floor((n + 1) / 2) - 1;
      const parent = this.items[parentN];
      if (element.priority >= parent.priority) break;
      this.items[parentN] = element;
      this.items[n] = parent;
      n = parentN;
    }
  }
  private sinkDown(n: number): void {
    const length = this.items.length;
    const element = this.items[n];
    while (true) {
      let child2N = (n + 1) * 2;
      let child1N = child2N - 1;
      let swap: number | null = null;
      if (child1N < length) {
        if (this.items[child1N].priority < element.priority) {
          swap = child1N;
        }
      }
      if (child2N < length) {
        if ((swap === null && this.items[child2N].priority < element.priority) ||
            (swap !== null && this.items[child2N].priority < this.items[child1N].priority)) {
          swap = child2N;
        }
      }
      if (swap === null) break;
      this.items[n] = this.items[swap];
      this.items[swap] = element;
      n = swap;
    }
  }
}

// ==========================
// R-tree spatial index implementation with quadratic split, bulk-loading,
// cached bounding boxes, and a priority-queue based nearest-neighbor search.
// ==========================

/** Internal R-tree entry */
interface Entry<T extends Bounded> {
  bbox: BoundingBox;
  child?: Node<T>;
  item?: T;
}

/** Internal R-tree node with bbox caching */
class Node<T extends Bounded> {
  entries: Entry<T>[] = [];
  leaf: boolean;
  public parent: Node<T> | null;
  private _bbox: BoundingBox | null = null;
  constructor(leaf: boolean) {
    this.leaf = leaf;
    this.parent = null;
  }
  computeBBox(): BoundingBox {
    if (this.entries.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    let bbox = this.entries[0].bbox;
    for (let i = 1; i < this.entries.length; i++) {
      bbox = unionBBox(bbox, this.entries[i].bbox);
    }
    return bbox;
  }
  get bbox(): BoundingBox {
    if (this._bbox === null) {
      this._bbox = this.computeBBox();
    }
    return this._bbox;
  }
  invalidateBBox(): void {
    this._bbox = null;
    if (this.parent) {
      this.parent.invalidateBBox();
    }
  }
}

/** Helper: get center point of a bounding box */
function getBBoxCenter(bbox: BoundingBox): Point {
  return { x: (bbox.minX + bbox.maxX) / 2, y: (bbox.minY + bbox.maxY) / 2 };
}

/** Helper: compute the union of an array of entries’ bounding boxes */
function calcEntriesBBox<T extends Bounded>(entries: Entry<T>[]): BoundingBox {
  return entries.reduce((acc, entry) => unionBBox(acc, entry.bbox), entries[0].bbox);
}

/** R-tree spatial index implementation */
export class RTree<T extends SpatialItem> implements SpatialIndex<T> {
  private maxEntries: number;
  private minEntries: number;
  private root: Node<T>;
  constructor(maxEntries = 9) {
    this.maxEntries = maxEntries;
    this.minEntries = Math.max(2, Math.ceil(maxEntries * 0.4));
    this.root = new Node<T>(true);
  }
  insert(item: T): void {
    const bbox = (item as any).geometry?.getBoundingBox() || item.getBoundingBox();
    const entry: Entry<T> = { bbox, item };
    this._insert(entry, this.root);
  }
  private _insert(entry: Entry<T>, node: Node<T>): void {
    if (node.leaf) {
      node.entries.push(entry);
      node.invalidateBBox();
    } else {
      let bestChild: Entry<T> | null = null;
      let bestEnlargement = Infinity;
      for (const childEntry of node.entries) {
        const enlargement = bboxEnlargement(childEntry.bbox, entry.bbox);
        if (enlargement < bestEnlargement) {
          bestEnlargement = enlargement;
          bestChild = childEntry;
        } else if (Math.abs(enlargement - bestEnlargement) < EPSILON) {
          if (bboxArea(childEntry.bbox) < bboxArea(bestChild!.bbox)) {
            bestChild = childEntry;
          }
        }
      }
      if (bestChild && bestChild.child) {
        this._insert(entry, bestChild.child);
        bestChild.bbox = unionBBox(bestChild.bbox, entry.bbox);
      }
    }
    if (node.entries.length > this.maxEntries) {
      this.split(node);
    }
  }
  private split(node: Node<T>): void {
    // Use quadratic split.
    const [group1, group2] = this.quadraticSplit(node.entries);
    if (node.parent == null) {
      // Create new root.
      const newRoot = new Node<T>(false);
      const child1 = new Node<T>(node.leaf);
      child1.entries = group1;
      child1.parent = newRoot;
      child1.invalidateBBox();
      const child2 = new Node<T>(node.leaf);
      child2.entries = group2;
      child2.parent = newRoot;
      child2.invalidateBBox();
      newRoot.entries.push({ bbox: child1.bbox, child: child1 });
      newRoot.entries.push({ bbox: child2.bbox, child: child2 });
      newRoot.invalidateBBox();
      this.root = newRoot;
    } else {
      // Replace node's entries with group1 and add group2 as new sibling.
      node.entries = group1;
      node.invalidateBBox();
      const newNode = new Node<T>(node.leaf);
      newNode.entries = group2;
      newNode.parent = node.parent;
      newNode.invalidateBBox();
      node.parent.entries.push({ bbox: newNode.bbox, child: newNode });
      node.parent.invalidateBBox();
    }
  }
  private quadraticSplit(entries: Entry<T>[]): [Entry<T>[], Entry<T>[]] {
    let highestWaste = -Infinity;
    let seed1Index = 0, seed2Index = 0;
    for (let i = 0; i < entries.length - 1; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const union = unionBBox(entries[i].bbox, entries[j].bbox);
        const d = bboxArea(union) - bboxArea(entries[i].bbox) - bboxArea(entries[j].bbox);
        if (d > highestWaste) {
          highestWaste = d;
          seed1Index = i;
          seed2Index = j;
        }
      }
    }
    const group1: Entry<T>[] = [entries[seed1Index]];
    const group2: Entry<T>[] = [entries[seed2Index]];
    const remaining = entries.filter((_, i) => i !== seed1Index && i !== seed2Index);
    while (remaining.length) {
      if (group1.length + remaining.length === this.minEntries) {
        group1.push(...remaining);
        break;
      }
      if (group2.length + remaining.length === this.minEntries) {
        group2.push(...remaining);
        break;
      }
      let bestIndex = 0;
      let diff = -Infinity;
      let chosenGroup = 0;
      const bbox1 = calcEntriesBBox(group1);
      const bbox2 = calcEntriesBBox(group2);
      for (let i = 0; i < remaining.length; i++) {
        const e = remaining[i];
        const enlargement1 = bboxEnlargement(bbox1, e.bbox);
        const enlargement2 = bboxEnlargement(bbox2, e.bbox);
        const d = Math.abs(enlargement1 - enlargement2);
        if (d > diff) {
          diff = d;
          bestIndex = i;
          chosenGroup = enlargement1 < enlargement2 ? 1 : 2;
        }
      }
      const chosenEntry = remaining.splice(bestIndex, 1)[0];
      if (chosenGroup === 1) {
        group1.push(chosenEntry);
      } else {
        group2.push(chosenEntry);
      }
    }
    return [group1, group2];
  }
  remove(item: T): boolean {
    const path: { node: Node<T>, entry: Entry<T> }[] = [];
    const found = this.findItem(this.root, item, path);
    if (!found) return false;
    const leafNode = path[path.length - 1].node;
    const entryIndex = leafNode.entries.findIndex(e => e.item === item);
    if (entryIndex >= 0) {
      leafNode.entries.splice(entryIndex, 1);
      leafNode.invalidateBBox();
      this.condenseTree(leafNode);
      if (this.root.entries.length === 1 && !this.root.leaf) {
        this.root = this.root.entries[0].child!;
        this.root.parent = null;
      }
      return true;
    }
    return false;
  }
  private findItem(node: Node<T>, item: T, path: { node: Node<T>, entry: Entry<T> }[]): boolean {
    if (node.leaf) {
      for (const entry of node.entries) {
        if (entry.item === item) {
          path.push({ node, entry });
          return true;
        }
      }
      return false;
    } else {
      for (const entry of node.entries) {
        if (bboxIntersects(entry.bbox, item.getBoundingBox())) {
          if (entry.child && this.findItem(entry.child, item, path)) {
            path.push({ node, entry });
            return true;
          }
        }
      }
      return false;
    }
  }
  private condenseTree(node: Node<T>): void {
    let n: Node<T> | undefined = node;
    while (n) {
      if (n.entries.length < this.minEntries && n.parent) {
        const parent = n.parent as Node<T>;
        const index = parent.entries.findIndex((e: Entry<T>) => e.child === n);
        if (index >= 0) {
          parent.entries.splice(index, 1);
          for (const entry of n.entries) {
            if (n.leaf) {
              this.insert(entry.item!);
            } else if (entry.child) {
              this._reinsertSubtree(entry.child);
            }
          }
        }
        n = parent;
      } else {
        if (n.parent) {
          const parentEntry = n.parent.entries.find((e: Entry<T>) => e.child === n);
          if (parentEntry) {
            parentEntry.bbox = n.bbox;
          }
        }
        n = n.parent as Node<T>;
      }
    }
  }
  private _reinsertSubtree(node: Node<T>): void {
    if (node.leaf) {
      for (const entry of node.entries) {
        this.insert(entry.item!);
      }
    } else {
      for (const entry of node.entries) {
        if (entry.child) this._reinsertSubtree(entry.child);
      }
    }
  }
  search(bbox: BoundingBox): T[] {
    const result: T[] = [];
    this._search(this.root, bbox, result);
    return result;
  }
  private _search(node: Node<T>, bbox: BoundingBox, result: T[]): void {
    for (const entry of node.entries) {
      if (bboxIntersects(entry.bbox, bbox)) {
        if (node.leaf) {
          if (entry.item) result.push(entry.item);
        } else if (entry.child) {
          this._search(entry.child, bbox, result);
        }
      }
    }
  }
  /**
   * Nearest neighbor search using a best-first algorithm with a priority queue.
   */
  nearest(point: Point, k: number): T[] {
    const result: T[] = [];
    type PQEntry = { type: "node", node: Node<T>, priority: number } | { type: "item", item: T, bbox: BoundingBox, priority: number };
    const pq = new PriorityQueue<PQEntry>();

    // Push the root node.
    pq.push({ type: "node", node: this.root, priority: pointToBBoxDistance(point, this.root.bbox) }, pointToBBoxDistance(point, this.root.bbox));

    while (pq.size() && result.length < k) {
      const entry = pq.pop()!;
      if (entry.type === "node") {
        const node = entry.node;
        for (const childEntry of node.entries) {
          const d = pointToBBoxDistance(point, childEntry.bbox);
          if (node.leaf) {
            // For leaf nodes, push as item.
            if (childEntry.item) {
              pq.push({ type: "item", item: childEntry.item, bbox: childEntry.bbox, priority: d }, d);
            }
          } else if (childEntry.child) {
            pq.push({ type: "node", node: childEntry.child, priority: d }, d);
          }
        }
      } else {
        result.push(entry.item);
      }
    }
    return result;
  }
  clear(): void {
    this.root = new Node<T>(true);
  }
  /**
   * Bulk–load items into the R-tree using a simple Sort-Tile-Recursive (STR) algorithm.
   */
  bulkLoad(items: T[]): void {
    if (items.length === 0) {
      this.clear();
      return;
    }
    const M = this.maxEntries;
    let entries: Entry<T>[] = items.map(item => ({ bbox: (item as any).geometry?.getBoundingBox() || item.getBoundingBox(), item }));
    // Determine number of slices S = ceil(sqrt(n / M))
    const S = Math.ceil(Math.sqrt(entries.length / M));
    entries.sort((a, b) => a.bbox.minX - b.bbox.minX);
    const slices: Entry<T>[][] = [];
    const sliceSize = Math.ceil(entries.length / S);
    for (let i = 0; i < S; i++) {
      slices.push(entries.slice(i * sliceSize, (i + 1) * sliceSize));
    }
    const leafNodes: Node<T>[] = [];
    for (const slice of slices) {
      slice.sort((a, b) => a.bbox.minY - b.bbox.minY);
      const numGroups = Math.ceil(slice.length / M);
      for (let i = 0; i < numGroups; i++) {
        const groupEntries = slice.slice(i * M, (i + 1) * M);
        const node = new Node<T>(true);
        node.entries = groupEntries;
        node.invalidateBBox();
        leafNodes.push(node);
      }
    }
    // Recursively build the tree from the leaf nodes.
    let levelNodes: Node<T>[] = leafNodes;
    while (levelNodes.length > 1) {
      levelNodes.sort((a, b) => a.bbox.minX - b.bbox.minX);
      const S = Math.ceil(Math.sqrt(levelNodes.length / M));
      const sliceSize = Math.ceil(levelNodes.length / S);
      const newLevel: Node<T>[] = [];
      for (let i = 0; i < S; i++) {
        let sliceNodes = levelNodes.slice(i * sliceSize, (i + 1) * sliceSize);
        sliceNodes.sort((a, b) => a.bbox.minY - b.bbox.minY);
        const numGroups = Math.ceil(sliceNodes.length / M);
        for (let j = 0; j < numGroups; j++) {
          const group = sliceNodes.slice(j * M, (j + 1) * M);
          const parent = new Node<T>(false);
          parent.entries = group.map(child => {
            child.parent = parent;
            return { bbox: child.bbox, child: child };
          });
          parent.invalidateBBox();
          newLevel.push(parent);
        }
      }
      levelNodes = newLevel;
    }
    this.root = levelNodes[0];
    this.root.parent = null;
  }
}

/**
 * Compute minimum distance from a point to a bounding box.
 */
function pointToBBoxDistance(p: Point, bbox: BoundingBox): number {
  let dx = 0, dy = 0;
  if (p.x < bbox.minX) dx = bbox.minX - p.x;
  else if (p.x > bbox.maxX) dx = p.x - bbox.maxX;
  if (p.y < bbox.minY) dy = bbox.minY - p.y;
  else if (p.y > bbox.maxY) dy = p.y - bbox.maxY;
  return Math.sqrt(dx * dx + dy * dy);
}

// ==========================
// Test suite
// ==========================
function runTests() {
  function assert(condition: boolean, message: string) {
    if (!condition) {
      throw new Error("Assertion failed: " + message);
    }
  }
  console.log("Running tests...");

  // Use Euclidean distance for the engine.
  const engine = new GeometryEngine(distance);

  // --- Point-to-point distance ---
  const p1: Point = { x: 0, y: 0 };
  const p2: Point = { x: 3, y: 4 };
  assert(Math.abs(engine.pointToPointDistance(p1, p2) - 5) < EPSILON, "Point-to-point distance");

  // --- Point-to-line distance ---
  const line: LineSegment = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } };
  const p3: Point = { x: 5, y: 5 };
  assert(Math.abs(engine.pointToLineDistance(p3, line) - 5) < EPSILON, "Point-to-line distance");

  // --- Point-to-circle distance ---
  const circle: Circle = { center: { x: 0, y: 0 }, radius: 5 };
  const p4: Point = { x: 0, y: 10 };
  assert(Math.abs(engine.pointToCircleDistance(p4, circle) - 5) < EPSILON, "Point-to-circle distance");
  assert(engine.pointToCircleDistance({ x: 0, y: 0 }, circle) === 0, "Point inside circle");

  // --- Point-to-polygon distance & pointInPolygon ---
  const square = new Polygon2D([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }]);
  const p5: Point = { x: 5, y: 5 };
  assert(engine.pointToPolygonDistance(p5, square) === 0, "Point inside polygon");
  const p6: Point = { x: -5, y: 5 };
  assert(Math.abs(engine.pointToPolygonDistance(p6, square) - 5) < EPSILON, "Point outside polygon");

  // --- Line-to-line distance ---
  const line2: LineSegment = { start: { x: 0, y: 5 }, end: { x: 10, y: 5 } };
  assert(engine.lineToLineDistance(line, line2) === 5, "Line-to-line distance");

  // --- Line-to-circle distance ---
  assert(engine.lineToCircleDistance(line, circle) === 0, "Line intersects circle");
  const line3: LineSegment = { start: { x: 6, y: 6 }, end: { x: 10, y: 6 } };
  assert(engine.lineToCircleDistance(line3, circle) > 0, "Line outside circle");

  // --- Line-to-polygon distance ---
  const line4: LineSegment = { start: { x: -5, y: 5 }, end: { x: -1, y: 5 } };
  assert(Math.abs(engine.lineToPolygonDistance(line4, square) - 1) < EPSILON, "Line-to-polygon distance");

  // --- Circle-to-circle distance ---
  const circle2: Circle = { center: { x: 15, y: 0 }, radius: 5 };
  assert(engine.circleToCircleDistance(circle, circle2) === 5, "Circle-to-circle distance");

  // --- Circle-to-polygon distance ---
  const triangle = new Polygon2D([{ x: 20, y: 20 }, { x: 30, y: 20 }, { x: 25, y: 30 }]);
  assert(engine.circleToPolygonDistance(circle, square) === 0, "Circle intersects square");
  const circle3: Circle = { center: { x: -10, y: -10 }, radius: 2 };
  assert(engine.circleToPolygonDistance(circle3, square) > 0, "Circle outside square");

  // --- Polygon-to-polygon distance ---
  const square2 = new Polygon2D([{ x: 20, y: 20 }, { x: 30, y: 20 }, { x: 30, y: 30 }, { x: 20, y: 30 }]);
  assert(Math.abs(engine.polygonToPolygonDistance(square, square2) - 14.142135623730951) < EPSILON, "Polygon-to-polygon distance");

  // --- Intersection tests ---
  assert(engine.intersects(p1, p1), "Point equals point intersection");
  assert(engine.intersects(p1, line), "Point on line intersection");
  assert(!engine.intersects({ x: 5, y: 5 }, line), "Point not on line intersection");
  assert(engine.intersects(circle, p1), "Circle contains point");
  assert(engine.intersects(square, p5), "Polygon contains point");
  assert(engine.intersects(line, line), "Line intersects itself");

  // --- Contains tests ---
  assert(engine.contains(circle, p1), "Circle contains point");
  assert(!engine.contains(circle, p4), "Circle does not contain point on boundary");
  assert(engine.contains(square, p5), "Square contains point");
  assert(engine.contains(square, line), "Square contains line");
  assert(!engine.contains(square, circle), "Square does not contain circle");

  // --- Area and Perimeter ---
  assert(Math.abs(engine.area(circle) - (Math.PI * 25)) < EPSILON, "Circle area");
  assert(Math.abs(engine.perimeter(circle) - (2 * Math.PI * 5)) < EPSILON, "Circle perimeter");
  assert(Math.abs(engine.area(square) - 100) < EPSILON, "Square area");
  assert(Math.abs(engine.perimeter(square) - 40) < EPSILON, "Square perimeter");
  assert(Math.abs(engine.perimeter(line) - 10) < EPSILON, "Line perimeter");

  // --- Spatial index (R-tree) tests ---
  const rtree = new RTree<SpatialItem>();
  const itemA: SpatialItem = { 
    id: "A", 
    geometry: new Point2D(1, 1), 
    metadata: {}, 
    getBoundingBox: function() { return this.geometry.getBoundingBox(); } 
  };
  const itemB: SpatialItem = { 
    id: "B", 
    geometry: new Point2D(2, 2), 
    metadata: {}, 
    getBoundingBox: function() { return this.geometry.getBoundingBox(); } 
  };
  const itemC: SpatialItem = { 
    id: "C", 
    geometry: new Point2D(3, 3), 
    metadata: {}, 
    getBoundingBox: function() { return this.geometry.getBoundingBox(); } 
  };
  rtree.insert(itemA);
  rtree.insert(itemB);
  rtree.insert(itemC);
  let searchResult = rtree.search({ minX: 0, minY: 0, maxX: 2.5, maxY: 2.5 });
  assert(searchResult.length === 2, "RTree search");
  let nearest = rtree.nearest({ x: 0, y: 0 }, 1);
  assert(nearest.length === 1 && nearest[0].id === "A", "RTree nearest");
  rtree.remove(itemB);
  searchResult = rtree.search({ minX: 0, minY: 0, maxX: 4, maxY: 4 });
  assert(searchResult.length === 2, "RTree remove");
  // Test bulk loading:
  const bulkPoints: Point2D[] = [];
  for (let i = 0; i < 100; i++) {
    bulkPoints.push(new Point2D(i, i));
  }
  rtree.bulkLoad(bulkPoints);
  const searchResultBulk = rtree.search({ minX: 0, minY: 0, maxX: 50, maxY: 50 });
  assert(searchResultBulk.length > 0, "RTree bulkLoad");
  rtree.clear();
  const searchResultClear = rtree.search({ minX: 0, minY: 0, maxX: 4, maxY: 4 });
  assert(searchResultClear.length === 0, "RTree clear");

  // --- GeometryEngine spatial query using index ---
  const rtreeForEngine = new RTree<SpatialItem>();
  rtreeForEngine.bulkLoad([itemA, itemB, itemC]);
  const engineWithIndex = new GeometryEngine(distance, rtreeForEngine);
  const queryResult = engineWithIndex.query({ x: 2, y: 2 });
  assert(queryResult.length > 0, "GeometryEngine query using spatial index");

  console.log("All tests passed.");
}

runTests();
