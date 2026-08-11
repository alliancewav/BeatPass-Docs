import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const docsPath = path.join(root, 'docs.json');
const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));

const helpGroups = [
  {
    group: 'Start Here',
    icon: 'house',
    pages: [
      'help/index',
      'help/getting-started/index',
      'help/getting-started/creating-account',
      'help/getting-started/logging-in',
      'help/getting-started/password-reset',
      'help/getting-started/navigating-beatpass',
      'help/getting-started/understanding-roles',
      'help/getting-started/quick-start-guides/index',
      'help/getting-started/quick-start-guides/listener-guide',
      'help/getting-started/quick-start-guides/producer-guide',
      'help/faq',
      'help/glossary',
    ],
  },
  {
    group: 'Discover & Play',
    icon: 'play',
    pages: [
      'help/discovering-music/index',
      'help/discovering-music/homepage',
      'help/discovering-music/search',
      'help/discovering-music/genres-and-tags',
      'help/discovering-music/producer-pages',
      'help/discovering-music/albums-and-collections',
      'help/discovering-music/radio',
      'help/discovering-music/channels/index',
      'help/playing-music/index',
      'help/playing-music/player-controls',
      'help/playing-music/queue-and-playback',
      'help/playing-music/waveform-comments',
    ],
  },
  {
    group: 'Library & Community',
    icon: 'users',
    pages: [
      'help/library/index',
      'help/library/your-tracks',
      'help/library/your-collections',
      'help/library/listening-history',
      'help/playlists/index',
      'help/playlists/creating-playlists',
      'help/playlists/managing-tracks',
      'help/playlists/collaborative-playlists',
      'help/social-features/index',
      'help/social-features/following-system',
      'help/social-features/comments',
      'help/social-features/sharing-and-embeds',
      'help/messaging/index',
      'help/messaging/direct-messages',
      'help/messaging/group-conversations',
      'help/profiles/index',
      'help/profiles/user-profiles/index',
      'help/profiles/producer-profiles/index',
      'help/gamification/index',
      'help/gamification/leaderboards/index',
    ],
  },
  {
    group: 'Licensing & Plans',
    icon: 'file-contract',
    pages: [
      'help/downloads-and-licensing/index',
      'help/downloads-and-licensing/how-downloads-work',
      'help/downloads-and-licensing/license-certificates',
      'help/downloads-and-licensing/verifying-licenses',
      'help/downloads-and-licensing/releasing-music',
      'help/downloads-and-licensing/content-id-claims',
      'help/downloads-and-licensing/exclusive-licenses/index',
      'help/downloads-and-licensing/exclusive-licenses/purchasing-exclusive',
      'help/plans-and-pricing/index',
      'help/plans-and-pricing/choosing-a-plan',
      'help/plans-and-pricing/plan-comparison',
      'help/billing/index',
      'help/billing/subscription-overview',
      'help/billing/managing-subscription/index',
      'help/billing/payment-methods/index',
      'help/billing/invoices',
      'help/billing/using-coupons',
      'help/billing/platform-fee',
      'help/billing/refund-policy',
      'help/billing/faq',
    ],
  },
  {
    group: 'Producer Setup',
    icon: 'sliders',
    pages: [
      'help/producer-program/index',
      'help/producer-program/requirements',
      'help/producer-program/application-process',
      'help/producer-program/application-types/index',
      'help/producer-program/after-approval',
      'help/uploading/index',
      'help/uploading/upload-page',
      'help/uploading/track-metadata/index',
      'help/uploading/track-metadata/basic-info',
      'help/uploading/cover-art/index',
      'help/uploading/creating-albums',
      'help/uploading/editing-content',
      'help/uploading/collaborations',
      'help/uploading/sample-safe',
      'help/uploading/audio-fingerprinting',
      'help/licensing-for-producers/index',
      'help/licensing-for-producers/non-exclusive-licenses',
      'help/licensing-for-producers/exclusive-licenses/index',
      'help/licensing-for-producers/exclusive-licenses/license-configuration',
      'help/licensing-for-producers/when-beat-sells',
    ],
  },
  {
    group: 'Grow & Get Paid',
    icon: 'chart-line',
    pages: [
      'help/producer-dashboard/index',
      'help/producer-dashboard/home',
      'help/producer-dashboard/tracks',
      'help/producer-dashboard/activity',
      'help/producer-dashboard/finances',
      'help/analytics/index',
      'help/analytics/getting-started',
      'help/analytics/backstage-insights/index',
      'help/analytics/backstage-insights/track-insights',
      'help/analytics/backstage-insights/exporting-data',
      'help/analytics/reference/metrics-glossary',
      'help/earnings/index',
      'help/earnings/viewing-finances',
      'help/earnings/payout-eligibility',
      'help/earnings/payout-schedule',
      'help/earnings/stripe-connect/index',
      'help/earnings/stripe-connect/setup-guide',
      'help/earnings/contribution-system/index',
      'help/earnings/beatpay/index',
      'help/beat-requests/index',
      'help/beat-requests/creating-requests',
      'help/beat-requests/managing-requests',
      'help/beat-requests/receiving-submissions',
      'help/beat-requests/for-producers',
    ],
  },
  {
    group: 'Account & Notifications',
    icon: 'user-gear',
    pages: [
      'help/account-settings/index',
      'help/account-settings/account-details',
      'help/account-settings/social-login',
      'help/account-settings/password/index',
      'help/account-settings/password/changing-password',
      'help/account-settings/password/forgot-password',
      'help/account-settings/two-factor-authentication',
      'help/account-settings/active-sessions',
      'help/account-settings/localization',
      'help/account-settings/developer-api',
      'help/account-settings/delete-account',
      'help/notifications/index',
      'help/notifications/notification-center',
      'help/notifications/notification-types',
      'help/notifications/notification-settings/index',
    ],
  },
  {
    group: 'Trust & Support',
    icon: 'shield-halved',
    pages: [
      'help/contact-support/index',
      'help/contact-support/getting-help',
      'help/contact-support/reporting-issues',
      'help/contact-support/feedback',
      'help/troubleshooting/index',
      'help/troubleshooting/account-access',
      'help/troubleshooting/playback-issues',
      'help/troubleshooting/upload-issues',
      'help/troubleshooting/download-issues',
      'help/troubleshooting/payment-issues',
      'help/troubleshooting/stripe-issues',
      'help/legal/index',
      'help/legal/terms-of-service',
      'help/legal/privacy-policy',
      'help/legal/copyright-and-dmca',
      'help/legal/content-guidelines',
      'help/legal/exclusive-license-agreement',
      'help/legal/producer-upload-seller-agreement',
      'help/legal/subscription-plan-terms',
      'help/legal/custom-beat-request-terms',
      'help/legal/ai-audio-human-made-content',
      'help/legal/cookie-tracking-policy',
      'help/legal/marketing-communications-consent',
      'help/legal/non-dmca-rights-trust-report-policy',
      'help/legal/privacy-governance',
      'help/legal/license-terms/index',
      'help/legal/license-terms/non-exclusive',
      'help/legal/license-terms/exclusive',
      'help/legal/license-terms/usage-rights',
    ],
  },
];

