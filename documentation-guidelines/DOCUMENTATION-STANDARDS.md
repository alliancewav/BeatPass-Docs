---
audience: help
title: "AI Agent Documentation Standards"
sidebarTitle: "Universal Standards"
description: "Core standards and verification requirements for ALL BeatPass documentation."
---

# AI Agent Documentation Standards

**Applies to: New documentation, updates, and release notes.**

These standards ensure all BeatPass documentation is factual, accurate, and based on verified information—not assumptions.

---

## Core Principles

1. **Verify existence first** — Search codebase to confirm feature exists before documenting
2. **Never assume** — Always verify before writing
3. **Never hallucinate** — If you can't verify it, don't document it
4. **Be specific** — Use exact UI labels, button text, and navigation paths
5. **Stay current** — Database configurations change; always verify current values
6. **Stay non-technical** — Help docs are for users, not developers
7. **Font Awesome 6 icons only** — The icon library is `fontawesome`. Never use Lucide names.
8. **WCAG AA colors** — All theme colors must pass 4.5:1 contrast ratio minimum.

### Audience & Location Rules

**CRITICAL DISTINCTION:**

| Location | Audience | Content Type |
|----------|----------|--------------|
| `Documentation/help/` | End users | Non-technical, user actions |
| `Documentation/developers/` | Developers | Technical, code, API details |
| `Documentation/help/release-notes/` | End users | Non-technical, benefits |

**Documentation/help/ requirements:**
- NO code examples
- NO API endpoints
- NO database references
- NO technical architecture
- YES user actions
- YES plain English
- YES benefits and outcomes

**When technical details are needed:**
- Reference `/developers/` docs: "See [API Docs](/developers/api) for technical details"
- Keep main content focused on what users do, not how it works

---

## Universal Pre-Documentation Checklist

### Step 1: Feature Existence Verification

**NEVER document a feature without verifying it exists in the codebase.**

#### Required Searches

```bash
# Search for UI components
grep -r "featureName" resources/client/ --include="*.tsx" --include="*.ts"

# Search for backend logic
grep -r "featureName" app/ --include="*.php"

# Search for routes
grep -r "featureName" routes/ --include="*.php"

# Search for database migrations
grep -r "featureName" database/migrations/ --include="*.php"
```

#### What to Verify

- [ ] UI components implementing the feature exist
- [ ] Backend controllers/services powering it exist
- [ ] Database tables/columns for data storage exist
- [ ] Routes exposing the feature exist

**If you cannot find:**
- No UI components implementing it
- No backend controllers handling it
- No database tables storing it
- No routes exposing it

**Then the feature DOES NOT EXIST.** Do not document it based on assumptions.

---

### Step 2: UI Navigation & Labels Verification

**Source**: Frontend codebase (`resources/client/`, `common/resources/client/`)

#### Key Files to Check

| Feature Area | Key Files |
|--------------|-----------|
| Navigation | `common/resources/client/ui/navigation/navbar/navbar-auth-menu.tsx` |
| Account Settings | `common/resources/client/auth/ui/account-settings/account-settings-sidenav.tsx` |
| Billing | `common/resources/client/billing/billing-page/panels/*.tsx` |
| Producer Dashboard | `resources/client/web-player/backstage/*.tsx` |

#### Verification Commands

```bash
# Get profile dropdown menu items (auth-dropdown)
php artisan tinker --execute="$menus = json_decode(\DB::table('settings')->where('name', 'menus')->first()->value, true); foreach($menus as $menu) { if (in_array('auth-dropdown', $menu['positions'] ?? [])) { foreach($menu['items'] as $item) { echo $item['label'] . ' → ' . $item['action'] . PHP_EOL; } } }"

# List all menu positions
php artisan tinker --execute="$menus = json_decode(\DB::table('settings')->where('name', 'menus')->first()->value, true); foreach($menus as $m) { echo $m['name'] . ': ' . implode(', ', $m['positions'] ?? []) . PHP_EOL; }"
```

#### Verified UI Elements Reference

**Profile Menu (Auth Dropdown)**

| Menu Item | Route | Notes |
|-----------|-------|-------|
| **Edit Profile** | `/account-settings` | Main account settings |
| **Management** | `/admin` | Requires admin permission |
| **Backstage** | `/producer-dashboard` | Requires producer status |
| **Billing** | `/billing` | Always visible (hardcoded) |

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

⚠️ **Critical**: Sidenav labels differ from panel titles. Use sidenav labels when directing users to scroll, panel titles when describing the section.

**Billing Page**

| Section | Elements |
|---------|----------|
| **Current plan** (Active) | Plan name, price, "Renews on [date]", **Change plan**, **Cancel plan** |
| **Current plan** (Cancelled) | Plan name, "Access ends [date]", **Renew plan** |
| **Scheduled Plan Change** | Pending plan, "Takes effect on [date]", **Cancel scheduled change** |
| **Payment method** | Card brand, last 4 digits, expiration, **Update** |
| **Payment history** | Invoice list with date, amount, status |

---

### Step 3: Database Configuration Verification

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

#### Upload Formats

```bash
# Blocked extensions
php artisan tinker --execute="echo \DB::table('settings')->where('name', 'uploads.blocked_extensions')->first()->value;"

# Allowed extensions
php artisan tinker --execute="echo \DB::table('settings')->where('name', 'uploads.allowed_extensions')->first()->value;"
```

**Current**: MP3 and ZIP are blocked. Only WAV, FLAC, AIFF are accepted for uploads.

#### Revenue Model

