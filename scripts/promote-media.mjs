#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { assertNoCaptureGap } from "../tests/fixtures/media/safety.mjs";
import { workflows } from "../tests/fixtures/media/workflows.mjs";

const options = {};
for (let i = 2; i < process.argv.length; i += 2)
  options[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];
if (
  !options.workdir?.startsWith("/tmp/") ||
  !options.workflow ||
  !options["visual-review"]
)
  throw new Error(
    'Provide --workdir /tmp/... --workflow ID --visual-review "What you checked in all four images"',
  );
const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = path.join(options.workdir, "media-captures.json");
const data = JSON.parse(await fs.readFile(manifest, "utf8"));
assertNoCaptureGap(data, options.workflow);
const rows = data.captures.filter((row) => row.id === options.workflow);
const key = (row) =>
  (row.viewport.width < 768 ? "mobile" : "desktop") + "-" + row.theme;
const expected = [
  "desktop-light",
  "desktop-dark",
  "mobile-light",
  "mobile-dark",
];
if (
  rows.length !== 4 ||
  expected.some((variant) => !rows.some((row) => key(row) === variant))
)
  throw new Error("Only a complete four-variant workflow can be promoted");
const signatures = new Set(
  rows.map((row) =>
    JSON.stringify([
      row.source.head,
      row.source.frontend_sha256,
      row.source.theme_sha256,
      row.source.navigation_sha256,
      row.source.role_contract_sha256,
    ]),
  ),
);
if (signatures.size !== 1)
  throw new Error(
    "Workflow variants use different source or configured themes",
  );
const expectedRole = workflows.find(
  (flow) => flow.id === options.workflow,
)?.audience;
for (const row of rows) {
  const actor = row.actor;
  if (
    !/^[a-f0-9]{64}$/.test(row.source.role_contract_sha256 || "") ||
    !actor ||
    actor.role !== expectedRole ||
    actor.has_admin ||
    actor.permissions?.some(
      (name) =>
        name === "admin" ||
        name.startsWith("admin.") ||
        ["music.update", "music.delete"].includes(name),
    )
  )
    throw new Error(
      "Final guide media requires its actual scoped audience proof",
    );
  if (
    expectedRole === "customer" &&
    (actor.is_producer ||
      actor.can_create_music ||
      actor.owned_artist_ids.length ||
      actor.primary_artist_id !== null)
  )
    throw new Error("Customer media contains producer ownership");
  if (
    expectedRole === "producer" &&
    (!actor.is_producer ||
      !actor.can_create_music ||
      actor.user_id !== 101 ||
      actor.owned_artist_ids.length !== 1 ||
      actor.primary_artist_id !== actor.owned_artist_ids[0])
  )
    throw new Error("Producer media lacks its one eligible synthetic profile");
  if (
    ["track", "download"].includes(row.id) &&
    (!actor.paid_download_subscription ||
      actor.track?.viewer_owns_track !== false)
  )
    throw new Error("Customer catalog media must show paid non-owner access");
}
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const copies = [];
const previous = options["previous-manifest"]
  ? JSON.parse(await fs.readFile(options["previous-manifest"], "utf8"))
  : null;
for (const row of rows) {
  if (
    !/^\/assets\/media\/screenshots\/[a-z-]+\/[a-z-]+\/(desktop|mobile)-(light|dark)\.png$/.test(
      row.path,
    ) ||
    row.synthetic !== true
  )
    throw new Error("Unexpected capture path or provenance");
  const relative = row.path.slice(1),
    source = path.join(options.workdir, "staging", relative),
    target = path.join(docs, relative);
  if (hash(await fs.readFile(source)) !== row.image.sha256)
    throw new Error("Staged image changed: " + row.path);
  let exists = false,
    replace = null;
  try {
    exists = true;
    const currentHash = hash(await fs.readFile(target));
    if (currentHash !== row.image.sha256) {
      const prior = previous?.captures.find(
        (record) =>
          record.path === row.path &&
          record.id === options.workflow &&
          record.crop?.reviewed === true &&
          record.synthetic === true,
      );
      if (!prior || prior.image.sha256 !== currentHash)
        throw new Error(
          "Existing documentation image differs without an exact previously reviewed capture: " +
            row.path,
        );
      replace = {
        sha256: currentHash,
        backup: path.join(
          options.workdir,
          "retained-reviewed-assets",
          prior.source.frontend_sha256,
          relative,
        ),
      };
    }
  } catch (error) {
    if (error.code === "ENOENT") exists = false;
    else throw error;
  }
  copies.push({ source, target, exists, replace });
}
// Run only while capture is idle; review and promotion never mutate an active manifest.
for (const copy of copies) {
  await fs.mkdir(path.dirname(copy.target), { recursive: true });
  if (copy.replace) {
    if (hash(await fs.readFile(copy.target)) !== copy.replace.sha256)
      throw new Error("Reviewed asset changed during promotion; preserving it");
    await fs.mkdir(path.dirname(copy.replace.backup), { recursive: true });
    try {
      await fs.copyFile(
        copy.target,
        copy.replace.backup,
        constants.COPYFILE_EXCL,
      );
    } catch (error) {
      if (
        error.code !== "EEXIST" ||
        hash(await fs.readFile(copy.replace.backup)) !== copy.replace.sha256
      )
        throw error;
    }
    await fs.copyFile(copy.source, copy.target);
  } else if (!copy.exists)
    await fs.copyFile(copy.source, copy.target, constants.COPYFILE_EXCL);
}
for (const row of rows)
  Object.assign(row.crop, {
    reviewed: true,
    reviewed_at: new Date().toISOString(),
    visual_review: options["visual-review"],
  });
await fs.writeFile(manifest, JSON.stringify(data, null, 2) + "\n");
console.log(
  "Promoted " +
    options.workflow +
    " (four visually reviewed variants; staging retained)",
);
