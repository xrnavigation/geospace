import { describe, expect, it } from "vitest";
import {
  isFeature,
  isFeatureCollection,
  isGeoJSON,
  isGeoJSONLineString,
  isGeoJSONMultiPoint,
  isGeoJSONPoint,
  isGeoJSONPolygon,
  isGeoJSONPosition,
} from "./geojson.types";

describe("GeoJSON type guards", () => {
  it("accepts supported geometry shapes", () => {
    expect(isGeoJSONPoint({ type: "Point", coordinates: [1, 2] })).toBe(true);
    expect(
      isGeoJSONMultiPoint({
        type: "MultiPoint",
        coordinates: [
          [1, 2],
          [3, 4],
        ],
      })
    ).toBe(true);
    expect(
      isGeoJSONLineString({
        type: "LineString",
        coordinates: [
          [1, 2],
          [3, 4],
        ],
      })
    ).toBe(true);
    expect(
      isGeoJSONPolygon({
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 0],
          ],
        ],
      })
    ).toBe(true);
  });

  it("accepts the remaining standard GeoJSON geometry shapes", () => {
    expect(
      isGeoJSON({
        type: "MultiLineString",
        coordinates: [
          [
            [0, 0],
            [1, 1],
          ],
        ],
      })
    ).toBe(true);
    expect(
      isGeoJSON({
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 0],
            ],
          ],
        ],
      })
    ).toBe(true);
    expect(
      isGeoJSON({
        type: "GeometryCollection",
        geometries: [{ type: "Point", coordinates: [1, 2] }],
      })
    ).toBe(true);
  });

  it("accepts valid features and feature collections", () => {
    const feature = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [1, 2] },
      properties: { name: "point" },
    };

    expect(isFeature(feature)).toBe(true);
    expect(
      isFeatureCollection({ type: "FeatureCollection", features: [feature] })
    ).toBe(true);
  });

  it("rejects discriminants without their required structure", () => {
    expect(isGeoJSON({ type: "Point" })).toBe(false);
    expect(isFeature({ type: "Feature" })).toBe(false);
    expect(
      isFeatureCollection({ type: "FeatureCollection", features: [null] })
    ).toBe(false);
    expect(
      isGeoJSONPolygon({ type: "Polygon", coordinates: [["invalid"]] })
    ).toBe(false);
  });

  it("accepts only finite numeric positions", () => {
    expect(isGeoJSONPosition([1, 2, 3])).toBe(true);
    expect(isGeoJSONPosition([1])).toBe(false);
    expect(isGeoJSONPosition([1, Number.NaN])).toBe(false);
    expect(isGeoJSONPosition([1, "2"])).toBe(false);
  });
});
