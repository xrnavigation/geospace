# Geospace benchmarks

The benchmark suite measures fixed workloads against the built package entry point. The `benchmark` script builds `dist/`, type-checks the benchmark files, and then runs Vitest 3's Tinybench-backed benchmark mode.

```bash
npm run benchmark
```

To save a machine-readable result for comparison:

```bash
npm run benchmark -- --outputJson=benchmarks/results.json
```

The JSON contains throughput, mean time, percentiles, relative margin of error, and sample counts for every row. Do not compare absolute numbers from different machines, Node.js versions, power modes, or background-load conditions.

## Workloads

The deterministic suite currently covers:

- point-to-polygon distance with 256 polygon vertices;
- polygon-to-polygon distance with two disjoint 128-vertex polygons;
- an affine transform over a 256-vertex polygon;
- `raycastAll` over 256 line segments;
- R-tree bulk loading of a 100 by 100 point grid;
- R-tree search returning 441 matches from the 10,000-point tree;
- R-tree nearest-10 lookup in the same tree;
- circle-to-GeoJSON conversion with 128 polygon segments;
- GeoJSON-to-polygon conversion with 256 vertices.

Fixtures are created outside timed callbacks except when construction is the operation being measured. Benchmark results are consumed through module-local sinks to prevent dead-code elimination. Imported runtime bindings are copied to local constants, and the package self-reference resolves through `dist/`, avoiding source-transform overhead inside the measured library.

## Comparing a candidate

Run the baseline and candidate in the same environment, alternating sides where practical. Use at least five runs per side. Compare matching rows pairwise, report medians and spread, and keep a source change only when the paired interval excludes zero and clears the experiment's preregistered minimum meaningful effect.

Benchmark harness changes and source optimizations are separate commits. Once an optimization experiment begins, the benchmark files, scripts, and evaluator configuration are sealed for that experiment.
