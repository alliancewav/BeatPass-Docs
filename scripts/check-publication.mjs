import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export const publicAuditFiles = new Set([
  'analytics-baseline.md','claims.yml','frontmatter-schemas.json','guideline-errata.md',
  'public-url-baseline.json','screenshots.yml','source-baseline.json','claim-consumers.json',
  'media-catalog.json','media-descriptions.json','pending-release.json','policy-sources.json',
  'polish-review.json','screenshots.json',
].map(name=>'audit/'+name));

export function validatePublicCopy(documents) {
  const errors=[];
  const editorial=[/\bunpublished\s+draft\b/i,/\b(?:release date|final scope)[^.\n]{0,90}(?:to be confirmed|still to be|unconfirmed)/i,/\b(?:TODO|TBD|FIXME)\b/,/\b(?:current|matching|upcoming) app candidate\b/i,/Insights changes will be added/i,/\b(?:scope remains pending|draft for review)\b/i];
  for(const [name,bytes] of documents) {
    const text=bytes.toString(),front=text.match(/^---\s*\n([\s\S]*?)\n---/)?.[1]||'';
    if(/^status:\s*["']?(?:draft|review)["']?\s*$/m.test(front))errors.push(`${name}: editorial workflow status belongs in private review records.`);
    if(editorial.some(pattern=>pattern.test(text)))errors.push(`${name}: unresolved editorial placeholder is not publishable copy.`);
  }
  return errors;
}
export function validateRepositoryCandidates(names, {mintignore,gitignore}={}) {
  const errors=[];
  for(const name of names) {
    if(name.startsWith('_source/') || name.startsWith('.docs-runtime/'))errors.push(`${name}: private source/runtime material must not be committed.`);
    if(name.startsWith('audit/')&&!publicAuditFiles.has(name))errors.push(`${name}: private review artifact must not be committed to the public repository.`);
    if(/\.orig$/.test(name)||/\.patch$/.test(name)&&!name.startsWith('patches/'))errors.push(`${name}: local backup/review patch must not be committed.`);
    if(name.split('/').some(part=>part.startsWith('.env')))errors.push(`${name}: environment files must not be committed.`);
  }
  for(const [label,text] of [['.mintignore',mintignore],['.gitignore',gitignore]]) {
    if(typeof text==='string'&&!text.split(/\r?\n/).some(line=>['_source/','/_source/'].includes(line.trim())))errors.push(`${label}: private CI source checkout exclusion is required.`);
  }
  return errors;
}
export function credentialIssues(name,bytes) {
  const text=bytes.toString();
  const patterns=[['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],['live payment credential',/\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/],['GitHub credential',/\bgh[pousr]_[A-Za-z0-9]{30,}\b/],['cloud access key',/\bAKIA[0-9A-Z]{16}\b/]];
  return patterns.filter(([,pattern])=>pattern.test(text)).map(([category])=>`${name}: credential-looking ${category}; remove it without copying its value into reports.`);
}
export function hostLayoutIssues(name,bytes) {
  return /\/home\/(?:sshscorpio|beatpass-open)\/(?:htdocs|\.cache|\.codex|\.agents)\//.test(bytes.toString()) ? [name+': actual host account/layout must not be published. Use a generic path or opaque evidence reference.'] : [];
}
export function privateProvenanceIssues(name,bytes) {
  if(!['audit/media-catalog.json','audit/screenshots.json','audit/source-baseline.json','audit/pending-release.json','audit/polish-review.json'].includes(name))return [];
  return /(?:\/home\/(?:sshscorpio|beatpass-open)\/|\/tmp\/beatpass-|\/@fs\/(?:tmp|home)\/)/.test(bytes.toString()) ? [name+': host-specific capture/source diagnostics belong in private review evidence.'] : [];
}
function walk(dir) {
  return fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):entry.name.endsWith('.mdx')?[path.join(dir,entry.name)]:[]):[];
}
export function repositoryCandidates(root) {
  return [...new Set(execFileSync('git',['--no-optional-locks','ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root,maxBuffer:16*1024*1024}).toString().split('\0').filter(Boolean))];
}
function main() {
  const root=path.resolve(import.meta.dirname,'..');
  const docs=new Map(['help','developers','release-notes','snippets'].flatMap(dir=>walk(path.join(root,dir))).map(file=>[path.relative(root,file),fs.readFileSync(file)]));
  // An unserved mirror keeps dependencies away from the platform checkout.
  // Read Git candidates from the original documentation checkout, without
  // copying its Git metadata or permitting a different publication contract.
  const repository=process.env.BP_DOCS_REPOSITORY_DIR ? fs.realpathSync(process.env.BP_DOCS_REPOSITORY_DIR) : root;
  if(repository!==root) {
    if(!root.startsWith('/tmp/'))throw new Error('An alternate repository is supported only for a disposable validation mirror.');
    for(const name of ['docs.json','.gitignore','.mintignore'])if(!fs.readFileSync(path.join(root,name)).equals(fs.readFileSync(path.join(repository,name))))throw new Error('Disposable mirror differs from the reviewed publication contract: '+name);
  }
  const names=repositoryCandidates(repository);
  const errors=[...validatePublicCopy(docs),...validateRepositoryCandidates(names,{mintignore:fs.readFileSync(path.join(root,'.mintignore'),'utf8'),gitignore:fs.readFileSync(path.join(root,'.gitignore'),'utf8')})];
  for(const name of names) {
    const file=path.join(root,name);
    if(!fs.existsSync(file)||fs.lstatSync(file).isSymbolicLink()||!fs.statSync(file).isFile()||/\.(?:png|jpe?g|webp|gif|ico|woff2?|ttf|mp[34]|zip)$/i.test(name))continue;
    const bytes=fs.readFileSync(file);
    errors.push(...credentialIssues(name,bytes),...hostLayoutIssues(name,bytes),...privateProvenanceIssues(name,bytes));
  }
  if(errors.length)throw new Error(errors.slice(0,30).join('\n')+(errors.length>30?`\n... ${errors.length} publication issues in total.`:''));
  process.stdout.write(`Publication checks passed: ${docs.size} public MDX files and ${names.length} commit candidates; private review/source material excluded.\n`);
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){try{main();}catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}}
