import {
  buildingArchitectureProfile,
  buildingProductionFormProfile,
  objectiveFocalAnatomyProfile,
  objectiveProductionFormProfile,
  squadBodySilhouetteProfile,
  squadProductionFormProfile
} from "./production-form-polish.mjs";

const REQUIRED_BUILDING_DEPTH_GLYPHS = 12;
const REQUIRED_SQUAD_DEPTH_GLYPHS = 12;
const REQUIRED_OBJECTIVE_DEPTH_GLYPHS = 12;
const REQUIRED_RUNTIME_STATE_DEPTHS = 4;
const REQUIRED_GROUNDED_ENTITIES = 10;

export function summarizeShowcaseDepthFidelity({
  buildings = [],
  squads = [],
  objectives = [],
  buildingDefinitions,
  squadDefinitions,
  objectiveDefinitions
} = {}) {
  const buildingProfiles = collectionValues(buildings).map((building) => buildingDepthFidelityProfile(building, { buildingDefinitions }));
  const squadProfiles = collectionValues(squads).map((squad) => squadDepthFidelityProfile(squad, { squadDefinitions }));
  const objectiveProfiles = collectionValues(objectives).map((objective) => objectiveDepthFidelityProfile(objective, { objectiveDefinitions }));
  const buildingDepthGlyphKinds = uniqueSorted(buildingProfiles.flatMap((profile) => profile.depthGlyphs));
  const squadDepthGlyphKinds = uniqueSorted(squadProfiles.flatMap((profile) => profile.depthGlyphs));
  const objectiveDepthGlyphKinds = uniqueSorted(objectiveProfiles.flatMap((profile) => profile.depthGlyphs));
  const runtimeStateDepthKinds = uniqueSorted([
    ...buildingProfiles.map((profile) => profile.stateLayer),
    ...squadProfiles.map((profile) => profile.stateLayer),
    ...objectiveProfiles.map((profile) => profile.stateLayer)
  ]);
  const groundedEntityCount = [
    ...buildingProfiles,
    ...squadProfiles,
    ...objectiveProfiles
  ].filter((profile) => profile.depthReady).length;

  const missingDepthPillars = [
    buildingDepthGlyphKinds.length >= REQUIRED_BUILDING_DEPTH_GLYPHS ? null : "building_depth",
    squadDepthGlyphKinds.length >= REQUIRED_SQUAD_DEPTH_GLYPHS ? null : "squad_depth",
    objectiveDepthGlyphKinds.length >= REQUIRED_OBJECTIVE_DEPTH_GLYPHS ? null : "objective_depth",
    runtimeStateDepthKinds.length >= REQUIRED_RUNTIME_STATE_DEPTHS ? null : "runtime_state_depth",
    groundedEntityCount >= REQUIRED_GROUNDED_ENTITIES ? null : "grounded_entity_count"
  ].filter(Boolean);

  return {
    showcaseDepthFidelityPass: missingDepthPillars.length === 0,
    missingDepthPillars,
    depthSurfaceKinds: uniqueSorted([
      buildingDepthGlyphKinds.length >= REQUIRED_BUILDING_DEPTH_GLYPHS ? "building_depth" : null,
      squadDepthGlyphKinds.length >= REQUIRED_SQUAD_DEPTH_GLYPHS ? "squad_depth" : null,
      objectiveDepthGlyphKinds.length >= REQUIRED_OBJECTIVE_DEPTH_GLYPHS ? "objective_depth" : null,
      runtimeStateDepthKinds.length >= REQUIRED_RUNTIME_STATE_DEPTHS ? "runtime_state_depth" : null
    ]),
    buildingDepthKinds: uniqueSorted(buildingProfiles.map((profile) => profile.depthKind)),
    squadDepthKinds: uniqueSorted(squadProfiles.map((profile) => profile.depthKind)),
    objectiveDepthKinds: uniqueSorted(objectiveProfiles.map((profile) => profile.depthKind)),
    buildingDepthGlyphKinds,
    squadDepthGlyphKinds,
    objectiveDepthGlyphKinds,
    runtimeStateDepthKinds,
    groundedEntityCount
  };
}