const redirects = {
  '/help/discovering-music/channels/understanding-channels': '/help/discovering-music/channels',
  '/help/discovering-music/channels/channel-layouts': '/help/discovering-music/channels',
  '/help/discovering-music/channels/channel-filters': '/help/discovering-music/channels',
  '/help/discovering-music/channels/genre-channels': '/help/discovering-music/channels',
  '/help/discovering-music/channels/personalized-recommendations': '/help/discovering-music/channels',
  '/help/gamification/leaderboards/categories': '/help/gamification/leaderboards',
  '/help/gamification/leaderboards/genre-leaderboards': '/help/gamification/leaderboards',
  '/help/gamification/leaderboards/timeframes': '/help/gamification/leaderboards',
  '/help/plans-and-pricing/explorer-free': '/help/plans-and-pricing/plan-comparison',
  '/help/plans-and-pricing/classic-plan': '/help/plans-and-pricing/plan-comparison',
  '/help/plans-and-pricing/plus-plan': '/help/plans-and-pricing/plan-comparison',
  '/help/plans-and-pricing/pro-plan': '/help/plans-and-pricing/plan-comparison',
  '/help/billing/payment-methods/adding-payment-method': '/help/billing/payment-methods',
  '/help/billing/payment-methods/updating-payment-method': '/help/billing/payment-methods',
  '/help/billing/payment-methods/supported-methods': '/help/billing/payment-methods',
  '/help/notifications/notification-settings/browser-notifications': '/help/notifications/notification-settings',
  '/help/notifications/notification-settings/email-notifications': '/help/notifications/notification-settings',
  '/help/notifications/notification-settings/in-app-notifications': '/help/notifications/notification-settings',
  '/help/profiles/user-profiles/profile-tabs': '/help/profiles/user-profiles',
  '/help/profiles/producer-profiles/bio-and-links': '/help/profiles/producer-profiles/profile-elements',
  '/help/profiles/producer-profiles/discography-tabs': '/help/profiles/producer-profiles/profile-elements',
  '/help/profiles/producer-profiles/photo-gallery': '/help/profiles/producer-profiles/profile-elements',
  '/help/profiles/producer-profiles/pinned-track': '/help/profiles/producer-profiles/profile-elements',
  '/help/profiles/producer-profiles/professional-credits': '/help/profiles/producer-profiles/profile-elements',
  '/help/profiles/producer-profiles/verified-badge': '/help/profiles/producer-profiles/profile-elements',
};

