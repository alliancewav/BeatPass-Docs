import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { safeAssetPath, documentClip, insightsActionVisible } from "./safety.mjs";
import { iphone13 } from "./device-profiles.mjs";
import { preparePhoneTask } from "./phone-workflows.mjs";
import { assertDownloadPresentation as assertNativeDownloadPresentation } from "./download-presentation.mjs";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function clickVisibleElement(page, element) {
  await element.evaluate((node) =>
    node.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "instant",
    }),
  );
  await wait(350);
  const point = await element.evaluate((node) => {
    const rect = node.getBoundingClientRect(),
      x = rect.left + rect.width / 2;
    // A sticky footer may cover a tall control's center. Click only an exposed
    // point inside this same control; never fall through to another screen.
    for (const y of [
      rect.top + rect.height / 2,
      rect.top + Math.min(8, rect.height / 4),
      rect.bottom - Math.min(8, rect.height / 4),
    ]) {
      if (x < 0 || x >= innerWidth || y < 0 || y >= innerHeight) continue;
      const hit = document.elementFromPoint(x, y);
      if (node === hit || node.contains(hit)) return { x, y, exposed: true };
    }
    return { x, y: rect.top + rect.height / 2, exposed: false };
  });
  if (!point.exposed) {
    // A compact sticky form bar can cover an accordion's pointer target.
    // Use the same real button's keyboard activation, never a covered pixel click.
    const keyboardButton = await element.evaluate(
      (node) =>
        node.tagName === "BUTTON" &&
        !node.disabled &&
        node.getAttribute("aria-hidden") !== "true",
    );
    if (keyboardButton) {
      await element.focus();
      if (await element.evaluate((node) => document.activeElement === node)) {
        await page.keyboard.press("Space");
        return;
      }
    }
    throw new Error(
      "Intended control is covered and cannot receive keyboard focus; refusing another target",
    );
  }
  await page.mouse.click(point.x, point.y);
}
async function button(page, label, scope = "button,[role=button]") {
  const value = await page.waitForFunction(
    (scope, label) =>
      [...document.querySelectorAll(scope)].find(
        (el) =>
          el.textContent.trim() === label &&
          el.getBoundingClientRect().width > 0,
      ),
    {},
    scope,
    label,
  );
  const el = value.asElement();
  await clickVisibleElement(page, el);
}
async function waitForPaintedArtwork(page, selector) {
  await page.waitForFunction(
    (selector) => {
      const root = document.querySelector(selector);
      if (!root) return false;
      const discs = [...root.querySelectorAll("[data-track-disc]")];
      return (
        discs.length > 0 &&
        discs.every((disc) => {
          const print = disc.querySelector('canvas[data-disc-layer="print"]');
          if (
            print &&
            getComputedStyle(print).visibility === "visible" &&
            print.width >= 40 &&
            print.height >= 40
          ) {
            const pixels = print
              .getContext("2d")
              ?.getImageData(0, 0, print.width, print.height).data;
            if (pixels) {
              let painted = 0;
              for (let i = 3; i < pixels.length; i += 4)
                if (pixels[i] > 0) painted++;
              if (painted > (print.width * print.height) / 8) return true;
            }
          }
          return [...disc.querySelectorAll("img")].some(
            (image) =>
              image.complete &&
              image.naturalWidth > 0 &&
              getComputedStyle(image).opacity === "1" &&
              image.getBoundingClientRect().width >= 40,
          );
        })
      );
    },
    { timeout: 12000 },
    selector,
  );
}

