---
audience: help
title: "AI Agent Guide: BeatPass Documentation"
sidebarTitle: "AI Agent Guide"
description: "Comprehensive guide for AI agents creating and updating all types of BeatPass documentation."
---

# AI Agent Guide: BeatPass Documentation

**Purpose**: Create accurate, user-focused documentation for all BeatPass features—new docs, updates, and release notes.

---

## Quick Start

### What Type of Documentation?

<CardGroup cols={3}>
  <Card title="New Documentation" icon="file-circle-plus" href="#section-2-writing-new-documentation">
    Creating docs for features that aren't documented yet
  </Card>
  <Card title="Update Existing" icon="arrows-rotate" href="#section-3-updating-documentation">
    Fixing or refreshing current documentation
  </Card>
  <Card title="Release Notes" icon="bullhorn" href="#section-4-release-notes">
    Announcing new features and changes
  </Card>
</CardGroup>

---

## Section 1: Universal Principles (Apply to ALL Documentation)

### Core Mandates

1. **Verify First, Write Second** — Never document without confirming feature exists
2. **Exact UI Labels** — Use bold text for buttons, menus, sections: `**Billing**`
3. **No Technical Jargon** — `music.create` permission → "ability to upload tracks"
4. **User-Focused** — Write "you can" not "we have added"
5. **Root-Relative Links** — `/help/path` not `../path` or `https://...`
6. **Font Awesome 6 Icons Only** — The icon library is `fontawesome`. Never use Lucide icon names.
7. **WCAG AA Compliance** — All colors must meet minimum 4.5:1 contrast ratio against their background.

### Audience Separation Rule

**CRITICAL**: Maintain clear separation between user-facing and technical documentation:

| Location | Audience | Language |
|----------|----------|----------|
| `Documentation/help/` | End users (non-technical) | Plain English, no code |
| `Documentation/developers/` | Developers (technical) | Technical terms, code examples OK |
| `Documentation/help/release-notes/` | End users (non-technical) | Plain English, benefits-focused |

**For ALL documentation in `/help/`:**
- ❌ NO code examples
- ❌ NO API endpoint references
- ❌ NO technical implementation details
- ❌ NO database column names
- ❌ NO internal architecture explanations
- ✅ YES plain English explanations
- ✅ YES user actions and outcomes
- ✅ YES benefits and value propositions

**When technical details are relevant:**
- Reference the developers documentation: "See [API Reference](/developers/api/endpoint) for technical details"
- Keep the main content focused on user actions
- Don't explain how it works, explain how to use it

**Example:**
```mdx
❌ Wrong (for /help/):
"The system uses the `processPayment()` method with the 
`stripe.payment_intent` webhook to handle transactions."

✅ Correct (for /help/):
"When you complete your purchase, your payment is processed 
securely and you'll receive a confirmation email."

✅ With technical reference:
"Your payment is processed securely. See the 
[Payment API Reference](/developers/api/payments) for 
technical integration details."
```

### The Golden Rule

> **NEVER document a feature without verifying it exists in the codebase.**

**Before writing a single sentence:**
```bash
# Search UI components
grep -r "FeatureName" resources/client/ --include="*.tsx"

# Search backend
grep -r "FeatureName" app/ --include="*.php"

# Verify database
grep -r "feature_table" database/migrations/
```

If you can't find it, **STOP** and flag for human review.

### Critical Verification Checklist

For every documentation task:

- [ ] **Feature existence** — Found in codebase
- [ ] **UI elements** — Exact labels from components
- [ ] **Navigation** — Actual menu paths verified
- [ ] **Database values** — Queried if applicable (pricing, settings)
- [ ] **No hallucination** — Only documented verified facts

### Common Verification Commands

```bash
# Profile menu items
php artisan tinker --execute="$menus = json_decode(\DB::table('settings')->where('name', 'menus')->first()->value, true); foreach($menus as $menu) { if (in_array('auth-dropdown', $menu['positions'] ?? [])) { foreach($menu['items'] as $item) { echo $item['label'] . ' → ' . $item['action'] . PHP_EOL; } } }"

# Subscription plans
php artisan tinker --execute="echo json_encode(\DB::table('products')->get(['name', 'free'])->toArray());"

# Contact email
php artisan tinker --execute="echo settings('mail.contact_page_address');"

# Blocked upload formats
php artisan tinker --execute="echo \DB::table('settings')->where('name', 'uploads.blocked_extensions')->first()->value;"
```

