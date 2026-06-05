const ANCHOR_RADIUS = 1.75;
const LANE_RADIUS = 3.5;
const NEARBY_RADIUS = 2.5;

export function objectiveCompositionProfile(objective = {}, context = {}) {
  const terrainFeatures = context.terrainFeatures ?? context.map?.terrainFeatures ?? [];
  const art = objective.mapPresentation
    ?? context.objectiveDefinition?.mapPresentation
    ?? definitionFor(context.objectiveDefinitions, objective.id)?.mapPresentation
    ?? {};
  const landmarkKind = objectiveLandmarkKind(art, objective.id);
  const expectedAnchorKind = anchorKindForLandmark(landmarkKind);
  const measuredFeatures = terrainFeatures.map((feature) => ({
    ...feature,
    normalizedKind: normalizeFeatureKind(feature.kind),
    distance: distanceToFeature(objective, feature)
  }));
  const anchor = measuredFeatures
    .filter((feature) => feature.normalizedKind === expectedAnchorKind)
    .sort((a, b) => a.distance - b.distance)[0] ?? null;
  const anchored = Boolean(anchor && anchor.distance <= ANCHOR_RADIUS);
  const laneApproaches = measuredFeatures.some((feature) => feature.normalizedKind === "path" && feature.distance <= LANE_RADIUS) ? 1 : 0;
  const nearbyFeatureKinds = uniqueSorted(measuredFeatures
    .filter((feature) => feature.distance <= NEARBY_RADIUS || (feature.normalizedKind === "path" && feature.distance <= LANE_RADIUS))
    .map((feature) => feature.normalizedKind));
  const compositionGlyphs = [`landmark_${landmarkKind}`];

  if (anchored) {
    compositionGlyphs.push(`anchor_${expectedAnchorKind}`);
  }
  if (laneApproaches > 0) {
    compositionGlyphs.push("lane_approach");
  }

  return {
    objectiveId: objective.id ?? "unknown_objective",
    landmarkKind,
    anchorKind: anchored ? expectedAnchorKind : "none",
    anchored,
    laneApproaches,
    nearbyFeatureKinds,
    compositionGlyphs,
    priority: anchored && laneApproaches > 0 ? 3 : anchored ? 2 : 1
  };
}

export function summarizeMapComposition(content = {}) {
  const map = content.map ?? {};
  const terrainFeatures = content.terrainFeatures ?? map.terrainFeatures ?? [];
  const profiles = (content.objectives ?? []).map((objective) => objectiveCompositionProfile(objective, {
    terrainFeatures,
    objectiveDefinitions: content.objectiveDefinitions
  }));

  return {
    mapId: map.id ?? content.mapId ?? "unknown_map",
    terrainFeatureCount: terrainFeatures.length,
    featureKindCount: uniqueSorted(terrainFeatures.map((feature) => normalizeFeatureKind(feature.kind))).length,
    objectiveCount: profiles.length,
    objectiveAnchorCount: profiles.filter((profile) => profile.anchored).length,
    laneApproachCount: profiles.filter((profile) => profile.laneApproaches > 0).length,
    objectiveLandmarkKinds: uniqueSorted(profiles.map((profile) => profile.landmarkKind)),
    objectiveAnchorKinds: uniqueSorted(profiles.filter((profile) => profile.anchored).map((profile) => profile.anchorKind)),
    compositionGlyphKinds: uniqueSorted(profiles.flatMap((profile) => profile.compositionGlyphs)),
    compositionPass: profiles.length > 0
      && profiles.every((profile) => profile.anchored && profile.laneApproaches > 0)
  };
}

function objectiveLandmarkKind(art = {}, objectiveId = "") {
  const silhouette = art.silhouette ?? "";
  const emblem = art.emblem ?? "";
  if (silhouette === "pool" || emblem === "moon" || objectiveId.includes("pool")) {
    return "pool";
  }
  if (silhouette === "crystal" || emblem === "shard" || objectiveId.includes("shard")) {
    return "crystal";
  }
  if (silhouette === "ruin" || emblem === "watcher" || objectiveId.includes("ruin")) {
    return "ruin";
  }
  return "sigil";
}

function anchorKindForLandmark(landmarkKind) {
  if (landmarkKind === "pool") {
    return "water";
  }
  if (landmarkKind === "ruin") {
    return "ruins";
  }
  return landmarkKind;
}

function normalizeFeatureKind(kind = "") {
  if (["lane", "road", "trail", "path"].includes(kind)) {
    return "path";
  }
  if (["pool", "river", "pond", "water"].includes(kind)) {
    return "water";
  }
  if (kind === "ruin") {
    return "ruins";
  }
  if (kind === "bramble") {
    return "grove";
  }
  return kind || "unknown";
}

function distanceToFeature(point = {}, feature = {}) {
  const x = Number(point.x);
  const y = Number(point.y);
  const left = Number(feature.x);
  const top = Number(feature.y);
  const right = left + Number(feature.w ?? 0);
  const bottom = top + Number(feature.h ?? 0);

  if (![x, y, left, top, right, bottom].every(Number.isFinite)) {
    return Number.POSITIVE_INFINITY;
  }

  const dx = x < left ? left - x : x > right ? x - right : 0;
  const dy = y < top ? top - y : y > bottom ? y - bottom : 0;
  return Math.hypot(dx, dy);
}

function definitionFor(definitions, id) {
  if (!definitions) {
    return null;
  }
  if (definitions instanceof Map) {
    return definitions.get(id) ?? null;
  }
  return definitions[id] ?? null;
}

function uniqueSorted(values) {
  return [...new Set(values)].filter(Boolean).sort();
}
