import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {test} from 'node:test';

const docsRoot = resolve(import.meta.dirname, '..');
const schema = JSON.parse(readFileSync(join(docsRoot, 'developers/api-reference/openapi.json'), 'utf8'));
const methods = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head']);
const radioPath = '/radio/{type}/{id}';
assert(schema.paths[radioPath]?.get, 'Fixture must cover the documented radio GET route');

for (const [name, radio, expected] of [
  ['legacy GET remains recognized', "Route::get('radio/{type}/{id}', 'handler');", 0],
  ['GET and POST match retains documented GET', "Route::match(['get', 'post'], 'radio/{type}/{id}', 'handler');", 0],
  ['uppercase match methods are recognized', "Route::match(['GET', 'POST'], 'radio/{type}/{id}', 'handler');", 0],
  ['POST alone does not satisfy documented GET', "Route::match(['post'], 'radio/{type}/{id}', 'handler');", 1],
]) {
  test(name, () => {
    const fixture = mkdtempSync(join(tmpdir(), 'beatpass-doc-routes-'));
    try {
      mkdirSync(join(fixture, 'routes'));
      mkdirSync(join(fixture, 'common/routes'), {recursive: true});
      const routes = [];
      for (const [path, item] of Object.entries(schema.paths)) {
        if (path === radioPath) continue;
        for (const method of Object.keys(item)) {
          if (methods.has(method)) routes.push(`Route::${method}('${path.replace(/^\//, '')}', 'handler');`);
        }
      }
      writeFileSync(join(fixture, 'routes/api.php'),
        "<?php\nRoute::prefix('v1')->group(function () {\n" + [...routes, radio].join('\n') + '\n});\n');
      writeFileSync(join(fixture, 'common/routes/api.php'), '<?php\n');
      const result = spawnSync(process.execPath,
        [join(docsRoot, 'scripts/verify-openapi-routes.mjs'), fixture], {encoding: 'utf8'});
      assert.equal(result.status, expected, result.stdout + result.stderr);
      if (expected === 1) assert.match(result.stderr, /GET \/radio\/\{type\}\/\{id\}/);
    } finally {
      rmSync(fixture, {recursive: true, force: true});
    }
  });
}
