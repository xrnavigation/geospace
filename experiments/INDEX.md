# Polygon-distance performance campaign

## Campaign frame

- Campaign goal: reduce the median latency of `polygon-to-polygon distance, 128 x 128 vertices` without changing public results or correctness.
- Development environment: the current Windows host with Node.js 22.18.0.
- Development metric command shape, five complete sequential runs per confirmed experiment:
  `npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=<experiment-run-N.json>`
- Baseline authority: `benchmarks/baselines/3086677-node22-windows.md` and its five raw JSON files. Baseline median of run medians is 807.80 us; range 747.90-936.95 us; median RME 1.16%.
- Minimum meaningful effect: at least 10% lower median of run medians on the development row, with the paired-difference interval excluding zero.
- Regression gate: `npx tsc --noEmit`, `npm test`, `npm run build`, plus no more than 5% regression on any non-holdout benchmark row that the source delta can affect.
- Budget: three triage probes and at most two full preregistered experiments.
- Kill criteria: stop when the three triage probes produce no survivor projected to clear 10%, when two consecutive full experiments produce no promotable result, or when the full-experiment budget is exhausted.

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

### P1 triage probe

- Status: survives triage. The allocation-light polygon segment-distance kernel cleared both triage conditions on the exact Node.js 22.18.0 development row.
- Candidate branch and commit: `experiment/p1-segment-kernel-triage`, `b92885d4f0fea7c1d985959bdde07c17a95ebada` (`perf: prototype allocation-light polygon distance`). The branch and separate worktree remain present; candidate source was not merged, cherry-picked, pushed, promoted, or applied to `master`.
- Correctness: `npx tsc --noEmit`, `npm test` (5 files, 76 tests), `npm run build`, and `npx tsc -p tsconfig.benchmarks.json` all passed.
- Paired medians: 662.45 us baseline / 211.50 us candidate (-68.07306211789177%); 753.10 us / 205.10 us (-72.76590094276843%); 671.10 us / 206.80 us (-69.18492028013165%).
- Median of medians: 671.10 us baseline and 206.80 us candidate, a -69.18492028013165% change. All three paired changes were negative.
- Decision: `P1` consumes exactly one triage probe and survives. The full experiment's confidence-interval and affected-row regression decisions were not applied here.
- Probe budget: one of three triage probes consumed; two triage probes remain. Full preregistered experiment budget remains two.
- Evidence: `reports/geospace-p1-triage-probe.md` and `experiments/p1-triage/`.
- Holdout: Node.js 24 was not run; the holdout remains sealed and unconsumed.
- First evidence artifact commit: `d76f17e7af7b15eb3dd36dddfc68acc8eae8a866`.

### P1 full experiment preregistration

- Status: preregistered only for exact candidate
  `b92885d4f0fea7c1d985959bdde07c17a95ebada` and exact baseline
  `31fac31e193ea790cda6d1ff09223f4049d6ed6c`; no benchmark, correctness gate,
  profiler, or Node.js 24 holdout was run in this step.
- Target: `polygon-to-polygon distance, 128 x 128 vertices` on development
  runtime Node.js `v22.18.0` only.
- Fixed experiment: five alternating baseline/candidate development pairs,
  median-of-five comparison, and a two-sided 95% paired-difference Student t
  interval using fixed critical value `2.7764451051977987`.
- Performance decision: candidate median of medians must be at least 10% lower
  and the unrounded paired-difference interval upper endpoint must be below
  `0 us`; all preconditions and four exact correctness gates must pass.
- Affected non-holdout rows: empty. Candidate `b92885d` changes only
  `GeometryEngine.polygonToPolygonDistance` and focused tests, and the target
  row is the committed suite's only caller of that method. This must be
  reconfirmed before timing; no unrelated full-suite regression measurement
  is authorized.
- Budget: preregistration consumes no full-experiment slot. The first timed
  Node.js 22 development command consumes one of the two slots.
- Candidate worktree:
  `C:\Users\Q\src\audiom\geospace-p1-triage` on
  `experiment/p1-segment-kernel-triage`. It was verified clean at the exact
  candidate before preregistration, with the exact baseline as its parent and
  the candidate not reachable from `master`.
