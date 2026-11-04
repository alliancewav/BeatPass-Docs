import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const methods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);

// Check only material rendered in the public developer reference. Private review
// evidence and test/source provenance are intentionally outside this scope.
const proseRules = [
  ['internal-permission', /\b(?:admin|music|tracks|artists|albums|analytics|licenses|api)\.(?:access|create|update|delete|revoke|export|view)\b/i],
  ['runtime-setting', /\b(?:simple_pagination_tables|catalog\.ai_disclosure\.enforce|recaptcha\.enable\.[a-z_]+)\b/i],
  ['source-location', /(?:\/(?:home|var\/www|srv|tmp)\/[^\s"'<>]+|\b(?:app\/(?:Http|Services|Models|Policies)|common\/(?:Auth|Core)|docs\/engineering)\/[^\s"'<>]+|\broutes\/(?:api|web)\.php\b)/],
  ['infrastructure', /(?:\b(?:Docker|MariaDB|OPcache|PHP-FPM)\b|(?:^|[\s`"'])\.env(?:\.[a-z]+)?(?=$|[\s`"'])|\b(?:DB_HOST|DB_PASSWORD|APP_KEY|AWS_SECRET_ACCESS_KEY)\b)/im],
  ['validator-detail', /(?:does not (?:validate|constrain).{0,70}(?:type|keys)|PHP-array-compatible|strict sum comparison|request regex is not)/i],
  ['authentication-defense-detail', /(?:keyed by (?:email|IP)|Fortify group|login:\s*\d+ attempts|registration:\s*\d+ attempts)/i],
];

function lineAt(source, index) {
  return source.slice(0, index).split('\n').length;
}

export function checkDeveloperDocument(relative, source) {
  const errors = [];
  for (const [code, expression] of proseRules) {
    const match = expression.exec(source);
    if (match) errors.push({file: relative, line: lineAt(source, match.index), code});
  }
  for (const match of source.matchAll(/https?:\/\/[^\s"'<>`)]+/g)) {
    let host;
    try { host = new URL(match[0]).hostname.toLowerCase(); } catch { continue; }
    if (host === 'localhost' || /(?:^|[.-])(?:staging|preview|internal|local|test)(?:[.-]|$)/.test(host) ||
        /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(?:1[6-9]|2\d|3[01])\./.test(host)) {
      errors.push({file: relative, line: lineAt(source, match.index), code: 'nonpublic-host'});
    }
  }
  if (relative.endsWith('openapi.json')) {
    let spec;
    try { spec = JSON.parse(source); } catch {
      errors.push({file: relative, line: 1, code: 'invalid-openapi-json'});
      return errors;
    }
    for (const [route, item] of Object.entries(spec.paths ?? {})) {
      for (const [method, operation] of Object.entries(item)) {
        if (!methods.has(method)) continue;
        const context = `${method.toUpperCase()} ${route}`;
        const tags = operation.tags ?? [];
        if (tags.some(tag => /^(?:auth|admin(?:istration)?|internal|companion|stripe connect|payout providers?)$/i.test(tag)) ||
            /(?:^|\/)(?:admin|internal|companion|webhooks?|stripe-connect|wise)(?:\/|$)/i.test(route) ||
            /(?:administrator[- ]only|requires? (?:an? )?administrator permission)/i.test(operation.description ?? '')) {
          errors.push({file: relative, line: 1, code: 'unsupported-operational-api', operation: context});
        }
        if (typeof operation.operationId !== 'string' || !operation.operationId) {
          errors.push({file: relative, line: 1, code: 'missing-operation-id', operation: context});
        }
      }
    }
  }
  return errors;
}

function filesUnder(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(target) : [target];
  });
}

export function auditDeveloperPublication(root = defaultRoot) {
  const files = [
    ...filesUnder(path.join(root, 'developers')).filter(file => /\.(?:mdx|json)$/.test(file)),
    ...filesUnder(path.join(root, 'snippets', 'developer')).filter(file => file.endsWith('.mdx')),
  ];
  const errors = files.flatMap(file => checkDeveloperDocument(path.relative(root, file).replaceAll('\\', '/'), fs.readFileSync(file, 'utf8')));
  return {files: files.length, errors};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = auditDeveloperPublication(process.argv[2] ? path.resolve(process.argv[2]) : defaultRoot);
  for (const error of result.errors) {
    console.error(`${error.file}:${error.line} ${error.code}${error.operation ? ` (${error.operation})` : ''}`);
  }
  if (result.errors.length) process.exitCode = 1;
  else console.log(`Developer publication checks passed: ${result.files} public documents.`);
}
