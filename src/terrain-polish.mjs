const FEATURE_PROFILES = {
  grove: {
    canopy: "bramble",
    palette: "moss",
    props: ["root_flares", "thorn_blooms", "leaf_motes"],
    motion: "sway"
  },
  crystal: {
    canopy: "open",
    palette: "violet_glass",
    props: ["crystal_shards", "glint_facets", "scatter_sparks"],
    motion: "shimmer"
  },
  ruins: {
    canopy: "broken",
    palette: "old_stone",
    props: ["fallen_arch", "moss_blocks", "crown_marks"],
    motion: "still"
  },
  water: {
    canopy: "open",
    palette: "moon_pool",
    props: ["reed_edges", "silver_rings", "bank_stones"],
    motion: "ripple"
  },
  path: {
    canopy: "open",
    palette: "packed_earth",
    props: ["wagon_ruts", "edge_stones", "dust_marks"],
    motion: "drift"
  }
};

const BACKDROP_BASE = {
  dawn: ["#293849", "#405742", "#77806c", "#a5987d"],
  day: ["#4d6271", "#466441", "#7a8a69", "#b7aa88"],
  dusk: ["#1d2033", "#2f3a38", "#6f7280", "#928777"],
  night: ["#101827", "#1f2f34", "#43505d", "#5c5960"]
};

const OWNER_AURAS = {
  player: { ringColor: "#8fd8ff", glowColor: "#dbeafe" },
  enemy: { ringColor: "#b48cff", glowColor: "#ede9fe" },
  neutral: { ringColor: "#d6c7a1", glowColor: "#f5f0dc" }
};

const ACCENT_GLYPHS = {
  briar: "thorn",
  crown: "crown",
  moon: "moon",
  trade: "road",
  witchglass: "shard"
};

const BUILDING_GROUND_PROFILES = [
  {
    groundKind: "command_apron",
    approachKind: "crown_road",
    glyphs: ["crown_threshold", "threshold_path"],
    accents: ["seat"],
    silhouettes: ["keep"]
  },
  {
    groundKind: "tilled_field",
    approachKind: "field_ruts",
    glyphs: ["field_rows", "threshold_path"],
    accents: ["food"],
    silhouettes: ["farm"]
  },
  {
    groundKind: "log_yard",
    approachKind: "log_drag",
    glyphs: ["saw_dust", "threshold_path"],
    accents: ["wood"],
    silhouettes: ["timber_yard"]
  },
  {
    groundKind: "pit_cut",
    approachKind: "cart_track",
    glyphs: ["pit_lantern", "threshold_path"],
    accents: ["gold"],
    silhouettes: ["mine"]
  },
  {
    groundKind: "martial_yard",
    approachKind: "drill_lane",
    glyphs: ["drill_marks", "threshold_path"],
    accents: ["war", "production", "cavalry", "defense", "siege", "engineering", "scout", "monster"],
    silhouettes: ["war_hall", "stables", "gate", "foundry", "workshop", "scout_lodge", "tower", "roost"]
  },
  {
    groundKind: "ritual_plinth",
    approachKind: "sigil_walk",
    glyphs: ["ritual_lines", "threshold_path"],
    accents: ["tech", "witchglass", "hero", "recovery", "elite", "mythic"],
    silhouettes: ["shrine", "temple", "council", "smithy", "infirmary", "cairn", "vault", "mythic_gate"]
  },
  {
    groundKind: "settlement_yard",
    approachKind: "hearth_path",
    glyphs: ["hearth_stones", "threshold_path"],
    accents: ["housing", "storage", "market"],
    silhouettes: ["cottage", "storehouse", "market"]
  }
];

export function terrainFeatureOrnamentProfile(feature = {}) {
  const kind = normalizeFeatureKind(feature.kind ?? feature.type ?? feature.silhouette);
  const accent = feature.accent ?? "";
  const base = FEATURE_PROFILES[kind] ?? FEATURE_PROFILES.grove;
  const props = [...base.props];

  if (accent === "crown" && !props.includes("crown_marks")) {
    props.push("crown_marks");
  }
  if (accent === "moon" && !props.includes("silver_rings")) {
    props.push("silver_rings");
  }

  return {
    canopy: base.canopy,
    palette: accent === "witchglass" ? "violet_glass" : base.palette,
    props: [...new Set(props)],
    motion: base.motion
  };
}

