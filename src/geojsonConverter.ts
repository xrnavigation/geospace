import type {
  Feature,
  FeatureCollection,
  Point as GeoJSONPoint,
  LineString,
  Polygon as GeoJSONPolygon,
  Position,
  GeoJsonProperties,
} from "geojson";

import {
  Circle2D,
  isCircle,
  isLineSegment,
  isPoint,
  isPolygon,
  LineSegment2D,
  Point2D,
  Polygon2D,
  RTree,
} from "./geometry";

export type SupportedGeoJSON = GeoJSONPoint | LineString | GeoJSONPolygon;

export interface GeoJSONOptions {
  circleMode?: "polygon" | "point-radius";
  circleSegments?: number;
  validate?: boolean;
  transformCoordinates?: (pos: Position) => Position;
}

export interface ConversionResult<T> {
  geometry: T;
  warnings?: string[];
}

/**
 * GeoJSONConverter provides methods for converting between custom geometry objects 
 * (such as Point2D, LineSegment2D, Circle2D, and Polygon2D) and GeoJSON features.
 *
 * Methods:
 *  - toGeoJSON: Converts a geometry object to a GeoJSON Feature.
 *  - fromGeoJSON: Converts a GeoJSON Feature back to a geometry object.
 *  - toFeatureCollection: Aggregates items into a GeoJSON FeatureCollection.
 *  - enhanceRTree: Enhances an RTree instance with GeoJSON import/export capabilities.
 *
 * GeoJSONOptions may be supplied to control conversion behavior (e.g., circleMode and coordinate transformations).
 */
export class GeoJSONConverter {
  private static readonly DEFAULT_OPTIONS: GeoJSONOptions = {
    circleMode: "polygon",
    circleSegments: 64,
    validate: true,
  };

  /**
   * Converts a geometry object (e.g., Point2D, LineSegment2D, Circle2D, Polygon2D) to a GeoJSON Feature.
   * @param geometry The geometry object to convert.
   * @param options Optional conversion options.
   * @returns A ConversionResult containing the GeoJSON Feature and any warnings.
   */
  static toGeoJSON(
    geometry: Geometry,
    options?: GeoJSONOptions
  ): ConversionResult<Feature> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const warnings: string[] = [];
    let geoJsonGeometry: SupportedGeoJSON;

    try {
      if (isPoint(geometry)) {
        geoJsonGeometry = {
          type: "Point",
          coordinates: this.toPosition([geometry.x, geometry.y], opts),
        };
      } else if (isLineSegment(geometry)) {
        geoJsonGeometry = {
          type: "LineString",
          coordinates: [
            this.toPosition([geometry.start.x, geometry.start.y], opts),
            this.toPosition([geometry.end.x, geometry.end.y], opts),
          ],
        };
      } else if (isCircle(geometry)) {
        if (opts.circleMode === "polygon") {
          geoJsonGeometry = this.circleToPolygon(geometry, opts);
        } else {
          geoJsonGeometry = {
            type: "Point",
            coordinates: this.toPosition(
              [geometry.center.x, geometry.center.y],
              opts
            ),
          };
          warnings.push("Circle converted to point with radius property");
        }
      } else if (isPolygon(geometry)) {
        const exterior = this.closeRing(
          geometry.exterior.map((p) => this.toPosition([p.x, p.y], opts))
        );
        const holes =
          geometry.holes?.map((ring) =>
            this.closeRing(ring.map((p) => this.toPosition([p.x, p.y], opts)))
          ) ?? [];
        geoJsonGeometry = {
          type: "Polygon",
          coordinates: [exterior, ...holes],
        };
      } else {
        throw new Error("Unsupported geometry type");
      }
    } catch (err: any) {
      throw new Error(`GeoJSON conversion failed: ${err.message}`);
    }

    const feature: Feature = {
      type: "Feature",
      geometry: geoJsonGeometry,
      properties: {},
    };

