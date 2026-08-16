import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contentRoots = ['help', 'developers', 'release-notes'];
const iconAliases = {
  sparkles: 'wand-magic-sparkles',
  'chart-mixed': 'chart-line',
  text: 'font',
  'rectangle-vertical-history': 'clock-rotate-left',
  home: 'house',
  'waveform-lines': 'wave-square',
  history: 'clock-rotate-left',
  'shopping-bag': 'bag-shopping',
  radar: 'bullseye',
  'list-music': 'list',
  'list-ordered': 'list-ol',
  pin: 'thumbtack',
  'comment-lines': 'comment-dots',
  webhook: 'link',
  messages: 'comments',
  'user-music': 'user',
  'file-certificate': 'file-contract',
  'rotate-exclamation': 'triangle-exclamation',
  'hourglass-clock': 'hourglass-half',
  'arrow-down-to-line': 'download',
  archive: 'box-archive',
  'badge-check': 'circle-check',
  search: 'magnifying-glass',
  mail: 'envelope',
};

function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function pascalCase(value) {
  return value
    .replace(/\.mdx$/i, '')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
}

function frontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!match) return undefined;
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

function humanize(filename) {
  return filename
    .replace(/\.mdx$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function normalizePage(file) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  let source = fs.readFileSync(file, 'utf8');

  source = source
    .replaceAll('<CardGroup', '<Columns')
    .replaceAll('</CardGroup>', '</Columns>')
    .replace(/(<Card\b[^>]*?)\s+color=(?:"[^"]*"|'[^']*'|\{[^}]*\})([^>]*>)/g, '$1$2')
    .replace(/href=(['"])\/contact\1/g, 'href="https://open.beatpass.ca/contact"')
    .replace(/\]\(\/contact\)/g, '](https://open.beatpass.ca/contact)')
    .replaceAll('**Your library** → **Licenses**', '**My Licenses**')
    .replaceAll('**Your library** â†’ **Licenses**', '**My Licenses**')
    .replaceAll('Your library → Licenses', 'My Licenses')
    .replaceAll('Your library â†’ Licenses', 'My Licenses')
    .replaceAll('✅', 'Yes')
    .replaceAll('❌', 'No');

  for (const [oldIcon, newIcon] of Object.entries(iconAliases)) {
    source = source.replaceAll(`icon="${oldIcon}"`, `icon="${newIcon}"`);
    source = source.replaceAll(`icon='${oldIcon}'`, `icon='${newIcon}'`);
  }

  const snippetImports = new Map();
  source = source.replace(
    /<Snippet\s+file=(['"])([^'"]+)\1\s*\/>/g,
    (_match, _quote, snippetPath) => {
      const importName = pascalCase(path.basename(snippetPath));
      const absolutePath = snippetPath.startsWith('/snippets/')
        ? snippetPath
        : `/snippets/${snippetPath.replace(/^\/?snippets\//, '')}`;
      snippetImports.set(importName, absolutePath);
      return `<${importName} />`;
    },
  );

  const frontmatterMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontmatterMatch) {
    throw new Error(`Missing frontmatter: ${relative}`);
  }

  let frontmatter = frontmatterMatch[1];
  const title = frontmatterValue(frontmatter, 'title') ?? humanize(path.basename(file));
  const isRelease = relative.startsWith('release-notes/');
  const audience = isRelease ? 'All' : relative.startsWith('developers/') ? 'developers' : 'help';
  const description = isRelease
    ? `Release notes for ${title}.`
    : relative.startsWith('developers/')
      ? `Learn how ${title.toLowerCase()} works in the BeatPass API.`
      : `Learn about ${title.toLowerCase()} in BeatPass.`;
  const canonical = `https://docs.beatpass.ca/${relative.replace(/\.mdx$/, '').replace(/\/index$/, '')}`;

  const missing = [];
  if (!frontmatterValue(frontmatter, 'audience')) missing.push(`audience: ${JSON.stringify(audience)}`);
  if (!frontmatterValue(frontmatter, 'sidebarTitle')) missing.push(`sidebarTitle: ${JSON.stringify(title)}`);
  if (!frontmatterValue(frontmatter, 'description')) missing.push(`description: ${JSON.stringify(description)}`);
  if (!frontmatterValue(frontmatter, 'canonical')) missing.push(`canonical: ${JSON.stringify(canonical)}`);
  if (missing.length > 0) frontmatter = `${frontmatter}\n${missing.join('\n')}`;

  const alreadyImported = new Set(
    [...source.matchAll(/^import\s+([A-Za-z0-9_]+)\s+from\s+['"][^'"]+['"];?$/gm)].map(
      (match) => match[1],
    ),
  );
  const importLines = [...snippetImports.entries()]
    .filter(([name]) => !alreadyImported.has(name))
    .map(([name, importPath]) => `import ${name} from ${JSON.stringify(importPath)};`);

  const body = source.slice(frontmatterMatch[0].length).replace(/^\s+/, '');
  const imports = importLines.length > 0 ? `\n\n${importLines.join('\n')}` : '';
  source = `---\n${frontmatter}\n---${imports}\n\n${body}`;
  fs.writeFileSync(file, source, 'utf8');
}

for (const contentRoot of contentRoots) {
  for (const file of walk(path.join(root, contentRoot)).filter((candidate) => candidate.endsWith('.mdx'))) {
    normalizePage(file);
  }
}

const docsPath = path.join(root, 'docs.json');
const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));
docs.colors = {
  primary: '#187AB4',
  light: '#5BC0F0',
  dark: '#1F8AC8',
};
function normalizeIcons(value) {
  if (Array.isArray(value)) value.forEach(normalizeIcons);
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (key === 'icon' && typeof item === 'string' && iconAliases[item]) value[key] = iconAliases[item];
      else normalizeIcons(item);
    }
  }
}
normalizeIcons(docs);
fs.writeFileSync(docsPath, `${JSON.stringify(docs, null, 2)}\n`, 'utf8');

const openapiPath = path.join(root, 'developers', 'api-reference', 'openapi.json');
const openapi = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));

