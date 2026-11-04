// Illustrative, internally coherent analytics only. All responses are intercepted
// in the isolated browser; these numbers do not claim production activity.
const metric = (data) => ({ datasets: [{ label: "Plays", data }] });
function period(params) {
  const zone = params.get("timezone") || "America/Toronto";
  const day = value => {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year:"numeric", month:"2-digit", day:"2-digit" }).formatToParts(new Date(value));
    const part = key => parts.find(p => p.type === key).value;
    return `${part("year")}-${part("month")}-${part("day")}`;
  };
  const start = new Date(day(params.get("startDate") || "2026-10-05T04:00:00Z") + "T00:00:00Z");
  const end = new Date(day(params.get("endDate") || "2026-11-04T04:59:59Z") + "T00:00:00Z");
  const count = Math.max(1, Math.min(31, Math.round((end - start) / 86400000) + 1));
  return Array.from({ length: count }, (_, i) => new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10));
}
export function insightsResponse(endpoint, fixture, params) {
  if (endpoint === "insights-report") {
    const dates = period(params);
    const multiplier = params.get("model")?.startsWith("artist") ? 7 : 1;
    const total = 1200 * multiplier;
    const weights = dates.map((_, i) => [15, 22, 18, 28, 36, 29, 41][i % 7] + i);
    const sum = weights.reduce((a, b) => a + b, 0);
    const values = weights.map((value) => Math.floor((value / sum) * total));
    values[values.length - 1] += total - values.reduce((a, b) => a + b, 0);
    const track = fixture.track;
    const names = ["Golden Hour", "Pocket Theory", "Night Garden", "Sunday Letters", "Blue Window"];
    const report = {
      plays: { ...metric(dates.map((date, i) => ({ date, label: date, value: values[i] }))), granularity: "day", total },
      devices: metric([{ label: "Desktop", value: 620 * multiplier }, { label: "Mobile", value: 410 * multiplier }, { label: "Tablet", value: 170 * multiplier }]),
      platforms: metric([{ label: "iOS", value: 380 * multiplier }, { label: "Windows", value: 360 * multiplier }, { label: "Android", value: 250 * multiplier }, { label: "macOS", value: 210 * multiplier }]),
      users: metric([["Mira Sol", 201, 460], ["June Keys", 202, 240], ["Guest Listeners", 0, 200], ["Nova Vale", 203, 180], ["Low Tide", 204, 120]].map(([label, id, value]) => ({ label, value: value * multiplier, model: { id, display_name: label, username: label.toLowerCase().replaceAll(" ", ""), model_type: "user", avatar: id ? "/browser-smoke-avatar.svg" : null } }))),
      tracks: metric(names.map((name, i) => ({ label: name, value: [1200, 1100, 1000, 950, 850][i], model: { ...track, model_type: "track", id: 11 + i, name } }))),
      locations: metric([["Canada", "ca", 540], ["United States", "us", 360], ["United Kingdom", "gb", 180], ["France", "fr", 72], ["Germany", "de", 48]].map(([label, code, value]) => ({ label, code, value: value * multiplier, percentage: value / 12 }))),
    };
    return { report: Object.fromEntries((params.get("metrics") || "plays").split(",").map((key) => [key, report[key] || metric([])])) };
  }
  if (endpoint === "tracks/11/engagement-metrics") {
    const dates = period(params);
    const plays = dates.map((_, i) => i === dates.length - 1 ? 1000 - Math.floor(1000 / dates.length) * i : Math.floor(1000 / dates.length));
    const rawDurations = dates.map((_, i) => [82, 88, 92, 86, 96, 90, 84][i % 7]);
    const factor = 88200 / rawDurations.reduce((sum, value, i) => sum + value * plays[i], 0);
    return { trackDuration: 120, hasDuration: true, metrics: {
      avgListenDuration: 88.2, avgCompletionRate: 73.5, totalListenTime: 88200,
      completedListens: 500, totalPlays: 1200, trackedPlays: 1000,
      eligiblePlays: 1120, qualifiedPlays: 1120, qualificationMode: "enforce",
      previousAvgDuration: 82, previousCompletionRate: 68.3333, hasEngagementData: true,
      listenDurationSeries: dates.map((date, i) => ({ date: date + "T12:00:00Z", avgDuration: rawDurations[i] * factor, avgCompletionRate: rawDurations[i] * factor / 120 * 100, plays: plays[i] })),
      completionBreakdown: { completed: 500, mostlyCompleted: 200, halfCompleted: 100, partial: 100, skipped: 100 },
    } };
  }
  if (endpoint === "pro/5/insights") {
    const current = {
      has_data: true,
      primary: { engaged_sessions: 1250, completed_licensing_actions: 75, actions_per_engaged_session: 0.06 },
      secondary: { meaningful_listens: 620, detail_opens: 245, commercial_intents: 144, meaningful_to_detail_open_rate: 245 / 620, meaningful_to_commercial_intent_rate: 144 / 620, recovery_attempts: 6, recovery_successes: 4, recovery_success_rate: 4 / 6, subscription_starts: 12, average_time_to_first_meaningful_play_ms: 39000, time_to_first_meaningful_play_samples: 620 },
      funnels: { non_member_standard: { standard_intents: 90, subscription_starts: 12, downloads_completed: 40, completion_rate: 40 / 90 }, member_standard: { standard_intents: 40, downloads_completed: 30, completion_rate: 0.75 }, exclusive: { exclusive_intents: 14, purchases_completed: 5, completion_rate: 5 / 14 } },
      revenue_by_currency: [{ currency: "CAD", amount_minor: 49500, minor_unit_factor: 100 }],
    };
    const comparison = (now, before) => ({ current: now, previous: before, absolute_change: now - before, relative_change: before ? (now - before) / before : null });
    return {
      artist_id: 5, availability: "analytics", data_status: "ready", instrumentation_started_on: "2026-08-01",
      range: { start: params.get("startDate"), end: params.get("endDate"), timezone: params.get("timezone") || "America/Toronto" },
      previous_range: { start: "2026-09-05T00:00:00Z", end: "2026-10-04T23:59:59Z", timezone: params.get("timezone") || "America/Toronto" },
      current, previous: { ...current, primary: { engaged_sessions: 1000, completed_licensing_actions: 60, actions_per_engaged_session: 0.06 } },
      comparisons: { completed_licensing_actions: comparison(75, 60), actions_per_engaged_session: comparison(0.06, 0.06) },
      dimensions: { traffic_sources: [["instagram", 680, 41], ["youtube", 340, 21], ["direct", 230, 13]].map(([value, engaged_sessions, completed_licensing_actions]) => ({ value, engaged_sessions, completed_licensing_actions, actions_per_engaged_session: completed_licensing_actions / engaged_sessions })), observed_sources: [], declared_channels: [] },
      definitions: { engaged_session: { label: "Engaged session", definition: "A session with meaningful activity on your Pro Page." }, meaningful_listen: { label: "Meaningful listen", definition: "A play that reached 30 seconds." }, completed_licensing_action: { label: "Completed licensing action", definition: "A confirmed download or purchase linked to your Pro Page." } },
    };
  }
}
