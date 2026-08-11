# Documentation guideline errata

Application baseline: `alliancewav/open.beatpass.ca@95a6c369c50ffd8c5f75b2775406cd34bf967cfc`  
Production verification date: 2026-08-11

These entries record cases where verified product behavior takes precedence over the supplied documentation examples.

| Guideline example | Verified behavior | Documentation decision | Evidence |
| --- | --- | --- | --- |
| Profile menu item: **Edit Profile** | Production uses **Settings**; the destination heading is **Account Settings**. The code default is **Account settings**, so the production menu configuration is authoritative. | Use **Settings** for the menu action and **Account Settings** for the page. | Production UI; `config/common/default-settings.php`; navbar auth menu |
| Upload formats: WAV, FLAC, and AIFF | The current producer uploader accepts WAV only and rejects the other formats. | Document WAV-only uploads. Continue to describe FLAC as an optional promised exclusive-license deliverable where applicable. | Production uploader; `use-track-uploader.ts` |
| `CardGroup` examples | Mintlify marks `CardGroup` deprecated and recommends `Columns`. | Use `Columns` for responsive card grids. | Current Mintlify component guidance |
| Mixed snippet conventions | Current Mintlify and the later guideline section use MDX imports. | Use absolute `/snippets/` imports and PascalCase components exclusively. | Current Mintlify reusable-snippet guidance |

Errata must be rechecked when the application source SHA or production configuration changes.
