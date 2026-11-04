// Native phone views focus one real task; only data attributes are added for measurement.
// No UI, styles, viewport or pixels are changed by these recipes.
export async function preparePhoneTask({
  page,
  flow,
  clickVisibleElement,
  wait,
}) {
  let state,
    focusSelector,
    skipScroll = false,
    caption;
  const byHeading = async (label, kind = "panel") => {
    await page.waitForFunction(
      (label) =>
        [...document.querySelectorAll("h1,h2,h3,h4,p")].some(
          (node) => node.textContent.trim() === label,
        ),
      { timeout: 10000 },
      label,
    );
    const selector = await page.evaluate(
      ({ label, kind }) => {
        const heading = [...document.querySelectorAll("h1,h2,h3,h4,p")].find(
          (node) => node.textContent.trim() === label,
        );
        const panel =
          kind === "declaration"
            ? heading?.parentElement?.parentElement
            : kind === "position"
            ? heading?.closest(".rounded-panel")
            : heading?.closest("section");
        if (!panel) return null;
        panel.setAttribute("data-docs-phone-task", "true");
        return "[data-docs-phone-task]";
      },
      { label, kind },
    );
    if (!selector) throw new Error("Native phone task was not found: " + label);
    return selector;
  };
  if (flow.id === "dashboard") {
    state = "recent-beats";
    focusSelector = 'section[aria-labelledby="recent-producer-beats"]';
    caption = "Recent beats and View all on the producer dashboard.";
    skipScroll = true;
  } else if (flow.id === "upload") {
    state = "editing-description";
    focusSelector = await page.$eval('textarea[name="description"]', (node) => {
      const heading = [
        ...document.querySelectorAll("h3 button[aria-expanded]"),
      ].find((button) => button.textContent.trim().startsWith("Description"));
      const section = heading?.closest("h3")?.parentElement;
      if (!section || !section.contains(node))
        throw new Error(
          "Description accordion did not contain the actual field",
        );
      section.setAttribute("data-docs-phone-task", "true");
      return "[data-docs-phone-task]";
    });
    caption = "An unsaved description edit for an existing demo beat.";
  } else if (flow.id === "rights-declarations") {
    state = "ai-human-made";
    focusSelector = await byHeading("AI use declaration", "declaration");
    caption = "The separate AI-use declaration and its creation choices.";
  } else if (flow.id === "sample-safe") {
    state = "sample-safe";
    focusSelector = await byHeading("Sample-Safe™ warranty", "declaration");
    caption =
      "The separate sample-clearance declaration and its Cleared and Needs clearance choices.";
  } else if (flow.id === "pro-page") {
    state = "share-live-page";
    focusSelector = 'section[aria-labelledby="pro-page-workspace-title"]';
    caption = "Copy, share or open a live producer page.";
  } else if (flow.id === "finances") {
    const summary = await page.waitForSelector(
      "article[data-finance-activity] summary",
      { visible: true },
    );
    await clickVisibleElement(page, summary);
    await wait(300);
    state = "earning-detail";
    focusSelector = "article[data-finance-activity]:has(details[open])";
    caption = "One illustrative earning and its payout-status explanation.";
  } else if (flow.id === "activity") {
    state = "recent-downloads";
    focusSelector = "#activity-downloads";
  } else if (flow.id === "leaderboards") {
    state = "your-position";
    focusSelector = "[data-ranking-featured]";
    caption = "Leading producers in the selected ranking, including the demo producer's position.";
    skipScroll = true;
  } else if (flow.id === "audio-recon") {
    state = "match-review";
    focusSelector = "[data-recon-track]";
    caption =
      "One similar recording and its source beside the original demo beat.";
  } else if (flow.id === "collection-catalog") {
    const list = await page.waitForSelector('button[aria-label="List"]', {
      visible: true,
    });
    await clickVisibleElement(page, list);
    const actions = await page.waitForSelector(
      'button[aria-label="Actions for After Hours, Vol. 1"]',
      { visible: true },
    );
    await clickVisibleElement(page, actions);
    await page.waitForSelector('[role="dialog"]', { visible: true });
    state = "collection-actions";
    focusSelector = '[role="dialog"]';
    skipScroll = true;
    caption = "The action menu for a collection in the native list view.";
  } else if (flow.id === "billing") {
    state = "current-plan";
    skipScroll = true;
    focusSelector = await byHeading("Current plan");
    caption =
      "The current illustrative Demo plan and its Change and Cancel actions.";
  } else if (flow.id === "privacy") {
    focusSelector = "[data-cookie-notice]";
    skipScroll = true;
  } else if (flow.id === "requests") {
    // Follow the real Send beats action. The native picker shows the next task
    // completely on a phone without placing a board action behind playback.
    const action = await page.waitForFunction(() => [...document.querySelectorAll("button")].find(node => node.textContent.trim() === "Send beats"));
    await clickVisibleElement(page, action.asElement());
    await page.waitForSelector('[role="dialog"]', {visible:true});
    await wait(500);
    state = "choose-beats";
    focusSelector = '[role="dialog"]';
    caption = "The native beat picker after Send beats. No beats have been sent.";
    skipScroll = true;
  } else if (flow.id.startsWith("insights-")) {
    state = flow.id.replace("insights-", "");
    focusSelector = flow.id === "insights-track-overview"
      ? await byHeading("Avg Listen Duration")
      : flow.id === "insights-artist-pro-page"
        ? 'section[aria-labelledby="pro-page-traffic-section-title"] > header'
        : flow.id === "insights-audience"
          ? await byHeading("Top Devices")
          : await byHeading("Plays Over Time");
    caption = "A focused native Insights report with illustrative activity.";
  } else if (flow.id === "profile") {
    state = "profile-identity";
    focusSelector = "[data-user-profile-header]";
  }
  if (["dashboard", "leaderboards"].includes(flow.id)) {
    // Preserve the full real page heading/controls instead of cutting an earlier
    // line above the floating header when aligning a later task to its edge.
    await page.$eval(focusSelector, (node) => {
      let owner = node.parentElement;
      while (owner && owner !== document.body &&
        !/(auto|scroll)/.test(getComputedStyle(owner).overflowY))
        owner = owner.parentElement;
      if (owner && owner !== document.body)
        owner.scrollTo({ top: 0, behavior: "instant" });
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    if (flow.id === "leaderboards") {
      // The complete current heading, controls and tall portrait card exceed a
      // fixed phone viewport. Start at the real Ranking controls, keeping the
      // entire first card visible without squeezing it or hiding app chrome.
      await wait(350);
      await page.$eval("[data-ranking-controls]", (node) => {
        const navs = [...document.querySelectorAll(
          "[data-app-navbar],[data-app-navbar-navigation],[data-floating-navigation]"
        )];
        const clear = Math.max(0, ...navs.map(nav => nav.getBoundingClientRect().bottom));
        let owner = node.parentElement;
        while (owner && owner !== document.body &&
          !/(auto|scroll)/.test(getComputedStyle(owner).overflowY))
          owner = owner.parentElement;
        const scrollOwner = owner && owner !== document.body ? owner : window;
        scrollOwner.scrollBy({top: node.getBoundingClientRect().top - clear - 16, behavior: "instant"});
      });
    }
  }
  return { state, focusSelector, skipScroll, caption };
}