export function buildingDepthFidelityProfile(building = {}, context = {}) {
  const definition = definitionFor(context.buildingDefinitions, building.buildingId ?? building.id) ?? building;
  const authored = {
    ...definition,
    ...building,
    mapPresentation: building.mapPresentation ?? definition.mapPresentation
  };
  const art = authored.mapPresentation ?? {};
  const form = buildingProductionFormProfile(authored);
  const architecture = buildingArchitectureProfile(authored);
  const depthKind = buildingDepthKind(art, architecture);
  const contactLayer = buildingContactLayer(art, architecture);
  const castLayer = buildingCastLayer(art, architecture);
  const occlusionLayer = buildingOcclusionLayer(art, architecture);
  const materialLayer = form.materialCue === "flat_fill" ? "" : `${form.materialCue}_depth`;
  const stateLayer = buildingStateDepthLayer(building);
  const depthGlyphs = uniqueSorted([
    contactLayer,
    castLayer,
    occlusionLayer,
    materialLayer,
    stateLayer,
    artless(art) ? null : "plinth_ground_occlusion"
  ]);

  return {
    id: building.id ?? definition.id ?? "unknown_building",
    depthKind,
    contactLayer,
    castLayer,
    occlusionLayer,
    materialLayer,
    stateLayer,
    depthGlyphs,
    depthReady: !artless(art)
      && form.materialCue !== "flat_fill"
      && architecture.architectureKind !== "generic_structure"
      && depthGlyphs.length >= 5
  };
}

export function squadDepthFidelityProfile(squad = {}, context = {}) {
  const definition = definitionFor(context.squadDefinitions, squad.squadId ?? squad.id) ?? squad;
  const authored = {
    ...definition,
    ...squad,
    mapPresentation: squad.mapPresentation ?? definition.mapPresentation
  };
  const art = authored.mapPresentation ?? {};
  const form = squadProductionFormProfile(authored);
  const body = squadBodySilhouetteProfile(authored);
  const depthKind = squadDepthKind(art, form, body);
  const contactLayer = squadContactLayer(art, form, body);
  const castLayer = squadCastLayer(art, form);
  const occlusionLayer = squadOcclusionLayer(art, form, body);
  const formationLayer = squadFormationLayer(form);
  const stateLayer = squadStateDepthLayer(squad);
  const depthGlyphs = uniqueSorted([
    contactLayer,
    castLayer,
    occlusionLayer,
    formationLayer,
    stateLayer,
    artless(art) ? null : "standard_drop_shadow"
  ]);

  return {
    id: squad.id ?? definition.id ?? "unknown_squad",
    depthKind,
    contactLayer,
    castLayer,
    occlusionLayer,
    formationLayer,
    stateLayer,
    depthGlyphs,
    depthReady: !artless(art)
      && body.bodyKind !== "generic_body"
      && depthGlyphs.length >= 5
  };
}

export function objectiveDepthFidelityProfile(objective = {}, context = {}) {
  const definition = definitionFor(context.objectiveDefinitions, objective.id) ?? objective;
  const authored = {
    ...definition,
    ...objective,
    mapPresentation: objective.mapPresentation ?? definition.mapPresentation
  };
  const art = authored.mapPresentation ?? {};
  const form = objectiveProductionFormProfile(authored);
  const focal = objectiveFocalAnatomyProfile(authored);
  const depthKind = objectiveDepthKind(art, focal);
  const contactLayer = objectiveContactLayer(art, focal);
  const castLayer = objectiveCastLayer(art, focal);
  const recessLayer = objectiveRecessLayer(art, focal);
  const materialLayer = objectiveMaterialDepthLayer(form.materialCue);
  const stateLayer = objectiveStateDepthLayer(objective, definition);
  const depthGlyphs = uniqueSorted([
    contactLayer,
    castLayer,
    recessLayer,
    materialLayer,
    stateLayer
  ]);

  return {
    id: objective.id ?? definition.id ?? "unknown_objective",
    depthKind,
    contactLayer,
    castLayer,
    recessLayer,
    materialLayer,
    stateLayer,
    depthGlyphs,
    depthReady: !artless(art)
      && form.materialCue !== "flat_fill"
      && focal.focalFrameKind !== "generic_objective_frame"
      && depthGlyphs.length >= 5
  };
}

function buildingDepthKind(art, architecture) {
  if (art.silhouette === "keep" || art.accent === "seat") {
    return "tall_keep_depth";
  }
  if (architecture.silhouetteDepth?.includes("vertical")) {
    return "vertical_stack_depth";
  }
  if (architecture.silhouetteDepth?.includes("recessed")) {
    return "recessed_worksite_depth";
  }
  if (architecture.silhouetteDepth?.includes("wide") || architecture.silhouetteDepth?.includes("broad")) {
    return "wide_roof_depth";
  }
  if (architecture.silhouetteDepth?.includes("raised")) {
    return "raised_lodge_depth";
  }
  if (artless(art)) {
    return "flat_placeholder_depth";
  }
  return "compact_plinth_depth";
}

