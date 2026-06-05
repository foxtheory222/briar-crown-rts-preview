export const REQUIRED_AUDIO_CATEGORIES = ["ui", "combat", "building", "victory", "defeat", "ambience"];
export const REQUIRED_AUDIO_FLOW_PURPOSES = [
  "ambience",
  "combat_hit",
  "combat_order",
  "construction",
  "defeat",
  "objective",
  "production",
  "ui_confirm",
  "ui_error",
  "victory"
];

const VICTORY_ROUTE_PURPOSES = [
  "ambience",
  "combat_hit",
  "combat_order",
  "construction",
  "objective",
  "production",
  "ui_confirm",
  "victory"
];
const DEFEAT_ROUTE_PURPOSES = ["ambience", "defeat"];

const FALLBACK_CUE = {
  id: "ui_confirm",
  category: "ui",
  waveform: "triangle",
  frequency: 440,
  seconds: 0.08,
  gain: 0.05
};

export function buildAudioCueIndex(audioPacks = []) {
  const cuesByCategory = new Map();
  const cuesById = new Map();
  for (const pack of audioPacks) {
    for (const cue of pack.cues ?? []) {
      cuesById.set(cue.id, cue);
      if (!cuesByCategory.has(cue.category)) {
        cuesByCategory.set(cue.category, cue);
      }
    }
  }
  return {
    cueCount: cuesById.size,
    cuesByCategory,
    cuesById,
    packId: audioPacks[0]?.id ?? null
  };
}

export function resolveAudioCue(index, category) {
  return index?.cuesByCategory?.get(category) ?? index?.cuesByCategory?.get("ui") ?? FALLBACK_CUE;
}

export function audioSummary(index) {
  return {
    packId: index?.packId ?? null,
    cueCount: index?.cueCount ?? 0,
    categories: REQUIRED_AUDIO_CATEGORIES.filter((category) => index?.cuesByCategory?.has(category))
  };
}

export function recordAudioCueEvent(events = [], cue = FALLBACK_CUE, {
  purpose = cue.category,
  at = 0,
  limit = 160
} = {}) {
  const next = [
    ...events,
    {
      id: cue.id,
      category: cue.category,
      purpose,
      at: Number(Number(at).toFixed(2))
    }
  ];
  return trimAudioEvents(next, limit);
}

export function summarizeAudioFlow(index, events = []) {
  const readyCategories = REQUIRED_AUDIO_CATEGORIES.filter((category) => index?.cuesByCategory?.has(category));
  const coveredCategories = sortedUnique(events.map((event) => event.category));
  const coveredPurposes = sortedUnique(events.map((event) => event.purpose));
  const missingCategories = REQUIRED_AUDIO_CATEGORIES.filter((category) => !coveredCategories.includes(category));
  const missingPurposes = REQUIRED_AUDIO_FLOW_PURPOSES.filter((purpose) => !coveredPurposes.includes(purpose)).sort();

  return {
    readyCategories,
    coveredCategories,
    missingCategories,
    requiredPurposes: REQUIRED_AUDIO_FLOW_PURPOSES,
    coveredPurposes,
    missingPurposes,
    eventCount: events.length,
    recentEvents: events.slice(-8),
    hasAmbience: coveredCategories.includes("ambience"),
    hasUi: coveredCategories.includes("ui"),
    hasBuilding: coveredCategories.includes("building"),
    hasCombat: coveredCategories.includes("combat"),
    hasVictory: coveredCategories.includes("victory"),
    hasDefeat: coveredCategories.includes("defeat"),
    hasUiError: coveredPurposes.includes("ui_error"),
    hasObjective: coveredPurposes.includes("objective"),
    hasProduction: coveredPurposes.includes("production"),
    hasCombatHit: coveredPurposes.includes("combat_hit"),
    hasCombatDeath: coveredPurposes.includes("combat_death"),
    complete: missingCategories.length === 0 && missingPurposes.length === 0,
    victoryRouteComplete: includesAll(coveredPurposes, VICTORY_ROUTE_PURPOSES),
    defeatRouteComplete: includesAll(coveredPurposes, DEFEAT_ROUTE_PURPOSES)
  };
}

function sortedUnique(values) {
  return [...new Set(values)].filter(Boolean).sort();
}

function includesAll(values, required) {
  return required.every((value) => values.includes(value));
}

function trimAudioEvents(events, limit) {
  if (events.length <= limit) {
    return events;
  }
  const anchors = [];
  for (const purpose of REQUIRED_AUDIO_FLOW_PURPOSES) {
    const anchor = events.find((event) => event.purpose === purpose);
    if (anchor) {
      anchors.push(anchor);
    }
  }
  const uniqueAnchors = uniqueEvents(anchors);
  const anchorKeys = new Set(uniqueAnchors.map(eventKey));
  const recent = events.slice(-limit).filter((event) => !anchorKeys.has(eventKey(event)));
  const recentBudget = Math.max(0, limit - uniqueAnchors.length);
  return [...uniqueAnchors, ...recent.slice(-recentBudget)];
}

function uniqueEvents(events) {
  const seen = new Set();
  return events.filter((event) => {
    const key = eventKey(event);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function eventKey(event) {
  return `${event.id}:${event.category}:${event.purpose}:${event.at}`;
}
