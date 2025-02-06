import { describe, it, expect } from "vitest";
import { Point2D, LineSegment2D, Circle2D, Polygon2D, MultiPoint2D } from "./geometry";
import { GeoJSONConverter } from "./geojsonConverter";
import type { Feature, FeatureCollection, Position } from "geojson";
import { RTree } from "./geometry";

import { isPoint } from "./geojson.types";
  
describe("GeoJSONConverter", () => {
  it("converts a Point2D to GeoJSON and back", () => {
    const pt = new Point2D(1, 2);
    const conv = GeoJSONConverter.toGeoJSON(pt);
    expect(isGeoJSONPoint(conv.geometry.geometry)).toBe(true);
    expect(conv.geometry.geometry.coordinates).toEqual([1, 2]);

    const reconv = GeoJSONConverter.fromGeoJSON(conv.geometry);
    expect(reconv.geometry.x).toBeCloseTo(1);
    expect(reconv.geometry.y).toBeCloseTo(2);
  });

  it("converts a LineSegment2D to GeoJSON and back", () => {
    const line = new LineSegment2D({ x: 0, y: 0 }, { x: 3, y: 4 });
    const conv = GeoJSONConverter.toGeoJSON(line);
    expect(conv.geometry.geometry.type).toBe("LineString");
    expect(conv.geometry.geometry.coordinates[0]).toEqual([0, 0]);
    expect(conv.geometry.geometry.coordinates[1]).toEqual([3, 4]);

    const reconv = GeoJSONConverter.fromGeoJSON(conv.geometry);
    expect(reconv.geometry.start.x).toBeCloseTo(0);
    expect(reconv.geometry.start.y).toBeCloseTo(0);
    expect(reconv.geometry.end.x).toBeCloseTo(3);
    expect(reconv.geometry.end.y).toBeCloseTo(4);
  });

  it("converts a Circle2D to GeoJSON (polygon mode) and back", () => {
    const circle = new Circle2D({ x: 5, y: 5 }, 10);
    const conv = GeoJSONConverter.toGeoJSON(circle, {
      circleMode: "polygon",
      circleSegments: 32,
    });
    expect(conv.geometry.geometry.type).toBe("Polygon");
    expect(conv.geometry.geometry.coordinates[0].length).toBe(33);

    const reconv = GeoJSONConverter.fromGeoJSON(conv.geometry);
    expect(reconv.geometry.exterior.length).toBeGreaterThanOrEqual(3);
  });

  it("converts a Polygon2D with holes to GeoJSON and back", () => {
    const exterior = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    const hole = [
      { x: 3, y: 3 },
      { x: 7, y: 3 },
      { x: 7, y: 7 },
      { x: 3, y: 7 },
    ];
    const polygon = new Polygon2D(exterior, [hole]);
    const conv = GeoJSONConverter.toGeoJSON(polygon);
    expect(conv.geometry.geometry.type).toBe("Polygon");
    expect(conv.geometry.geometry.coordinates[0].length).toBe(5);
    expect(conv.geometry.geometry.coordinates[1].length).toBe(5);

    const reconv = GeoJSONConverter.fromGeoJSON(conv.geometry);
    expect(reconv.geometry.exterior.length).toBe(4);
    expect(reconv.geometry.holes?.[0].length).toBe(4);
  });

  it("supports custom coordinate transformation", () => {
    const pt = new Point2D(1, 1);
    const transform = (pos: Position): Position => [pos[0] * 10, pos[1] * 10];
    const conv = GeoJSONConverter.toGeoJSON(pt, {
      transformCoordinates: transform,
    });
    expect(conv.geometry.geometry.coordinates).toEqual([10, 10]);

    const reconv = GeoJSONConverter.fromGeoJSON(conv.geometry, {
      transformCoordinates: transform,
    });
    expect(reconv.geometry.x).toBeCloseTo(10);
    expect(reconv.geometry.y).toBeCloseTo(10);
  });
});

describe("GeoJSONConverter with RTree", () => {
  it("loads and exports GeoJSON FeatureCollection", () => {
    const items = [
      {
        id: "1",
        geometry: new Point2D(1, 1),
        metadata: { name: "A" },
        getBoundingBox: () => new Point2D(1, 1).getBoundingBox(),
      },
      {
        id: "2",
        geometry: new Circle2D({ x: 5, y: 5 }, 2),
        metadata: { name: "Circle" },
        getBoundingBox: () => new Circle2D({ x: 5, y: 5 }, 2).getBoundingBox(),
      },
    ];

    const tree = new RTree<(typeof items)[0]>();
    tree.bulkLoad(items);

    const geoTree = GeoJSONConverter.enhanceRTree(tree);
    const exportResult = geoTree.toGeoJSON({ circleMode: "point-radius" });
    const fc = exportResult.geometry;

    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features.length).toBe(2);
    const featureA = fc.features.find((f) => f.id === "1");
    expect(featureA?.geometry.type).toBe("Point");
    const featureC = fc.features.find((f) => f.id === "2");
    expect(featureC?.geometry.type).toBe("Point");
    expect(featureC?.properties?.radius).toBe(2);
  });
});

describe("GeoJSONConverter Edge Cases", () => {
  it("throws error when feature has no geometry", () => {
    expect(() => {
      GeoJSONConverter.fromGeoJSON({ type: "Feature", properties: {} } as any);
    }).toThrow(ValidationError);
  });

  it("throws error for unsupported GeoJSON geometry type", () => {
    const unsupportedFeature = {
      type: "Feature",
      geometry: { type: "MultiLineString", coordinates: [] },
      properties: {},
    };
    expect(() => {
      GeoJSONConverter.fromGeoJSON(unsupportedFeature as any);
    }).toThrow(ValidationError);
  });

  it("handles MultiPoint conversion", () => {
    const multiPoint = new MultiPoint2D([new Point2D(1, 1), new Point2D(2, 2)]);
    const result = GeoJSONConverter.toGeoJSON(multiPoint);
    expect(result.geometry.geometry.type).toBe("MultiPoint");
    expect(result.geometry.geometry.coordinates).toEqual([[1, 1], [2, 2]]);
  });
});
