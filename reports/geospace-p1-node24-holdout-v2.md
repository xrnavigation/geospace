# Corrected P1 Node 24 holdout verification

## Decision

- Holdout result: **PASS**.
- Verifier decision: **recommend promotion of exact candidate
  `b92885d4f0fea7c1d985959bdde07c17a95ebada` to the parent promotion actor**.
- Integration state: not promoted here. No merge, cherry-pick, push, rebase, or
  master source change was performed.
- Attempt 1 remains classified exactly as
  `invalid setup procedure; holdout data unopened; candidate not evaluated`.
  Its frozen procedure was not retried.
- Corrected preregistration commit:
  `0853a3377d8b7cc2613618db226e81dc8c8ea52c`.

## Frozen identities and pre-setup verification

Before any Node.js 24 command or dependency installation, the verifier
independently confirmed:

- pre-preregistration `master`:
  `e33fb9b7e184f9ed13cce0f606f0e6f271c274ad`;
- baseline: `31fac31e193ea790cda6d1ff09223f4049d6ed6c`;
- candidate: `b92885d4f0fea7c1d985959bdde07c17a95ebada`;
- candidate's exact parent was the baseline;
- baseline was an ancestor of candidate (exit `0`);
- candidate was not reachable from `master` (exit `1`);
- candidate source delta was exactly, in output order,
  `src/geometry.tests.ts` and `src/geometry.ts`;
- the evaluator diff was empty under `benchmarks/`, `package.json`,
  `package-lock.json`, `tsconfig.benchmarks.json`, and
  `experiments/p1-full/summarize.mjs`;
- the benchmark call graph contained exactly one
  `polygonToPolygonDistance` call, the exact target at
  `benchmarks/core.bench.ts:104`, using `polygon128A` and `polygon128B`, each
  constructed from 128 vertices;
- affected non-holdout benchmark set: empty;
- existing detached worktree
  `C:\Users\Q\src\audiom\geospace-p1-holdout` was clean at exact candidate;
- host runtime was exact Node.js `v22.18.0`.

Frozen identities:

| Artifact | Git identity |
| --- | --- |
| candidate `benchmarks/` | `05a16c1b8dbb6627dd59c7e7a2f9d7e7c4e98397` |
| candidate `package.json` | `6bfd8a3627adc309d469e057cdadfc68ee691f8c` |
| candidate `package-lock.json` | `69678c6fd1875e9432cbb0fff863a60fe3caa8c7` |
| candidate `tsconfig.benchmarks.json` | `da517ef4d649b27df9062f0edbecd979676e8c74` |
| committed `experiments/p1-full/summarize.mjs` | `f21c9a43500f6e058b6fd07227ed092c6233efda` |

After the preregistration commit, the frozen checks were repeated. The
preregistration commit's parent was exact `e33fb9b...`, its subject was exact,
and its delta contained only `experiments/INDEX.md` and
`experiments/p1-holdout-node24-v2/PREREGISTRATION.md`. All holdout identity,
ancestry, evaluator, scope, call-graph, package-lock, worktree, and host-runtime
checks passed again before Node.js 24 setup.

## Corrected setup and candidate gates

Setup succeeded in exact order:

1. `nvm use 24.16.0` reported
   `Now using node v24.16.0 (64-bit)`.
2. `node --version` reported exact `v24.16.0`.
3. `npm ci` exited `0`, installed 47 packages, and used the frozen candidate
   lockfile.
4. `git status --porcelain=v1 --untracked-files=no` produced no output.
5. local `node_modules/.bin/tsc` existed.

`node_modules` remained setup output and was not staged or committed.

All four candidate gates passed in the fixed order:

1. `npx tsc --noEmit`;
2. `npm test`: 5 files and 76 tests passed;
3. `npm run build`;
4. `npx tsc -p tsconfig.benchmarks.json`.

## Ten fixed measurements

All ten `npm run benchmark` commands succeeded in exact alternating order.
Every run followed its exact restore and both required invariant checks; every
command rebuilt the restored source. No timing was retried, replaced, omitted,
or stopped early.

| Pair | Baseline median (us) | Candidate median (us) | Candidate - baseline (us) |
| ---: | ---: | ---: | ---: |
| 1 | 669.7000000000344 | 204.90000000006603 | -464.79999999996835 |
| 2 | 681.1000000000149 | 205.80000000001064 | -475.3000000000043 |
| 3 | 648.6999999999625 | 206.39999999997372 | -442.2999999999888 |
| 4 | 676.9499999999766 | 202.40000000001146 | -474.54999999996517 |
| 5 | 666.7999999999665 | 212.59999999995216 | -454.20000000001437 |

