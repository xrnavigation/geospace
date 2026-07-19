# P1 full experiment preregistration

Status: preregistered only. No full-experiment slot is consumed by this
record. The first timed Node.js 22 development command consumes one of the
campaign's two full-experiment slots.

## Verified preregistration state

Before this record was edited, the main worktree
`C:\Users\Q\src\audiom\geospace` was on `master` at committed `HEAD`
`3bf5e2b10bbd6a3885ffff8d52454d6c57eaff29`. Its pre-existing dirty and
untracked paths were preserved and excluded from staging, including the
tracked modification `notes-geospace-completion.md` and the existing
untracked build, dependency, note, prompt, project, and miscellaneous paths.

The candidate worktree `C:\Users\Q\src\audiom\geospace-p1-triage` was on
`experiment/p1-segment-kernel-triage` at exact candidate
`b92885d4f0fea7c1d985959bdde07c17a95ebada` with no tracked changes. Its
parent was exact baseline `31fac31e193ea790cda6d1ff09223f4049d6ed6c`.
`git merge-base --is-ancestor
b92885d4f0fea7c1d985959bdde07c17a95ebada master` exited `1`, confirming
that the candidate was not reachable from `master`.

## Hypothesis and fixed artifacts

- Target: `polygon-to-polygon distance, 128 x 128 vertices`.
- Development runtime: Node.js `v22.18.0` only.
- Baseline commit: `31fac31e193ea790cda6d1ff09223f4049d6ed6c`.
- Candidate commit: `b92885d4f0fea7c1d985959bdde07c17a95ebada`.
- Candidate worktree: `C:\Users\Q\src\audiom\geospace-p1-triage`.
- Hypothesis: the candidate reduces the candidate median of five run medians
  by at least 10% relative to the baseline median of five run medians while
  the paired-difference interval excludes zero and all correctness gates pass.
- This consumes one of the campaign's two full-experiment slots only when the
  first timed development command is executed, not when preregistration is
  committed.

## Preconditions and correctness gates

In `C:\Users\Q\src\audiom\geospace-p1-triage`, run these precondition
commands before any gate or measurement:

```text
git branch --show-current
git rev-parse HEAD
git rev-parse HEAD^
git status --porcelain=v1 --untracked-files=no
node --version
```

The required outputs are, respectively,
`experiment/p1-segment-kernel-triage`,
`b92885d4f0fea7c1d985959bdde07c17a95ebada`,
`31fac31e193ea790cda6d1ff09223f4049d6ed6c`, no output, and `v22.18.0`.
Also run the following in `C:\Users\Q\src\audiom\geospace` and require exit
status `1`:

```text
git merge-base --is-ancestor b92885d4f0fea7c1d985959bdde07c17a95ebada master
```

If any precondition fails, reject the experiment without timing. A
precondition failure does not consume a full-experiment slot.

On the exact candidate commit, run these four correctness gates in this exact
order before timing:

```text
npx tsc --noEmit
npm test
npm run build
npx tsc -p tsconfig.benchmarks.json
```

If any gate fails, reject the experiment without timing. A gate failure does
not consume a full-experiment slot.

## Fixed affected-row confirmation

Candidate `b92885d` changes only
`GeometryEngine.polygonToPolygonDistance` and focused tests. The exact
candidate scope is `src/geometry.ts` and `src/geometry.tests.ts`. In the
committed benchmark suite, the target row is the only row that calls
`polygonToPolygonDistance`; therefore the set of affected non-holdout
benchmark rows is empty.

Before timing, confirm that this call graph and candidate scope remain
unchanged with these exact commands:

```text
git diff --name-only 31fac31e193ea790cda6d1ff09223f4049d6ed6c b92885d4f0fea7c1d985959bdde07c17a95ebada
rg -n --fixed-strings "polygonToPolygonDistance" benchmarks
```

The first command must output exactly `src/geometry.tests.ts` and
`src/geometry.ts`. The second must report exactly the target-row call in
`benchmarks/core.bench.ts` and no other benchmark call. If either confirmation
fails, reject the experiment without timing and without consuming a slot.

The campaign's `<=5%` affected-row regression gate is satisfied only by this
confirmation. Do not invent or run an unrelated full-suite regression
measurement. Correctness and configured-distance behavior remain governed by
the exact four gates and focused tests above.

## Five paired development runs

