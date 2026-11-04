import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const sha = (text) => createHash('sha256').update(text, 'utf8').digest('hex');
const hash = (value, length) => typeof value === 'string' && new RegExp(`^[a-f0-9]{${length}}$`, 'i').test(value);
const assetPath = (value) => typeof value === 'string' && value.startsWith('/assets/screenshots/') && !value.split('/').includes('..');
const references = (documents) => new Set([...documents.values()].flatMap((source) =>
  [...source.matchAll(/\/assets\/screenshots\/[^\s"'()<>?#]+/g)].map((match) => match[0])));

/** Inputs contain UTF-8 MDX strings and asset bytes; return errors without performing I/O. */
export function validateScreenshotProvenance({documents, records, files}) {
  const errors = [];
  const entries = records?.screenshots;
  if (!Array.isArray(entries)) return ['Screenshot manifest must contain a screenshots array'];
  const declared = new Map();
  for (const record of entries) {
    const name = record?.path;
    if (!assetPath(name)) { errors.push(`Invalid screenshot path: ${name}`); continue; }
    if (declared.has(name)) errors.push(`${name}: duplicate screenshot provenance`);
    declared.set(name, record);
    const validDate = typeof record.captured_at === 'string' && /^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(record.captured_at) && Number.isFinite(Date.parse(record.captured_at));
    if (!validDate) errors.push(`${name}: captured_at must be an ISO timestamp with timezone`);
    if (!hash(record.source?.head, 40) || !hash(record.source?.frontend_sha256, 64)) errors.push(`${name}: source needs a complete commit head and frontend SHA-256`);
    if (typeof record.route !== 'string' || !record.route.startsWith('/') || record.route.startsWith('//')) errors.push(`${name}: route must identify an app path`);
    if (typeof record.state !== 'string' || !record.state.trim()) errors.push(`${name}: state is required`);
    if (![record.viewport?.width, record.viewport?.height].every((n) => Number.isInteger(n) && n > 0)) errors.push(`${name}: viewport needs positive integer width and height`);
    if (!['light', 'dark'].includes(record.theme)) errors.push(`${name}: theme must be light or dark`);
    if (record.synthetic !== true) errors.push(`${name}: synthetic must be true`);
    const bytes = files.get(name);
    if (!Buffer.isBuffer(bytes)) { errors.push(`${name}: screenshot file is missing`); continue; }
    if (record.image?.sha256 && createHash('sha256').update(bytes).digest('hex') !== record.image.sha256) errors.push(`${name}: screenshot bytes changed since capture review`);
    const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpeg = bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const extension = path.posix.extname(name).toLowerCase();
    if (!((extension === '.png' && png) || (['.jpg', '.jpeg'].includes(extension) && jpeg))) errors.push(`${name}: PNG/JPEG signature does not match its extension`);
  }
  for (const name of references(documents)) {
    if (!declared.has(name)) errors.push(`${name}: referenced screenshot has no provenance record`);
    if (!files.has(name)) errors.push(`${name}: referenced screenshot file is missing`);
  }
  return errors;
}

/** Every material claim records the exact MDX bytes reviewed for each consuming page. */
export function validateClaimConsumers(claims, documents) {
  if (!Array.isArray(claims?.claims)) return ['Claim manifest must contain a claims array'];
  const errors = [], ids = new Set();
  for (const claim of claims.claims) {
    const id = claim?.id;
    if (typeof id !== 'string' || !id.trim() || ids.has(id)) errors.push(`Invalid or duplicate claim id: ${id}`);
    ids.add(id);
    if (!['source-confirmed', 'live-observed', 'upcoming', 'owner-required'].includes(claim?.review_state)) errors.push(`${id}: invalid review_state`);
    if (!Array.isArray(claim?.consumers) || !claim.consumers.length) { errors.push(`${id}: consumers must be a nonempty array`); continue; }
    const seen = new Set();
    for (const consumer of claim.consumers) {
      const name = consumer?.path;
      if (typeof name !== 'string' || !/^(?:help|snippets|release-notes)\/.+\.mdx$/.test(name) || name.split('/').includes('..') || seen.has(name)) {
        errors.push(`${id}: invalid or duplicate consumer path: ${name}`); continue;
      }
      seen.add(name);
      if (!hash(consumer.sha256, 64)) errors.push(`${id}: ${name}: consumer SHA-256 is required`);
      const source = documents.get(name);
      if (typeof source !== 'string') errors.push(`${id}: consumer is missing: ${name}`);
      else if (hash(consumer.sha256, 64) && sha(source) !== consumer.sha256.toLowerCase()) errors.push(`${id}: ${name}: changed consumer requires claim review`);
    }
  }
  return errors;
}

export function validatePolicyLinks(policies, documents) {
  const errors = [];
  const entries = policies?.policies;
  if (!Array.isArray(entries) || entries.length !== 15 || new Set(entries.map((p) => p?.url)).size !== 15) return ['Policy source ledger must identify 15 distinct canonical policy URLs'];
  const legal = [...documents].filter(([name]) => name.startsWith('help/legal/')).map(([, source]) => source).join('\n');
  for (const policy of entries) {
    if (typeof policy.url !== 'string' || !/^https:\/\/open\.beatpass\.ca\/pages\/[a-z0-9-]+$/.test(policy.url)) errors.push(`Invalid canonical policy URL: ${policy.url}`);
    else if (!legal.includes(policy.url)) errors.push(`Missing canonical policy link in legal guidance: ${policy.url}`);
  }
  for (const [name, source] of documents) {
    if (/(?:href\s*=\s*["']\s*|\]\(\s*)(?:https:\/\/open\.beatpass\.ca)?\/pages\/dmca(?=[\/?#"'\s)])/i.test(source)) errors.push(`${name}: obsolete /pages/dmca link`);
    if (/license certificate clears the claim/i.test(source.replace(/[*_`]/g, ''))) errors.push(`${name}: a license certificate must not promise to clear a claim`);
  }
  return errors;
}

function walk(directory) {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : file.endsWith('.mdx') ? [file] : [];
  });
}

function run() {
  const root = path.resolve(import.meta.dirname, '..');
  const read = (name) => JSON.parse(fs.readFileSync(path.join(root, 'audit', name), 'utf8'));
  const documents = new Map(['help', 'snippets', 'release-notes'].flatMap((dir) => walk(path.join(root, dir))).map((file) => [path.relative(root, file).replaceAll('\\', '/'), fs.readFileSync(file, 'utf8')]));
  const records = read('screenshots.json'), claims = read('claim-consumers.json');
  const files = new Map();
  for (const name of new Set([...references(documents), ...(records.screenshots ?? []).map((record) => record?.path)])) {
    if (assetPath(name)) {
      const file = path.join(root, name.slice(1));
      if (fs.existsSync(file) && fs.statSync(file).isFile()) files.set(name, fs.readFileSync(file));
    }
  }
  const errors = [...validateScreenshotProvenance({documents, records, files}), ...validateClaimConsumers(claims, documents), ...validatePolicyLinks(read('policy-sources.json'), documents)];
  if (errors.length) { process.stderr.write(`${errors.join('\n')}\n`); process.exitCode = 1; }
  else process.stdout.write(`Review contract passed for ${documents.size} MDX documents, ${records.screenshots.length} screenshots and ${claims.claims.length} claims.\n`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { run(); } catch (error) { process.stderr.write(`Review contract failed: ${error.message}\n`); process.exitCode = 1; }
}
