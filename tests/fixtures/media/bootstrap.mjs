// This self-contained function is serialized into Puppeteer's document initializer.
// Keep every value explicit: it must not close over Node imports or production data.
export function applyDemoBootstrap(data, fixture) {
  const {
    dark,
    name,
    themes,
    fontCss,
    artwork,
    collectionArtwork,
    logos,
    menus,
    peopleArtwork,
    audience,
    roleContract,
  } = fixture;
  if (name === "request-send") {
    // Match the original frontend freeze for the entire request figure. Export
    // timestamps remain real UTC time in the Node capture process.
    const NativeDate = globalThis.Date;
    const frozenNow = NativeDate.parse("2026-11-03T16:05:55.683Z");
    globalThis.Date = class extends NativeDate {
      constructor(...args) { super(...(args.length ? args : [frozenNow])); }
      static now() { return frozenNow; }
    };
  }
  const theme = themes[dark ? "dark" : "light"];
  Object.assign(data.themes.all[0].values, theme.values);
  Object.assign(data.themes.all[0], { font: theme.font, is_dark: dark });
  document.documentElement.style.setProperty(
    "--be-font-family",
    JSON.stringify(theme.font.family),
  );
  if (fontCss && !document.getElementById("docs-configured-fonts")) {
    const style = document.createElement("style");
    style.id = "docs-configured-fonts";
    style.textContent = fontCss;
    document.head.append(style);
  }

  // Progress awards use the eligible synthetic producer account.
  if (name === "dashboard" || name.startsWith("docs-progress"))
    data.user.id = 101;
  Object.assign(data.user, {
    display_name: "Avery Lane",
    username: "averylane",
    avatar: peopleArtwork["Avery Lane"],
    unread_notifications_count: 3,
  });
  if (data.user.first_name) data.user.first_name = "Avery";
  if (data.user.last_name) data.user.last_name = "Lane";
  if (data.user.artists?.length > 1)
    throw new Error("Demo account has multiple owned producer profiles");

  const names = [
    "Golden Hour",
    "Pocket Theory",
    "Night Garden",
    "Sunday Letters",
    "Blue Window",
    "Soft Landing",
  ];
  const collections = [
    "After Hours, Vol. 1",
    "Open Windows",
    "Studio Notes",
    "Warm Weather",
    "City Lights",
    "Quiet Mornings",
  ];
  function rename(value) {
    if (Array.isArray(value)) return value.map(rename);
    if (value && typeof value === "object") {
      for (const [key, item] of Object.entries(value))
        value[key] = rename(item);
      if (value.model_type === "track" && value.id) {
        const index = Math.abs(Number(value.id) - 11) % 6;
        Object.assign(value, {
          name: names[index],
          bpm: value.bpm || 96,
          key: value.key || "C",
          scale: value.scale || "minor",
          image: artwork[index],
        });
        if (name.startsWith("backstage-")) {
          value.album_id = 22;
          value.album = {
            id: 22,
            name: "After Hours, Vol. 1",
            image: artwork[1],
            model_type: "album",
          };
          value.tags = ["Piano", "Warm"].map((label, index) => ({
            id: 501 + index,
            name: label,
            display_name: label,
            type: "custom",
            model_type: "tag",
            created_at: "2026-10-20T12:00:00Z",
            updated_at: "2026-10-20T12:00:00Z",
          }));
        }
      }
      if (value.model_type === "album" && value.id) {
        const index = Math.abs(Number(value.id) - 22) % 6;
        value.name = collections[index];
        value.image = collectionArtwork[index];
      }
      if (
        value.model_type === "user" &&
        ["listener", "syntheticlistener"].includes(value.username)
      ) {
        value.display_name = "Avery Lane";
        value.username = "averylane";
      }
      if (value.model_type === "artist" && value.id === 5)
        value.name = "Pine Avenue";
      const personName = value.display_name || value.name;
      if (
        peopleArtwork[personName] &&
        ["user", "artist"].includes(value.model_type)
      ) {
        value.avatar = peopleArtwork[personName];
        value.image_small = peopleArtwork[personName];
        if (value.model_type === "artist")
          value.image = peopleArtwork[personName];
      }
      return value;
    }
    if (value === "Studio") return "Demo plan";
    if (value === "Studio Plus") return "Demo plan Plus";
    if (value === "Session") return "Demo plan option";
    if (typeof value === "string")
      return value
        .replaceAll("Smoke Producer", "Pine Avenue")
        .replaceAll("Smoke Track", "Golden Hour")
        .replaceAll("Smoke Album", "After Hours, Vol. 1")
        .replaceAll("Smoke Founder", "Avery Lane")
        .replaceAll("Synthetic listener", "Avery Lane")
        .replaceAll("Synthetic Listener", "Avery Lane")
        .replaceAll("syntheticlistener", "averylane")
        .replaceAll("Elena — Percussion & Sound", "Mira Sol");
    return value;
  }
  rename(data);
  if (!["customer", "producer"].includes(audience) || !roleContract?.[audience])
    throw new Error("Explicit source-backed audience contract is required");
  const declaredRole = roleContract[audience];
  data.user.id = audience === "producer" ? 101 : 99;
  data.user.permissions = declaredRole.permissions.map((permission, index) => ({
    id: 20000 + index,
    name: permission,
    restrictions:
      permission === "music.create" ? [{ name: "minutes", value: 60 }] : [],
  }));
  data.user.roles = [];
  if (audience === "customer") {
    data.user.artists = [];
    data.user.primary_artist = null;
    data.user.is_verified_artist = false;
    // All customer figures use the same explicitly subscribed demo member.
    // Existing billing/download fixture subscriptions retain their exact task states.
    if (!data.user.subscriptions?.some((subscription) => subscription.valid)) {
      data.user.subscriptions = [
        {
          id: 81,
          user_id: data.user.id,
          valid: true,
          active: true,
          product_id: 71,
          price_id: 710,
          product: {
            id: 71,
            name: "Demo plan",
            feature_list: ["High-quality audio file"],
            prices: [],
          },
          price: {
            id: 710,
            amount: 29,
            currency: "CAD",
            interval: "month",
            interval_count: 1,
          },
          gateway_name: "stripe",
          gateway_id: "demo-subscription",
          created_at: "2026-10-01",
          renews_at: "2026-12-01",
        },
      ];
    }
    for (const subscription of data.user.subscriptions) {
      if (subscription.active && subscription.valid && !subscription.ends_at)
        subscription.renews_at = "2026-12-01T00:00:00Z";
      subscription.product = {
        ...subscription.product,
        free: false,
        permissions: [{ id: 21001, name: "music.download", restrictions: [] }],
      };
    }
    const publicTrack = data.loaders.trackPage?.track;
    if (publicTrack) {
      publicTrack.owner_id = data.user.id + 1000;
      for (const artist of publicTrack.artists || [])
        if (artist.owner)
          artist.owner = { ...artist.owner, id: data.user.id + 1000 };
    }
    if (data.loaders.artistPage?.artist?.owner)
      data.loaders.artistPage.artist.owner.id = data.user.id + 1000;
  } else {
    const artist = data.user.artists?.find((profile) => profile.id === 5);
    if (!artist)
      throw new Error("Synthetic producer needs its one actual owned profile");
    artist.role = "artist";
    artist.owner = {
      ...artist.owner,
      id: data.user.id,
      display_name: data.user.display_name,
      username: data.user.username,
    };
    if (data.loaders.trackPage?.track)
      data.loaders.trackPage.track.owner_id = data.user.id;
    for (const profile of [
      data.loaders.artistPage?.artist,
      data.loaders.editArtistPage?.artist,
    ])
      if (profile?.id === 5)
        profile.owner = { ...profile.owner, id: data.user.id };
    data.user.artists = [artist];
    data.user.primary_artist = artist;
    data.user.subscriptions = [];
  }
  if (name === "user-profile" && data.loaders.userProfilePage?.user) {
    data.likes = { ...data.likes, track: { 11: true } };
    data.loaders.userProfilePage.user.links = [
      { id: 1, title: "My music", url: "https://avery.example.test/music" },
    ];
    Object.assign(data.loaders.userProfilePage.user, {
      id: data.user.id,
      display_name: data.user.display_name,
      username: data.user.username,
      avatar: data.user.avatar,
      artists: data.user.artists,
      primary_artist: data.user.primary_artist,
      roles: data.user.roles,
      permissions: data.user.permissions,
      is_verified_artist: false,
    });
  }
  window.__docsCaptureAudience = audience;
  if (
    !Array.isArray(menus) ||
    !menus.some((menu) => menu.positions?.includes("mobile-bottom"))
  )
    throw new Error(
      "Configured public navigation is required for documentation captures",
    );
  data.settings.menus = structuredClone(menus);
  if (["library", "docs-privacy", "desktop-listening"].includes(name))
    data.likes = {
      ...data.likes,
      track: Object.fromEntries(
        Array.from({ length: 6 }, (_, i) => [1000 + i, true]),
      ),
    };
  if (name === "docs-progress")
    localStorage.setItem(
      `producer.achievement-goal.v1.${data.user.id}`,
      JSON.stringify({ version: 1, goalKey: "production_master" }),
    );
  const savedQueue = localStorage.getItem("player.beatpass-player.queue");
  if (savedQueue) {
    const queue = rename(JSON.parse(savedQueue)).slice(0, 6);
    queue.forEach((item, index) => {
      item.id = 11 + index;
      Object.assign(item.meta, {
        id: 11 + index,
        name: names[index % 6],
        image: artwork[index % 6],
        artists: [{ id: 5, name: "Pine Avenue", verified: true }],
      });
    });
    localStorage.setItem("player.beatpass-player.queue", JSON.stringify(queue));
    localStorage.setItem(
      "player.beatpass-player.cuedMediaId",
      String(queue[0].id),
    );
    localStorage.setItem(
      "player.beatpass-player.cuedQueueEntryId",
      JSON.stringify(queue[0].queueEntryId),
    );
  }
  if (name === "docs-privacy")
    document.cookie = "beatpass_tracking_consent=; Max-Age=0; Path=/";
  Object.assign(data.settings.branding, {
    logo_light: logos.light,
    logo_light_mobile: logos.light,
    logo_dark: logos.dark,
    logo_dark_mobile: logos.dark,
  });
}
