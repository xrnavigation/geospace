# P1 Node 24 holdout preregistration

Status: preregistered only. No Node.js 24 gate, benchmark command, or holdout
data has been opened or executed for this record.

## Fixed identities and isolated worktree

- Runtime: exact Node.js `v24.16.0`, already installed under NVM.
- Baseline commit: `31fac31e193ea790cda6d1ff09223f4049d6ed6c`.
- Candidate commit: `b92885d4f0fea7c1d985959bdde07c17a95ebada`.
- Worktree: a clean detached worktree at
  `C:\Users\Q\src\audiom\geospace-p1-holdout`, created at exact candidate
  `b92885d4f0fea7c1d985959bdde07c17a95ebada` only after this preregistration
  is committed. If that path already exists, stop rather than substitute.
- Target row: exact
  `polygon-to-polygon distance, 128 x 128 vertices`.

Before any Node.js 24 gate or timing, require the detached worktree to report
an empty branch name, exact candidate `HEAD`, and no tracked changes:

```text
git branch --show-current
git rev-parse HEAD
git status --porcelain=v1 --untracked-files=no
```

Run `nvm use 24.16.0`, then require `node --version` to output exactly
`v24.16.0`. Any identity, worktree, runtime, integrity, evaluator, scope, or
gate failure rejects the holdout without timing; do not salvage it.

## Fixed integrity, evaluator, and scope gates

Require candidate `b92885d4f0fea7c1d985959bdde07c17a95ebada` to have exact parent
baseline `31fac31e193ea790cda6d1ff09223f4049d6ed6c`, and require baseline to be
an ancestor of candidate.

The evaluator seal passes only if candidate has no diff from baseline under
`benchmarks/`, `package.json`, `tsconfig.benchmarks.json`, or the committed
summarizer `experiments/p1-full/summarize.mjs`.

The affected non-holdout set remains empty only if both confirmations still
pass before timing:

```text
git diff --name-only 31fac31e193ea790cda6d1ff09223f4049d6ed6c b92885d4f0fea7c1d985959bdde07c17a95ebada
rg -n --fixed-strings "polygonToPolygonDistance" benchmarks
```

The candidate diff must be exactly `src/geometry.tests.ts` and
`src/geometry.ts`. The committed benchmark suite must contain exactly the
target-row call to `polygonToPolygonDistance` in `benchmarks/core.bench.ts`
and no other benchmark call. Otherwise reject without timing.

## Fixed candidate gates

On exact candidate under exact Node.js `v24.16.0`, run these gates in this
order before timing:

```text
npx tsc --noEmit
npm test
npm run build
npx tsc -p tsconfig.benchmarks.json
```

Any failure rejects the holdout without timing and without running later
gates.

## Five fixed alternating pairs

Run exactly five alternating baseline/candidate pairs in order: baseline 1,
candidate 1, through baseline 5, candidate 5. Every `npm run benchmark`
rebuilds after its immediately preceding restore. No failed timing command may
be retried or replaced.

After each restore and before its timing command, require both commands to
exit `0`:

```text
git diff --quiet -- . ':(exclude)src/geometry.ts' ':(exclude)src/geometry.tests.ts'
git diff --cached --quiet
```

Execute the following sequence literally in the detached holdout worktree:

```text
git restore --source=31fac31e193ea790cda6d1ff09223f4049d6ed6c -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-holdout-node24\baseline-1.json
git restore --source=b92885d4f0fea7c1d985959bdde07c17a95ebada -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-holdout-node24\candidate-1.json
git restore --source=31fac31e193ea790cda6d1ff09223f4049d6ed6c -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-holdout-node24\baseline-2.json
git restore --source=b92885d4f0fea7c1d985959bdde07c17a95ebada -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-holdout-node24\candidate-2.json
git restore --source=31fac31e193ea790cda6d1ff09223f4049d6ed6c -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-holdout-node24\baseline-3.json
git restore --source=b92885d4f0fea7c1d985959bdde07c17a95ebada -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-holdout-node24\candidate-3.json
git restore --source=31fac31e193ea790cda6d1ff09223f4049d6ed6c -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-holdout-node24\baseline-4.json
git restore --source=b92885d4f0fea7c1d985959bdde07c17a95ebada -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-holdout-node24\candidate-4.json
git restore --source=31fac31e193ea790cda6d1ff09223f4049d6ed6c -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-holdout-node24\baseline-5.json
git restore --source=b92885d4f0fea7c1d985959bdde07c17a95ebada -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-holdout-node24\candidate-5.json
```

The ten fixed raw files are
`experiments/p1-holdout-node24/baseline-1.json` through `baseline-5.json` and
`candidate-1.json` through `candidate-5.json` in the main worktree.

## Fixed calculation and decision

Reuse the committed `experiments/p1-full/summarize.mjs` without modification
for the exact calculations over `experiments/p1-holdout-node24`:

- five baseline run medians and five candidate run medians in microseconds;
- baseline and candidate medians of those five medians;
- unrounded percentage change;
- five paired differences `candidate_i - baseline_i`;
- paired mean and sample standard deviation with denominator `n - 1`;
- unrounded two-sided 95% paired-difference interval using fixed
  `t = 2.7764451051977987`.

The holdout passes only if both unrounded conditions hold:

1. candidate median of five medians is at least 10% lower than baseline; and
2. the fixed interval upper endpoint is below zero.

Any failed timing command, invalid raw file, failed calculation, failed
threshold, or failed terminal check rejects the holdout. Do not retry or
replace a failed timing command.

## Adversary and terminal requirements

Before recommending promotion, perform a read-only adversary review of the
exact source diff for fixture special-casing, configured-distance bypass,
changed semantics, evaluator leakage, or a result explained by measuring
different builds. Cite specific evidence. Do not add tests or code.

After timing, restore `src/geometry.ts` and `src/geometry.tests.ts` from exact
candidate `b92885d4f0fea7c1d985959bdde07c17a95ebada`. The detached holdout
worktree must end tracked-clean at that exact candidate and remain available
for parent verification.

Always restore the host runtime with `nvm use 22.18.0`, including on failure,
and require `node --version` to output exactly `v22.18.0` before finishing.

Record the result in `reports/geospace-p1-node24-holdout.md` and append a
holdout/promotion-verification entry to `experiments/INDEX.md`. Commit only the
ten raw JSON files, report, and ledger update with subject
`experiments: record Node 24 P1 holdout`. Do not merge, cherry-pick, push, or
alter master source.
