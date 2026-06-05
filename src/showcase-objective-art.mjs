import { objectiveSilhouetteProfile } from "./entity-art.mjs";
import { objectiveCompositionProfile } from "./map-composition.mjs";
import { objectiveCards } from "./objective-ui.mjs";
import { objectiveProductionFormProfile } from "./production-form-polish.mjs";
import { objectiveAuraProfile } from "./terrain-polish.mjs";
import { objectiveLandmarkProfile } from "./visual-density.mjs";

const REQUIRED_OBJECTIVE_IDS = ["moon_pool", "witchglass_shard", "watcher_ruin"];
const REQUIRED_OBJECTIVE_COUNT = 3;
const REQUIRED_SIGNATURE_GLYPHS = 12;
const REQUIRED_ANCHOR_GLYPHS = 7;
const REQUIRED_RUNTIME_TREATMENTS = 3;
const REQUIRED_STATE_TREATMENTS = 3;

export function summarizeShowcaseObjectiveArt({
  map = {},
  objectives = [],
  runtimeObjectives = [],
  objectiveDefinitions
} = {}) {
  const definitions = collectionValues(objectives);
  const definitionMap = objectiveDefinitions instanceof Map ? objectiveDefinitions : mapById(definitions);
  const definitionById = mapById(definitions);
  const runtime = collectionValues(runtimeObjectives);
  const objectiveIds = uniqueSorted(definitions.map((objective) => objective.id));
  const cards = objectiveCards(definitions, definitionMap);
  const profiles = definitions.map((objective) => objectiveArtFidelityProfile(objectiveWithMapPosition(objective, map), {
    map,
    objectiveDefinitions: definitionMap
  }));
  const runtimeProfiles = runtime.map((objective) => objectiveArtFidelityProfile(objective, {
    map,
    objectiveDefinitions: definitionMap,
    objectiveDefinition: definitionById.get(objective.id)
  }));
  const objectiveLandmarkKinds = uniqueSorted(profiles.map((profile) => profile.landmarkKind));
  const objectiveMaterialKinds = uniqueSorted(profiles.map((profile) => profile.materialCue));
  const objectiveFocalShapeKinds = uniqueSorted(profiles.map((profile) => profile.focalShape));
  const objectiveSignatureGlyphKinds = uniqueSorted(profiles.flatMap((profile) => profile.signatureGlyphs));
  const objectiveAnchorGlyphKinds = uniqueSorted(profiles.flatMap((profile) => profile.anchorGlyphs));
  const objectiveCardIconKinds = uniqueSorted(cards.map((card) => card.icon));
  const objectiveRuntimeTreatmentKinds = uniqueSorted(runtimeProfiles.map((profile) => profile.runtimeTreatment));
  const objectiveStateTreatmentKinds = uniqueSorted(runtimeProfiles.flatMap((profile) => profile.stateTreatmentGlyphs));

  const missingArtPillars = [
    hasRequiredObjectiveRoster(objectiveIds) ? null : "three_objective_roster",
    objectiveLandmarkKinds.length >= REQUIRED_OBJECTIVE_COUNT ? null : "distinct_objective_landmarks",
    objectiveMaterialKinds.length >= REQUIRED_OBJECTIVE_COUNT ? null : "distinct_objective_materials",
    objectiveCardIconKinds.length >= REQUIRED_OBJECTIVE_COUNT ? null : "objective_card_icons",
    objectiveFocalShapeKinds.length >= REQUIRED_OBJECTIVE_COUNT ? null : "objective_focal_shapes",
    objectiveSignatureGlyphKinds.length >= REQUIRED_SIGNATURE_GLYPHS ? null : "objective_signature_glyphs",
    objectiveAnchorGlyphKinds.length >= REQUIRED_ANCHOR_GLYPHS ? null : "objective_anchor_glyphs",
    objectiveRuntimeTreatmentKinds.length >= REQUIRED_RUNTIME_TREATMENTS ? null : "runtime_objective_treatments",
    objectiveStateTreatmentKinds.length >= REQUIRED_STATE_TREATMENTS ? null : "objective_state_treatments"
  ].filter(Boolean);

  return {
    showcaseObjectiveArtPass: missingArtPillars.length === 0,
    missingArtPillars,
    objectiveIds,
    objectiveLandmarkKinds,
    objectiveMaterialKinds,
    objectiveCardIconKinds,
    objectiveFocalShapeKinds,
    objectiveSignatureGlyphKinds,
    objectiveAnchorGlyphKinds,
    objectiveRuntimeTreatmentKinds,
    objectiveStateTreatmentKinds
  };
}

