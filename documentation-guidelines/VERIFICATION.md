---
audience: help
title: "Verification Standards for Release Notes"
sidebarTitle: "Verification Standards"
description: "Mandatory verification steps to ensure accurate, factual release notes."
---

# Verification Standards for Release Notes

**CRITICAL: Never document a feature without verifying it exists.**

This guide ensures all release notes are factually accurate and based on verified codebase information—not assumptions.

---

## Core Verification Principles

1. **Verify existence first** — Search codebase to confirm feature exists before documenting
2. **Never assume** — Always verify before writing
3. **Never hallucinate** — If you can't verify it, don't document it
4. **Be specific** — Use exact UI labels, button text, and navigation paths
5. **Stay current** — Database configurations can change; always verify current values

---

## Pre-Documentation Checklist

Before writing ANY release note, complete these verification steps:

### 1. Feature Existence Verification

**NEVER document a feature without verifying it exists in the codebase.**

#### Search Commands

```bash
# Search for UI components
grep -r "featureName" resources/client/

# Search for backend logic
grep -r "featureName" app/

# Search for routes
grep -r "featureName" routes/
```

#### What to Verify

- [ ] UI components implementing the feature exist
- [ ] Backend controllers/services powering it exist
- [ ] Database tables/columns for data storage exist
- [ ] Routes exposing the feature exist

#### If Not Found

**If you cannot find:**
- No UI components implementing it
- No backend controllers handling it
- No database tables storing it
- No routes exposing it

**Then the feature DOES NOT EXIST.** Do not document it based on assumptions about what "should" exist.

---

### 2. UI Navigation & Labels Verification

**Source**: Frontend codebase (`resources/client/`, `common/resources/client/`)

#### Key Files to Check

```
# Navigation & Menus
common/resources/client/ui/navigation/navbar/navbar-auth-menu.tsx
common/resources/client/auth/auth-routes.tsx

# Account Settings
common/resources/client/auth/ui/account-settings/account-settings-sidenav.tsx

# Billing
common/resources/client/billing/billing-page/
```

#### Verified UI Elements Reference

**Profile Menu (Auth Dropdown)**

| Menu Item | Route | Notes |
|-----------|-------|-------|
| **Edit Profile** | `/account-settings` | Main account settings |
| **Management** | `/admin` | Requires admin permission |
| **Backstage** | `/producer-dashboard` | Requires producer status |
| **Billing** | `/billing` | Always visible |

**Account Settings Page**

| Sidenav Label | Panel Title | Key Buttons |
|---------------|-------------|-------------|
| Account details | (varies) | **Save** |
| Social login | (varies) | **Connect**, **Disconnect** |
| Password | Update password | **Update password** |
| Two factor authentication | Two factor authentication | **Enable**, **Disable** |
| Active sessions | Active sessions | **Logout other sessions** |
| Location and language | (varies) | **Save** |
| Developers | (varies) | **Create**, **Delete** |
| Delete account | Danger zone | **Delete account** |

⚠️ **Critical differences**:
- Sidenav says "Delete account" but panel title is "Danger zone"
- Sidenav says "Password" but panel title is "Update password"

**Billing Page**

| Section | Elements |
|---------|----------|
| **Current plan** (Active) | Plan name, price, "Renews on [date]", **Change plan**, **Cancel plan** |
| **Current plan** (Cancelled) | Plan name, "Access ends [date]", **Renew plan** |
| **Scheduled Plan Change** | Pending plan name, "Takes effect on [date]", **Cancel scheduled change** |
| **Payment method** | Card brand, last 4 digits, expiration, **Update** |
| **Payment history** | Invoice list with date, amount, status |

---

### 3. Database Verification Commands

#### Contact & Company

```bash
# Contact email
php artisan tinker --execute="echo settings('mail.contact_page_address');"
```

**Current**: `contact@beatpass.ca`

#### Subscription Plans

