#!/usr/bin/env node
// App source is read-only. All fixture adapters, Vite output and browser state live under /tmp.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { workflows } from "../tests/fixtures/media/workflows.mjs";
import { assertRuntimeReady, unrefreshedVariants } from "../tests/fixtures/media/safety.mjs";
import { publicFontStyles } from "../tests/fixtures/media/public-fonts.mjs";
const startedAt = Date.now();
let activeWorkdir,
  activeSelected = [],
  activeRequestedVariants = [];
const run = promisify(execFile),
  docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha = (b) => createHash("sha256").update(b).digest("hex");
function options(args) {
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--worker") {
      result.worker = true;
      continue;
    }
    if (!args[i].startsWith("--") || !args[i + 1])
      throw new Error("Expected --option value");
    result[args[i].slice(2)] = args[++i];
  }
  return result;
}
function command(binary, args, cwd, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { cwd, env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${binary} exited ${code}`)),
    );
  });
}
async function freshThemes(output) {
  let html, lastError;
  for (const extra of [[], ["--resolve", "open.beatpass.ca:443:127.0.0.1"]]) {
    try {
      html = (
        await run(
          "curl",
          [
            "--fail",
            "--silent",
            "--show-error",
            "--location",
            "--max-redirs",
            "3",
            "--connect-timeout",
            "6",
            "--max-time",
            "16",
            ...extra,
            "https://open.beatpass.ca/",
          ],
          { maxBuffer: 8 * 1024 * 1024, timeout: 20000 },
        )
      ).stdout;
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (!html) throw new Error("Public theme read failed: " + lastError?.message);
  const match = html.match(/window\.bootstrapData\s*=\s*(\{[\s\S]*?\});/);
  if (!match) throw new Error("Public bootstrap theme block was not found");
  const data = JSON.parse(match[1]),
    all = data.themes?.all;
  if (!Array.isArray(all)) throw new Error("Public themes are missing");
  const selected = {};
  for (const theme of all) {
    if (theme.default_dark || theme.is_dark) selected.dark ??= theme;
    if (theme.default_light || theme.is_dark === false)
      selected.light ??= theme;
  }
  if (!selected.light || !selected.dark)
    throw new Error("Both configured public themes must be observed");
  const snapshot = {
    source: "https://open.beatpass.ca/",
    verified_at: new Date().toISOString(),
    themes: Object.fromEntries(
      Object.entries(selected).map(([key, value]) => [
        key,
        { values: value.values, font: value.font, is_dark: key === "dark" },
      ]),
    ),
  };
  snapshot.sha256 = sha(JSON.stringify(snapshot.themes));
  const fonts = await publicFontStyles(snapshot.themes);
  snapshot.font_css = fonts.css;
  snapshot.font_assets = fonts.assets;
  await fs.writeFile(output, JSON.stringify(snapshot, null, 2) + "\n");
  return snapshot;
}
async function freezeSource(source, snapshot) {
  await fs.mkdir(snapshot, { recursive: true });
  const head = (
    await run("git", ["rev-parse", "HEAD"], { cwd: source })
  ).stdout.trim();
  const allowed = [
    "resources",
    "common/resources",
    "scripts",
    "public/assets",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "tsconfig.node.json",
    "tailwind.config.js",
    "postcss.config.js",
  ];
  const archive = spawn("git", ["archive", "HEAD", ...allowed], {
    cwd: source,
    stdio: ["ignore", "pipe", "inherit"],
  });
  const unpack = spawn("tar", ["-x", "-C", snapshot], {
    stdio: ["pipe", "inherit", "inherit"],
  });
  archive.stdout.pipe(unpack.stdin);
  await Promise.all([
    new Promise((r, j) =>
      archive.once("exit", (c) =>
        c === 0 ? r() : j(new Error("Source archive failed")),
      ),
    ),
    new Promise((r, j) =>
      unpack.once("exit", (c) =>
        c === 0 ? r() : j(new Error("Source extraction failed")),
      ),
    ),
  ]);
  const status = (
    await run(
      "git",
      [
        "status",
        "--porcelain=v1",
        "-z",
        "--untracked-files=all",
        "--",
        ...allowed,
      ],
      { cwd: source, maxBuffer: 8 * 1024 * 1024 },
    )
  ).stdout
    .split("\0")
    .filter(Boolean);
  let overlays = 0;
  const excludedNonWebPaths = [];
  for (const row of status) {
    const relative = row.slice(3);
    if (
      relative.startsWith("resources/client/companion/video-generator/") &&
      relative.endsWith(".html")
    ) {
      excludedNonWebPaths.push(relative);
      continue;
    }
    if (
      !relative ||
      relative.includes(" -> ") ||
      relative
        .split("/")
        .some((x) =>
          [".env", "vendor", "node_modules", "storage", ".git"].includes(x),
        )
    )
      throw new Error(`Unsafe or renamed source input: ${relative}`);
    const target = path.resolve(snapshot, relative);
    if (!target.startsWith(snapshot + "/"))
      throw new Error("Source path escaped snapshot");
    if (row.slice(0, 2).includes("D")) {
      await fs.rm(target, { force: true });
      continue;
    }
    const stat = await fs.lstat(path.join(source, relative));
    if (!stat.isFile())
      throw new Error(`Source overlay is not a regular file: ${relative}`);
    const { stdout: bytes } = await run(
      "timeout",
      ["8", "cat", path.join(source, relative)],
      { encoding: "buffer", maxBuffer: 16 * 1024 * 1024 },
    );
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes);
    overlays++;
  }
  const sourceFiles = {};
  async function visit(folder) {
    for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
      const full = path.join(folder, entry.name);
      if (entry.isSymbolicLink())
        throw new Error(`Source symlink requires review: ${full}`);
      if (entry.isDirectory()) await visit(full);
      else
        sourceFiles[path.relative(snapshot, full)] = sha(
          await fs.readFile(full),
        );
    }
  }
  for (const folder of ["resources", "common/resources"])
    await visit(path.join(snapshot, folder));
  const digest = sha(
    JSON.stringify(Object.fromEntries(Object.entries(sourceFiles).sort())),
  );
  const after = (
    await run("git", ["rev-parse", "HEAD"], { cwd: source })
  ).stdout.trim();
  if (after !== head) throw new Error("App HEAD changed while freezing source");
  await fs.symlink(
    await fs.realpath(path.join(source, "node_modules")),
    path.join(snapshot, "node_modules"),
    "dir",
  );
  return {
    head,
    frontend_sha256: digest,
    sourceFiles,
    overlays,
    excluded_non_web_paths: excludedNonWebPaths,
    captured_at: new Date().toISOString(),
  };
}
async function main() {
  const opts = options(process.argv.slice(2)),
    source = await fs.realpath(opts.source || path.dirname(docs)),
    workdir = path.resolve(
      opts.workdir || "/tmp/beatpass-docs-polish-20261029/capture",
    );
  if (!workdir.startsWith("/tmp/"))
    throw new Error("Capture workdir must be under /tmp");
  await fs.mkdir(workdir, { recursive: true });
  activeWorkdir = workdir;
  const runtimePath =
    opts["runtime-safe"] ||
    "/tmp/beatpass-docs-polish-20261029/runtime-safe.json";
  assertRuntimeReady(JSON.parse(await fs.readFile(runtimePath, "utf8")));
  const selected = opts.workflows
    ? opts.workflows.split(",")
    : workflows.map((w) => w.id);
  activeSelected = selected;
  activeRequestedVariants = ["desktop-light", "desktop-dark", "mobile-light", "mobile-dark"].filter(variant =>
    (!opts.device || variant.startsWith(opts.device + "-")) &&
    (!opts.theme || variant.endsWith("-" + opts.theme))
  );
  for (const id of selected)
    if (!workflows.some((w) => w.id === id))
      throw new Error(`Unknown workflow: ${id}`);
  if (!opts.worker) {
    await freshThemes(path.join(workdir, "public-themes.json"));
    await command(
      process.execPath,
      [
        path.join(docs, "scripts/docs-runtime.mjs"),
        "--cwd",
        workdir,
        "--",
        process.execPath,
        fileURLToPath(import.meta.url),
        "--worker",
        ...process.argv.slice(2),
      ],
      workdir,
    );
    return;
  }
  const themes = JSON.parse(
    await fs.readFile(path.join(workdir, "public-themes.json"), "utf8"),
  );
  if (
    Date.now() - Date.parse(themes.verified_at) > 3600000 ||
    themes.source !== "https://open.beatpass.ca/"
  )
    throw new Error("Public themes must be freshly verified");
  let snapshot, provenance;
  if (opts.snapshot) {
    snapshot = await fs.realpath(opts.snapshot);
    if (!snapshot.startsWith("/tmp/"))
      throw new Error("Reusable source snapshot must be unserved under /tmp");
    provenance = JSON.parse(
      await fs.readFile(path.join(workdir, "source-manifest.json"), "utf8"),
    );
    if (provenance.snapshot_root !== snapshot)
      throw new Error("Snapshot directory does not match its source manifest");
    for (const [relative, expected] of Object.entries(provenance.sourceFiles)) {
      if (sha(await fs.readFile(path.join(snapshot, relative))) !== expected)
        throw new Error("Frozen frontend changed: " + relative);
    }
  } else {
    snapshot = path.join(workdir, "source-" + Date.now());
    provenance = await freezeSource(source, snapshot);
    provenance.snapshot_root = snapshot;
  }
  provenance.theme_sha256 = themes.sha256;
  const fixtureRoot = path.join(docs, "tests/fixtures/media");
  const fixtureHashes = {},
    fixtureBytes = new Map();
  for (const name of (await fs.readdir(fixtureRoot)).sort()) {
    if (!/\.(mjs|json)$/.test(name)) continue;
    const bytes = await fs.readFile(path.join(fixtureRoot, name));
    fixtureHashes[name] = sha(bytes);
    fixtureBytes.set(name, bytes);
  }
  provenance.fixture_sha256 = sha(JSON.stringify(fixtureHashes));
  const frozenFixtures = path.join(
    workdir,
    "fixture-snapshots",
    provenance.fixture_sha256,
  );
  await fs.mkdir(frozenFixtures, { recursive: true });
  for (const [name, bytes] of fixtureBytes) {
    const target = path.join(frozenFixtures, name);
    try {
      await fs.writeFile(target, bytes, { flag: "wx", mode: 0o444 });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
    if (sha(await fs.readFile(target)) !== fixtureHashes[name])
      throw new Error("Frozen documentation fixture changed: " + name);
  }
  provenance.fixture_snapshot_root = frozenFixtures;
  const { prepareAdapter } = await import(
    pathToFileURL(path.join(frozenFixtures, "adapter.mjs")).href
  );
  await fs.writeFile(
    path.join(workdir, "source-manifest.json"),
    JSON.stringify(provenance, null, 2) + "\n",
  );
  await prepareAdapter({
    docs,
    frozenFixtures,
    sourceRoot: source,
    snapshot,
    workdir,
    selected,
    device: opts.device,
    theme: opts.theme,
    themes,
    provenance,
  });
  await command(
    process.execPath,
    [
      "--max-old-space-size=512",
      "scripts/ci/run-docs-media.mjs",
      "--group=visual",
    ],
    snapshot,
    {
      ...process.env,
      VISUAL_CAPTURE_ONLY: "1",
      VISUAL_OUTPUT: path.join(workdir, "raw"),
      DOCS_MEDIA_OUTPUT: path.join(workdir, "staging/assets/media/screenshots"),
      DOCS_MEDIA_METADATA: path.join(workdir, "media-captures.json"),
      ...(opts.browser ? { DOCS_BROWSER_EXECUTABLE: opts.browser } : {}),
    },
  );
}
main().catch(async (error) => {
  if (activeWorkdir) {
    const file = path.join(activeWorkdir, "media-captures.json");
    let data = { schema_version: 1, captures: [], gaps: [] };
    try {
      data = JSON.parse(await fs.readFile(file, "utf8"));
    } catch {}
    for (const id of activeSelected) {
      const missing = unrefreshedVariants(data.captures, id, activeRequestedVariants, startedAt);
      if (missing.length) {
        let renderErrors = [];
        try {
          const report = path.join(activeWorkdir, "raw/report.json");
          if ((await fs.stat(report)).mtimeMs >= startedAt) {
            const flow = workflows.find((flow) => flow.id === id);
            renderErrors = JSON.parse(await fs.readFile(report, "utf8"))
              .filter(
                (row) =>
                  row.id.startsWith(flow.scenario + "-") &&
                  row.status === "failed",
              )
              .map((row) => row.error);
          }
        } catch {}
        data.gaps = data.gaps.filter((gap) => gap.workflow !== id);
        data.gaps.push({
          workflow: id,
          missing_variants: missing,
          reason: renderErrors.length
            ? [...new Set(renderErrors)].join("; ")
            : error.message,
          recorded_at: new Date().toISOString(),
        });
      }
    }
    await fs.writeFile(file, JSON.stringify(data, null, 2) + "\n");
  }
  process.stderr.write(error.stack + "\n");
  process.exitCode = 1;
});
