import { readFileSync } from "node:fs";

const resultPaths = process.argv.slice(2);

if (resultPaths.length === 0) {
  console.error(
    "Usage: node benchmarks/summarize.mjs <benchmark-result.json> [...]",
  );
  process.exitCode = 1;
} else {
  const runs = resultPaths.map(readRun);
  const benchmarkNames = [...runs[0].keys()];

  for (const run of runs.slice(1)) {
    const names = [...run.keys()];
    if (
      names.length !== benchmarkNames.length ||
      names.some((name, index) => name !== benchmarkNames[index])
    ) {
      throw new Error("Benchmark result files contain different rows or order");
    }
  }

  console.log(`Runs: ${runs.length}`);
  console.log("");
  console.log(
    "| Benchmark | Median of run medians | Run-median range | Median RME |",
  );
  console.log("| --- | ---: | ---: | ---: |");

  for (const name of benchmarkNames) {
    const results = runs.map((run) => run.get(name));
    const medians = results.map((result) => result.median);
    const relativeMargins = results.map((result) => result.rme);
    console.log(
      `| ${name} | ${formatMilliseconds(median(medians))} | ${formatMilliseconds(Math.min(...medians))} - ${formatMilliseconds(Math.max(...medians))} | ${median(relativeMargins).toFixed(2)}% |`,
    );
  }
}

function readRun(resultPath) {
  const result = JSON.parse(readFileSync(resultPath, "utf8"));
  const rows = new Map();

  for (const file of result.files) {
    for (const group of file.groups) {
      for (const benchmark of group.benchmarks) {
        rows.set(`${group.fullName} > ${benchmark.name}`, {
          median: benchmark.median,
          rme: benchmark.rme,
        });
      }
    }
  }

  if (rows.size === 0) {
    throw new Error(`No benchmark rows found in ${resultPath}`);
  }

  return rows;
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[midpoint - 1] + sorted[midpoint]) / 2
    : sorted[midpoint];
}

function formatMilliseconds(value) {
  if (value < 0.001) {
    return `${(value * 1_000_000).toFixed(2)} ns`;
  }
  if (value < 1) {
    return `${(value * 1_000).toFixed(2)} us`;
  }
  return `${value.toFixed(3)} ms`;
}
