import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {releasePathDisposition,validatePendingRelease,sourcePathId,sourceTreeScope} from './check-pending-release.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
function fixture() {
  const page=Buffer.from('---\nversion: "4.2.1"\n---\nA finished customer announcement.\n');
  const source=Buffer.from('Reviewed catalog behavior.');
  const name='resources/client/producer-dashboard/catalog.tsx';
  return {manifest:{schema_version:2,source_scope:sourceTreeScope,complete_source_inventory:true,deferred:[],app_head:'reviewed',version:'4.2.1',page:'release-notes/next.mdx',documents:[{path:'release-notes/next.mdx',sha256:hash(page)}],source_files:[{id:sourcePathId(name),sha256:hash(source)}]},documents:new Map([['release-notes/next.mdx',page]]),sources:new Map([[name,source]]),changedPaths:[name],head:'reviewed'};
}
test('a reviewed source tree stays valid when committed unchanged',()=>{
  const x=fixture();assert.deepEqual(validatePendingRelease(x),[]);x.head='new commit with identical content';assert.deepEqual(validatePendingRelease(x),[]);
});
test('changed or removed source invalidates the release even at the same Git revision',()=>{
  const x=fixture();x.sources.set(x.changedPaths[0],Buffer.from('Changed selection behavior.'));assert.match(validatePendingRelease(x).join('\n'),/Source .* changed/);
  x.sources.clear();assert.match(validatePendingRelease(x).join('\n'),/Source .* changed/);
});
test('new committed or uncommitted source is detected from the whole tree',()=>{
  const x=fixture();x.head='new commit';x.changedPaths.push('resources/client/web-player/library/new-control.tsx');assert.match(validatePendingRelease(x).join('\n'),/new and has no release-review disposition/);
});
test('Insights is included by default; held feature availability remains watched',()=>{
  assert.equal(releasePathDisposition('resources/client/web-player/backstage/insights/new-report.tsx').mode,'watch');
  assert.equal(releasePathDisposition('config/companion.php').mode,'watch');assert.equal(releasePathDisposition('resources/client/companion/tool.tsx').mode,'held');
  const x=fixture();x.changedPaths.push('resources/client/companion/new-tool.tsx');assert.match(validatePendingRelease(x).join('\n'),/new and has no release-review disposition/);
});
test('editorial placeholders and partial source reviews cannot be prepared for publication',()=>{
  const x=fixture();x.documents.set(x.manifest.page,Buffer.from('---\nversion: "4.2.1"\nstatus: "draft"\n---\nUnpublished draft.'));x.manifest.complete_source_inventory=false;
  const errors=validatePendingRelease(x).join('\n');assert.match(errors,/complete current source-tree review/);assert.match(errors,/editorial/);assert.match(errors,/release copy changed/);
});
test('source fingerprints expose stable opaque identifiers rather than private filenames',()=>{
  const id=sourcePathId('app/Services/PrivateExample.php');assert.match(id,/^[a-f0-9]{64}$/);assert(!id.includes('PrivateExample'));
});
test('secret files, backups and internal tool paths stay outside the customer review scope',()=>{
  for(const name of ['../.env','app/.env','.env','resources/client/example.tsx.orig','resources/client/admin/video-generator/tool.tsx'])assert.equal(releasePathDisposition(name).mode,'excluded',name);
});
