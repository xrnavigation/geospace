# Geospace performance prior-art survey

Date: 2026-07-18

Scope: repository evidence, tracked history, current implementation, and decision-changing primary or authoritative algorithm sources. This is research only: no campaign winner is selected and no runtime, test, benchmark, evaluator, or package change is proposed as an established fact.

Evidence labels used below:

- **Verified repo fact**: directly supported by a tracked artifact, raw result, current source, test, or Git object.
- **Literature-backed possibility**: an external source establishes an algorithm or tradeoff, but not a bottleneck or win in Geospace.
- **Inference**: a probe hypothesis derived from the first two classes; it remains unproven until measured against the sealed evaluator.

## Executive findings

- **Verified repo fact:** the initial committed benchmark baseline is `benchmarks/baselines/3086677-node22-windows.md`. Its raw evidence is the five adjacent `3086677-node22-windows-run-{1..5}.json` files. Re-running the tracked summarizer over those five raw files reproduced the committed table below; no remembered number is used.
- **Verified repo fact:** the two longest median rows are R-tree bulk load (2.526 ms) and polygon-to-polygon distance (807.80 us). Bulk load is also the noisiest row, so its apparent lead is not causal evidence (`benchmarks/baselines/3086677-node22-windows.md:38-53`).
- **Verified repo fact:** no runtime source optimization follows the benchmark workload, summarizer, and baseline commits (`3086677`, `5ed52c1`, `8fe2686`). No tracked profile, flamegraph, allocation report, experiment ledger, campaign ledger, or earlier performance report exists.
- **Inference:** the strongest code-supported mechanism is the quadratic polygon edge-pair path, but even that is not a selected winner. R-tree construction has a larger wall time and far more baseline variance; profiling or a narrow diagnostic would be needed to distinguish sorting, bounding-box work, and allocation.
- **Literature-backed possibility:** indexed branch-and-bound facet distance is an established alternative to quadratic comparisons, and STR is an established packing algorithm. Neither source proves a win at Geospace's fixed sizes or in JavaScript.

## Initial committed baseline

The measured checkout was `5ed52c15ced4f1ab096f635879f67ed157cd182c` on Node.js 22.18.0, npm 10.9.3, Windows 11 build 26200, and an AMD Ryzen 9 5950X. The baseline records evaluator object hashes and states that no source optimization was present (`benchmarks/baselines/3086677-node22-windows.md:3-22`). Five complete sequential runs were retained, and the summary is the median of each run's Tinybench median, the range of those five medians, and median reported RME (`benchmarks/baselines/3086677-node22-windows.md:24-32`).

| Benchmark row | Median of run medians | Run-median range | Median RME |
| --- | ---: | ---: | ---: |
| point-to-polygon distance, 256 vertices | 1.60 us | 1.60-1.70 us | 0.31% |
| polygon-to-polygon distance, 128 x 128 vertices | 807.80 us | 747.90-936.95 us | 1.16% |
| affine transform, 256-vertex polygon | 3.40 us | 2.80-3.70 us | 1.19% |
| raycastAll, 256 line segments | 4.40 us | 4.00-5.70 us | 1.38% |
| R-tree bulk load, 10,000 points | 2.526 ms | 2.067-4.416 ms | 5.72% |
| R-tree search, 441 matches | 6.40 us | 5.90-10.80 us | 0.89% |
| R-tree nearest 10 | 3.20 us | 3.00-5.00 us | 0.88% |
| GeoJSON circle encode, 128 segments | 3.00 us | 2.80-4.80 us | 1.11% |
| GeoJSON polygon decode, 256 vertices | 3.50 us | 3.30-4.50 us | 1.38% |

Raw evidence used: `benchmarks/baselines/3086677-node22-windows-run-1.json` through `-run-5.json`, as enumerated by the baseline (`benchmarks/baselines/3086677-node22-windows.md:55-61`). The tracked reducer reads each JSON row's `median` and `rme`, rejects row/order mismatches, and calculates the reported cross-run statistics (`benchmarks/summarize.mjs:11-38`, `benchmarks/summarize.mjs:41-78`).

