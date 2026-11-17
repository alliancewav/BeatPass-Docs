import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

const scenarioPath = 'scripts/ci/browser-smoke/visual-followup-scenario.mjs';
const runnerPath = 'scripts/ci/run-browser-smoke.mjs';
const digest = (scenario, runner) => createHash('sha256').update(scenario).update('\n--runner--\n').update(runner).digest('hex');

export async function loadHarnessSnapshot({sourceRoot, workdir}) {
  const manifestPath = path.join(workdir, 'harness-snapshot.json');
  let manifest;
  try { manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!manifest) {
    // Read the original frozen source before any documentation instrumentation.
    const scenario = await fs.readFile(path.join(sourceRoot, scenarioPath), 'utf8');
    const runner = await fs.readFile(path.join(sourceRoot, runnerPath), 'utf8');
    const sha256 = digest(scenario, runner);
    const directory = path.join(workdir, 'harness-sources', sha256);
    await fs.mkdir(directory, {recursive: true});
    for (const [name, content] of [['visual-followup-scenario.mjs', scenario], ['run-browser-smoke.mjs', runner]]) {
      const target = path.join(directory, name);
      try { await fs.writeFile(target, content, {flag: 'wx', mode: 0o444}); }
      catch (error) { if (error.code !== 'EEXIST') throw error; }
      if (await fs.readFile(target, 'utf8') !== content) throw new Error('Existing harness snapshot differs');
    }
    manifest = {schema_version: 1, sha256, captured_at: new Date().toISOString()};
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', {flag: 'wx'});
  }
  if (manifest.schema_version !== 1 || !/^[a-f0-9]{64}$/.test(manifest.sha256)) throw new Error('Invalid immutable harness reference');
  const directory = path.join(workdir, 'harness-sources', manifest.sha256);
  const scenario = await fs.readFile(path.join(directory, 'visual-followup-scenario.mjs'), 'utf8');
  const runner = await fs.readFile(path.join(directory, 'run-browser-smoke.mjs'), 'utf8');
  if (digest(scenario, runner) !== manifest.sha256) throw new Error('Frozen harness changed; refusing capture');
  return {scenario, runner, sha256: manifest.sha256};
}
