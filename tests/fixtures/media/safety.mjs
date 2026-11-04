import path from "node:path";
export function safeAssetPath(root, workflow, state, variant) {
  for (const value of [workflow, state, variant])
    if (!/^[a-z][a-z0-9-]*$/.test(value))
      throw new Error("Invalid media identifier");
  return path.join(root, workflow, state, `${variant}.png`);
}
export function localRequestAllowed(value, origin) {
  const url = new URL(value);
  return ["data:", "blob:"].includes(url.protocol) || url.origin === origin;
}
// Chrome screenshot clips use document coordinates. Bounding boxes are viewport-relative.
export function documentClip(rect, viewport, scroll = { x: 0, y: 0 }) {
  const x = Math.max(0, rect.x),
    y = Math.max(0, rect.y),
    right = Math.min(viewport.width, rect.x + rect.width),
    bottom = Math.min(viewport.height, rect.y + rect.height);
  if (right <= x || bottom <= y)
    throw new Error("Capture target is outside the viewport");
  return {
    x: x + scroll.x,
    y: y + scroll.y,
    width: right - x,
    height: bottom - y,
  };
}
export function assertSingleOwnedProfile(user) {
  if (user.artists?.length > 1)
    throw new Error("Demo account must have one owned producer profile");
}
export function assertRuntimeReady(value) {
  if (value?.ready !== true || value.serial !== true)
    throw new Error("Capture requires a ready serial runtime manifest");
}

// Existing staged images are rollback evidence, never proof a failed refresh ran.
export function unrefreshedVariants(captures, workflow, variants, since) {
  return variants.filter(variant => !captures.some(record =>
    record.id === workflow &&
    `${record.viewport.width < 768 ? "mobile" : "desktop"}-${record.theme}` === variant &&
    Date.parse(record.captured_at) >= since
  ));
}
export function assertNoCaptureGap(data, workflow) {
  if (data.gaps?.some(gap => gap.workflow === workflow && gap.missing_variants?.length))
    throw new Error("Unresolved capture failure for " + workflow + "; retry every failed variant before approval");
}

export function insightsActionVisible(diagnostic) {
  return !diagnostic || diagnostic.children.some(child =>
    child.width > 1 && child.height > 1 && child.display !== "none" &&
    child.visibility !== "hidden" && child.clip !== "rect(0px, 0px, 0px, 0px)"
  );
}