```bash
# Check payout configuration
php artisan tinker --execute="echo json_encode(config('beatpass.payouts'), JSON_PRETTY_PRINT);"
```

**Current**: Producers keep 100% of their set price. 12% + $3 CAD flat fee is added ON TOP for buyers.

---

## Writing Standards (All Documentation)

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

**Additional rule for `/help/` documentation:**
If it's technical enough for developers, it belongs in `/developers/` — not in `/help/`.

| Use in /help/ | Move to /developers/ |
|---------------|----------------------|
| "Your payment is processed" | Implementation details |
| "Upload your track" | Code examples |
| "Click **Billing**" | API endpoint paths |
| "You'll receive an email" | Database schemas |
| "See [API docs](/developers/)" | Technical architecture |

### UI References

Always use exact labels:

| Element Type | How to Reference |
|--------------|------------------|
| Buttons | Bold: `**Change plan**` |
| Menu items | Bold: `**Billing**` |
| Sections | Bold: `**Current plan**` section |
| Page names | Title case: `Billing page` |

### Navigation Format

```text
Click your **profile avatar** in the top navigation bar, then select **Billing** from the menu.
```

NOT:
```text
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
   - Wrong: "the Delete Account section" (panel is "Danger zone")
   - Fix: Read both sidenav and panel component files

6. **Use inconsistent capitalization**
   - Wrong: "This Device", "Log Out Other Devices"
   - Fix: "This device", "Logout other sessions"

7. **Document features without verification**
   - Wrong: "Select monthly or yearly billing"
   - Fix: Query database to confirm intervals

8. **Use generic button names**
   - Wrong: "Click the Cancel button"
   - Fix: Use exact text: "Click **Cancel plan**"

9. **Use technical terminology**
   - Wrong: "You need the `music.create` permission"
   - Fix: "You need the ability to upload tracks"

---

## Universal Quality Checklist

Before submitting ANY documentation:

### Content Verification
- [ ] Feature existence verified via codebase search
- [ ] UI elements verified in actual components
- [ ] Database values verified via queries (if applicable)
- [ ] Navigation paths verified
- [ ] No hallucinated features
- [ ] No assumed navigation
- [ ] No invented labels

### Writing Quality
- [ ] All claims verifiable
- [ ] No technical jargon users don't see
- [ ] Exact UI labels used and bolded
- [ ] User-focused language ("you", not "we")
- [ ] Active voice (present tense for features, past for fixes)
- [ ] Specific numbers instead of vague terms

### Technical Requirements
- [ ] Frontmatter complete with all required fields
- [ ] Internal doc links use root-relative paths (`/help/path` not `../path`)
- [ ] App page links use full URLs (`https://open.beatpass.ca/login` not `/login`)
- [ ] **All icon names verified against Font Awesome 6** (not Lucide)
- [ ] All Card `href` targets verified (`.mdx` file exists + in `docs.json` nav)
- [ ] Mintlify components used correctly
- [ ] No emoji (use Mintlify icons only)
- [ ] Proper Markdown/MDX syntax
- [ ] If colors changed in `docs.json`: WCAG AA verified via `mint a11y`

### Cross-References
- [ ] Related documentation linked
- [ ] Parent/child pages connected
- [ ] No orphaned content

---

## Documentation Folder Structure

```text
Documentation/help/
├── index.mdx                    # Main help landing
├── account-settings/
│   ├── index.mdx                # Overview
│   └── [specific-pages].mdx
├── billing/
│   ├── index.mdx
│   └── [specific-pages].mdx
├── producer-dashboard/
│   ├── index.mdx
│   └── [specific-pages].mdx
├── [other-sections]/
└── release-notes/
    ├── _meta/                   # Documentation system
    ├── _archive/
    ├── YYYY/
    └── index.mdx
```

---

## Quick Verification Commands

```bash
# Search for a feature in UI
grep -r "featureName" resources/client/ --include="*.tsx"

# Search for backend controller
grep -r "featureName" app/Http/Controllers/ --include="*.php"

# Check database for settings
php artisan tinker --execute="echo settings('setting.key');"

# Get menu items
php artisan tinker --execute="$menus = json_decode(\DB::table('settings')->where('name', 'menus')->first()->value, true); foreach($menus as $menu) { if (in_array('auth-dropdown', $menu['positions'] ?? [])) { foreach($menu['items'] as $item) { echo $item['label'] . PHP_EOL; } } }"

# Check plans
php artisan tinker --execute="echo json_encode(\DB::table('products')->get(['name', 'free'])->toArray());"
```

---

<Warning>
  **Critical Reminder**: The most damaging documentation errors come from:
  1. Documenting features that don't exist
  2. Using wrong navigation paths
  3. Trusting backend config without frontend verification
  4. **Using Lucide icon names instead of Font Awesome 6** — icons silently fail to render
  5. **Using bare app paths (`/login`) instead of full URLs** — resolves as doc paths and 404s
  6. **Changing theme colors without WCAG AA verification** — fails accessibility audits
  
  Always verify icons, links, colors, AND content. Always.
</Warning>

---

## Related Resources

- [AI Agent Guide](/help/release-notes/_meta/AI-AGENT-GUIDE) — Main entry point
- [Update Guide](/help/release-notes/_meta/UPDATE-GUIDE) — Updating existing docs
- [New Doc Guide](/help/release-notes/_meta/NEW-DOC-GUIDE) — Creating new docs
- [Mintlify Reference](/help/release-notes/_meta/MINTLIFY-REFERENCE) — Component usage
- [Verification Standards](/help/release-notes/_meta/VERIFICATION) — Detailed verification
