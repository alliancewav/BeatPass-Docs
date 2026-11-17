import test from 'node:test';
import assert from 'node:assert/strict';
import {extendBootstrapArguments} from '../tests/fixtures/media/adapter.mjs';

const bootstrap = `({
            dark,
            name,
            language,
            lines,
            proYoutube,
            proMediaCount,
            proDetailState,
            licenseStress,
            configuredTheme,
            configuredThemes,
          }) => {`;

test('guide adapter preserves current theme and scenario inputs', () => {
  const extended = extendBootstrapArguments(bootstrap);
  for (const name of ['proMediaCount', 'proDetailState', 'licenseStress', 'configuredTheme', 'configuredThemes', 'mediaRoleContract', 'mediaActorByScenario']) {
    assert.match(extended, new RegExp('\\b' + name + '\\b'));
  }
  assert.equal(extended.split('configuredThemes,').length, 2);
});

test('unreviewed bootstrap changes stop guide capture', () => {
  assert.throws(() => extendBootstrapArguments(bootstrap.replace('configuredThemes,', 'newThemeInput,')), /bootstrap arguments/);
});