export function inspectVisibleArtwork() {
  const visible = (node) => {
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    let left = Math.max(0, rect.left),
      right = Math.min(innerWidth, rect.right);
    let top = Math.max(0, rect.top),
      bottom = Math.min(innerHeight, rect.bottom);
    for (let current = node; current; current = current.parentElement) {
      const style = getComputedStyle(current);
      if (
        style.visibility === "hidden" ||
        style.display === "none" ||
        Number(style.opacity) === 0
      )
        return false;
      if (current !== node) {
        const box = current.getBoundingClientRect();
        if (/(hidden|clip|auto|scroll)/.test(style.overflowX)) {
          left = Math.max(left, box.left);
          right = Math.min(right, box.right);
        }
        if (/(hidden|clip|auto|scroll)/.test(style.overflowY)) {
          top = Math.max(top, box.top);
          bottom = Math.min(bottom, box.bottom);
        }
      }
      if (right <= left || bottom <= top) return false;
    }
    return right > left && bottom > top;
  };
  const imgs = [...document.images].filter(visible);
  const badImages = imgs
    .filter((img) => !img.complete || img.naturalWidth === 0)
    .map((img) => ({
      alt: img.alt,
      src: (img.currentSrc || img.src).startsWith("data:")
        ? (img.currentSrc || img.src).slice(0, 100)
        : img.currentSrc || img.src,
    }));
  const discs = [...document.querySelectorAll("[data-track-disc]")].filter(
    visible,
  );
  const badDiscs = discs
    .filter((disc) => {
      const canvas = disc.querySelector('canvas[data-disc-layer="print"]');
      if (
        !canvas ||
        canvas.width <= 1 ||
        canvas.height <= 1 ||
        getComputedStyle(canvas).visibility !== "visible"
      ) {
        return ![...disc.querySelectorAll("img")].some(
          (image) =>
            image.complete &&
            image.naturalWidth > 0 &&
            getComputedStyle(image).opacity === "1",
        );
      }
      try {
        const pixels = canvas
          .getContext("2d")
          ?.getImageData(0, 0, canvas.width, canvas.height).data;
        if (!pixels) return true;
        let count = 0;
        for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) count++;
        return count <= (canvas.width * canvas.height) / 8;
      } catch {
        return true;
      }
    })
    .map((disc) => ({
      label: disc.querySelector("img")?.alt || "disc",
      canvas_width: disc.querySelector("canvas")?.width,
    }));

  return {
    ready: badImages.length === 0 && badDiscs.length === 0,
    visible_images: imgs.length,
    bad_images: badImages,
    visible_discs: discs.length,
    unpainted_discs: badDiscs,
  };
}
async function waitForAllArtwork(page) {
  let metrics;
  for (let attempt = 0; attempt < 40; attempt++) {
    metrics = await page.evaluate(inspectVisibleArtwork);
    if (metrics.ready) return metrics;
    await wait(300);
  }
  throw new Error("Visible artwork not ready: " + JSON.stringify(metrics));
}
async function phoneMetrics(page) {
  const value = await page.evaluate(() => ({
    innerWidth,
    innerHeight,
    visualWidth: visualViewport?.width,
    visualHeight: visualViewport?.height,
    dpr: devicePixelRatio,
    coarse: matchMedia("(pointer:coarse)").matches,
    touch: navigator.maxTouchPoints,
    userAgent: navigator.userAgent,
    viewport_meta: document.querySelector('meta[name="viewport"]')?.content,
  }));
  if (
    value.innerWidth !== 390 ||
    value.innerHeight !== 844 ||
    Math.abs(value.visualWidth - 390) > 0.1 ||
    value.dpr !== 3 ||
    !value.coarse ||
    value.touch < 1 ||
    !value.userAgent.includes("iPhone") ||
    !value.viewport_meta?.includes("width=device-width")
  )
    throw new Error(
      "iPhone13 emulation contract failed: " + JSON.stringify(value),
    );
  return value;
}
async function observeActor(page, expectedRole, eligibility) {
  const actor = await page.evaluate(() => {
    const data =
      typeof window.bootstrapData === "string"
        ? JSON.parse(window.bootstrapData)
        : window.bootstrapData;
    const user = data.user;
    if (!user) throw new Error("Synthetic authenticated actor missing");
    const permissions = user.permissions
      .map((permission) => permission.name)
      .sort();
    const artists = (user.artists || []).filter(
      (artist) => artist.role === "artist",
    );
    const track = data.loaders?.trackPage?.track;
    const ownsTrack = track
      ? Number(track.owner_id) === Number(user.id) ||
        (track.artists || []).some((artist) =>
          artists.some((owned) => Number(owned.id) === Number(artist.id)),
        )
      : null;
    return {
      raw_user: user,
      raw_track: track,
      role: window.__docsCaptureAudience,
      raw_role_names: (user.roles || []).map((role) => role.name),
      authenticated: true,
      user_id: user.id,
      permissions,
      owned_artist_ids: artists.map((artist) => artist.id),
      primary_artist_id: user.primary_artist?.id ?? null,
      has_admin: permissions.some(
        (permission) =>
          permission === "admin" || permission.startsWith("admin."),
      ),
      can_create_music: permissions.includes("music.create"),
      is_producer: !!user.primary_artist || artists.length > 0,
      valid_subscription: (user.subscriptions || []).some(
        (subscription) => subscription.valid === true,
      ),
      paid_download_subscription: (user.subscriptions || []).some(
        (subscription) =>
          subscription.valid === true &&
          Number(subscription.price?.amount) > 0 &&
          subscription.product?.free === false &&
          subscription.product?.permissions?.some(
            (permission) => permission.name === "music.download",
          ),
      ),
      track: track
        ? {
            id: track.id,
            owner_id: track.owner_id,
            viewer_owns_track: ownsTrack,
            licensing_type: track.licensing_type,
            non_exclusive_available: track.non_exclusive_available,
            exclusive_status: track.exclusive_status,
          }
        : null,
    };
  });
  const user = actor.raw_user,
    track = actor.raw_track;
  delete actor.raw_user;
  delete actor.raw_track;
  const hasDownloadPermission = actor.permissions.includes("music.download");
  actor.paid_download_subscription =
    eligibility.userHasPaidDownloadSubscription(user, hasDownloadPermission);
  actor.paid_product_download_permission = (user.subscriptions || []).some(
    (subscription) =>
      subscription.valid === true &&
      subscription.product?.free === false &&
      Number(subscription.price?.amount) > 0 &&
      subscription.product.permissions?.some(
        (permission) => permission.name === "music.download",
      ),
  );
  if (track)
    actor.track.viewer_owns_track = eligibility.userOwnsTrack(track, user);
  if (
    actor.role !== expectedRole ||
    actor.has_admin ||
    actor.permissions.includes("music.update") ||
    actor.permissions.includes("music.delete")
  )
    throw new Error(
      "Actor uses an undeclared or excessive permission role: " +
        JSON.stringify(actor),
    );
  if (
    expectedRole === "customer" &&
    (actor.owned_artist_ids.length ||
      actor.primary_artist_id !== null ||
      actor.is_producer ||
      actor.can_create_music ||
      actor.track?.viewer_owns_track)
  )
    throw new Error(
      "Customer actor unexpectedly owns producer content: " +
        JSON.stringify(actor),
    );
  if (
    expectedRole === "producer" &&
    (actor.owned_artist_ids.length !== 1 ||
      actor.owned_artist_ids[0] !== actor.primary_artist_id ||
      !actor.is_producer ||
      !actor.can_create_music)
  )
    throw new Error(
      "Producer actor lacks its one scoped owned profile: " +
        JSON.stringify(actor),
    );
  return actor;
}

