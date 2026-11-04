import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {updateNavigation} from './rebuild-navigation.mjs';

const fixture = {
  navigation: {tabs: [
    {tab: 'Help Center', groups: [{group: 'Start Here', pages: [
      'help/getting-started/quick-start-guides/index', 'help/new-maintainer-guide',
      'help/earnings/stripe-connect/index', 'help/earnings/stripe-connect/setup-guide',
    ]}]},
    {tab: "What's New", groups: [{group: 'Current Releases', pages: ['release-notes/v4.0/4.2.1']}]},
    {tab: 'API & Developers', groups: [{group: 'API Reference', pages: ['developers/api-reference/commerce']}]},
  ]},
  redirects: [{source: '/old-guide', destination: '/new-guide', permanent: true}],
};

test('preserves releases, developer navigation, redirects, and added Help pages', () => {
  const result = updateNavigation(fixture);
  assert.deepEqual(result.navigation.tabs.slice(1), fixture.navigation.tabs.slice(1));
  assert.deepEqual(result.redirects, fixture.redirects);
  assert(result.navigation.tabs[0].groups[0].pages.includes('help/new-maintainer-guide'));
  assert(result.navigation.tabs[0].groups[0].pages.includes('help/getting-started/quick-start-guides/subscriber-guide'));
  assert.equal(fixture.navigation.tabs[0].groups[0].pages[0], 'help/getting-started/quick-start-guides/index');
});

test('is idempotent and deduplicates a replaced subscriber entry', () => {
  const input = structuredClone(fixture);
  input.navigation.tabs[0].groups[0].pages.push('help/getting-started/quick-start-guides/subscriber-guide');
  const result = updateNavigation(input);
  assert.equal(result.navigation.tabs[0].groups[0].pages.filter((page) => page.endsWith('subscriber-guide')).length, 1);
  assert.deepEqual(updateNavigation(result), result);
});

test('refuses unexpected navigation shapes', () => {
  assert.throws(() => updateNavigation({}), /Missing Help Center/);
  assert.throws(() => updateNavigation({navigation: {tabs: [{tab: 'Help Center', groups: [{pages: [{}]}]}]}}), /Expected flat/);
});

test('actual navigation retains the flat eight-group contract', () => {
  const config = JSON.parse(readFileSync(new URL('../docs.json', import.meta.url), 'utf8'));
  const groups = config.navigation.tabs.find((tab) => tab.tab === 'Help Center').groups;
  assert.equal(groups.length, 8);
  assert(groups.flatMap((group) => group.pages).length <= 160);
  assert.deepEqual(updateNavigation(config), config);
});
