# BeatPass Documentation

The official BeatPass Help Center, release notes, and developer reference, published with Mintlify at [docs.beatpass.ca](https://docs.beatpass.ca).

## Information architecture

The Help Center is organized around eight user tasks:

1. Start Here
2. Discover & Play
3. Library & Community
4. Licensing & Plans
5. Producer Setup
6. Grow & Get Paid
7. Account & Notifications
8. Trust & Support

`docs.json` is the tested public navigation and redirect contract. Keep Help navigation at 160 pages or fewer and no deeper than tab → group → page. A page can remain outside navigation when it is still a useful search destination, but every URL in `audit/public-url-baseline.json` must remain a page or permanent redirect.

Developer navigation stays compact: Introduction, Core Concepts, and API Reference. `developers/api-reference/openapi.json` describes selected supported integration operations. Verify it against the reviewed application routes and handlers; route parity alone does not prove eligibility or request behavior.

## Accuracy contract

Use evidence in this order:

1. Verified production configuration
2. Current application code
3. Generated API contract
4. Documentation guidelines

For rights, refunds, and consent, use the governing Terms, incorporated agreements, and applicable transaction documents. Application code does not amend those documents or historical grants; route unresolved differences to the legal owner.

Record production-configured or otherwise volatile claims in `audit/claims.yml`. A guideline example that conflicts with verified behavior belongs in `audit/guideline-errata.md`; do not make the product docs match a stale example.

`audit/source-baseline.json` retains the original application baseline. `audit/pending-release.json` fingerprints the complete reviewed authored application tree; the per-page editorial record is `audit/polish-review.json`. Detailed source inventories and review findings stay in private local audit files. The `docs:openapi` check reads the application route files without modifying the application repository.

The consolidation rationale is grounded in the aggregate 90-day Mintlify snapshot in `audit/analytics-baseline.md`. Re-run that review after the new architecture has collected 90 days of traffic.

## Local setup

Prerequisites:

- Node.js 22.15.1 (see `.nvmrc`)
- npm
- Vale 3.17.1
- A read-only checkout of `alliancewav/open.beatpass.ca` next to this repository, or `BEATPASS_SOURCE_DIR` set to its location

On the production host, copy this documentation into an unserved directory under `/tmp` first. Exclude `.git`, `.env`, and `node_modules`; never copy the application environment. Run `npm ci` with the pinned lockfile only in that disposable copy. Leave the served dependency symlink untouched.

Run rendering through the resource guard:

```bash
node /path/to/Documentation/scripts/docs-runtime.mjs --cwd /tmp/your-docs-review -- npm run docs:quality
```

Set the non-secret `BEATPASS_SOURCE_DIR` and `BEATPASS_VALE_BIN` tool paths when needed. For an unserved copy without Git metadata, set `BP_DOCS_REPOSITORY_DIR` to the original documentation checkout so publication checks can read its commit candidates. The copied publication configuration must match. The guard strips inherited database/provider variables, serializes render jobs, uses nice 15 and the lowest best-effort I/O priority, caps Node heap, and stops its owned process tree if available memory falls below 2560 MiB or owned proportional memory plus proportional swap exceeds 2048 MiB (conservative RSS fallback when unavailable). It requires 4096 MiB available before starting. Cleanup validates process identities and protects caller/coordinator ancestors; it signals confirmed owned PIDs individually and records targets, without negative process-group signals. It does not prove production readiness or impose a kernel-level CPU quota.

Stop validation before starting a preview. Confirm the installed preview binds **127.0.0.1**; the pinned CLI defaults to all interfaces, so this review uses a loopback-only patch in its disposable installation. Do not modify a running app or system service to preview docs. Keep a single browser worker and use invented fixture records without starting PHP, connecting databases, or making live app requests.

The complete quality gate checks architecture, review coverage, media provenance and generation, regression tests, API route parity, Mintlify rendering, links, accessibility, and Vale. Mintlify validation and dev share a global generated cache: never run them concurrently, even from different source directories.

## Authoring conventions

- Help content is non-technical and action-focused. Put code and endpoint detail under `developers/`.
- Address the reader as “you.” Avoid company-focused “we” and “our” voice outside legal text.
- Use exact production UI labels in bold.
- Use root-relative links for docs and absolute `https://open.beatpass.ca/...` links for the app.
- Use Font Awesome 6 icon names only.
- Use `Columns` for responsive card grids. `CardGroup` is deprecated.
- Import reusable snippets after frontmatter with absolute `/snippets/...` paths and PascalCase names.
- Use `Steps` only for sequences, `Tabs` only for mutually exclusive views, and callouts only when the note changes what the reader should do.

### Reader-first Help pages

Start with the outcome and eligibility, then give the exact app entry point, short steps, a visible result, recovery and a useful next task. Use native `Steps` for a sequence and task or audience `Tabs` with `sync={false}` for independent choices. Keep eligibility, rights, payment conditions and deadlines visible outside optional disclosures.

Pair each figure with the audience and state it actually shows. Do not place an active subscription screenshot in a no-plan explanation or present a saved beat as a completed new upload. Use the shared reviewed media snippets; avoid decorative screenshots on legal summaries and API reference pages.

Keep developer setup and endpoint reference in the API & Developers tab. The architecture check enforces the Help/reference boundary. The existing API-token account help URL remains available as a secondary bridge for readers who need it.

Example snippet import:

```mdx
import NeedHelp from "/snippets/sections/need-help.mdx";

<NeedHelp />
```

Example responsive navigation cards:

```mdx
<Columns cols={2}>
  <Card title="Upload beats" icon="cloud-arrow-up" href="/help/uploading/upload-page">
    Upload a WAV file and complete its release details.
  </Card>
  <Card title="My Licenses" icon="file-contract" href="/help/downloads-and-licensing">
    Find and verify your license certificates.
  </Card>
</Columns>
```

## Screenshots

Refresh selected existing figures with one staged capture command:

```bash
npm run docs:media:refresh -- --workflows dashboard,leaderboards --browser /absolute/path/to/chrome
```

Inspect the printed work directory's `review.html` and original PNGs, then use the printed acceptance command. The tool retains the current source once, captures all four variants serially, preserves stable URLs and previous reviewed bytes, and updates only the chosen catalog figures and generated review hashes. Nothing is published. Use `--list` or `--plan --workflows leaderboards` for discovery, and `--resume` to retry an interrupted run against its same frozen source. Full instructions: [media fixture README](tests/fixtures/media/README.md#quick-refresh-of-existing-figures).

Keep current workflow screenshots under `assets/media/screenshots/<workflow>/<state>/`. The capture source of truth is `audit/media-catalog.json`; generate self-contained figures in `snippets/media/` with:

```bash
node scripts/media-catalog.mjs --write
```

Capture under `/tmp` staging first. The public screenshot folder contains only catalog-registered variants; retain superseded/failed attempts privately with exact-hash history, not as orphan public assets. Promote only a complete, visually checked set; unchecked crops stay outside public assets. Import reviewed metadata with `node scripts/import-reviewed-media.mjs /tmp/review/media-captures.json --write`, then regenerate the snippets. The importer requires a customer-facing alternative and caption in `audit/media-descriptions.json`.

A figure requires desktop/mobile × light/dark variants, descriptive alternatives, a caption identifying demo data, PNG dimensions and hashes, app source, public-theme and configured-navigation fingerprints, route/state/date, and reviewed complete framing. Import the generated MDX snippet once in a guide; do not paste image URLs or manual theme tabs into individual pages. Four explicit image wrappers select the visible desktop/mobile and light/dark variant through CSS. `html.dark` follows the selected Mintlify theme independently of the OS preference. The mobile breakpoint is 640px. Keep the invented records consistent across all four variants and recheck every affected variant when fixtures change. This avoids the pinned Mintlify client's transformation of native picture sources; verify actual image selection in the rendered page. Screenshots use the supported `noZoom` image property inside accessible links to their original PNGs. This keeps enlargement available while avoiding the pinned zoom component's Safari server/client wrapper mismatch. See [Mintlify image links](https://mintlify.com/docs/image-embeds). Do not regenerate fingerprints to hide a stale screenshot.

For phone captures, emulate **iPhone 13 before navigation**: 390 × 844 CSS pixels, DPR 3, touch enabled, and a 1170 × 2532 PNG. Retain the app’s complete viewport meta tag, including its preservation marker. Assert the observed layout viewport, visual viewport, density, touch and user agent before export. Do not stretch the viewport, zoom the interface, hide app chrome, use a full-page phone image, or substitute a clipped panel. Scroll or open the actual task state; split a long workflow into named figures when needed.

Use separate, source-shaped customer and producer accounts. Neither may inherit administrator or global media-update permissions. Record actual role names, effective permissions, owned profile IDs, subscription state and task-specific track ownership. Customer catalog licensing must show another producer’s beat and the entitlement the source requires. Producer examples keep one owned profile and preserve the restriction on new catalog licenses, even when a paid benefit is demonstrated. All four variants share the same reviewed role-contract fingerprint and actor context.

Every visible image must finish loading and every visible disc must have painted artwork before export. Save those checks with the capture metadata, then inspect the actual PNG in both themes for cropped actions, squeezed controls, overlays, contrast and missing artwork. An automated loaded-image check does not replace that visual review. Refresh all four variants together when the reviewed frontend baseline changes; preserve superseded provenance separately.

Use realistic invented titles, artwork, catalogs, messages, licenses, and activity rendered by the actual frontend. Use the anonymous public menu settings for labels, destinations and icons; let the actual frontend filter unavailable entries. Generic smoke-test menu icons are not representative screenshots. Never include customer records, payment details, tokens, private analytics, or production credentials. Empty-state screenshots belong only in instructions about that state. Reuse a figure only where its exact screen helps the task; keep historical releases and the developer reference free of misleading current screenshots.

`audit/screenshots.json` preserves first-pass capture provenance; August assets are historical. Retained older asset URLs are not current release evidence. `.mintignore` keeps audit reports, fixture tooling, and private authoring context out of published pages/search. It is not an access-control mechanism or a place to store secrets.

## CI

`.github/workflows/docs-quality.yml` runs on every pull request and push to `main`. Configure the repository-scoped `OPEN_BEATPASS_READ_TOKEN` secret with read-only access to `alliancewav/open.beatpass.ca`. CI records the exact application SHA it inspected.

Mintlify publishes from the configured Git deployment branch. The GitHub quality workflow validates the candidate; it is separate from publication. Do not assume a same-push quality run delays a deployment unless that protection is configured and verified.

Before the owner pushes documentation, make the matching application contents available on application `main` for CI and verify the matching app release. Run the complete local gate against those contents first. After publication, confirm the exact docs commit is live and check the public site, hosted search and both screenshot themes. Record a known-good docs deployment for recovery. An application build, Laravel cache refresh, database change or service restart is never part of a documentation-only deployment. [Mintlify publishing guidance](https://www.mintlify.com/blog/instant-rollbacks).

## Release review and publication

Public pages contain finished reader-facing copy. Keep editorial status, unresolved findings and approval notes in ignored local audit files, never in release announcements. Do not invent a release date: coordinate the documentation deployment with the matching application release.

`docs:publication` checks public copy, credential patterns and the public repository's commit candidates. `_source/`, runtime material, private audit reports, source snapshots and review patches are excluded from both Git and the published site as appropriate. `.mintignore` controls website publication only; it does not protect a file committed to this public repository. Never store credentials in either location. The small allowlisted audit ledgers contain only the metadata needed by reproducible quality checks.

Keep paid producer access separate from customer download eligibility: producer access stays free, and a subscription does not unlock new standard catalog licenses for producer accounts. Current purchase logic also blocks new exclusive catalog purchases by producers. Preserve own-file access and retrieval under valid earlier grants. Application behavior does not settle a policy-owner decision.

`audit/claim-consumers.json` fingerprints the exact pages reviewed for consequential claims. Refresh a fingerprint only after reviewing the affected claim again. Generated figures have their own catalog evidence and do not replace a page's editorial review. Source inspection and synthetic screenshots do not establish deployed settings or completed customer transactions.

The navigation updater is deliberately narrow. `node scripts/rebuild-navigation.mjs --check` is read-only; `--write` updates only `docs.json`. It preserves release notes, developer navigation, redirects, and added Help entries. It never deletes or rewrites MDX pages. Run `npm run docs:test` after changing it.

## Continuous maintenance

For each product change, review the affected Help task, developer contract, consequential claims and release summaries together. Run the quality gate before publication. Recheck current policy links, account-dependent wording and screenshot framing after a relevant change. Review navigation and aggregate search feedback after 90 days; keep customer records out of review artifacts.

Run `npm run docs:release` with `BEATPASS_SOURCE_DIR` pointing at the read-only application checkout. The check compares all four release entry points and the complete authored source-tree fingerprints against `audit/pending-release.json`. Committing the reviewed application tree without changing its contents remains valid. Added, removed or modified source requires another review, even when Git's working tree is clean. It makes no application, database or provider requests.

On drift, read the affected frontend and service changes. Revise guidance or record a justified exclusion, then update related summaries and exact-byte review records together. Never refresh fingerprints merely to make a check pass. Source coverage is a scope record, not a claim that each changed file introduces a feature or that every line received a security audit.

Insights is included in the current review. Desktop Companion remains outside announcements while its download availability is disabled. Verify configured rollout states, actual transactions and canonical policy changes through their owners before making a stronger availability claim. Keep these release checks and private owner follow-ups separate from customer instructions.

Keep each review reversible with a before/after patch and exact file hashes in ignored local audit storage. Preserve earlier uncommitted work; never use a repository-wide reset to undo a documentation pass.
