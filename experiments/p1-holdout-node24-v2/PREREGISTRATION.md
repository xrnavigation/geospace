# Corrected P1 Node 24 holdout preregistration

Status: preregistered only. This is a new procedure after attempt 1 was
classified exactly as `invalid setup procedure; holdout data unopened;
candidate not evaluated`. Attempt 1's frozen procedure will not be retried.
No Node.js 24 setup, gate, benchmark command, or holdout data was opened before
this record was committed.

## Fixed identities and verified pre-setup state

- Integration branch and commit: `master` at exact
  `e33fb9b7e184f9ed13cce0f606f0e6f271c274ad`.
- Runtime for setup, gates, and measurements: exact Node.js `v24.16.0`.
- Runtime to restore unconditionally, including after failure: exact Node.js
  `v22.18.0`.
- Baseline commit: `31fac31e193ea790cda6d1ff09223f4049d6ed6c`.
- Candidate commit: `b92885d4f0fea7c1d985959bdde07c17a95ebada`.
- Candidate parent: exact baseline
  `31fac31e193ea790cda6d1ff09223f4049d6ed6c`.
- Candidate is not reachable from `master`.
- Existing isolated worktree:
  `C:\Users\Q\src\audiom\geospace-p1-holdout`, detached, tracked-clean,
  and at exact candidate `b92885d4f0fea7c1d985959bdde07c17a95ebada`.
- Exact candidate `package-lock.json` Git blob:
  `69678c6fd1875e9432cbb0fff863a60fe3caa8c7`.
- Target row: exact
  `polygon-to-polygon distance, 128 x 128 vertices`.

Before `nvm use 24.16.0`, repeat the following checks and stop on any mismatch:

```text
git -C C:\Users\Q\src\audiom\geospace branch --show-current
git -C C:\Users\Q\src\audiom\geospace rev-parse HEAD^
git -C C:\Users\Q\src\audiom\geospace log -1 --pretty=%s
git -C C:\Users\Q\src\audiom\geospace diff --name-only e33fb9b7e184f9ed13cce0f606f0e6f271c274ad HEAD
git branch --show-current
git rev-parse HEAD
git status --porcelain=v1
git rev-parse HEAD^
git merge-base --is-ancestor 31fac31e193ea790cda6d1ff09223f4049d6ed6c b92885d4f0fea7c1d985959bdde07c17a95ebada
git -C C:\Users\Q\src\audiom\geospace merge-base --is-ancestor b92885d4f0fea7c1d985959bdde07c17a95ebada master
git rev-parse b92885d4f0fea7c1d985959bdde07c17a95ebada:package-lock.json
node --version
```

Required main-worktree results are branch `master`, exact preregistration
parent `e33fb9b7e184f9ed13cce0f606f0e6f271c274ad`, subject
`experiments: preregister corrected Node 24 P1 holdout`, and exactly the two
record-only changed paths `experiments/INDEX.md` and
`experiments/p1-holdout-node24-v2/PREREGISTRATION.md`. Required holdout results
are an empty detached branch name, exact candidate `HEAD`, empty worktree
status, exact baseline parent, exit `0` for baseline ancestry, exit `1` for
candidate ancestry of `master`, exact package-lock blob `69678c6f...`, and
exact host runtime `v22.18.0`.

## Frozen evaluator, scope, and call-graph seals

The evaluator identities are frozen as:

- candidate `benchmarks/` tree:
  `05a16c1b8dbb6627dd59c7e7a2f9d7e7c4e98397`;
- candidate `package.json` blob:
  `6bfd8a3627adc309d469e057cdadfc68ee691f8c`;
- candidate `package-lock.json` blob:
  `69678c6fd1875e9432cbb0fff863a60fe3caa8c7`;
- candidate `tsconfig.benchmarks.json` blob:
  `da517ef4d649b27df9062f0edbecd979676e8c74`;
- committed `experiments/p1-full/summarize.mjs` blob on preregistration
  `master`: `f21c9a43500f6e058b6fd07227ed092c6233efda`.

Before Node.js 24 setup, require an empty candidate diff from baseline under
`benchmarks/`, `package.json`, `package-lock.json`,
`tsconfig.benchmarks.json`, and `experiments/p1-full/summarize.mjs`. Require
the exact candidate diff to be only, in this output order:

```text
src/geometry.tests.ts
src/geometry.ts
```

Require `rg -n --fixed-strings "polygonToPolygonDistance" benchmarks` to
report exactly one benchmark call, at `benchmarks/core.bench.ts:104`, inside
the exact target row. The fixtures are exactly `polygon128A` and
`polygon128B`, each constructed from `regularPolygon(128, ...)`. Therefore the
affected non-holdout benchmark set is frozen as empty. Any seal, scope, or
call-graph mismatch stops the procedure before Node.js 24 setup.

No source, test, benchmark evaluator, package file, TypeScript configuration,
or committed summarizer may be edited during this procedure.

## Corrected setup and candidate gates

In the detached holdout worktree, execute:

```text
nvm use 24.16.0
node --version
npm ci
git status --porcelain=v1 --untracked-files=no
Test-Path -LiteralPath 'node_modules/.bin/tsc' -PathType Leaf
```

