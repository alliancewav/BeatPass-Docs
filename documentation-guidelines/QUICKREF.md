---
audience: help
title: "Quick Reference"
sidebarTitle: "Quick Reference"
description: "One-page reference for writing release notes."
---

# Release Notes Quick Reference

Everything you need at a glance.

---

## File Naming

```
YYYY-MM-DD-short-descriptive-title.mdx

Examples:
✅ 2026-02-10-playlist-collaboration.mdx
✅ 2026-02-15-dashboard-performance.mdx
❌ 2026-02-10-update.mdx (too vague)
❌ feb-10-playlist.mdx (wrong format)
```

---

## Folder Structure

```
release-notes/
├── index.mdx                      # Main landing
├── {YYYY}/                        # Year folder
│   ├── index.mdx                  # Year summary
│   ├── {month}/                   # Month folder
│   │   ├── index.mdx              # Month summary
│   │   └── YYYY-MM-DD-title.mdx   # Release notes
│   └── YYYY-MM-DD-title.mdx       # Root-level releases
└── _archive/{YYYY}/               # Pre-2024
```

Month names: `january`, `february`, `march`, `april`, `may`, `june`, `july`, `august`, `september`, `october`, `november`, `december`

---

## Frontmatter Template

```yaml
---
title: "Brief Title"
date: "YYYY-MM-DD"
version: "X.X.X"                    # Optional
severity: "minor"                   # major|minor|patch|hotfix
audience: "All"                     # All|Producers|Artists|Admins|Developers
tags: ["feature"]                   # See taxonomy
components: ["dashboard"]           # See taxonomy
status: "draft"                     # draft|review|published
related: []                         # ["YYYY-MM-DD-other-release"]
---
```

---

## Tag Quick Pick

| If you... | Use Tag |
|-----------|---------|
| Added something new | `feature` + component |
| Made something better | `improvement` |
| Fixed something broken | `bugfix` |
| Fixed a security issue | `security` |
| Made it faster | `performance` |
| Removed something | `deprecation` |
| Changed backend | `infrastructure` |
| Changed UI | `design` |

---

## Audience Quick Pick

| Who's affected? | Audience |
|-----------------|----------|
| Everyone | `All` |
| Only producers | `Producers` |
| Only listeners | `Listeners` |
| Admin tools | `Admins` |
| API/dev changes | `Developers` |

---

## Icon Quick Pick (Font Awesome 6 ONLY)

> **All icons must be valid FA6 names.** Verify at [fontawesome.com/icons](https://fontawesome.com/icons). Never use Lucide names.

| For | Use Icon (FA6) |
|-----|----------|
| Major release | `rocket` + green |
| Feature | `star` + amber |
| Improvement | `bolt` + blue |
| Bug fix | `wrench` + gray |
| Security | `shield` + red |
| Hotfix | `circle-exclamation` + red |
| Producer feature | `music` |
| Analytics | `chart-bar` |
| Billing | `credit-card` |
| Mobile | `mobile-screen-button` |
| Legal | `scale-balanced` |
| Upload | `cloud-arrow-up` |

---

## Common Phrases

### For New Features
- "New [feature name] for [audience]"
- "You can now [capability]"
- "Introducing [feature]: [one-line description]"

### For Improvements
- "[X]% faster [area]"
- "Improved [feature] with [benefit]"
- "Better [experience] through [change]"

### For Bug Fixes
- "Fixed [issue] that caused [problem]"
- "Resolved [error] in [area]"
- "Corrected [behavior] to [expected behavior]"

### For Security
- "Addressed [vulnerability type] in [area]"
- "Security update for [component]"
- "Fixed [issue] (no user action required)"

---

## UI Reference Patterns

```markdown
Click your **profile avatar** → **Billing**
Navigate to **Producer Dashboard** → **Analytics**
Select **Change plan** from the **Current Plan** section
Toggle the **Enable notifications** switch
```

---

## Section Checklist

- [ ] **Title**: 3-7 words, descriptive
- [ ] **Summary**: 2-3 sentences, benefit-focused
- [ ] **What's New**: 3-7 bullets, outcome-first
- [ ] **Why It Matters**: 2-4 bullets, user value
- [ ] **How to Use**: 3-5 steps (if applicable)
- [ ] **Migration**: Breaking changes (if any)
- [ ] **Related**: Links to docs (if applicable)

---

## Quick Validation

Before finishing, check:

1. **User-facing?** No internal code names
2. **Actionable?** Users know what to do
3. **Benefit clear?** Why they should care
4. **Accurate?** No broken links, correct dates
5. **Consistent?** Follows style guide
6. **Complete?** All sections filled
7. **Sized right?** 200-400 words
8. **Icons valid?** All FA6 names (not Lucide)
9. **Links correct?** Doc paths for docs, full URLs for app pages
10. **Colors WCAG?** Run `mint a11y` if colors changed

---

## Word Count Targets

| Section | Target |
|---------|--------|
| Summary | 25-50 words |
| What's New | 50-100 words |
| Why It Matters | 30-75 words |
| How to Use | 50-100 words (if applicable) |
| **Total** | **200-400 words** |

---

## Common Mistakes to Avoid

❌ "We updated..." → ✅ "New..." / "Updated..."
❌ "Bug fixed" → ✅ "Fixed [specific issue]"
❌ "Feature added" → ✅ "New [feature name]"
❌ "Improved performance" → ✅ "50% faster [area]"
❌ "Settings → Billing" → ✅ "**profile avatar** → **Billing**"

---

## Emergency Contacts

Questions about release notes?
- Documentation team: docs@beatpass.ca
- Slack: #docs-releases

---

## External Resources

- [Full Taxonomy](/help/release-notes/_meta/taxonomy)
- [Style Guide](/help/release-notes/_meta/style)
- [Audience Guide](/help/release-notes/_meta/audience-guide)
- [Icon Guide](/help/release-notes/_meta/icon-guide)
- [AI Agent Guide](/help/release-notes/_meta/AI-AGENT-GUIDE)
