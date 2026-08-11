import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const ref = process.argv[2] ?? 'origin/main';
const docs = JSON.parse(execFileSync('git', ['show', `${ref}:docs.json`], {cwd: root, encoding: 'utf8'}));

function flattenPages(pages) {
  return pages.flatMap((page) => (typeof page === 'string' ? [page] : flattenPages(page.pages ?? [])));
}

const urls = docs.navigation.tabs
  .flatMap((tab) => tab.groups ?? [])
  .flatMap((group) => flattenPages(group.pages ?? []))
  .filter((page, index, pages) => pages.indexOf(page) === index)
  .sort();

const output = {
  repository: 'alliancewav/BeatPass-Docs',
  baselineRef: ref,
  capturedAt: '2026-08-11',
  count: urls.length,
  urls,
};

fs.writeFileSync(path.join(root, 'audit', 'public-url-baseline.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Captured ${urls.length} navigated URLs from ${ref}.`);
