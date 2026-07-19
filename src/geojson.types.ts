import type {
  Feature,
  FeatureCollection,
  GeoJSON,
  GeoJsonProperties,
  LineString,
  MultiPoint,
  Point,
  Polygon,
  Position,
} from "geojson";

// Branded types for validated GeoJSON
export interface Validated<T> {
  __brand: "validated";
  value: T;
}

export type ValidatedGeoJSON = Validated<GeoJSON>;
export type ValidatedFeature = Validated<Feature>;
export type ValidatedFeatureCollection = Validated<FeatureCollection>;

// More specific error types
export class GeoJSONError extends Error {
  constructor(message: string, public code: string, public path?: string) {
    super(message);
    this.name = "GeoJSONError";
  }
}

export class ValidationError extends GeoJSONError {
  constructor(message: string, path?: string) {
    super(message, "VALIDATION_ERROR", path);
    this.name = "ValidationError";
  }
}

export class ConversionError extends GeoJSONError {
  constructor(message: string, path?: string) {
    super(message, "CONVERSION_ERROR", path);
    this.name = "ConversionError";
  }
}

// Type guards
export function isGeoJSON(obj: unknown): obj is GeoJSON {
  if (
    typeof obj !== "object" ||
    obj === null ||
    !("type" in obj) ||
    typeof obj.type !== "string"
  ) {
    return false;
  }

  switch (obj.type) {
    case "Point":
      return isGeoJSONPoint(obj);
    case "MultiPoint":
      return isGeoJSONMultiPoint(obj);
    case "LineString":
      return isGeoJSONLineString(obj);
    case "Polygon":
      return isGeoJSONPolygon(obj);
    case "MultiLineString":
      return (
        "coordinates" in obj &&
        Array.isArray(obj.coordinates) &&
        obj.coordinates.every(
          (line: unknown) =>
            Array.isArray(line) &&
            line.every((position: unknown) => isGeoJSONPosition(position))
        ) &&
        (!("bbox" in obj) ||
          (Array.isArray(obj.bbox) &&
            obj.bbox.every(
              (coordinate: unknown) => typeof coordinate === "number"
            )))
      );
    case "MultiPolygon":
      return (
        "coordinates" in obj &&
        Array.isArray(obj.coordinates) &&
        obj.coordinates.every(
          (polygon: unknown) =>
            Array.isArray(polygon) &&
            polygon.every(
              (ring: unknown) =>
                Array.isArray(ring) &&
                ring.every((position: unknown) =>
                  isGeoJSONPosition(position)
                )
            )
        ) &&
        (!("bbox" in obj) ||
          (Array.isArray(obj.bbox) &&
            obj.bbox.every(
              (coordinate: unknown) => typeof coordinate === "number"
            )))
      );
    case "GeometryCollection":
      return (
        "geometries" in obj &&
        Array.isArray(obj.geometries) &&
        obj.geometries.every(
          (geometry: unknown) =>
            isGeoJSON(geometry) &&
            geometry.type !== "Feature" &&
            geometry.type !== "FeatureCollection"
        ) &&
        (!("bbox" in obj) ||
          (Array.isArray(obj.bbox) &&
            obj.bbox.every(
              (coordinate: unknown) => typeof coordinate === "number"
            )))
      );
    case "Feature":
      return isFeature(obj);
    case "FeatureCollection":
      return isFeatureCollection(obj);
    default:
      return false;
  }
}

export function isFeature(obj: unknown): obj is Feature {
  if (
    typeof obj !== "object" ||
    obj === null ||
    !("type" in obj) ||
    obj.type !== "Feature" ||
    !("geometry" in obj) ||
    !("properties" in obj)
  ) {
    return false;
  }

  const geometry = obj.geometry;
  return (
    (geometry === null ||
      (isGeoJSON(geometry) &&
        geometry.type !== "Feature" &&
        geometry.type !== "FeatureCollection")) &&
    (obj.properties === null ||
      (typeof obj.properties === "object" &&
        !Array.isArray(obj.properties))) &&
    (!("id" in obj) ||
      typeof obj.id === "string" ||
      typeof obj.id === "number") &&
    (!("bbox" in obj) ||
      (Array.isArray(obj.bbox) &&
        obj.bbox.every(
          (coordinate: unknown) => typeof coordinate === "number"
        )))
  );
}

export function isFeatureCollection(obj: unknown): obj is FeatureCollection {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "type" in obj &&
    obj.type === "FeatureCollection" &&
    "features" in obj &&
    Array.isArray(obj.features) &&
    obj.features.every((feature: unknown) => isFeature(feature)) &&
    (!("bbox" in obj) ||
      (Array.isArray(obj.bbox) &&
        obj.bbox.every(
          (coordinate: unknown) => typeof coordinate === "number"
        )))
  );
}

export function isGeoJSONPoint(obj: unknown): obj is Point {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "type" in obj &&
    obj.type === "Point" &&
    "coordinates" in obj &&
    isGeoJSONPosition(obj.coordinates) &&
    (!("bbox" in obj) ||
      (Array.isArray(obj.bbox) &&
        obj.bbox.every(
          (coordinate: unknown) => typeof coordinate === "number"
        )))
  );
}

export function isGeoJSONMultiPoint(obj: unknown): obj is MultiPoint {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "type" in obj &&
    obj.type === "MultiPoint" &&
    "coordinates" in obj &&
    Array.isArray(obj.coordinates) &&
    obj.coordinates.every((position: unknown) =>
      isGeoJSONPosition(position)
    ) &&
    (!("bbox" in obj) ||
      (Array.isArray(obj.bbox) &&
        obj.bbox.every(
          (coordinate: unknown) => typeof coordinate === "number"
        )))
  );
}

export function isGeoJSONLineString(obj: unknown): obj is LineString {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "type" in obj &&
    obj.type === "LineString" &&
    "coordinates" in obj &&
    Array.isArray(obj.coordinates) &&
    obj.coordinates.every((position: unknown) =>
      isGeoJSONPosition(position)
    ) &&
    (!("bbox" in obj) ||
      (Array.isArray(obj.bbox) &&
        obj.bbox.every(
          (coordinate: unknown) => typeof coordinate === "number"
        )))
  );
}

export function isGeoJSONPolygon(obj: unknown): obj is Polygon {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "type" in obj &&
    obj.type === "Polygon" &&
    "coordinates" in obj &&
    Array.isArray(obj.coordinates) &&
    obj.coordinates.every(
      (ring: unknown) =>
        Array.isArray(ring) &&
        ring.every((position: unknown) => isGeoJSONPosition(position))
    ) &&
    (!("bbox" in obj) ||
      (Array.isArray(obj.bbox) &&
        obj.bbox.every(
          (coordinate: unknown) => typeof coordinate === "number"
        )))
  );
}

export function isGeoJSONPosition(obj: unknown): obj is Position {
  return (
    Array.isArray(obj) &&
    obj.length >= 2 &&
    obj.every(
      (coordinate: unknown) =>
        typeof coordinate === "number" && Number.isFinite(coordinate)
    )
  );
}

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: GeoJSONError[];
}

// Options interfaces
export interface GeoJSONOptions {
  readonly circleMode?: "polygon" | "point-radius";
  readonly circleSegments?: number;
  readonly transformCoordinates?: (pos: Position) => Position;
}


// Metadata interface
export interface GeoJSONMetadata<T = GeoJsonProperties> {
  properties: T;
  id?: string | number;
}
