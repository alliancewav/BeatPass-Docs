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

Developer navigation stays compact: Introduction, Core Concepts, and API Reference. `developers/api-reference/openapi.json` is the endpoint source of truth and must match the Laravel routes in `alliancewav/open.beatpass.ca`.

## Accuracy contract

Use evidence in this order:

1. Verified production configuration
2. Current application code
3. Generated API contract
4. Documentation guidelines

Record production-configured or otherwise volatile claims in `audit/claims.yml`. A guideline example that conflicts with verified behavior belongs in `audit/guideline-errata.md`; do not make the product docs match a stale example.

The application baseline is pinned in `audit/source-baseline.json`. The `docs:openapi` check reads the application route files without modifying the application repository.

## Local setup

Prerequisites:

- Node.js 22.15.1 (see `.nvmrc`)
- npm
- Vale 3.17.1
- A read-only checkout of `alliancewav/open.beatpass.ca` next to this repository, or `BEATPASS_SOURCE_DIR` set to its location

Install pinned dependencies:

```bash
npm ci
```

Start the Mintlify preview:

```bash
npx mint dev
```

Run the complete quality gate:

```bash
npm run docs:quality
```

That command runs the custom architecture/content audit, OpenAPI route parity, Mintlify validation, strict links and redirects, snippet validation, accessibility, and Vale.

## Authoring conventions

- Help content is non-technical and action-focused. Put code and endpoint detail under `developers/`.
- Address the reader as “you.” Avoid company-focused “we” and “our” voice outside legal text.
- Use exact production UI labels in bold.
- Use root-relative links for docs and absolute `https://open.beatpass.ca/...` links for the app.
- Use Font Awesome 6 icon names only.
- Use `Columns` for responsive card grids. `CardGroup` is deprecated.
- Import reusable snippets after frontmatter with absolute `/snippets/...` paths and PascalCase names.
- Use `Steps` only for sequences, `Tabs` only for mutually exclusive views, and callouts only when the note changes what the reader should do.

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

Use screenshots only for stable, high-friction workflows. Every screenshot must:

- be listed in `audit/screenshots.yml`;
- include descriptive alt text and a `Frame` caption;
- show desktop/mobile and light/dark coverage across the workflow pair;
- exclude customer records, contacts, payment details, tokens, session data, and private analytics;
- be refreshed when the inspected application SHA changes materially.

## CI

`.github/workflows/docs-quality.yml` runs on every pull request and push to `main`. Configure the repository-scoped `OPEN_BEATPASS_READ_TOKEN` secret with read-only access to `alliancewav/open.beatpass.ca`. CI records the exact application SHA it inspected.

The documentation deploy remains handled by Mintlify’s GitHub integration after review and merge.
