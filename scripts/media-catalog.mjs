import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export const variantNames = ['desktop-light', 'desktop-dark', 'mobile-light', 'mobile-dark'];
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const quoted = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const sha = (value, length) => typeof value === 'string' && new RegExp(`^[a-f0-9]{${length}}$`).test(value);
const customerWorkflows = new Set(['discover','track','player','queue','library','playlist','messaging','notifications','profile','license-wallet','download','license-verification','account','billing','privacy']);
const producerWorkflows = new Set(['requests','dashboard','beat-catalog','collection-catalog','upload','rights-declarations','pro-page','audio-recon','finances','payout-setup','activity','progress','leaderboards','achievement-goal','achievement-gallery','sample-safe']);
const actorSignature = actor => JSON.stringify(actor && {...actor,permissions:[...(actor.permissions??[])].sort(),owned_artist_ids:[...(actor.owned_artist_ids??[])].sort()});
export function validateCatalog(catalog, files) {
  const errors = [], ids = new Set(), assets = new Set();
  if (catalog?.schema_version !== 1 || !Array.isArray(catalog.figures)) return ['Media catalog requires schema_version 1 and figures'];
  for (const figure of catalog.figures) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(figure.id) || ids.has(figure.id)) errors.push(`Invalid or duplicate figure id: ${figure.id}`);
    ids.add(figure.id);
    const baselines = new Set(Object.values(figure.variants ?? {}).map((record) => JSON.stringify([record.source?.head, record.source?.frontend_sha256, record.source?.theme_sha256, record.source?.navigation_sha256, record.source?.role_contract_sha256])));
    if (baselines.size > 1) errors.push(`${figure.id}: variants must share the same app and public-theme baseline, including configured navigation`);
    if (new Set(Object.values(figure.variants ?? {}).map(record=>actorSignature(record.actor))).size > 1) errors.push(`${figure.id}: all variants must use the same synthetic account role and eligibility context`);
    if (!figure.alt?.trim() || !figure.caption?.trim()) errors.push(`${figure.id}: descriptive alternative and caption required`);
    for (const key of variantNames) {
      const record = figure.variants?.[key];
      if (!record) { errors.push(`${figure.id}: missing ${key}`); continue; }
      const name = record.path;
      if (typeof name !== 'string' || !/^\/assets\/media\/screenshots\/[a-z0-9/-]+\.png$/.test(name) || name.includes('..')) { errors.push(`${figure.id}: unsafe asset path`); continue; }
      if (assets.has(name)) errors.push(`${name}: asset used by multiple catalog records`);
      assets.add(name);
      if (record.theme !== key.split('-')[1]) errors.push(`${name}: theme differs from variant`);
      if (record.synthetic !== true || record.crop?.reviewed !== true) errors.push(`${name}: synthetic data and reviewed complete framing required`);
      if (![record.viewport?.width, record.viewport?.height, record.image?.width, record.image?.height].every((v) => Number.isInteger(v) && v > 0)) errors.push(`${name}: viewport and image dimensions required`);
      if (record.artwork?.ready !== true || !Array.isArray(record.artwork?.bad_images) || record.artwork.bad_images.length || !Array.isArray(record.artwork?.unpainted_discs) || record.artwork.unpainted_discs.length) errors.push(`${name}: visible artwork must be loaded and painted before capture`);
      if (key.startsWith('mobile-')) {
        const emulation = record.emulation, observed = emulation?.observed;
        if (record.viewport?.width !== 390 || record.viewport?.height !== 844 || record.image?.width !== 1170 || record.image?.height !== 2532) errors.push(`${name}: mobile requires fixed iPhone390x844 CSS and1170x2532 Retina output`);
        if (emulation?.preset !== 'iPhone 13' || emulation.device_scale_factor !== 3 || emulation.is_mobile !== true || emulation.has_touch !== true || !emulation.user_agent?.includes('iPhone')) errors.push(`${name}: actual iPhone mobile/touch emulation required`);
        if (observed?.inner_width !== 390 || observed.inner_height !== 844 || Math.abs((observed.visual_viewport_width ?? 0) - 390) > 0.1 || observed.device_pixel_ratio !== 3 || observed.coarse_pointer !== true || !(observed.max_touch_points >= 1) || !observed.viewport_meta?.includes('width=device-width')) errors.push(`${name}: observed phone layout/viewport metadata does not match iPhone emulation`);
        if (record.capture?.mode !== 'viewport' || record.capture.full_page !== false || record.capture.capture_beyond_viewport !== false || record.crop?.document_clip) errors.push(`${name}: phone screenshots must be native fixed viewports without clips or full-page expansion`);
      }

      if (!sha(record.source?.head, 40) || !sha(record.source?.frontend_sha256, 64) || !sha(record.source?.theme_sha256, 64)) errors.push(`${name}: source and public theme fingerprints required`);
      if (!sha(record.source?.navigation_sha256, 64)) errors.push(`${name}: configured public navigation fingerprint required; generic smoke menus are not release evidence`);
      const actor=record.actor, expected=customerWorkflows.has(figure.id)?'customer':producerWorkflows.has(figure.id)?'producer':actor?.role;
      if (!sha(record.source?.role_contract_sha256,64)) errors.push(`${name}: reviewed synthetic role contract fingerprint required`);
      if (!actor || !['customer','producer'].includes(actor.role) || actor.role!==expected || !Number.isInteger(actor.user_id) || actor.user_id<1 || !Array.isArray(actor.permissions) || !actor.permissions.every(permission=>typeof permission==='string') || !Array.isArray(actor.owned_artist_ids) || !actor.owned_artist_ids.every(id=>Number.isInteger(id)&&id>0) || !Array.isArray(actor.raw_role_names) || actor.authenticated!==true || actor.has_admin!==false || typeof actor.valid_subscription!=='boolean') errors.push(`${name}: explicit intended customer/producer account proof required`);
      else {
        if (actor.permissions.some(permission=>['admin','*','music.update','music.delete'].includes(permission))) errors.push(`${name}: synthetic accounts cannot use wildcard admin or global media-update permissions`);
        if (expected==='customer' && (actor.raw_role_names.some(role=>/admin|artist|producer/i.test(role)) || actor.owned_artist_ids.length || actor.primary_artist_id!=null || actor.can_create_music!==false || actor.is_producer!==false || actor.permissions.includes('music.create'))) errors.push(`${name}: customer screenshots cannot inherit producer ownership or upload access`);
        if (expected==='producer' && (actor.owned_artist_ids.length!==1 || !actor.owned_artist_ids.includes(actor.primary_artist_id) || actor.can_create_music!==true || actor.is_producer!==true || !actor.permissions.includes('music.create'))) errors.push(`${name}: producer screenshots require one owned profile and scoped upload access`);
        if (['track','download'].includes(figure.id) && (actor.paid_download_subscription!==true || actor.paid_product_download_permission!==true || !sha(record.source?.download_eligibility_sha256,64) || actor.track?.viewer_owns_track!==false || !Number.isInteger(actor.track?.owner_id) || actor.track.owner_id===actor.user_id)) errors.push(`${name}: customer catalog licensing requires source-shaped paid download eligibility and another producer's track; own-source state is a different task`);
      }
      if (!record.route?.startsWith('/') || record.route.startsWith('//') || !record.state?.trim()) errors.push(`${name}: route and state required`);
      if (typeof record.captured_at !== 'string' || !/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(record.captured_at) || !Number.isFinite(Date.parse(record.captured_at))) errors.push(`${name}: capture timestamp with timezone required`);
      const bytes = files.get(name);
      if (!bytes) { errors.push(`${name}: image missing`); continue; }
      if (!Buffer.isBuffer(bytes) || bytes.length < 24 || !bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) { errors.push(`${name}: expected PNG bytes`); continue; }
      if (bytes.readUInt32BE(16) !== record.image?.width || bytes.readUInt32BE(20) !== record.image?.height) errors.push(`${name}: recorded image dimensions do not match PNG`);
      if (!sha(record.image?.sha256, 64) || digest(bytes) !== record.image.sha256) errors.push(`${name}: image changed since review`);
    }
  }
  return errors;
}
export function validateMediaReferences(catalog, documents, snippetPaths, assetPaths=[]) {
  const ids=new Set((catalog.figures ?? []).map(figure=>figure.id)), errors=[];
  for (const [name,source] of documents) {
    for (const match of source.matchAll(/from\s+["']\/snippets\/media\/([a-z0-9-]+)\.mdx["']/g)) {
      if (!ids.has(match[1])) errors.push(`${name}: imported figure ${match[1]} is absent from the reviewed catalog`);
    }
  }
  for (const name of snippetPaths) {
    const id=path.basename(name,'.mdx');
    if (!ids.has(id)) errors.push(`${name}: stale or unregistered media snippet`);
  }
  const registeredAssets=new Set((catalog.figures??[]).flatMap(figure=>Object.values(figure.variants??{}).map(record=>record.path)));
  for(const asset of assetPaths) if(!registeredAssets.has(asset)) errors.push(`${asset}: unregistered screenshot; keep unchecked or superseded captures outside public media`);
  return errors;
}
export function renderFigure(figure) {
  // Mintlify transforms MDX <img> elements. Explicit wrappers keep responsive
  // selection reliable. Native image links avoid the pinned Safari zoom wrapper
  // changing its server/client element type during hydration.
  const variant = (name) => {
    const record = figure.variants[name], [device, theme] = name.split('-');
    return `  <div className="bp-media-variant bp-media-${theme} bp-media-${device}" data-bp-media-variant="${name}">\n    <a href={${quoted(record.path)}} target="_blank" rel="noopener noreferrer" aria-label={${quoted('View full screenshot: '+figure.alt)}}>
      <img src={${quoted(record.path)}} alt={${quoted(figure.alt)}} width={${record.image.width}} height={${record.image.height}} loading="lazy" decoding="async" noZoom />
    </a>\n  </div>`;
  };
  return `{/* Generated by scripts/media-catalog.mjs from audit/media-catalog.json. */}\n<Frame caption={${quoted(figure.caption)}}>\n<div className="bp-media" data-bp-media={${quoted(figure.id)}}>\n${variantNames.map(variant).join('\n')}\n</div>\n</Frame>\n`;

}
function main() {
  const root = path.resolve(import.meta.dirname, '..');
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'audit/media-catalog.json'), 'utf8'));
  const files = new Map();
  for (const figure of catalog.figures ?? []) for (const record of Object.values(figure.variants ?? {})) {
    if (typeof record.path === 'string' && record.path.startsWith('/assets/media/screenshots/') && !record.path.includes('..')) {
      const name = path.join(root, record.path.slice(1));
      if (fs.existsSync(name)) files.set(record.path, fs.readFileSync(name));
    }
  }
  const walk = directory => fs.existsSync(directory) ? fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry => entry.isDirectory() ? walk(path.join(directory,entry.name)) : entry.name.endsWith('.mdx') ? [path.join(directory,entry.name)] : []) : [];
  const documents = new Map(['help','developers','release-notes','snippets'].flatMap(directory=>walk(path.join(root,directory))).map(file=>[path.relative(root,file),fs.readFileSync(file,'utf8')]));
  const snippetPaths=walk(path.join(root,'snippets/media')).map(file=>path.relative(root,file));
  const screenRoot=path.join(root,'assets/media/screenshots');
  const screenFiles=directory=>fs.existsSync(directory)?fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?screenFiles(path.join(directory,entry.name)):['/'+path.relative(root,path.join(directory,entry.name)).split(path.sep).join('/')]):[];
  const errors = [...validateCatalog(catalog, files), ...validateMediaReferences(catalog, documents, snippetPaths, screenFiles(screenRoot))];
  if (!errors.length) for (const figure of catalog.figures) {
    const name = path.join(root, 'snippets/media', `${figure.id}.mdx`), content = renderFigure(figure);
    if (process.argv.includes('--write')) { fs.mkdirSync(path.dirname(name), {recursive:true}); fs.writeFileSync(name, content); }
    else if (!fs.existsSync(name) || fs.readFileSync(name, 'utf8') !== content) errors.push(`${path.relative(root, name)}: generated figure is stale; run node scripts/media-catalog.mjs --write`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  process.stdout.write(`Media catalog passed: ${catalog.figures.length} figures, ${files.size} theme and viewport variants.\n`);
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { main(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
