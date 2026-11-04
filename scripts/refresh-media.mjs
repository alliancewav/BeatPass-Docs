#!/usr/bin/env node
// Read-only application capture; writes only disposable /tmp output and reviewed Documentation media.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {workflows} from '../tests/fixtures/media/workflows.mjs';
import {variantNames, renderFigure, validateCatalog} from './media-catalog.mjs';

const docs=path.resolve(import.meta.dirname,'..');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const runId=directory=>path.basename(directory)+'-'+sha(directory).slice(0,12);
export function selectWorkflows(value) {
  const ids=(value || '').split(',').filter(Boolean);
  if(!ids.length || new Set(ids).size!==ids.length) throw new Error('Choose unique --workflows IDs; use --list to see them.');
  for(const id of ids) if(!workflows.some(flow=>flow.id===id)) throw new Error('Unknown workflow: '+id);
  return ids;
}
export function parseRefreshArgs(args) {
  const flags=new Set(['help','list','plan','resume','accept']);
  const values=new Set(['workflows','workdir','source','browser','visual-review']);
  const opts={};
  for(let i=0;i<args.length;i++) {
    const key=args[i].replace(/^--/,'');
    if(!args[i].startsWith('--') || (!flags.has(key) && !values.has(key)) || key in opts) throw new Error('Unknown or repeated option: '+args[i]);
    if(flags.has(key))opts[key]=true;
    else {
      if(!args[i+1] || args[i+1].startsWith('--')) throw new Error('Missing value: --'+key);
      opts[key]=args[++i];
    }
  }
  if(opts.accept && (opts.resume || opts.plan || !opts.workdir || !opts['visual-review']?.trim())) throw new Error('Acceptance requires --workdir and --visual-review, after inspecting all four variants.');
  if(opts['visual-review'] && !opts.accept)throw new Error('--visual-review is only used with --accept.');
  return opts;
}
export function assertDisposable(directory) {
  const resolved=path.resolve(directory);
  if(!resolved.startsWith('/tmp/'))throw new Error('Work directory must be an unserved directory under /tmp.');
  let parent=resolved;
  while(!fs.existsSync(parent))parent=path.dirname(parent);
  if(fs.realpathSync(parent)!==parent)throw new Error('Work directory cannot traverse a symlink.');
  return resolved;
}
export function completeCaptureSet(captures, ids) {
  const selected=captures.filter(row=>ids.includes(row.id));
  if(captures.some(row=>!ids.includes(row.id)))throw new Error('Capture manifest contains workflows outside this refresh plan.');
  for(const id of ids) {
    const rows=selected.filter(row=>row.id===id);
    const keys=rows.map(row=>(row.viewport?.width===390?'mobile':'desktop')+'-'+row.theme);
    if(rows.length!==4 || variantNames.some(key=>keys.filter(value=>value===key).length!==1))throw new Error(id+': requires exactly four device/theme captures.');
    if(new Set(rows.map(row=>JSON.stringify([row.source?.head,row.source?.frontend_sha256,row.source?.theme_sha256,row.source?.navigation_sha256,row.source?.role_contract_sha256]))).size!==1)throw new Error(id+': source/theme/role drift between variants.');
  }
  return selected;
}
function run(script,args=[]) {
  return new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[path.join(docs,'scripts',script),...args],{cwd:docs,stdio:'inherit'});
    child.once('error',reject);child.once('exit',(code,signal)=>code===0?resolve():reject(new Error(script+' failed ('+(signal || code)+'); staging and logs retained.')));
  });
}
const html=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function reviewIndex(workdir,rows) {
  const cards=rows.map(row=>`<figure><a href="staging${html(row.path)}"><img src="staging${html(row.path)}" alt="${html(row.id+' '+row.state+' '+row.theme)}"></a><figcaption>${html(row.id+' / '+row.state+' / '+(row.viewport.width===390?'iPhone 13':'desktop')+' / '+row.theme)}<br>${html(row.image.sha256)}</figcaption></figure>`).join('');
  fs.writeFileSync(path.join(workdir,'review.html'),`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>BeatPass screenshot review</title><style>body{font:16px system-ui;background:#191919;color:#fff;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}figure{margin:0;min-width:0}img{display:block;max-width:100%;height:auto;max-height:760px;object-fit:contain;object-position:top left}figcaption{overflow-wrap:anywhere;margin-top:12px;font-size:13px}</style><h1>Review every variant</h1><p>Synthetic data in real frontend components. Check artwork, labels, framing and actions. Click to open the unmodified PNG. Capture success is not visual approval.</p><main>${cards}</main>`);
}
async function capture(opts) {
  const ids=selectWorkflows(opts.workflows);
  const workdir=assertDisposable(opts.workdir || path.join(os.tmpdir(),'beatpass-docs-media-'+new Date().toISOString().replace(/[:.]/g,'-')));
  if(opts.plan) {
    console.log(JSON.stringify({workdir,workflows:ids,variants:variantNames,source:opts.source || path.dirname(docs),steps:['Freeze current frontend and public themes once.','Capture selected workflows serially with resource guard and blocked external browser requests.','Inspect review.html and all original PNG files.','Accept explicitly; replace exact previously reviewed hashes, retain backups, update catalog and generated figures.'],publishes:false},null,2));return;
  }
  fs.mkdirSync(workdir,{recursive:true});
  const planFile=path.join(workdir,'refresh-plan.json');let plan;
  if(opts.resume) {
    plan=read(planFile);
    if(plan.docs!==docs || JSON.stringify(plan.workflows)!==JSON.stringify(ids) || (opts.source && fs.realpathSync(opts.source)!==plan.source))throw new Error('Resume must use the original documentation path, app source and selected workflows; use a new run for a newer candidate.');
  } else {
    if(fs.existsSync(planFile) || fs.existsSync(path.join(workdir,'source-manifest.json')))throw new Error('Use a new work directory, or --resume to continue the same frozen source.');
    const previous=read(path.join(docs,'audit/media-catalog.json'));
    for(const id of ids)if(!previous.figures.some(figure=>figure.id===id))throw new Error('Refresh only known figures; register new figures separately: '+id);
    plan={schema_version:1,id:runId(workdir),created_at:new Date().toISOString(),docs,source:fs.realpathSync(opts.source || path.dirname(docs)),workflows:ids,browser:opts.browser || process.env.DOCS_BROWSER_EXECUTABLE || null};
    fs.writeFileSync(path.join(workdir,'previous-reviewed-media.json'),JSON.stringify({captures:previous.figures.flatMap(figure=>Object.values(figure.variants))},null,2)+'\n');
    fs.writeFileSync(planFile,JSON.stringify(plan,null,2)+'\n');
    fs.writeFileSync(path.join(workdir,'runtime-safe.json'),JSON.stringify({ready:true,serial:true,guard:path.join(docs,'scripts/docs-runtime.mjs'),scope:'The capture driver invokes the owned-process memory/priority/loopback guard; no application runtime or database.'},null,2)+'\n');
  }
  const common=['--source',plan.source,'--workdir',workdir,'--runtime-safe',path.join(workdir,'runtime-safe.json'),...(plan.browser?['--browser',plan.browser]:[])];
  const sourceManifest=path.join(workdir,'source-manifest.json');
  if(!fs.existsSync(sourceManifest))await run('capture-media.mjs',[...common,'--workflows',ids[0],'--device','desktop']);
  const frozenSource=read(sourceManifest),snapshot=frozenSource.snapshot_root;
  console.log('Frozen app candidate: '+frozenSource.frontend_sha256+'; captured '+frozenSource.captured_at+(opts.resume?' (resumed, not a new source snapshot)':''));
  // The first desktop set is already captured; resumptions can safely recapture the same immutable source.
  if(opts.resume)await run('capture-media-batch.mjs',[...common,'--snapshot',snapshot,'--workflows',ids.join(',')]);
  else {
    await run('capture-media-batch.mjs',[...common,'--snapshot',snapshot,'--workflows',ids[0],'--device','mobile']);
    if(ids.length>1)await run('capture-media-batch.mjs',[...common,'--snapshot',snapshot,'--workflows',ids.slice(1).join(',')]);
  }
  const data=read(path.join(workdir,'media-captures.json'));const rows=completeCaptureSet(data.captures,ids);
  if(data.gaps?.length)throw new Error('Capture gaps remain; see media-captures.json and batch logs.');
  reviewIndex(workdir,rows);
  console.log('Staged '+rows.length+' images. Inspect '+path.join(workdir,'review.html')+' and the full-size PNGs.');
  console.log('After visual review: node scripts/refresh-media.mjs --accept --workdir '+workdir+' --visual-review "Describe what you checked in every variant"');
}
async function accept(opts) {
  const workdir=assertDisposable(opts.workdir),plan=read(path.join(workdir,'refresh-plan.json'));
  if(plan.docs!==docs || plan.id!==runId(workdir))throw new Error('Refresh belongs to a different documentation checkout or work directory.');
  const ids=selectWorkflows(plan.workflows.join(','));
  if(opts.workflows && JSON.stringify(selectWorkflows(opts.workflows))!==JSON.stringify(ids))throw new Error('Acceptance must cover the original selected workflow set.');
  const data=read(path.join(workdir,'media-captures.json'));const rows=completeCaptureSet(data.captures,ids);
  if(data.gaps?.length)throw new Error('Capture gaps remain.');
  const previous=read(path.join(workdir,'previous-reviewed-media.json'));
  const catalogFile=path.join(docs,'audit/media-catalog.json'),ledgerFile=path.join(docs,'audit/polish-review.json');
  const catalog=read(catalogFile),ledger=read(ledgerFile),files=new Map();
  for(const figure of catalog.figures)for(const row of Object.values(figure.variants))files.set(row.path,fs.readFileSync(path.join(docs,row.path.slice(1))));
  const reviewed=rows.map(row=>({...row,crop:{...row.crop,reviewed:true}}));
  for(const row of reviewed) {
    if(!/^\/assets\/media\/screenshots\/[a-z-]+\/[a-z-]+\/(desktop|mobile)-(light|dark)\.png$/.test(row.path))throw new Error('Unsafe staged asset path.');
    const current=files.get(row.path),prior=previous.captures.find(item=>item.path===row.path && item.id===row.id && item.crop?.reviewed===true);
    if(!current || !prior || sha(current)!==prior.image.sha256)throw new Error('Existing reviewed image changed; preserve it and review this workflow again: '+row.path);
    files.set(row.path,fs.readFileSync(path.join(workdir,'staging',row.path.slice(1))));
  }
  const next={...catalog,figures:catalog.figures.map(figure=>ids.includes(figure.id)?{...figure,variants:Object.fromEntries(reviewed.filter(row=>row.id===figure.id).map(row=>[(row.viewport.width===390?'mobile':'desktop')+'-'+row.theme,row]))}:figure)};
  const errors=validateCatalog(next,files);if(errors.length)throw new Error(errors.join('\n'));
  for(const id of ids) {
    const name='snippets/media/'+id+'.mdx',bytes=fs.readFileSync(path.join(docs,name));
    const entry=ledger.pages.find(item=>item.path===name);
    if(entry?.generated!==true || entry.reviewed_sha256!==sha(bytes) || bytes.toString()!==renderFigure(catalog.figures.find(figure=>figure.id===id)))throw new Error('Preserve unreviewed or manually edited figure: '+name);
  }
  const backup=path.join(workdir,'before-accept');
  for(const rel of ['audit/media-catalog.json','audit/polish-review.json',...ids.map(id=>'snippets/media/'+id+'.mdx')]) {
    const target=path.join(backup,rel);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(docs,rel),target,fs.constants.COPYFILE_EXCL);
  }
  for(const id of ids)await run('promote-media.mjs',['--workdir',workdir,'--workflow',id,'--previous-manifest',path.join(workdir,'previous-reviewed-media.json'),'--visual-review',opts['visual-review']]);
  await run('import-reviewed-media.mjs',[path.join(workdir,'media-captures.json'),'--write']);
  const updated=read(catalogFile);
  for(const id of ids) {
    const name='snippets/media/'+id+'.mdx',content=renderFigure(updated.figures.find(figure=>figure.id===id));
    fs.writeFileSync(path.join(docs,name),content);
    Object.assign(ledger.pages.find(item=>item.path===name),{reviewed_sha256:sha(content),reviewed_at:new Date().toISOString(),generated_from:'audit/media-catalog.json',refresh_run:plan.id});
  }
  fs.writeFileSync(ledgerFile,JSON.stringify(ledger,null,2)+'\n');
  await run('media-catalog.mjs');await run('review-coverage.mjs');
  const record={...plan,accepted_at:new Date().toISOString(),visual_review:opts['visual-review'],images:read(path.join(workdir,'media-captures.json')).captures.map(row=>({id:row.id,path:row.path,sha256:row.image.sha256,source:row.source,captured_at:row.captured_at})),previous_manifest:path.join(workdir,'previous-reviewed-media.json'),backups:path.join(workdir,'retained-reviewed-assets'),scope:'Local documentation only; no commit, publish, application write or database connection.'};
  const sourceManifest=read(path.join(workdir,'source-manifest.json'));
  const sourceDirectory=path.join(docs,'audit/media-source-snapshots');fs.mkdirSync(sourceDirectory,{recursive:true});
  const sourceRecord={head:sourceManifest.head,frontend_sha256:sourceManifest.frontend_sha256,sourceFiles:sourceManifest.sourceFiles,excluded_non_web_paths:sourceManifest.excluded_non_web_paths,captured_at:sourceManifest.captured_at};
  const sourceFile=path.join(sourceDirectory,sourceManifest.frontend_sha256+'.json');
  if(!fs.existsSync(sourceFile))fs.writeFileSync(sourceFile,JSON.stringify(sourceRecord,null,2)+'\n');
  record.source_manifest=path.relative(docs,sourceFile);
  const history=path.join(docs,'audit/media-refresh-history');fs.mkdirSync(history,{recursive:true});fs.writeFileSync(path.join(history,plan.id+'.json'),JSON.stringify(record,null,2)+'\n');
  console.log('Updated '+ids.join(', ')+'. Existing public paths retained; reviewed originals backed up. No publication performed.');
}
export async function main(args=process.argv.slice(2)) {
  const opts=parseRefreshArgs(args);
  if(opts.help){console.log('Capture: npm run docs:media:refresh -- --workflows dashboard,leaderboards [--source /read-only/app] [--browser /installed/chrome] [--workdir /tmp/run]\nInspect review.html and all PNGs, then accept: npm run docs:media:refresh -- --accept --workdir /tmp/run --visual-review "What you checked"\n--list lists workflows; --plan prints a read-only plan; --resume reuses an existing frozen source.');return;}
  if(opts.list){console.log(workflows.map(flow=>flow.id+'\t'+flow.route).join('\n'));return;}
  if(opts.accept)await accept(opts);else await capture(opts);
}
if(process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
