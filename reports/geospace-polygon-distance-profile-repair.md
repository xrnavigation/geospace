# Polygon-distance profile repair

Date: 2026-07-18

Status: **valid direct diagnostic profile**. The committed direct driver imported the built package, executed the benchmark's exact 128-by-128 polygon fixture through the public `polygonToPolygonDistance` method, and produced CPU and sampling-heap profiles with `geometry.es.js` attribution.

## Commands

Commands were run from `C:\Users\Q\src\audiom\geospace` in this order:

```text
npm run build --silent
npx tsc -p tsconfig.benchmarks.json
node --cpu-prof --cpu-prof-dir=profiles/polygon-distance-direct --heap-prof --heap-prof-dir=profiles/polygon-distance-direct --heap-prof-interval=1024 profiles/run-polygon-distance.mjs
node profiles/analyze-v8-profile.mjs profiles/polygon-distance-direct/CPU.20260718.231221.196512.0.001.cpuprofile profiles/polygon-distance-direct/Heap.20260718.231221.196512.0.002.heapprofile
```

The build and benchmark TypeScript check exited successfully. The direct profiling command ran exactly once and exited successfully. The analyzer also exited successfully, establishing valid bundle attribution in both raw profiles.

## Driver contract and result

`profiles/run-polygon-distance.mjs` imports `GeometryEngine`, `Polygon2D`, `euclideanDistance`, and `EPSILON` from `@xrnavigation/geospace`. It constructs one engine and two regular 128-vertex, radius-100 polygons centered at `(0,0)` and `(220,0)` outside the hot loop using the benchmark's angle formula. It validates one public-method call as distance 20 within `EPSILON`, executes exactly 500 warmup calls, then executes exactly 5,000 profiled calls while accumulating and validating a checksum of 100000 within `EPSILON * 5000`.

Retained driver output (`profiles/polygon-distance-direct/driver-output.json`):

```json
{"validatedDistance":20,"warmupCount":500,"iterationCount":5000,"checksum":100000,"elapsedMilliseconds":25791.464}
```

The elapsed time is diagnostic context only. It is not a benchmark result and is not comparable to the committed development baseline.

## Retained raw profiles

- CPU: `profiles/polygon-distance-direct/CPU.20260718.231221.196512.0.001.cpuprofile`
- Sampling heap: `profiles/polygon-distance-direct/Heap.20260718.231221.196512.0.002.heapprofile`

Both files are retained because the dependency-free analyzer found nonzero `geometry.es.js` self attribution in each.

## Full analyzer output

