import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePublicCopy,validateRepositoryCandidates,credentialIssues,privateProvenanceIssues,hostLayoutIssues} from './check-publication.mjs';

test('editorial release placeholders fail while a user message draft remains legitimate',()=>{
  assert.deepEqual(validatePublicCopy(new Map([['help/messages.mdx','Your message draft stays in this browser.']])),[]);
  for(const text of ['Unpublished draft.','Release date and final scope are still to be confirmed.','---\nstatus: "draft"\n---\nA release.','Insights changes will be added after review.','TODO: confirm price'])assert(validatePublicCopy(new Map([['release-notes/latest.mdx',text]])).length,text);
});
test('private artifacts are rejected even if already in the Git candidate list',()=>{
  const errors=validateRepositoryCandidates(['audit/maintainer-handoff.md','audit/previews/review.png','_source/app/private.php','local-review.patch']);assert.equal(errors.length,4);
  assert.deepEqual(validateRepositoryCandidates(['audit/media-catalog.json','audit/polish-review.json','patches/dependency.patch','tests/fixtures/media/demo-data.mjs']),[]);
});
test('private CI source must be excluded from both repository and website',()=>{
  assert.equal(validateRepositoryCandidates([],{mintignore:'audit/\n',gitignore:'node_modules/\n'}).length,2);
  assert.deepEqual(validateRepositoryCandidates([],{mintignore:'audit/\n_source/\n',gitignore:'node_modules/\n_source/\n'}),[]);
});
test('credential detection reports categories without repeating values',()=>{
  const fake='sk_'+'live_'+'A'.repeat(24);const errors=credentialIssues('example.txt',Buffer.from(fake));assert.equal(errors.length,1);assert(!errors[0].includes(fake));
  assert.deepEqual(credentialIssues('example.js',Buffer.from('Authorization: Bearer YOUR_BEATPASS_TOKEN')),[]);
});

test('public provenance excludes private host paths without banning normal authoring examples',()=>{
  assert.equal(privateProvenanceIssues('audit/media-catalog.json',Buffer.from('{"source":"/@fs/tmp/private-capture/art.png"}')).length,1);
  assert.deepEqual(privateProvenanceIssues('README.md',Buffer.from('Use /tmp/beatpass-review for an isolated copy.')),[]);
  assert.deepEqual(privateProvenanceIssues('audit/media-catalog.json',Buffer.from('{"source_id":"opaque-hash","loaded":true}')),[]);
});

test('actual host layouts are rejected while generic isolation instructions remain publishable',()=>{
  const actual='/'+'home/'+'beatpass-open/'+'htdocs/'+'open.beatpass.ca/Documentation';
  assert.equal(hostLayoutIssues('tests/example.mjs',Buffer.from(actual)).length,1);
  assert.deepEqual(hostLayoutIssues('README.md',Buffer.from('Use /srv/production/Documentation or /tmp/review as the appropriate test input.')),[]);
});
