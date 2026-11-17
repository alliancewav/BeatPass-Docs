import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {loadHarnessSnapshot} from '../tests/fixtures/media/harness-snapshot.mjs';

test('later capture children retain the exact frozen harness during source editing', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'docs-harness-test-'));
  const sourceRoot = path.join(root, 'source'), workdir = path.join(root, 'capture');
  await fs.mkdir(path.join(sourceRoot, 'scripts/ci/browser-smoke'), {recursive:true});
  await fs.mkdir(workdir);
  const scenario = path.join(sourceRoot, 'scripts/ci/browser-smoke/visual-followup-scenario.mjs');
  const runner = path.join(sourceRoot, 'scripts/ci/run-browser-smoke.mjs');
  try {
    await fs.writeFile(scenario, 'original scenario');await fs.writeFile(runner, 'original runner');
    const first = await loadHarnessSnapshot({sourceRoot, workdir});
    await fs.writeFile(scenario, 'moving scenario');await fs.writeFile(runner, 'moving runner');
    assert.deepEqual(await loadHarnessSnapshot({sourceRoot, workdir}), first);
    const frozen = path.join(workdir, 'harness-sources', first.sha256, 'visual-followup-scenario.mjs');
    await fs.chmod(frozen, 0o644);await fs.writeFile(frozen, 'corrupted snapshot');
    await assert.rejects(loadHarnessSnapshot({sourceRoot, workdir}), /Frozen harness changed/);
    await fs.unlink(frozen);
    await assert.rejects(loadHarnessSnapshot({sourceRoot, workdir}), {code:'ENOENT'});
  } finally { await fs.rm(root, {recursive:true,force:true}); }
});
