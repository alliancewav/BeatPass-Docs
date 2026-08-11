import fs from 'node:fs';
import path from 'node:path';
import {fas} from '@fortawesome/free-solid-svg-icons';
import {fab} from '@fortawesome/free-brands-svg-icons';

const root = path.resolve(import.meta.dirname, '..');
const docs = JSON.parse(fs.readFileSync(path.join(root, 'docs.json'), 'utf8'));
const schemas = JSON.parse(fs.readFileSync(path.join(root, 'audit', 'frontmatter-schemas.json'), 'utf8'));
const baseline = JSON.parse(fs.readFileSync(path.join(root, 'audit', 'public-url-baseline.json'), 'utf8'));
const errors = [];
const warnings = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function relative(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function parseFrontmatter(source, file) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) {
    errors.push(`${file}: missing frontmatter`);
    return {data: {}, body: source};
  }
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z0-9_"-]+):\s*(.*)$/);
    if (!field) continue;
    const key = field[1].replace(/^"|"$/g, '');
    data[key] = field[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return {data, body: source.slice(match[0].length)};
}

function pageType(file) {
  if (file.startsWith('help/legal/')) return 'legal';
  if (file.startsWith('help/')) return 'help';
  if (file.startsWith('developers/')) return 'developer';
  return 'release-note';
}

function normalizeDocPath(value) {
  return value
    .split('#')[0]
    .split('?')[0]
    .replace(/^https:\/\/docs\.beatpass\.ca\//, '/')
    .replace(/^\/+|\/+$/g, '');
}

function pathCandidates(value) {
  const normalized = normalizeDocPath(value);
  return [
    path.join(root, `${normalized}.mdx`),
    path.join(root, normalized, 'index.mdx'),
  ];
}

function docTargetExists(value) {
  if (value === '/' || value === '') return true;
  const normalized = normalizeDocPath(value);
  if (normalized.startsWith('assets/')) return fs.existsSync(path.join(root, normalized));
  if (normalized === 'release-notes/changelog/rss.xml') return true;
  return pathCandidates(value).some((candidate) => fs.existsSync(candidate));
}

function flattenPages(pages, depth = 2) {
  const output = [];
  for (const page of pages ?? []) {
    if (typeof page === 'string') output.push({page, depth});
    else output.push(...flattenPages(page.pages, depth + 1));
  }
  return output;
}

function collectIcons(value, output = []) {
  if (Array.isArray(value)) value.forEach((item) => collectIcons(item, output));
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (key === 'icon' && typeof item === 'string') output.push({icon: item, file: 'docs.json'});
      collectIcons(item, output);
    }
  }
  return output;
}

const pageFiles = ['help', 'developers', 'release-notes']
  .flatMap((directory) => walk(path.join(root, directory)))
  .filter((file) => file.endsWith('.mdx'));
const redirects = new Map((docs.redirects ?? []).map((item) => [normalizeDocPath(item.source), item]));
const canonicals = new Map();
const icons = collectIcons(docs);
let calloutHeavyPages = 0;

