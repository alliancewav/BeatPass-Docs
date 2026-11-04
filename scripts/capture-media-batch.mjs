#!/usr/bin/env node
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { workflows } from "../tests/fixtures/media/workflows.mjs";

const args = process.argv.slice(2),
  options = {};
for (let index = 0; index < args.length; index += 2) {
  if (!args[index]?.startsWith("--") || !args[index + 1])
    throw new Error("Expected --option value");
  options[args[index].slice(2)] = args[index + 1];
}
const selected = options.workflows
  ? options.workflows.split(",")
  : workflows.map((flow) => flow.id);
for (const id of selected)
  if (!workflows.some((flow) => flow.id === id))
    throw new Error("Unknown workflow: " + id);
if (
  !options.workdir?.startsWith("/tmp/") ||
  !options.snapshot?.startsWith("/tmp/")
)
  throw new Error(
    "Serial batch requires an existing frozen source and workdir under /tmp",
  );
const devices = options.device ? [options.device] : ["desktop", "mobile"];
if (devices.some((device) => !["desktop", "mobile"].includes(device)))
  throw new Error("Unknown device");
if (options.theme && !["light", "dark"].includes(options.theme))
  throw new Error("Unknown theme");
const groupSize = Number(options["group-size"] || 1);
if (
  !Number.isInteger(groupSize) ||
  groupSize < 1 ||
  groupSize * (options.theme ? 1 : 2) > 2
)
  throw new Error(
    "Keep each browser batch at two cases or fewer: one workflow with both themes, or two with one theme",
  );
const driver = fileURLToPath(new URL("./capture-media.mjs", import.meta.url));
let results = [];
try {
  results = JSON.parse(
    await fs.readFile(
      path.join(options.workdir, "batch-attempts.json"),
      "utf8",
    ),
  ).attempts;
} catch {}
const previousCount = results.length;
let checkpointStop = null;
captureGroups: for (
  let offset = 0;
  offset < selected.length;
  offset += groupSize
) {
  const group = selected.slice(offset, offset + groupSize);
  for (const device of devices) {
    const checkpoint = path.join(
      options.workdir,
      "stop-at-next-checkpoint.json",
    );
    try {
      await fs.access(checkpoint);
      checkpointStop = {
        workflow: group,
        device,
        stopped_at: new Date().toISOString(),
        checkpoint,
      };
      await fs.writeFile(
        path.join(options.workdir, "batch-checkpoint-stop.json"),
        JSON.stringify(checkpointStop, null, 2) + "\n",
      );
      console.log(
        "Documentation batch stopped cleanly before next child: " +
          group.join(",") +
          " " +
          device,
      );
      break captureGroups;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    const childArgs = [
      driver,
      "--workflows",
      group.join(","),
      "--device",
      device,
    ];
    for (const key of [
      "source",
      "workdir",
      "snapshot",
      "browser",
      "runtime-safe",
      "theme",
    ])
      if (options[key]) childArgs.push("--" + key, options[key]);
    const started_at = new Date().toISOString();
    const logDir = path.join(options.workdir, "batch-logs");
    await fs.mkdir(logDir, { recursive: true });
    const logPath = path.join(
      logDir,
      group.join("--") + "-" + device + "-" + Date.now() + ".log",
    );
    const status = await new Promise((resolve) => {
      const log = createWriteStream(logPath);
      const child = spawn(process.execPath, childArgs, {
        stdio: ["ignore", "pipe", "pipe"],
      });
      child.stdout.on("data", (chunk) => {
        process.stdout.write(chunk);
        log.write(chunk);
      });
      child.stderr.on("data", (chunk) => {
        process.stderr.write(chunk);
        log.write(chunk);
      });
      child.once("close", () => log.end());
      child.once("error", (error) =>
        resolve({ exit_code: null, error: error.message }),
      );
      child.once("exit", (exit_code, signal) => resolve({ exit_code, signal }));
    });
    let captures = [];
    try {
      captures = JSON.parse(
        await fs.readFile(
          path.join(options.workdir, "media-captures.json"),
          "utf8",
        ),
      ).captures;
    } catch {}
    for (const workflow of group)
      results.push({
        workflow,
        device,
        batch_workflows: group,
        started_at,
        finished_at: new Date().toISOString(),
        log: logPath,
        device_captures: captures
          .filter(
            (row) =>
              row.id === workflow &&
              (row.viewport.width < 768 ? "mobile" : "desktop") === device &&
              Date.parse(row.captured_at) >= Date.parse(started_at),
          )
          .map((row) => row.path),
        ...status,
      });
    await fs.writeFile(
      path.join(options.workdir, "batch-attempts.json"),
      JSON.stringify({ schema_version: 1, attempts: results }, null, 2) + "\n",
    );
    console.log(
      "Documentation batch: " +
        group.join(",") +
        " " +
        device +
        " " +
        (status.exit_code === 0
          ? "captured"
          : "one or more gaps recorded; continuing"),
    );
  }
}
if (checkpointStop) process.exitCode = 75;
else if (results.slice(previousCount).some((result) => result.exit_code !== 0))
  process.exitCode = 1;
