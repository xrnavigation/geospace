# Polygon-distance baseline profile

Date: 2026-07-18

Status: **instrumentation failure**. The focused diagnostic completed, but neither generated V8 profile contained a frame or allocation location from `dist/geometry.es.js`. No CPU or allocation attribution is valid, no candidate is reprioritized or killed, and the next action is to repair the instrumentation before any candidate probe.

## Build and execution

Built bundle commit: `f45af0a80e80986863029611ba93de9a4fe96db9`

Commands were run from `C:\Users\Q\src\audiom\geospace` in this order:

```text
npm run build --silent
npx tsc -p tsconfig.benchmarks.json
node --cpu-prof --cpu-prof-dir=profiles/polygon-distance-baseline --heap-prof --heap-prof-dir=profiles/polygon-distance-baseline --heap-prof-interval=1024 node_modules/vitest/vitest.mjs bench --run --pool=forks -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=profiles/polygon-distance-baseline/benchmark.json
```

The build and benchmark TypeScript check exited successfully. The focused Vitest command ran exactly once and exited successfully. Its retained JSON result is `profiles/polygon-distance-baseline/benchmark.json`; it records 85 samples, a 5.389099999999871 ms median, 168.41648088017243 Hz, and 4.238903357696683% RME under profiling.

These timings are diagnostic context only. They are not a replacement for the committed five-run development baseline and are not candidate evidence.

## Process and profile selection evidence

The evidence directory did not exist before this task. The focused command generated exactly these raw profile files:

- `CPU.20260718.225813.146912.0.001.cpuprofile`
- `Heap.20260718.225813.146912.0.002.heapprofile`

An exact search for `dist/geometry.es.js` across both files returned no match. A broader search for `geometry.es.js`, allowing absolute and URL-form locations, also returned no match. Therefore neither file demonstrates that it profiled the built-package benchmark execution. Under the profile-selection rule, both files are invalid rather than target-process evidence. Because the evidence directory was newly created by this task and the two files provably lacked the bundle, both invalid profile files were removed.

Retained raw CPU profiles: **none**.

Retained raw heap profiles: **none**.

No `profiles/analyze-v8-profile.mjs` was added: there is no retained target-process CPU or heap profile against which the required relevant-location analyzer could be validated. Producing attribution from the wrapper-only data would guess past the explicit failure condition.

## Measured evidence

- The focused Vitest benchmark worker completed the selected benchmark row and wrote the retained benchmark JSON.
- The command generated one CPU profile and one heap profile with the same process identifier in their filenames.
- Neither generated profile contained `dist/geometry.es.js` or any `geometry.es.js` location.
- Consequently, this run measured no valid self-sample total, relevant function, allocation size, or allocation total for the built bundle.

## Inference and candidate implications

The absence of built-bundle locations is evidence about the instrumentation, not evidence about runtime cost. It cannot establish whether segment-distance arithmetic, object allocation, edge-AABB pruning, or indexing dominates the benchmark.

- **P1, consolidated allocation-light segment-distance kernel:** unchanged. No CPU or heap attribution supports or kills it.
- **P3, edge-AABB lower-bound pruning:** unchanged. No sample distribution establishes that avoidable edge-pair work is the dominant cost.
- **P2, indexed facet branch-and-bound:** unchanged. No profile establishes an algorithmic-overhead or allocation case for building an index at 128 edges.

The profile-backed candidate order is therefore unavailable. The pre-profile campaign order remains `P1`, `P3`, `P2` only as the unchanged initial order, not as a result backed by this failed profile.

## Diagnostic limitation and next action

`--pool=forks` was required here so the Node profiling flags could be inherited by a child benchmark process. That pool mode and the active CPU and heap profilers introduce process and timing behavior that differs from the sealed development benchmark procedure. The focused result is diagnostic-only and cannot be compared directly with the committed baseline or used as an experiment result.

Next action: repair profiling instrumentation so retained CPU and heap profiles from the actual benchmark worker contain `dist/geometry.es.js`, then rerun the baseline-profile prerequisite before spending any triage probe. Candidates remain unchanged, no candidate is triaged, and no full experiment is selected.

Artifact commit: `PENDING`
