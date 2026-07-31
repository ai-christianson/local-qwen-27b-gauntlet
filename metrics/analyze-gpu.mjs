import fs from "node:fs";
import path from "node:path";

const [csvPath, outputPath] = process.argv.slice(2);
if (!csvPath || !outputPath) {
  throw new Error("usage: node analyze-gpu.mjs GPU_CSV OUTPUT_JSON");
}

const lines = fs.readFileSync(csvPath, "utf8").trim().split("\n");
const header = lines.shift().split(",");
const rows = lines.map((line) => {
  const values = line.split(",");
  return Object.fromEntries(header.map((key, index) => [key, values[index]]));
});

// Two Cube cards are quarantined and carry no serving model. They remain in
// the raw physical inventory but are excluded from serving-fabric saturation.
const servingRows = rows.filter((row) =>
  !(row.host === "cube" && (row.gpu_index === "1" || row.gpu_index === "3")),
);

function percentile(values, p) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
}

function summarizeRows(group) {
  const utilization = group.map((row) => Number(row.utilization_percent));
  const temperature = group.map((row) => Number(row.temperature_c));
  const power = group.map((row) => Number(row.power_w));
  return {
    samples: group.length,
    utilization: {
      mean: utilization.reduce((sum, value) => sum + value, 0) / utilization.length,
      p50: percentile(utilization, 0.50),
      p95: percentile(utilization, 0.95),
      active_ge_70_percent: 100 * utilization.filter((value) => value >= 70).length / utilization.length,
    },
    temperature_c: {
      p95: percentile(temperature, 0.95),
      max: Math.max(...temperature),
    },
    power_w: {
      p95: percentile(power, 0.95),
      max: Math.max(...power),
    },
  };
}

const byTimestamp = new Map();
const byHost = new Map();
for (const row of servingRows) {
  if (!byTimestamp.has(row.captured_at)) byTimestamp.set(row.captured_at, []);
  byTimestamp.get(row.captured_at).push(row);
  if (!byHost.has(row.host)) byHost.set(row.host, []);
  byHost.get(row.host).push(row);
}

const timeline = [...byTimestamp.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([capturedAt, group]) => {
  const active = group.filter((row) => Number(row.utilization_percent) >= 70).length;
  return {
    capturedAt,
    servingGpus: group.length,
    activeGpusGe70: active,
    activeTp2Equivalent: active / 2,
    meanUtilization: group.reduce((sum, row) => sum + Number(row.utilization_percent), 0) / group.length,
    maxTemperatureC: Math.max(...group.map((row) => Number(row.temperature_c))),
    maxPowerW: Math.max(...group.map((row) => Number(row.power_w))),
  };
});

const completeTimeline = timeline.filter((item) => item.servingGpus === 24);
const result = {
  schema: "qwen-gauntlet-gpu-summary-v1",
  rawPhysicalGpuCount: 26,
  servingGpuCount: 24,
  servingTp2LaneCount: 12,
  excludedPhysicalGpus: [
    { publicLabel: "non-serving-quarantined-1" },
    { publicLabel: "non-serving-quarantined-2" },
  ],
  capturedAt: {
    first: timeline.at(0)?.capturedAt ?? null,
    last: timeline.at(-1)?.capturedAt ?? null,
  },
  servingSamples: summarizeRows(servingRows),
  completeTimestampSamples: completeTimeline.length,
  saturation: {
    timestampsAtLeast20Of24ActivePercent:
      completeTimeline.length === 0 ? null :
        100 * completeTimeline.filter((item) => item.activeGpusGe70 >= 20).length / completeTimeline.length,
    timestampsAll24ActivePercent:
      completeTimeline.length === 0 ? null :
        100 * completeTimeline.filter((item) => item.activeGpusGe70 === 24).length / completeTimeline.length,
    maxActiveGpus: Math.max(0, ...completeTimeline.map((item) => item.activeGpusGe70)),
  },
  hosts: Object.fromEntries(
    [...byHost.entries()].map(([host, group]) => [host, summarizeRows(group)]),
  ),
  timeline,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
