import type { Position } from "geojson";
import { describe, expect, it } from "vitest";
import { GeoJSONConverter, GeoJSON } from "./geojsonConverter";
import {
  Circle2D,
  LineSegment2D,
  MultiPoint2D,
  Point2D,
  Polygon2D,
  RTree,
} from "./geometry";

import { isGeoJSONPoint, ValidationError } from "./geojson.types";

describe("GeoJSON", () => {
  it("converts a Point2D to GeoJSON and back", () => {
    const pt = new Point2D(1, 2);
    const conv = GeoJSON.from(pt).build();
    expect(isGeoJSONPoint(conv.value.geometry)).toBe(true);
    expect(conv.value.geometry.coordinates).toEqual([1, 2]);

    const reconv = GeoJSON.to(conv.value);
    expect(reconv.value.x).toBeCloseTo(1);
    expect(reconv.value.y).toBeCloseTo(2);
  });

  it("converts a LineSegment2D to GeoJSON and back", () => {
    const line = new LineSegment2D({ x: 0, y: 0 }, { x: 3, y: 4 });
    const conv = GeoJSON.from(line).build();
    expect(conv.value.geometry.type).toBe("LineString");
    expect(conv.value.geometry.coordinates[0]).toEqual([0, 0]);
    expect(conv.value.geometry.coordinates[1]).toEqual([3, 4]);

    const reconv = GeoJSON.to(conv.value);
    expect(reconv.value.start.x).toBeCloseTo(0);
    expect(reconv.value.start.y).toBeCloseTo(0);
    expect(reconv.value.end.x).toBeCloseTo(3);
    expect(reconv.value.end.y).toBeCloseTo(4);
  });

  it("converts a Circle2D to GeoJSON (polygon mode) and back", () => {
    const circle = new Circle2D({ x: 5, y: 5 }, 10);
    const conv = GeoJSON.from(circle).build({ circleMode: "polygon", circleSegments: 32 });
    expect(conv.value.geometry.type).toBe("Polygon");
    expect(conv.value.geometry.coordinates[0].length).toBe(33);

    const reconv = GeoJSON.to(conv.value);
    expect(reconv.value.exterior.length).toBeGreaterThanOrEqual(3);
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
    const conv = GeoJSON.from(polygon).build();
    expect(conv.value.geometry.type).toBe("Polygon");
    expect(conv.value.geometry.coordinates[0].length).toBe(5);
    expect(conv.value.geometry.coordinates[1].length).toBe(5);

    const reconv = GeoJSON.to(conv.value);
    expect(reconv.value.exterior.length).toBe(4);
    expect(reconv.value.holes?.[0].length).toBe(4);
  });

  it("supports custom coordinate transformation", () => {
    const pt = new Point2D(1, 1);
    const transform = (pos: Position): Position => [pos[0] * 10, pos[1] * 10];
    const conv = GeoJSON.from(pt).build({ transformCoordinates: transform });
    expect(conv.value.geometry.coordinates).toEqual([10, 10]);

    const reconv = GeoJSON.to(conv.value, { transformCoordinates: transform });
    expect(reconv.value.x).toBeCloseTo(10);
    expect(reconv.value.y).toBeCloseTo(10);
  });
});
describe("GeoJSON Fluent API Builder", () => {
  it("converts a Point2D using the fluent API", () => {
    const pt = new Point2D(1, 2);
    const result = GeoJSON.from(pt).build();
    expect(result.value.geometry.type).toBe("Point");
    expect(result.value.geometry.coordinates).toEqual([1, 2]);
  });
  
  it("converts a Circle2D using fluent API with point radius", () => {
    const circle = new Circle2D({ x: 5, y: 5 }, 10);
    const result = GeoJSON.from(circle).withCircleAsPointRadius().build();
    expect(result.value.geometry.type).toBe("Point");
    expect(result.value.properties?.radius).toBe(10);
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

    const geoTree = GeoJSON.enhanceRTree(tree);
    const exportResult = geoTree.toGeoJSON({ circleMode: "point-radius" });
    const fc = exportResult.value;

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
      GeoJSON.to({ type: "Feature", properties: {} } as any);
    }).toThrow(ValidationError);
  });

  it("throws error for unsupported GeoJSON geometry type", () => {
    const unsupportedFeature = {
      type: "Feature",
      geometry: { type: "MultiLineString", coordinates: [] },
      properties: {},
    };
    expect(() => {
      GeoJSON.to(unsupportedFeature as any);
    }).toThrow(ValidationError);
  });

  it("handles MultiPoint conversion", () => {
    const multiPoint = new MultiPoint2D([new Point2D(1, 1), new Point2D(2, 2)]);
    const result = GeoJSON.from(multiPoint).build();
    expect(result.value.geometry.type).toBe("MultiPoint");
    expect(result.value.geometry.coordinates).toEqual([
      [1, 1],
      [2, 2],
    ]);
  });
});
