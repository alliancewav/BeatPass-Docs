import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {selectWorkflows,parseRefreshArgs,assertDisposable,completeCaptureSet} from './refresh-media.mjs';
const rows=id=>['desktop','mobile'].flatMap(device=>['light','dark'].map(theme=>({id,theme,viewport:{width:device==='mobile'?390:1440},source:{head:'candidate',frontend_sha256:'source',theme_sha256:'theme',navigation_sha256:'menu',role_contract_sha256:'role'}})));
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
 for(const key of ['head','frontend_sha256','theme_sha256','navigation_sha256','role_contract_sha256']) {
  const values=rows('leaderboards');values[3].source[key]='changed';assert.throws(()=>completeCaptureSet(values,['leaderboards']),/drift/);
 }
});
