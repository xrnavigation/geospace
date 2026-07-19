# P1 Node 24 holdout setup attempt 1

## Classification

`invalid setup procedure; holdout data unopened; candidate not evaluated`

This record describes a setup failure before any holdout timing. It is not a
performance result and provides no promotion evidence.

## Frozen record and identities

- Holdout preregistration commit:
  `7aa94a147d98d819ffdecce55a037699f9198da5`.
- Baseline commit: `31fac31e193ea790cda6d1ff09223f4049d6ed6c`.
- Candidate commit: `b92885d4f0fea7c1d985959bdde07c17a95ebada`.
- Detached holdout worktree:
  `C:\Users\Q\src\audiom\geospace-p1-holdout`.

Before the failed gate:

- `git branch --show-current` produced no output, proving detached state.
- `git rev-parse HEAD` produced exact candidate
  `b92885d4f0fea7c1d985959bdde07c17a95ebada`.
- `git status --porcelain=v1 --untracked-files=no` produced no output.
- The candidate's exact parent was baseline
  `31fac31e193ea790cda6d1ff09223f4049d6ed6c`.
- The baseline-is-candidate-ancestor check exited `0`.
- The candidate evaluator diff from baseline under `benchmarks/`,
  `package.json`, `tsconfig.benchmarks.json`, and the committed
  `experiments/p1-full/summarize.mjs` was empty.
- The exact candidate diff was only `src/geometry.tests.ts` and
  `src/geometry.ts`.
- The committed benchmark suite contained exactly one
  `polygonToPolygonDistance` call, the target call at
  `benchmarks/core.bench.ts:104`. The affected non-holdout set remained empty.

All identity, ancestry, evaluator, source-scope, and call-graph checks passed.

## Runtime proof and failed first gate

The runtime commands produced:

```text
> nvm use 24.16.0
Now using node v24.16.0 (64-bit)
> node --version
v24.16.0
```

The first candidate gate was the exact preregistered command:

```text
npx tsc --noEmit
```

It failed before timing with this exact error text:

```text
This is not the tsc command you are looking for

To get access to the TypeScript compiler, tsc, from the command line either:

- Use npm install typescript to first add TypeScript to your project before using npx
- Use yarn to avoid accidentally running code from un-installed packages
```

The clean detached worktree did not contain installed TypeScript. No dependency
installation, gate retry, replacement command, or alternate worktree was used.

## Commands and data not run

After the failed first gate, the frozen procedure stopped. These later gates
were not run:

1. `npm test`;
2. `npm run build`;
3. `npx tsc -p tsconfig.benchmarks.json`.

None of the ten fixed benchmark timing commands ran. No Node.js 24 raw JSON
file was created or opened. No holdout median, paired difference, interval, or
performance decision exists.

## Restoration and terminal state

The candidate files were restored from exact candidate
`b92885d4f0fea7c1d985959bdde07c17a95ebada`. Terminal proof showed:

- detached holdout `HEAD` was exact candidate
  `b92885d4f0fea7c1d985959bdde07c17a95ebada`;
- `git status --porcelain=v1` produced no output, proving the worktree had no
  tracked or untracked changes;
- the worktree remained available for parent verification.

The host runtime was restored and verified:

```text
> nvm use 22.18.0
Now using node v22.18.0 (64-bit)
> node --version
v22.18.0
```

No source, test, evaluator, benchmark definition, or package configuration was
edited. No merge, cherry-pick, push, or Ward command occurred.

## Decision and next action

Decision:
`invalid setup procedure; holdout data unopened; candidate not evaluated`.

Next action: `new preregistration with npm ci before gates`.