## Repo-local performance records and instrumentation

### Tracked artifacts found

- `benchmarks/README.md`: methodology, fixed workload definitions, measurement rules, and the rule sealing benchmark/evaluator changes from source experiments (`benchmarks/README.md:1-43`).
- `benchmarks/core.bench.ts`: nine fixed Tinybench rows, 500 ms timing, five warmups, 20 minimum iterations, module-local sinks, and deterministic fixtures (`benchmarks/core.bench.ts:27-90`, `benchmarks/core.bench.ts:92-179`).
- `benchmarks/summarize.mjs`: repeated-run reduction and formatting.
- `benchmarks/baselines/3086677-node22-windows.md` and its five raw JSON files: the only committed benchmark result set.
- `tsconfig.benchmarks.json`, `package.json`, and root `README.md`: benchmark type-check, command, build-first package-entry execution, and discoverability (`package.json:24-29`, `README.md:235-246`).
- `notes-geospace-completion.md`: the performance-phase chronology. It records harness validation as non-baseline evidence, the three benchmark commits, the retained five-run baseline, and that no runtime optimization or selected hypothesis existed (`notes-geospace-completion.md:3-65`). This file was already modified before the survey and was not edited.

### None found

No tracked or historically deleted file named or containing a performance profile, flamegraph, CPU sample, allocation profile, experiment result/ledger, campaign ledger, or prior-art/performance report was found. Search covered the tracked file list; all-history names/statuses; and case-insensitive terms `benchmark`, `performance`, `profile`, `flame`, `allocation`, `optimize`, `experiment`, `distance`, `intersection`, `RTree`, `R-tree`, `bulk`, `nearest`, `raycast`, `affine`, and `GeoJSON`.

### Instrumentation limits

- The harness times public end-to-end operations. It provides no helper attribution, allocation counts, CPU samples, hardware counters, or complexity scaling.
- Each row has one fixture shape: regular convex polygons, a 100 x 100 point grid, ordered vertical segments all intersecting the ray, one affine chain, one circle encoding size, and one simple polygon decode (`benchmarks/core.bench.ts:38-90`). Results do not establish behavior for holes, invalid GeoJSON, mixed/missing ray hits, skewed rectangles, alternate R-tree capacities, or other input sizes.
- Fixtures are outside timed callbacks except R-tree construction itself (`benchmarks/core.bench.ts:64-90`, `benchmarks/core.bench.ts:132-157`). This makes the construction/query boundary clear but leaves no internal breakdown.
- The committed baseline identifies broad environmental noise, especially run 2 and R-tree bulk load in run 5 (`benchmarks/baselines/3086677-node22-windows.md:48-53`). A bulk-load probe must clear that range with paired repeated runs.
- The current worktree contains a pre-existing untracked `vitest.config.js` selecting `**/*.tests.ts`; it is not among the baseline's recorded evaluator hashes. This is a provenance gap, not evidence that it affected collection: the baseline does not establish whether that untracked file was present then.

## Relevant implementation and tracked history

### Polygon distance and intersection

**Current verified facts.** `polygonToPolygonDistance` calls full intersection logic and, when disjoint, evaluates every exterior edge pair. For the 128 x 128 row that is 16,384 pair calls; both edge objects are constructed inside the nested loops (`src/geometry.ts:833-854`). `lineToLineDistance` performs an intersection test, then four point-to-segment distances (`src/geometry.ts:754-790`). Polygon intersection first recomputes both exterior bounding boxes, then may perform point-in-polygon and nested edge tests (`src/geometry.ts:856-909`, `src/geometry.ts:972-998`). The benchmark fixture creates two radius-100 regular polygons centered 220 units apart, so their axis-aligned boxes are disjoint (`benchmarks/core.bench.ts:65-68`).

