# BeatPass Documentation

This is the official documentation site for BeatPass, built with [Mintlify](https://mintlify.com).

## Documentation Structure

```
docs/
├── api/                    # API reference documentation
├── account/                # Account settings and management
├── analytics/              # Analytics dashboards and metrics
├── changelog/              # Platform update history
├── contribution/           # Contribution pool and payouts
├── getting-started/        # Onboarding guides by role
├── legal/                  # Legal policies and terms
├── overview/               # Platform overview and concepts
├── producer-guides/        # Producer-specific guides
├── product-guides/         # Feature documentation
├── security/               # Security and privacy guides
└── support/                # Help and troubleshooting
```

## Local Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. Install the Mintlify CLI:

```bash
npm i -g mintlify
```

2. Navigate to the docs directory:

```bash
cd docs/BeatPass\ Mintlify\ Docs\ site
```

3. Start the development server:

```bash
mintlify dev
```

4. Open `http://localhost:3000` in your browser.

### Making Changes

1. Edit `.mdx` files in the appropriate directory
2. Preview changes locally with `mintlify dev`
3. Commit and push to deploy

## Content Guidelines

### Writing Style

- Use clear, concise language
- Write for the target audience (see `<Info>` tags for audience)
- Use present tense and active voice
- Include code examples where relevant

### MDX Components

Common Mintlify components used in this documentation:

```mdx
<Note>Informational callout</Note>
<Warning>Important warning</Warning>
<Info>Contextual information</Info>
<Tip>Helpful suggestion</Tip>

<Steps>
  <Step title="Step Name">Content</Step>
</Steps>

<AccordionGroup>
  <Accordion title="Title">Content</Accordion>
</AccordionGroup>

<CardGroup cols={2}>
  <Card title="Title" icon="icon-name" href="/path">
    Description
  </Card>
</CardGroup>
```

### Keeping Docs in Sync

When platform features change:

1. **API changes**: Update `api/endpoints.mdx` and related auth/rate-limit docs
2. **New features**: Add to relevant product-guide and update changelog
3. **UI changes**: Update screenshots and step-by-step guides
4. **Removed features**: Remove documentation and add deprecation notes

## Deployment

Documentation is automatically deployed when changes are pushed to the main branch via Mintlify's GitHub integration.

### Manual Deployment

If needed, trigger a manual deployment from the [Mintlify Dashboard](https://dashboard.mintlify.com).

## Support

- **Mintlify docs**: https://mintlify.com/docs
- **BeatPass team**: Contact via internal channels