- Terminal states: `promotable development result` only when every fixed gate,
  performance condition, affected-row confirmation, and clean exact-candidate
  terminal check passes; otherwise `rejected full experiment`.
- Preregistration: `experiments/p1-full/PREREGISTRATION.md`.
- Holdout: Node.js 24 remains sealed. This preregistration does not authorize
  promotion, merge, cherry-pick, push, or holdout execution.
- Exact next action: execute the preconditions and four correctness gates in
  the preregistered order for exact candidate `b92885d`; do not begin timing
  unless all pass.
- Preregistration artifact commit:
  `8d8175ce013c83de9ebc4da7301280836ba0717a`.

### P1 full experiment

- Status: `promotable development result` for exact candidate
  `b92885d4f0fea7c1d985959bdde07c17a95ebada` against exact baseline
  `31fac31e193ea790cda6d1ff09223f4049d6ed6c` on Node.js `v22.18.0`.
- Preconditions and correctness: all six fixed preconditions, all four exact
  correctness gates, and both affected-row confirmation commands passed.
- Affected non-holdout rows: empty. The candidate changes only
  `src/geometry.tests.ts` and `src/geometry.ts`, and the committed benchmark
  suite has exactly one `polygonToPolygonDistance` call, at the target row.
- Baseline run medians: `705.7999999999538`, `689.9000000000797`,
  `660.7999999999947`, `657.3499999999513`, and `662.5999999999976 us`.
- Candidate run medians: `204.09999999992579`, `204.39999999996417`,
  `207.20000000005712`, `205.7999999999538`, and
  `206.40000000003056 us`.
- Median of medians: `662.5999999999976 us` baseline and
  `205.7999999999538 us` candidate; unrounded change
  `-68.94053727739895%`.
- Paired differences: `-501.700000000028`, `-485.5000000001155`,
  `-453.5999999999376`, `-451.54999999999745`, and
  `-456.1999999999671 us`.
- Fixed paired interval: mean `-469.71000000000913 us`, sample standard
  deviation `22.608195416753368 us`, and two-sided 95% Student t interval
  `[-497.7817823133472, -441.63821768667106] us`.
- Decision: both unrounded performance conditions passed. The candidate
  worktree ended clean at exact candidate `b92885d`; no timed command was
  retried or replaced.
- Budget: one of two full-experiment slots consumed; one remains.
- Evidence: `reports/geospace-p1-full-experiment.md` and
  `experiments/p1-full/`.
- Holdout and integration: Ward was skipped; Node.js 24 was not run and
  remains sealed; no promotion, merge, cherry-pick, or push was performed.
- First evidence artifact commit:
  `c7f3a4a1e612629188c0222f4e7b99d7729f5890`.

### P1 Node 24 holdout preregistration

- Status: preregistered only; no Node.js 24 gate, benchmark command, or
  holdout data was opened before this record.
- Runtime: exact Node.js `v24.16.0` under NVM, followed by mandatory host
  restoration to exact `v22.18.0`, including on failure.
- Exact baseline and candidate: `31fac31e193ea790cda6d1ff09223f4049d6ed6c`
  and `b92885d4f0fea7c1d985959bdde07c17a95ebada`.
- Isolated checkout: clean detached worktree at
  `C:\Users\Q\src\audiom\geospace-p1-holdout`, created at exact candidate
  only after the preregistration commit; an already-existing path is a
  terminal stop, not permission to substitute.
- Target and runs: exact `polygon-to-polygon distance, 128 x 128 vertices`;
  five alternating baseline/candidate pairs in fixed order, with
  `npm run benchmark` rebuilding after each restore and no retry or replacement
  of a failed timing command.
- Raw evidence: fixed main-worktree paths
  `experiments/p1-holdout-node24/baseline-1.json` through `baseline-5.json`
  and `candidate-1.json` through `candidate-5.json`.
- Analysis: unchanged committed `experiments/p1-full/summarize.mjs`; pass only
  if candidate median of five medians is at least 10% lower and the unrounded
  fixed 95% paired-difference interval using `t = 2.7764451051977987` has an
  upper endpoint below zero.
