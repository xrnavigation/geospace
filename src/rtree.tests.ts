import { describe, test, expect } from "vitest";
import {
  euclideanDistance,
  GeometryEngine,
  Point2D,
  RTree,
  SpatialItem,
} from "./geometry";

describe("RTree", () => {
  test("basic operations", () => {
    const rtree = new RTree<SpatialItem>();
    const itemA: SpatialItem = {
      id: "A",
      geometry: new Point2D(1, 1),
      metadata: {},
      getBoundingBox: function () {
        return this.geometry.getBoundingBox();
      },
    };
    const itemB: SpatialItem = {
      id: "B",
      geometry: new Point2D(2, 2),
      metadata: {},
      getBoundingBox: function () {
        return this.geometry.getBoundingBox();
      },
    };
    const itemC: SpatialItem = {
      id: "C",
      geometry: new Point2D(3, 3),
      metadata: {},
      getBoundingBox: function () {
        return this.geometry.getBoundingBox();
      },
    };
    rtree.insert(itemA);
    rtree.insert(itemB);
    rtree.insert(itemC);

    let searchResult = rtree.search({ minX: 0, minY: 0, maxX: 2.5, maxY: 2.5 });
    expect(searchResult).toHaveLength(2);

    let nearest = rtree.nearest({ x: 0, y: 0 }, 1);
    expect(nearest).toHaveLength(1);
    expect(nearest[0].id).toBe("A");

    rtree.remove(itemB);
    searchResult = rtree.search({ minX: 0, minY: 0, maxX: 4, maxY: 4 });
    expect(searchResult).toHaveLength(2);
  });

  test("bulk operations", () => {
    const rtree = new RTree<SpatialItem>();
    const bulkItems: SpatialItem[] = [];
    for (let i = 0; i < 100; i++) {
      const point = new Point2D(i, i);
      bulkItems.push({
        id: `point-${i}`,
        geometry: point,
        getBoundingBox: () => point.getBoundingBox()
      });
    }
    rtree.bulkLoad(bulkItems);

    const searchResultBulk = rtree.search({
      minX: 0,
      minY: 0,
      maxX: 50,
      maxY: 50,
    });
    expect(searchResultBulk.length).toBeGreaterThan(0);

    rtree.clear();
    const searchResultClear = rtree.search({
      minX: 0,
      minY: 0,
      maxX: 4,
      maxY: 4,
    });
    expect(searchResultClear).toHaveLength(0);
  });
});

describe("RTree Edge Cases", () => {
  test("search on empty tree returns empty array", () => {
    const rtree = new RTree();
    expect(rtree.search({ minX: 0, minY: 0, maxX: 10, maxY: 10 })).toHaveLength(0);
  });

  test("remove non-existent item returns false", () => {
    const rtree = new RTree();
    const dummyItem = {
      id: "dummy",
      geometry: new Point2D(5, 5),
      metadata: {},
      getBoundingBox: function () {
        return this.geometry.getBoundingBox();
      }
    };
    expect(rtree.remove(dummyItem)).toBe(false);
  });

  test("nearest on empty tree returns empty array", () => {
    const rtree = new RTree();
    expect(rtree.nearest({ x: 0, y: 0 }, 5)).toHaveLength(0);
  });

  test("inserting duplicate items", () => {
    const rtree = new RTree();
    const item = {
      id: "dup",
      geometry: new Point2D(1, 1),
      metadata: {},
      getBoundingBox: function () { return this.geometry.getBoundingBox(); }
    };
    rtree.insert(item);
    rtree.insert(item);
    const result = rtree.search({ minX: 0, minY: 0, maxX: 2, maxY: 2 });
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});

describe("GeometryEngine with spatial index", () => {
  test("spatial queries", () => {
    const rtreeForEngine = new RTree<SpatialItem>();
    const itemA: SpatialItem = {
      id: "A",
      geometry: new Point2D(1, 1),
      metadata: {},
      getBoundingBox: function () {
        return this.geometry.getBoundingBox();
      },
    };
    const itemB: SpatialItem = {
      id: "B",
      geometry: new Point2D(2, 2),
      metadata: {},
      getBoundingBox: function () {
        return this.geometry.getBoundingBox();
      },
    };
    const itemC: SpatialItem = {
      id: "C",
      geometry: new Point2D(3, 3),
      metadata: {},
      getBoundingBox: function () {
        return this.geometry.getBoundingBox();
      },
    };

    rtreeForEngine.bulkLoad([itemA, itemB, itemC]);
    const engineWithIndex = new GeometryEngine(
      euclideanDistance,
      rtreeForEngine
    );
    const queryResult = engineWithIndex.query({ x: 2, y: 2 });
    expect(queryResult.length).toBeGreaterThan(0);
  });
});
