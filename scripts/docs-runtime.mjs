#!/usr/bin/env node
// Run rendering tools only in an unserved disposable directory, one job at a time.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export function safeDirectory(value) {
  const directory = fs.realpathSync(value);
  if (!directory.startsWith('/tmp/') || !fs.statSync(directory).isDirectory()) throw new Error('Rendering requires an unserved directory under /tmp');
  return directory;
}
export function safeEnvironment(source) {
  const output = {};
  for (const key of ['PATH', 'HOME', 'USER', 'LOGNAME', 'LANG', 'LC_ALL', 'TERM', 'TMPDIR', 'BEATPASS_SOURCE_DIR', 'BEATPASS_VALE_BIN']) {
    if (source[key]) output[key] = source[key];
  }
  for (const [key, value] of Object.entries(source)) {
    if (/^(?:BP_DOCS_|VISUAL_|PUPPETEER_|PLAYWRIGHT_|DOCS_|BROWSER_)/.test(key) || /^(?:CI|PORT|WIDTH|HEIGHT|THEME|BASE_URL)$/.test(key)) output[key] = value;
  }
  output.NODE_OPTIONS = '--max-old-space-size=1280';
  output.npm_config_update_notifier = 'false';
  output.npm_config_audit = 'false';
  return output;
}
function availableMB() {
  const match = fs.readFileSync('/proc/meminfo', 'utf8').match(/^MemAvailable:\s+(\d+) kB$/m);
  if (!match) throw new Error('Cannot determine host memory headroom');
  return Number(match[1]) / 1024;
}
export function parseProcessStat(pid, value) {
  const end = value.lastIndexOf(')');
  if (!Number.isInteger(pid) || pid < 1 || end < 0) return null;
  const fields = value.slice(end + 1).trim().split(/\s+/);
  if (fields.length < 20 || !/^\d+$/.test(fields[19])) return null;
  const ppid = Number(fields[1]), group = Number(fields[2]), session = Number(fields[3]);
  if (![ppid, group, session].every(Number.isSafeInteger)) return null;
  return {pid, ppid, group, session, start:fields[19]};
}
export function ancestorProcesses(entries, roots) {
  const byId = new Map(entries.map(entry => [entry.pid, entry])), protectedIds = new Set();
  for (let pid of roots) {
    while (Number.isInteger(pid) && pid > 0 && !protectedIds.has(pid)) {
      protectedIds.add(pid); pid = byId.get(pid)?.ppid;
    }
  }
  return protectedIds;
}
export function ownedProcesses(entries, root, known = new Map(), protectedIds = new Set()) {
  const valid = entries.filter(entry => Number.isInteger(entry.pid) && entry.pid > 1 && typeof entry.start === 'string' && entry.start.length > 0 && !protectedIds.has(entry.pid));
  const owned = new Map();
  for (const entry of valid) {
    // Missing identities must never compare equal through undefined === undefined.
    if (entry.pid === root || (known.has(entry.pid) && known.get(entry.pid) === entry.start)) owned.set(entry.pid, entry.start);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const entry of valid) if (!owned.has(entry.pid) && owned.has(entry.ppid)) { owned.set(entry.pid, entry.start); changed = true; }
  }
  return owned;
}
export function proportionalMemoryMB(text, fallbackRSS) {
  const pss = text.match(/^Pss:\s+(\d+) kB$/m);
  const swap = text.match(/^SwapPss:\s+(\d+) kB$/m);
  return pss ? (Number(pss[1]) + Number(swap?.[1] ?? 0)) / 1024 : fallbackRSS;
}
function processSnapshot() {
  const entries = [];
  for (const item of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(item)) continue;
    try {
      const stat = fs.readFileSync(`/proc/${item}/stat`, 'utf8');
      const identity = parseProcessStat(Number(item), stat);
      if (!identity) continue;
      const value = fs.readFileSync(`/proc/${item}/status`, 'utf8').match(/^VmRSS:\s+(\d+) kB$/m);
      entries.push({...identity, rss:value ? Number(value[1]) / 1024 : 0});
    } catch { /* process exited between reads */ }
  }
  return entries;
}
async function main() {
  const args = process.argv.slice(2), separator = args.indexOf('--');
  if (args[0] !== '--cwd' || separator !== 2 || !args[3]) throw new Error('Usage: node scripts/docs-runtime.mjs --cwd /tmp/review -- command [arguments]');
  const cwd = safeDirectory(args[1]);
  if (availableMB() < 4096) throw new Error('Rendering deferred: fewer than 4096 MiB available');
  const lock = path.join(os.tmpdir(), `beatpass-docs-render-${process.getuid()}.lock`);
  for (;;) {
    try {
      const descriptor = fs.openSync(lock, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
      fs.writeFileSync(descriptor, JSON.stringify({pid: process.pid, cwd, started_at: new Date().toISOString()}));
      fs.closeSync(descriptor); break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const value = JSON.parse(fs.readFileSync(lock, 'utf8'));
      if (!Number.isInteger(value.pid) || value.pid < 2) throw new Error('Invalid render lock; inspect it manually');
      try { process.kill(value.pid, 0); } catch (check) {
        if (check.code === 'ESRCH') { fs.unlinkSync(lock); continue; }
        throw check;
      }
      throw new Error(`Another documentation render is running (PID ${value.pid}); stop that owned job first`);
    }
  }
  const logDirectory = path.join(cwd, '.docs-runtime');
  fs.mkdirSync(logDirectory, {recursive:true});
  const logFile = path.join(logDirectory, `${process.pid}.jsonl`);
  const record = (event) => fs.appendFileSync(logFile, JSON.stringify({at:new Date().toISOString(), ...event}) + '\n');
  let peak = 0, samples = 0;
  let child, interval, killTimer, failed = false, known = new Map(), resolveStopped;
  const stopped = new Promise((resolve) => { resolveStopped = resolve; });
  const sample = () => {
    const entries = processSnapshot();
    const protectedIds = ancestorProcesses(entries, [process.pid, process.ppid]);
    // The detached job session also identifies ordinary orphaned children.
    for (const entry of entries) if (entry.session === child.pid && !protectedIds.has(entry.pid)) known.set(entry.pid, entry.start);
    known = ownedProcesses(entries, child.pid, known, protectedIds);
    return entries.filter((entry) => known.has(entry.pid)).map((entry) => {
      let proportional = entry.rss;
      try { proportional = proportionalMemoryMB(fs.readFileSync(`/proc/${entry.pid}/smaps_rollup`, 'utf8'), entry.rss); } catch {}
      return {...entry, proportional};
    });
  };
  const signalOwned = (signal) => {
    const targets = [];
    for (const entry of sample().reverse()) {
      try {
        const current = parseProcessStat(entry.pid, fs.readFileSync(`/proc/${entry.pid}/stat`, 'utf8'));
        if (current?.start !== entry.start) continue;
        process.kill(entry.pid, signal); targets.push(entry.pid);
      } catch { /* exited or identity could not be confirmed */ }
    }
    // Never send a negative-PID group signal: cleanup is identity-bound to each owned PID.
    record({event:'signal_owned', signal, targets});
    return targets.length;
  };
  const stop = (reason) => {
    if (failed) return;
    failed = true;
    record({event:'stop', reason});
    process.stderr.write(`\nDocumentation runtime stopping its owned process tree: ${reason}\n`);
    if (child?.pid) {
      signalOwned('SIGTERM');
      killTimer = setTimeout(() => { signalOwned('SIGKILL'); child.unref(); resolveStopped(1); }, 5000);
      killTimer.unref();
    }
  };
  try {
    child = spawn('/usr/bin/nice', ['-n', '15', '/usr/bin/ionice', '-c', '2', '-n', '7', ...args.slice(3)], {cwd, detached: true, stdio: 'inherit', env: safeEnvironment(process.env)});
    process.stderr.write(`Documentation runtime: PID ${child.pid}, isolated cwd, nice 15, lowest best-effort I/O; stop below 2560 MiB host headroom or above 2048 MiB owned PSS + proportional swap (RSS fallback).\n`);
    record({event:'started', guard_pid:process.pid, child_pid:child.pid, memory_limit_mib:2048, metric:'PSS+SwapPss; RSS fallback'});
    process.once('SIGINT', () => stop('interrupt'));
    process.once('SIGTERM', () => stop('termination'));
    interval = setInterval(() => {
      try {
        const free = availableMB(), rss = sample().reduce((total, entry) => total + entry.proportional, 0);
        peak = Math.max(peak, rss);
        if (++samples % 5 === 0) record({event:'resources', host_available_mib:Math.round(free), owned_mib:Math.round(rss), peak_mib:Math.round(peak)});
        if (free < 2560 || rss > 2048) stop(`resource limit (host available ${Math.round(free)} MiB, owned PSS+swap ${Math.round(rss)} MiB)`);
      } catch (error) { stop(error.message); }
    }, 2000);
    const code = await Promise.race([stopped, new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', (value, signal) => { record({event:'child_exit', code:value, signal, peak_mib:Math.round(peak)}); resolve(value ?? 1); }); })]);
    process.exitCode = failed ? 1 : code;
  } finally {
    record({event:'cleanup', failed, peak_mib:Math.round(peak)});
    clearInterval(interval);
    if (killTimer) clearTimeout(killTimer);
    if (child?.pid) {
      if (signalOwned('SIGTERM')) await new Promise(resolve => setTimeout(resolve, 250));
      signalOwned('SIGKILL');
    }
    try { const value = JSON.parse(fs.readFileSync(lock, 'utf8')); if (value.pid === process.pid) fs.unlinkSync(lock); } catch {}
  }
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
