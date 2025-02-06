import type {
  Feature,
  FeatureCollection,
  Point,
  MultiPoint,
  LineString,
  Polygon,
  GeoJsonProperties,
  Position,
  GeoJSON,
  Geometry
} from "geojson";

// Branded types for validated GeoJSON
export interface Validated<T> {
  __brand: 'validated';
  value: T;
}

export type ValidatedGeoJSON = Validated<GeoJSON>;
export type ValidatedFeature = Validated<Feature>;
export type ValidatedFeatureCollection = Validated<FeatureCollection>;

// More specific error types
export class GeoJSONError extends Error {
  constructor(
    message: string,
    public code: string,
    public path?: string
  ) {
    super(message);
    this.name = 'GeoJSONError';
  }
}

export class ValidationError extends GeoJSONError {
  constructor(message: string, path?: string) {
    super(message, 'VALIDATION_ERROR', path);
    this.name = 'ValidationError';
  }
}

export class ConversionError extends GeoJSONError {
  constructor(message: string, path?: string) {
    super(message, 'CONVERSION_ERROR', path);
    this.name = 'ConversionError';
  }
}

// Type guards
export function isGeoJSON(obj: any): obj is GeoJSON {
  return obj && typeof obj === 'object' && 'type' in obj;
}

export function isFeature(obj: any): obj is Feature {
  return isGeoJSON(obj) && obj.type === 'Feature';
}

export function isFeatureCollection(obj: any): obj is FeatureCollection {
  return isGeoJSON(obj) && obj.type === 'FeatureCollection';
}

export function isPoint(obj: any): obj is Point {
  return isGeoJSON(obj) && obj.type === 'Point';
}

export function isMultiPoint(obj: any): obj is MultiPoint {
  return isGeoJSON(obj) && obj.type === 'MultiPoint';
}

export function isLineString(obj: any): obj is LineString {
  return isGeoJSON(obj) && obj.type === 'LineString';
}

export function isPolygon(obj: any): obj is Polygon {
  return isGeoJSON(obj) && obj.type === 'Polygon';
}

export function isPosition(obj: any): obj is Position {
  return Array.isArray(obj) && 
         obj.length >= 2 && 
         obj.every(n => typeof n === 'number');
}

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: GeoJSONError[];
}

// Options interfaces
export interface GeoJSONOptions {
  circleMode?: "polygon" | "point-radius";
  circleSegments?: number;
  validate?: boolean;
  transformCoordinates?: (pos: Position) => Position;
}

export interface ValidationOptions {
  strict?: boolean;
  maxDecimalDigits?: number;
  requireValid?: boolean;
}

// Metadata interface
export interface GeoJSONMetadata<T = GeoJsonProperties> {
  properties: T;
  id?: string | number;
}