function buildingContactLayer(art, architecture) {
  if (art.silhouette === "keep" || art.accent === "seat") {
    return "heavy_contact_shadow";
  }
  if (art.silhouette === "mine") {
    return "pit_contact_shadow";
  }
  if (architecture.silhouetteDepth?.includes("vertical")) {
    return "narrow_contact_shadow";
  }
  if (architecture.silhouetteDepth?.includes("wide") || architecture.silhouetteDepth?.includes("broad")) {
    return "wide_contact_shadow";
  }
  if (artless(art)) {
    return "flat_contact_shadow";
  }
  return "compact_contact_shadow";
}

function buildingCastLayer(art, architecture) {
  if (art.silhouette === "keep" || art.accent === "seat") {
    return "spire_cast_shadow";
  }
  if (art.silhouette === "farm" || art.accent === "food") {
    return "thatch_cast_shadow";
  }
  if (art.silhouette === "market") {
    return "canopy_cast_shadow";
  }
  if (art.silhouette === "mine") {
    return "pit_lip_cast_shadow";
  }
  if (architecture.rooflineKind?.includes("spire")) {
    return "needle_cast_shadow";
  }
  if (architecture.rooflineKind?.includes("roof") || architecture.rooflineKind?.includes("gable")) {
    return "roof_cast_shadow";
  }
  if (artless(art)) {
    return "flat_cast_shadow";
  }
  return "facade_cast_shadow";
}

function buildingOcclusionLayer(art, architecture) {
  if (art.silhouette === "keep" || art.accent === "seat") {
    return "buttress_inner_shadow";
  }
  if (art.silhouette === "mine") {
    return "pit_mouth_occlusion";
  }
  if (art.silhouette === "market") {
    return "stall_inner_shadow";
  }
  if (architecture.facadeLayerKind?.includes("bays")) {
    return "bay_inner_shadow";
  }
  if (architecture.facadeLayerKind?.includes("arch")) {
    return "arch_inner_shadow";
  }
  if (artless(art)) {
    return "blank_facade_shadow";
  }
  return "eave_inner_shadow";
}

function buildingStateDepthLayer(building) {
  if (building.active === false) {
    return "construction_depth_scaffold";
  }
  if (building.active === true) {
    return "active_lantern_depth";
  }
  return "authored_static_depth";
}

function squadDepthKind(art, form, body) {
  if (form.footprint === "wedge" || body.massKind?.includes("cavalry")) {
    return "mounted_wedge_depth";
  }
  if (form.footprint === "line") {
    return "ranked_line_depth";
  }
  if (form.footprint === "ring") {
    return "ritual_circle_depth";
  }
  if (body.massKind?.includes("single")) {
    return "single_heavy_depth";
  }
  if (artless(art)) {
    return "flat_squad_depth";
  }
  return "clustered_squad_depth";
}

function squadContactLayer(art, form, body) {
  if (form.footprint === "wedge" || body.massKind?.includes("cavalry")) {
    return "hoof_contact_shadow";
  }
  if (body.massKind?.includes("flying")) {
    return "hover_contact_shadow";
  }
  if (body.massKind?.includes("single")) {
    return "heavy_body_contact_shadow";
  }
  if (artless(art)) {
    return "flat_squad_contact_shadow";
  }
  return "boot_contact_shadow";
}

function squadCastLayer(art, form) {
  if (form.equipmentCue === "lance") {
    return "lance_cast_shadow";
  }
  if (form.equipmentCue === "bow") {
    return "bow_arc_cast_shadow";
  }
  if (form.equipmentCue === "staff") {
    return "staff_cast_shadow";
  }
  if (form.equipmentCue === "claw") {
    return "claw_cast_shadow";
  }
  if (artless(art)) {
    return "flat_squad_cast_shadow";
  }
  return "shield_cast_shadow";
}

function squadOcclusionLayer(art, form, body) {
  if (form.footprint === "wedge" || body.massKind?.includes("cavalry") || body.massKind?.includes("mounted")) {
    return "overlapping_mounts";
  }
  if (body.massKind?.includes("ranged")) {
    return "rank_overlap_shadow";
  }
  if (body.massKind?.includes("ritual")) {
    return "ritual_overlap_shadow";
  }
  if (body.massKind?.includes("single")) {
    return "large_body_occlusion";
  }
  if (artless(art)) {
    return "flat_member_overlap";
  }
  return "front_rank_occlusion";
}

