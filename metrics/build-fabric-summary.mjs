import fs from "node:fs";

const gpuPath = process.argv[2] ?? "logs/gpu-utilization.csv";
const routerPath = process.argv[3] ?? "logs/routerd-load.csv";
const outputPath = process.argv[4] ?? "metrics/fabric-summary.json";
const activeThreshold = 70;

const csvRows = (file) => {
  const lines = fs.readFileSync(file, "utf8").trim().split(/\r?\n/);
  const header = lines.shift().split(",");
  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(header.map((name, index) => [name, values[index]]));
  });
};

const byTimestamp = new Map();
for (const row of csvRows(gpuPath)) {
  const timestamp = row.captured_at;
  if (!timestamp) continue;
  if (!byTimestamp.has(timestamp)) byTimestamp.set(timestamp, new Map());
  byTimestamp.get(timestamp).set(`${row.host}#${row.gpu_index}`, {
    utilization: Number(row.utilization_percent),
    temperature: Number(row.temperature_c),
    power: Number(row.power_w),
  });
}

const snapshots = [...byTimestamp]
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([timestamp, cards]) => {
    const values = [...cards.values()];
    return {
      timestamp,
      cardCount: values.length,
      active: values.filter((item) => item.utilization >= activeThreshold).length,
      meanUtilization:
        values.reduce((sum, item) => sum + item.utilization, 0) / values.length,
      maxTemperature: Math.max(...values.map((item) => item.temperature)),
      maxPower: Math.max(...values.map((item) => item.power)),
    };
  })
  .filter((item) => item.cardCount >= 24);

const percentile = (values, fraction) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(fraction * (sorted.length - 1))];
};

const bucketP90 = [];
for (let index = 0; index < 12; index += 1) {
  const start = Math.floor((index * snapshots.length) / 12);
  const end = Math.floor(((index + 1) * snapshots.length) / 12);
  bucketP90.push(
    percentile(
      snapshots.slice(start, end).map((item) => item.active),
      0.9,
    ),
  );
}

const routerRows = csvRows(routerPath).filter(
  (row) => row.captured_at && !row.captured_at.includes("failed"),
);
const routerValues = (name) => routerRows.map((row) => Number(row[name]) || 0);
const delta = (name) => {
  const values = routerValues(name);
  return Math.max(...values) - Math.min(...values);
};

const activeValues = snapshots.map((item) => item.active);
const result = {
  schema: "qwen-gauntlet-sanitized-fabric-summary-v1",
  privacy:
    "Derived aggregate only. Raw host, site, address, endpoint, credential, and topology fields are excluded.",
  activeDefinition: `GPU utilization >= ${activeThreshold}%`,
  gpu: {
    completeSnapshots: snapshots.length,
    start: snapshots.at(0)?.timestamp ?? null,
    end: snapshots.at(-1)?.timestamp ?? null,
    maxActiveCards: Math.max(...activeValues),
    meanActiveCards:
      activeValues.reduce((sum, value) => sum + value, 0) / activeValues.length,
    medianActiveCards: percentile(activeValues, 0.5),
    p95ActiveCards: percentile(activeValues, 0.95),
    percentSnapshotsAtLeast16:
      (100 * activeValues.filter((value) => value >= 16).length) /
      activeValues.length,
    percentSnapshotsAtLeast20:
      (100 * activeValues.filter((value) => value >= 20).length) /
      activeValues.length,
    meanUtilizationPercent:
      snapshots.reduce((sum, item) => sum + item.meanUtilization, 0) /
      snapshots.length,
    maxObservedTemperatureC: Math.max(
      ...snapshots.map((item) => item.maxTemperature),
    ),
    maxObservedPerCardPowerW: Math.max(
      ...snapshots.map((item) => item.maxPower),
    ),
    p90ActiveCardsByEqualTimeBucket: bucketP90,
  },
  router: {
    samples: routerRows.length,
    start: routerRows.at(0)?.captured_at ?? null,
    end: routerRows.at(-1)?.captured_at ?? null,
    maxRunning: Math.max(...routerValues("scheduler_running")),
    maxQueued: Math.max(...routerValues("scheduler_queued")),
    admissionRejectionsDelta: delta("admission_rejections"),
    upstreamErrorsDelta: delta("upstream_errors"),
    requestFailuresDelta: delta("requests_failed"),
    completedRequestsDelta: delta("completed_total"),
    maxNormalRunning: Math.max(...routerValues("normal_running")),
  },
};

fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(outputPath);
