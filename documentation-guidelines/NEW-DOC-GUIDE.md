---
audience: help
title: "AI Agent Guide: Creating New Documentation"
sidebarTitle: "New Doc Guide"
description: "How to create new BeatPass documentation from scratch with proper research and structure."
---

# AI Agent Guide: Creating New Documentation

**When to create:** Feature gaps, user confusion, missing tutorials, new functionality.

---

## When to Create New Documentation

### Documentation Gaps to Fill

| Gap Type | Example | Priority |
|----------|---------|----------|
| Feature exists but no docs | New playlist feature undocumented | High |
| User confusion reported | Support tickets about same process | High |
| Complex workflow | Multi-step producer onboarding | Medium |
| Reference needed | API endpoint undocumented | Medium |
| Best practices | Optimizing track uploads | Low |

### Before Creating: Check if Doc Already Exists

```bash
# Search existing documentation
grep -r "featureName" Documentation/help/ --include="*.mdx"

# Check if topic is covered in related docs
grep -r "topicKeyword" Documentation/help/[section]/ --include="*.mdx"

# Look for index pages that might cover it
cat Documentation/help/[section]/index.mdx | grep -i "topic"
```

**Don't duplicate:** If topic exists, update existing doc rather than creating new one.

---

## The New Documentation Process

### Step 1: Research and Discovery

#### A. Understand the Feature

**Questions to answer:**
1. What does this feature do?
2. Who is it for? (audience)
3. How do users access it? (navigation)
4. What are the prerequisites?
5. What are the common use cases?
6. What are the limitations or edge cases?

**Research sources:**
```bash
# UI components
grep -r "FeatureName" resources/client/ --include="*.tsx"

# Backend logic
grep -r "FeatureName" app/ --include="*.php"

# Routes
grep -r "feature-route" routes/ --include="*.php"

# Database
grep -r "feature_table" database/migrations/ --include="*.php"
```

#### B. Verify Navigation Paths

**Critical:** Document the actual user journey, not assumed paths.

```bash
# Check menu items
php artisan tinker --execute="$menus = json_decode(\DB::table('settings')->where('name', 'menus')->first()->value, true); foreach($menus as $menu) { if (in_array('auth-dropdown', $menu['positions'] ?? [])) { foreach($menu['items'] as $item) { echo $item['label'] . ' → ' . $item['action'] . PHP_EOL; } } }"

# Check specific UI components
cat resources/client/web-player/[feature]/[component].tsx | grep -E "(button|label|title)"
```

**Trace the full path:**
1. Starting point (e.g., profile menu)
2. Intermediate steps (if any)
3. Final destination
4. Available actions on that page

#### C. Identify Related Documentation

**Find connections:**
```bash
# What docs might link to this?
grep -r "relatedTopic" Documentation/help/ --include="*.mdx" -l

# What will this doc link to?
grep -r "prerequisiteFeature" Documentation/help/ --include="*.mdx" -l
```

**Plan cross-links:**
- Parent/child relationships
- Before/after dependencies
- Related features
- Prerequisite knowledge

### Step 2: Determine Documentation Type

| Type | Purpose | Structure |
|------|---------|-----------|
| **Overview** | Introduce feature area | What, why, who, where |
| **How-to** | Step-by-step guide | Prerequisites, steps, outcomes |
| **Reference** | Technical details | Tables, specifications, lists |
| **Tutorial** | Learn by doing | Context, steps, verification |
| **FAQ** | Common questions | Q&A format |
| **Concept** | Explain ideas | Explanations, analogies |

### Step 3: Choose Location and Filename

#### Folder Structure

```text
Documentation/help/
├── [section]/                    # e.g., billing, account-settings
│   ├── index.mdx                # Section overview
│   └── [specific-topic].mdx     # Individual pages
```

#### Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Overview | `index.mdx` | `billing/index.mdx` |
| How-to | `action-topic.mdx` | `cancelling-subscription.mdx` |
| Reference | `topic-reference.mdx` | `metrics-glossary.mdx` |
| Subtopic | `parent/child.mdx` | `password/changing-password.mdx` |

**Rules:**
- Use lowercase with hyphens
- Be descriptive but concise
- Match URL structure to content hierarchy
- Group related topics in subfolders

### Step 4: Create Frontmatter

**Required fields:**

```mdx
---
audience: help
title: "Descriptive Page Title"
sidebarTitle: "Short Title"          # If different from title
description: "One-line summary for SEO and previews."
---
```

**Audience values:**
- `help` — General user documentation
- `developers` — API/technical docs
- `admins` — Admin panel documentation

**Title guidelines:**
- 40-60 characters ideal
- Include key feature name
- Action-oriented for how-tos
- Descriptive for reference