### Prohibited Content

| Never Use | Why | Instead |
|-----------|-----|---------|
| Internal permission names | Users don't see these | Plain English descriptions |
| Database column names | Technical implementation detail | User-facing descriptions |
| Route paths like `/api/v1/...` | Internal only | "the API" or feature name |
| Code variable names | Not user-facing | Human-readable terms |
| Assumed navigation | Often wrong | Verified exact paths |
| Emoji | Use Mintlify icons | `<Icon icon="check" />` |
| Lucide icon names | Wrong library | Use Font Awesome 6 names (see below) |
| **Code examples** | Technical, for /developers/ | Describe what user does |
| **API endpoints** | Technical, for /developers/ | Link to dev docs |
| **Implementation details** | Technical, for /developers/ | Focus on user actions |

---

## Section 1.5: Icon Library, Links & Accessibility (CRITICAL)

### Icon Library: Font Awesome 6 ONLY

**The BeatPass docs use Font Awesome 6** (`"icons": { "library": "fontawesome" }` in `docs.json`). This is NOT Lucide. Using Lucide icon names will cause icons to silently fail to render.

**BEFORE using any icon**, verify it exists at [fontawesome.com/icons](https://fontawesome.com/icons).

#### Common Lucide → Font Awesome 6 Mistakes

| ❌ Lucide (WRONG) | ✅ Font Awesome 6 (CORRECT) |
|---|---|
| `activity` | `chart-line` |
| `alert-circle` | `circle-exclamation` |
| `alert-triangle` | `triangle-exclamation` |
| `bar-chart` | `chart-bar` |
| `check-circle` | `circle-check` |
| `cloud-upload` | `cloud-arrow-up` |
| `disc` | `compact-disc` |
| `edit` | `pen-to-square` |
| `external-link` | `arrow-up-right-from-square` |
| `eye-off` | `eye-slash` |
| `file-plus` | `file-circle-plus` |
| `file-text` | `file-lines` |
| `help-circle` | `circle-question` |
| `layout-dashboard` | `table-columns` |
| `megaphone` | `bullhorn` |
| `message-square` | `comment` |
| `mic-2` | `microphone` |
| `monitor` | `desktop` |
| `refresh` / `refresh-cw` | `arrows-rotate` |
| `rotate-ccw` | `rotate-left` |
| `scale` | `scale-balanced` |
| `settings` | `gear` |
| `share-2` | `share-nodes` |
| `smartphone` | `mobile-screen-button` |
| `trash-2` | `trash-can` |
| `trending-up` | `arrow-trend-up` |
| `x` | `xmark` |
| `x-circle` | `circle-xmark` |
| `zap` | `bolt` |

#### Validation Rule

> **NEVER use an icon name without verifying it at [fontawesome.com/icons](https://fontawesome.com/icons).** If the icon doesn't exist in FA6, it will render as blank — no error, no warning, just an invisible icon.

### Link Rules

**Internal doc links** — Use root-relative paths:
```text
✅ /help/billing/invoices
✅ /developers/quickstart
❌ ../billing/invoices
❌ https://docs.beatpass.ca/help/billing/invoices
```

**App links (non-doc pages)** — Use full absolute URLs:
```text
✅ https://open.beatpass.ca/login
✅ https://open.beatpass.ca/register
✅ https://open.beatpass.ca/pricing
✅ https://open.beatpass.ca/forgot-password
✅ https://open.beatpass.ca/pages/licensing
❌ /login  (this resolves as a doc path, not an app URL)
❌ /register
❌ /pricing
```

> **Rule**: If the link target is a page inside the Mintlify docs (exists as an `.mdx` file), use a root-relative path. If it's an app page, external site, or non-doc resource, use a full `https://` URL.

**Card `href` validation** — Before using any `href` on a `<Card>` component:
1. If it starts with `/help/` or `/developers/` or `/release-notes/` → verify the `.mdx` file exists on disk AND is listed in `docs.json` navigation
2. If it points to an app page → use `https://open.beatpass.ca/...`
3. If the target file was moved or renamed → update ALL references across the entire docs

### WCAG AA Color Compliance

**All colors in `docs.json` must pass WCAG AA** (minimum 4.5:1 contrast ratio for normal text against their background).

| Color | Minimum Ratio vs White | Minimum Ratio vs Dark (#050505) |
|-------|------------------------|----------------------------------|
| `primary` | **4.5:1** | 3:1 |
| `light` | 3:1 | **4.5:1** |
| `dark` | **4.5:1** | 3:1 |

**Current passing values:**
- Primary: `#187AB4` (4.63:1 vs white ✅)
- Light: `#5BC0F0` (9.94:1 vs dark ✅)
- Dark: `#1F8AC8` (5.36:1 vs dark ✅)

> **Never change the primary color without verifying WCAG AA compliance.** Use a contrast checker like [webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker/).

### Mintlify CLI Known Issues

**`mint broken-links` false positives (v4.2.329):** The CLI only resolves links pointing to `directory/index.mdx` paths. Links to direct `.mdx` files (e.g., `/help/account-settings/account-details`) are reported as broken even when the file exists and is in `docs.json`. Use `mint validate` as the authoritative build check.

---

## Section 2: Writing New Documentation

### When to Create New Docs

- Feature exists but has no documentation
- User confusion reported (support tickets)
- Complex workflow needs explanation
- Gap in current documentation coverage

### The 6-Step Process

#### Step 1: Research

**Questions to answer:**
- What does this feature do?
- Who uses it? (audience)
- How do they access it? (navigation)
- What are prerequisites?
- What are the outcomes?

**Search codebase:**
```bash
# Find UI
grep -r "FeatureName" resources/client/ --include="*.tsx"

# Find backend
grep -r "FeatureName" app/ --include="*.php"

# Find routes
grep -r "feature-route" routes/ --include="*.php"
```

#### Step 2: Verify Everything

- Menu items from database query
- Button text from component files
- Pricing from products/prices tables
- File formats from settings table

#### Step 3: Determine Structure

| Doc Type | Structure |
|----------|-----------|
| **Overview** | What → Why → Who → Where → Related links |
| **How-to** | Prerequisites → Steps → Verification → Troubleshooting |
| **Reference** | Tables, specifications, lists |
| **Tutorial** | Context → Steps → Practice → Next steps |

#### Step 4: Create File

**Naming:**
- lowercase-with-hyphens.mdx
- Descriptive but concise
- Group in subfolders if related

**Location:**
```
Documentation/help/
├── [section]/                    # e.g., billing
│   ├── index.mdx                # Section overview
│   └── specific-topic.mdx       # Individual pages
```

#### Step 5: Write Content

**Frontmatter template:**
```mdx
---
audience: help
title: "Descriptive Page Title"
description: "One-line summary for SEO."
---
```

**Content rules:**
- Introduction: 2-3 sentences
- Prerequisites: Bullet list (if needed)
- Steps: Numbered, exact UI labels in bold
- No technical jargon
- Specific numbers, not vague terms

**Example:**
```mdx
# Managing Your Subscription

Manage your BeatPass subscription, change plans, update payment methods, and view billing history.

## Accessing Billing

Click your **profile avatar** in the top navigation bar, then select **Billing**.

## Changing Your Plan

1. In the **Current plan** section, click **Change plan**.
2. Select your new plan from the options.
3. Click **Confirm change** to apply.

Your new plan takes effect at the start of your next billing cycle.
```

**NOT:**
```mdx
# Subscription Management

We have added a new subscription management interface for users.

Go to Settings → Subscription to manage your plan.

Click the Change Plan button and select a new plan.
```

#### Step 6: Cross-Link

- Link to related documentation
- Update parent index to include new doc
- Link FROM related docs TO this one

### New Documentation Checklist

- [ ] Feature verified to exist
- [ ] Navigation paths verified
- [ ] UI labels exact and bolded
- [ ] No technical jargon
- [ ] Frontmatter complete
- [ ] Root-relative links for internal docs, full URLs for app pages
- [ ] All icon names verified against Font Awesome 6 (NOT Lucide)
- [ ] Related docs cross-linked
- [ ] Parent index updated

**Full guide**: See [New Doc Guide](/help/release-notes/_meta/NEW-DOC-GUIDE)

---

## Section 3: Updating Documentation

### When to Update

- UI text changed (button names, menu items)
- Navigation paths changed
- Pricing or plans changed
- Feature behavior changed
- Error found in current docs
- Feature removed or deprecated

### The Update Process

#### Step 1: Read Current Doc

Identify all claims and instructions that need verification.

#### Step 2: Verify Current State

Run same verification as for new docs:
```bash
# Check if mentioned menu items still exist
php artisan tinker --execute="..."

# Verify pricing if mentioned
php artisan tinker --execute="..."

# Check UI component for button text
cat resources/client/.../component.tsx | grep -i "button"
```

#### Step 3: Identify Changes

Compare doc vs. reality:

| Current Doc Says | Verified Reality | Action |
|------------------|------------------|--------|
| "Settings → Subscription" | "Profile avatar → Billing" | Update navigation |
| "$19/month" | "$29/month" | Update pricing |
| "Cancel Subscription" | "Cancel plan" | Update button text |
| Feature exists | Feature removed | Add deprecation notice |

#### Step 4: Make Minimal Changes

- Change only what's wrong
- Preserve correct content
- Maintain existing tone
- Keep structure if possible

**Example:**
```diff
- Go to **Settings** → **Subscription**.
+ Click your **profile avatar**, then select **Billing**.

- The Classic plan costs $19/month.
+ The Classic plan costs $29/month (CAD).
```

#### Step 5: Check Related Docs

If navigation changed, update ALL docs with that path:
```bash
grep -r "old-navigation-path" Documentation/help/ --include="*.mdx"
```

### Update vs. Rewrite Decision

| Situation | Action |
|-----------|--------|
| Single element changed (button name) | Update |
| Navigation path changed | Update |
| Pricing changed | Update |
| Minor feature changes | Update |
| Major redesign | Rewrite |
| Multiple fundamental errors | Rewrite |
| Feature removed | Update with deprecation notice |

### Update Checklist

- [ ] Current doc fully read
- [ ] All claims verified
- [ ] Outdated content identified
- [ ] Minimal targeted changes made
- [ ] Related docs checked for same errors
- [ ] Tone and style preserved
- [ ] No accidental content deletion

**Full guide**: See [Update Guide](/help/release-notes/_meta/UPDATE-GUIDE)

---

## Section 4: Release Notes

Release notes announce changes to users. They follow a specialized format.

### Quick Reference

| Type | Template | Severity | Icon |
|------|----------|----------|------|
| Feature | template-feature.mdx | minor | star |
| Improvement | template.mdx | patch | bolt |
| Bugfix | template.mdx | patch | wrench |
| Security | template-security.mdx | hotfix | shield |
| Hotfix | template-hotfix.mdx | hotfix | circle-exclamation |
| Major Release | template-major-release.mdx | major | rocket |

### The 7-Step Process

1. **Select template** from `_meta/` based on type
2. **Determine metadata** (audience, tags, components, severity)
3. **Verify feature existence** (search codebase)
4. **Write content** (summary, what's new, why it matters, how to use)
5. **Apply style** (present tense for features, past for fixes, bold UI refs)
6. **Validate** (checklist + Mintlify components)
7. **Place file** (correct year/month folder)

### Release Note Specifics

**Frontmatter:**
```mdx
---
title: "Feature Name"
date: "YYYY-MM-DD"
severity: "minor"  # major, minor, patch, hotfix
audience: "All"    # All, Producers, Admins, Developers
tags: ["feature"]  # From taxonomy
components: ["dashboard"]  # From taxonomy
---
```

**Content sections:**
- **Summary** — 2-3 sentences, lead with benefit
- **What's New** — 3-7 bullets, active voice
- **Why It Matters** — 2-4 bullets, user value
- **How to Use** — Steps if applicable
- **Migration Guide** — If breaking changes

**Key differences from regular docs:**
- Past tense for fixes ("Fixed...", "Resolved...")
- Present tense for features ("Adds...", "Improves...")
- Time-bounded (dated)
- Severity classification
- Audience-specific

### Release Note Checklist

- [ ] Feature existence verified
- [ ] Template selected correctly
- [ ] Frontmatter complete
- [ ] Tags from taxonomy
- [ ] Severity appropriate
- [ ] **Version bump calculated** (see Section 4.5)
- [ ] Summary leads with benefit
- [ ] 3-7 bullets in What's New
- [ ] Past tense for fixes, present for features
- [ ] UI references exact and bold
- [ ] File named correctly: `YYYY-MM-DD-title.mdx`
- [ ] Placed in correct folder: `YYYY/month/`
- [ ] **`.env` APP_VERSION updated** (see Section 4.5)
- [ ] **`package.json` version updated**
- [ ] **`public/version.json` version updated**

**Full guide**: See release note templates in `_meta/` folder

---

## Section 4.5: Version Management (Release Notes Only)

When creating release notes, you MUST also version-bump the BeatPass application following Semantic Versioning (SemVer) standards.

### Single Source of Truth

The app version is stored in **`.env`** as `APP_VERSION`. This is the only runtime source.

```
.env APP_VERSION (single source of truth)
    ↓
common/resources/config/site.php → env('APP_VERSION')
    ↓
BaseBootstrapData.php:76 → $this->data['settings']['version']
    ↓
Admin Panel displays "Version: X.Y.Z"
```

**Important**: The database does NOT store the version (verified: no `settings.version` row exists).

### Semantic Versioning Rules

| Release Type | Severity | Version Change | Example |
|--------------|----------|----------------|---------|
| Bug fix, patch | `patch` | Increment PATCH | `3.0.8` → `3.0.9` |
| New feature (backward compatible) | `minor` | Increment MINOR, reset PATCH | `3.0.8` → `3.1.0` |
| Breaking change, API change | `major` | Increment MAJOR, reset MINOR/PATCH | `3.0.8` → `4.0.0` |
| Security/Hotfix (urgent) | `hotfix` | Increment PATCH | `3.0.8` → `3.0.9` |

### Version Bump Process

When creating a release note:

1. **Read current version** from `.env` file (line with `APP_VERSION=`)
2. **Determine severity** from release note type (see Quick Reference table above)
3. **Calculate new version**:
   - `patch` or `hotfix`: X.Y.Z → X.Y.(Z+1)
   - `minor`: X.Y.Z → X.(Y+1).0
   - `major`: X.Y.Z → (X+1).0.0
4. **Update ALL three files**:

| File | Change |
|------|--------|
| `.env` | `APP_VERSION=3.1.0` |
| `package.json` | `"version": "3.1.0"` (line 4) |
| `public/version.json` | `"version": "3.1.0"` |

5. **Clear config cache**: `php artisan config:clear`

### Frontmatter Integration

Include the new version in release note frontmatter:

```mdx
---
title: "Feature Name"
date: "YYYY-MM-DD"
severity: "minor"        # This determines version bump type
version: "3.1.0"         # New version after this release
audience: "All"
tags: ["feature"]
components: ["dashboard"]
---
```

### Version Bump Checklist

- [ ] Current version verified from `.env` (`APP_VERSION=X.Y.Z`)
- [ ] Severity determined from release note type
- [ ] New version calculated correctly per SemVer rules
- [ ] `.env` updated with new `APP_VERSION`
- [ ] `package.json` updated with matching version
- [ ] `public/version.json` updated with matching version
- [ ] Version bump matches severity in frontmatter
- [ ] For `major` releases: Breaking changes documented
- [ ] For `major` releases: Migration guide included
- [ ] Config cache cleared after `.env` changes

### Common Version Scenarios

**Scenario 1: Bug Fix Release**
```
Current: 3.0.8
Release: Fixed typo in billing email
Severity: patch
New Version: 3.0.9
```

**Scenario 2: New Feature Release**
```
Current: 3.0.8
Release: New analytics dashboard
Severity: minor
New Version: 3.1.0
```

**Scenario 3: Breaking Change Release**
```
Current: 3.1.5
Release: New API authentication (old keys deprecated)
Severity: major
New Version: 4.0.0
```

---

## Section 5: Quality Checklist (All Documentation)

### Pre-Publication Verification

**Content:**
- [ ] All claims verifiable in codebase
- [ ] Feature existence confirmed
- [ ] UI labels exact (verified against components)
- [ ] Navigation paths tested mentally
- [ ] No technical jargon users don't see
- [ ] No hallucinated features

**Writing:**
- [ ] Active voice (present for features, past for fixes)
- [ ] User-focused ("you" not "we")
- [ ] Specific numbers ("95% faster" not "much faster")
- [ ] UI elements in bold: `**Button Name**`
- [ ] Contractions used for approachable tone
- [ ] Paragraphs under 4 lines

**Technical:**
- [ ] Frontmatter complete (audience, title, description)
- [ ] Root-relative links for doc pages: `/help/path`
- [ ] Full URLs for app pages: `https://open.beatpass.ca/...`
- [ ] All icons verified against Font Awesome 6 (not Lucide)
- [ ] Mintlify components used correctly
- [ ] No emoji (use icons)
- [ ] Valid Markdown/MDX syntax
- [ ] Card `href` targets verified (file exists + in docs.json nav)

**Cross-References:**
- [ ] Related docs linked
- [ ] Parent index updated (for new docs)
- [ ] No orphaned pages

### Common Mistakes to Avoid

| Mistake | Example | Fix |
|---------|---------|-----|
| Assumed navigation | "Settings → Subscription" | "Profile avatar → Billing" |
| Wrong button name | "Cancel Subscription" | "Cancel plan" |
| Technical jargon | "`music.create` permission" | "ability to upload tracks" |
| Generic names | "the Cancel button" | "**Cancel plan**" |
| Wrong pricing | "$19/month" | "$29/month" (verify DB) |
| Non-existent features | "Demo downloads" | Remove (doesn't exist) |
| Emoji | 🎉 | Use `<Icon icon="party-horn" />` |
| Relative links | `../billing/` | `/help/billing/` |
| Lucide icon names | `icon="edit"` | `icon="pen-to-square"` (FA6) |
| App URLs as doc paths | `href="/login"` | `href="https://open.beatpass.ca/login"` |
| Deprecated FA names | `icon="bar-chart"` | `icon="chart-bar"` (FA6) |

---

## Section 6: Quick Reference

### File Paths and Commands

**Documentation location:**
```
Documentation/help/[section]/[page].mdx
```

**Verification commands:**
```bash
# Search UI
grep -r "term" resources/client/ --include="*.tsx"

# Search backend
grep -r "term" app/ --include="*.php"

# Query database
php artisan tinker --execute="..."

# Find menu items
php artisan tinker --execute="$menus = json_decode(\DB::table('settings')->where('name', 'menus')->first()->value, true); foreach($menus as $menu) { if (in_array('auth-dropdown', $menu['positions'] ?? [])) { foreach($menu['items'] as $item) { echo $item['label'] . PHP_EOL; } } }"
```

**Related documentation:**
- [Documentation Standards](/help/release-notes/_meta/DOCUMENTATION-STANDARDS) — Universal standards
- [New Doc Guide](/help/release-notes/_meta/NEW-DOC-GUIDE) — Creating new docs
- [Update Guide](/help/release-notes/_meta/UPDATE-GUIDE) — Updating existing docs
- [Mintlify Reference](/help/release-notes/_meta/MINTLIFY-REFERENCE) — Components
- [Verification Standards](/help/release-notes/_meta/VERIFICATION) — Detailed verification

### Emergency Decision Tree

**Not sure if feature exists?**
→ Search codebase → Not found → STOP, flag human

**Not sure about navigation?**
→ Query menu database → Check component → Verify full path

**Not sure about pricing?**
→ Query products table → Query prices table → Use verified values

**Found conflicting information?**
→ Trust UI components over backend config → Query database as tie-breaker

---

<Warning>
  **Critical Reminder**: The most damaging documentation errors come from:
  1. Documenting features that don't exist
  2. Using wrong navigation paths
  3. Trusting config comments without frontend verification
  
  When in doubt, verify. When certain, verify again.
</Warning>

---

## Summary: The AI Agent Documentation Workflow

```text
1. IDENTIFY task type (new / update / release note)
2. VERIFY feature existence (search codebase)
3. VERIFY UI elements (check components, query DB)
4. WRITE using exact labels, no jargon
5. CROSS-LINK to related docs
6. SELF-REVIEW against checklist
7. SUBMIT
```

**Golden Rule**: Every claim must be verifiable. If you can't find it in the codebase, don't document it.