The Node version must be exactly `v24.16.0`; `npm ci` must exit `0`; tracked
status must be empty; and the local `node_modules/.bin/tsc` path must exist
before any gate. `node_modules` is expected untracked setup output and must
not be staged or committed. A setup or pre-timing failure stops before holdout
data and is recorded precisely as
`invalid setup: <failed step>; holdout data unopened; candidate not evaluated`.
Do not retry or substitute the failed step.

Only after setup passes, run these candidate gates in exact order:

```text
npx tsc --noEmit
npm test
npm run build
npx tsc -p tsconfig.benchmarks.json
```

Any failed gate stops before timing with the same precise invalid-setup form.
Do not run a later gate after a failure.

## Five fixed alternating pairs

Run exactly five alternating baseline/candidate pairs in order: baseline 1,
candidate 1, through baseline 5, candidate 5. Every `npm run benchmark`
rebuilds after its immediately preceding restore. No failed timing command may
be retried, replaced, or omitted.

After every restore and before its timed command, require both commands to
exit `0`:

```text
git diff --quiet -- . ':(exclude)src/geometry.ts' ':(exclude)src/geometry.tests.ts'
git diff --cached --quiet
```

Execute this exact sequence in the detached worktree:

```text
git restore --source=31fac31e193ea790cda6d1ff09223f4049d6ed6c -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-holdout-node24-v2\baseline-1.json
git restore --source=b92885d4f0fea7c1d985959bdde07c17a95ebada -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-holdout-node24-v2\candidate-1.json
git restore --source=31fac31e193ea790cda6d1ff09223f4049d6ed6c -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-holdout-node24-v2\baseline-2.json
git restore --source=b92885d4f0fea7c1d985959bdde07c17a95ebada -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-holdout-node24-v2\candidate-2.json
git restore --source=31fac31e193ea790cda6d1ff09223f4049d6ed6c -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-holdout-node24-v2\baseline-3.json
git restore --source=b92885d4f0fea7c1d985959bdde07c17a95ebada -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-holdout-node24-v2\candidate-3.json
git restore --source=31fac31e193ea790cda6d1ff09223f4049d6ed6c -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-holdout-node24-v2\baseline-4.json
git restore --source=b92885d4f0fea7c1d985959bdde07c17a95ebada -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-holdout-node24-v2\candidate-4.json
git restore --source=31fac31e193ea790cda6d1ff09223f4049d6ed6c -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-holdout-node24-v2\baseline-5.json
git restore --source=b92885d4f0fea7c1d985959bdde07c17a95ebada -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-holdout-node24-v2\candidate-5.json
```

A failed timing rejects the holdout and ends measurement immediately without
retry or replacement. Preserve any successfully produced fixed raw files as
evidence.

## Fixed calculation and decision

Reuse committed `experiments/p1-full/summarize.mjs` without changing its
bytes. Because that evaluator reads raw files beside its own module, copy it
temporarily to
`experiments/p1-holdout-node24-v2/summarize.mjs`, require
`git hash-object experiments/p1-holdout-node24-v2/summarize.mjs` to equal
`f21c9a43500f6e058b6fd07227ed092c6233efda`, execute it once with
`node experiments/p1-holdout-node24-v2/summarize.mjs`, save its exact output
for the report, and remove only that temporary copy. It must not be committed.

The unchanged evaluator computes five baseline run medians, five candidate run
medians, both medians of medians, the unrounded percentage change, five paired
differences `candidate_i - baseline_i`, their mean, their sample standard
deviation with denominator `n - 1`, and the unrounded two-sided 95% paired
interval using fixed `t = 2.7764451051977987`.

The holdout passes only if both unrounded conditions hold:

1. the candidate median of five medians is at least 10% lower than baseline;
2. the fixed paired-interval upper endpoint is below `0 us`.

An invalid raw file, calculation failure, failed threshold, failed interval,
or failed terminal check rejects the holdout.

## Adversary and terminal requirements

Before recommending promotion, perform a read-only review of the exact
baseline-to-candidate source/test diff and the frozen evaluator. Cite evidence
for each of these attempted alternative explanations:

- fixture special-casing;
- configured-distance bypass;
- semantic change;
- evaluator leakage;
- baseline/candidate build mismatch;
- measurement artifact.

After timing or any failure, restore `src/geometry.ts` and
`src/geometry.tests.ts` from exact candidate
`b92885d4f0fea7c1d985959bdde07c17a95ebada`. Require detached `HEAD` to remain
that exact candidate and `git status --porcelain=v1 --untracked-files=no` to
be empty. Leave the holdout worktree available for parent verification.

Unconditionally run `nvm use 22.18.0`, including on failure, and require
`node --version` to output exact `v22.18.0` before finishing.

Record a completed measurement in
`reports/geospace-p1-node24-holdout-v2.md` and `experiments/INDEX.md`, then
commit only the ten fixed raw JSON files, report, and ledger with subject
`experiments: record corrected Node 24 P1 holdout`. On a pre-timing failure,
commit only a precise invalid-setup report and ledger. On a timing failure,
commit only successfully produced fixed raw files, the failure report, and
ledger. Do not make a self-hash ceremony commit. Do not stage `node_modules`
or any pre-existing dirty/untracked path. Do not merge, cherry-pick, push, or
alter `master` source.