```bash
# Products (plans)
php artisan tinker --execute="echo json_encode(\DB::table('products')->select('id', 'name', 'free')->get()->toArray(), JSON_PRETTY_PRINT);"

# Prices (billing intervals)
php artisan tinker --execute="echo json_encode(\DB::table('prices')->select('id', 'product_id', 'amount', 'currency', 'interval', 'interval_count')->get()->toArray(), JSON_PRETTY_PRINT);"
```

**Current verified plans**:
| Plan | Price | Interval |
|------|-------|----------|
| Explorer | Free | - |
| Classic | $29 CAD | Monthly |
| Plus | $45 CAD | Monthly |
| Pro | $59 CAD | Monthly |

⚠️ **Important**: No yearly plans exist. Do not document yearly billing.

#### Profile Menu Items

```bash
# Get auth dropdown menu items
php artisan tinker --execute="$menus = json_decode(\DB::table('settings')->where('name', 'menus')->first()->value, true); foreach($menus as $menu) { if (in_array('auth-dropdown', $menu['positions'] ?? [])) { foreach($menu['items'] as $item) { echo $item['label'] . ' → ' . $item['action'] . PHP_EOL; } } }"
```

---

## Writing Standards

### Language & Tone

- **Non-technical** — Write for users, not developers
- **Clear** — Use simple, direct language
- **Actionable** — Guide users step-by-step
- **Accurate** — Every claim must be verifiable

### Avoiding Technical Jargon

**NEVER include internal system terminology:**

| Avoid (Technical) | Use Instead (User-Friendly) |
|-------------------|-----------------------------|
| `music.create` permission | Ability to upload tracks |
| `admin.access` permission | Admin access |
| Database column names | Plain English description |
| Internal IDs or slugs | Feature names |
| Code variables | Human-readable labels |
| Route paths like `/api/v1/...` | "the API" or feature name |
| Model names (e.g., `Artist`, `Track`) | "producer profile", "beat" |

**Rule**: If a user cannot see or interact with the term in the UI, do not include it in documentation.

### UI References

Always use exact labels:

| Element Type | How to Reference |
|--------------|------------------|
| Buttons | Bold: `**Change plan**` |
| Menu items | Bold: `**Billing**` |
| Sections | Bold: `**Current plan**` section |

### Navigation Format

```
Click your **profile avatar** in the top navigation bar, then select **Billing** from the menu.
```

NOT:
```
Go to Settings → Subscription
```

---

## Common Mistakes to Avoid

### ❌ Don't Do This

0. **Document features that don't exist**
   - Wrong: Creating docs for "demo downloads", "watermarked previews"
   - Fix: Search codebase FIRST

1. **Trust backend config without verifying frontend**
   - Wrong: "Legendary achievements don't exist" (config says rarity 5)
   - Fix: Check frontend code for actual display mapping

2. **Assume navigation paths**
   - Wrong: "Go to Settings → Subscription"
   - Fix: Verify actual menu structure

3. **Invent menu item names**
   - Wrong: "Select **Settings** from the menu"
   - Fix: Check database for actual labels

4. **Use generic section names**
   - Wrong: "the Localization section"
   - Fix: Use exact labels: "Location and language"

5. **Confuse sidenav with panel titles**
   - Wrong: "the Delete Account section"
   - Fix: Panel is "Danger zone"

6. **Use inconsistent capitalization**
   - Wrong: "This Device", "Log Out Other Devices"
   - Fix: "This device", "Logout other sessions"

7. **Document features without verification**
   - Wrong: "Select monthly or yearly billing"
   - Fix: Query database to confirm intervals

8. **Use generic button names**
   - Wrong: "Click the Cancel button"
   - Fix: "Click **Cancel plan**"

9. **Use technical terminology**
   - Wrong: "You need the `music.create` permission"
   - Fix: "You need the ability to upload tracks"

---

## Release Note Specific Requirements

### What to Verify for Release Notes

1. **Feature actually shipped**
   - Check deployment status
   - Verify in production environment
   - Confirm no feature flags blocking it

2. **User-facing changes only**
   - Internal refactoring = no release note
   - Database schema changes = no release note (unless affects users)
   - Backend optimization = no release note (unless improves UX)