**Description guidelines:**
- 120-160 characters ideal
- Include key search terms
- Explain what user will learn
- Active voice

### Step 5: Structure Content

#### Standard Page Structure

```mdx
# Page Title

Brief introduction (1-2 sentences explaining what this covers).

## Prerequisites (if any)

- Required plan/permission
- Previous setup needed
- Knowledge requirements

## Main Content Sections

### Section 1: Getting There

Navigation instructions with exact UI labels.

### Section 2: Using the Feature

Step-by-step instructions.

### Section 3: Understanding Results

What to expect, how to verify success.

## Common Issues (optional)

<AccordionGroup>
  <Accordion title="Issue 1">
    Solution...
  </Accordion>
</AccordionGroup>

## Related

- [Related topic](/help/path)
- [Next step](/help/path)
```

#### Content Section Guidelines

| Section | Purpose | Length |
|---------|---------|--------|
| Introduction | Context and preview | 2-3 sentences |
| Prerequisites | What you need first | Bullet list |
| Steps | How to do it | Numbered, 3-7 items |
| Explanation | Why it works | 1-2 short paragraphs |
| Examples | See it in action | 1-2 concrete examples |
| Troubleshooting | Fix problems | Accordion format |
| Related | Where to go next | 3-5 links |

### Step 6: Write Content

#### Use Verified Information Only

**For every claim:**
1. State what you found in codebase
2. Use exact UI labels
3. Provide specific numbers
4. Link to related verified docs

**Example:**
```mdx
To manage your subscription, click your **profile avatar** in the top navigation bar, then select **Billing**. 

The **Current plan** section shows your active subscription. Click **Change plan** to switch plans.
```

NOT:
```mdx
Go to Settings → Subscription to manage your plan.
Click the Change Plan button.
```

#### Cross-Link Strategically

**Link when:**
- Mentioning a related feature
- Referencing a prerequisite
- Suggesting next steps
- Providing alternatives

**Format:**
```mdx
Before continuing, ensure you've [set up your producer profile](/help/producer-program/after-approval).

See also: [Managing your tracks](/help/producer-dashboard/tracks)
```

**Always root-relative:** `/help/path` not `../path`

### Step 7: Add Mintlify Components

#### Approved Components for Documentation

**Use for:**
- **Cards** — Related documentation, feature highlights
- **CardGroup** — Multiple related links
- **Steps** — Numbered instructions
- **Accordion/AccordionGroup** — FAQs, troubleshooting
- **Callouts (Info, Warning, Tip, Note)** — Important notices
- **Tables** — Reference data, comparisons
- **Badges** — Status indicators

**Don't use:**
- Complex code blocks (unless developer docs)
- Videos
- External embeds
- Custom components

#### Component Examples

```mdx
<CardGroup cols={2}>
  <Card title="Setting Up" icon="gear" href="/help/producer-program/after-approval">
    Complete your producer profile setup
  </Card>
  <Card title="Uploading Tracks" icon="cloud-arrow-up" href="/help/producer-dashboard/tracks">
    Learn the track upload process
  </Card>
</CardGroup>

<Steps>
  <Step title="Navigate to Billing">
    Click your **profile avatar**, then select **Billing**.
  </Step>
  <Step title="Select New Plan">
    Click **Change plan**, then choose your new plan.
  </Step>
</Steps>

<Warning>
  Cancelling your plan will remove access to premium features at the end of your billing period.
</Warning>
```

---

## New Documentation Checklist

### Pre-Writing
- [ ] Feature existence verified in codebase
- [ ] Navigation paths verified
- [ ] UI labels confirmed
- [ ] Database values queried (if applicable)
- [ ] Related documentation identified
- [ ] Doc type determined
- [ ] Location and filename chosen

### Writing
- [ ] Frontmatter complete and accurate
- [ ] Introduction explains what doc covers
- [ ] Prerequisites listed (if any)
- [ ] Steps use exact UI labels (bold)
- [ ] Navigation instructions verified
- [ ] No technical jargon users don't see
- [ ] Specific numbers and names used
- [ ] Mintlify components used appropriately

### Post-Writing
- [ ] All claims verifiable
- [ ] Links use root-relative paths
- [ ] Related docs cross-linked
- [ ] Tone appropriate for audience
- [ ] Length appropriate (not too long)
- [ ] Self-review completed
- [ ] Mental walkthrough of steps done

---

## Common New Documentation Mistakes

### ❌ Don't Do This

1. **Documenting non-existent features**
   - Verify feature exists before writing
   - Search codebase thoroughly
   - Query database if needed

2. **Assumed navigation**
   - Never write navigation without verifying
   - Check actual menu items
   - Test the path mentally

