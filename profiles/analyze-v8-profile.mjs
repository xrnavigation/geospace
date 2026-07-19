import { readFileSync } from "node:fs";
import { basename } from "node:path";

function fail(message) {
  throw new Error(message);
}

function readJson(path, kind) {
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    fail(`Cannot read ${kind} profile ${path}: ${error.message}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`Cannot parse ${kind} profile ${path}: ${error.message}`);
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isGeometryBundleUrl(url) {
  return (
    typeof url === "string" &&
    /(?:^|[\\/])geometry\.es\.js(?:$|[?#])/.test(url)
  );
}

function validateCallFrame(callFrame, kind) {
  if (!isRecord(callFrame)) {
    fail(`${kind} profile contains a node without a call frame`);
  }
  if (typeof callFrame.functionName !== "string") {
    fail(`${kind} profile contains a call frame without a function name`);
  }
  if (typeof callFrame.url !== "string") {
    fail(`${kind} profile contains a call frame without a URL`);
  }
  if (!Number.isInteger(callFrame.lineNumber)) {
    fail(`${kind} profile contains a call frame without a line number`);
  }
  if (!Number.isInteger(callFrame.columnNumber)) {
    fail(`${kind} profile contains a call frame without a column number`);
  }
}

function functionName(callFrame) {
  return callFrame.functionName || "(anonymous)";
}

function location(callFrame) {
  const line = callFrame.lineNumber >= 0 ? callFrame.lineNumber + 1 : "?";
  const column =
    callFrame.columnNumber >= 0 ? callFrame.columnNumber + 1 : "?";
  return `geometry.es.js:${line}:${column}`;
}

function percent(part, total) {
  return `${((part / total) * 100).toFixed(2)}%`;
}

function analyzeCpu(profile) {
  if (!isRecord(profile)) {
    fail("CPU profile root is not an object");
  }
  if (!Array.isArray(profile.nodes) || profile.nodes.length === 0) {
    fail("CPU profile has no nodes");
  }
  if (!Array.isArray(profile.samples) || profile.samples.length === 0) {
    fail("CPU profile has no samples");
  }

  const nodesById = new Map();
  for (const node of profile.nodes) {
    if (!isRecord(node) || !Number.isInteger(node.id)) {
      fail("CPU profile contains a node without an integer ID");
    }
    validateCallFrame(node.callFrame, "CPU");
    if (nodesById.has(node.id)) {
      fail(`CPU profile contains duplicate node ID ${node.id}`);
    }
    nodesById.set(node.id, node);
  }

  const selfSamplesById = new Map();
  for (const nodeId of profile.samples) {
    if (!Number.isInteger(nodeId) || !nodesById.has(nodeId)) {
      fail(`CPU profile sample references unknown node ID ${nodeId}`);
    }
    selfSamplesById.set(nodeId, (selfSamplesById.get(nodeId) ?? 0) + 1);
  }

  const entries = [];
  for (const [nodeId, selfSamples] of selfSamplesById) {
    const node = nodesById.get(nodeId);
    if (selfSamples > 0 && isGeometryBundleUrl(node.callFrame.url)) {
      entries.push({ nodeId, selfSamples, callFrame: node.callFrame });
    }
  }

  if (entries.length === 0) {
    fail("CPU profile has no geometry.es.js self-sample attribution");
  }

  entries.sort(
    (left, right) =>
      right.selfSamples - left.selfSamples ||
      functionName(left.callFrame).localeCompare(functionName(right.callFrame)) ||
      left.callFrame.lineNumber - right.callFrame.lineNumber ||
      left.callFrame.columnNumber - right.callFrame.columnNumber ||
      left.nodeId - right.nodeId,
  );

  return {
    allSamples: profile.samples.length,
    relevantSamples: entries.reduce(
      (total, entry) => total + entry.selfSamples,
      0,
    ),
    entries,
  };
}

function analyzeHeap(profile) {
  if (!isRecord(profile)) {
    fail("Heap profile root is not an object");
  }
  if (!isRecord(profile.head)) {
    fail("Heap profile has no head node");
  }
  if (!Array.isArray(profile.samples)) {
    fail("Heap profile has no samples array");
  }

  const nodesById = new Map();
  const entries = [];
  let allSampledBytes = 0;
  const pending = [profile.head];

  while (pending.length > 0) {
    const node = pending.pop();
    if (!isRecord(node) || !Number.isInteger(node.id)) {
      fail("Heap profile contains a node without an integer ID");
    }
    validateCallFrame(node.callFrame, "Heap");
    if (!Number.isFinite(node.selfSize) || node.selfSize < 0) {
      fail(`Heap profile node ${node.id} has an invalid self size`);
    }
    if (!Array.isArray(node.children)) {
      fail(`Heap profile node ${node.id} has no children array`);
    }
    if (nodesById.has(node.id)) {
      fail(`Heap profile contains duplicate node ID ${node.id}`);
    }

    nodesById.set(node.id, node);
    allSampledBytes += node.selfSize;
    if (node.selfSize > 0 && isGeometryBundleUrl(node.callFrame.url)) {
      entries.push({
        nodeId: node.id,
        selfBytes: node.selfSize,
        callFrame: node.callFrame,
      });
    }
    for (let index = node.children.length - 1; index >= 0; index -= 1) {
      pending.push(node.children[index]);
    }
  }

  if (allSampledBytes <= 0) {
    fail("Heap profile contains no sampled bytes");
  }

  for (const sample of profile.samples) {
    if (
      !isRecord(sample) ||
      !Number.isFinite(sample.size) ||
      sample.size < 0 ||
      !Number.isInteger(sample.nodeId) ||
      !nodesById.has(sample.nodeId)
    ) {
      fail("Heap profile contains an invalid sample");
    }
  }

  if (entries.length === 0) {
    fail("Heap profile has no geometry.es.js sampled-byte attribution");
  }

  entries.sort(
    (left, right) =>
      right.selfBytes - left.selfBytes ||
      functionName(left.callFrame).localeCompare(functionName(right.callFrame)) ||
      left.callFrame.lineNumber - right.callFrame.lineNumber ||
      left.callFrame.columnNumber - right.callFrame.columnNumber ||
      left.nodeId - right.nodeId,
  );

  return {
    allSampledBytes,
    relevantBytes: entries.reduce(
      (total, entry) => total + entry.selfBytes,
      0,
    ),
    entries,
  };
}

if (process.argv.length !== 4) {
  fail(
    "Usage: node profiles/analyze-v8-profile.mjs <profile.cpuprofile> <profile.heapprofile>",
  );
}

const cpuPath = process.argv[2];
const heapPath = process.argv[3];
const cpu = analyzeCpu(readJson(cpuPath, "CPU"));
const heap = analyzeHeap(readJson(heapPath, "heap"));

const lines = [
  `CPU profile: ${basename(cpuPath)}`,
  `CPU all self samples: ${cpu.allSamples}`,
  `CPU geometry.es.js self samples: ${cpu.relevantSamples} (${percent(cpu.relevantSamples, cpu.allSamples)} of all samples)`,
  "CPU geometry.es.js attribution:",
];

for (const entry of cpu.entries) {
  lines.push(
    `  ${entry.selfSamples} samples | ${percent(entry.selfSamples, cpu.allSamples)} of all | ${functionName(entry.callFrame)} | ${location(entry.callFrame)} | node ${entry.nodeId}`,
  );
}

lines.push(
  `Heap profile: ${basename(heapPath)}`,
  `Heap all sampled bytes: ${heap.allSampledBytes}`,
  `Heap geometry.es.js self bytes: ${heap.relevantBytes} (${percent(heap.relevantBytes, heap.allSampledBytes)} of all sampled bytes)`,
  "Heap geometry.es.js attribution:",
);

for (const entry of heap.entries) {
  lines.push(
    `  ${entry.selfBytes} bytes | ${percent(entry.selfBytes, heap.allSampledBytes)} of all | ${functionName(entry.callFrame)} | ${location(entry.callFrame)} | node ${entry.nodeId}`,
  );
}

console.log(lines.join("\n"));
