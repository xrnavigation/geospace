# P1 full experiment

## Fixed target and commits

- Target: `polygon-to-polygon distance, 128 x 128 vertices`.
- Development runtime: Node.js `v22.18.0` only.
- Baseline: `31fac31e193ea790cda6d1ff09223f4049d6ed6c`.
- Candidate: `b92885d4f0fea7c1d985959bdde07c17a95ebada`.
- Preregistration artifact commit: `8d8175ce013c83de9ebc4da7301280836ba0717a`.

## Preconditions and correctness gates

All fixed preconditions passed:

- candidate branch: `experiment/p1-segment-kernel-triage`;
- candidate `HEAD`: `b92885d4f0fea7c1d985959bdde07c17a95ebada`;
- candidate `HEAD^`: `31fac31e193ea790cda6d1ff09223f4049d6ed6c`;
- candidate tracked status before gates: clean;
- runtime: `v22.18.0`;
- candidate-is-ancestor-of-`master` check: exit `1`, as required.

All four correctness gates passed in the fixed order:

1. `npx tsc --noEmit`;
2. `npm test` (5 files and 76 tests passed);
3. `npm run build`;
4. `npx tsc -p tsconfig.benchmarks.json`.

## Affected-row confirmation

The fixed candidate-scope command reported exactly:

```text
src/geometry.tests.ts
src/geometry.ts
```

The fixed benchmark call-graph command reported exactly one call:

```text
benchmarks\core.bench.ts:104:      numberSink = engine.polygonToPolygonDistance(polygon128A, polygon128B);
```

Therefore the set of affected non-holdout benchmark rows is empty and the
campaign's `<=5%` affected-row regression gate is satisfied by the fixed
confirmation.

## Fixed measurements and calculations

All ten timed commands succeeded in exact alternating order. None was retried
or replaced. Run medians are in microseconds:

| Pair | Baseline median (us) | Candidate median (us) | Candidate - baseline (us) |
| ---: | ---: | ---: | ---: |
| 1 | 705.7999999999538 | 204.09999999992579 | -501.700000000028 |
| 2 | 689.9000000000797 | 204.39999999996417 | -485.5000000001155 |
| 3 | 660.7999999999947 | 207.20000000005712 | -453.5999999999376 |
| 4 | 657.3499999999513 | 205.7999999999538 | -451.54999999999745 |
| 5 | 662.5999999999976 | 206.40000000003056 | -456.1999999999671 |

- Baseline median of five run medians: `662.5999999999976 us`.
- Candidate median of five run medians: `205.7999999999538 us`.
- Unrounded percentage change: `-68.94053727739895%`.
- Mean paired difference: `-469.71000000000913 us`.
- Sample standard deviation of paired differences: `22.608195416753368 us`.
- Fixed two-sided 95% Student t interval:
  `[-497.7817823133472, -441.63821768667106] us`.

The candidate is at least 10% lower and the fixed paired-interval upper
endpoint is below `0 us`. Both performance conditions pass without rounding.

## Terminal state

- Decision: `promotable development result`.
- Full-experiment budget: one of two slots consumed; one remains.
- Candidate worktree: restored to exact candidate
  `b92885d4f0fea7c1d985959bdde07c17a95ebada` with no tracked changes.
- Node.js 24: not run; the holdout remains sealed and unconsumed.
- Ward: skipped as explicitly instructed.
- Integration: no promotion, merge, cherry-pick, or push was performed.
First evidence artifact commit:
`c7f3a4a1e612629188c0222f4e7b99d7729f5890`.