All ten timed commands run in
`C:\Users\Q\src\audiom\geospace-p1-triage`, in exact alternating order:
baseline 1, candidate 1, through baseline 5, candidate 5. `npm run benchmark`
rebuilds the package before every measurement.

After every restore and before its timed command, run these exact invariant
checks and require both to exit `0`:

```text
git diff --quiet -- . ':(exclude)src/geometry.ts' ':(exclude)src/geometry.tests.ts'
git diff --cached --quiet
```

They require no tracked change outside `src/geometry.ts` and
`src/geometry.tests.ts`, and no staged change. Then execute the following
sequence literally:

```text
git restore --source=HEAD^ -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-full\baseline-1.json
git restore --source=HEAD -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-full\candidate-1.json
git restore --source=HEAD^ -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-full\baseline-2.json
git restore --source=HEAD -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-full\candidate-2.json
git restore --source=HEAD^ -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-full\baseline-3.json
git restore --source=HEAD -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-full\candidate-3.json
git restore --source=HEAD^ -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-full\baseline-4.json
git restore --source=HEAD -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-full\candidate-4.json
git restore --source=HEAD^ -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-full\baseline-5.json
git restore --source=HEAD -- src/geometry.ts src/geometry.tests.ts
npm run benchmark -- -t "polygon-to-polygon distance, 128 x 128 vertices" --outputJson=C:\Users\Q\src\audiom\geospace\experiments\p1-full\candidate-5.json
```

Run the two invariant checks after each restore, between that restore and its
timed command. The first timed command consumes one full-experiment slot. Any
failed timed command rejects the full experiment and consumes that slot; do
not retry or replace a failed pair.

After the tenth run, restore the candidate files and require a clean tracked
candidate state:

```text
git restore --source=HEAD -- src/geometry.ts src/geometry.tests.ts
git status --porcelain=v1 --untracked-files=no
```

The final status command must produce no output.

## Fixed calculations and decision rule

Create and commit the dependency-free summarizer
`experiments/p1-full/summarize.mjs`. It must validate the exact target row in
all ten fixed raw files and compute in microseconds:

- five baseline run medians and five candidate run medians;
- baseline and candidate medians of those five medians;
- percentage change between medians of medians;
- five paired absolute differences `d_i = candidate_i - baseline_i`;
- mean paired difference `d_bar`;
- sample standard deviation `s_d` with denominator `n - 1`;
- the two-sided 95% Student t interval
  `d_bar +/- 2.7764451051977987 * s_d / sqrt(5)`.

The performance result passes only if both conditions hold:

1. the candidate median of medians is at least 10% lower than the baseline
   median of medians; and
2. the upper endpoint of the fixed paired-difference interval is below
   `0 us`.

No rounding may be used for the decision.

## Terminal states and sealed holdout

- `promotable development result`: preconditions and gates pass, both
  performance conditions pass, affected-row analysis remains valid, and the
  candidate worktree ends clean at exact candidate
  `b92885d4f0fea7c1d985959bdde07c17a95ebada`.
- `rejected full experiment`: any required gate, timed command, calculation,
  threshold, interval, scope, or terminal-state check fails.

In either outcome, commit raw JSON, summarizer, report, and ledger record on
`master`; do not alter `master` source. A promotable development result is not
promotion authority. Node.js 24 remains a sealed holdout. Do not run it,
merge, cherry-pick, push, or promote without a new user message authorizing
exact candidate `b92885d` and the Node.js 24 holdout.

## Evidence and execution records

The fixed final evidence paths are:

- `experiments/p1-full/baseline-1.json` through `baseline-5.json`;
- `experiments/p1-full/candidate-1.json` through `candidate-5.json`;
- `experiments/p1-full/summarize.mjs`;
- `reports/geospace-p1-full-experiment.md`;
- the full-experiment round entry in `experiments/INDEX.md`.

The execution worker must make two record-only commits on `master`. First,
commit only the ten raw JSON files, summarizer, report, and ledger record with
subject `experiments: record full P1 experiment`. Append that commit's full
hash to the report and ledger, then commit only the report and ledger with
subject `experiments: record full P1 artifact commit`. It must also write
uncommitted `notes-polygon-p1-full-experiment.md` and must not stage or commit
that note or any pre-existing dirty path.

Preregistration artifact commit:
`8d8175ce013c83de9ebc4da7301280836ba0717a`.