3. **Wrong location**
   - Don't create orphan pages
   - Place in logical section
   - Link from parent index

4. **Missing frontmatter**
   - Every doc needs frontmatter
   - Include all required fields
   - Use correct audience value

5. **No cross-links**
   - Link to related docs
   - Link from related docs (update them)
   - Create content web, not islands

6. **Too long**
   - Break into multiple pages if needed
   - Write user-focused content that explains actions and outcomes—not implementation details.

**Content Guidelines:**

| Write This | Not This |
|------------|----------|
| "Click **Upload** to add your track" | "The upload controller handles file processing" |
| "Your payment is processed securely" | "The Stripe webhook processes payment_intent events" |
| "You'll receive a confirmation email" | "The notification service queues the email job" |
| "Your profile is updated instantly" | "The database transaction commits the changes" |

**Release Notes Must Be:**
- Benefits-focused (what users gain)
- Action-oriented (what users can do)
- Free of technical implementation details
- Easy to scan and understand

**Example Release Note:**
```mdx
✅ Correct:
## Instant Playlist Collaboration

You can now invite other producers to collaborate on your playlists 
in real-time. Perfect for joint projects, compilations, or curated 
collections.

**What's New:**
- **Invite collaborators** — Add producers to your playlists
- **Real-time sync** — Changes appear instantly for all collaborators  
- **Permission controls** — Set who can edit or view

❌ Wrong:
## Playlist Collaboration API

We've implemented the playlist collaboration feature using WebSocket 
connections and role-based access control through the `playlist_collaborator` 
table.

**Technical Details:**
- WebSocket server handles real-time updates
- RBAC system manages permissions  
- New database schema for storing collaborators
```

7. **Wrong tone**
   - Match existing docs in section
   - User-focused, not technical
   - Active voice

8. **Incomplete information**
   - Cover the full user journey
   - Include edge cases if relevant
   - Add troubleshooting if common issues exist

---

## Template: New How-To Document

```mdx
---
audience: help
title: "How to [Do Something]"
description: "Step-by-step guide to [achieve result] on BeatPass."
---

# How to [Do Something]

[Brief introduction: what this accomplishes and who it's for.]

## Prerequisites

- [Requirement 1]
- [Requirement 2]

## Instructions

### Step 1: [Navigate to Location]

[Exact navigation with bold UI labels]

### Step 2: [Take Action]

[What to click/do with exact labels]

### Step 3: [Verify Result]

[What success looks like]

## Troubleshooting

<AccordionGroup>
  <Accordion title="[Common Issue 1]">
    [Solution]
  </Accordion>
  <Accordion title="[Common Issue 2]">
    [Solution]
  </Accordion>
</AccordionGroup>

## Related

- [Related topic](/help/path)
- [Next step](/help/path)
```

---

## Template: New Overview Document

```mdx
---
audience: help
title: "[Feature Area] Overview"
description: "Learn about [feature area] and how it helps you [benefit]."
---

# [Feature Area] Overview

[What this feature area does and why it matters.]

## What You Can Do

<CardGroup cols={2}>
  <Card title="[Action 1]" icon="[icon]" href="/help/path">
    [Brief description]
  </Card>
  <Card title="[Action 2]" icon="[icon]" href="/help/path">
    [Brief description]
  </Card>
</CardGroup>

## Key Concepts

- **[Concept 1]**: [Explanation]
- **[Concept 2]**: [Explanation]

## Getting Started

[Link to first how-to or tutorial]

## Learn More

- [Subtopic 1](/help/path)
- [Subtopic 2](/help/path)
```

---

## Quick Reference: File Placement

| If documenting... | Place in... | Example filename |
|-------------------|-------------|------------------|
| Account settings feature | `account-settings/` | `two-factor-authentication.mdx` |
| Billing functionality | `billing/` | `managing-subscription/upgrading-plan.mdx` |
| Producer tools | `producer-dashboard/` | `tracks.mdx` |
| Release information | `release-notes/` | `2026/january/2026-01-15-feature.mdx` |
| Help overview | `help/` root | `index.mdx` |

---

<Info>
  **Remember**: Good documentation fills a gap users actually have. 
  Research first, write second, verify always.
</Info>

---

## Related Resources

- [Documentation Standards](/help/release-notes/_meta/DOCUMENTATION-STANDARDS) — Universal standards
- [Update Guide](/help/release-notes/_meta/UPDATE-GUIDE) — Updating existing docs
- [AI Agent Guide](/help/release-notes/_meta/AI-AGENT-GUIDE) — Main entry point
- [Verification Standards](/help/release-notes/_meta/VERIFICATION) — Detailed verification
- [Mintlify Reference](/help/release-notes/_meta/MINTLIFY-REFERENCE) — Component usage
