import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { stripTypeScriptTypes } from "node:module";
import { workflows } from "./workflows.mjs";
import publicNavigation from "./public-navigation.json" with { type: "json" };
import { projectPublicMenus, assertPublicMenus } from "./navigation.mjs";
import audienceContract from "./audience-contract.json" with { type: "json" };
import { iphone13, retainedViewportTag } from "./device-profiles.mjs";
import {
  coverSvg,
  coverData,
  collectionCoverData,
  avatarData,
} from "./demo-data.mjs";
import { applyDemoBootstrap } from "./bootstrap.mjs";
import { originalDownloadHelper } from "./download-presentation.mjs";
function replaceOnce(source, old, value, label) {
  if (!source.includes(old))
    throw new Error(
      `Current app harness changed at ${label}; inspect before adapting`,
    );
  return source.replace(old, value);
}
export async function prepareAdapter({
  docs,
  frozenFixtures,
  sourceRoot,
  snapshot,
  workdir,
  selected,
  device,
  theme,
  themes,
  provenance,
}) {
  const helperHash = createHash("sha256")
    .update(
      await fs.readFile(path.join(sourceRoot, originalDownloadHelper.path)),
    )
    .digest("hex");
  if (helperHash !== originalDownloadHelper.sha256)
    throw new Error(
      "Original download assertion helper changed; re-review every copied assertion before capture",
    );
  const fixtureRoot = frozenFixtures || path.join(docs, "tests/fixtures/media"),
    target = path.join(
      snapshot,
      "scripts/ci/browser-smoke/visual-followup-scenario.mjs",
    );
  let s = await fs.readFile(
    path.join(
      sourceRoot,
      "scripts/ci/browser-smoke/visual-followup-scenario.mjs",
    ),
    "utf8",
  );
  let runner = await fs.readFile(
    path.join(sourceRoot, "scripts/ci/run-browser-smoke.mjs"),
    "utf8",
  );
  const harnessSha = createHash("sha256")
    .update(s)
    .update("\n--runner--\n")
    .update(runner)
    .digest("hex");
  const harnessDirectory = path.join(workdir, "harness-sources", harnessSha);
  await fs.mkdir(harnessDirectory, { recursive: true });
  await fs.writeFile(
    path.join(harnessDirectory, "visual-followup-scenario.mjs"),
    s,
  );
  await fs.writeFile(
    path.join(harnessDirectory, "run-browser-smoke.mjs"),
    runner,
  );
  // The documentation wallet contains two coherent synthetic records. Names
  // must exist before the source harness applies real search/type filtering.
  s = replaceOnce(
    s,
    "const all = Array.from({ length: 37 }, (_, i) => ({",
    "const all = Array.from({ length: 2 }, (_, i) => ({",
    "two real-shaped demo licenses",
  );
  s = replaceOnce(
    s,
    "track_name: `Licensed beat ${i + 1}`,",
    'track_name: ["Golden Hour","Pocket Theory"][i],',
    "searchable license beat names",
  );
  const eligibilityPath =
    "resources/client/web-player/tracks/track-download-eligibility.ts";
  const eligibilitySource = await fs.readFile(
    path.join(snapshot, eligibilityPath),
    "utf8",
  );
  const eligibilitySha = createHash("sha256")
    .update(eligibilitySource)
    .digest("hex");
  const eligibilityDirectory = path.join(workdir, "runtime-helpers");
  await fs.mkdir(eligibilityDirectory, { recursive: true });
  const eligibilityModule = path.join(
    eligibilityDirectory,
    eligibilitySha + ".mjs",
  );
  let typeOnlyEligibility = eligibilitySource;
  for (const declaration of [
    'import { Track } from "@app/web-player/tracks/track";',
    'import { User } from "@common/auth/user";',
  ]) {
    if (!typeOnlyEligibility.includes(declaration))
      throw new Error("Reviewed eligibility type imports changed");
    typeOnlyEligibility = typeOnlyEligibility.replace(declaration, "");
  }
  const transformedEligibility = {
    code: stripTypeScriptTypes(typeOnlyEligibility, { mode: "strip" }),
  };
  if (/^import /m.test(transformedEligibility.code))
    throw new Error(
      "Download eligibility helper gained runtime imports; review before executing",
    );
  await fs.writeFile(eligibilityModule, transformedEligibility.code);
  s = replaceOnce(
    s,
    '"user-profile/1",',
    '"user-profile/99",',
    "customer profile API route",
  );
  s = replaceOnce(
    s,
    '"users/1/liked-tracks",',
    '"users/99/liked-tracks",',
    "customer profile liked-track route",
  );
  s = replaceOnce(
    s,
    'endpoint === "user-profile/1"',
    'endpoint === "user-profile/99"',
    "customer profile loader response",
  );
  const chosen = workflows
    .filter((w) => selected.includes(w.id))
    .map((flow) =>
      flow.id === "player" && device === "desktop"
        ? { ...flow, route: "/track/11/golden-hour" }
        : flow,
    );

  assertPublicMenus(publicNavigation.menus);
  const configuredMenus = projectPublicMenus(publicNavigation.menus);
  const navigationSha = createHash("sha256")
    .update(JSON.stringify(configuredMenus)).digest("hex");
  if (navigationSha !== publicNavigation.navigation_payload_sha256)
    throw new Error("Published navigation payload changed without reviewed provenance");
  const logos = {};
  for (const [key, file] of Object.entries({
    light: "beatpass-logo-white-wide.svg",
    dark: "beatpass-logo-wide.svg",
  }))
    logos[key] =
      "data:image/svg+xml," +
      encodeURIComponent(
        await fs.readFile(
          path.join(snapshot, "public/assets/images/email", file),
          "utf8",
        ),
      );
  s =
    `import * as mediaDownloadEligibility from ${JSON.stringify(
      eligibilityModule,
    )};\nimport {specialResponse,improveResponse} from ${JSON.stringify(
      path.join(fixtureRoot, "demo-data.mjs"),
    )};\nimport {captureWorkflow} from ${JSON.stringify(
      path.join(fixtureRoot, "capture-workflow.mjs"),
    )};\nconst mediaPhoneProfile=${JSON.stringify(
      iphone13,
    )};\nconst mediaMenus=${JSON.stringify(
      configuredMenus,
    )};\nconst mediaWorkflowList=${JSON.stringify(
      chosen,
    )};\nconst mediaPeopleArtwork=${JSON.stringify(
      Object.fromEntries(
        [
          "Avery Lane",
          "Pine Avenue",
          "Mira Sol",
          "June Keys",
          "Nova Vale",
          "Mira North",
          "Low Tide",
        ].map((name) => [name, avatarData(name)]),
      ),
    )};\nconst mediaRoleContract=${JSON.stringify(
      audienceContract,
    )};\nconst mediaActorByScenario=${JSON.stringify(
      Object.fromEntries(chosen.map((flow) => [flow.scenario, flow.audience])),
    )};\nconst mediaThemes=${JSON.stringify(
      themes.themes,
    )};\nconst mediaArtwork=${JSON.stringify(
      Array.from({ length: 6 }, (_, i) => coverData(11 + i)),
    )};\nconst mediaCollectionArtwork=${JSON.stringify(
      Array.from({ length: 6 }, (_, i) => collectionCoverData(22 + i)),
    )};\nconst mediaLogos=${JSON.stringify(
      logos,
    )};\nconst mediaFontCss=${JSON.stringify(
      themes.font_css || "",
    )};\nconst mediaProvenance=${JSON.stringify({
      head: provenance.head,
      runtime_node_version: process.version,
      role_contract_sha256: createHash("sha256")
        .update(
          await fs.readFile(path.join(fixtureRoot, "audience-contract.json")),
        )
        .digest("hex"),
      frontend_sha256: provenance.frontend_sha256,
      theme_sha256: provenance.theme_sha256,
      fixture_sha256: provenance.fixture_sha256,
      harness_sha256: harnessSha,
      download_helper: originalDownloadHelper,
      download_eligibility_sha256: eligibilitySha,
      frontend_frozen_at: provenance.captured_at,
      ...(chosen.some(flow => flow.id === "requests")
        ? { synthetic_clock_at: "2026-11-03T16:05:55.683Z" } : {}),
      font_assets: themes.font_assets || [],
      navigation_sha256: navigationSha,
      navigation_capture_source_sha256: publicNavigation.navigation_capture_source_sha256,
      navigation_payload_sha256: navigationSha,
      navigation_source: publicNavigation.source,
      navigation_retrieved_at: publicNavigation.retrieved_at,
      navigation: {
        source: publicNavigation.source,
        retrieved_at: publicNavigation.retrieved_at,
        sha256: navigationSha,
        capture_source_sha256: publicNavigation.navigation_capture_source_sha256,
        payload_sha256: navigationSha,
      },
    })};\nconst mediaOutput=${JSON.stringify(
      path.join(workdir, "staging/assets/media/screenshots"),
    )};\nconst mediaManifest=${JSON.stringify(
      path.join(workdir, "media-captures.json"),
    )};\n` + s;
  if (device && !["desktop", "mobile"].includes(device))
    throw new Error("Unknown capture device");
  if (theme && !["light", "dark"].includes(theme))
    throw new Error("Unknown capture theme");
  // Current wide app state still has a blank Insights control (global sr-only
  // conflict). Keep the genuine compact control; never patch app CSS for media.
  const desktopWidth =
    chosen.length === 1 && chosen[0].id === "requests" ? 780 : 1440;
  const viewportList = [
    { width: desktopWidth, height: 1000 },
    { ...iphone13.viewport },
  ].filter(
    (viewport) =>
      !device || (viewport.width < 768 ? "mobile" : "desktop") === device,
  );
  s = replaceOnce(
    s,
    `        if (viewport.width <= 768)
          await page.setViewport({
            ...viewport,
            deviceScaleFactor: 1,
            hasTouch: true,
            isMobile: true,
          });`,
    "        if (viewport.width <= 768) await page.emulate(mediaPhoneProfile);",
    "iPhone13 emulation before navigation",
  );
  const realFramework = await fs.readFile(
    path.join(snapshot, "common/resources/views/framework.blade.php"),
    "utf8",
  );
  const realViewportTag = retainedViewportTag(realFramework);
  const fixtureHtml = path.join(
    snapshot,
    "scripts/ci/browser-smoke/index.html",
  );
  const html = await fs.readFile(fixtureHtml, "utf8");
  if (!/<meta\s+name="viewport"[^>]*\/>/s.test(html))
    throw new Error("Synthetic HTML viewport element is missing");
  // Preserve the real data-keep marker: the app Helmet otherwise removes it.
  await fs.writeFile(
    fixtureHtml,
    html.replace(/<meta\s+name="viewport"[^>]*\/>/s, realViewportTag),
  );
  const a = s.indexOf("const viewports = [");
  const b = s.indexOf("const pagination =", a);
  if (a < 0 || b < 0)
    throw new Error("Current visual harness boundaries missing");
  s =
    s.slice(0, a) +
    `const viewports=${JSON.stringify(
      viewportList,
    )};\nconst cases=mediaWorkflowList.map(w=>[w.scenario,w.route,w.selector]);\n` +
    s.slice(b);
  s = replaceOnce(
    s,
    "for (const dark of [false, true])",
    `for (const dark of ${JSON.stringify(
      theme ? [theme === "dark"] : [false, true],
    )})`,
    "selected capture themes",
  );
  s = replaceOnce(
    s,
    "({ dark, name, language, lines, proYoutube }) => {",
    "({ dark, name, language, lines, proYoutube, mediaThemes, mediaFontCss, mediaArtwork, mediaCollectionArtwork, mediaLogos, mediaMenus, mediaRoleContract, mediaActorByScenario, mediaPeopleArtwork }) => {",
    "bootstrap arguments",
  );
  s = replaceOnce(
    s,
    "            window.__visualSmoke = true;",
    `            ${applyDemoBootstrap.toString()}\n            window.__visualSmoke = true;`,
    "self-contained demo bootstrap",
  );
  const bootstrap = `
                applyDemoBootstrap(data,{dark,name,themes:mediaThemes,fontCss:mediaFontCss,artwork:mediaArtwork,collectionArtwork:mediaCollectionArtwork,logos:mediaLogos,menus:mediaMenus,peopleArtwork:mediaPeopleArtwork,audience:mediaActorByScenario[name],roleContract:mediaRoleContract});
                bootstrap = JSON.stringify(data);`;
  s = replaceOnce(
    s,
    "                bootstrap = JSON.stringify(data);",
    bootstrap,
    "normal demo bootstrap",
  );
  s = replaceOnce(
    s,
    "            proYoutube: {",
    "            mediaThemes,mediaFontCss,mediaArtwork,mediaCollectionArtwork,mediaLogos,mediaMenus,mediaRoleContract,mediaActorByScenario,mediaPeopleArtwork,\n            proYoutube: {",
    "public theme input",
  );
  s = replaceOnce(
    s,
    "          if (privacy) {",
    '          if (privacy && name !== "docs-privacy") {',
    "privacy capture",
  );
  s = replaceOnce(
    s,
    '          const endpoint = url.pathname.replace("/api/v1/", "");',
    `          const endpoint = url.pathname.replace('/api/v1/','');
          if(!fixture)fixture=await page.evaluate(()=>window.__visualFixture).catch(()=>undefined);
          const respond=request.respond.bind(request);request.respond=async response=>{if(response.contentType?.includes('json')&&response.body){try{response={...response,body:JSON.stringify(improveResponse(endpoint,JSON.parse(response.body),url.searchParams))};}catch(error){throw new Error('Invalid synthetic response '+endpoint+': '+error.message);}}return respond(response);};
          const special=specialResponse(endpoint,fixture,url.searchParams);if(special!==undefined){await request.respond({status:200,contentType:'application/json',body:JSON.stringify(special)});return true;}`,
    "populated API adapter",
  );
  // The smoke harness scrolls a fixed privacy action into view before refusal.
  // Restore the real page top before its existing layout assertions; otherwise
  // the first theme can inherit that synthetic bottom-of-page scroll position.
  s = replaceOnce(s,
    '          if (\n            ["dashboard", "dashboard-limited", "finances"].includes(name) &&',
    `          if (process.env.VISUAL_CAPTURE_ONLY) {
            await page.evaluate(() => {
              let owner = document.querySelector("h1")?.parentElement;
              while (owner && owner !== document.body && !/(auto|scroll)/.test(getComputedStyle(owner).overflowY)) owner = owner.parentElement;
              if (owner && owner !== document.body) owner.scrollTo({top:0,behavior:"instant"});
              window.scrollTo({top:0,behavior:"instant"});
            });
            await new Promise(resolve => setTimeout(resolve,350));
          }
          if (
            ["dashboard", "dashboard-limited", "finances"].includes(name) &&`,
    "restore native page top after harness privacy dismissal",
  );
  const start = s.indexOf("          if (process.env.VISUAL_CAPTURE_ONLY) {");
  const end = s.indexOf("          const backstageSelector", start);
  if (start < 0 || end < 0)
    throw new Error("Capture-only branch is unavailable");
  s =
    s.slice(0, start) +
    `          if(process.env.VISUAL_CAPTURE_ONLY){
            const flow=mediaWorkflowList.find(w=>w.scenario===name&&w.route===path);
            const result=await captureWorkflow({page,flow,dark,viewport,output:mediaOutput,manifest:mediaManifest,source:mediaProvenance,assertDownloadPresentation,lines,eligibility:mediaDownloadEligibility});
            await assertHealthy(page,id);report.push({id,path,status:'captured',...result});console.log('Documentation media: '+flow.id+' '+viewport.width+' '+(dark?'dark':'light'));continue;
          }
` +
    s.slice(end);
  s = s.replace("timeout: 120000", "timeout: 45000");
  await fs.writeFile(target, s);

  runner = replaceOnce(
    runner,
    "  await vite.listen();",
    "  await vite.listen();\n  console.log(`Isolated documentation capture: ${origin}`);",
    "loopback startup",
  );
  runner = replaceOnce(
    runner,
    "  browser = await puppeteer.launch({",
    "  browser = await puppeteer.launch({\n    timeout: 120000, protocolTimeout: 120000,",
    "browser startup",
  );
  runner = replaceOnce(
    runner,
    'requestUrl.searchParams.get("domain") ===\n          "https://smoke.example.test"',
    '["https://smoke.example.test","https://avery.example.test"].includes(requestUrl.searchParams.get("domain"))',
    "owned demo website favicon route",
  );
  runner = replaceOnce(
    runner,
    'body: browserSmokeImages.get("/browser-smoke-avatar.svg"),',
    `body: requestUrl.searchParams.get("domain") === "https://avery.example.test" ? ${JSON.stringify(
      decodeURIComponent(avatarData("Avery Lane").split(",")[1]),
    )} : browserSmokeImages.get("/browser-smoke-avatar.svg"),`,
    "Avery website favicon artwork",
  );
  runner = runner
    .replace(
      'createBrowserSmokeSvg("#0f172a", "#4338ca", "#f59e0b")',
      JSON.stringify(coverSvg("avatar")),
    )
    .replace(
      'createBrowserSmokeSvg("#111827", "#7c3aed", "#22d3ee")',
      JSON.stringify(coverSvg("cover")),
    )
    .replace(
      'createBrowserSmokeSvg("#020617", "#be123c", "#fbbf24")',
      JSON.stringify(coverSvg("track")),
    );
  runner = runner.replace(
    '"--disable-setuid-sandbox",',
    '"--disable-setuid-sandbox", "--renderer-process-limit=1",',
  );
  runner = replaceOnce(
    runner,
    'const smokeCache = await mkdtemp(\n  path.join(tmpdir(), "beatpass-browser-smoke-cache-"),\n);',
    `const smokeCache = ${JSON.stringify(path.join(workdir, "vite-cache"))};`,
    "persistent isolated Vite cache",
  );
  runner = replaceOnce(
    runner,
    "  await rm(smokeCache, { recursive: true, force: true });",
    "  // Keep only this isolated dependency cache for serial documentation captures.",
    "retain isolated Vite cache",
  );
  runner = runner.replace(
    ": await resolveChromiumExecutable();",
    ": process.env.DOCS_BROWSER_EXECUTABLE || await resolveChromiumExecutable();",
  );
  runner = replaceOnce(
    runner,
    "    const requestUrl = new URL(request.url());",
    `    const requestUrl = new URL(request.url());
    // Exact synthetic artwork response: intercepted locally; no request is sent to YouTube.
    if(requestUrl.href === "https://i.ytimg.com/vi/demoBeat001/hqdefault.jpg") {
      await request.respond({status:200,contentType:"image/svg+xml",body:${JSON.stringify(
        coverSvg("cover", "Open Windows", "Mira Sol"),
      )}});
      return;
    }`,
    "synthetic recording artwork interception",
  );
  // Existing fail-closed request interception rejects every nonlocal API/provider request.
  await fs.writeFile(
    path.join(snapshot, "scripts/ci/run-docs-media.mjs"),
    runner,
  );
}