export function objectiveArtFidelityProfile(objective = {}, context = {}) {
  const definition = context.objectiveDefinition
    ?? definitionFor(context.objectiveDefinitions, objective.id)
    ?? objective;
  const art = objective.mapPresentation ?? context.art ?? definition?.mapPresentation ?? {};
  const positionedObjective = objectiveWithMapPosition({
    ...definition,
    ...objective,
    mapPresentation: art
  }, context.map);
  const silhouette = objectiveSilhouetteProfile(art);
  const landmark = objectiveLandmarkProfile(art);
  const form = objectiveProductionFormProfile({ ...definition, mapPresentation: art });
  const composition = objectiveCompositionProfile(positionedObjective, {
    map: context.map,
    terrainFeatures: context.terrainFeatures ?? context.map?.terrainFeatures ?? [],
    objectiveDefinition: definition,
    objectiveDefinitions: context.objectiveDefinitions
  });
  const stateTreatmentGlyphs = objectiveStateTreatmentGlyphs(objective, definition, art);
  const focalShape = objectiveFocalShapeKind(silhouette, landmark);

  return {
    objectiveId: objective.id ?? definition?.id ?? "unknown_objective",
    focalShape,
    materialCue: form.materialCue,
    landmarkKind: landmark.landmark,
    signatureGlyphs: objectiveSignatureGlyphs({ silhouette, landmark, form, composition, focalShape }),
    anchorGlyphs: composition.compositionGlyphs,
    stateTreatmentGlyphs,
    runtimeTreatment: runtimeObjectiveTreatmentKind(objective, definition, art, {
      focalShape,
      materialCue: form.materialCue,
      landmarkKind: landmark.landmark
    })
  };
}

function objectiveSignatureGlyphs({ silhouette, landmark, form, composition, focalShape }) {
  return uniqueSorted([
    silhouette.landmarkShape,
    silhouette.mass,
    landmark.landmark,
    landmark.verticality,
    form.materialCue,
    focalShape,
    ...silhouette.signatureMarks,
    ...landmark.props,
    ...form.detailGlyphs,
    ...composition.compositionGlyphs,
    ...composition.nearbyFeatureKinds.map((kind) => `near_${kind}`)
  ]);
}

function objectiveFocalShapeKind(silhouette, landmark) {
  if (silhouette.family === "pool" || landmark.landmark === "moon_basin") {
    return "low_moon_basin_reflection";
  }
  if (silhouette.family === "crystal" || landmark.landmark === "shard_cluster") {
    return "faceted_witchglass_spire";
  }
  if (silhouette.family === "ruin" || landmark.landmark === "watcher_arch") {
    return "arched_watcher_eye";
  }
  return "compact_objective_sigil";
}

function runtimeObjectiveTreatmentKind(objective, definition, art, profile) {
  if (!objective?.id) {
    return "";
  }
  const owner = objective.owner === "player" || objective.owner === "enemy" ? objective.owner : "neutral";
  const captureState = objectiveCaptureState(objective, definition);
  const accent = art.emblem ?? art.accent ?? "sigil";
  return `${objective.id}:${owner}:${captureState}:${accent}:${profile.materialCue}:${profile.focalShape}:${profile.landmarkKind}`;
}

function objectiveStateTreatmentGlyphs(objective, definition, art) {
  if (!objective?.id) {
    return [];
  }
  const owner = objective.owner === "player" || objective.owner === "enemy" ? objective.owner : "neutral";
  const progress = objectiveProgressRatio(objective, definition);
  const aura = objectiveAuraProfile({
    owner: objective.owner,
    accent: art.emblem ?? art.accent,
    progress,
    contested: objective.contested === true
  });
  return uniqueSorted([
    `owner_${owner}`,
    `capture_${objectiveCaptureState(objective, definition)}`,
    `aura_${aura.pulse}`,
    ...aura.glyphs
  ]);
}

function objectiveCaptureState(objective, definition) {
  if (objective.owner) {
    return "owned";
  }
  return objectiveProgressRatio(objective, definition) > 0 ? "claiming" : "idle";
}

function objectiveProgressRatio(objective, definition) {
  const captureSeconds = Math.max(1, definition?.captureSeconds ?? objective.captureSeconds ?? 1);
  const player = objective.progress?.player ?? 0;
  const enemy = objective.progress?.enemy ?? 0;
  return Math.max(0, Math.min(1, Math.max(player, enemy) / captureSeconds));
}

function objectiveWithMapPosition(objective, map = {}) {
  const position = map.objectivePositions?.[objective.id] ?? {};
  return { ...objective, ...position };
}

function hasRequiredObjectiveRoster(objectiveIds) {
  return REQUIRED_OBJECTIVE_IDS.every((id) => objectiveIds.includes(id));
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

function mapById(values) {
  return new Map(collectionValues(values).map((value) => [value.id, value]));
}

function uniqueSorted(values) {
  return [...new Set(values)].filter(Boolean).sort();
}
