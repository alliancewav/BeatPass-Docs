import fs from 'node:fs';
import path from 'node:path';
import {validateCatalog,variantNames} from './media-catalog.mjs';
import {publicMediaRecord} from './media-publication.mjs';
const root=path.resolve(import.meta.dirname,'..');
const input=process.argv[2];
if(!input)throw new Error('Usage: node scripts/import-reviewed-media.mjs /tmp/review/media-captures.json [--write] [--fresh]');
const records=JSON.parse(fs.readFileSync(input,'utf8')).captures;
const descriptions=JSON.parse(fs.readFileSync(path.join(root,'audit/media-descriptions.json'),'utf8'));
const catalogPath=path.join(root,'audit/media-catalog.json');
const catalog=fs.existsSync(catalogPath)?JSON.parse(fs.readFileSync(catalogPath,'utf8')):{schema_version:1,figures:[]};
// --fresh creates a new reviewed candidate; retained files remain on disk for review/rollback.
const figures=new Map(process.argv.includes('--fresh') ? [] : catalog.figures.map(figure=>[figure.id,figure]));
for(const id of new Set(records.map(record=>record.id))){
  const variants={};
  for(const record of records.filter(record=>record.id===id&&record.crop?.reviewed===true)){
    const key=(record.viewport.width<=640?'mobile':'desktop')+'-'+record.theme;
    if(variants[key])throw new Error(`${id}: duplicate reviewed ${key}`);
    variants[key]=publicMediaRecord(record);
  }
  if(!variantNames.every(key=>variants[key])){process.stdout.write(`Withheld ${id}: incomplete reviewed set\n`);continue;}
  if(!descriptions[id])throw new Error(`${id}: write a descriptive alternative and customer-facing caption first`);
  figures.set(id,{id,...descriptions[id],variants});
}
const next={schema_version:1,figures:[...figures.values()].sort((a,b)=>a.id.localeCompare(b.id))};
const files=new Map();
for(const figure of next.figures)for(const record of Object.values(figure.variants)){
  if(record.path.startsWith('/assets/media/screenshots/')&&!record.path.includes('..')){
    const file=path.join(root,record.path.slice(1));if(fs.existsSync(file))files.set(record.path,fs.readFileSync(file));
  }
}
const errors=validateCatalog(next,files);if(errors.length)throw new Error(errors.join('\n'));
if(process.argv.includes('--write'))fs.writeFileSync(catalogPath,JSON.stringify(next,null,2)+'\n');
process.stdout.write(`${process.argv.includes('--write')?'Imported':'Checked'} ${next.figures.length} complete reviewed figures.\n`);
