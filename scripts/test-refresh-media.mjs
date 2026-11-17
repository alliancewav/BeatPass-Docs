import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {selectWorkflows,parseRefreshArgs,assertDisposable,completeCaptureSet,captureBatches,mergeGeneratedReviews} from './refresh-media.mjs';
const rows=id=>['desktop','mobile'].flatMap(device=>['light','dark'].map(theme=>({id,theme,viewport:{width:device==='mobile'?390:1440},source:{head:'candidate',frontend_sha256:'source',theme_sha256:'theme',navigation_sha256:'menu',role_contract_sha256:'role'}})));
test('bounded capture batches cover every device and theme exactly once',()=>{
 const keys=captureBatches().map(batch=>batch.device+'-'+batch.theme);
 assert.deepEqual([...keys].sort(),['desktop-dark','desktop-light','mobile-dark','mobile-light']);
 assert.equal(new Set(keys).size,4);
 for(const batch of captureBatches())assert.equal(typeof batch.theme,'string');
});
test('selective refresh cannot silently capture unknown, duplicate or all workflows',()=>{
 assert.deepEqual(selectWorkflows('dashboard,leaderboards'),['dashboard','leaderboards']);
 for(const input of ['',undefined,'dashboard,dashboard','missing','../app'])assert.throws(()=>selectWorkflows(input));
});
test('review acceptance is a separate explicit action',()=>{
 assert.throws(()=>parseRefreshArgs(['--accept','--workdir','/tmp/run']));
 assert.throws(()=>parseRefreshArgs(['--accept','--workdir','/tmp/run','--visual-review','Checked all images','--resume']));
 assert.throws(()=>parseRefreshArgs(['--visual-review','checked']));
 assert.throws(()=>parseRefreshArgs(['--workflows','dashboard','--unsafe','yes']));
 assert.throws(()=>parseRefreshArgs(['--workdir','/tmp/a','--workdir','/tmp/b']));
 assert.equal(parseRefreshArgs(['--accept','--workdir','/tmp/run','--visual-review','Checked all four images']).accept,true);
});
test('refresh cannot write a served checkout or traverse a temporary symlink',()=>{
 assert.throws(()=>assertDisposable('/srv/example-app/Documentation'));
 assert.throws(()=>assertDisposable('/tmp/../etc'));
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'docs-refresh-test-'));
 try {
  fs.mkdirSync(path.join(temp,'real'));fs.symlinkSync(path.join(temp,'real'),path.join(temp,'alias'));
  assert.throws(()=>assertDisposable(path.join(temp,'alias','child')));
  assert.equal(assertDisposable(path.join(temp,'real','child')),path.join(temp,'real','child'));
 } finally {fs.rmSync(temp,{recursive:true,force:true});}
});
test('partial, duplicate or unselected screenshots cannot be accepted',()=>{
 assert.equal(completeCaptureSet(rows('leaderboards'),['leaderboards']).length,4);
 assert.throws(()=>completeCaptureSet(rows('leaderboards').slice(0,3),['leaderboards']));
 assert.throws(()=>completeCaptureSet([...rows('leaderboards'),rows('leaderboards')[0]],['leaderboards']));
 assert.throws(()=>completeCaptureSet([...rows('leaderboards'),...rows('dashboard')],['leaderboards']));
});
test('four variants must retain one frozen app/theme/navigation/role candidate',()=>{
 for(const key of ['head','frontend_sha256','theme_sha256','navigation_sha256','role_contract_sha256','fixture_sha256','harness_sha256']) {
  const values=rows('leaderboards');values[3].source[key]='changed';assert.throws(()=>completeCaptureSet(values,['leaderboards']),/drift/);
 }
});

function generatedReviewFixture() {
 const paths=['snippets/media/dashboard.mdx','snippets/media/leaderboards.mdx'];
 const baselineLedger={reviewed_at:'before',pages:[...paths.map(path=>({path,generated:true,reviewed_sha256:'prior-'+path,reviewed_at:'before'})),{path:'help/index.mdx',reviewed_sha256:'prior-help'}]};
 return {baselineLedger,currentLedger:structuredClone(baselineLedger),baselineSnippets:new Map(paths.map(path=>[path,Buffer.from('original '+path)])),currentSnippets:new Map(paths.map(path=>[path,Buffer.from('original '+path)])),updates:paths.map(path=>({path,content:'new '+path,reviewed_at:'now',refresh_run:'reviewed-run'}))};
}
test('generated review updates preserve concurrent unrelated pages and ledger metadata',()=>{
 const input=generatedReviewFixture();
 input.currentLedger.reviewed_at='another editor';input.currentLedger.owner_note='keep this';
 input.currentLedger.pages[2].reviewed_sha256='new-help';
 input.currentLedger.pages.push({path:'help/new-guide.mdx',reviewed_sha256:'new-guide'});
 const before=structuredClone(input.currentLedger),result=mergeGeneratedReviews(input);
 assert.equal(result.reviewed_at,'another editor');assert.equal(result.owner_note,'keep this');
 assert.deepEqual(result.pages.slice(2),before.pages.slice(2));
 assert.equal(result.pages[0].refresh_run,'reviewed-run');assert.equal(result.pages[1].reviewed_at,'now');
 assert.match(result.pages[0].reviewed_sha256,/^[a-f0-9]{64}$/);
 assert.notEqual(result.pages[0].reviewed_sha256,before.pages[0].reviewed_sha256);
 assert.deepEqual(input.currentLedger,before);assert.equal(input.baselineLedger.pages[0].reviewed_at,'before');
});
test('generated review updates refuse selected entry or snippet changes without mutating either ledger',()=>{
 for(const mutate of [
  input=>{input.currentLedger.pages[1].reviewed_at='someone else reviewed it';},
  input=>{input.currentLedger.pages.splice(1,1);},
  input=>{input.currentLedger.pages.push(structuredClone(input.currentLedger.pages[1]));},
  input=>{input.currentSnippets.set(input.updates[1].path,Buffer.from('manually edited figure'));},
  input=>{input.currentSnippets.delete(input.updates[1].path);},
 ]) {
  const input=generatedReviewFixture();mutate(input);
  const before=structuredClone(input.currentLedger),baseline=structuredClone(input.baselineLedger);
  assert.throws(()=>mergeGeneratedReviews(input),/changed during acceptance/);
  assert.deepEqual(input.currentLedger,before);assert.deepEqual(input.baselineLedger,baseline);
 }
});
