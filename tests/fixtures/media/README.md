# Reproduce guide media

## Quick refresh of existing figures

Use the existing catalog and stable image URLs. No dependency installation or application build is required. Run with the pinned Node 22.15.1 toolchain; supply an already installed Chrome executable if the app harness cannot locate one.

```bash
npm run docs:media:refresh -- --workflows dashboard,leaderboards --browser /absolute/path/to/chrome
```

The command prints its unique `/tmp` work directory, freezes the current frontend including uncommitted changes once, and captures all four variants serially through the resource guard. It creates a local `review.html`, full-size staged PNGs, source/theme/fixture hashes and per-attempt logs. It does not publish, start Laravel, connect to a database, or change the application. Browser network access remains restricted to the isolated frontend.

Inspect every light/dark and desktop/iPhone image. Then accept that specific run:

```bash
npm run docs:media:refresh -- --accept --workdir /tmp/THE-PRINTED-RUN --visual-review "Checked all four variants: current design, loaded artwork, legible labels and complete task framing"
```

Acceptance replaces only exact previously reviewed image hashes, retains their original bytes under the run directory, updates the central catalog and selected generated figures, and records a refresh history. It refuses manual edits, missing variants and mixed candidates. A capture command never grants visual approval. Existing URLs and all guides importing the figure update together. Prose review is separate; automatic ledger updates apply only to generated media snippets.

- Add `--list` to list registered workflow IDs and actual routes.
- Add `--plan --workflows leaderboards` to inspect a read-only refresh plan.
- Use `--workdir /tmp/MY-RUN` for a named fresh run. After a capture failure, add `--resume` with the same workflows/workdir to retry the **same frozen candidate**, not current moving application files. Use a new run for newer application changes.
- Refresh a complete workflow quad when its component, shared layout, theme, configured menu or fixture changes. Compare the source manifest with the candidate intended for release. A source fingerprint is not evidence that every backend or rollout state is verified.
- Run `npm run docs:media`, `npm run docs:coverage`, and `npm run docs:test` after acceptance. Use the full documentation quality and rendered-preview gate before publication.
- Copy the run's rollback backups if `/tmp` may be cleared. Do not reset the repository or overwrite unrelated work.

## Low-level capture and troubleshooting

Run from the documentation repository after its resource coordinator has written a ready serial runtime manifest:

    node scripts/capture-media.mjs --source /path/to/read-only/app --workdir /tmp/beatpass-guide-media --runtime-safe /tmp/runtime-safe.json --workflows beat-catalog,license-wallet,messaging,dashboard,upload,rights-declarations,pro-page

The command calls `scripts/docs-runtime.mjs` itself. It uses one browser and serial pages, the guard's CPU/I/O priorities and memory watchdog, and a sanitized environment. It never starts PHP, reads an environment file, accesses a database, installs dependencies, or writes application source. Existing application Node dependencies are reused through a symlink created only inside `/tmp`.

The public homepage is read without authentication to retain only configured light/dark theme fields. The isolated source contains current HEAD files plus every current modified/untracked frontend overlay. A source and theme digest accompanies each image. Current harness drift fails before applying an adapter.

All requests from the browser are intercepted. Only its exact loopback origin and data/blob URLs can reach the network; production and third-party APIs remain blocked. One exact synthetic Recon thumbnail URL is answered directly by request interception with fixture-owned SVG bytes before the external-request rejection rule. No connection to that provider is made. Demo catalogs, license records, messages and earnings are synthetic. Artwork is fixture-owned SVG rendered through the actual media components.

Images are first written only below the work directory: `staging/assets/media/screenshots/<workflow>/<state>/<device>-<theme>.png`. After visually reviewing all four variants and verifying their manifest hashes, copy that complete workflow set to the matching documentation asset paths. No unchecked screenshot is published as a documentation asset. `media-captures.json` in the work directory records dimensions, hashes, route, theme, source revision, capture time and geometry. Images start with `crop.reviewed: false`: inspect every variant before accepting it in the public catalog. A successful browser command does not certify visual quality or live backend behavior.

