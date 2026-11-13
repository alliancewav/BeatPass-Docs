/* Shared with the app: bp_consent=granted|denied, .beatpass.ca, /, six months. */
(() => {
  if (window.beatpassDocsAnalytics) return;
  window.beatpassDocsAnalytics = true;

  const measurementId = "G-5K99X60DF6";
  const cookieName = "bp_consent";
  let refusedInMemory = false;
  let currentConsent;
  let preferencesOpen = false;
  let returnFocus;
  let saveFailed = false;

  function readConsent() {
    try {
      const value = document.cookie.split(/;\s*/).find((cookie) => cookie.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
      return value === "granted" || value === "denied" ? value : null;
    } catch {
      return null;
    }
  }

  function consentState(value) {
    return {
      analytics_storage: value,
      ad_storage: value,
      ad_user_data: value,
      ad_personalization: value,
    };
  }

  // No built-in GA integration: defaults must precede any tag or measurement.
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("consent", "default", consentState("denied"));
  const stored = readConsent();
  currentConsent = stored;
  if (stored === "granted") window.gtag("consent", "update", consentState("granted"));
  window.gtag("js", new Date());
  window.gtag("set", { content_group: "docs" });
  // Keep GA4's initial and enhanced-measurement history pageviews. The global
  // context also labels automatic pageviews without sending duplicate events.
  window.gtag("config", measurementId, { content_group: "docs" });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.dataset.beatpassAnalytics = "ga4";
  document.head.appendChild(script);

  function clearAnalyticsCookies() {
    try {
      const names = document.cookie.split(/;\s*/).map((cookie) => cookie.split("=")[0]).filter((name) => /^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name));
      const parts = location.hostname.split(".");
      const domains = ["", ...parts.map((_, i) => `; Domain=.${parts.slice(i).join(".")}`)];
      for (const name of names) {
        for (const domain of domains) document.cookie = `${name}=; Max-Age=0; Path=/${domain}; SameSite=Lax`;
      }
    } catch { /* Blocked storage must not stop the notice or navigation. */ }
  }

  const notice = document.createElement("section");
  notice.className = "bp-consent-notice";
  notice.setAttribute("aria-label", "Privacy preferences");
  notice.innerHTML = `
    <p>Optional analytics and marketing cookies help us improve BeatPass. Your choice won't affect access. Change it anytime in Privacy preferences.</p>
    <a href="https://open.beatpass.ca/pages/privacy-policy">Privacy Policy</a>
    <p class="bp-consent-error" role="alert" hidden>Your privacy choice could not be saved. Optional cookies remain off.</p>
    <div class="bp-consent-actions">
      <button type="button" data-choice="denied">Refuse</button>
      <button type="button" data-choice="granted">Accept</button>
      <button type="button" data-cancel hidden>Cancel</button>
    </div>`;
  const reopen = document.createElement("button");
  reopen.type = "button";
  reopen.className = "bp-consent-reopen";
  reopen.textContent = "Privacy preferences";
  const error = notice.querySelector("[role=alert]");
  const cancel = notice.querySelector("[data-cancel]");

  function renderNotice() {
    const visible = currentConsent === null || preferencesOpen || saveFailed;
    notice.hidden = !visible;
    reopen.hidden = visible;
    error.hidden = !saveFailed;
    cancel.hidden = !preferencesOpen || currentConsent === null || saveFailed;
    // Reattach if a host navigation replaces the body content.
    if (!notice.isConnected) document.body.appendChild(notice);
    if (!reopen.isConnected) document.body.appendChild(reopen);
  }

  function syncConsent() {
    const stored = readConsent();
    if (stored !== "granted") refusedInMemory = false;
    const next = refusedInMemory ? "denied" : stored;
    if (next !== currentConsent) {
      currentConsent = next;
      window.gtag("consent", "update", consentState(next === "granted" ? "granted" : "denied"));
      if (next !== "granted") clearAnalyticsCookies();
    }
    renderNotice();
  }

  function closePreferences() {
    preferencesOpen = false;
    renderNotice();
    // Don't leave keyboard focus on a button that has just been hidden.
    (returnFocus?.isConnected ? returnFocus : reopen).focus();
    returnFocus = null;
  }

  notice.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-choice]")?.dataset.choice;
    if (!choice) return;
    let saved = false;
    try {
      const expires = new Date();
      expires.setUTCMonth(expires.getUTCMonth() + 6);
      const domain = location.hostname === "beatpass.ca" || location.hostname.endsWith(".beatpass.ca") ? "; Domain=.beatpass.ca" : "";
      document.cookie = `${cookieName}=${choice}; Expires=${expires.toUTCString()}; Path=/; SameSite=Lax${domain}${location.protocol === "https:" ? "; Secure" : ""}`;
      saved = readConsent() === choice;
    } catch { /* Failed acceptance never grants consent. */ }
    if (saved) refusedInMemory = false;
    else if (choice === "denied") refusedInMemory = true;
    saveFailed = !saved;
    if (saved || choice === "denied") {
      try { localStorage.setItem(cookieName, `${choice === "granted" ? "accepted" : "refused"}:${Date.now()}`); } catch { /* Cookies are authoritative. */ }
    }
    syncConsent();
    if (saved) closePreferences();
  });
  cancel.addEventListener("click", closePreferences);
  reopen.addEventListener("click", () => {
    returnFocus = document.activeElement;
    preferencesOpen = true;
    saveFailed = false;
    renderNotice();
    notice.querySelector("[data-choice=denied]").focus();
  });

  if (stored !== "granted") clearAnalyticsCookies();
  syncConsent();
  window.addEventListener("mintlify:navigate", syncConsent);
  window.addEventListener("focus", syncConsent);
  window.addEventListener("pageshow", syncConsent);
  window.addEventListener("storage", (event) => {
    if (event.key === cookieName || event.key === null) syncConsent();
  });
  // Cookies are shared across subdomains; localStorage events are origin-only.
  window.setInterval(syncConsent, 1000);
})();
