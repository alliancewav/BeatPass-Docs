---
audience: help
title: "Writing Style Guide"
sidebarTitle: "Style Guide"
description: "Writing standards and style rules for release notes."
---

# Release Notes Style Guide

Writing standards to ensure consistency, clarity, and user-focus across all release notes.

---

## Voice & Tone

### Voice Characteristics

| Trait | Application |
|-------|-------------|
| **Clear** | Simple words, short sentences |
| **Direct** | Get to the point immediately |
| **Helpful** | Focus on user benefit, not features |
| **Confident** | State facts without hedging |
| **Approachable** | Professional but not stiff |

### Tone Guidelines

**Do:**
- Use contractions ("you'll", "can't", "don't")
- Address the reader as "you"
- Lead with benefits
- Be specific and concrete

**Don't:**
- Use "we" or "our" (company-focused)
- Hedge with "hopefully", "should", "might"
- Use passive voice
- Include internal jokes or references

---

## Verb Tense

### Present Tense (Active)

Use for new features and current capabilities:

- ✅ "Adds playlist collaboration"
- ✅ "Improves dashboard loading speed"
- ✅ "Introduces new upload flow"

### Past Tense

Use for bug fixes and resolved issues:

- ✅ "Fixed login timeout error"
- ✅ "Resolved mobile player crash"
- ✅ "Corrected billing calculation"

### Present Perfect (Sparingly)

Use for cumulative changes:

- ✅ "Has streamlined the approval process"
- ⚠️ Use sparingly—prefer simple present or past

---

## Sentence Structure

### Length

- Keep sentences under 25 words
- Break long sentences into bullets
- One idea per sentence

### Examples

❌ **Too long:**
"We've updated the producer dashboard to include new analytics features that help you track your performance and understand your audience better with detailed metrics."

✅ **Better:**
"New analytics in your producer dashboard. Track performance metrics and understand your audience."

### Bullet Points

**Format:**
- Lead with outcome/benefit
- Keep to one line when possible
- Use parallel structure

**Examples:**

❌ **Inconsistent:**
- Upload speed is faster
- We've improved the player
- Bug with login is fixed

✅ **Parallel:**
- **Faster uploads** — Process tracks 50% quicker
- **Improved player** — Smoother playback on mobile
- **Fixed login bug** — No more timeout errors

---

## Word Choice

### Preferred Terms

| Use This | Not This |
|----------|----------|
| you | we, our, us |
| your profile | your account |
| **Billing** | Settings → Subscription |
| **profile avatar** | user menu |
| track | song (use "track" for beats) |
| beat | song (for producer content) |
| producer | artist (when referring to uploaders) |
| artist | listener (when referring to consumers) |

### Numbers

- Write 1-9 as words: "three new features"
- Write 10+ as numerals: "12% faster"
- Always use numerals for percentages, prices, dates
- Use "95%" not "ninety-five percent"

### Time References

- "now" for immediate availability
- "today" for day of release
- "this week" for rolling releases
- Avoid "soon", "eventually", "coming soon"

---

## UI References

### Formatting

**Bold** all UI elements:

- **Button text** — `**Save Changes**`
- **Menu items** — `**Billing**`
- **Page names** — `**Producer Dashboard**`
- **Section headers** — `**Current Plan**`
- **Navigation paths** — `**profile avatar** → **Billing**`

### Navigation Patterns

Always use the exact UI labels:

✅ **Correct:**
"Click your **profile avatar** in the top navigation, then select **Billing**."

❌ **Incorrect:**
"Go to Settings → Subscription"

### Examples

| Element | Correct Reference |
|---------|-------------------|
| User menu | **profile avatar** |
| Billing page | **Billing** |
| Dashboard | **Producer Dashboard** |
| Upload button | **Upload** button |
| Plan change button | **Change plan** |

---

## Prohibited Content

### Never Include

1. **Internal terminology**
   - ❌ "music.create permission"
   - ✅ "ability to upload tracks"

2. **Code or technical details**
   - ❌ "Fixed null pointer in TrackController"
   - ✅ "Fixed crash when saving tracks"

3. **Database/technical terms**
   - ❌ "Added migration for user_settings"
   - ✅ "New settings available in your profile"

4. **Internal IDs or slugs**
   - ❌ "Updated notif_id: beat_request_match"
   - ✅ "Updated beat request notifications"

5. **API endpoints**
   - ❌ "POST /api/v2/tracks now supports..."
   - ✅ "Track uploads now support..."

6. **Git references**
   - ❌ "PR #1234 merged"
   - ✅ "New feature released"

7. **Emoji**
   - ❌ "🎉 New feature! 🚀"
   - ✅ Use Mintlify icons only

---

## Section Standards

### Summary (2-3 sentences)

Template:
```
[What changed] for [who it helps]. This [benefit] by [how it works].
```

Example:
"New playlist collaboration for producers and artists. Create shared playlists with real-time sync and permission controls."

### What's New (3-7 bullets)

Structure:
```markdown
- **Benefit statement** — Specific capability or improvement
```

Example:
```markdown
- **Collaborative editing** — Invite others to edit playlists with you
- **Permission levels** — Control who can add, remove, or view
- **Activity tracking** — See who made changes and when
```

### Why It Matters (2-4 bullets)

Focus on user outcomes:

```markdown
- Save time on project coordination
- Share curation with your team
- Build community around your taste
```

### How to Use (Numbered steps)

Format:
```markdown
1. Navigate to **Page Name**
2. Click **Button Name**
3. Select **Option**
4. Verify [outcome]
```

---

## Formatting Rules

### Headers

- Use title case ("What's New", not "What's new")
- H2 for main sections
- H3 for subsections only if needed

### Links

- Use descriptive text, not "click here"
- Root-relative paths: `/help/page-name`
- Test all links before publishing

### Lists

- Use bullet points for unordered items
- Use numbered lists for sequential steps
- Keep list items parallel in structure

### Tables

- Use for comparisons (before/after, options)
- Include header row
- Keep cell content brief

---

## Length Guidelines

| Section | Target Length |
|---------|---------------|
| Title | 3-7 words |
| Summary | 2-3 sentences |
| What's New | 3-7 bullets |
| Why It Matters | 2-4 bullets |
| How to Use | 3-5 steps |
| Total | 200-400 words |

---

## Examples: Good vs Bad

### Title

❌ "Implementation of New Feature for User Enhancement"
✅ "New Playlist Collaboration"

### Summary

❌ "We have been working hard on this feature and are excited to announce that users can now collaborate on playlists which we think will be really useful for everyone."
✅ "Collaborate on playlists in real-time. Invite editors, set permissions, and track changes."

### What's New

❌
```
- Playlist collaboration feature
- Multiple users can edit
- Permissions system added
- Activity log included
```

✅
```
- **Real-time collaboration** — Multiple users can edit simultaneously
- **Permission controls** — Set editor or viewer access per person
- **Activity tracking** — See who made changes with timestamps
```

### Why It Matters

❌ "This feature allows users to work together on playlists which is something people have been asking for and we think it's really great."

✅
```
- Coordinate projects with your team
- Share curation duties with co-producers
- Build collaborative playlists for events
```

---

## Quick Reference Card

| Aspect | Rule |
|--------|------|
| Voice | Active, user-focused |
| Tense | Present for features, past for fixes |
| Length | 200-400 words total |
| You vs We | Always "you", never "we" |
| Numbers | Words 1-9, numerals 10+ |
| UI refs | Bold exact labels |
| Emoji | Never use |
| Jargon | Never use internal terms |