3. **Accurate impact description**
   - Don't claim "all users" if it's producer-only
   - Don't claim "major improvement" for minor bug fix
   - Use severity levels appropriately

4. **Correct navigation for new features**
   - Actually navigate to the feature in UI
   - Document the exact path found
   - Verify buttons/controls exist

### Post-Release Verification

After publishing a release note:

1. **Verify links work** — Click all internal links
2. **Check rendering** — Preview in Mintlify
3. **Confirm placement** — File in correct folder
4. **Validate indices** — Month/year indexes updated

---

## Verification Checklist Template

Before submitting any release note:

### Feature Existence
- [ ] Searched codebase for feature
- [ ] Found UI components
- [ ] Found backend logic
- [ ] Confirmed routes exist
- [ ] Feature is actually deployed

### Navigation Accuracy
- [ ] Checked actual menu structure
- [ ] Used exact UI labels
- [ ] Verified button text
- [ ] Tested navigation path

### Content Quality
- [ ] No internal jargon
- [ ] No technical terminology users don't see
- [ ] All UI references use exact labels
- [ ] Bold formatting for buttons/menus
- [ ] Numbers/metrics verified

### Database Verification (if applicable)
- [ ] Queried products/plans for billing mentions
- [ ] Queried settings for configuration claims
- [ ] Verified pricing is current
- [ ] Checked for trials (none exist)

### Mintlify Formatting
- [ ] Frontmatter valid YAML
- [ ] Tags from taxonomy only
- [ ] Components from approved list
- [ ] **All icon names verified against Font Awesome 6** (not Lucide — see Section below)
- [ ] No emoji used
- [ ] Internal doc links use root-relative paths (`/help/...`)
- [ ] App page links use full URLs (`https://open.beatpass.ca/...`)
- [ ] All Card `href` targets verified (`.mdx` file exists + listed in `docs.json`)

---

## Icon Verification (Font Awesome 6)

**The BeatPass docs use Font Awesome 6** (`"icons": { "library": "fontawesome" }` in `docs.json`). Using Lucide or other icon library names will cause icons to **silently fail** — no error, no warning, just a blank space where the icon should be.

### Before Using Any Icon