- Candidate gates before timing, in order: `npx tsc --noEmit`, `npm test`,
  `npm run build`, and `npx tsc -p tsconfig.benchmarks.json`.
- Evaluator seal: no candidate diff under `benchmarks/`, `package.json`,
  `tsconfig.benchmarks.json`, or the committed summarizer. The affected
  non-holdout set remains empty only while exact source-scope and benchmark
  call-graph confirmation still passes.
- Promotion verification: a read-only adversary review must reject fixture
  special-casing, configured-distance bypass, semantic change, evaluator
  leakage, or measurements of different builds before recommending promotion.
- Terminal checkout: restore exact candidate, require tracked-clean detached
  worktree, leave it available for parent verification, and do not merge,
  cherry-pick, push, or alter master source.
- Preregistration: `experiments/p1-holdout-node24/PREREGISTRATION.md`.

### P1 Node 24 holdout setup attempt 1

- Preregistration commit:
  `7aa94a147d98d819ffdecce55a037699f9198da5`.
- Classification:
  `invalid setup procedure; holdout data unopened; candidate not evaluated`.
- Identity and integrity: the detached holdout worktree was exact candidate
  `b92885d4f0fea7c1d985959bdde07c17a95ebada`, whose exact parent was baseline
  `31fac31e193ea790cda6d1ff09223f4049d6ed6c`; ancestry, evaluator seal,
  exact two-file source scope, and exact one-call benchmark call graph passed.
- Node.js 24 proof: `nvm use 24.16.0` reported
  `Now using node v24.16.0 (64-bit)`, and `node --version` reported
  exact `v24.16.0`.
- First gate: `npx tsc --noEmit` failed with exact leading error
  `This is not the tsc command you are looking for`; the error said to use
  `npm install typescript` first or use `yarn`. The clean detached worktree
  did not contain installed TypeScript.
- Not run: `npm test`, `npm run build`,
  `npx tsc -p tsconfig.benchmarks.json`, and all ten benchmark timing commands.
- Data: no Node.js 24 raw JSON file was created or opened; there are no
  holdout medians, paired differences, interval, or performance decision.
- No salvage: no dependency install, retry, replacement command, alternate
  worktree, source/test/evaluator edit, merge, cherry-pick, push, or Ward
  command occurred.
- Node.js 22 restoration proof: `nvm use 22.18.0` reported
  `Now using node v22.18.0 (64-bit)`, and `node --version` reported exact
  `v22.18.0`.
- Terminal candidate/worktree proof: detached `HEAD` remained exact candidate
  `b92885d4f0fea7c1d985959bdde07c17a95ebada`, and
  `git status --porcelain=v1` produced no output. The clean detached worktree
  remains available.
- Record: `reports/geospace-p1-node24-holdout-attempt-1.md`.
- Next action: `new preregistration with npm ci before gates`.

### Corrected P1 Node 24 holdout v2 preregistration

- Status: preregistered only; no Node.js 24 setup, gate, benchmark command, or
  holdout data was opened before this record.
- Attempt 1 remains classified exactly as
  `invalid setup procedure; holdout data unopened; candidate not evaluated`;
  its frozen procedure will not be retried.
- Exact integration, baseline, and candidate identities:
  `e33fb9b7e184f9ed13cce0f606f0e6f271c274ad`,
  `31fac31e193ea790cda6d1ff09223f4049d6ed6c`, and
  `b92885d4f0fea7c1d985959bdde07c17a95ebada`.
- Isolated checkout: existing clean detached worktree
  `C:\Users\Q\src\audiom\geospace-p1-holdout` at the exact candidate.
- Runtime and setup: switch from verified host Node.js `v22.18.0` to exact
  `v24.16.0`; run `npm ci`; require tracked-clean candidate state and local
  `node_modules/.bin/tsc` before any gate; restore exact `v22.18.0`
  unconditionally, including on failure.
- Package-lock identity: candidate blob
  `69678c6fd1875e9432cbb0fff863a60fe3caa8c7`.
- Candidate gates, in order: `npx tsc --noEmit`, `npm test`,
  `npm run build`, and `npx tsc -p tsconfig.benchmarks.json`.
