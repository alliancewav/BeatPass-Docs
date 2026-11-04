import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validateScreenshotProvenance, validateClaimConsumers, validatePolicyLinks} from './review-contract.mjs';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6mQAAAAASUVORK5CYII=', 'base64');
const image = '/assets/screenshots/example.png';
const digest = (text) => createHash('sha256').update(text, 'utf8').digest('hex');
function screenshot() {
  return {
    documents: new Map([['help/example.mdx', `<img src="${image}" alt="Synthetic example" />`]]),
    records: {screenshots: [{path: image, captured_at: '2026-10-28T12:00:00Z', source: {head: 'a'.repeat(40), frontend_sha256: 'b'.repeat(64)}, route: '/producer-dashboard', state: 'Empty catalog', viewport: {width: 390, height: 844}, theme: 'dark', synthetic: true}]},
    files: new Map([[image, png]]),
  };
}
function claims(source = 'A café beat 🎵\n') {
  return {claims: [{id: 'eligibility', review_state: 'source-confirmed', consumers: [{path: 'help/example.mdx', sha256: digest(source)}]}]};
}

test('complete provenance accepts a referenced PNG', () => assert.deepEqual(validateScreenshotProvenance(screenshot()), []));
test('missing provenance fails for a Markdown screenshot reference', () => {
  const input = screenshot(); input.documents.set('help/example.mdx', `![Example](${image})`); input.records.screenshots = [];
  assert.match(validateScreenshotProvenance(input).join('\n'), /no provenance record/);
});
test('missing image bytes fail', () => {
  const input = screenshot(); input.files.clear();
  assert.match(validateScreenshotProvenance(input).join('\n'), /file is missing/);
});
test('JPEG bytes cannot masquerade as a PNG', () => {
  const input = screenshot(); input.files.set(image, Buffer.from([255, 216, 255, 224, 255, 217]));
  assert.match(validateScreenshotProvenance(input).join('\n'), /signature does not match/);
});
test('synthetic metadata must be explicitly true', () => {
  for (const value of [false, undefined, 'true']) {
    const input = screenshot(); input.records.screenshots[0].synthetic = value;
    assert.match(validateScreenshotProvenance(input).join('\n'), /synthetic must be true/);
  }
});
test('incomplete source, date, route, state, viewport and theme are rejected', () => {
  const input = screenshot(); Object.assign(input.records.screenshots[0], {captured_at: 'yesterday', source: {head: 'short'}, route: 'https://example.com', state: '', viewport: {width: 0}, theme: 'blue'});
  assert.equal(validateScreenshotProvenance(input).length, 6);
});
test('unused older assets do not require new provenance', () => {
  const input = screenshot(); input.files.set('/assets/screenshots/old.png', Buffer.from('old'));
  assert.deepEqual(validateScreenshotProvenance(input), []);
});
test('claim checks hash exact UTF-8 content', () => assert.deepEqual(validateClaimConsumers(claims(), new Map([['help/example.mdx', 'A café beat 🎵\n']])), []));
test('changing a reviewed consumer invalidates its claim', () => {
  assert.match(validateClaimConsumers(claims(), new Map([['help/example.mdx', 'Changed eligibility\n']])).join('\n'), /changed consumer requires claim review/);
});
test('missing consumer, invalid hash and unsupported review state fail', () => {
  const input = claims(); input.claims[0].review_state = 'verified'; input.claims[0].consumers[0].sha256 = 'short';
  assert.equal(validateClaimConsumers(input, new Map()).length, 3);
});
test('all permitted review states retain consumer hash checks', () => {
  for (const state of ['source-confirmed', 'live-observed', 'upcoming', 'owner-required']) {
    const input = claims(); input.claims[0].review_state = state;
    assert.match(validateClaimConsumers(input, new Map([['help/example.mdx', 'changed']])).join('\n'), /requires claim review/);
  }
});
test('canonical policy closure and claim wording regressions are checked', () => {
  const policies = {policies: Array.from({length: 15}, (_, i) => ({url: `https://open.beatpass.ca/pages/policy-${i}`}))};
  const documents = new Map([['help/legal/index.mdx', policies.policies.map((p) => `[Policy](${p.url})`).join('\n')]]);
  assert.deepEqual(validatePolicyLinks(policies, documents), []);
  documents.set('help/problem.mdx', '[Old policy](/pages/dmca)\nLicense certificate **clears** the claim');
  assert.equal(validatePolicyLinks(policies, documents).length, 2);
  documents.set('help/legal/index.mdx', 'No canonical links');
  assert.equal(validatePolicyLinks(policies, documents).length, 17);
});

// Updating an asset without reviewing its new pixels must invalidate provenance.
test('changed screenshot bytes invalidate a recorded image hash', () => {
  const name = '/assets/screenshots/example.png';
  const bytes = Buffer.from([137,80,78,71,13,10,26,10]);
  const record = {path:name,captured_at:'2026-10-29T00:00:00Z',source:{head:'a'.repeat(40),frontend_sha256:'b'.repeat(64)},route:'/library/licenses',state:'example',viewport:{width:393,height:900},theme:'dark',synthetic:true,image:{sha256:'c'.repeat(64)}};
  const errors = validateScreenshotProvenance({documents:new Map([['help/example.mdx',`![Example](${name})`]]),records:{screenshots:[record]},files:new Map([[name,bytes]])});
  assert(errors.some((error) => error.includes('bytes changed since capture review')));
});

// Consequential announcements need the same exact-copy check as their Help guides.
test('release-note claims remain protected when announcements change', () => {
  const name = 'release-notes/v4.0/4.2.1.mdx';
  const source = 'Producer access is free; standard catalog eligibility still applies.\n';
  const record = {claims: [{id: 'release-eligibility', review_state: 'upcoming', consumers: [{path: name, sha256: digest(source)}]}]};
  assert.deepEqual(validateClaimConsumers(record, new Map([[name, source]])), []);
  assert.match(validateClaimConsumers(record, new Map([[name, source + 'Changed promise.']])).join('\n'), /changed consumer requires claim review/);
  for (const path of ['audit/private.mdx', 'release-notes/../private.mdx']) {
    record.claims[0].consumers[0].path = path;
    assert.match(validateClaimConsumers(record, new Map([[path, source]])).join('\n'), /invalid or duplicate consumer path/);
  }
});
