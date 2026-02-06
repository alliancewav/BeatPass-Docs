---
audience: help
title: "Release Notes Playbook"
sidebarTitle: "Playbook"
description: "Step-by-step workflow for creating and publishing release notes."
---

# Release Notes Playbook

The complete workflow from idea to published release note.

---

## Overview

### When to Write a Release Note

Write a release note when:
- ✅ New feature ships to users
- ✅ Significant improvement to existing feature
- ✅ Bug fix affects user workflow
- ✅ Security update (all)
- ✅ Breaking change or deprecation
- ✅ Performance improvement >20%
- ✅ New integration or API

Don't write a release note when:
- ❌ Internal tooling only
- ❌ Pure backend with no user impact
- ❌ Minor UI tweak (<5% of users notice)
- ❌ Code refactoring with no behavior change
- ❌ Documentation-only changes
- ❌ Test or infrastructure-only changes

---

## Phase 1: Preparation

### Step 1: Gather Information

Collect these details:

**Required:**
- Release date
- What changed (technical description)
- User impact (how it helps)
- Affected components
- Breaking changes (yes/no)

**Optional but helpful:**
- Metrics ("50% faster", "supports 1000 concurrent")
- User quotes or feedback
- Screenshots/demos
- Related PRs or issues

### Step 2: Choose Template

| Situation | Template | Severity |
|-----------|----------|----------|
| New feature | `template-feature.mdx` | minor |
| Major version launch | `template-major-release.mdx` | major |
| Bug fix | `template.mdx` | patch |
| Security fix | `template-security.mdx` | hotfix |
| Critical fix | `template-hotfix.mdx` | hotfix |
| Improvement | `template.mdx` | patch |

### Step 3: Determine Classification

**Audience:**
Use decision tree in [Audience Guide](/help/release-notes/_meta/audience-guide)

**Tags:**
Select from [Taxonomy](/help/release-notes/_meta/taxonomy)
- 1 primary category (feature/improvement/bugfix/security)
- 0-2 secondary tags (mobile, api, breaking)

**Components:**
List all affected areas from taxonomy components list

**Severity:**
- `major` = Breaking changes, version launches
- `minor` = New features
- `patch` = Bug fixes, improvements
- `hotfix` = Critical/security

---

## Phase 2: Writing

### Step 4: Draft Content

Follow the template structure:

1. **Title** (3-7 words)
   - Lead with what it is
   - Be specific
   - Examples: "New Playlist Collaboration", "Fixed Mobile Player Crash"

2. **Summary** (2-3 sentences)
   - What changed
   - Who it helps
   - Key benefit

3. **What's New** (3-7 bullets)
   - Format: "**Benefit** — Specific capability"
   - Lead with outcome
   - Include numbers/metrics

4. **Why It Matters** (2-4 bullets)
   - User problems solved
   - Value proposition
   - Use "you" language

5. **How to Use** (if applicable)
   - 3-5 numbered steps
   - Bold UI elements
   - Specific navigation paths

6. **Migration Guide** (if breaking)
   - Breaking changes table
   - Deprecation notices
   - Upgrade steps

7. **Related Links**
   - Documentation pages
   - Previous related releases

### Step 5: Apply Style Standards

Review against [Style Guide](/help/release-notes/_meta/style):

**Voice & Tone:**
- [ ] Active voice
- [ ] User-focused ("you")
- [ ] No "we/our/us"
- [ ] Contractions allowed

**Formatting:**
- [ ] Bold UI elements
- [ ] Sentence case headers
- [ ] No emoji
- [ ] Root-relative links

**Content:**
- [ ] No internal jargon
- [ ] No code/technical details
- [ ] No internal IDs
- [ ] Specific numbers/metrics

**Length:**
- [ ] Total: 200-400 words
- [ ] Summary: 2-3 sentences
- [ ] Bullets: 3-7 items

---

## Phase 3: Validation

### Step 6: Self-Review

Use this checklist:

**Completeness:**
- [ ] All frontmatter fields filled
- [ ] Date in YYYY-MM-DD format
- [ ] At least 1 tag from taxonomy
- [ ] Audience clearly defined
- [ ] All required sections present

**Accuracy:**
- [ ] Technical details correct
- [ ] No broken internal links
- [ ] UI references match actual UI
- [ ] Dates and version numbers correct

**User Focus:**
- [ ] Benefits clear in first 2 sentences
- [ ] Instructions actionable
- [ ] No jargon users don't know
- [ ] Solves a real user problem

**Style:**
- [ ] Follows verb tense rules
- [ ] Consistent formatting
- [ ] Proper UI bolding
- [ ] Within word count

### Step 7: Technical Review (if needed)

For technical releases, have someone verify:
- Technical accuracy
- Breaking changes documented
- Migration steps complete
- API changes correct

### Step 8: Stakeholder Review

Share with:
- Product manager (for features)
- Engineering lead (for technical changes)
- UX designer (for UI changes)
- Legal (for privacy/security changes)