```text
CPU profile: CPU.20260718.231221.196512.0.001.cpuprofile
CPU all self samples: 20356
CPU geometry.es.js self samples: 18121 (89.02% of all samples)
CPU geometry.es.js attribution:
  7028 samples | 34.53% of all | pointToLineDistance | geometry.es.js:258:22 | node 71
  4409 samples | 21.66% of all | polygonToPolygonDistance | geometry.es.js:337:27 | node 68
  3243 samples | 15.93% of all | lineToLineDistance | geometry.es.js:288:21 | node 69
  2552 samples | 12.54% of all | euclideanDistance | geometry.es.js:704:27 | node 72
  651 samples | 3.20% of all | segmentsIntersect | geometry.es.js:655:27 | node 73
  62 samples | 0.30% of all | lineToLineDistance | geometry.es.js:288:21 | node 81
  56 samples | 0.28% of all | euclideanDistance | geometry.es.js:704:27 | node 83
  44 samples | 0.22% of all | pointToLineDistance | geometry.es.js:258:22 | node 80
  38 samples | 0.19% of all | segmentsIntersect | geometry.es.js:655:27 | node 84
  13 samples | 0.06% of all | getBBox | geometry.es.js:2:17 | node 77
  7 samples | 0.03% of all | intersects | geometry.es.js:354:13 | node 76
  6 samples | 0.03% of all | collinearOverlap | geometry.es.js:664:26 | node 85
  3 samples | 0.01% of all | computePolygonBBox | geometry.es.js:606:28 | node 79
  3 samples | 0.01% of all | isPolygon | geometry.es.js:242:19 | node 95
  2 samples | 0.01% of all | collinear | geometry.es.js:680:19 | node 75
  2 samples | 0.01% of all | collinearOverlap | geometry.es.js:664:26 | node 74
  1 samples | 0.00% of all | (anonymous) | geometry.es.js:243:129 | node 96
  1 samples | 0.00% of all | euclideanDistance | geometry.es.js:704:27 | node 82
Heap profile: Heap.20260718.231221.196512.0.002.heapprofile
Heap all sampled bytes: 1304928
Heap geometry.es.js self bytes: 119040 (9.12% of all sampled bytes)
Heap geometry.es.js attribution:
  30976 bytes | 2.37% of all | intersects | geometry.es.js:354:13 | node 272
  16440 bytes | 1.26% of all | lineToLineDistance | geometry.es.js:288:21 | node 281
  11720 bytes | 0.90% of all | (anonymous) | geometry.es.js:1:1 | node 264
  10544 bytes | 0.81% of all | LineSegment2D | geometry.es.js:102:14 | node 313
  10400 bytes | 0.80% of all | segmentsIntersect | geometry.es.js:655:27 | node 466
  7400 bytes | 0.57% of all | polygonToPolygonDistance | geometry.es.js:337:27 | node 271
  6920 bytes | 0.53% of all | getBBox | geometry.es.js:2:17 | node 277
  5376 bytes | 0.41% of all | isLineSegment | geometry.es.js:236:23 | node 352
  5208 bytes | 0.40% of all | pointToLineDistance | geometry.es.js:258:22 | node 283
  3192 bytes | 0.24% of all | (anonymous) | geometry.es.js:1:1 | node 261
  2160 bytes | 0.17% of all | pointToLineDistance | geometry.es.js:258:22 | node 415
  2136 bytes | 0.16% of all | computePolygonBBox | geometry.es.js:606:28 | node 279
  1808 bytes | 0.14% of all | collinearOverlap | geometry.es.js:664:26 | node 297
  1512 bytes | 0.12% of all | segmentsIntersect | geometry.es.js:655:27 | node 282
  1104 bytes | 0.08% of all | isPoint | geometry.es.js:233:17 | node 276
  1088 bytes | 0.08% of all | collinear | geometry.es.js:680:19 | node 298
  1056 bytes | 0.08% of all | isCircle | geometry.es.js:239:18 | node 354
```

## Attribution totals and candidate implications

- The built bundle accounts for 18,121 of 20,356 CPU self samples: **89.02% of all CPU self samples**.
- The named segment-distance/intersection functions `pointToLineDistance`, `lineToLineDistance`, `euclideanDistance`, `segmentsIntersect`, `collinearOverlap`, and `collinear` account for 13,685 CPU self samples. That is **75.52% of relevant `geometry.es.js` CPU self samples** and 67.23% of all CPU self samples.
- The outer exhaustive `polygonToPolygonDistance` frame accounts for 4,409 CPU self samples: 24.33% of relevant bundle samples and 21.66% of all samples.
- The built bundle accounts for 119,040 of 1,304,928 sampled heap bytes: **9.12% of all sampled heap bytes**.
- The same named segment-distance/intersection functions account for 38,616 sampled bytes, or 32.44% of relevant bundle bytes. Including the 10,544 bytes attributed to `LineSegment2D` construction raises the segment-kernel/construction allocation share to 49,160 bytes, or 41.30% of relevant bundle bytes.

The CPU criterion is decisive: current segment-distance/intersection functions exceed the required 50% threshold of relevant CPU self samples. Therefore `P1` remains priority 1 and the order is now profile-backed. `P3` remains priority 2, and `P2` remains priority 3. No candidate is killed, triaged, implemented, or preregistered by this repair.

Resulting candidate order: `P1`, `P3`, `P2`.

## Direct-diagnostic limitations

This driver reproduces the exact polygon fixture and public method in the profiled process, but it is not the Tinybench evaluator. Its fixed 500-call warmup and 5,000-call profiled loop do not reproduce Tinybench sampling, timing, or lifecycle behavior. CPU and sampling-heap profilers perturb execution, the 1,024-byte heap sampling interval is statistical, and bundle attribution includes setup or validation work when sampled. The direct run provides causal attribution for candidate ordering only; its elapsed time is not baseline evidence, a candidate measurement, a triage probe, or a holdout result.

Next action: begin the profile-backed `P1` triage probe in a separate campaign step. This repair does not execute or preregister that probe, and the three-probe budget remains unchanged.

Repair commit: `18567ad1923b71c0c6007258050fe0b9ebae93ae`
