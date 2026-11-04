// Exact installed Puppeteer25.6 KnownDevices["iPhone 13"] profile.
// Chromium emulation is recorded honestly; this is not a native Safari test.
export const iphone13 = {
  name: "iPhone 13",
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1",
  viewport: {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    isLandscape: false,
  },
};

export function retainedViewportTag(framework) {
  const tag = framework.match(/<meta\s+name="viewport"[^>]*\/>/s)?.[0];
  if (!tag?.includes("width=device-width") || !tag.includes('data-keep="true"'))
    throw new Error("Current framework viewport contract is missing");
  return tag;
}
