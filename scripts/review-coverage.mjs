import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export function validateReviewCoverage(documents, ledger) {
  if (!Array.isArray(ledger?.pages)) return ['Editorial review ledger requires pages'];
  const errors=[], seen=new Set();
  for (const entry of ledger.pages) {
    if (seen.has(entry.path)) errors.push(`${entry.path}: duplicate review`);
    seen.add(entry.path);
    if (!documents.has(entry.path)) { errors.push(`${entry.path}: reviewed document missing`); continue; }
    const hash=createHash('sha256').update(documents.get(entry.path)).digest('hex');
    if (entry.reviewed !== true || hash !== entry.reviewed_sha256) errors.push(`${entry.path}: changed or unreviewed content requires editorial review`);
    if (!entry.generated && (!Array.isArray(entry.source_paths) || !entry.source_paths.length || !Array.isArray(entry.remaining_gaps))) errors.push(`${entry.path}: source context and verification limits required`);
    if (entry.generated && !entry.path.startsWith('snippets/media/')) errors.push(`${entry.path}: only catalog-generated figures may use generated review`);
  }
  for (const name of documents.keys()) if (!seen.has(name)) errors.push(`${name}: missing editorial review`);
  return errors;
}
function walk(directory) {
  return fs.existsSync(directory) ? fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(directory,entry.name)):entry.name.endsWith('.mdx')?[path.join(directory,entry.name)]:[]) : [];
}
function main() {
  const root=path.resolve(import.meta.dirname,'..');
  const documents=new Map(['help','developers','release-notes','snippets','assets/snippets'].flatMap(dir=>walk(path.join(root,dir))).map(file=>[path.relative(root,file).replaceAll('\\','/'),fs.readFileSync(file)]));
  const ledger=JSON.parse(fs.readFileSync(path.join(root,'audit/polish-review.json'),'utf8'));
  const errors=validateReviewCoverage(documents,ledger);
  if(errors.length)throw new Error(errors.join('\n'));
  process.stdout.write(`Editorial coverage passed: ${documents.size} MDX files; ${ledger.pages.filter(p=>p.generated).length} generated figures tracked separately.\n`);
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){try{main();}catch(error){process.stderr.write(`${error.message}\n`);process.exitCode=1;}}