function squadFormationLayer(form) {
  if (form.footprint === "wedge") {
    return "wedge_depth_offsets";
  }
  if (form.footprint === "line") {
    return "rank_depth_offsets";
  }
  if (form.footprint === "ring") {
    return "ring_depth_offsets";
  }
  if (form.footprint === "pair") {
    return "pair_depth_offsets";
  }
  return "cluster_depth_offsets";
}

function squadStateDepthLayer(squad) {
  if (squad.selected) {
    return "selected_depth_halo";
  }
  if (squad.stance === "capture") {
    return "capture_intent_depth";
  }
  if (squad.stance === "retreat") {
    return "retreat_depth_trail";
  }
  return "active_squad_depth";
}

function objectiveDepthKind(art, focal) {
  if (art.silhouette === "crystal" || focal.focalFrameKind === "faceted_spire_frame") {
    return "faceted_vertical_depth";
  }
  if (art.silhouette === "pool" || focal.focalFrameKind === "basin_reflection_frame") {
    return "basin_reflection_depth";
  }
  if (art.silhouette === "ruin" || focal.focalFrameKind === "watcher_arch_frame") {
    return "arched_ruin_depth";
  }
  return artless(art) ? "flat_objective_depth" : "compact_objective_depth";
}

function objectiveContactLayer(art, focal) {
  if (art.silhouette === "crystal" || focal.focalFrameKind === "faceted_spire_frame") {
    return "crystal_contact_shadow";
  }
  if (art.silhouette === "pool" || focal.focalFrameKind === "basin_reflection_frame") {
    return "basin_contact_shadow";
  }
  if (art.silhouette === "ruin" || focal.focalFrameKind === "watcher_arch_frame") {
    return "ruin_contact_shadow";
  }
  return "objective_contact_shadow";
}

function objectiveCastLayer(art, focal) {
  if (art.silhouette === "crystal" || focal.focalFrameKind === "faceted_spire_frame") {
    return "facet_cast_shadow";
  }
  if (art.silhouette === "pool" || focal.focalFrameKind === "basin_reflection_frame") {
    return "crescent_cast_shadow";
  }
  if (art.silhouette === "ruin" || focal.focalFrameKind === "watcher_arch_frame") {
    return "arch_cast_shadow";
  }
  return "sigil_cast_shadow";
}

function objectiveRecessLayer(art, focal) {
  if (art.silhouette === "crystal" || focal.focalFrameKind === "faceted_spire_frame") {
    return "shard_cluster_recess";
  }
  if (art.silhouette === "pool" || focal.focalFrameKind === "basin_reflection_frame") {
    return "basin_inner_recess";
  }
  if (art.silhouette === "ruin" || focal.focalFrameKind === "watcher_arch_frame") {
    return "broken_arch_recess";
  }
  return "sigil_recess";
}

function objectiveMaterialDepthLayer(materialCue) {
  if (materialCue === "witchglass_cluster") {
    return "witchglass_refraction_depth";
  }
  if (materialCue === "moonlit_water") {
    return "moonlit_reflection_depth";
  }
  if (materialCue === "weathered_stone") {
    return "weathered_stone_depth";
  }
  return materialCue === "flat_fill" ? "" : `${materialCue}_depth`;
}

function objectiveStateDepthLayer(objective, definition) {
  if (objective.owner) {
    return "owner_depth_wash";
  }
  return objectiveProgressRatio(objective, definition) > 0 ? "capture_wake_depth" : "neutral_depth_haze";
}

function objectiveProgressRatio(objective, definition) {
  const captureSeconds = Math.max(1, definition?.captureSeconds ?? objective.captureSeconds ?? 1);
  const player = objective.progress?.player ?? 0;
  const enemy = objective.progress?.enemy ?? 0;
  return Math.max(0, Math.min(1, Math.max(player, enemy) / captureSeconds));
}

function artless(art = {}) {
  return !art.silhouette && !art.accent && !art.emblem;
}

function definitionFor(definitions, id) {
  if (!definitions || !id) {
    return null;
  }
  if (definitions instanceof Map) {
    return definitions.get(id) ?? null;
  }
  if (Array.isArray(definitions)) {
    return definitions.find((definition) => definition.id === id) ?? null;
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

function uniqueSorted(values) {
  return [...new Set(values)].filter(Boolean).sort();
}
