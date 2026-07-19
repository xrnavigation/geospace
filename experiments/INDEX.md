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

## Round log

### Baseline profile

- Status: repaired with a valid direct diagnostic profile. The committed driver imported the built package and executed the exact 128-by-128 polygon fixture through the public `polygonToPolygonDistance` method in the profiled process.
- Retained driver output: `profiles/polygon-distance-direct/driver-output.json`; validated distance 20, 500 warmups, 5,000 profiled calls, checksum 100000, and 25791.464 elapsed milliseconds.
- Retained raw CPU profile: `profiles/polygon-distance-direct/CPU.20260718.231221.196512.0.001.cpuprofile`.
- Retained raw heap profile: `profiles/polygon-distance-direct/Heap.20260718.231221.196512.0.002.heapprofile`.
- Attribution: `geometry.es.js` accounts for 18,121 of 20,356 CPU self samples (89.02%) and 119,040 of 1,304,928 sampled heap bytes (9.12%). Named segment-distance/intersection functions account for 13,685 relevant CPU self samples, or 75.52% of bundle attribution.
- Candidate decision: `P1` remains priority 1 and is now profile-backed because the current segment-distance/intersection functions exceed the 50% relevant-CPU threshold. `P3` remains priority 2 and `P2` remains priority 3. No candidate was killed, triaged, implemented, or preregistered.
- Candidate order: `P1`, `P3`, `P2`, now profile-backed.
- Probe budget: unchanged at three triage probes; this repair consumed no probe.
- Next action: begin the profile-backed `P1` triage probe in a separate campaign step; this repair does not execute or preregister it.
- Repair report: `reports/geospace-polygon-distance-profile-repair.md`.
- Superseded failed-profile report and artifact commit: `reports/geospace-polygon-distance-profile.md`, `a304cce88b099445a13b272ffd81046d32336069`.
- Repair commit: `18567ad1923b71c0c6007258050fe0b9ebae93ae`.
