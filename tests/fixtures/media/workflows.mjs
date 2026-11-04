export const workflows = [
  ["discover", "discover", "/discover", "[data-floating-navigation] nav"],
  ["track", "track-customer", "/track/11/golden-hour", "[data-track-actions]"],
  ["player", "desktop-listening", "/search", "[data-player-bar]"],
  ["queue", "interface-queue", "/track/11/golden-hour", "[data-player-bar]"],
  [
    "library",
    "library",
    "/library/songs",
    "[role=grid],[data-virtual-track-list]",
  ],
  [
    "playlist",
    "playlist-populated",
    "/playlist/30/after-hours",
    "[data-playlist-header]",
  ],
  ["messaging", "docs-populated-messaging", "/messages", "h1"],
  ["notifications", "docs-populated-notifications", "/notifications", "h1"],
  [
    "profile",
    "user-profile",
    "/user/99/@averylane",
    "[data-user-profile-header]",
  ],
  [
    "license-wallet",
    "licenses",
    "/library/licenses?search=Golden%20Hour",
    "[data-license-pass]",
  ],
  [
    "download",
    "track-customer",
    "/track/11/golden-hour",
    "[data-track-actions]",
  ],
  [
    "license-verification",
    "docs-license-verification",
    "/verify-license/00000000-0000-4000-8000-000000000001",
    "h1",
  ],
  [
    "account",
    "account-settings-customer-locked",
    "/account-settings",
    "[data-account-settings]",
  ],
  ["billing", "billing-active", "/billing", "[data-billing-overview]"],
  ["privacy", "docs-privacy", "/library/songs", "[data-cookie-notice]"],
  ["requests", "request-send", "/beat-requests", "[data-requests-experience]"],
  ["insights-artist-overview", "artist-insights", "/backstage/artists/5/insights?from=2026-10-05T04%3A00%3A00Z&to=2026-11-04T04%3A59%3A59Z", "[data-insights-header]"],
  ["insights-artist-pro-page", "artist-insights", "/backstage/artists/5/insights?view=pro-page&from=2026-10-05T04%3A00%3A00Z&to=2026-11-04T04%3A59%3A59Z", "[data-insights-header]"],
  ["insights-track-overview", "track-insights", "/backstage/tracks/11/insights?from=2026-10-05T04%3A00%3A00Z&to=2026-11-04T04%3A59%3A59Z", "[data-insights-header]"],
  ["insights-audience", "artist-insights", "/backstage/artists/5/insights?view=audience&from=2026-10-05T04%3A00%3A00Z&to=2026-11-04T04%3A59%3A59Z", "[data-insights-header]"],
  ["dashboard", "dashboard", "/producer-dashboard", "h1"],
  [
    "beat-catalog",
    "catalog-beats",
    "/producer-dashboard/tracks",
    'input[placeholder="Search beats"]',
  ],
  [
    "collection-catalog",
    "catalog-collections",
    "/producer-dashboard/albums",
    'input[placeholder="Search collections"]',
  ],
  [
    "upload",
    "backstage-audio-replace-simple",
    "/backstage/tracks/11/edit",
    "[data-floating-form-actions]",
  ],
  [
    "rights-declarations",
    "backstage-audio-replace-multipart",
    "/backstage/tracks/11/edit",
    "[data-floating-form-actions]",
  ],
  [
    "sample-safe",
    "backstage-audio-replace-multipart",
    "/backstage/tracks/11/edit",
    "[data-floating-form-actions]",
  ],
  [
    "pro-page",
    "pro-page-editor",
    "/producer-dashboard/pro-page",
    "[data-testid=pro-page-section-list]",
  ],
  [
    "audio-recon",
    "recon",
    "/producer-dashboard/audio-recon",
    "[data-recon-track]",
  ],
  [
    "finances",
    "finances",
    "/producer-dashboard/finances",
    "[data-finance-activity]",
  ],
  [
    "payout-setup",
    "account-settings-payout-setup",
    "/account-settings",
    "[data-account-settings]",
  ],
  ["activity", "docs-activity", "/producer-dashboard/activity", "h1"],
  ["progress", "docs-progress", "/producer-dashboard/progress", "h1"],
  [
    "leaderboards",
    "docs-leaderboards",
    "/producer-dashboard/leaderboards",
    "h1",
  ],
  [
    "achievement-goal",
    "docs-progress-goal",
    "/producer-dashboard/progress?achievementGoal=production_master",
    "[data-chosen-achievement]",
  ],
  [
    "achievement-gallery",
    "docs-progress-gallery",
    "/producer-dashboard/progress?achievementStatus=unlocked",
    'section[aria-label="Unlocked"]',
  ],
].map(([id, scenario, route, selector]) => ({
  id,
  scenario,
  route,
  selector,
  audience: [
    "requests",
    "insights-artist-overview",
    "insights-artist-pro-page",
    "insights-track-overview",
    "insights-audience",
    "dashboard",
    "beat-catalog",
    "collection-catalog",
    "upload",
    "rights-declarations",
    "sample-safe",
    "pro-page",
    "audio-recon",
    "finances",
    "payout-setup",
    "activity",
    "progress",
    "leaderboards",
    "achievement-goal",
    "achievement-gallery",
  ].includes(id)
    ? "producer"
    : "customer",
  state: "populated",
  placement:
    {
      upload:
        "Beside the steps for editing an existing beat's details. This is the backstage editor with an unsaved description change, not the new-upload drop zone or a publishing receipt.",
      "rights-declarations":
        "Before the steps for confirming Sample-Safe and AI-use declarations.",
      "license-wallet":
        "Before the steps for finding license details, certificates and verification actions.",
      progress:
        "Beside the XP and level explanation; this is the complete level card, not the goal, achievement gallery or Recent XP dialog.",
      "achievement-goal":
        "Beside choosing, viewing, changing or removing one achievement goal.",
      "achievement-gallery":
        "Beside the Unlocked achievements view and its horizontal artwork gallery.",
      finances:
        "Beside Finance activity and earning-status steps; this is the complete activity list, not the full earnings overview.",
      activity:
        "Beside Recent downloads and the available license action, not the full analytics report.",
      requests:
        "Beside the producer Beat Requests board and its Send beats action.",
      dashboard:
        "Beside the introduction to the Producer Dashboard and its performance overview.",
      "beat-catalog":
        "Before the My Beats steps for finding, featuring or managing a beat.",
    }[id] || "After the introductory explanation, before the task steps.",
}));
export const variants = [
  { device: "desktop", theme: "light", width: 1440, height: 1000 },
  { device: "desktop", theme: "dark", width: 1440, height: 1000 },
  {
    device: "mobile",
    theme: "light",
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    isLandscape: false,
  },
  {
    device: "mobile",
    theme: "dark",
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    isLandscape: false,
  },
];
