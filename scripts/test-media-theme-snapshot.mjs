import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reusableThemeSnapshot} from './media-theme-snapshot.mjs';

const now = Date.parse('2026-11-13T20:00:00Z');
function snapshot() {
  const themes = {light: {values: {background: '255 255 255'}, is_dark: false}, dark: {values: {background: '0 0 0'}, is_dark: true}};
  return {source: 'https://open.beatpass.ca/', verified_at: '2026-11-13T19:30:00Z', themes, sha256: createHash('sha256').update(JSON.stringify(themes)).digest('hex')};
}
test('one freshly observed theme pair can serve serial capture children', () => {
  assert.equal(reusableThemeSnapshot(snapshot(), now), true);
});
test('expired, future, unverified or modified theme data cannot enter captures', () => {
  for (const patch of [{verified_at: '2026-11-13T18:59:59Z'}, {verified_at: '2026-11-13T20:00:01Z'}, {verified_at: 'invalid'}, {source: 'https://example.test/'}, {sha256: '0'.repeat(64)}]) {
    assert.equal(reusableThemeSnapshot({...snapshot(), ...patch}, now), false);
  }
  const tampered = snapshot();tampered.themes.dark.values.background = '255 0 0';
  assert.equal(reusableThemeSnapshot(tampered, now), false);
  assert.equal(reusableThemeSnapshot(null, now), false);
});
