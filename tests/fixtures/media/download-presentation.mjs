// Original: scripts/ci/browser-smoke/listening-dialog-assertions.mjs
// Original full module SHA256: 9f38016779e0b0c68dab3051a8220dec4d538aa07775793ad095d4c405ddc812
// Keeps ALL original download facts, row-count, overflow and one-handoff receipt assertions.
// Only the intermediate screenshot uses the fixed native page viewport, so Puppeteer's
// element-capture viewport restoration cannot disable mobile touch emulation.
import { writeFile } from "node:fs/promises";

export async function assertDownloadPresentation(page, { output, id, lines }) {
  const dialog = await page.$("[data-download-dialog]");
  if (!dialog) throw new Error("Download details are missing");
  await page.screenshot({
    path: `${output}/${id}-download-dialog.png`,
    fullPage: false,
    captureBeyondViewport: false,
  });
  const facts = await dialog.evaluate((el) => ({
    rows: el.querySelectorAll("dl > div").length,
    overflow: el.scrollWidth > el.clientWidth + 1,
    footer: [...el.querySelectorAll("button")]
      .filter((button) =>
        ["Download audio", "Cancel"].includes(button.textContent.trim()),
      )
      .map((button) => {
        const r = button.getBoundingClientRect();
        return {
          label: button.textContent.trim(),
          width: r.width,
          height: r.height,
        };
      }),
  }));
  if (facts.rows !== 3 || facts.overflow)
    throw new Error("Download facts are incomplete or clipped");
  // Observe browser handoff without saving a fixture file or generating rights.
  await page.evaluate(() => {
    const original = HTMLAnchorElement.prototype.click;
    window.__downloadHandoffs = [];
    window.__restoreDownloadHandoff = () =>
      (HTMLAnchorElement.prototype.click = original);
    HTMLAnchorElement.prototype.click = function () {
      if (this.href.includes("/tracks/11/download"))
        window.__downloadHandoffs.push(this.href);
      else original.call(this);
    };
  });
  const label = lines["Download audio"] || "Download audio";
  await page.waitForFunction(
    (label) =>
      [...document.querySelectorAll("[data-download-dialog] button")].some(
        (button) => !button.disabled && button.textContent.trim() === label,
      ),
    {},
    label,
  );
  await page.$$eval(
    "[data-download-dialog] button",
    (buttons, label) =>
      buttons.find((button) => button.textContent.trim() === label).click(),
    label,
  );
  await page.waitForFunction(
    (label) =>
      document
        .querySelector("[data-download-dialog] h2")
        ?.textContent.trim() === label,
    {},
    lines["Download requested"] || "Download requested",
  );
  const receipt = await page.$eval("[data-download-dialog]", (el) => ({
    handoffs: window.__downloadHandoffs,
    licenseLink: !!el.querySelector('a[href="/library/licenses"]'),
    status: !!el.querySelector('[role="status"]'),
  }));
  await page.evaluate(() => window.__restoreDownloadHandoff());
  if (receipt.handoffs.length !== 1 || !receipt.licenseLink || !receipt.status)
    throw new Error(
      "Download handoff lacks certificate guidance or issued twice",
    );
  await writeFile(
    `${output}/${id}-download.json`,
    JSON.stringify({ facts, receipt }, null, 2),
  );
}

export const originalDownloadHelper = {
  path: "scripts/ci/browser-smoke/listening-dialog-assertions.mjs",
  sha256: "9f38016779e0b0c68dab3051a8220dec4d538aa07775793ad095d4c405ddc812",
};