    if (isCircle(geometry) && opts.circleMode === "point-radius") {
      feature.properties = {
        radius: geometry.radius,
        geometryType: "Circle",
      };
    }
    return { geometry: feature, warnings };
  }

  /**
   * Converts a GeoJSON Feature to a geometry object.
   * @param feature A GeoJSON Feature containing geometry data.
   * @param options Optional conversion options.
   * @returns A ConversionResult containing the converted geometry and any warnings.
   */
  static fromGeoJSON(
    feature: Feature,
    options?: GeoJSONOptions
  ): ConversionResult<Geometry> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const warnings: string[] = [];
    if (!feature.geometry) {
      throw new Error("Feature has no geometry");
    }

    if (
      feature.geometry.type === "Point" &&
      feature.properties?.geometryType === "Circle" &&
      typeof feature.properties?.radius === "number"
    ) {
      const [x, y] = this.fromPosition(feature.geometry.coordinates, opts);
      return {
        geometry: new Circle2D({ x, y }, feature.properties.radius),
        warnings,
      };
    }

    switch (feature.geometry.type) {
      case "Point": {
        const [x, y] = this.fromPosition(feature.geometry.coordinates, opts);
        return { geometry: new Point2D(x, y), warnings };
      }
      case "LineString": {
        if (feature.geometry.coordinates.length < 2) {
          throw new Error("LineString must have at least two coordinates");
        }
        const start = feature.geometry.coordinates[0];
        const end = feature.geometry.coordinates[1];
        const [x1, y1] = this.fromPosition(start, opts);
        const [x2, y2] = this.fromPosition(end, opts);
        return {
          geometry: new LineSegment2D({ x: x1, y: y1 }, { x: x2, y: y2 }),
          warnings,
        };
      }
      case "Polygon": {
        if (feature.geometry.coordinates.length < 1) {
          throw new Error("Polygon must contain at least one ring");
        }
        const exteriorRing = feature.geometry.coordinates[0];
        let exterior = exteriorRing.slice();
        if (
          exterior.length > 1 &&
          exterior[0][0] === exterior[exterior.length - 1][0] &&
          exterior[0][1] === exterior[exterior.length - 1][1]
        ) {
          exterior = exterior.slice(0, -1);
        }
        const exteriorPoints = exterior.map((pos) => {
          const [x, y] = this.fromPosition(pos, opts);
          return { x, y };
        });

        const holes = feature.geometry.coordinates.slice(1).map((ring) => {
          let r = ring.slice();
          if (
            r.length > 1 &&
            r[0][0] === r[r.length - 1][0] &&
            r[0][1] === r[r.length - 1][1]
          ) {
            r = r.slice(0, -1);
          }
          return r.map((pos) => {
            const [x, y] = this.fromPosition(pos, opts);
            return { x, y };
          });
        });

        return {
          geometry: new Polygon2D(exteriorPoints, holes),
          warnings,
        };
      }
      default:
        throw new Error(
          `Unsupported GeoJSON geometry type: ${feature.geometry.type}`
        );
    }
  }

  /**
   * Converts an array of items with id, geometry, metadata, and a bounding box method into a GeoJSON FeatureCollection.
   * @param items Array of items to convert.
   * @param options Optional conversion options.
   * @returns A ConversionResult containing the FeatureCollection and any warnings.
   */
  static toFeatureCollection(
    items: Array<{
      id: string;
      geometry: Geometry;
      metadata?: any;
      getBoundingBox: () => any;
    }>,
    options?: GeoJSONOptions
  ): ConversionResult<FeatureCollection> {
    const warnings: string[] = [];
    const features = items.map((item) => {
      const result = GeoJSONConverter.toGeoJSON(item.geometry, options);
      if (result.warnings) {
        warnings.push(...result.warnings.map((w) => `Item ${item.id}: ${w}`));
      }
      const feature = result.geometry;
      feature.id = item.id;
      feature.properties = {
        ...feature.properties,
        ...item.metadata,
      };
      return feature;
    });
    return {
      geometry: {
        type: "FeatureCollection",
        features,
      },
      warnings,
    };
  }

  /**
   * Enhances an RTree instance with methods to load GeoJSON data and export its contents as a GeoJSON FeatureCollection.
   * @param tree An instance of RTree containing spatial items.
   * @returns An object with 'loadGeoJSON' and 'toGeoJSON' methods.
   */
  static enhanceRTree<
    T extends {
      id: string;
      geometry: Geometry;
      metadata?: any;
      getBoundingBox: () => any;
    }
  >(tree: RTree<T>) {
    return {
      loadGeoJSON(
        collection: FeatureCollection,
        options?: GeoJSONOptions & {
          createId?: () => string;
          transformProperties?: (props: GeoJsonProperties) => any;
        }
      ): ConversionResult<void> {
        const warnings: string[] = [];
        const items: T[] = [];
        for (const feature of collection.features) {
          try {
            const result = GeoJSONConverter.fromGeoJSON(feature, options);
            if (result.warnings) {
              warnings.push(...result.warnings);
            }
            items.push({
              id:
                feature.id?.toString() ||
                (options?.createId ? options.createId() : crypto.randomUUID()),
              geometry: result.geometry,
              metadata: options?.transformProperties
                ? options.transformProperties(feature.properties)
                : feature.properties,
              getBoundingBox: () => result.geometry.getBoundingBox(),
            } as T);
          } catch (err: any) {
            warnings.push(`Skipped feature: ${err.message}`);
          }
        }
        tree.bulkLoad(items);
        return { geometry: undefined, warnings };
      },
      toGeoJSON(options?: GeoJSONOptions): ConversionResult<FeatureCollection> {
        const items = tree.search({
          minX: -Infinity,
          minY: -Infinity,
          maxX: Infinity,
          maxY: Infinity,
        });
        return GeoJSONConverter.toFeatureCollection(items, options);
      },
    };
  }

  private static circleToPolygon(
    circle: Circle,
    options: GeoJSONOptions
  ): GeoJSONPolygon {
    const { center, radius } = circle;
    const segments = options.circleSegments!;
    const coords: Position[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (2 * Math.PI * i) / segments;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      coords.push(this.toPosition([x, y], options));
    }
    return { type: "Polygon", coordinates: [coords] };
  }

  private static closeRing(coords: Position[]): Position[] {
    if (coords.length === 0) return coords;
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coords.push([...first]);
    }
    return coords;
  }

  private static toPosition(
    coord: [number, number],
    options: GeoJSONOptions
  ): Position {
    if (options.validate) {
      if (!isFinite(coord[0]) || !isFinite(coord[1])) {
        throw new Error("Invalid coordinates");
      }
    }
    return options.transformCoordinates
      ? options.transformCoordinates(coord)
      : coord;
  }

  private static fromPosition(
    pos: Position,
    options: GeoJSONOptions
  ): [number, number] {
    if (options.validate) {
      if (pos.length < 2 || !isFinite(pos[0]) || !isFinite(pos[1])) {
        throw new Error("Invalid position");
      }
    }
    return [pos[0], pos[1]];
  }
}