**History.** `97fe53a` and `47f1400` expanded geometry intersection and bounding-box handling. `12d81cb` removed an incorrect rule that returned `Infinity` whenever polygon bounding boxes were disjoint and replaced it with exact work. `a866e41` restored explicit edge-pair distance evaluation. `03e04bd` adjusted the distance test tolerance. None contains benchmark evidence. This makes bbox separation a useful lower bound or reject for intersection, but historically invalid as the final polygon distance.

### R-tree bulk load, search, and nearest

**Current verified facts.** Nodes lazily cache bounding boxes and recursively invalidate parents (`src/geometry.ts:1460-1502`). The default capacity is 9 (`src/geometry.ts:1518-1527`). Bulk load maps every item to an entry, x-sorts, slices, y-sorts, groups leaf nodes, and repeats a similar pack at every internal level (`src/geometry.ts:1800-1858`). Search recursively tests entry boxes and returns a newly allocated result array (`src/geometry.ts:1731-1746`). Nearest is already best-first over a binary min-heap, but computes the root box distance twice, computes square roots for ordering, and allocates tagged queue records (`src/geometry.ts:1397-1457`, `src/geometry.ts:1750-1795`, `src/geometry.ts:1861-1872`).

**History.** `bulkLoad(items)` and `nearest(point, k)` originate in `e7b2b69` and have no later algorithm-changing commit. Later R-tree commits address types, parent initialization, metadata, test extraction, and coverage, not measured performance.

### Raycasting

**Current verified facts.** `raycastAll` linearly calls public `raycast` for every geometry and retains the closest distance (`src/geometry.ts:1128-1174`). The segment routine solves the parametric intersection and allocates a point for each hit (`src/geometry.ts:1881-1904`); `raycast` then invokes the configured distance function (`src/geometry.ts:1154-1157`). The fixed row contains 256 ordered vertical segments, all crossing the ray (`benchmarks/core.bench.ts:74-81`, `benchmarks/core.bench.ts:118-129`).

**History.** `afbd642` introduced direct ray intersections; `f500e96` and `6f7c794` introduced/unified `GeometryEngine.raycast` and `raycastAll`; `737d163` added the polygon-boundary fallback. Tests require the closest hit, not the first array hit (`src/raycast.tests.ts:174-190`). No raycasting commit includes performance evidence.

### Affine transform

**Current verified facts.** A polygon application maps all exterior vertices through a six-number matrix, allocates one point per vertex, and constructs a new `Polygon2D` (`src/geometry.ts:618-642`, `src/geometry.ts:670-674`). The row is 3.40 us and transforms a 256-vertex polygon (`benchmarks/core.bench.ts:69-72`, `benchmarks/core.bench.ts:109-115`).

**History.** The implementation originated in `e7b2b69`. `59397e9` strengthened circle transform and intersection correctness. No affine algorithm change was performance-measured.

### GeoJSON conversion

**Current verified facts.** Circle encoding loops through `segments + 1`, performs sine and cosine for every output position, and pushes each tuple (`src/geojsonConverter.ts:368-381`). The builder and conversion path also allocate/merge option objects (`src/geojsonConverter.ts:412-448`). Polygon decode first validates every coordinate through `isGeoJSONPolygon`, then slices/maps rings again to construct points and a `Polygon2D` (`src/geojsonConverter.ts:157-248`, `src/geojson.types.ts:229-258`). Tests require finite numeric positions and preserve invalid-input rejection (`src/geojson.types.tests.ts:97-113`).

**History.** `fc002df` introduced conversion. Later commits add type guards, fluent construction, supported types, and correctness fixes; `86ee1c5`, `227b60d`, and `5208206` complete the current core/type-predicate refactor. No conversion history contains benchmark evidence.

## Primary literature and authoritative documentation

