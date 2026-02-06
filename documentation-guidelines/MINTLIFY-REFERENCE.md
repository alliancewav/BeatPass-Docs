---
audience: help
title: "Mintlify Components for Release Notes"
sidebarTitle: "Component Reference"
description: "Approved Mintlify components for release note formatting."
---

# Mintlify Components for Release Notes

Quick reference for Mintlify components approved for use in release notes.

---

## Callouts (Alerts)

### Info

```mdx
<Info>
  Helpful information users should know.
</Info>
```

### Warning

```mdx
<Warning>
  Important notice that requires attention.
</Warning>
```

### Tip

```mdx
<Tip>
  Helpful advice or shortcut.
</Tip>
```

### Note

```mdx
<Note>
  Additional context or explanation.
</Note>
```

---

## Cards

### Single Card

```mdx
<Card title="Card Title" icon="star" href="/path">
  Card content description.
</Card>
```

### Card Group

```mdx
<CardGroup cols={2}>
  <Card title="Feature 1" icon="star">
    Description of feature 1.
  </Card>
  <Card title="Feature 2" icon="bolt">
    Description of feature 2.
  </Card>
</CardGroup>
```

**Approved icons**: See [Icon Guide](/help/release-notes/_meta/icon-guide)

---

## Accordions

### Single Accordion

```mdx
<Accordion title="Section Title" icon="icon-name">
  Content that can be expanded/collapsed.
</Accordion>
```

### Accordion Group

```mdx
<AccordionGroup>
  <Accordion title="First Section" icon="star">
    Content for first section.
  </Accordion>
  <Accordion title="Second Section" icon="bolt">
    Content for second section.
  </Accordion>
</AccordionGroup>
```

---

## Updates (Changelog Entries)

```mdx
<Update 
  label="February 4, 2026" 
  tags={["feature", "billing"]} 
  description="Brief description"
>
  **Key highlight** — What changed and why it matters.
  
  - Bullet point 1
  - Bullet point 2
  
  [Read full update →](/help/release-notes/path)
</Update>
```

**Note**: `Update` component is typically used in index pages, not individual release notes.

---

## Steps

```mdx
<Steps>
  <Step title="Step One">
    Instructions for first step.
  </Step>
  <Step title="Step Two">
    Instructions for second step.
  </Step>
  <Step title="Step Three">
    Instructions for third step.
  </Step>
</Steps>
```

Use for "How to Use" sections with 3-5 steps.

---

## Tabs

```mdx
<Tabs>
  <Tab title="Tab One">
    Content for the first tab.
  </Tab>
  <Tab title="Tab Two">
    Content for the second tab.
  </Tab>
</Tabs>
```

Use for organizing related content into switchable views (e.g., metrics, platform-specific instructions).

---

## Badges

```mdx
<Badge color="green">New</Badge>
<Badge color="blue">Updated</Badge>
<Badge color="red">Fixed</Badge>
<Badge color="purple">Beta</Badge>
```

**Colors**: green, blue, red, purple, yellow, gray

---

## Tables

```mdx
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |
```

Use for:
- Breaking changes tables
- Configuration options
- Before/after comparisons

---

## Code Blocks

### Basic Code Block

```mdx
```typescript
const example = "code";
```
```

### With Title

```mdx
```typescript Example Code
const example = "code";
```
```

### With Highlighting

```mdx
```typescript {2,4-5}
const line1 = "normal";
const line2 = "highlighted";
const line3 = "normal";
const line4 = "highlighted";
const line5 = "highlighted";
```
```

### Diff View

```mdx
```typescript
const old = "value"; // [!code --]
const new = "value"; // [!code ++]
```
```

**Note**: Use code blocks sparingly in release notes. Users are non-technical.

---

## Frames (Images)

```mdx
<Frame caption="Screenshot description">
  <img src="/path/to/image.png" alt="Descriptive alt text" />
</Frame>
```

**Note**: Screenshots in release notes should be redacted if they contain sensitive data.

---

## Component Usage Guidelines

### Do Use

- **Cards** — For related documentation links, feature highlights
- **Accordions** — For organizing multiple related items (Recent Highlights)
- **Steps** — For "How to Use" instructions
- **Badges** — For version numbers, status indicators
- **Tables** — For breaking changes, configuration options
- **Callouts** — For important notices, warnings, tips

### Don't Use

- **Code blocks** — Unless showing user-facing configuration
- **Complex iframes** — Not needed for release notes
- **Videos** — Too heavy for release notes
- **Interactive components** — Keep it simple

---

## Standard Release Note Structure

```mdx
---
title: "Update Title"
date: "YYYY-MM-DD"
severity: "minor"
audience: "All"
tags: ["feature"]
components: ["dashboard"]
---

# Update Title

## Summary

Brief overview in 2-3 sentences.

## What's New

- **Feature name** — What it does
- **Another feature** — What it does

## Why It Matters

<CardGroup cols={2}>
  <Card title="Benefit 1" icon="star">
    Explanation of benefit.
  </Card>
  <Card title="Benefit 2" icon="bolt">
    Explanation of benefit.
  </Card>
</CardGroup>

## How to Use

<Steps>
  <Step title="Navigate to Page">
    Click **profile avatar** → **Billing**.
  </Step>
  <Step title="Click Button">
    Click **Change plan**.
  </Step>
</Steps>

## Migration Guide

### Breaking Changes

| Feature | Change | Action |
|---------|--------|--------|
| Old API | Deprecated | Use new endpoint |

<Warning>
  This is a breaking change. Update before [date].
</Warning>

## Related

- [Documentation Link](/help/path)
```

---

## docs.json Configuration Requirements

The `docs.json` file controls site-wide settings. These configurations are **critical** and must be maintained:

### Icon Library

```json
"icons": {
  "library": "fontawesome"
}
```

**This MUST be set to `fontawesome`.** Without it, Mintlify defaults to fontawesome but the explicit setting prevents ambiguity. All icon names throughout the docs and navigation MUST be valid [Font Awesome 6](https://fontawesome.com/icons) names.

### Color Palette (WCAG AA Compliant)

```json
"colors": {
  "primary": "#187AB4",
  "light": "#5BC0F0",
  "dark": "#1F8AC8"
}
```

**Never change these without verifying WCAG AA contrast ratios:**
- Primary vs white: must be ≥ 4.5:1
- Light vs dark background (#050505): must be ≥ 4.5:1
- Use [webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker/) to verify
- Run `mint a11y` after any color change (exit code 0 = pass)

### Navigation Icon Names

All `"icon"` values in docs.json navigation groups/tabs must be valid FA6 names:

```json
✅ "icon": "scale-balanced"     // FA6 name
❌ "icon": "scale"              // Not valid in FA6 — renders blank
❌ "icon": "bar-chart"          // FA4 alias removed in FA6
❌ "icon": "message-square"     // Lucide name — not FA6
```

---

## Full Component Reference

For complete Mintlify documentation, see:
- [Mintlify Components Guide](https://mintlify.com/docs/components)
- [Mintlify Content Formatting](https://mintlify.com/docs/content)
- [docs.json Schema](https://mintlify.com/docs.json)

---

<Info>
  Keep release notes simple. Use components to enhance readability, not to add complexity.
</Info>
