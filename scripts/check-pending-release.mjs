import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {validatePublicCopy} from './check-publication.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');

// Dispositions are explicit: a deferred area must not quietly become a release claim.
export function releasePathDisposition(name, {deferInsights = false} = {}) {
  if (name.startsWith('/') || name.split('/').some(part => part === '..' || part.startsWith('.env'))) return {mode:'excluded', area:'private or invalid path'};
  if (!/^(app|common|resources|routes|config|public\/(?:images|fonts))\//.test(name) && !['tailwind.config.js','vite.config.mts','vite.config.ts','vite.config.js','package.json','package-lock.json'].includes(name)) return {mode:'excluded', area:'repository tooling'};
  if (name.includes('/__tests__/') || /\.(test|spec)\./.test(name) || name.endsWith('.orig')) return {mode:'excluded', area:'tests or backup'};
  if (deferInsights && (name.includes('/insights/') || name.includes('/Insights/'))) return {mode:'deferred', area:'Insights', reason:'User requested deferral until the frontend is stable.'};
  if (name === 'config/companion.php') return {mode:'watch', area:'held availability', reason:'Desktop downloads are disabled in the reviewed source; do not announce availability.'};
  if (/companion/i.test(name)) return {mode:'held', area:'desktop Companion', reason:'No desktop-download announcement in this release draft.'};
  if (name.startsWith('common/resources/client/admin/') || name.includes('/admin/video-generator/') || /Video(Mux|Chunk)|\/kiosk\//.test(name)) return {mode:'excluded', area:'internal tools'};
  if (/\/producer-dashboard\//.test(name)) {
    const area = /achievement|progress|leaderboard|growth-meter|\/assets\//i.test(name) ? 'Progress and Leaderboards' : /activity|contribution-graph/i.test(name) ? 'Activity' : /recon/i.test(name) ? 'Audio Recon' : /finances|wise|payout/i.test(name) ? 'Finances' : /catalog|tracks-redesign|albums-redesign|collection-release|original-playback/i.test(name) ? 'Catalog' : 'Producer workspace';
    return {mode:'watch', area};
  }
  if (/License|LegalIdentity|ExclusiveCheckout|\/licenses\/|library-licenses|producer-identity|pre-download|track-purchase|track-licensing/i.test(name)) return {mode:'watch', area:'Licensing and identity'};
  if (/AudioFingerprint|audio-recon|fingerprinting|ReconArtwork/i.test(name)) return {mode:'watch', area:'Audio Recon and recording identity'};
  if (/Wise|Stripe|Payout|\/billing\//i.test(name)) return {mode:'watch', area:'Billing and payouts'};
  if (/Achievement|Leaderboard|ProducerProgress/.test(name)) return {mode:'watch', area:'Progress and Leaderboards'};
  if (/upload|ModifyTracks|CrupdateTrack|PublishedTrackAudio|TrackAudioIdentity/i.test(name)) return {mode:'watch', area:'Uploads'};
  if (/\/lang\/|translations\.json|\/i18n\//.test(name)) return {mode:'watch', area:'Language'};
  if (/messag|comment|notification|beat-request/i.test(name)) return {mode:'watch', area:'Community and requests'};
  if (/pro-page|\/ProPage\/|artist-page|Youtube|user-profile/i.test(name)) return {mode:'watch', area:'Profiles and videos'};
  if (/\/library\/|\/playlists\//.test(name)) return {mode:'watch', area:'Library and playlists'};
  if (/player-controls|\/player\/|\/tracks\/|\/channels\/|\/radio\//.test(name)) return {mode:'watch', area:'Listening and discovery'};
  return {mode:'watch', area:'Shared interface and supporting source'};
}

export const sourcePathId = name => hash(Buffer.from(name));
export const sourceTreeScope = 'authored-application-tree-v2';

export function validatePendingRelease({manifest, documents, sources, changedPaths, head}) {
  const errors=[];
  if(manifest.schema_version!==2 || manifest.source_scope!==sourceTreeScope || manifest.complete_source_inventory!==true)errors.push('A complete current source-tree review is required for commit-ready documentation.');
  const options={deferInsights:manifest.deferred?.some(row=>row.area==='Insights')===true};
  const known=new Map(),observed=new Map();
  for(const row of manifest.source_files) {
    if(!/^[a-f0-9]{64}$/.test(row.id)||known.has(row.id)||row.sha256!==null&&!/^[a-f0-9]{64}$/.test(row.sha256))errors.push('Invalid or duplicate source fingerprint in the release review.');
    known.set(row.id,row);
  }
  for(const [name,bytes] of sources)observed.set(sourcePathId(name),{name,sha256:hash(bytes)});
  for(const row of manifest.documents) {
    const content=documents.get(row.path);
    if(!content||hash(content)!==row.sha256)errors.push(`${row.path}: release copy changed; review and synchronize all entry points.`);
  }
  errors.push(...validatePublicCopy(documents));
  const page=documents.get(manifest.page)?.toString()||'';
  if(!page.includes(`version: "${manifest.version}"`))errors.push('Release version differs from its reviewed evidence record.');
  for(const [id,row] of known) {
    const actual=observed.get(id);
    if(row.sha256===null?actual!==undefined:!actual||actual.sha256!==row.sha256)errors.push(`Source ${id.slice(0,12)} changed; recheck the relevant guidance and release scope.`);
  }
  for(const name of changedPaths) {
    const mode=releasePathDisposition(name,options).mode;
    if(['watch','held'].includes(mode)&&!known.has(sourcePathId(name)))errors.push(`Source ${sourcePathId(name).slice(0,12)} is new and has no release-review disposition.`);
  }
  // A reviewed dirty tree may be committed without changing its contents. Git
  // history alone must neither invalidate identical content nor hide new files.
  if(head!==manifest.app_head && manifest.complete_source_inventory!==true)errors.push('Application revision changed without a complete content comparison.');
  return errors;
}

export function changedSourcePaths(root) {
  return [...new Set(execFileSync('git',['--no-optional-locks','ls-files','--cached','--others','--exclude-standard','-z','--','app','common','resources','routes','config','public/images','public/fonts','tailwind.config.js','vite.config.mts','vite.config.ts','vite.config.js','package.json','package-lock.json'],{cwd:root,maxBuffer:32*1024*1024}).toString().split('\0').filter(Boolean))];
}
export function sourceTreeSnapshot(root, {deferInsights=false}={}) {
  const sources=new Map(),dispositions=[];
  for(const name of changedSourcePaths(root)) {
    const disposition=releasePathDisposition(name,{deferInsights});
    if(!['watch','held'].includes(disposition.mode))continue;
    const target=path.join(root,name);dispositions.push({path:name,...disposition});
    if(!fs.existsSync(target))continue;
    const actual=fs.realpathSync(target);
    if(!actual.startsWith(root+path.sep))throw new Error('A source reference escapes the read-only checkout.');
    if(fs.statSync(actual).isFile())sources.set(name,fs.readFileSync(actual));
  }
  return {sources,dispositions};
}
function main() {
  const root=path.resolve(import.meta.dirname,'..');
  const app=fs.realpathSync(process.env.BEATPASS_SOURCE_DIR||path.join(root,'..'));
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'audit/pending-release.json'),'utf8'));
  const documents=new Map(manifest.documents.map(row=>[row.path,fs.readFileSync(path.join(root,row.path))]));
  const options={deferInsights:manifest.deferred?.some(row=>row.area==='Insights')===true};
  const {sources,dispositions}=sourceTreeSnapshot(app,options);
  const head=execFileSync('git',['--no-optional-locks','rev-parse','HEAD'],{cwd:app}).toString().trim();
  const errors=validatePendingRelease({manifest,documents,sources,changedPaths:dispositions.map(row=>row.path),head});
  if(errors.length)throw new Error(errors.slice(0,20).join('\n')+(errors.length>20?`\n... ${errors.length} release-sync findings in total.`:''));
  process.stdout.write(`Release ${manifest.version} synchronized: ${documents.size} entry points, ${sources.size} complete-tree content fingerprints. Identical source remains valid after committing the reviewed application tree.\n`);
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){try{main();}catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}}