Get approval on:
- Messaging
- Breaking changes framing
- Timeline

---

## Phase 4: Publishing

### Step 9: Create File

1. **Name the file:**
   ```
   YYYY-MM-DD-short-descriptive-title.mdx
   ```

2. **Place in correct folder:**
   ```
   release-notes/{YYYY}/{month}/
   ```

3. **Update indices:**
   - Add to month index.mdx
   - Add to year index.mdx (if not auto-generated)
   - Main index will auto-update on build

### Step 10: Final Checks

Before publishing:

- [ ] File in correct location
- [ ] Frontmatter valid YAML
- [ ] No syntax errors
- [ ] Preview renders correctly
- [ ] Links work
- [ ] Images load (if any)

### Step 11: Publish

1. Commit to git
2. Create PR if required
3. Merge to main branch
4. Verify deployment
5. Check live site

---

## Phase 5: Post-Publish

### Step 12: Announce

Notify channels:
- [ ] In-app changelog/what's new
- [ ] Email newsletter (for major features)
- [ ] Slack/Discord community
- [ ] Twitter/social (for major releases)
- [ ] Blog post (for major version launches)

### Step 13: Monitor

Watch for:
- User questions about the release
- Confusion in support tickets
- Bugs reported related to release
- Engagement with new features

### Step 14: Update (if needed)

Update the release note if:
- Bug discovered post-release
- Additional known issues found
- User feedback clarifies need
- Related documentation changes

Add an **Update** section at the bottom:
```markdown
---

## Update (YYYY-MM-DD)

- **Fixed** — Additional issue discovered and resolved
- **Clarified** — Updated instructions based on feedback
```

---

## Special Cases

### Emergency/Hotfix

For critical fixes requiring immediate documentation:

1. **Skip to minimum:**
   - Summary
   - What was fixed
   - Impact assessment

2. **Publish immediately**

3. **Expand later:**
   - Add detailed sections
   - Add migration steps
   - Add related links

### Breaking Changes

Extra steps for breaking changes:

1. **Advance notice:**
   - Publish deprecation notice 2-4 weeks before
   - Include migration timeline

2. **Clear communication:**
   - Use `<Warning>Breaking Change</Warning>` callout
   - Detailed migration guide
   - Contact/support options

3. **Follow-up:**
   - Monitor support channels
   - Update FAQ based on questions
   - Consider webinar/office hours

### Security Updates

Special handling:

1. **Immediate publish:** No waiting for regular schedule
2. **Security-first language:**
   - Clear severity
   - What was vulnerable
   - What was done
   - Impact assessment

3. **User reassurance:**
   - Data security status
   - No action required (usually)
   - How to report concerns

---

## Templates & Resources

### Available Templates

- `template.mdx` — General purpose
- `template-feature.mdx` — New features
- `template-major-release.mdx` — Version launches
- `template-hotfix.mdx` — Critical fixes
- `template-security.mdx` — Security updates

### Reference Documents

- [Taxonomy](/help/release-notes/_meta/taxonomy) — Tags, components, classifications
- [Style Guide](/help/release-notes/_meta/style) — Writing standards
- [Quick Reference](/help/release-notes/_meta/quickref) — One-page cheat sheet
- [Audience Guide](/help/release-notes/_meta/audience-guide) — Choosing audience
- [Icon Guide](/help/release-notes/_meta/icon-guide) — Visual standards
- [AI Agent Guide](/help/release-notes/_meta/AI-AGENT-GUIDE) — For automated generation

---

## FAQ

**Q: How long should writing take?**
A: 15-30 minutes for standard release, 1-2 hours for major release.

**Q: Who approves release notes?**
A: Product manager for features, engineering lead for technical changes, legal for privacy/security.

**Q: When do I publish?**
A: Same day as code deployment. For major features, coordinate with marketing.

**Q: Can I edit after publishing?**
A: Yes for corrections. Add an Update section for transparency.

**Q: What if I don't have all the info?**
A: Write what you know, mark as draft, get details, then publish.

**Q: Should every PR have a release note?**
A: No. Only user-facing changes that meet the criteria above.

---

## Checklist Summary

### Pre-Writing
- [ ] Change qualifies for release note
- [ ] Information gathered
- [ ] Template selected
- [ ] Classification determined

### Writing
- [ ] Draft complete
- [ ] Style guide followed
- [ ] Length appropriate
- [ ] User-focused

### Review
- [ ] Self-review complete
- [ ] Technical review (if needed)
- [ ] Stakeholder approval
- [ ] Final check passed

### Publishing
- [ ] File created and named correctly
- [ ] In correct folder
- [ ] Indices updated
- [ ] Preview verified
- [ ] Live and working

### Post-Publish
- [ ] Announced in channels
- [ ] Monitoring for issues
- [ ] Feedback incorporated

---

<Info>
  This playbook is a living document. Suggest improvements via PR or Slack #docs-releases.
</Info>
