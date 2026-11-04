import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";

const run = promisify(execFile);
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function fontUrlAllowed(value, kind) {
  const url = new URL(value);
  return (
    url.protocol === "https:" &&
    !url.port &&
    !url.username &&
    !url.password &&
    url.hostname ===
      (kind === "css" ? "fonts.googleapis.com" : "fonts.gstatic.com")
  );
}

async function download(url, kind) {
  if (!fontUrlAllowed(url, kind))
    throw new Error("Unexpected public font host");
  const result = await run(
    "curl",
    [
      "--fail",
      "--silent",
      "--show-error",
      "--connect-timeout",
      "6",
      "--max-time",
      "16",
      "--max-filesize",
      "2097152",
      "--user-agent",
      "Mozilla/5.0 Chrome/133.0.0.0 Safari/537.36",
      url,
    ],
    { encoding: "buffer", maxBuffer: 2 * 1024 * 1024, timeout: 20000 },
  );
  return result.stdout;
}

// Cache the exact configured Google font outside the browser. The browser still
// rejects every nonlocal request, including requests for public font services.
export async function publicFontStyles(themes, fetchBytes = download) {
  const families = [
    ...new Set(
      Object.values(themes)
        .map((t) => t.font)
        .filter((font) => font?.google)
        .map((font) => font.family),
    ),
  ];
  const faces = [],
    assets = [];
  for (const family of families) {
    if (!/^[A-Za-z0-9 -]+$/.test(family))
      throw new Error("Configured Google font family needs explicit review");
    const url =
      "https://fonts.googleapis.com/css2?family=" +
      encodeURIComponent(family).replaceAll("%20", "+") +
      ":wght@400;500;600;700&display=swap";
    let css = (await fetchBytes(url, "css")).toString("utf8");
    const sources = [
      ...new Set(
        [...css.matchAll(/url\((https:\/\/[^)]+)\)/g)].map((match) => match[1]),
      ),
    ];
    if (!sources.length || sources.length > 12)
      throw new Error("Unexpected configured font asset count");
    for (const source of sources) {
      if (!fontUrlAllowed(source, "font"))
        throw new Error("Public font stylesheet referenced an unexpected host");
      const bytes = await fetchBytes(source, "font");
      const mime = source.endsWith(".woff2")
        ? "font/woff2"
        : source.endsWith(".woff")
        ? "font/woff"
        : "font/ttf";
      css = css.replaceAll(
        source,
        `data:${mime};base64,${bytes.toString("base64")}`,
      );
      assets.push({
        family,
        source,
        sha256: digest(bytes),
        bytes: bytes.length,
      });
    }
    if (/@import|url\((?!data:)/.test(css))
      throw new Error("Font stylesheet still contains an external request");
    faces.push(css);
  }
  return { css: faces.join("\n"), assets };
}
