import test from "node:test";
import assert from "node:assert/strict";
import {
  safeAssetPath,
  documentClip,
  localRequestAllowed,
  assertSingleOwnedProfile,
  assertRuntimeReady,
} from "../tests/fixtures/media/safety.mjs";
import { workflows, variants } from "../tests/fixtures/media/workflows.mjs";
test("capture paths cannot escape the media root", () => {
  assert.throws(() =>
    safeAssetPath("/tmp/media", "../app", "ready", "desktop-light"),
  );
  assert.equal(
    safeAssetPath("/tmp/media", "playlist", "populated", "mobile-dark"),
    "/tmp/media/playlist/populated/mobile-dark.png",
  );
});
test("cropping adds document scroll exactly once", () => {
  assert.deepEqual(
    documentClip(
      { x: 10, y: 100, width: 300, height: 400 },
      { width: 393, height: 852 },
      { x: 0, y: 1200 },
    ),
    { x: 10, y: 1300, width: 300, height: 400 },
  );
  assert.throws(() =>
    documentClip(
      { x: 0, y: 900, width: 300, height: 10 },
      { width: 393, height: 852 },
    ),
  );
});
test("browser requests only reach the isolated origin", () => {
  assert.equal(
    localRequestAllowed(
      "https://open.beatpass.ca/api/v1/user/licenses",
      "http://127.0.0.1:39000",
    ),
    false,
  );
  assert.equal(
    localRequestAllowed(
      "http://127.0.0.1:39000/api/v1/tracks",
      "http://127.0.0.1:39000",
    ),
    true,
  );
  assert.equal(
    localRequestAllowed(
      "http://localhost:39000/api/v1/tracks",
      "http://127.0.0.1:39000",
    ),
    false,
  );
});
test("demo identity and runtime fail closed", () => {
  assert.throws(() =>
    assertSingleOwnedProfile({ artists: [{ id: 1 }, { id: 2 }] }),
  );
  assert.throws(() => assertRuntimeReady({ ready: false, serial: true }));
  assert.doesNotThrow(() => assertRuntimeReady({ ready: true, serial: true }));
});
test("every requested workflow has four real-device/theme variants", () => {
  assert.equal(new Set(workflows.map((w) => w.id)).size, 35);
  assert.deepEqual(
    variants.map((v) => v.device + "-" + v.theme),
    ["desktop-light", "desktop-dark", "mobile-light", "mobile-dark"],
  );
  for (const w of workflows) assert.match(w.route, /^\//);
});

import {
  fontUrlAllowed,
  publicFontStyles,
} from "../tests/fixtures/media/public-fonts.mjs";
test("configured public fonts are cached without browser network access", async () => {
  assert.equal(
    fontUrlAllowed("https://fonts.gstatic.com/roboto.woff2", "font"),
    true,
  );
  assert.equal(
    fontUrlAllowed("https://fonts.gstatic.com.evil.test/roboto.woff2", "font"),
    false,
  );
  assert.equal(
    fontUrlAllowed("https://secret@fonts.gstatic.com/roboto.woff2", "font"),
    false,
  );
  const result = await publicFontStyles(
    { light: { font: { family: "Roboto", google: true } } },
    async (url, kind) =>
      Buffer.from(
        kind === "css"
          ? "@font-face{font-family:Roboto;src:url(https://fonts.gstatic.com/demo.woff2)}"
          : "synthetic font bytes",
      ),
  );
  assert.match(result.css, /url\(data:font\/woff2;base64,/);
  assert.equal(result.assets.length, 1);
  await assert.rejects(
    publicFontStyles(
      { light: { font: { family: "Roboto", google: true } } },
      async () =>
        Buffer.from("@font-face{src:url(https://evil.test/font.woff2)}"),
    ),
    /unexpected host/,
  );
});

import {
  iphone13,
  retainedViewportTag,
} from "../tests/fixtures/media/device-profiles.mjs";
test("phone exports use the fixed native iPhone13 emulation profile", () => {
  assert.deepEqual(iphone13.viewport, {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    isLandscape: false,
  });
  assert.match(iphone13.userAgent, /iPhone/);
  assert.equal(
    iphone13.viewport.width * iphone13.viewport.deviceScaleFactor,
    1170,
  );
  assert.equal(
    iphone13.viewport.height * iphone13.viewport.deviceScaleFactor,
    2532,
  );
});

test("synthetic HTML retains the real viewport marker through Helmet updates", () => {
  const meta =
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" data-keep="true" />';
  assert.equal(retainedViewportTag("<head>" + meta + "</head>"), meta);
  assert.throws(() =>
    retainedViewportTag(meta.replace(' data-keep="true"', "")),
  );
  assert.throws(() =>
    retainedViewportTag(meta.replace("width=device-width", "width=980")),
  );
});

import publicNavigation from "../tests/fixtures/media/public-navigation.json" with { type: "json" };
import { createHash } from "node:crypto";
import { projectPublicMenus, assertPublicMenus } from "../tests/fixtures/media/navigation.mjs";
test("published media fixture stores only the identical evaluated nonadmin navigation", () => {
  assertPublicMenus(publicNavigation.menus);
  assert.equal(publicNavigation.menus.length, 7);
  const projected = projectPublicMenus(publicNavigation.menus);
  assert.deepEqual(projected, publicNavigation.menus);
  const digest = createHash("sha256").update(JSON.stringify(projected)).digest("hex");
  assert.equal(digest, "e10634804cdf8bfedf30f9e2b2329478968b43594de06dea9edc1d36503a86a9");
  assert.equal(digest, publicNavigation.navigation_payload_sha256);
  assert.equal(publicNavigation.navigation_capture_source_sha256,
    "a8606ed0548c672d7cb80cf4ca4c08364280b7bd5278f843c7df0f1d0e7e63b5");
  for (const mutate of [
    menu => menu.positions.push("admin-sidebar"),
    menu => menu.items.push({label:"Configuration",action:"/admin/settings"}),
    menu => menu.items.push({label:"Management",action:"/"}),
  ]) {
    const menus = structuredClone(publicNavigation.menus);
    mutate(menus[0]);
    assert.throws(() => assertPublicMenus(menus), /administrator configuration/);
  }
});

test("public phone navigation uses actual routes and distinct configured icons", () => {
  const menu = publicNavigation.menus.find((menu) =>
    menu.positions.includes("mobile-bottom"),
  );
  const visible = menu.items.filter((item) => item.action);
  assert.deepEqual(
    visible.map((item) => [item.label, item.action]),
    [
      ["Home", "/"],
      ["Find", "/search"],
      ["Library", "/library"],
    ],
  );
  assert.equal(
    new Set(visible.map((item) => JSON.stringify(item.icon))).size,
    visible.length,
  );
  assert.equal(menu.items.find((item) => item.label === "Mood").action, null);
});

import roleContract from "../tests/fixtures/media/audience-contract.json" with { type: "json" };
import { applyDemoBootstrap } from "../tests/fixtures/media/bootstrap.mjs";
test("guide actors never inherit admin or another audience's producer access", () => {
  assert.equal(
    workflows.filter((flow) => flow.audience === "customer").length,
    15,
  );
  assert.equal(
    workflows.filter((flow) => flow.audience === "producer").length,
    20,
  );
  for (const role of ["customer", "producer"]) {
    assert.equal(
      roleContract[role].permissions.some(
        (name) =>
          name === "admin" ||
          name.startsWith("admin.") ||
          ["music.update", "music.delete"].includes(name),
      ),
      false,
    );
  }
  const previous = Object.fromEntries(
    ["document", "window", "localStorage"].map((key) => [key, globalThis[key]]),
  );
  try {
    globalThis.document = {
      documentElement: { style: { setProperty() {} } },
      getElementById() {
        return {};
      },
      head: { append() {} },
    };
    globalThis.window = {};
    globalThis.localStorage = {
      getItem() {
        return null;
      },
      setItem() {},
    };
    for (const role of ["customer", "producer"]) {
      const artist = {
        id: 5,
        name: "Pine Avenue",
        model_type: "artist",
        role: "artist",
        owner: { id: 99 },
      };
      const data = {
        themes: { all: [{ values: {} }] },
        user: {
          id: 99,
          roles: [{ id: 1, name: "artists" }],
          permissions: [{ name: "admin" }],
          artists: [artist],
          subscriptions: [],
        },
        settings: { branding: {} },
        likes: {},
        loaders: {
          trackPage: {
            track: {
              id: 11,
              model_type: "track",
              name: "Golden Hour",
              owner_id: 99,
              artists: [artist],
            },
          },
          artistPage: { artist },
        },
      };
      applyDemoBootstrap(data, {
        dark: false,
        name: "fixture-contract",
        audience: role,
        roleContract,
        themes: { light: { values: {}, font: { family: "Roboto" } } },
        artwork: Array(6).fill("demo-cover"),
        collectionArtwork: Array(6).fill("demo-collection"),
        peopleArtwork: {
          "Avery Lane": "demo-avatar",
          "Pine Avenue": "demo-producer",
        },
        logos: { light: "demo-light", dark: "demo-dark" },
        menus: [{ positions: ["mobile-bottom"], items: [] }],
      });
      assert.deepEqual(data.user.roles, []);
      assert.equal(
        data.user.permissions.some((permission) => permission.name === "admin"),
        false,
      );
      assert.equal(
        data.user.permissions.some(
          (permission) => permission.name === "music.create",
        ),
        role === "producer",
      );
      assert.equal(data.user.artists.length, role === "producer" ? 1 : 0);
      assert.equal(data.user.id, role === "producer" ? 101 : 99);
      if (role === "customer") {
        assert.equal(data.user.primary_artist, null);
        assert.notEqual(data.loaders.trackPage.track.owner_id, data.user.id);
        assert.notEqual(
          data.loaders.trackPage.track.artists[0].owner.id,
          data.user.id,
        );
        const sub = data.user.subscriptions[0];
        assert.equal(sub.valid, true);
        assert.equal(sub.product.free, false);
        assert.ok(sub.price.amount > 0);
        assert.ok(
          sub.product.permissions.some(
            (permission) => permission.name === "music.download",
          ),
        );
      } else {
        assert.equal(data.user.primary_artist.id, 5);
        assert.equal(data.user.artists[0].owner.id, 101);
        assert.equal(data.loaders.trackPage.track.owner_id, 101);
        assert.equal(data.user.subscriptions.length, 0);
      }
    }
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});

import { inspectVisibleArtwork } from "../tests/fixtures/media/capture-workflow.mjs";
test("artwork gate ignores fully clipped lazy cards and rejects any visible missing art", () => {
  const saved = Object.fromEntries(
    ["document", "innerWidth", "innerHeight", "getComputedStyle"].map((key) => [
      key,
      globalThis[key],
    ]),
  );
  const rect = (left, right, top = 0, bottom = 80) => ({
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: bottom - top,
  });
  const style = {
    visibility: "visible",
    display: "block",
    opacity: "1",
    overflowX: "visible",
    overflowY: "visible",
  };
  const rail = {
    parentElement: null,
    getBoundingClientRect: () => rect(0, 100),
    style: { ...style, overflowX: "hidden" },
  };
  const lazy = {
    parentElement: rail,
    getBoundingClientRect: () => rect(120, 200),
    style,
    complete: false,
    naturalWidth: 0,
    currentSrc: "http://127.0.0.1/missing.webp",
    src: "http://127.0.0.1/missing.webp",
    alt: "next card",
  };
  try {
    globalThis.innerWidth = 390;
    globalThis.innerHeight = 844;
    globalThis.getComputedStyle = (node) => node.style;
    globalThis.document = { images: [lazy], querySelectorAll: () => [] };
    assert.equal(inspectVisibleArtwork().ready, true);
    lazy.getBoundingClientRect = () => rect(90, 170);
    assert.equal(inspectVisibleArtwork().ready, false);
    lazy.complete = true;
    lazy.naturalWidth = 256;
    assert.equal(inspectVisibleArtwork().ready, true);
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});

import { insightsResponse } from "../tests/fixtures/media/insights-data.mjs";
test("populated report examples keep dates, totals, durations and percentages coherent", () => {
  const params = new URLSearchParams({model:"artist=5",metrics:"plays,devices,platforms,tracks,users,locations",startDate:"2026-10-05T04:00:00Z",endDate:"2026-11-04T04:59:59Z",timezone:"America/Toronto"});
  const fixture = {track:{id:11,name:"Golden Hour",duration:120,model_type:"track"}};
  const report = insightsResponse("insights-report", fixture, params).report;
  for (const [key,metric] of Object.entries(report)) assert.equal(metric.datasets[0].data.reduce((sum,row)=>sum+row.value,0),key === "tracks" ? 5100 : 8400);
  assert.equal(report.tracks.datasets[0].data[0].value, insightsResponse("insights-report",fixture,new URLSearchParams({...Object.fromEntries(params),model:"track=11",metrics:"plays"})).report.plays.total);
  assert.equal(report.plays.datasets[0].data.length,30);
  assert.equal(report.plays.datasets[0].data[0].date,"2026-10-05");
  assert.equal(report.plays.datasets[0].data.at(-1).date,"2026-11-03");
  const {trackDuration,metrics} = insightsResponse("tracks/11/engagement-metrics",fixture,params);
  assert.equal(trackDuration,fixture.track.duration);
  assert.equal(Object.values(metrics.completionBreakdown).reduce((a,b)=>a+b,0),metrics.trackedPlays);
  assert.equal(metrics.listenDurationSeries.reduce((sum,row)=>sum+row.plays,0),metrics.trackedPlays);
  const seconds=metrics.listenDurationSeries.reduce((sum,row)=>sum+row.plays*row.avgDuration,0);
  assert.ok(Math.abs(seconds-metrics.totalListenTime)<0.00001);
  assert.ok(Math.abs(metrics.avgListenDuration/trackDuration*100-metrics.avgCompletionRate)<0.00001);
  assert.ok(metrics.listenDurationSeries.every(row=>row.avgDuration>=0&&row.avgDuration<=trackDuration));
  const pro=insightsResponse("pro/5/insights",fixture,params);
  assert.equal(pro.dimensions.traffic_sources.reduce((sum,row)=>sum+row.engaged_sessions,0),pro.current.primary.engaged_sessions);
  assert.equal(pro.dimensions.traffic_sources.reduce((sum,row)=>sum+row.completed_licensing_actions,0),pro.current.primary.completed_licensing_actions);
  assert.equal(pro.current.funnels.non_member_standard.downloads_completed+pro.current.funnels.member_standard.downloads_completed+pro.current.funnels.exclusive.purchases_completed,pro.current.primary.completed_licensing_actions);
});

import { unrefreshedVariants, assertNoCaptureGap } from "../tests/fixtures/media/safety.mjs";
test("an older complete staged quad cannot mask failed refresh variants", () => {
  const variants=["desktop-light","desktop-dark","mobile-light","mobile-dark"];
  const since=Date.parse("2026-11-03T12:00:00Z");
  const rows=variants.map(variant=>({id:"requests",viewport:{width:variant.startsWith("mobile")?390:1440},theme:variant.split("-")[1],captured_at:"2026-11-03T11:00:00Z"}));
  assert.deepEqual(unrefreshedVariants(rows,"requests",variants,since),variants);
  rows[2].captured_at="2026-11-03T12:01:00Z";
  assert.deepEqual(unrefreshedVariants(rows,"requests",["mobile-light","mobile-dark"],since),["mobile-dark"]);
  assert.throws(()=>assertNoCaptureGap({gaps:[{workflow:"requests",missing_variants:["mobile-dark"]}]},"requests"),/Unresolved capture failure/);
  assert.doesNotThrow(()=>assertNoCaptureGap({gaps:[{workflow:"requests",missing_variants:["mobile-dark"]}]},"dashboard"));
});

import { insightsActionVisible } from "../tests/fixtures/media/safety.mjs";
test("a desktop Insights action must show its native icon or label", () => {
  const hiddenIcon={width:0,height:0,display:"none",visibility:"visible",clip:"auto"};
  const hiddenLabel={width:1,height:1,display:"block",visibility:"visible",clip:"rect(0px, 0px, 0px, 0px)"};
  assert.equal(insightsActionVisible({children:[hiddenIcon,hiddenLabel]}),false);
  assert.equal(insightsActionVisible({children:[{...hiddenIcon,width:24,height:24,display:"block"},hiddenLabel]}),true);
  assert.equal(insightsActionVisible({children:[hiddenIcon,{...hiddenLabel,width:55,height:20,position:"static",clip:"auto"}]}),true);
  assert.equal(insightsActionVisible(null),true);
});

import { specialResponse } from "../tests/fixtures/media/demo-data.mjs";
// The request expiry API and real browser countdown share the original freeze.
test("request fixtures retain one explicit clock despite host date changes", () => {
  const originalNow = Date.now;
  try {
    const observed = [];
    for (const date of ["2026-11-03T16:00:00Z", "2026-11-04T03:00:00Z"]) {
      Date.now = () => Date.parse(date);
      const response = specialResponse("beat-requests", {user:{id:101}});
      const brief = response.data[0];
      observed.push(brief.hours_remaining);
      assert.equal(brief.hours_remaining,
        Math.ceil((Date.parse(brief.expires_at) - Date.parse("2026-11-03T16:05:55.683Z")) / 3600000));
    }
    assert.deepEqual(observed,[109,109]);
  } finally { Date.now = originalNow; }
});
