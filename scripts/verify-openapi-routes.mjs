import fs from 'node:fs';
import path from 'node:path';

const sourceRoot = path.resolve(process.argv[2] ?? process.env.BEATPASS_SOURCE_DIR ?? '../open.beatpass.ca');
const docsRoot = path.resolve(import.meta.dirname, '..');
const routeFiles = ['routes/api.php', 'common/routes/api.php'];
const httpMethods = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head']);

function normalizeRoute(route) {
  let normalized = `/${route}`.replaceAll('\\', '/').replace(/\/{2,}/g, '/');
  normalized = normalized.replace(/^\/v1(?=\/|$)/, '');
  // The User route binder resolves the documented `me` alias to the authenticated user.
  normalized = normalized.replace(/^\/users\/me(?=\/|$)/, '/users/{param}');
  normalized = normalized.replace(/\{[^}]+\}/g, '{param}');
  return normalized.length > 1 ? normalized.replace(/\/$/, '') : normalized;
}

function braceDelta(line) {
  const withoutStrings = line.replace(/(['"])(?:\\.|(?!\1).)*\1/g, '');
  return (withoutStrings.match(/\{/g) ?? []).length - (withoutStrings.match(/\}/g) ?? []).length;
}

function currentPrefix(prefixStack) {
  return prefixStack.map((entry) => entry.value).filter(Boolean).join('/');
}

function extractRoutes(file) {
  const source = fs.readFileSync(file, 'utf8');
  const routes = [];
  const prefixStack = [];
  let depth = 0;

  for (const [index, line] of source.split(/\r?\n/).entries()) {
    const prefixMatch =
      line.match(/Route::prefix\(\s*['"]([^'"]+)['"]\s*\).*?group\s*\(/) ??
      line.match(/Route::group\(\s*\[.*?['"]prefix['"]\s*=>\s*['"]([^'"]+)['"].*?\].*?function/);
    if (prefixMatch) prefixStack.push({value: prefixMatch[1].replace(/^\/+|\/+$/g, ''), baseDepth: depth});

    const prefix = currentPrefix(prefixStack);
    const routeMatch = line.match(
      /Route::(get|post|put|patch|delete|options|head|any)\(\s*['"]([^'"]+)['"]/,
    );
    if (routeMatch) {
      const methods = routeMatch[1] === 'any' ? [...httpMethods] : [routeMatch[1]];
      for (const method of methods) {
        routes.push({
          method,
          path: normalizeRoute(`${prefix}/${routeMatch[2]}`),
          source: `${path.relative(sourceRoot, file).replaceAll('\\', '/')}:${index + 1}`,
        });
      }
    }

    const resourceMatch = line.match(/Route::apiResource\(\s*['"]([^'"]+)['"]/);
    if (resourceMatch) {
      const resource = `${prefix}/${resourceMatch[1]}`;
      const parameter = `{${resourceMatch[1].split('/').at(-1)}}`;
      const actions = {
        index: ['get', resource],
        store: ['post', resource],
        show: ['get', `${resource}/${parameter}`],
        updatePut: ['put', `${resource}/${parameter}`],
        updatePatch: ['patch', `${resource}/${parameter}`],
        destroy: ['delete', `${resource}/${parameter}`],
      };
      const except = new Set(
        (line.match(/->except\(\[([^\]]+)\]\)/)?.[1].match(/['"]([^'"]+)['"]/g) ?? []).map((item) =>
          item.replace(/['"]/g, ''),
        ),
      );
      const onlyMatch = line.match(/->only\(\[([^\]]+)\]\)/);
      const only = onlyMatch
        ? new Set((onlyMatch[1].match(/['"]([^'"]+)['"]/g) ?? []).map((item) => item.replace(/['"]/g, '')))
        : null;
      for (const [action, [method, resourcePath]] of Object.entries(actions)) {
        const baseAction = action.startsWith('update') ? 'update' : action;
        if (except.has(baseAction) || (only && !only.has(baseAction))) continue;
        routes.push({
          method,
          path: normalizeRoute(resourcePath),
          source: `${path.relative(sourceRoot, file).replaceAll('\\', '/')}:${index + 1}`,
        });
      }
    }

    depth += braceDelta(line);
    while (prefixStack.length > 0 && depth <= prefixStack.at(-1).baseDepth) prefixStack.pop();
  }
  return routes;
}

for (const relative of routeFiles) {
  const full = path.join(sourceRoot, relative);
  if (!fs.existsSync(full)) {
    console.error(`Missing application route file: ${full}`);
    process.exit(2);
  }
}

function resolveGitSha(repository) {
  const gitPath = path.join(repository, '.git');
  if (!fs.existsSync(gitPath)) return 'source checkout';
  const gitDir = fs.statSync(gitPath).isDirectory()
    ? gitPath
    : path.resolve(repository, fs.readFileSync(gitPath, 'utf8').trim().replace(/^gitdir:\s*/, ''));
  const head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
  if (!head.startsWith('ref: ')) return head;
  const ref = head.slice(5);
  const looseRef = path.join(gitDir, ...ref.split('/'));
  if (fs.existsSync(looseRef)) return fs.readFileSync(looseRef, 'utf8').trim();
  const packedRefs = path.join(gitDir, 'packed-refs');
  if (fs.existsSync(packedRefs)) {
    const packed = fs.readFileSync(packedRefs, 'utf8').split(/\r?\n/).find((line) => line.endsWith(` ${ref}`));
    if (packed) return packed.split(' ')[0];
  }
  return head;
}

const sourceSha = resolveGitSha(sourceRoot);
const routes = routeFiles.flatMap((relative) => extractRoutes(path.join(sourceRoot, relative)));
const routeIndex = new Map(routes.map((route) => [`${route.method} ${route.path}`, route]));
const openapi = JSON.parse(
  fs.readFileSync(path.join(docsRoot, 'developers', 'api-reference', 'openapi.json'), 'utf8'),
);
const missing = [];
const invalidParameters = [];
let operationCount = 0;

for (const [openapiPath, pathItem] of Object.entries(openapi.paths)) {
  for (const method of Object.keys(pathItem)) {
    if (!httpMethods.has(method)) continue;
    operationCount += 1;
    const key = `${method} ${normalizeRoute(openapiPath)}`;
    if (!routeIndex.has(key)) {
      missing.push({method: method.toUpperCase(), path: openapiPath, operationId: pathItem[method].operationId});
    }
    const parameterNames = [...openapiPath.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
    const declaredParameters = [...(pathItem.parameters ?? []), ...(pathItem[method].parameters ?? [])]
      .filter((parameter) => parameter.in === 'path')
      .map((parameter) => parameter.name);
    for (const parameter of parameterNames) {
      if (!declaredParameters.includes(parameter)) {
        invalidParameters.push({method: method.toUpperCase(), path: openapiPath, parameter});
      }
    }
  }
}

if (missing.length > 0 || invalidParameters.length > 0) {
  console.error(`OpenAPI parity failed for ${operationCount} documented operations.`);
  for (const operation of missing) {
    console.error(`- ${operation.method} ${operation.path} (${operation.operationId ?? 'no operationId'})`);
  }
  for (const operation of invalidParameters) {
    console.error(`- ${operation.method} ${operation.path} does not declare path parameter '${operation.parameter}'`);
  }
  process.exit(1);
}

console.log(`OpenAPI parity passed: ${operationCount} operations match application routes.`);
console.log(`Application baseline: ${sourceSha}`);
