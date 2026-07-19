import { readFileSync } from "node:fs";
import { join } from "node:path";

const directory = process.argv[2];
const target = "polygon-to-polygon distance, 128 x 128 vertices";

if (!directory) {
  console.error("Usage: node experiments/p1-triage/summarize.mjs <result-directory>");
  process.exitCode = 1;
} else {
  const pairs = [1, 2, 3].map((pair) => {
    const baseline = readMedian(join(directory, `baseline-${pair}.json`));
    const candidate = readMedian(join(directory, `candidate-${pair}.json`));
    return {
      pair,
      baselineMilliseconds: baseline,
      candidateMilliseconds: candidate,
      pairedPercentageChange: ((candidate - baseline) / baseline) * 100,
    };
  });

  const baselineMedianOfMedians = median(
    pairs.map((pair) => pair.baselineMilliseconds),
  );
  const candidateMedianOfMedians = median(
    pairs.map((pair) => pair.candidateMilliseconds),
  );

  console.log(
    JSON.stringify(
      {
        target,
        pairs,
        baselineMedianOfMediansMilliseconds: baselineMedianOfMedians,
        candidateMedianOfMediansMilliseconds: candidateMedianOfMedians,
        medianOfMediansPercentageChange:
          ((candidateMedianOfMedians - baselineMedianOfMedians) /
            baselineMedianOfMedians) *
          100,
      },
      null,
      2,
    ),
  );
}

function readMedian(path) {
  const result = JSON.parse(readFileSync(path, "utf8"));
  const benchmarks = result.files.flatMap((file) =>
    file.groups.flatMap((group) => group.benchmarks),
  );
  if (benchmarks.length !== 1 || benchmarks[0].name !== target) {
    throw new Error(`${path} does not contain exactly the target row`);
  }
  return benchmarks[0].median;
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}
