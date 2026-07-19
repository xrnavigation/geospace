# Polygon-distance performance campaign

## Campaign frame

- Campaign goal: reduce the median latency of `polygon-to-polygon distance, 128 x 128 vertices` without changing public results or correctness.
- Development environment: the current Windows host with Node.js 22.18.0.
- Development metric command shape, five complete sequential runs per confirmed experiment:
  `npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=<experiment-run-N.json>`
- Baseline authority: `benchmarks/baselines/3086677-node22-windows.md` and its five raw JSON files. Baseline median of run medians is 807.80 us; range 747.90-936.95 us; median RME 1.16%.
- Minimum meaningful effect: at least 10% lower median of run medians on the development row, with the paired-difference interval excluding zero.
- Regression gate: `npx tsc --noEmit`, `npm test`, `npm run build`, plus no more than 5% regression on any non-holdout benchmark row that the source delta can affect.
- Holdout: the same polygon-distance row on Node.js 24 from a clean checkout of the exact candidate commit, five sequential runs. No candidate may run this holdout during triage or tuning. The manager must obtain a new user message authorizing the exact candidate commit and Node 24 holdout before it is consumed.
- Budget: three triage probes and at most two full preregistered experiments.
- Kill criteria: stop when the three triage probes produce no survivor projected to clear 10%, when two consecutive full experiments produce no promotable result, or when the full-experiment budget is exhausted.
- Autonomous boundary: repo-local profiling, reversible development probes, experiment branches, Node 22 development benchmarks, and correctness gates are authorized. Merging/cherry-picking/pushing candidate source or running the Node 24 holdout is not authorized without the separate promotion/holdout gate.

## Initial candidates

The code claims and candidate mechanisms are sourced from the [Geospace performance prior-art survey](../reports/geospace-performance-prior-art.md#optimization-hypothesis-register).

| Triage priority | ID | Candidate | Status |
| ---: | --- | --- | --- |
| 1 | P1 | consolidated allocation-light segment-distance kernel | candidate |
| 2 | P3 | edge-AABB lower-bound pruning | candidate |
| 3 | P2 | indexed facet branch-and-bound | candidate |

A CPU/allocation profile of the real development row is required before the first probe and may reprioritize or kill candidates. Do not run the profile, benchmark, or any candidate in this task.

Frame artifact commit: `e68de5abe11d18f4acf3148a6ae356d62c2c6015`
