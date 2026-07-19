# Initial Geospace benchmark baseline

Date: 2026-07-18

Status: committed baseline evidence; no optimization source change was present.

## Provenance

- Benchmark workload commit: `3086677` (`bench: add representative performance suite`)
- Summarizer commit: `5ed52c1` (`bench: summarize repeated benchmark runs`)
- Measured checkout: `5ed52c15ced4f1ab096f635879f67ed157cd182c`
- Node.js: `v22.18.0`
- npm: `10.9.3`
- OS: Microsoft Windows 11 Pro `10.0.26200` build `26200`
- CPU: AMD Ryzen 9 5950X, 16 cores, 32 logical processors, reported maximum clock 3401 MHz

Evaluator object hashes at the measured checkout:

- `benchmarks/core.bench.ts`: `8feebabd6dfa734e7c7d473d212efce0cd3dac54`
- `package.json`: `6bfd8a3627adc309d469e057cdadfc68ee691f8c`
- `tsconfig.benchmarks.json`: `da517ef4d649b27df9062f0edbecd979676e8c74`
- `benchmarks/summarize.mjs`: `9e7c6bdda62f8eb63c23d0d75f0139ab40c2f5e5`

## Run plan

Five complete sequential runs used the same command shape and fixed workloads:

```text
npm run benchmark -- --outputJson=benchmarks/baselines/3086677-node22-windows-run-N.json
```

No run was discarded or repeated. The summary uses the median of each run's Tinybench median, the minimum-to-maximum range of those five run medians, and the median reported relative margin of error.

## Results

| Benchmark | Median of run medians | Run-median range | Median RME |
| --- | ---: | ---: | ---: |
| point-to-polygon distance, 256 vertices | 1.60 us | 1.60 us - 1.70 us | 0.31% |
| polygon-to-polygon distance, 128 x 128 vertices | 807.80 us | 747.90 us - 936.95 us | 1.16% |
| affine transform, 256-vertex polygon | 3.40 us | 2.80 us - 3.70 us | 1.19% |
| raycastAll, 256 line segments | 4.40 us | 4.00 us - 5.70 us | 1.38% |
| R-tree bulk load, 10,000 points | 2.526 ms | 2.067 ms - 4.416 ms | 5.72% |
| R-tree search, 441 matches | 6.40 us | 5.90 us - 10.80 us | 0.89% |
| R-tree nearest 10 | 3.20 us | 3.00 us - 5.00 us | 0.88% |
| GeoJSON circle encode, 128 segments | 3.00 us | 2.80 us - 4.80 us | 1.11% |
| GeoJSON polygon decode, 256 vertices | 3.50 us | 3.30 us - 4.50 us | 1.38% |

## Observations

- Polygon-to-polygon distance is the longest non-construction geometry workload in the suite.
- R-tree bulk load has the widest absolute spread and the highest median within-run RME. A candidate on that row needs paired repeated runs and a margin large enough to clear the observed noise.
- Run 2 slowed broadly across unrelated rows, and run 5 particularly slowed R-tree bulk load. Both are retained as environment-noise evidence.
- These results establish the noise floor and do not by themselves identify a causal bottleneck or authorize an optimization.

## Raw evidence

- `3086677-node22-windows-run-1.json`
- `3086677-node22-windows-run-2.json`
- `3086677-node22-windows-run-3.json`
- `3086677-node22-windows-run-4.json`
- `3086677-node22-windows-run-5.json`
