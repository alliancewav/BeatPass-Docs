import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {safeDirectory, safeEnvironment, ownedProcesses, proportionalMemoryMB, parseProcessStat, ancestorProcesses} from './docs-runtime.mjs';

test('render directory resolves symlinks before enforcing disposable storage', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'beatpass-docs-guard-test-'));
  try {
    assert.equal(safeDirectory(temporary), fs.realpathSync(temporary));
    fs.symlinkSync('/etc', path.join(temporary, 'outside'));
    assert.throws(() => safeDirectory(path.join(temporary, 'outside')), /unserved/);
    assert.throws(() => safeDirectory('/etc'), /unserved/);
    assert.throws(() => safeDirectory('/tmp'), /unserved/);
  } finally { fs.rmSync(temporary, {recursive:true, force:true}); }
});
test('runtime strips inherited provider and database configuration', () => {
  const value = safeEnvironment({PATH:'/usr/bin', HOME:'/tmp/demo', DB_PASSWORD:'synthetic', STRIPE_SECRET:'synthetic', NODE_OPTIONS:'--inspect', VISUAL_CASE:'catalog', DOCS_PREVIEW:'yes'});
  assert.equal(value.DB_PASSWORD, undefined);
  assert.equal(value.STRIPE_SECRET, undefined);
  assert.equal(value.NODE_OPTIONS, '--max-old-space-size=1280');
  assert.equal(value.VISUAL_CASE, 'catalog');
});

test('watchdog tracks detached descendants and rejects reused PIDs', () => {
  const entries = [{pid:10,ppid:1,start:'a'}, {pid:11,ppid:10,start:'b'}, {pid:12,ppid:11,start:'c'}, {pid:20,ppid:1,start:'new'}];
  const known = ownedProcesses(entries,10,new Map([[20,'old']]));
  assert.deepEqual([...known.keys()],[10,11,12]);
  const reparented = ownedProcesses([{pid:12,ppid:1,start:'c'}],10,known);
  assert.equal(reparented.get(12),'c');
});

test('memory accounting includes proportional shared memory and swap with conservative RSS fallback', () => {
  assert.equal(proportionalMemoryMB('Pss: 1024 kB\nSwapPss: 512 kB\n', 99),1.5);
  assert.equal(proportionalMemoryMB('unavailable',99),99);
});


test('missing process start identities never become owned', () => {
  const entries=[{pid:10,ppid:1,start:'100'},{pid:20,ppid:1},{pid:21,ppid:20,start:''}];
  assert.deepEqual([...ownedProcesses(entries,10).keys()],[10]);
});
test('caller and coordinator ancestors are protected even if stale ownership contains them', () => {
  const entries=[{pid:2,ppid:1,start:'a'},{pid:3,ppid:2,start:'b'},{pid:4,ppid:3,start:'c'},{pid:5,ppid:4,start:'d'}];
  const protectedIds=ancestorProcesses(entries,[3,2]);
  assert.deepEqual([...ownedProcesses(entries,4,new Map([[2,'a'],[3,'b']]),protectedIds).keys()],[4,5]);
});
test('process stat parser rejects truncated data and handles spaces/parentheses in process names', () => {
  assert.equal(parseProcessStat(10,''),null);
  assert.equal(parseProcessStat(10,'10 (closed) S 1 2'),null);
  const fields=['S','3','10','10',...Array(15).fill('0'),'12345'];
  assert.deepEqual(parseProcessStat(10,`10 (node (capture)) ${fields.join('  ')}`),{pid:10,ppid:3,group:10,session:10,start:'12345'});
});
