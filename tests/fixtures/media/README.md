# Maintain documentation screenshots

Create clear examples of BeatPass tasks using the real frontend and invented records. This guide is for documentation maintainers. Customer instructions belong in the Help Center.

## Refresh an existing figure

Use the pinned Node.js 22.15.1 runtime, an authorized read-only app checkout and an already installed Chrome executable. Run captures from an isolated development workspace. The capture command does not install dependencies or build the application.

```bash
npm run docs:media:refresh -- --workflows dashboard,leaderboards --browser /absolute/path/to/chrome
```

The command prints a temporary work directory and creates `review.html` with staged PNGs. It freezes the selected app source, fixtures and capture harness so ongoing edits cannot mix the four variants of a figure.

Open every original image. Check the interface, example records, artwork, labels, controls and framing in desktop/mobile and light/dark views. Then accept that specific run:

```bash
npm run docs:media:refresh -- --accept --workdir /tmp/THE-PRINTED-RUN --visual-review "Reviewed all four variants: accurate screen, loaded artwork, readable labels and complete controls"
```

Acceptance updates the selected assets, catalog entries and generated figures locally. It preserves their existing public URLs and backs up the exact previous image bytes. It stops if the staged images, selected review entries or original assets changed unexpectedly. Unrelated editorial-ledger updates are preserved.

Capturing an image does not approve it. Accepting a figure does not commit or publish it.

### Useful options

- `--list`: show available workflow IDs and routes.
- `--plan --workflows leaderboards`: inspect a refresh plan without capturing.
- `--workdir /tmp/MY-RUN`: choose a fresh isolated work directory.
- `--resume`: retry an interrupted run with the same workflows and frozen source. Start a new run to capture newer app changes.

## Review images for readers

A screenshot should explain a task. Use a populated state unless the guide is explaining an empty state, and keep its caption specific to the screen shown.

- Use the configured app light and dark colors. The generated figure follows the documentation's selected theme.
- Capture iPhone 13 views at **390 × 844 CSS pixels**, with DPR **3**, producing an unmodified **1170 × 2532 PNG**.
- Keep phone captures at their native viewport. Scroll or open the real task state; do not squeeze the interface, hide controls, stretch the image or substitute a tall full-page capture.
- Check that the intended task fits completely. Split a longer workflow into clearly named figures when necessary.
- Wait for visible images and disc artwork to finish painting. A successful loading assertion still needs visual review.
- Keep an offer distinct from an issued license, an unsaved edit distinct from a completed upload, and a draft distinct from a submitted application.
- Use the correct customer or producer fixture. Preserve account eligibility and ownership rules; never grant administrator access to make a screenshot work.
- Keep example dates, totals and chart values consistent. Chromium's iPhone emulation does not certify native Safari behavior.

## Add a workflow

1. Register the actual route, scenario, audience and task in `workflows.mjs`.
2. Add invented records in `demo-data.mjs`, or the relevant task fixture. Do not copy customer data, tokens, bank details or private messages.
3. Add a descriptive alternative and caption in `audit/media-descriptions.json`. Explain any narrower phone task and identify demo data.
4. Capture a complete four-variant set and inspect every original. Use native controls without submitting an application, sending a message, accepting an agreement or completing a transaction.
5. Promote the reviewed workflow with `scripts/promote-media.mjs`, then import its reviewed manifest with `scripts/import-reviewed-media.mjs --write`.
6. Generate its reusable figure with `scripts/media-catalog.mjs --write`, record its editorial review and import `/snippets/media/<workflow>.mdx` in the relevant guides.
7. Run the media, coverage, regression and rendered-preview checks before publication.

## Files to maintain

| File or directory | Purpose |
| --- | --- |
| `workflows.mjs` | Workflow routes and supported capture scenarios |
| `demo-data.mjs` and task fixtures | Invented, internally consistent example records |
| `audience-contract.json` | Customer and producer fixture boundaries |
| `capture-workflow.mjs` | Native desktop interactions |
| `phone-workflows.mjs` | Focused native phone tasks |
| `safety.mjs` and `device-profiles.mjs` | Network, loading, framing and viewport checks |
| `audit/media-descriptions.json` | Reader-facing alternatives and captions |
| `audit/media-catalog.json` | Approved image hashes and public provenance |
| `assets/media/screenshots/<workflow>/<state>/` | Approved image variants |
| `snippets/media/` | Generated figures reused by guides |

Refresh a complete figure when its visible page, shared layout, theme, configured navigation or relevant fixture changes. Review the affected dependency instead of assuming that any source change makes every screenshot stale. Never update hashes merely to silence a failure.

## Capture boundaries

Capture tooling uses a frozen frontend snapshot, synthetic responses and a loopback preview. It does not start PHP, read application environment files or use customer records. The browser blocks external page requests; the coordinator separately retrieves public theme configuration and approved font assets without authentication.

The resource guard runs captures serially with a filtered environment and owned-process monitoring. This is trusted local tooling, not a sandbox for running untrusted code. Do not run unrelated preview or validation jobs concurrently.

Every variant records source, theme, navigation, audience, fixture and harness fingerprints. Missing, corrupt or inconsistent inputs stop the run. Keep these checks intact when updating the adapter for a new app version.

## Troubleshooting and recovery

- **A run fails halfway:** inspect its logs, fix the cause and resume the same frozen candidate. Do not accept a partial set.
- **The frontend or harness changed:** start a fresh run for the newer candidate. Do not mix screenshots from different candidates.
- **A picture is blank, cropped or incorrect:** inspect the original PNG and real interface state. Correct the fixture or native task recipe; do not patch app styles or edit image pixels to hide a UI issue.
- **Acceptance stops after promotion:** use the saved recovery receipt and exact-byte backups to identify which assets and metadata changed. Compare current hashes before restoring selected files.
- **Temporary storage will be cleared:** retain the needed rollback originals and compact provenance in private review storage first.

After acceptance, run `npm run docs:media`, `npm run docs:coverage` and `npm run docs:test`. Use the complete `npm run docs:quality` gate and rendered page review before publishing.

Keep raw app snapshots, bootstrap responses, capture diagnostics, failed attempts and confidential review notes out of public Git candidates and the hosted site. `.mintignore` does not make a committed file private. Publish only the approved images and screened metadata needed by the guides and quality checks.