The unchanged summarizer was copied byte-for-byte beside the v2 raw files,
verified as exact blob `f21c9a43...`, executed once, and removed. It produced:

- baseline median of five medians: `669.7000000000344 us`;
- candidate median of five medians: `205.80000000001064 us`;
- unrounded change: `-69.26982230849633%`;
- mean paired difference: `-462.2299999999882 us`;
- sample standard deviation: `14.061454405566533 us`;
- fixed two-sided 95% paired interval:
  `[-479.6896016977639, -444.77039830221247] us`.

The candidate median is at least 10% lower, and the unrounded paired-interval
upper endpoint is below zero. Both frozen performance conditions pass.

Raw evidence is committed at
`experiments/p1-holdout-node24-v2/baseline-1.json` through `baseline-5.json`
and `candidate-1.json` through `candidate-5.json`.

## Read-only adversary review

Ward was skipped as explicitly instructed.

PRINCIPLE: GAP. No project `CLAUDE.md` was present in the repository or the
searched parent hierarchy, so the adversary protocol had no project-principle
text to quote or map directionally.

ARTIFACT: exact baseline-to-candidate diff in `src/geometry.ts` and
`src/geometry.tests.ts`; sealed benchmark evaluator and configuration; all ten
raw holdout files; exact build commands and outputs.

FINDING 1: fixture special-casing — no rejecting evidence.

- The production implementation at candidate `src/geometry.ts:833` iterates
  `a.exterior.length` and `b.exterior.length`; it contains no benchmark
  constants `128`, `100`, or `220`.
- The candidate tests include both the benchmark geometry and unrelated
  intersection, containment, collinear, degenerate-edge, and custom-distance
  cases (`src/geometry.tests.ts:143-229`). A benchmark-specific test exists,
  but the production path is generic rather than fixture-selected.

FINDING 2: configured-distance bypass — no rejecting evidence.

- Candidate `src/geometry.ts:860` uses the allocation-light direct arithmetic
  only when the configured function is exactly `euclideanDistance`.
- The alternate path continues to call `this.distanceFunc` for each projected
  point/endpoint candidate. The focused doubled-distance contract at
  `src/geometry.tests.ts:219-229` passed under Node.js 24.

FINDING 3: semantic change — no demonstrated semantic regression.

- The initial `this.intersects(a, b)` zero-distance contract remains in place.
- The 76-test suite passed, including separated, intersecting, contained,
  collinear, degenerate-edge, and configured-distance polygon contracts.
- The source delta is confined to the one method and those focused tests. No
  public signature or other geometry path changed.

FINDING 4: evaluator leakage — rejected as an explanation.

- Candidate evaluator diff from baseline was empty for all frozen evaluator
  and configuration paths.
- The ten raw files each contain exactly the frozen target row, and the
  unchanged summarizer rejects any file with another or additional row.

FINDING 5: baseline/candidate build mismatch — rejected as an explanation.

- Every timing command used `npm run benchmark`, whose frozen script rebuilds
  before benchmark compilation and execution.
- Baseline restores consistently built the 55.41 kB ES bundle; candidate
  restores consistently built the 60.76 kB ES bundle. Those distinct stable
  sizes show each timing measured its immediately restored source.

FINDING 6: measurement artifact — rejected as a plausible explanation for the
observed pass.

- Five alternating paired runs were completed without retry.
- Per-run RME was 0.21%-0.85%, while every paired improvement was
  442.30-475.30 us.
- All five paired differences were negative, and the fixed interval's upper
  endpoint was `-444.77039830221247 us`, far below zero.

ADVERSARY VERDICT: the project-principle check is `GAP` because no principle
file exists; the six explicit promotion alternative-explanation checks found
no promotion-rejecting evidence.

## Terminal proof

- The candidate files were restored from exact candidate
  `b92885d4f0fea7c1d985959bdde07c17a95ebada`.
- Detached `HEAD` remained exact candidate.
- `git status --porcelain=v1 --untracked-files=no` produced no output.
- The holdout worktree remains available for parent verification.
- `nvm use 22.18.0` reported
  `Now using node v22.18.0 (64-bit)`.
- Final `node --version` reported exact `v22.18.0`.
- No source, test, evaluator, benchmark definition, package configuration, or
  master source was edited by the verifier.
- No Ward command, merge, cherry-pick, rebase, push, or promotion action was
  performed.
