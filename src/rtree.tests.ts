import { assert } from "vitest";
import { GeometryEngine, Point2D, RTree, SpatialItem } from "./geometry";

// --- Spatial index (R-tree) tests ---
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
