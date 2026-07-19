import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const target = "polygon-to-polygon distance, 128 x 128 vertices";
const directory = dirname(fileURLToPath(import.meta.url));
const runCount = 5;
const tCritical = 2.7764451051977987;

async function readMedian(kind, run) {
  const filename = `${kind}-${run}.json`;
  const document = JSON.parse(await readFile(join(directory, filename), "utf8"));
  const benchmarks = document.files?.flatMap((file) =>
    file.groups?.flatMap((group) => group.benchmarks ?? []) ?? [],
  ) ?? [];

  if (benchmarks.length !== 1 || benchmarks[0].name !== target) {
    throw new Error(`${filename}: expected exactly the target benchmark row`);
  }

  const medianMilliseconds = benchmarks[0].median;
  if (!Number.isFinite(medianMilliseconds)) {
    throw new Error(`${filename}: target median is not finite`);
  }

  return medianMilliseconds * 1000;
}

function median(values) {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.floor(ordered.length / 2)];
}

const baselineRunMediansUs = [];
const candidateRunMediansUs = [];

for (let run = 1; run <= runCount; run += 1) {
  baselineRunMediansUs.push(await readMedian("baseline", run));
  candidateRunMediansUs.push(await readMedian("candidate", run));
}

const baselineMedianOfMediansUs = median(baselineRunMediansUs);
const candidateMedianOfMediansUs = median(candidateRunMediansUs);
const percentageChange =
  ((candidateMedianOfMediansUs - baselineMedianOfMediansUs) /
    baselineMedianOfMediansUs) *
  100;
const pairedDifferencesUs = candidateRunMediansUs.map(
  (candidate, index) => candidate - baselineRunMediansUs[index],
);
const meanPairedDifferenceUs =
  pairedDifferencesUs.reduce((sum, difference) => sum + difference, 0) /
  runCount;
const pairedSquaredDeviations = pairedDifferencesUs.map(
  (difference) => (difference - meanPairedDifferenceUs) ** 2,
);
const sampleStandardDeviationUs = Math.sqrt(
  pairedSquaredDeviations.reduce((sum, deviation) => sum + deviation, 0) /
    (runCount - 1),
);
const pairedMarginUs =
  (tCritical * sampleStandardDeviationUs) / Math.sqrt(runCount);
const pairedInterval95Us = [
  meanPairedDifferenceUs - pairedMarginUs,
  meanPairedDifferenceUs + pairedMarginUs,
];
const clearsTenPercent = percentageChange <= -10;
const intervalUpperBelowZero = pairedInterval95Us[1] < 0;

console.log(
  JSON.stringify(
    {
      target,
      unit: "us",
      baselineRunMediansUs,
      candidateRunMediansUs,
      baselineMedianOfMediansUs,
      candidateMedianOfMediansUs,
      percentageChange,
      pairedDifferencesUs,
      meanPairedDifferenceUs,
      sampleStandardDeviationUs,
      tCritical,
      pairedInterval95Us,
      clearsTenPercent,
      intervalUpperBelowZero,
      performancePass: clearsTenPercent && intervalUpperBelowZero,
    },
    null,
    2,
  ),
);
