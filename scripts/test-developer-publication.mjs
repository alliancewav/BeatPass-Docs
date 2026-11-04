import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {auditDeveloperPublication, checkDeveloperDocument} from './check-developer-publication.mjs';

const codes = (relative, source) => checkDeveloperDocument(relative, source).map(error => error.code);

test('preserves useful authentication, schemas, rate limits and synthetic contracts', () => {
  const source = 'Authorization: Bearer YOUR_TOKEN_HERE\nX-RateLimit-Limit: 300\nSchema: config, sourceUpdatedAt, trackedPlays.\nhttps://api.example.com/api/v1/tracks';
  assert.deepEqual(codes('developers/example.mdx', source), []);
});

test('rejects internal permissions, infrastructure, source paths and runtime settings', () => {
  const source = 'Requires admin.access.\nDocker setup at /home/example/app/Services/example.php uses DB_PASSWORD and catalog.ai_disclosure.enforce.';
  const errors = codes('developers/example.mdx', source);
  for (const code of ['internal-permission', 'infrastructure', 'source-location', 'runtime-setting']) assert.ok(errors.includes(code));
});

test('rejects private hosts and implementation-level defense details', () => {
  assert.ok(codes('developers/example.mdx', 'https://staging.example.com\nLogin: 5 attempts keyed by email').includes('nonpublic-host'));
  assert.ok(codes('developers/example.mdx', 'Login: 5 attempts keyed by email').includes('authentication-defense-detail'));
  assert.ok(codes('developers/example.mdx', 'The controller does not constrain its scalar type.').includes('validator-detail'));
});

test('rejects operational API categories while retaining approved personal reads', () => {
  const spec = {paths:{'/example':{get:{operationId:'example',tags:['Admin']}},'/tracks':{get:{operationId:'listTracks',tags:['Tracks']}}}};
  const errors = checkDeveloperDocument('developers/api-reference/openapi.json', JSON.stringify(spec));
  assert.equal(errors.filter(error => error.code === 'unsupported-operational-api').length, 1);
});

test('checks rendered developer sources without scanning private audit or machine provenance', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'beatpass-dev-publication-'));
  try {
    for (const directory of ['developers', 'snippets/developer', 'audit', 'tests']) fs.mkdirSync(path.join(root, directory), {recursive:true});
    fs.writeFileSync(path.join(root, 'developers/example.mdx'), 'GET /api/v1/tracks\nAuthorization: Bearer YOUR_TOKEN_HERE');
    fs.writeFileSync(path.join(root, 'snippets/developer/example.mdx'), 'X-RateLimit-Limit: 300');
    fs.writeFileSync(path.join(root, 'audit/private.md'), 'Source: /home/example/app/Services/example.php');
    fs.writeFileSync(path.join(root, 'tests/provenance.json'), '{"source":"app/Services/example.php"}');
    assert.deepEqual(auditDeveloperPublication(root), {files:2, errors:[]});
  } finally {fs.rmSync(root, {recursive:true, force:true});}
});

test('rejects malformed OpenAPI and operations without identifiers', () => {
  assert.ok(codes('developers/api-reference/openapi.json', '{').includes('invalid-openapi-json'));
  const spec = {paths:{'/tracks':{get:{tags:['Tracks']}}}};
  assert.ok(codes('developers/api-reference/openapi.json', JSON.stringify(spec)).includes('missing-operation-id'));
});
