import { insightsResponse } from "./insights-data.mjs";
import dashboardFixtures from "./dashboard-data.json" with { type: "json" };
export function avatarData(name) {
  const palettes = [
    ["#183f45", "#b9d9ce"],
    ["#4c253c", "#f1c1ac"],
    ["#27294b", "#c9c8ee"],
    ["#463319", "#ead5a9"],
    ["#143552", "#b1d9e7"],
  ];
  const index =
    [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    palettes.length;
  const [background, accent] = palettes[index];
  const initials = name
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" fill="${background}"/><circle cx="190" cy="45" r="100" fill="${accent}" opacity=".32"/><path d="M-20 210Q80 90 260 190" fill="none" stroke="${accent}" stroke-width="18" opacity=".35"/><text x="120" y="145" text-anchor="middle" font-family="sans-serif" font-size="76" font-weight="600" fill="${accent}">${initials}</text></svg>`,
    )
  );
}
const personNames = new Set([
  "Avery Lane",
  "Pine Avenue",
  "Mira Sol",
  "June Keys",
  "Nova Vale",
  "Mira North",
  "Low Tide",
]);
export const beatNames = [
  "Golden Hour",
  "Pocket Theory",
  "Night Garden",
  "Sunday Letters",
  "Blue Window",
  "Soft Landing",
];
export const collectionNames = [
  "After Hours, Vol. 1",
  "Open Windows",
  "Studio Notes",
  "Warm Weather",
  "City Lights",
  "Quiet Mornings",
];
export const demoPeople = [
  {
    id: 19,
    username: "mirasol",
    display_name: "Mira Sol",
    avatar: "/browser-smoke-avatar.svg",
    is_following: true,
    can_message: true,
  },
  {
    id: 29,
    username: "junekeys",
    display_name: "June Keys",
    avatar: "/browser-smoke-cover.svg",
    is_following: true,
    can_message: true,
  },
];
export function normaliseDemo(value) {
  if (Array.isArray(value)) return value.map(normaliseDemo);
  if (value && typeof value === "object") {
    const out = Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normaliseDemo(item)]),
    );
    if (out.model_type === "track" && out.id) {
      out.name = beatNames[Math.abs(Number(out.id) - 11) % beatNames.length];
      out.bpm = out.bpm || 96;
      out.key = out.key || "C";
      out.scale = out.scale || "minor";
      out.image = coverData(Number(out.id));
      if (out.id >= 11 && out.id <= 16 && out.plays !== undefined)
        out.plays = [3120, 2740, 1890, 1460, 1350, 1210][out.id - 11];
    }
    if (out.track?.id >= 11 && out.track.id <= 16) {
      out.track.name = beatNames[out.track.id - 11];
      out.track.image = coverData(out.track.id);
    }
    if (out.model_type === "album" && out.id) {
      const index = Math.abs(Number(out.id) - 22) % 6;
      out.name = collectionNames[index];
      out.image = collectionCoverData(22 + index);
    }
    if (
      out.model_type === "user" &&
      ["listener", "syntheticlistener"].includes(out.username)
    ) {
      out.display_name = "Avery Lane";
      out.username = "averylane";
    }
    if (out.model_type === "artist" && out.id === 5) out.name = "Pine Avenue";
    const personName = out.display_name || out.displayName || out.name;
    if (
      personNames.has(personName) &&
      !["track", "album"].includes(out.model_type)
    ) {
      if (out.avatar !== undefined || out.username)
        out.avatar = avatarData(personName);
      if (out.image !== undefined) out.image = avatarData(personName);
      if (out.image_small !== undefined)
        out.image_small = avatarData(personName);
    }
    if (personNames.has(out.user_name) && out.user_avatar !== undefined)
      out.user_avatar = avatarData(out.user_name);
    return out;
  }
  if (value === "Studio") return "Demo plan";
  if (value === "Studio Plus") return "Demo plan Plus";
  if (value === "Session") return "Demo plan option";
  if (typeof value === "string")
    return value
      .replaceAll("Smoke Producer", "Pine Avenue")
      .replaceAll("Studio subscription", "Demo plan subscription")
      .replaceAll("Smoke Track", "Golden Hour")
      .replaceAll("Smoke Album", "After Hours, Vol. 1")
      .replaceAll("Smoke Founder", "Avery Lane")
      .replaceAll("Synthetic Licensee", "Avery Lane")
      .replaceAll("Synthetic listener", "Avery Lane")
      .replaceAll("Synthetic Listener", "Avery Lane")
      .replaceAll(
        "Synthetic operating system with a very long name",
        "Demo device",
      )
      .replaceAll("Synthetic mobile browser", "Demo browser")
      .replaceAll("Elena — Percussion & Sound", "Mira Sol")
      .replaceAll("syntheticlistener", "averylane")
      .replace(
        /Liked beat (\d+)/g,
        (_, n) => beatNames[(Number(n) - 1) % beatNames.length],
      );
  return value;
}
const page = (data) => ({
  data,
  total: data.length,
  per_page: 20,
  current_page: 1,
  last_page: 1,
  from: data.length ? 1 : 0,
  to: data.length,
});
export function specialResponse(endpoint, fixture, params = new URLSearchParams()) {
  const insights = insightsResponse(endpoint, fixture, params);
  if (insights !== undefined) return insights;
  const now = "2026-11-03T05:00:00Z",
    user = fixture?.user || { id: 99 };
  if (
    endpoint === "search/suggestions/album/22" ||
    endpoint === "normalized-models/album/22"
  )
    return {
      status: "success",
      model: {
        id: 22,
        name: "After Hours, Vol. 1",
        model_type: "album",
        image: coverData(12),
      },
    };
  if (endpoint === "search/suggestions/album")
    return {
      status: "success",
      results: [
        {
          id: 22,
          name: "After Hours, Vol. 1",
          model_type: "album",
          image: coverData(12),
        },
      ],
    };
  if (endpoint === "normalized-models/tag")
    return {
      status: "success",
      results: [
        { id: 501, name: "Piano", model_type: "tag" },
        { id: 502, name: "Warm", model_type: "tag" },
      ],
    };
  if (dashboardFixtures.responses[endpoint])
    return structuredClone(dashboardFixtures.responses[endpoint]);
  // These intercepted fixture responses never contact a production API.
  if (
    [
      "beat-requests",
      "beat-requests/user/my-requests",
      "beat-requests/user/my-submissions",
    ].includes(endpoint)
  ) {
    const expiresAt = "2026-11-08T05:00:00Z";
    const remainingHours = Math.max(
      0,
      Math.ceil((Date.parse(expiresAt) - Date.parse("2026-11-03T16:05:55.683Z")) / 3600000),
    );
    const brief = {
      id: "11111111-1111-4111-8111-111111111111",
      user_id: 19,
      user_name: "Mira Sol",
      user_avatar: "/browser-smoke-avatar.svg",
      content:
        "Warm piano and loose drums.",
      status: "active",
      is_expired: false,
      can_renew: false,
      created_at: "2026-11-03T05:00:00Z",
      expires_at: expiresAt,
      hours_remaining: remainingHours,
      genre: "R&B",
      bpm_range: "90–100",
      key: "C Minor",
      mood: "Warm",
      budget: null,
      submission_count: 1,
      received_beats: [],
    };
    if (endpoint === "beat-requests/user/my-submissions")
      return {
        success: true,
        count: 1,
        data: [
          {
            id: 1,
            track_id: 11,
            producer_id: user.id,
            submitted_at: "2026-11-03T05:00:00Z",
            track: fixture.track,
            request: brief,
          },
        ],
        pagination: { total: 1, current_page: 1, last_page: 1, per_page: 20 },
      };
    if (endpoint === "beat-requests/user/my-requests")
      return {
        success: true,
        count: 1,
        data: [
          {
            ...brief,
            id: "22222222-2222-4222-8222-222222222222",
            user_id: user.id,
            user_name: "Avery Lane",
            content:
              "A laid-back instrumental for a late-night writing session.",
            submission_count: 2,
          },
        ],
      };
    return { success: true, data: [brief], count: 1 };
  }
  if (endpoint === "producer-dashboard/audio-recon")
    return {
      pagination: page([
        {
          id: 11,
          name: "Golden Hour",
          image: coverData(11),
          album: { id: 22, image: collectionCoverData(22) },
          artists: [{ id: 5, name: "Pine Avenue" }],
          scan_status: "complete",
          scan_readiness: "waiting",
          next_eligible_at: "2026-11-24T12:00:00Z",
          scanned_at: "2026-10-25T12:00:00Z",
          artist_verified: true,
          findings_count: 1,
        },
      ]),
      schedule: { next_batch_at: "2026-11-04T02:15:00Z", rescan_days: 30 },
      summary: {
        tracks_with_findings: 1,
        findings_count: 1,
        verified_tracks: 1,
        checked_tracks: 1,
        processing: 0,
        failed: 0,
      },
    };
  if (endpoint === "tracks/11/placements")
    return {
      placements: [
        {
          id: 1,
          title: "Open Windows",
          artist_name: "Mira Sol",
          album_name: "Quiet Mornings",
          release_date: "2026-09-12",
          confidence_score: 94,
          youtube_video_id: "demoBeat001",
          youtube_url: "https://www.youtube.com/watch?v=demoBeat001",
        },
      ],
      artist_verified: true,
      scan_status: "complete",
      scanned_at: "2026-10-25T12:00:00Z",
      total_count: 1,
    };
  if (endpoint === "messaging/conversations")
    return {
      data: demoPeople.map((p, i) => ({
        id: 77 + i,
        type: "direct",
        other_participant: p,
        members: [p],
        unread_count: i ? 1 : 0,
        is_pinned: i === 0,
        can_pin: true,
        can_send: true,
        can_report: true,
        is_archived: false,
        is_restricted: false,
        last_message: {
          id: 700 + i,
          user_id: p.id,
          message_text: i
            ? "I added a second idea to the playlist."
            : "That piano part fits the chorus beautifully.",
          created_at: now,
          is_read: true,
        },
      })),
      next_offset: null,
    };
  if (/^messaging\/conversations\/\d+\/messages$/.test(endpoint))
    return {
      features: { reactions: true },
      data: [
        [
          "Golden Hour has the piano sound I was looking for.",
          19,
        ],
        ["Yes. I saved it in After Hours with two other ideas.", 19],
        [
          "Nice. Check each beat’s licensing option when you’re ready.",
          99,
        ],
        ["Will do. That piano part fits the chorus beautifully.", 19],
      ].map(([message_text, user_id], i) => ({
        id: 601 + i,
        conversation_id: 77,
        user_id,
        message_text,
        created_at: `2026-11-03T04:${10 + i}:00Z`,
        is_read: true,
        status: "read",
        user:
          user_id === 99
            ? {
                id: 99,
                username: "averylane",
                display_name: "Avery Lane",
                avatar: "/browser-smoke-avatar.svg",
              }
            : demoPeople[0],
        reactions: i === 4 ? [{ emoji: "❤️", count: 1, reacted: true }] : [],
      })),
      next_cursor: null,
    };
  if (/^messaging\/conversations\/\d+\/(read|typing|presence)$/.test(endpoint))
    return { status: "success" };
  if (endpoint === "messaging/followed-users/ids")
    return {
      ids: demoPeople.map((person) => person.id),
      account_followed_ids: demoPeople.map((person) => person.id),
    };
  if (endpoint === "messaging/unread-count") return { count: 1 };
  if (
    endpoint === "messaging/followed-users" ||
    endpoint === "messaging/search-users"
  )
    return { data: demoPeople };
  if (endpoint.includes("follow-status"))
    return { following: true, is_following: true };
  if (endpoint === "notifications/mark-as-read") {
    if (fixture) fixture.__docsNotificationsRead = true;
    return { status: "success", unreadCount: 0 };
  }
  if (endpoint === "notifications")
    return {
      status: "success",
      pagination: page(
        [
          [
            "Pine Avenue uploaded a new track",
            "Golden Hour is ready for your next listening session.",
            "/track/11/golden-hour",
          ],
          [
            "Mira Sol started following you",
            "Open their profile and say hello.",
            "/user/19/@mirasol",
          ],
          [
            "June Keys submitted a beat to your request",
            "Your request has a new beat to review.",
            "/library/custom-requests",
          ],
          [
            "Your playlist invitation",
            "Mira invited you to collaborate on After Hours.",
            "/playlist/30/after-hours",
          ],
        ].map(([title, message, action], i) => ({
          id: "demo-alert-" + i,
          type: "demo",
          read_at: fixture?.__docsNotificationsRead || i > 1 ? now : null,
          created_at: now,
          data: {
            image: [
              coverData(11),
              avatarData("Mira Sol"),
              avatarData("June Keys"),
              "data:image/svg+xml," +
                encodeURIComponent(
                  coverSvg("cover", "After Hours", "Avery Lane"),
                ),
            ][i],
            title,
            message,
            mainAction: { label: "Open", action },
          },
        })),
      ),
    };
  if (endpoint.startsWith("verify-license/"))
    return {
      valid: true,
      integrity_verified: true,
      status: "active",
      license_uuid: "00000000-0000-4000-8000-000000000001",
      track_name: "Golden Hour",
      track_artists: ["Pine Avenue"],
      user_email_masked: "a***@example.test",
      license_type: "non_exclusive",
      issued_at: "2026-10-20T14:00:00Z",
      expires_at: null,
    };
  return undefined;
}
export function improveResponse(endpoint, body, params) {
  body = normaliseDemo(body);
  if (endpoint === "artists/5/producer-analytics" && body.playGrowth)
    Object.assign(body.playGrowth, { currentPlays: 8400, previousPlays: 7000, rate: 20 });
  if (endpoint === "users/me/liked-tracks" && body.pagination?.data) {
    body.pagination.data = body.pagination.data.slice(0, 6);
    Object.assign(body.pagination, {
      total: body.pagination.data.length,
      from: 1,
      to: body.pagination.data.length,
      current_page: 1,
      last_page: 1,
    });
  }
  if (endpoint === "pro/5/status" && body.canonical_url)
    body.canonical_url = "https://open.beatpass.ca/pro/5/pine-avenue";
  if (endpoint === "artists/5/pinned-track")
    body.proPageFeature = { available: true, reason: null };
  if (endpoint === "user/licenses") {
    const rows = Array.isArray(body)
      ? body
      : body.pagination?.data || body.data;
    if (Array.isArray(rows)) {
      rows.splice(2);
      rows.forEach((license, i) => {
        Object.assign(license, {
          track_name: beatNames[i],
          track_artists: ["Pine Avenue"],
          is_valid: true,
          integrity_valid: true,
          certificate_state: "active",
          certificate_issues: [],
          review_reason: null,
          next_actions: structuredClone(rows[0].next_actions || []),
        });
        if (license.track)
          license.track = {
            ...license.track,
            id: 11 + i,
            name: beatNames[i],
            image: coverData(11 + i),
          };
      });
      const pagination = body.pagination || body;
      Object.assign(pagination, {
        total: rows.length,
        per_page: rows.length,
        from: rows.length ? 1 : 0,
        to: rows.length,
        last_page: 1,
        current_page: 1,
      });
    }
  }
  if (
    /^artists\/5\/catalog\/(tracks|albums)$/.test(endpoint) &&
    body.items?.length
  ) {
    const albums = endpoint.endsWith("albums");
    body.items = Array.from({ length: 3 }, (_, i) => ({
      ...body.items[0],
      id: (albums ? 22 : 11) + i,
      name: albums
        ? [
            "After Hours, Vol. 1",
            "Open Windows",
            "Studio Notes",
            "Warm Weather",
            "City Lights",
            "Quiet Mornings",
          ][i]
        : beatNames[i],
      audiencePlays: (albums ? [13500, 11800, 9200] : [3120, 2740, 1890])[i],
      ...(!albums ? { proPageFeature: { available: true, reason: null } } : {}),
      image: albums ? collectionCoverData(22 + i) : coverData(11 + i),
      updatedAt: `2026-10-${28 - i}T14:00:00Z`,
      ...(albums ? { trackCount: 4 + i } : {}),
      artists: [
        {
          id: 5,
          name: "Pine Avenue",
          image: "/browser-smoke-avatar.svg",
          verified: true,
        },
      ],
    }));
    const query = params?.get("query")?.toLowerCase() || "";
    if (query)
      body.items = body.items.filter((item) =>
        item.name.toLowerCase().includes(query),
      );
    body.pagination = {
      ...body.pagination,
      total: body.items.length,
      from: body.items.length ? 1 : null,
      to: body.items.length || null,
    };
  }
  if (endpoint === "artists/5/catalog/summary")
    body = {
      ...body,
      total: 3,
      released: 3,
      upcoming: 0,
      empty: 0,
      needsReview: 0,
    };

  return body;
}
export function collectionCoverData(id) {
  const index = Math.abs(id - 22) % 6;
  return (
    "data:image/svg+xml," +
    encodeURIComponent(coverSvg("cover", collectionNames[index]))
  );
}
export function coverData(id) {
  return (
    "data:image/svg+xml," +
    encodeURIComponent(coverSvg("track", beatNames[Math.abs(id - 11) % 6]))
  );
}
export function coverSvg(kind = "track", title, creator = "Pine Avenue") {
  const palettes = [
    ["#4c253c", "#d58d64", "#f4d6a0"],
    ["#183f45", "#7bb3a4", "#e5e9b8"],
    ["#27294b", "#8989c4", "#e9bdc6"],
    ["#463319", "#bb9563", "#f2e5bd"],
    ["#143552", "#5da9bc", "#d2e8ed"],
    ["#3c3a30", "#a9a18a", "#efcfa8"],
  ];
  const palette = title
    ? palettes[
        Math.max(0, beatNames.indexOf(title), collectionNames.indexOf(title))
      ]
    : kind === "avatar"
    ? ["#183f45", "#7bb3a4", "#f6d8a5"]
    : kind === "cover"
    ? ["#273651", "#b07875", "#f3d19a"]
    : ["#4c253c", "#d58d64", "#f4d6a0"];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${
    palette[0]
  }"/><stop offset="1" stop-color="${
    palette[1]
  }"/></linearGradient><pattern id="p" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M0 20L20 0" stroke="white" stroke-opacity=".05"/></pattern></defs><rect width="600" height="600" fill="url(#g)"/><circle cx="450" cy="165" r="190" fill="${
    palette[2]
  }" opacity=".85"/><path d="M-50 480Q150 180 650 470V700H-50Z" fill="${
    palette[0]
  }"/><path d="M-20 560Q160 300 620 550" fill="none" stroke="${
    palette[2]
  }" stroke-width="12"/><rect width="600" height="600" fill="url(#p)"/><text x="42" y="470" font-family="sans-serif" font-size="25" fill="white" letter-spacing="7">${creator.toUpperCase()}</text><text x="39" y="525" font-family="sans-serif" font-weight="700" font-size="36" fill="white">${
    kind === "cover"
      ? (title || "After Hours").toUpperCase()
      : kind === "avatar"
      ? "STUDIO NOTES"
      : title
      ? title.toUpperCase()
      : "GOLDEN HOUR"
  }</text></svg>`;
}