export function worldBackdropBands(backdrop = {}) {
  const time = BACKDROP_BASE[backdrop.time] ? backdrop.time : "dusk";
  const weather = backdrop.weather ?? "clear";
  const colors = BACKDROP_BASE[time];
  const mistLift = weather === "mist" || backdrop.biome === "briar_fen" ? 0.08 : 0;

  return [
    { role: "sky", color: colors[0], opacity: 0.88, offset: 0 },
    { role: "far_treeline", color: colors[1], opacity: 0.72, offset: 0.32 },
    { role: "mid_mist", color: colors[2], opacity: round2(0.9 + mistLift), offset: 0.58 },
    { role: "ground_haze", color: colors[3], opacity: 0.66, offset: 0.82 }
  ];
}

export function objectiveAuraProfile(objective = {}) {
  const owner = objective.owner === "player" || objective.owner === "enemy" ? objective.owner : "neutral";
  const accent = objective.accent ?? "";
  const progress = clamp01(objective.progress ?? 0);
  const glyph = ACCENT_GLYPHS[accent] ?? "sigil";
  const glyphs = [glyph, "capture_ticks"];
  const contested = objective.contested === true;

  if (contested) {
    glyphs.push("contested_sparks");
  }

  return {
    ringColor: OWNER_AURAS[owner].ringColor,
    glowColor: OWNER_AURAS[owner].glowColor,
    glyphs,
    pulse: contested ? "urgent" : progress > 0 ? "claiming" : "idle",
    radius: 32 + Math.round(progress * 20)
  };
}

export function buildingTerrainIntegrationProfile(building = {}, context = {}) {
  const art = resolveBuildingArt(building, context);
  const silhouette = art.silhouette ?? "";
  const accent = art.accent ?? "";
  const baseProfile = BUILDING_GROUND_PROFILES.find((profile) => (
    profile.accents.includes(accent) || profile.silhouettes.includes(silhouette)
  )) ?? BUILDING_GROUND_PROFILES[BUILDING_GROUND_PROFILES.length - 1];
  const factionGroundKind = building.owner === "enemy"
    ? "enemy_dread"
    : building.owner === "player" || building.owner === "ally"
      ? "player_briar"
      : "neutral_mist";
  const glyphs = buildingGroundGlyphs(factionGroundKind, baseProfile.glyphs);

  return {
    groundKind: baseProfile.groundKind,
    approachKind: baseProfile.approachKind,
    factionGroundKind,
    glyphs,
    grounded: Boolean(baseProfile.groundKind && baseProfile.approachKind && glyphs.includes("threshold_path"))
  };
}

function buildingGroundGlyphs(factionGroundKind, profileGlyphs) {
  if (factionGroundKind === "enemy_dread") {
    return [...new Set(["dread_wash", ...profileGlyphs])];
  }
  if (factionGroundKind === "player_briar") {
    const thresholdGlyphs = profileGlyphs.filter((glyph) => glyph === "threshold_path");
    const terrainGlyphs = profileGlyphs.filter((glyph) => glyph !== "threshold_path");
    return [...new Set(["briar_wash", ...terrainGlyphs, "root_edge", ...thresholdGlyphs])];
  }
  return [...new Set(["neutral_wash", ...profileGlyphs])];
}

