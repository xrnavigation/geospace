import {
  GeometryEngine,
  Polygon2D,
  euclideanDistance,
  EPSILON,
} from "@xrnavigation/geospace";

const vertexCount = 128;
const radius = 100;
const warmupCount = 500;
const iterationCount = 5_000;
const expectedDistance = 20;
const expectedChecksum = 100_000;

function regularPolygon(centerX, centerY) {
  return Array.from({ length: vertexCount }, (_, index) => {
    const angle = (index / vertexCount) * Math.PI * 2;
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  });
}

const engine = new GeometryEngine(euclideanDistance);
const polygonA = new Polygon2D(regularPolygon(0, 0));
const polygonB = new Polygon2D(regularPolygon(220, 0));

const validatedDistance = engine.polygonToPolygonDistance(polygonA, polygonB);
if (Math.abs(validatedDistance - expectedDistance) > EPSILON) {
  throw new Error(
    `Expected polygon distance ${expectedDistance}, received ${validatedDistance}`,
  );
}

for (let index = 0; index < warmupCount; index += 1) {
  engine.polygonToPolygonDistance(polygonA, polygonB);
}

let checksum = 0;
const startedAt = performance.now();
for (let index = 0; index < iterationCount; index += 1) {
  checksum += engine.polygonToPolygonDistance(polygonA, polygonB);
}
const elapsedMilliseconds = performance.now() - startedAt;

if (Math.abs(checksum - expectedChecksum) > EPSILON * iterationCount) {
  throw new Error(
    `Expected polygon distance checksum ${expectedChecksum}, received ${checksum}`,
  );
}

console.log(
  JSON.stringify({
    validatedDistance,
    warmupCount,
    iterationCount,
    checksum,
    elapsedMilliseconds,
  }),
);