Run `node --test scripts/test-capture-media.mjs` for the path, network, one-owned-profile, runtime and crop-coordinate safety tests. Keep all screenshots uncommitted until the documentation review is complete.

Use `--device desktop` or `--device mobile`, optionally with `--theme light` or `--theme dark`, for smaller serial capture batches without changing the frozen source. The capture child sets its own smaller 512 MiB JavaScript heap and reuses only its isolated Vite dependency cache; runtime guard limits still apply.

A browser override can select an already installed executable with `--browser /absolute/path/to/chrome`. No browser is downloaded. To retry the same immutable source after a browser/runtime failure, use `--snapshot /tmp/.../source-...` with the same work directory; every recorded frontend file hash is checked before reuse. The snapshot capture time stays explicit, so continuing application WIP is never silently represented as newly captured source.

Each guarded child freezes the exact executable fixture/data files under `fixture-snapshots/<sha256>` and imports those immutable copies. The fixture digest records the bytes actually used even while documentation work continues. Raw read-only application harness inputs are also retained by hash.

Focused dialogs, rights forms, identity sections and catalog tasks have their complete bounding rectangle checked vertically as well as horizontally. Phone capture uses the exact installed Puppeteer iPhone13 profile before navigation:390×844CSS pixels,DPR3,mobile/touch/coarse pointer and its iPhone user agent. Every phone export is an unmodified1170×2532PNG from the full fixed viewport, with `fullPage:false` and `captureBeyondViewport:false`. Never enlarge, crop, squeeze or hide UI for a phone image. A long workflow uses clearly named task states with real controls and scrolling. Desktop targets may use up to1600CSS pixels. Every final four-variant figure uses one current frozen source/theme baseline and receives per-image visual review before `crop.reviewed` can become true.

Configured Google fonts are retrieved without authentication before the guarded browser starts, using the same weights as the application framework. Font bytes are retained only in the temporary theme snapshot with source URLs and hashes, then served as local data URLs. Browser requests to Google and every other external host remain blocked.

For all workflows, `node scripts/capture-media-batch.mjs --source /path/to/read-only/app --workdir /tmp/beatpass-guide-media --snapshot /tmp/beatpass-guide-media/source-TIMESTAMP --browser /path/to/already-installed/chrome` attempts desktop and mobile serially one workflow per guarded child (two theme cases per browser), retaining per-attempt logs and continuing after a workflow failure. Use `--workflows` to select a smaller comma-separated batch. Keep the sole rendering slot until the batch ends.

With capture idle, inspect every image in a complete workflow set, then run `node scripts/promote-media.mjs --workdir /tmp/beatpass-guide-media --workflow ID --visual-review "What you inspected in all four variants"`. Promotion verifies the staged hashes, source/theme consistency and exact safe asset paths. It preserves staging, refuses different existing documentation assets, copies only the four selected files and records the visual-review note. Never mark an unchecked image reviewed.

The upload workflow shows editing an existing synthetic beat at its actual backstage edit route, including a real unsaved description change. It does not illustrate a newly completed upload or publishing transaction. Rights-declaration images show the current form and selected human-made declaration without submitting a change. Configured public theme provenance is separate from the application's real artwork-driven accent colors.

Desktop task-focused rights, Recon, finance-activity, recent-download and level-card figures may use native browser screenshot clips of the entire intended panel; phone exports always use the full fixed viewport. Clip coordinates come from the live DOM plus document scroll exactly once. No screenshot pixels are edited. Download figures additionally wait for visible, painted canvas pixels inside the actual dialog, not merely a loaded background image.

Progress examples use the source-defined achievement configuration, reward values and XP level formula documented in `audit/progress-fixture-evidence.json`. Every synthetic producer workflow uses auth ID101 with one owned artist5, so default XP exclusions do not contradict the example; no real user or production award is changed.

