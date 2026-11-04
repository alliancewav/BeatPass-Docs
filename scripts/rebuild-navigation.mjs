import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// docs.json owns navigation. Never reconstruct releases or delete page files.
const replacements = new Map([
  ['help/getting-started/quick-start-guides/index', 'help/getting-started/quick-start-guides/subscriber-guide'],
  ['help/earnings/stripe-connect/index', 'help/licensing-for-producers/audio-recon'],
  ['help/earnings/stripe-connect/setup-guide', 'help/earnings/currencies-and-pricing'],
  ['help/account-settings/developer-api', 'help/profiles/user-profiles/editing-profile'],
]);

export function updateNavigation(config) {
  const result = structuredClone(config);
  const help = result.navigation?.tabs?.find((tab) => tab.tab === 'Help Center');
  if (!help?.groups) throw new Error('Missing Help Center groups; refusing to replace navigation.');
  for (const group of help.groups) {
    if (!Array.isArray(group.pages) || group.pages.some((page) => typeof page !== 'string')) {
      throw new Error('Expected flat Help groups; review the new structure before updating navigation.');
    }
    group.pages = [...new Set(group.pages.map((page) => replacements.get(page) ?? page))];
  }
  for (const group of result.footer?.links ?? []) {
    for (const item of group.items ?? []) {
      if (item.href === 'https://open.beatpass.ca/pages/dmca') {
        item.href = 'https://open.beatpass.ca/pages/dmca-notice-and-takedown-policy';
      }
    }
  }
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some((arg) => !['--check', '--write'].includes(arg)) || args.length > 1) {
    throw new Error('Usage: node scripts/rebuild-navigation.mjs [--check|--write]');
  }
  const docsPath = path.resolve(import.meta.dirname, '../docs.json');
  const current = JSON.parse(fs.readFileSync(docsPath, 'utf8'));
  const updated = updateNavigation(current);
  if (JSON.stringify(updated) === JSON.stringify(current)) {
    console.log('Navigation is current; no files changed.');
  } else if (args.includes('--write')) {
    fs.writeFileSync(docsPath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
    console.log('Updated Help entry points and legal link; preserved releases, redirects, and page files.');
  } else {
    console.error('Navigation updates are pending. Review them, then use --write to update docs.json only.');
    process.exitCode = 1;
  }
}
