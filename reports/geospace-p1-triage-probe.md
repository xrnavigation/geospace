# P1 polygon-distance triage probe

Date: 2026-07-18

Status: **survives triage**. This record consumes exactly one of the campaign's three triage probes. Two triage probes remain, and the full-experiment budget remains two.

## Hypothesis

On the exact `polygon-to-polygon distance, 128 x 128 vertices` row, replacing the existing per-edge-pair object/projection churn with direct numeric segment-distance calculations, squared candidate comparisons, and one final square root will reduce the median of three paired candidate runs by at least 10% relative to three paired baseline runs.

## Candidate

Branch: `experiment/p1-segment-kernel-triage`

Worktree: `C:\Users\Q\src\audiom\geospace-p1-triage`

Candidate commit: `b92885d4f0fea7c1d985959bdde07c17a95ebada` (`perf: prototype allocation-light polygon distance`)

The implementation changes only `GeometryEngine.polygonToPolygonDistance` and focused tests in `src/geometry.tests.ts`. It precomputes exterior-edge endpoint coordinates in flat numeric arrays, performs EPSILON-aware direct segment intersection and squared point-to-segment calculations inside the edge-pair loop, returns one final square root for a nonzero minimum, and constructs no per-pair `LineSegment2D` or projection point. A single reusable projection point preserves the configured distance-function behavior outside the direct Euclidean fast path.

## Runtime and correctness

Runtime verification:

```text
node --version
```

Result: `v22.18.0`. Node.js 24 and the holdout were not run.

The corrected candidate passed these exact gates in order:

```text
npx tsc --noEmit
npm test
npm run build
npx tsc -p tsconfig.benchmarks.json
```

Results:

- `npx tsc --noEmit`: exit 0.
- `npm test`: exit 0; 5 test files and 76 tests passed.
- `npm run build`: exit 0.
- `npx tsc -p tsconfig.benchmarks.json`: exit 0.

Focused coverage includes the benchmark's separated 128-vertex polygons, intersecting polygons returning zero, containment returning zero, collinear separated edges, a repeated vertex producing a degenerate edge, and preservation of a configured non-default point-distance function.

## Paired measurement commands

The baseline was the candidate commit's parent, committed master `31fac31e193ea790cda6d1ff09223f4049d6ed6c`. The candidate was `b92885d4f0fea7c1d985959bdde07c17a95ebada`. The two tracked candidate files were restored from `HEAD^` for each baseline and from `HEAD` for each candidate. The final evidence runs used this exact order:

```text
git restore --source=HEAD^ -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=experiments/p1-triage/baseline-1.json
git restore --source=HEAD -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=experiments/p1-triage/candidate-1.json
git restore --source=HEAD^ -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=experiments/p1-triage/baseline-2.json
git restore --source=HEAD -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=experiments/p1-triage/candidate-2.json
git restore --source=HEAD^ -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=experiments/p1-triage/baseline-3.json
git restore --source=HEAD -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=experiments/p1-triage/candidate-3.json
node experiments/p1-triage/summarize.mjs experiments/p1-triage
```

No benchmark command failed. No full benchmark suite was run.

## Raw measurements and calculations

Tinybench medians are recorded in milliseconds in the raw JSON files and shown here in microseconds.

| Pair | Baseline median | Candidate median | Paired change |
| ---: | ---: | ---: | ---: |
| 1 | 662.45 us | 211.50 us | -68.07306211789177% |
| 2 | 753.10 us | 205.10 us | -72.76590094276843% |
| 3 | 671.10 us | 206.80 us | -69.18492028013165% |

- Baseline median of the three run medians: `671.10 us` (`0.671100000000024 ms`).
- Candidate median of the three run medians: `206.80 us` (`0.20680000000004384 ms`).
- Percentage change between medians of medians: `-69.18492028013165%`.
- All three paired percentage changes are negative.

Raw evidence:

- `experiments/p1-triage/baseline-1.json`
- `experiments/p1-triage/candidate-1.json`
- `experiments/p1-triage/baseline-2.json`
- `experiments/p1-triage/candidate-2.json`
- `experiments/p1-triage/baseline-3.json`
- `experiments/p1-triage/candidate-3.json`
- `experiments/p1-triage/summarize.mjs`

## Decision

P1 survives this triage probe. Its candidate median of medians is 69.18492028013165% lower than the paired baseline median of medians, exceeding the required 10% reduction, and every paired change is negative.

The candidate remains only on `experiment/p1-segment-kernel-triage`. It was not merged, cherry-picked, pushed, promoted, or run on the Node.js 24 holdout. Master source is unchanged.

## Limitations

- This is a three-pair triage probe on one deterministic row, not a full preregistered experiment.
- It does not apply the full experiment's paired confidence interval or affected non-holdout regression gate.
- It does not establish performance on other polygon sizes, shapes, holes, or alternate configured distance functions.
- An initial provisional implementation and six measurements were superseded before final evidence because the prototype bypassed the configured distance function. The corrected candidate added direct coverage for that public behavior, reran all four gates, and produced the six final raw files listed above. Superseded raw files are not part of master evidence.
- The Node.js 24 holdout remains sealed and unconsumed.

## Next campaign action

Preregister a full P1 experiment for exact candidate commit `b92885d4f0fea7c1d985959bdde07c17a95ebada`, including the campaign's five paired Node.js 22 development runs, paired-difference interval, and affected non-holdout regression gate. Do not promote the candidate or run the Node.js 24 holdout without the separate user authorization required by the campaign ledger.

First evidence artifact commit: pending