for (const category of [
  'achievements-notifications',
  'audio-recon-notifications',
  'beat-request-notifications',
  'earnings-and-licensing-notifications',
  'following-notifications',
  'messages-notifications',
  'producer-activity-notifications',
  'producer-dashboard-notifications',
  'promotions-notifications',
  'social-notifications',
]) {
  redirects[`/help/notifications/notification-categories/${category}`] =
    '/help/notifications/notification-types';
}

for (const [source, destination] of Object.entries(redirects)) {
  const sourceFile = path.join(root, `${source.slice(1)}.mdx`);
  if (fs.existsSync(sourceFile)) fs.rmSync(sourceFile);

  for (const contentRoot of ['help', 'developers', 'release-notes']) {
    for (const file of walk(path.join(root, contentRoot)).filter((candidate) => candidate.endsWith('.mdx'))) {
      const original = fs.readFileSync(file, 'utf8');
      const updated = original.replaceAll(source, destination);
      if (updated !== original) fs.writeFileSync(file, updated, 'utf8');
    }
  }
}

function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

docs.navigation.tabs[0].groups = helpGroups;
docs.navigation.tabs[1].groups = [
  {group: 'Overview', icon: 'bullhorn', pages: ['release-notes/index']},
  {group: 'Changelog', icon: 'clock-rotate-left', pages: ['release-notes/changelog']},
  {
    group: 'Current Releases',
    icon: 'rocket',
    pages: [
      'release-notes/v3.0/3.4.0',
      'release-notes/v3.0/3.3.0',
      'release-notes/v3.0/3.2.1',
      'release-notes/v3.0/3.2.0',
      'release-notes/v3.0/3.1.9',
    ],
  },
  {
    group: 'Archives',
    icon: 'box-archive',
    pages: ['release-notes/v3.0/index', 'release-notes/v2.x/index'],
  },
];

const existingRedirects = Object.fromEntries(
  (docs.redirects ?? []).map((redirect) => [redirect.source, redirect.destination]),
);
docs.redirects = Object.entries({...existingRedirects, ...redirects})
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([source, destination]) => {
    const consolidatedDestination = redirects[destination] ?? destination;
    return {source, destination: consolidatedDestination, permanent: true};
  });

fs.writeFileSync(docsPath, `${JSON.stringify(docs, null, 2)}\n`, 'utf8');
console.log(`Navigation rebuilt with ${helpGroups.reduce((sum, group) => sum + group.pages.length, 0)} Help pages.`);
console.log(`Consolidated ${Object.keys(redirects).length} legacy pages with permanent redirects.`);