export async function captureWorkflow({
  page,
  flow,
  dark,
  viewport,
  output,
  manifest,
  source,
  assertDownloadPresentation,
  lines,
  eligibility,
}) {
  const theme = dark ? "dark" : "light",
    device = viewport.width < 768 ? "mobile" : "desktop";
  let state = "populated";
  await observeActor(page, flow.audience, eligibility);
  if (device === "mobile") await phoneMetrics(page);
  if (device === "mobile" && flow.id === "beat-catalog") {
    const search = await page.waitForSelector(
      'input[placeholder="Search beats"]',
      { visible: true },
    );
    await search.type("Golden Hour", { delay: 80 });
    await page.waitForFunction(
      () => new URL(location.href).searchParams.get("query") === "Golden Hour",
      { timeout: 10000 },
    );
    await wait(700);
    const more = await page.waitForSelector(
      'button[aria-label="More options for Golden Hour"]',
      { visible: true, timeout: 10000 },
    );
    await clickVisibleElement(page, more);
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll('[role="menu"] a')].some(
          (node) => node.textContent.trim() === "Edit",
        ),
      { timeout: 10000 },
    );
    state = "edit-options";
  }
  if (device === "mobile" && flow.id === "license-wallet") {
    // This real, shareable route filter is parsed by the current wallet page.
    // Preserve the source UI's query field rather than forcing synthetic DOM values.
    await page.waitForFunction(
      () =>
        new URL(location.href).searchParams.get("search") === "Golden Hour" &&
        document.querySelectorAll("[data-license-pass]").length === 1,
      { timeout: 10000 },
    );
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    state = "find-active-license";
  }
  if (flow.id === "messaging") {
    const person = await page.waitForFunction(() =>
      [...document.querySelectorAll("button,[role=button]")].find(
        (el) =>
          (el.textContent.includes("Mira Sol") ||
            el.textContent.toLowerCase().includes("mirasol")) &&
          el.getBoundingClientRect().height > 0,
      ),
    );
    await person.asElement().asLocator().click();
    await page.waitForSelector('textarea[aria-label="Message input"]');
    await page.waitForFunction(() =>
      document.body.textContent.includes(
        "That piano part fits the chorus beautifully.",
      ),
    );
  }
  if (flow.id === "download") {
    await button(page, "Download", "[data-track-actions] button");
    await page.waitForSelector("[data-download-dialog]");
    await assertNativeDownloadPresentation(page, {
      output: path.dirname(manifest),
      id: "download-" + device + "-" + theme,
      lines,
    });
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll("[data-download-dialog] img")].every(
          (image) => image.complete && image.naturalWidth > 0,
        ),
      { timeout: 8000 },
    );
    await waitForPaintedArtwork(page, "[data-download-dialog]");
    await wait(500);
    state = "requested";
  }
  if (flow.id === "queue" || (flow.id === "player" && device === "mobile")) {
    if (device === "mobile") {
      const mini = await page.$("[data-mini-player]");
      if (mini) await mini.click();
      await wait(500);
    }
    if (flow.id === "queue") {
      const selector =
        device === "mobile"
          ? "[data-mobile-queue-panel]"
          : "#desktop-playback-queue";
      const visible = () =>
        page
          .$eval(selector, (node) => {
            const rect = node.getBoundingClientRect();
            return (
              rect.width > 0 &&
              rect.height > 0 &&
              rect.right > 0 &&
              rect.left < innerWidth &&
              getComputedStyle(node).visibility !== "hidden"
            );
          })
          .catch(() => false);
      if (!(await visible())) {
        const control = await page.$('button[aria-label="Queue"]');
        if (control) await clickVisibleElement(page, control);
        else await button(page, "Queue");
      }
      await page.waitForFunction(
        (selector) => {
          const node = document.querySelector(selector);
          if (!node) return false;
          const rect = node.getBoundingClientRect();
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            rect.right > 0 &&
            rect.left < innerWidth
          );
        },
        { timeout: 8000 },
        selector,
      );
      await wait(500);
    }
  }

  if (flow.id === "payout-setup") {
    await button(page, "Set up BEATPAY", "#account-details button");
    await page.waitForSelector("[role=dialog]");
    await wait(500);
    await button(page, "Set up bank payouts", "[role=dialog] button");
    await page.waitForFunction(() =>
      document
        .querySelector("[role=dialog]")
        ?.textContent.includes("Bank account currency"),
    );
    state = "choose-currency";
  }
  if (["rights-declarations", "sample-safe", "upload"].includes(flow.id)) {
    const label = ["rights-declarations", "sample-safe"].includes(flow.id)
      ? "Protection & Verification"
      : "Track Details";
    const control = await page.waitForFunction(
      (label) =>
        [...document.querySelectorAll("h3 button[aria-expanded]")].find((el) =>
          el.textContent.includes(label),
        ),
      {},
      label,
    );
    const topLevelLabels = [
      "Cover Art & Style",
      "Track Details",
      "Music Properties",
      "Protection & Verification",
      "Licensing Options",
    ];
    const others = await page.$$("h3 button[aria-expanded=true]");
    for (const other of others) {
      const text = await other.evaluate((node) => node.textContent);
      if (
        topLevelLabels.some((section) => text.includes(section)) &&
        !text.includes(label)
      ) {
        await clickVisibleElement(page, other);
        await page.waitForFunction(
          (node) => node.getAttribute("aria-expanded") === "false",
          { timeout: 3000 },
          other,
        );
      }
    }
    const el = control.asElement();
    if (await el.evaluate((el) => el.getAttribute("aria-expanded") !== "true"))
      await clickVisibleElement(page, el);
    await el.evaluate((node) => {
      node
        .closest("h3")
        ?.parentElement?.setAttribute("data-docs-media-focus", "true");
      node.scrollIntoView({ block: "start", behavior: "instant" });
    });
    if (flow.id === "upload") {
      const disclosure = await page.waitForFunction(() =>
        [...document.querySelectorAll("h3 button[aria-expanded]")].find(
          (node) => node.textContent.trim().startsWith("Description"),
        ),
      );
      if (
        await disclosure
          .asElement()
          .evaluate((node) => node.getAttribute("aria-expanded") !== "true")
      )
        await clickVisibleElement(page, disclosure.asElement());
      const description = await page.waitForSelector(
        'textarea[name="description"]',
        { visible: true },
      );
      await description.click();
      if (
        !(await description.evaluate((node) => document.activeElement === node))
      )
        throw new Error("Description did not receive actual input focus");
      await page.keyboard.down("Control");
      await page.keyboard.press("A");
      await page.keyboard.up("Control");
      await description.type(
        "Warm piano, loose drums and room for a bright chorus.",
      );
      await page.keyboard.press("Tab");
    }
    await page.evaluate(() => window.scrollBy(0, -110));
    state =
      flow.id === "rights-declarations"
        ? "ai-human-made"
        : flow.id === "sample-safe"
        ? "sample-safe"
        : "editing-demo-beat";
    if (["rights-declarations", "sample-safe"].includes(flow.id)) {
      const title =
        flow.id === "rights-declarations"
          ? "AI use declaration"
          : "Sample-Safe™ warranty";
      await page.evaluate((title) => {
        const heading = [...document.querySelectorAll("h4")].find(
          (node) => node.textContent.trim() === title,
        );
        const panel = heading?.parentElement?.parentElement;
        if (!panel) throw new Error("Declaration task missing: " + title);
        panel.setAttribute("data-docs-declaration-task", "true");
      }, title);
    }
  }
  if (flow.id.startsWith("insights-")) {
    state = flow.id.replace("insights-", "");
    if (device === "desktop") await page.setViewport({ ...page.viewport(), height: 1600 });
    // Visit actual report panels to activate their native lazy queries.
    for (const panel of await page.$$("section")) {
      const isChart = await panel.evaluate(node => !!node.querySelector("canvas,[data-chart-container]") || /Top Devices|Top Platforms|Most Played Tracks|Top Listeners|Top Locations/.test(node.querySelector("h2,h3")?.textContent || ""));
      if (isChart) { await panel.evaluate(node => node.scrollIntoView({block:"center",behavior:"instant"})); await wait(250); }
    }
    await page.$eval("[data-insights-content]", node => {
      let owner = node.parentElement;
      while (owner && owner !== document.body && !/(auto|scroll)/.test(getComputedStyle(owner).overflowY)) owner = owner.parentElement;
      if (owner && owner !== document.body) owner.scrollTo({top:0,behavior:"instant"});
      window.scrollTo({top:0,behavior:"instant"});
    });
    await wait(900);
  }
  if (["notifications", "billing"].includes(flow.id)) {
    // The native list can restore a prior scroll position. Capture its real top.
    await page.$eval("h1", node => {
      let owner = node.parentElement;
      while (owner && owner !== document.body && !/(auto|scroll)/.test(getComputedStyle(owner).overflowY)) owner = owner.parentElement;
      if (owner && owner !== document.body) owner.scrollTo({top:0,behavior:"instant"});
      window.scrollTo({top:0,behavior:"instant"});
    });
    await wait(350);
  }
  if (flow.id === "privacy") state = "choose-tracking";
  if (flow.id === "pro-page") state = "live-status";
  const focusedSelectors = {
    download: "[data-download-dialog]",
    "payout-setup": "[role=dialog]",
    "rights-declarations": "[data-docs-declaration-task]",
    "sample-safe": "[data-docs-declaration-task]",
    upload: "[data-docs-media-focus]",
    account: "#account-details",
    "license-wallet": '[class*="container/license-wallet"]',
    "beat-catalog": "#beats-catalog",
    "collection-catalog": "#collections-catalog",
    "audio-recon": 'section[aria-labelledby="audio-recon-results-label"]',
    finances: "#finances-activity",
    activity: "#activity-downloads",
    progress: "#progress-level",
    leaderboards: "#leaderboard-producer-rankings",
    "achievement-goal": "[data-chosen-achievement]",
    "achievement-gallery": 'section[aria-label="Unlocked"]',
    "pro-page": "#pro-page-status",
  };
  let focusSelector = focusedSelectors[flow.id];
  if (device === "mobile" && flow.id === "beat-catalog")
    focusSelector = '[role="menu"]';
  if (device === "mobile" && flow.id === "license-wallet")
    focusSelector = "[data-license-pass]";
  if (device === "desktop" && flow.id === "dashboard") {
    const wanted =
      flow.id === "dashboard" ? "Performance snapshot" : "Your Pro Page";
    const tagged = await page.evaluate((wanted) => {
      const h = [...document.querySelectorAll("h2,h3,p")].find(
        (el) => el.textContent.trim() === wanted,
      );
      const panel = h?.closest("section");
      if (!panel) return false;
      panel.setAttribute("data-docs-media-focus", "true");
      return true;
    }, wanted);
    if (tagged) focusSelector = "[data-docs-media-focus]";
  }
  const phoneTask =
    device === "mobile"
      ? await preparePhoneTask({ page, flow, clickVisibleElement, wait })
      : {};
  if (phoneTask.state) state = phoneTask.state;
  if (phoneTask.focusSelector) focusSelector = phoneTask.focusSelector;
  if (focusSelector) {
    const target = await page.waitForSelector(focusSelector, {
      visible: true,
      timeout: 10000,
    });
    if (!target)
      throw new Error("Focused workflow target is missing: " + focusSelector);
    if (
      !phoneTask.skipScroll &&
      !["download", "payout-setup"].includes(flow.id) &&
      !(
        device === "mobile" &&
        ["license-wallet", "beat-catalog"].includes(flow.id)
      )
    ) {
      await wait(500);
      const rect = await target.boundingBox(),
        vp = page.viewport();
      const required = Math.ceil(rect.height + 360),
        limit = 1600;
      if (device === "desktop" && required > vp.height && required <= limit)
        await page.setViewport({ ...vp, height: required });
      await target.evaluate((node, workflow) => {
        let owner = node.parentElement;
        while (
          owner &&
          owner !== document.body &&
          !/(auto|scroll)/.test(getComputedStyle(owner).overflowY)
        )
          owner = owner.parentElement;
        const scrollOwner = owner && owner !== document.body ? owner : window;
        if (
          innerWidth >= 768 &&
          ["license-wallet", "beat-catalog", "collection-catalog", "dashboard", "pro-page"].includes(
            workflow,
          )
        )
          scrollOwner.scrollTo({ top: 0, behavior: "instant" });
        else {
          node.scrollIntoView({ block: "start", behavior: "instant" });
          const navs = [
            ...document.querySelectorAll(
              "[data-floating-navigation],[data-app-navbar],[data-app-navbar-navigation],[data-mobile-top-bar],[data-desktop-top-bar]",
            ),
          ];
          const clear = Math.max(
            110,
            ...navs.map((nav) => nav.getBoundingClientRect().bottom),
          );
          scrollOwner.scrollBy({
            top: node.getBoundingClientRect().top - clear - 16,
            behavior: "instant",
          });
        }
      }, flow.id);
      if (
        device === "desktop" &&
        [
          "beat-catalog",
          "collection-catalog",
          "dashboard",
          "pro-page",
          "audio-recon",
        ].includes(flow.id)
      ) {
        await wait(250);
        const panel = await target.boundingBox(),
          current = page.viewport();
        const dock =
          flow.id === "dashboard"
            ? await page
                .$eval(
                  "[data-player-bar]",
                  (node) => node.getBoundingClientRect().height,
                )
                .catch(() => 0)
            : 0;
        const height = Math.ceil(panel.y + panel.height + dock + 32);
        if (height > limit)
          throw new Error(
            "Complete focused workflow needs a taller viewport than its bounded capture limit",
          );
        await page.setViewport({ ...current, height });
        if (flow.id === "collection-catalog") {
          // Viewport resizing can restore native container scroll after the first
          // layout pass. Restore the actual page top after that pass has settled.
          await wait(350);
          await target.evaluate(node => {
            for (let owner = node.parentElement; owner; owner = owner.parentElement)
              if (/(auto|scroll)/.test(getComputedStyle(owner).overflowY))
                owner.scrollTo({top:0,behavior:"instant"});
            window.scrollTo({top:0,behavior:"instant"});
          });
          await wait(350);
          const headingVisible = await page.$eval("h1", node => {
            const rect = node.getBoundingClientRect();
            const chrome = [...document.querySelectorAll("[data-app-navbar],[data-floating-navigation]")]
              .map(nav => nav.getBoundingClientRect()).filter(box => box.height && box.top <= 1);
            return rect.top >= Math.max(0,...chrome.map(box => box.bottom)) && rect.bottom <= innerHeight;
          });
          if (!headingVisible) throw new Error("Collection catalog heading is covered after native resize");
        }
      }
    }
  }
  if (
    device === "mobile" &&
    focusSelector &&
    !phoneTask.skipScroll &&
    !["download", "payout-setup", "license-wallet", "beat-catalog"].includes(
      flow.id,
    )
  ) {
    // Floating page menus can move into the navbar after scrolling. Let that
    // real layout settle, then remeasure before placing the full task panel.
    for (let attempt = 0; attempt < 3; attempt++) {
      await wait(350);
      const aligned = await page.$eval(focusSelector, (node) => {
        const navs = [
          ...document.querySelectorAll(
            '[data-app-navbar],[data-app-navbar-navigation],[data-floating-navigation="true"]',
          ),
        ];
        const clear = Math.max(
          0,
          ...navs.map((nav) => nav.getBoundingClientRect().bottom),
        );
        const delta = node.getBoundingClientRect().top - clear - 16;
        if (Math.abs(delta) < 1) return true;
        let parent = node.parentElement;
        while (
          parent &&
          parent !== document.body &&
          !/(auto|scroll)/.test(getComputedStyle(parent).overflowY)
        )
          parent = parent.parentElement;
        const scrollOwner =
          parent && parent !== document.body ? parent : window;
        scrollOwner.scrollBy({ top: delta, behavior: "instant" });
        return false;
      });
      if (aligned) break;
    }
  }
  if (device === "mobile" && flow.id === "license-wallet") {
    // Keep the page heading/search visible while the complete first result
    // clears the real fixed player. The floating chapter nav settles in-frame.
    for (let attempt = 0; attempt < 3; attempt++) {
      await wait(350);
      const aligned = await page.evaluate(() => {
        const heading = [...document.querySelectorAll("h1,h2")].find(
          (node) => node.textContent.trim() === "Your licenses",
        );
        if (!heading) throw new Error("Wallet heading is missing");
        const navs = [
          ...document.querySelectorAll(
            '[data-app-navbar],[data-app-navbar-navigation],[data-floating-navigation="true"]',
          ),
        ];
        const clear = Math.max(
          0,
          ...navs.map((nav) => nav.getBoundingClientRect().bottom),
        );
        const delta = heading.getBoundingClientRect().top - clear - 16;
        if (Math.abs(delta) < 1) return true;
        window.scrollBy({ top: delta, behavior: "instant" });
        return false;
      });
      if (aligned) break;
    }
  }
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r)),
    );
  });
  await wait(700);
  if (flow.id === "download")
    await waitForPaintedArtwork(page, "[data-download-dialog]");
  if (["activity", "audio-recon"].includes(flow.id))
    await waitForPaintedArtwork(page, focusSelector);
  const artwork = await waitForAllArtwork(page);
  const actor = await observeActor(page, flow.audience, eligibility);
  const emulation = device === "mobile" ? await phoneMetrics(page) : null;
  const geometry = await page.evaluate(
    ({ focusSelector, fontFamily }) => {
      const width = innerWidth,
        height = innerHeight,
        visible = (el) => {
          const r = el.getBoundingClientRect();
          return (
            r.width > 0 &&
            r.height > 0 &&
            r.right > 0 &&
            r.left < width &&
            r.bottom > 0 &&
            r.top < height &&
            getComputedStyle(el).visibility !== "hidden"
          );
        };
      const controls = [
        ...document.querySelectorAll(
          "button,a,input,select,textarea,[role=button]",
        ),
      ]
        .filter(visible)
        .map((el) => {
          const r = el.getBoundingClientRect();
          let ancestor = el.parentElement,
            scrollableNavigation = false;
          while (ancestor && ancestor !== document.body) {
            if (
              /(auto|scroll)/.test(getComputedStyle(ancestor).overflowX) &&
              ancestor.scrollWidth > ancestor.clientWidth + 1 &&
              (el.closest(
                "nav,footer,[role=navigation],[data-scrollable-chip-nav],[data-producer-recent-carousel],.content-carousel",
              ) ||
                ancestor.closest(
                  "nav,footer,[role=navigation],[data-scrollable-chip-nav],[data-producer-recent-carousel],.content-carousel",
                ))
            ) {
              scrollableNavigation = true;
              break;
            }
            ancestor = ancestor.parentElement;
          }
          return {
            scrollable_navigation: scrollableNavigation,
            label: (
              el.getAttribute("aria-label") ||
              el.textContent ||
              el.getAttribute("placeholder") ||
              el.tagName
            )
              .trim()
              .slice(0, 100),
            left: r.left,
            right: r.right,
            top: r.top,
            bottom: r.bottom,
          };
        });
      const focus = focusSelector
        ? document.querySelector(focusSelector)
        : null;
      const box = focus?.getBoundingClientRect();
      const target = box
        ? {
            selector: focusSelector,
            top: box.top,
            bottom: box.bottom,
            left: box.left,
            right: box.right,
            height: box.height,
            complete:
              box.top >= -0.5 &&
              box.bottom <= height + 0.5 &&
              box.left >= -0.5 &&
              box.right <= width + 0.5,
          }
        : null;
      if (target && focus) {
        target.occluded_controls = [
          ...focus.querySelectorAll("button,a,input,select,textarea"),
        ]
          .filter(visible)
          .filter((node) => {
            if (node.disabled) return false;
            const r = node.getBoundingClientRect(),
              x = r.left + r.width / 2,
              y = r.top + r.height / 2;
            if (x < 0 || x >= width || y < 0 || y >= height) return false;
            const hit = document.elementFromPoint(x, y);
            return (
              hit &&
              !node.contains(hit) &&
              node !== hit &&
              !!hit.closest(
                '[data-app-navbar],[data-app-navbar-navigation],[data-floating-navigation="true"],[data-player-bar],[data-mini-player],[data-mobile-nav-surface],[data-floating-form-actions]',
              )
            );
          })
          .map((node) =>
            (
              node.getAttribute("aria-label") ||
              node.textContent ||
              node.tagName
            )
              .trim()
              .slice(0, 100),
          );
      }
      return {
        target,
        font: {
          family: getComputedStyle(document.documentElement).fontFamily,
          loaded: fontFamily
            ? document.fonts.check("400 16px " + JSON.stringify(fontFamily))
            : null,
        },
        viewport: { width, height },
        horizontal_overflow: document.documentElement.scrollWidth > width + 1,
        clipped_controls: controls.filter(
          (c) =>
            !c.scrollable_navigation &&
            (c.left < -0.5 || c.right > width + 0.5),
        ),
        intentional_navigation_scroll: controls.filter(
          (c) =>
            c.scrollable_navigation && (c.left < -0.5 || c.right > width + 0.5),
        ),
        visible_control_count: controls.length,
        headings: [...document.querySelectorAll("h1,h2,h3")]
          .filter(visible)
          .map((el) => el.textContent.trim()),
        accessibility_css_rules: (() => {
          const found = [];
          function walk(rules, sheet, parents = []) {
            for (const rule of rules) {
              if (
                rule.selectorText &&
                (rule.selectorText.includes("sr-only") ||
                  (rule.selectorText.includes("navbar") &&
                    rule.selectorText.includes("hidden")))
              )
                found.push({
                  source: sheet,
                  parents,
                  selector: rule.selectorText,
                  css: rule.style?.cssText || rule.cssText,
                });
              if (rule.cssRules)
                walk(rule.cssRules, sheet, [
                  ...parents,
                  rule.conditionText || rule.name || rule.constructor.name,
                ]);
            }
          }
          for (const sheet of document.styleSheets) {
            try {
              walk(
                sheet.cssRules,
                sheet.href ||
                  sheet.ownerNode?.getAttribute("data-vite-dev-id") ||
                  "inline-style",
              );
            } catch {}
          }
          return found;
        })(),
        desktop_insights: (() => {
          const button = document.querySelector(
            '[data-app-navbar] a[aria-label="Insights"]',
          );
          if (!button) return null;
          const measure = (node) => {
            const style = getComputedStyle(node),
              rect = node.getBoundingClientRect();
            return {
              tag: node.tagName,
              class: node.getAttribute("class"),
              text: node.textContent,
              width: rect.width,
              height: rect.height,
              display: style.display,
              position: style.position,
              overflow: style.overflow,
              clip: style.clip,
              clip_path: style.clipPath,
              visibility: style.visibility,
              container_name: style.containerName,
            };
          };
          return {
            button: measure(button),
            children: [...button.children].map(measure),
            navbar: measure(button.closest("[data-app-navbar]")),
          };
        })(),
        framework_overlay: !!document.querySelector("vite-error-overlay"),
        placeholder_labels: [
          ...new Set(
            document.body.innerText.match(
              /\bSmoke(?:\s+\w+)?|\bSynthetic\b|\bCollection \d+\b|\bLiked beat \d+\b|\bTest (?:Producer|Track|Album)\b/g,
            ) || [],
          ),
        ],
        accidental_text_selection:
          window.getSelection()?.toString().length || 0,
        images: [...document.images].filter(visible).map((el) => ({
          src: (el.currentSrc || el.getAttribute("src") || "").startsWith(
            "data:",
          )
            ? (el.currentSrc || el.getAttribute("src")).slice(0, 100)
            : el.currentSrc || el.getAttribute("src") || "",
          loaded: el.complete && el.naturalWidth > 0,
          object_fit: getComputedStyle(el).objectFit,
          object_position: getComputedStyle(el).objectPosition,
          transform: getComputedStyle(el).transform,
          filter: getComputedStyle(el).filter,
          opacity: getComputedStyle(el).opacity,
          svg_text: (() => {
            const src = el.currentSrc || el.src;
            if (!src.startsWith("data:image/svg+xml,")) return null;
            try {
              const xml = new DOMParser().parseFromString(
                decodeURIComponent(src.slice(src.indexOf(",") + 1)),
                "image/svg+xml",
              );
              return [...xml.querySelectorAll("text")].map(
                (node) => node.textContent,
              );
            } catch {
              return null;
            }
          })(),
        })),
      };
    },
    { focusSelector, fontFamily: source.font_assets?.[0]?.family },
  );
  if (source.font_assets?.length && !geometry.font.loaded)
    throw new Error("Configured font did not load");
  if (geometry.target && !geometry.target.complete)
    throw new Error(
      "Focused panel is not fully visible: " + JSON.stringify(geometry.target),
    );
  if (geometry.target?.occluded_controls?.length)
    throw new Error(
      "Primary controls are covered by sticky chrome: " +
        geometry.target.occluded_controls.join(", "),
    );
  if (geometry.accidental_text_selection)
    throw new Error(
      "Page text is accidentally selected; capture interaction must be repaired",
    );
  if (geometry.placeholder_labels.length)
    throw new Error(
      "Internal fixture labels remain visible: " +
        geometry.placeholder_labels.join(", "),
    );
  if (!insightsActionVisible(geometry.desktop_insights))
    throw new Error("Actual app Insights action has neither a visible label nor icon; do not offer this blank-control state as working guide media");
  if (geometry.framework_overlay)
    throw new Error("Framework overlay in " + flow.id);
  if (geometry.horizontal_overflow || geometry.clipped_controls.length)
    throw new Error(
      "Horizontal control clipping in " +
        flow.id +
        ": " +
        JSON.stringify(geometry.clipped_controls),
    );
  if (!geometry.visible_control_count)
    throw new Error("No usable controls in " + flow.id);
  const target = safeAssetPath(output, flow.id, state, device + "-" + theme);
  await fs.mkdir(path.dirname(target), { recursive: true });
  // Native browser clips keep the full intended panel without partial surrounding sections.
  let clip;
  if (
    device === "desktop" &&
    [
      "rights-declarations",
      "sample-safe",
      "audio-recon",
      "finances",
      "activity",
      "progress",
      "leaderboards",
      "achievement-goal",
      "achievement-gallery",
    ].includes(flow.id)
  ) {
    const box = await page.$eval(focusSelector, (node) => {
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    const scroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
    clip = documentClip(box, page.viewport(), scroll);
    if (
      Math.abs(clip.width - box.width) > 0.5 ||
      Math.abs(clip.height - box.height) > 0.5
    )
      throw new Error("Native screenshot clip would cut its focused panel");
  }
  await page.screenshot({
    path: target,
    fullPage: false,
    captureBeyondViewport: false,
    ...(clip ? { clip } : {}),
  });
  const bytes = await fs.readFile(target);
  if (
    device === "mobile" &&
    (bytes.readUInt32BE(16) !== 1170 || bytes.readUInt32BE(20) !== 2532)
  )
    throw new Error(
      "iPhone13 export must be the unmodified1170x2532 native viewport PNG",
    );
  const record = {
    id: flow.id,
    workflow: flow.id,
    path:
      "/assets/media/screenshots/" +
      path.relative(output, target).replaceAll("\\", "/"),
    state,
    requested_route: flow.route,
    route:
      new URL(page.url()).pathname +
      new URL(page.url()).search +
      new URL(page.url()).hash,
    captured_at: new Date().toISOString(),
    source,
    theme,
    synthetic: true,
    viewport: {
      ...geometry.viewport,
      ...(device === "mobile" ? iphone13.viewport : {}),
    },
    ...(emulation
      ? {
          emulation: {
            preset: iphone13.name,
            device_scale_factor: 3,
            is_mobile: true,
            has_touch: true,
            user_agent: iphone13.userAgent,
            observed: {
              inner_width: emulation.innerWidth,
              inner_height: emulation.innerHeight,
              visual_viewport_width: emulation.visualWidth,
              visual_viewport_height: emulation.visualHeight,
              device_pixel_ratio: emulation.dpr,
              coarse_pointer: emulation.coarse,
              max_touch_points: emulation.touch,
              viewport_meta: emulation.viewport_meta,
              user_agent: emulation.userAgent,
            },
            engine: "Chromium emulation, not native Safari",
          },
        }
      : {}),
    artwork,
    actor,
    capture: {
      mode: clip ? "native-clip" : "viewport",
      full_page: false,
      capture_beyond_viewport: false,
    },
    image: {
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
      sha256: createHash("sha256").update(bytes).digest("hex"),
    },
    crop: {
      reviewed: false,
      method: clip
        ? "native browser clip of complete focused panel; no pixel edits"
        : "unmodified full viewport; no ElementHandle.screenshot or pixel edits",
      ...(clip ? { document_clip: clip } : {}),
      full_controls: geometry.clipped_controls.length === 0,
      vertical_complete: geometry.target?.complete ?? null,
      target: geometry.target,
      checks: geometry,
    },
    placement: flow.placement,
    caption:
      (phoneTask.caption
        ? "Example with demo data. " + phoneTask.caption
        : null) ||
      "Example with demo data. " +
        ({
          progress: "The level overview and its Recent XP and Earn XP actions.",
          "achievement-goal":
            "One selected achievement goal, with its real source-defined reward and conditions.",
          "achievement-gallery":
            "Unlocked achievements in the native horizontal artwork gallery.",
          finances: "Finance activity with illustrative amounts and statuses.",
          activity: "Recent downloads with example license actions.",
          messaging: "A conversation about a beat shortlist.",
          dashboard: "Producer tools and recent catalog activity.",
          "beat-catalog": "A populated catalog and featured beat.",
          "license-wallet": "License records in your account.",
          "rights-declarations":
            "AI-use choices for a demo beat before saving the declaration.",
          "sample-safe":
            "The separate sample-clearance declaration and its Cleared and Needs clearance choices.",
          upload:
            "Editing a demo beat's details, with an unsaved description change.",
          "payout-setup":
            "Choosing a payout currency before adding bank details.",
          requests:
            "An active custom request, ready for a producer to review and send a beat.",
          "audio-recon":
            "An example similar-recording result with its match score and listening link.",
          download:
            "The browser has received the file handoff. File saving depends on your browser.",
          privacy: "The tracking-preference choice shown by BeatPass.",
          billing:
            "An example billing overview. Plan names and amounts are demo data.",
        }[flow.id] || "BeatPass " + flow.id.replaceAll("-", " ") + "."),
    limitations: [
      "Synthetic example; no live customer, payment, payout or database behavior is certified.",
    ],
  };
  let data = { schema_version: 1, captures: [], gaps: [] };
  try {
    data = JSON.parse(await fs.readFile(manifest, "utf8"));
  } catch {}
  data.captures = data.captures.filter(
    (r) =>
      !(
        r.id === record.id &&
        r.theme === theme &&
        r.viewport.width < 768 === record.viewport.width < 768
      ),
  );
  data.captures.push(record);
  const currentVariant = (record.viewport.width < 768 ? "mobile" : "desktop") + "-" + record.theme;
  for (const gap of data.gaps.filter(gap => gap.workflow === flow.id))
    if (Date.parse(record.captured_at) > Date.parse(gap.recorded_at))
      gap.missing_variants = gap.missing_variants.filter(variant => variant !== currentVariant);
  data.gaps = data.gaps.filter(gap => gap.missing_variants.length);
  await fs.writeFile(manifest, JSON.stringify(data, null, 2) + "\n");
  return { capture: record.path };
}