export function terrainLightingProfile(content = {}) {
  const features = collectionValues(content.features);
  const objectives = collectionValues(content.objectives);
  const hasPath = features.some((feature) => normalizeFeatureKind(feature.kind ?? feature.type ?? feature.silhouette) === "path");
  const objectiveLightKinds = new Set();

  for (const objective of objectives) {
    const owner = objective.owner === "player" || objective.owner === "enemy" ? objective.owner : "neutral";
    const accent = ACCENT_GLYPHS[objective.accent] ?? objective.accent ?? "sigil";
    objectiveLightKinds.add(`${owner}_${accent}`);
  }

  return {
    laneGlow: hasPath ? "moonlit_path" : "soft_floor",
    objectiveLightCount: objectives.length,
    objectiveLightKinds: [...objectiveLightKinds].sort(),
    factionWashes: ["enemy_dread", "player_briar"],
    gridAlpha: { major: 0.072, minor: 0.032 },
    vignette: content.backdrop?.weather === "mist" ? "mist_edge" : "soft_edge"
  };
}

export function summarizeTerrainPolish(content = {}) {
  const features = collectionValues(content.features);
  const objectives = collectionValues(content.objectives);
  const buildings = collectionValues(content.buildings);
  const featurePropKinds = new Set();
  const auraGlyphKinds = new Set();
  const buildingGroundKinds = new Set();
  const buildingApproachKinds = new Set();
  const buildingGroundGlyphKinds = new Set();
  const buildingGroundProfiles = buildings.map((building) => buildingTerrainIntegrationProfile(building, {
    buildingDefinitions: content.buildingDefinitions
  }));

  for (const feature of features) {
    terrainFeatureOrnamentProfile(feature).props.forEach((prop) => {
      if (summaryVisibleKind(prop)) {
        featurePropKinds.add(prop);
      }
    });
  }
  for (const objective of objectives) {
    objectiveAuraProfile(objective).glyphs.forEach((glyph) => {
      auraGlyphKinds.add(glyph);
      if (glyph === "capture_ticks") {
        featurePropKinds.add(glyph);
      }
    });
  }
  for (const profile of buildingGroundProfiles) {
    buildingGroundKinds.add(profile.groundKind);
    buildingApproachKinds.add(profile.approachKind);
    profile.glyphs.forEach((glyph) => buildingGroundGlyphKinds.add(glyph));
  }

  return {
    featureProfiles: features.length,
    featurePropKinds: [...featurePropKinds].sort(),
    buildingGroundProfileCount: buildingGroundProfiles.length,
    buildingGroundKinds: [...buildingGroundKinds].sort(),
    buildingApproachKinds: [...buildingApproachKinds].sort(),
    buildingGroundGlyphKinds: [...buildingGroundGlyphKinds].sort(),
    buildingGroundPass: buildingGroundProfiles.length > 0 && buildingGroundProfiles.every((profile) => profile.grounded),
    backdropBands: worldBackdropBands(content.backdrop).length,
    objectiveAuras: objectives.length,
    auraGlyphKinds: [...auraGlyphKinds].sort(),
    lighting: terrainLightingProfile(content)
  };
}

function normalizeFeatureKind(kind = "") {
  if (kind === "lane" || kind === "road" || kind === "trail") {
    return "path";
  }
  if (kind === "pool" || kind === "river" || kind === "pond") {
    return "water";
  }
  if (kind === "ruin") {
    return "ruins";
  }
  if (kind === "bramble") {
    return "grove";
  }
  return FEATURE_PROFILES[kind] ? kind : "grove";
}

function collectionValues(collection) {
  if (!collection) {
    return [];
  }
  if (collection instanceof Map) {
    return [...collection.values()];
  }
  if (Array.isArray(collection)) {
    return collection;
  }
  return Object.values(collection);
}

function resolveBuildingArt(building, context = {}) {
  if (building.mapPresentation) {
    return building.mapPresentation;
  }
  const definition = definitionFor(context.buildingDefinitions, building.buildingId ?? building.id);
  return definition?.mapPresentation ?? {};
}

function definitionFor(collection, id) {
  if (!collection || !id) {
    return null;
  }
  if (collection instanceof Map) {
    return collection.get(id) ?? null;
  }
  if (Array.isArray(collection)) {
    return collection.find((entry) => entry.id === id) ?? null;
  }
  return collection[id] ?? null;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function summaryVisibleKind(kind) {
  return ["capture_ticks", "crystal_shards", "leaf_motes", "root_flares", "thorn_blooms", "wagon_ruts"].includes(kind);
}