| Source | What it establishes | Decision it can change here |
| --- | --- | --- |
| Antonin Guttman, [R-trees: A Dynamic Index Structure for Spatial Searching](https://doi.org/10.1145/602259.602266) (SIGMOD 1984) | Original bounding-rectangle search/update structure and quadratic split family. | Distinguishes dynamic insertion/split tradeoffs from the already packed bulk-load row; does not justify replacing STR for a static build. |
| Leutenegger, Edgington, Lopez, [STR: A Simple and Efficient Algorithm for R-Tree Packing](https://doi.org/10.1109/ICDE.1997.582015) (ICDE 1997) | STR packing and comparisons across data distributions; no packing method dominates all workloads. | Supports testing packing/capacity changes across construction and query rows together, and argues against declaring a universal layout winner from the point-grid build alone. |
| Roussopoulos, Kelley, Vincent, [Nearest Neighbor Queries](https://doi.org/10.1145/568271.223794) (SIGMOD 1995) | Branch-and-bound R-tree traversal for nearest and k-nearest queries with ordering/pruning metrics. | Confirms that best-first/pruned R-tree search is the relevant class. Geospace already has best-first traversal, so a wholesale linear-to-tree rewrite is not prior art that remains to be applied. |
| GEOS, [`DistanceOp`](https://libgeos.org/doxygen/classgeos_1_1operation_1_1distance_1_1DistanceOp.html) | Straightforward geometry distance uses O(n^2) comparisons; spatial indexes or Voronoi techniques can improve worst-case behavior. | Supports treating the current nested edge-pair row as an algorithmic candidate rather than only a JavaScript micro-optimization. |
| GEOS, [`IndexedFacetDistance`](https://libgeos.org/doxygen/classgeos_1_1operation_1_1distance_1_1IndexedFacetDistance.html) | R-tree branch-and-bound facet distance, with optional cached target index, improves large/repeated cases. | Supports an indexed-distance probe only if index-build cost and one-shot versus repeated-query semantics are measured at 128 x 128. |
| Gavrilova and Rokne, [Reliable line segment intersection testing](https://doi.org/10.1016/S0010-4485(00)00050-6) (Computer-Aided Design 2000) | Parametric segment intersection has floating-point robustness concerns and exactness can require interval reasoning. | Raises the correctness bar for consolidating segment intersection/distance arithmetic or removing EPSILON branches; speed alone cannot accept changed degeneracy behavior. |
| W3C, [CSS Transforms Level 2 mathematical description](https://www.w3.org/TR/css-transforms-2/#mathematical-description) | Authoritative six-parameter 2D affine matrix application. | Confirms the current per-point arithmetic class; it supplies no evidence for a different asymptotic affine algorithm. |
| Cieslinski and Moroz, [Fast exact digital differential analyzer for circle generation](https://arxiv.org/abs/1304.4974) | Recurrence-based circle generation can trade trig calls for arithmetic while controlling roundoff. | Makes recurrence generation probeable, but requires coordinate-error and closure checks against the direct-trigonometric output contract. |
| IETF, [RFC 7946, section 3.1.6](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.6) | GeoJSON polygon rings are closed and first/last positions must contain identical values. | Rules out omitting the 129th closing coordinate as an encode optimization; only how it is produced may change. |

Searches for a primary source specifically demonstrating a faster JavaScript `Array.map` affine loop or a single-pass RFC 7946 validator/constructor found **none**. Locations/terms: W3C transform specifications, IETF/RFC Editor GeoJSON materials, and web searches for `2D affine transformation matrix performance`, `GeoJSON validation single pass`, and `RFC 7946 implementation performance`. Those remain code-level hypotheses, not literature claims.

## Optimization hypothesis register

Every entry is an **inference**, not a selected or proven optimization.

| ID | Target benchmark row | Expected mechanism | Evidence | Correctness risk | Estimated probe cost |
| --- | --- | --- | --- | --- | --- |
| P1 | polygon-to-polygon distance | Precompute edge coordinates and use one consolidated segment-distance kernel, comparing squared candidates and taking one final square root; remove per-pair `LineSegment2D` and projection-point churn. | Current 16,384-pair nested construction and four-distance path (`src/geometry.ts:754-790`, `833-854`). | **High:** EPSILON, collinear/degenerate segments, intersection zero, and exact API result must remain unchanged. | Medium: focused implementation plus adversarial geometry tests and repeated row runs. |
| P2 | polygon-to-polygon distance | Build facet bounding structures and use branch-and-bound lower bounds to prune edge pairs. | GEOS `DistanceOp`/`IndexedFacetDistance`; current O(n*m) pairs. | **High:** one-shot index cost may exceed savings at 128 edges; holes and intersection semantics must remain exact. | High: new internal algorithm and differential/property testing. |
| P3 | polygon-to-polygon distance | Precompute edge AABBs and prune a pair only when its box-distance lower bound cannot beat the current best. | Current disjoint fixture and exhaustive pair loop; indexed-distance literature. | **Medium-high:** a lower bound is safe only for pruning, never as the returned distance; ordering/tie/Infinity cases matter. | Medium. |
| P4 | point-to-polygon distance | Inline coordinate-only point-to-segment squared distance and avoid one edge object/projection allocation per vertex. | `src/geometry.ts:771-782`; same arithmetic family as P1. | **Medium:** point-in-polygon and EPSILON boundary behavior must remain identical. | Low-medium. |
| R1 | R-tree bulk load; validate search and nearest too | Preallocate/group more directly and reduce `slice`, short-lived array, entry, and node churn while preserving the same STR grouping. | `src/geometry.ts:1807-1855`; no allocation profile exists. | **Medium:** parent links, cached boxes, exact contents, and grouping must be preserved. | Medium; first diagnostic must establish allocation/sort share. |
| R2 | bulk load, search, nearest | Probe node capacities around the default 9, measuring all three rows because height, scan width, overlap, and construction trade off. | Default at `src/geometry.ts:1523-1526`; STR paper says no layout dominates every workload. | **Medium:** changing the public default affects all callers and non-grid distributions; no win may be generalized from this fixture. | Low for a diagnostic, medium for a defensible kept change. |
| R3 | R-tree nearest 10 | Compute the root priority once and order by squared point-to-box distance, eliminating redundant work and square roots while preserving monotone order. | Duplicate root calls (`src/geometry.ts:1757-1765`) and sqrt helper (`src/geometry.ts:1864-1871`). | **Low-medium:** ties, infinities, and NaN behavior must not reorder observable results. | Low. |
| R4 | R-tree nearest 10 | Specialize heap storage to avoid tagged queue object/duplicate priority fields on each push. | Generic heap and nearest queue records (`src/geometry.ts:1397-1457`, `1750-1788`). | **Medium:** heap ordering and exact k/tie behavior. | Medium; likely small absolute ceiling at 3.20 us. |
| R5 | R-tree search, 441 matches | Compare recursive traversal with an explicit reusable/local stack while retaining the required result array. | Recursive `_search` (`src/geometry.ts:1731-1746`). | **Low-medium:** result order is observable unless documented otherwise. | Low; weak evidence and only 6.40 us baseline. |
| Y1 | raycastAll, 256 line segments | For the all-segment path, retain parametric `t`/squared distance and allocate the point/result only for the final closest hit. | Linear public-call path and per-hit point/distance work (`src/geometry.ts:1128-1174`, `1881-1904`). | **High:** mixed geometries, non-normalized directions, ties, EPSILON, and polygon fallback must match. | Medium. |
| A1 | affine transform, 256-vertex polygon | Hoist matrix components and fill a pre-sized point array in one loop rather than `map` plus helper calls. | `src/geometry.ts:618-642`, `670-674`. | **Low-medium:** output values/order and new-object behavior must match; likely small ceiling at 3.40 us. | Low. |
| G1 | GeoJSON circle encode, 128 segments | Pre-size the coordinate array and compare direct trig with a recurrence that uses initial trig plus arithmetic per point. | `src/geojsonConverter.ts:368-381`; recurrence literature. | **High** for recurrence: accumulated roundoff and exact closing coordinate; **low** for preallocation alone. | Low-medium. |
| G2 | GeoJSON polygon decode, 256 vertices | Dispatch once by `type` and fuse finite-coordinate validation with point construction to remove the full validation-then-copy double traversal. | `src/geojsonConverter.ts:157-248`; `src/geojson.types.ts:229-258`. | **High:** all invalid-input rejection and `ValidationError` behavior must remain exact. | Medium. |
| G3 | both GeoJSON rows | Reduce builder/default/options object churn without changing the fluent public API or conversion result shape. | `src/geojsonConverter.ts:62-79`, `412-448`. | **Medium:** option precedence and coordinate-transform callbacks. | Low; expected effect is small and unprofiled. |

## Disproven or ineligible ideas

| Idea | Status | Exact cause of death |
| --- | --- | --- |
| Return `Infinity` when polygon bounding boxes are disjoint | **Historically disproven** | Commit `12d81cb` removed exactly that behavior because disjoint boxes do not mean infinite geometry distance; current tests require a finite disjoint-polygon result (`src/geometry.tests.ts:135-140`). |
| Return bounding-box separation as polygon distance | **Ineligible** | Box separation is only a lower bound for arbitrary polygons. It may order/prune exact work (P3), but cannot replace exact edge distance. |
| Stop `raycastAll` on the first hit | **Ineligible** | Public behavior is closest hit and the current test asserts it (`src/raycast.tests.ts:174-190`); input array order is not a distance ordering contract. |
| Build a fresh spatial index inside every `raycastAll` call | **Ineligible for the current row without new evidence** | The benchmark constructs `GeometryEngine` without an index and times each call; rebuilding for 256 segments would add construction to the timed path (`benchmarks/core.bench.ts:64`, `74-81`, `118-129`). An API/caller-provided persistent index is different scope. |
| Reduce circle segment count | **Ineligible** | The benchmark explicitly requests 128 segments (`benchmarks/core.bench.ts:160-167`), tests assert `segments + 1`, and RFC 7946 requires an identical closing position. This changes workload/output rather than implementation efficiency. |
| Omit the closing circle coordinate | **Ineligible** | RFC 7946 section 3.1.6 requires the first and last ring positions to contain identical values. |
| Skip GeoJSON validation on decode | **Ineligible** | Finite-coordinate and invalid-structure rejection are covered by current guards/tests (`src/geojson.types.ts:229-258`, `src/geojson.types.tests.ts:97-113`). Fusing validation is eligible; deleting it is not. |
| Mutate the input polygon during affine application or reuse the same output object | **Ineligible** | Geometry coordinates are exposed readonly and `apply` constructs a new polygon (`src/geometry.ts:495-523`, `618-642`); mutation changes public semantics rather than optimizing the implementation. |
| Special-case the 100 x 100 point grid in R-tree bulk load | **Ineligible** | `RTree<T>` is a generic `SpatialItem` index and the benchmark is representative input, not an authorization for fixture-dependent behavior (`src/geometry.ts:1518-1527`, `benchmarks/core.bench.ts:53-61`). |
| Change benchmark fixtures, duration, sinks, package entry, summarizer, or evaluator configuration during a source experiment | **Ineligible** | The tracked methodology seals benchmark/evaluator changes from source optimization experiments (`benchmarks/README.md:37-43`). |

## Research conclusion

The repo has a valid committed timing baseline but not causal attribution. Polygon distance has the clearest algorithmic prior art and an explicit quadratic implementation; R-tree bulk load has the largest elapsed time but also the weakest signal-to-noise and no internal attribution. The remaining rows expose plausible allocation/arithmetic reductions with small absolute ceilings. This survey intentionally does not choose a winner, run a benchmark, create a campaign ledger, or authorize a source experiment.

Artifact commit: `9e232046e41d91d2429d5d7d405ebd1fade85b75`