1. **Verify** the icon name exists at [fontawesome.com/icons](https://fontawesome.com/icons)
2. **Check** it's not a Lucide name (common mistake — see table below)
3. **Check** it's not a deprecated FA4/FA5 alias

### Common Invalid Icons That Cause Silent Failures

| ❌ Invalid (Lucide/deprecated) | ✅ Valid (FA6) | Notes |
|---|---|---|
| `scale` | `scale-balanced` | Legal icons — caused blank sidebar icon |
| `bar-chart` | `chart-bar` | FA4 alias removed in FA6 |
| `cloud-upload` | `cloud-arrow-up` | Lucide name |
| `message-square` | `comment` | Lucide name |
| `alert-triangle` | `triangle-exclamation` | Lucide name |
| `edit` | `pen-to-square` | Lucide name |
| `settings` | `gear` | Lucide name |
| `monitor` | `desktop` | Lucide name |
| `disc` | `compact-disc` | Lucide name |
| `zap` | `bolt` | Lucide name |
| `trash-2` | `trash-can` | Lucide name |
| `file-text` | `file-lines` | Lucide name |
| `mic-2` | `microphone` | Lucide name |

For the complete mapping, see the [AI Agent Guide](/help/release-notes/_meta/AI-AGENT-GUIDE#section-15-icon-library-links--accessibility-critical).

### Batch Verification Command

To check all icons across the docs for invalid names:

```bash
# Extract all unique icon names from MDX files and docs.json
grep -roh 'icon="[^"]*"' --include="*.mdx" --include="*.json" | sort -u

# Then verify each name at fontawesome.com/icons
```

---

## Link Verification

### Internal Doc Links

For every link starting with `/help/`, `/developers/`, or `/release-notes/`:
1. Verify the corresponding `.mdx` file exists on disk
2. Verify the page is listed in `docs.json` navigation
3. If the file was renamed or moved, search for and update ALL references

### App Page Links

These URLs are **NOT** doc pages and must use full absolute URLs:

| App Page | Full URL |
|----------|----------|
| Login | `https://open.beatpass.ca/login` |
| Register | `https://open.beatpass.ca/register` |
| Pricing | `https://open.beatpass.ca/pricing` |
| Forgot Password | `https://open.beatpass.ca/forgot-password` |
| Contact | `https://open.beatpass.ca/contact` |
| Licensing | `https://open.beatpass.ca/pages/licensing` |
| Terms of Service | `https://open.beatpass.ca/pages/terms-of-service` |
| DMCA | `https://open.beatpass.ca/pages/dmca` |

> **Never use bare paths like `/login` or `/pricing`** — Mintlify will try to resolve these as doc pages and they will 404.

### Card `href` Verification

For every `<Card>` component with an `href`:
- [ ] If internal doc path → `.mdx` file exists
- [ ] If internal doc path → page is in `docs.json` nav
- [ ] If app page → uses `https://open.beatpass.ca/...`
- [ ] If external → URL is valid and accessible

---

## WCAG AA Color Verification

When modifying colors in `docs.json`, verify contrast ratios:

| Color | Must Pass Against | Minimum Ratio |
|-------|-------------------|---------------|
| `primary` | White (#FFFFFF) | 4.5:1 |
| `light` | Dark bg (#050505) | 4.5:1 |
| `dark` | Dark bg (#050505) | 3:1 |

**Verification tool**: [webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker/)

**CLI check**: `mint a11y` (exit code 0 = pass, 1 = fail)

**Current passing palette:**
- Primary: `#187AB4` (4.63:1 ✅)
- Light: `#5BC0F0` (9.94:1 ✅)
- Dark: `#1F8AC8` (5.36:1 ✅)

---

## Mintlify CLI Known Issues

**`mint broken-links` (v4.2.329)**: Reports false positives for all internal links to direct `.mdx` files. Only links to `directory/index.mdx` paths are resolved correctly. **Use `mint validate` as the authoritative build check** — if it passes, the links are valid.

---

## Quick Verification Commands

```bash
# Search for a feature in UI
grep -r "featureName" resources/client/ --include="*.tsx"

# Search for backend controller
grep -r "featureName" app/Http/Controllers/ --include="*.php"

# Check database for settings
php artisan tinker --execute="echo settings('setting.key');"

# List menu items
php artisan tinker --execute="$menus = json_decode(\DB::table('settings')->where('name', 'menus')->first()->value, true); foreach($menus as $menu) { if (in_array('auth-dropdown', $menu['positions'] ?? [])) { foreach($menu['items'] as $item) { echo $item['label'] . PHP_EOL; } } }"

# Check plans
php artisan tinker --execute="echo json_encode(\DB::table('products')->get(['name', 'free'])->toArray());"
```

---

## AI Agent Verification Protocol

When generating release notes, AI agents MUST:

1. **State what was verified** — List the files/commands checked
2. **Note assumptions** — Clearly mark anything not verified
3. **Use verified data only** — No placeholder text for unverified elements
4. **Flag for review** — Mark sections needing human verification

### Example Verification Statement

```
VERIFIED:
- Feature exists in: resources/client/web-player/backstage/new-feature.tsx
- Backend controller: app/Http/Controllers/NewFeatureController.php
- Database table: new_features (columns: id, user_id, setting)
- Menu item: "New Feature" in auth-dropdown (verified via DB query)

ASSUMED (needs verification):
- Exact button text in modal (could not locate component)
- Performance improvement percentage (from PR description, not benchmarked)
```

---

<Warning>
  Failure to verify before documenting can lead to:
  - **Invisible icons** — Using Lucide names with FA6 library causes blank icons with no error
  - **Broken links** — Using `/login` instead of `https://open.beatpass.ca/login` causes 404s
  - **WCAG failures** — Changing colors without contrast checking fails accessibility audits
  - **User confusion** — Documenting features that don't exist
  - **Support ticket overload** — Wrong navigation paths or button names
  
  Always verify icons, links, colors, AND content. Always.
</Warning>