if (openapi.paths['/playlists']?.put) {
  openapi.paths['/playlists/{playlist}'] ??= {};
  openapi.paths['/playlists/{playlist}'].put = openapi.paths['/playlists'].put;
  delete openapi.paths['/playlists'].put;
}
if (openapi.paths['/verify-license/{uuid}']?.get) {
  openapi.paths['/verify-license/{uuid}'].post = openapi.paths['/verify-license/{uuid}'].get;
  delete openapi.paths['/verify-license/{uuid}'].get;
}
if (openapi.paths['/coupons/validate']) {
  openapi.paths['/billing/coupons/validate'] = openapi.paths['/coupons/validate'];
  delete openapi.paths['/coupons/validate'];
}
delete openapi.paths['/tracks/{id}/comments'];

function ensurePathParameter(openapiPath, method, name, description) {
  const operation = openapi.paths[openapiPath]?.[method];
  if (!operation) return;
  operation.parameters ??= [];
  if (!operation.parameters.some((parameter) => parameter.in === 'path' && parameter.name === name)) {
    operation.parameters.unshift({
      name,
      in: 'path',
      required: true,
      description,
      schema: {type: 'string'},
    });
  }
}

ensurePathParameter('/playlists/{id}', 'delete', 'id', 'Playlist ID or comma-separated playlist IDs.');
ensurePathParameter('/playlists/{id}/follow', 'post', 'id', 'Playlist ID to follow.');
ensurePathParameter('/playlists/{id}/unfollow', 'post', 'id', 'Playlist ID to unfollow.');
ensurePathParameter('/playlists/{playlist}', 'put', 'playlist', 'Playlist ID to update.');

fs.writeFileSync(openapiPath, `${JSON.stringify(openapi, null, 2)}\n`, 'utf8');

console.log('Normalized MDX, theme colors, and confirmed OpenAPI drift.');