- Target and runs: exact
  `polygon-to-polygon distance, 128 x 128 vertices`; five alternating
  baseline/candidate pairs, each rebuilt by `npm run benchmark`, with no
  retry or replacement of a failed timing.
- Raw evidence paths:
  `experiments/p1-holdout-node24-v2/baseline-1.json` through `baseline-5.json`
  and `candidate-1.json` through `candidate-5.json`.
- Analysis: byte-identical reuse of committed
  `experiments/p1-full/summarize.mjs`, blob
  `f21c9a43500f6e058b6fd07227ed092c6233efda`; pass only if the candidate
  median of five medians is at least 10% lower and the unrounded paired 95%
  interval using `t = 2.7764451051977987` has upper endpoint below zero.
- Seals: evaluator diff empty; exact candidate scope only
  `src/geometry.tests.ts` and `src/geometry.ts`; exactly one target benchmark
  call using the two 128-vertex fixtures; affected non-holdout set empty.
- Promotion review: read-only adversary check for fixture special-casing,
  configured-distance bypass, semantic change, evaluator leakage,
  baseline/candidate build mismatch, and measurement artifact.
- Terminal constraints: restore exact candidate and tracked-clean detached
  state; leave the worktree for parent verification; do not merge,
  cherry-pick, push, alter master source, or stage `node_modules` or any
  pre-existing dirty/untracked path.
- Preregistration:
  `experiments/p1-holdout-node24-v2/PREREGISTRATION.md`.
- Exact next action: commit this frozen preregistration and ledger entry with
  subject `experiments: preregister corrected Node 24 P1 holdout`, then begin
  the exact Node.js 24 setup sequence.

### Corrected P1 Node 24 holdout v2 result

- Corrected preregistration commit:
  `0853a3377d8b7cc2613618db226e81dc8c8ea52c`.
- Setup: exact Node.js `v24.16.0`; `npm ci` passed from candidate lock blob
  `69678c6fd1875e9432cbb0fff863a60fe3caa8c7`; tracked status was clean and
  local `node_modules/.bin/tsc` existed before the gates.
- Candidate gates: `npx tsc --noEmit`, `npm test` (5 files, 76 tests),
  `npm run build`, and `npx tsc -p tsconfig.benchmarks.json` all passed in the
  fixed order.
- Measurements: all ten exact alternating commands succeeded with their
  required restores, invariant checks, and rebuilds; none was retried or
  replaced.
- Baseline run medians:
  `669.7000000000344`, `681.1000000000149`, `648.6999999999625`,
  `676.9499999999766`, and `666.7999999999665 us`.
- Candidate run medians:
  `204.90000000006603`, `205.80000000001064`, `206.39999999997372`,
  `202.40000000001146`, and `212.59999999995216 us`.
- Median of medians: `669.7000000000344 us` baseline and
  `205.80000000001064 us` candidate; unrounded change
  `-69.26982230849633%`.
- Paired differences:
  `-464.79999999996835`, `-475.3000000000043`, `-442.2999999999888`,
  `-474.54999999996517`, and `-454.20000000001437 us`.
- Fixed paired interval: mean `-462.2299999999882 us`, sample standard
  deviation `14.061454405566533 us`, and two-sided 95% interval
  `[-479.6896016977639, -444.77039830221247] us`.
- Performance decision: PASS. Both frozen unrounded conditions passed.
- Adversary: no project `CLAUDE.md` exists, so project-principle mapping is a
  GAP. The six explicit checks found no promotion-rejecting fixture
  special-casing, configured-distance bypass, semantic change, evaluator
  leakage, build mismatch, or measurement artifact.
- Verifier decision: recommend promotion of exact candidate
  `b92885d4f0fea7c1d985959bdde07c17a95ebada` to the parent promotion actor.
  No integration action was performed here.
- Terminal proof: detached holdout remained tracked-clean at exact candidate;
  host runtime was restored and verified exact `v22.18.0`; worktree remains
  available for parent verification.
- Evidence: `reports/geospace-p1-node24-holdout-v2.md` and the ten raw JSON
  files under `experiments/p1-holdout-node24-v2/`.