for (const file of pageFiles) {
  const fileName = relative(file);
  const source = fs.readFileSync(file, 'utf8');
  const {data, body} = parseFrontmatter(source, fileName);
  const type = pageType(fileName);
  const schema = schemas.pageTypes[type];

  for (const field of schema.required) {
    if (!data[field]) errors.push(`${fileName}: missing required ${type} frontmatter field '${field}'`);
  }
  if (schema.audience && data.audience && !schema.audience.includes(data.audience)) {
    errors.push(`${fileName}: audience '${data.audience}' is invalid for ${type} pages`);
  }

  const expectedCanonical = `https://docs.beatpass.ca/${fileName.replace(/\.mdx$/, '').replace(/\/index$/, '')}`;
  if (data.canonical && data.canonical !== expectedCanonical) {
    errors.push(`${fileName}: canonical must be ${expectedCanonical}`);
  }
  if (data.canonical) {
    if (canonicals.has(data.canonical)) {
      errors.push(`${fileName}: duplicate canonical also used by ${canonicals.get(data.canonical)}`);
    }
    canonicals.set(data.canonical, fileName);
  }

  if (/<CardGroup\b/.test(body)) errors.push(`${fileName}: deprecated CardGroup component`);
  if (/<Snippet\s+file=/.test(body)) errors.push(`${fileName}: legacy Snippet component call`);
  if (/<Card\b[^>]*\scolor=/.test(body)) errors.push(`${fileName}: per-card color is not permitted`);
  if (type === 'help' && /```/.test(body)) errors.push(`${fileName}: code fences are not permitted in end-user Help`);
  if (type === 'help' && /(?:GET|POST|PUT|PATCH|DELETE)\s+\/api\/v\d|\/api\/v\d\//.test(body)) {
    errors.push(`${fileName}: API internals are not permitted in end-user Help`);
  }
  const pictographs = [...new Set(body.match(/\p{Extended_Pictographic}/gu) ?? [])].filter(
    (symbol) => symbol !== '™',
  );
  if (pictographs.length > 0) errors.push(`${fileName}: unintended emoji ${pictographs.join(' ')}`);
  for (const prohibited of ['Edit Profile', 'cursor-based pagination', 'Choose Files to Upload', 'Upload Your Beats']) {
    if (body.includes(prohibited)) errors.push(`${fileName}: prohibited or stale term '${prohibited}'`);
  }

  for (const match of body.matchAll(/^import\s+[\s\S]*?from\s+['"]([^'"]+\.mdx)['"];?$/gm)) {
    if (!match[1].startsWith('/snippets/')) errors.push(`${fileName}: snippet import must be absolute: ${match[1]}`);
    const target = path.join(root, match[1].replace(/^\//, ''));
    if (!fs.existsSync(target)) errors.push(`${fileName}: missing snippet import ${match[1]}`);
  }

  for (const match of body.matchAll(/\bicon=(['"])([^'"]+)\1/g)) {
    icons.push({icon: match[2], file: fileName});
  }

  for (const match of body.matchAll(/<img\b([^>]*)>/g)) {
    if (!/\balt=(['"])[^'"]+\1/.test(match[1])) errors.push(`${fileName}: image missing descriptive alt text`);
  }

  const linkValues = [
    ...[...body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]),
    ...[...body.matchAll(/\bhref=(['"])([^'"]+)\1/g)].map((match) => match[2]),
  ];
  for (const link of linkValues) {
    if (!link.startsWith('/')) continue;
    const normalized = normalizeDocPath(link);
    if (docTargetExists(normalized) || redirects.has(normalized)) continue;
    errors.push(`${fileName}: bare app path or missing internal target '${link}'`);
  }

  const callouts = (body.match(/<(?:Note|Info|Warning|Tip)\b/g) ?? []).length;
  if (callouts > 2) calloutHeavyPages += 1;
}

const validIcons = new Set([...Object.values(fas), ...Object.values(fab)].map((definition) => definition.iconName));
for (const {icon, file} of icons) {
  const normalized = icon.replace(/^fa-/, '');
  if (!validIcons.has(normalized)) errors.push(`${file}: invalid Font Awesome icon '${icon}'`);
}

const helpTab = docs.navigation.tabs.find((tab) => tab.tab === 'Help Center');
if (!helpTab) errors.push('docs.json: missing Help Center tab');
else {
  const helpPages = helpTab.groups.flatMap((group) => flattenPages(group.pages));
  if (helpTab.groups.length !== 8) errors.push(`docs.json: Help Center must have 8 groups, found ${helpTab.groups.length}`);
  if (helpPages.length > 160) errors.push(`docs.json: Help Center has ${helpPages.length} pages; target is <=160`);
  if (Math.max(...helpPages.map((entry) => entry.depth), 0) > 2) errors.push('docs.json: Help Center depth exceeds 2');
  for (const {page} of helpPages) if (!docTargetExists(page)) errors.push(`docs.json: missing Help page '${page}'`);
}

const releaseTab = docs.navigation.tabs.find((tab) => tab.tab === "What's New");
const releaseGroups = releaseTab?.groups.map((group) => group.group) ?? [];
if (JSON.stringify(releaseGroups) !== JSON.stringify(['Overview', 'Changelog', 'Current Releases', 'Archives'])) {
  errors.push(`docs.json: release navigation groups must be Overview, Changelog, Current Releases, Archives`);
}

const developerTab = docs.navigation.tabs.find((tab) => tab.tab === 'API & Developers');
const developerGroups = developerTab?.groups.map((group) => group.group) ?? [];
if (JSON.stringify(developerGroups) !== JSON.stringify(['Introduction', 'Core Concepts', 'API Reference'])) {
  errors.push('docs.json: developer navigation must contain Introduction, Core Concepts, and API Reference');
}

for (const [source, redirect] of redirects) {
  if (!redirect.permanent) errors.push(`docs.json: redirect '/${source}' must be permanent`);
  if (docTargetExists(source)) errors.push(`docs.json: redirect source '/${source}' still has a page file`);
  if (!docTargetExists(redirect.destination)) errors.push(`docs.json: redirect destination '${redirect.destination}' is missing`);
}

for (const publicPath of baseline.urls) {
  const normalized = normalizeDocPath(publicPath);
  const indexAlias = normalized.endsWith('/index') ? normalized.replace(/\/index$/, '') : normalized;
  if (!docTargetExists(normalized) && !redirects.has(normalized) && !redirects.has(indexAlias)) {
    errors.push(`URL contract: '${publicPath}' is neither a page nor a redirect`);
  }
}

if (baseline.count !== 324 || baseline.urls.length !== 324) {
  errors.push(`audit/public-url-baseline.json: expected 324 URLs, found ${baseline.urls.length}`);
}

const claimLedger = fs.readFileSync(path.join(root, 'audit', 'claims.yml'), 'utf8');
const warningClaims = (claimLedger.match(/^\s+status: review-warning$/gm) ?? []).length;
if (warningClaims > 0) warnings.push(`${warningClaims} production-only claims remain public with review warnings`);
if (calloutHeavyPages > 0) warnings.push(`${calloutHeavyPages} legacy pages exceed the normal two-callout guideline`);

if (errors.length > 0) {
  console.error(`Documentation audit failed with ${errors.length} issue(s):`);
  for (const error of [...new Set(errors)]) console.error(`- ${error}`);
  if (warnings.length > 0) for (const warning of warnings) console.warn(`Warning: ${warning}`);
  process.exit(1);
}

console.log(`Documentation audit passed: ${pageFiles.length} pages, ${baseline.urls.length} protected URLs, ${redirects.size} redirects.`);
console.log(`Help architecture: ${helpTab.groups.length} groups, ${helpTab.groups.flatMap((group) => flattenPages(group.pages)).length} navigated pages, depth 2.`);
console.log(`Components: zero CardGroup, legacy Snippet, and per-card color violations.`);
console.log(`Frontmatter, canonicals, internal targets, app links, image alt text, terminology, and Font Awesome icons passed.`);
for (const warning of warnings) console.warn(`Review warning: ${warning}.`);