The isolated HTML copies the complete real viewport meta element, including `data-keep="true"`, from the frozen framework Blade template. The real Helmet removes viewport tags without this marker. Before every phone export, assertions verify390px inner/visual width,844px inner height,DPR3,coarse pointer,touch points,iPhone user agent and the retained viewport contract. Metadata records these observations plus explicit capture mode. Visible image loading and actual painted disc-canvas pixels are checked globally; image.complete alone cannot certify a rendered CD. Chromium device emulation does not certify native Safari behavior.

Old393px/tall-phone assets and approvals are historical only. The replacement run starts an empty manifest under a new work directory and preserves old bytes/hashes. Three pilot workflows are inspected before bulk replacement. A featured-beat chooser is a separate state from catalog editing; a saved-beat edit is never described as a completed new upload.

Final figures declare one of two source-backed audience contracts in `audience-contract.json`. Customers use ID99, no producer profile, no admin or music-creation access, and an explicitly illustrative paid Demo plan with a nonfree product granting music.download. Producers use ID101, one coherent owned artist5 and scoped music.create; they receive neither admin nor global media-update/delete permissions. Every capture checks its actual bootstrap actor before interaction and before export, recording raw role names, flattened permissions, ownership and subscription facts. The exact frozen application's download-eligibility helper is type-erased using the pinned Node runtime and executed against that normalized state; no backend transaction is certified. Runtime imports or changed copied download assertions fail closed for review.

A running serial batch can stop safely between child processes when its owner creates `<workdir>/stop-at-next-checkpoint.json`. The coordinator records the next unattempted workflow/device and exits75 without signalling an active browser. Remove only your own completed checkpoint request before a new run.

## Analytics and request examples

The central workflow registry includes artist Overview, artist Audience, Pro Page Traffic and track Overview. Each uses the real report components and supported `from`/`to` date bookmarks. Synthetic report responses keep period labels, bucket dates, totals, completion denominators, track duration and Pro Page outcomes coherent. The fixture regression checks these invariants; a chart with attractive but inconsistent numbers must not be approved.

A phone figure shows one complete native task, such as Avg Listen Duration or Pro Page outcomes, within the fixed iPhone viewport. Desktop figures can show adjacent report sections. Captions must describe the narrower phone state accurately. Requests shows Open briefs on the current producer Beat Requests board on desktop. The phone figure follows Send beats into the native populated beat picker without selecting or sending. Its synthetic countdown clock is pinned to the original frontend freeze; actual UTC capture times remain separately recorded.

Keep raw source manifests, public-bootstrap extracts, capture logs, source inventories, visual-review contact sheets and unsuccessful attempts in private review storage. The public catalog contains the validated active image provenance; do not copy full application configuration or private host paths into it.

Requests currently uses a genuine compact 780px desktop viewport so its native navigation control remains visible. The media gate rejects an offered action with neither a visible label nor icon. This does not certify the wider app layout. Retain the detailed current-source diagnosis privately and refresh the complete figure after the application maintainer's layout review; do not patch application styles in the media harness.

The versioned navigation fixture stores exactly the seven nonadmin menus previously passed to the adapter. Its evaluated payload SHA-256 is separate from the opaque original capture-source hash, and its original retrieval timestamp is retained. Raw public bootstrap extracts remain in private review storage. The navigation regression rejects stored administrator positions and Management links.

### Public capture metadata

The versioned navigation fixture contains only the customer/producer menu projection, checked by `navigation.mjs`. Keep original menu retrievals and diagnostic capture manifests private. Capture-source and evaluated navigation-payload hashes identify different evidence; preserving a raw source hash does not publish its body. `scripts/import-reviewed-media.mjs` screens catalog records with `media-publication.mjs`: required image, role, viewport, framing and source proof remain, while private stylesheet diagnostics and host-specific image URLs stay in staged evidence. Do not paste raw diagnostic records into the public catalog.
