# BeatPass documentation

Find answers about discovering beats, releasing music, managing your account and growing as a producer. This repository contains the BeatPass Help Center, release notes and developer reference, published at [docs.beatpass.ca](https://docs.beatpass.ca).

- [Help Center](https://docs.beatpass.ca/help): practical guides for customers and producers.
- [API & Developers](https://docs.beatpass.ca/developers/overview): approved integrations and public API reference.
- [What's New](https://docs.beatpass.ca/release-notes): product updates and release notes.

For product support, email [support@beatpass.ca](mailto:support@beatpass.ca). Report security concerns privately to [contact@beatpass.ca](mailto:contact@beatpass.ca), rather than opening a public issue.

## Repository guide

| Location | Purpose |
| --- | --- |
| `help/` | Task-based customer and producer guides |
| `developers/` | Integration guidance and API reference |
| `release-notes/` | Current and historical product updates |
| `snippets/` | Shared content and reusable media figures |
| `assets/media/screenshots/` | Reviewed screenshots with invented example data |
| `docs.json` | Site appearance, navigation and redirects |
| `scripts/` and `tests/` | Documentation validation and media-maintenance tools |

Maintainer instructions and quality tooling are visible in this public Git repository but excluded from the published Help Center.

## Writing useful guides

Lead with what the reader wants to accomplish. Give the exact app entry point, short steps, the expected result and a recovery path when something goes wrong. Use the visible interface labels and encouraging, plain language.

Keep Help content nontechnical. Put code, authentication examples and API details under `developers/`. Use shared snippets and task-focused screenshots instead of repeating content across pages. Preserve existing URLs through permanent redirects when reorganizing guides.

Check guidance against the relevant app behavior before changing it. Link to current pricing and account-specific details rather than copying values that may change. Legal summaries link to their governing policies; documentation does not amend existing license agreements.

## Validate changes

Use Node.js **22.15.1**, npm and Vale **3.17.1**. Source-alignment checks also require an authorized, read-only application checkout. Set `BEATPASS_SOURCE_DIR` to that checkout and `BEATPASS_VALE_BIN` if Vale is not on your executable path.

Install dependencies and run previews only in an isolated development copy. On a shared application server, use an unserved workspace under `/tmp`; never copy application environment files or replace the application's dependencies.

For an isolated copy at `/tmp/beatpass-docs-review`, run these commands from that directory:

```bash
npm ci
node scripts/docs-runtime.mjs --cwd /tmp/beatpass-docs-review -- npm run docs:quality
```

If the copy has no Git metadata, set `BP_DOCS_REPOSITORY_DIR` to the original documentation checkout so publication checks can inspect the actual commit candidates.

The quality gate checks public content, review coverage, media, API route alignment, navigation, links, accessibility and language. Run rendering jobs serially. Confirm a preview listens only on loopback, and stop it before starting Mintlify validation. Passing these checks does not certify live payments, deployed settings or legal compliance.

## Maintain screenshots

Use the [media maintenance guide](tests/fixtures/media/README.md) to refresh selected workflows. Keep screenshots in the central media tree and reuse their generated figures in guides.

Each figure has desktop and iPhone views in light and dark themes. Use real frontend components with invented records. Review every variant for readable text, loaded artwork, complete controls and accurate captions before accepting it. Keep existing image URLs stable when refreshing a figure.

## Keep public files safe

Everything committed here is public, including files excluded from the website by `.mintignore`. That file controls site publication, not confidentiality.

Do not commit credentials, environment files, customer records, payment details, private conversations, application source copies, diagnostic exports or confidential review reports. Use placeholders in code examples and synthetic records in screenshots. Keep any required local review material in ignored storage and verify it is absent from Git's commit candidates.

Before publishing, run `npm run docs:publication` and inspect the proposed diff, including images. Automated screening supplements a human review; it does not guarantee that every kind of sensitive information will be detected. If a real credential has already been published, revoke or rotate it. Removing the latest copy does not erase earlier Git history.

## Publish with the matching release

Coordinate documentation updates with the app behavior they describe. Keep release announcements reader-facing and put unfinished editorial notes in private review storage.

The quality workflow and Mintlify deployment are separate. Verify the configured publication controls, then confirm the intended documentation revision is live. Check mobile navigation, hosted search, important links and both image themes after publication. Keep a known-good documentation revision available for recovery.

A documentation-only change does not require an application build, database change or application-service restart.
