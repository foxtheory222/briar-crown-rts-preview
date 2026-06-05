import {
  buildingSilhouetteProfile,
  objectiveSilhouetteProfile,
  squadSilhouetteProfile
} from "./entity-art.mjs";
import {
  buildingOrnamentProfile,
  objectiveLandmarkProfile,
  squadEquipmentProfile
} from "./visual-density.mjs";

export function buildingProductionFormProfile(building = {}) {
  const art = building.mapPresentation ?? {};
  const silhouette = buildingSilhouetteProfile(art);
  const ornament = buildingOrnamentProfile(art);
  const materialCue = buildingMaterialCue(art, silhouette);
  const specialGlyphs = specializedBuildingGlyphs(art);
  const detailGlyphs = uniqueSorted([
    materialCue === "flat_fill" ? null : materialCue,
    ornament.roof,
    ornament.banners ? "banner" : null,
    ...ornament.props,
    ...silhouette.signatureMarks,
    ...specialGlyphs
  ]).filter((glyph) => !MATERIAL_CUES.has(glyph) && !GENERIC_BUILDING_GLYPHS.has(glyph));

  return {
    id: building.id ?? "unknown_building",
    formKind: silhouette.family,
    mass: silhouette.mass,
    materialCue,
    detailGlyphs,
    polishReady: materialCue !== "flat_fill" && detailGlyphs.length >= 4
  };
}

export function buildingArchitectureProfile(building = {}) {
  const art = building.mapPresentation ?? {};
  const profile = buildingArchitectureFor(art);
  const silhouetteGlyphs = uniqueSorted(profile.silhouetteGlyphs);

  return {
    id: building.id ?? "unknown_building",
    architectureKind: profile.architectureKind,
    rooflineKind: profile.rooflineKind,
    facadeLayerKind: profile.facadeLayerKind,
    silhouetteDepth: profile.silhouetteDepth,
    silhouetteGlyphs,
    architecturePolishReady: profile.architectureKind !== "generic_structure" && silhouetteGlyphs.length >= 4
  };
}

export function squadProductionFormProfile(squad = {}) {
  const art = squad.mapPresentation ?? {};
  const silhouette = squadSilhouetteProfile(art);
  const equipment = squadEquipmentProfile(art);
  const motionCue = squadMotionCue(silhouette, equipment);
  const detailGlyphs = uniqueSorted([
    motionCue,
    equipment.weapon,
    equipment.shield ? "shield" : null,
    equipment.glow ? "glow_ring" : null,
    silhouette.roleStandard?.kind,
    ...(silhouette.roleStandard?.glyphs ?? []),
    ...silhouette.signatureMarks
  ]);

  return {
    id: squad.id ?? "unknown_squad",
    formKind: silhouette.family,
    footprint: silhouette.footprint,
    bodyCue: silhouette.memberShape,
    equipmentCue: equipment.weapon,
    motionCue,
    detailGlyphs,
    polishReady: detailGlyphs.length >= 4
  };
}

export function squadBodySilhouetteProfile(squad = {}) {
  const art = squad.mapPresentation ?? {};
  const silhouette = art.silhouette ?? "";
  const accent = art.accent ?? "";
  const emblem = art.emblem ?? "";
  const profile = squadBodyProfileFor({ silhouette, accent, emblem });
  const articulationGlyphs = uniqueSorted(profile.articulationGlyphs);

  return {
    id: squad.id ?? "unknown_squad",
    bodyKind: profile.bodyKind,
    poseKind: profile.poseKind,
    massKind: profile.massKind,
    readableScale: profile.readableScale,
    articulationGlyphs,
    bodyPolishReady: profile.bodyKind !== "generic_body" && articulationGlyphs.length >= 4
  };
}

export function objectiveProductionFormProfile(objective = {}) {
  const art = objective.mapPresentation ?? {};
  const silhouette = objectiveSilhouetteProfile(art);
  const landmark = objectiveLandmarkProfile(art);
  const materialCue = objectiveMaterialCue(silhouette, landmark);
  const detailGlyphs = uniqueSorted([
    landmark.landmark,
    ...landmark.props,
    ...silhouette.signatureMarks
  ]);

  return {
    id: objective.id ?? "unknown_objective",
    formKind: silhouette.family,
    mass: silhouette.mass,
    materialCue,
    detailGlyphs,
    polishReady: materialCue !== "flat_fill" && detailGlyphs.length >= 4
  };
}

export function objectiveFocalAnatomyProfile(objective = {}) {
  const art = objective.mapPresentation ?? {};
  const profile = objectiveFocalAnatomyFor(art);
  const anatomyGlyphs = uniqueSorted(profile.anatomyGlyphs);

  return {
    id: objective.id ?? "unknown_objective",
    focalFrameKind: profile.focalFrameKind,
    depthKind: profile.depthKind,
    anatomyGlyphs,
    focalPolishReady: profile.focalFrameKind !== "generic_objective_frame" && anatomyGlyphs.length >= 4
  };
}

export function summarizeProductionFormPolish(content = {}) {
  const buildingProfiles = collectionValues(content.buildings).map(buildingProductionFormProfile);
  const buildingArchitectureProfiles = collectionValues(content.buildings).map(buildingArchitectureProfile);
  const squadProfiles = collectionValues(content.squads).map(squadProductionFormProfile);
  const squadBodyProfiles = collectionValues(content.squads).map(squadBodySilhouetteProfile);
  const objectiveProfiles = collectionValues(content.objectives).map(objectiveProductionFormProfile);
  const objectiveFocalProfiles = collectionValues(content.objectives).map(objectiveFocalAnatomyProfile);

  return {
    buildingFormCount: buildingProfiles.length,
    squadFormCount: squadProfiles.length,
    objectiveFormCount: objectiveProfiles.length,
    buildingMaterialKinds: uniqueSorted(buildingProfiles.map((profile) => profile.materialCue)),
    buildingArchitectureProfileCount: buildingArchitectureProfiles.length,
    buildingArchitectureKinds: uniqueSorted(buildingArchitectureProfiles.map((profile) => profile.architectureKind)),
    buildingRooflineKinds: uniqueSorted(buildingArchitectureProfiles.map((profile) => profile.rooflineKind)),
    buildingFacadeLayerKinds: uniqueSorted(buildingArchitectureProfiles.map((profile) => profile.facadeLayerKind)),
    buildingSilhouetteGlyphKinds: uniqueSorted(buildingArchitectureProfiles.flatMap((profile) => profile.silhouetteGlyphs)),
    buildingArchitecturePolishPass: buildingArchitectureProfiles.every((profile) => profile.architecturePolishReady),
    squadEquipmentKinds: uniqueSorted(squadProfiles.map((profile) => profile.equipmentCue)),
    squadMotionKinds: uniqueSorted(squadProfiles.map((profile) => profile.motionCue)),
    squadBodyProfileCount: squadBodyProfiles.length,
    squadBodyKinds: uniqueSorted(squadBodyProfiles.map((profile) => profile.bodyKind)),
    squadBodyPoseKinds: uniqueSorted(squadBodyProfiles.map((profile) => profile.poseKind)),
    squadBodyArticulationKinds: uniqueSorted(squadBodyProfiles.flatMap((profile) => profile.articulationGlyphs)),
    squadBodyPolishPass: squadBodyProfiles.every((profile) => profile.bodyPolishReady),
    objectiveMaterialKinds: uniqueSorted(objectiveProfiles.map((profile) => profile.materialCue)),
    objectiveFocalFrameKinds: uniqueSorted(objectiveFocalProfiles.map((profile) => profile.focalFrameKind)),
    objectiveFocalDepthKinds: uniqueSorted(objectiveFocalProfiles.map((profile) => profile.depthKind)),
    objectiveFocalGlyphKinds: uniqueSorted(objectiveFocalProfiles.flatMap((profile) => profile.anatomyGlyphs)),
    objectiveFocalPolishPass: objectiveFocalProfiles.every((profile) => profile.focalPolishReady),
    buildingDetailGlyphKinds: uniqueSorted(buildingProfiles.flatMap((profile) => profile.detailGlyphs)),
    squadDetailGlyphKinds: uniqueSorted(squadProfiles.flatMap((profile) => profile.detailGlyphs)),
    objectiveDetailGlyphKinds: uniqueSorted(objectiveProfiles.flatMap((profile) => profile.detailGlyphs)),
    productionFormPass: [
      ...buildingProfiles.map((profile) => profile.polishReady),
      ...buildingArchitectureProfiles.map((profile) => profile.architecturePolishReady),
      ...squadProfiles.map((profile) => profile.polishReady),
      ...squadBodyProfiles.map((profile) => profile.bodyPolishReady),
      ...objectiveProfiles.map((profile) => profile.polishReady),
      ...objectiveFocalProfiles.map((profile) => profile.focalPolishReady)
    ].every(Boolean)
  };
}

const MATERIAL_CUES = new Set([
  "crowned_stone",
  "woven_thatch",
  "hewn_timber",
  "pit_stone",
  "martial_iron",
  "moonlit_masonry",
  "worked_plinth",
  "watch_perch",
  "beast_roost",
  "flat_fill"
]);

const GENERIC_BUILDING_GLYPHS = new Set(["banner", "door", "window"]);

function buildingMaterialCue(art, silhouette) {
  if (art.silhouette === "scout_lodge") {
    return "watch_perch";
  }
  if (art.silhouette === "roost") {
    return "beast_roost";
  }
  if (silhouette.family === "stronghold") {
    return art.emblem === "crown" ? "crowned_stone" : "worked_plinth";
  }
  if (silhouette.family === "homestead") {
    return "woven_thatch";
  }
  if (silhouette.family === "resource") {
    return art.silhouette === "mine" ? "pit_stone" : "hewn_timber";
  }
  if (silhouette.family === "production") {
    return "martial_iron";
  }
  if (silhouette.family === "ritual") {
    return "moonlit_masonry";
  }
  if (silhouette.family === "utility") {
    return "worked_plinth";
  }
  return "flat_fill";
}

function specializedBuildingGlyphs(art) {
  if (art.silhouette === "scout_lodge") {
    return ["high_roost", "signal_mast", "watch_slats", "wing_lattice"];
  }
  if (art.silhouette === "roost") {
    return ["bone_perches", "claw_scratches", "high_roost", "ribbed_nest"];
  }
  return [];
}

function buildingArchitectureFor(art = {}) {
  const silhouette = art.silhouette ?? "";
  const accent = art.accent ?? "";
  const emblem = art.emblem ?? "";

  if (silhouette === "keep" || accent === "seat") {
    return buildingArchitecture("crowned_keep", "crowned_spire", "buttressed_keep", "vertical", [
      "corner_towers", "crown_spire", "heavy_gate", "tiered_keep"
    ]);
  }
  if (silhouette === "tower") {
    return buildingArchitecture("watch_spire", "needle_spire", "buttressed_watch", "vertical", [
      "arrow_slits", "high_parapet", "needle_spire", "watch_buttress"
    ]);
  }
  if (silhouette === "cairn") {
    return buildingArchitecture("witchglass_cairn", "crystal_cairn", "facet_buttress", "vertical_cluster", [
      "crystal_cairn", "facet_buttress", "glow_well", "shard_crown"
    ]);
  }
  if (silhouette === "vault") {
    return buildingArchitecture("relic_vault", "vaulted_crown", "sealed_bays", "monolith", [
      "relic_lock", "sealed_bays", "vault_ribs", "vaulted_crown"
    ]);
  }
  if (silhouette === "mythic_gate") {
    return buildingArchitecture("mythic_gate", "portal_crown", "standing_stones", "portal", [
      "portal_crown", "rift_eye", "standing_stones", "threshold_runes"
    ]);
  }
  if (silhouette === "farm" || accent === "food") {
    return buildingArchitecture("food_homestead", "thatch_ridge", "split_farmhouse", "wide_low", [
      "field_rows", "low_fence", "split_farmhouse", "thatch_ridge"
    ]);
  }
  if (silhouette === "cottage" || accent === "housing") {
    return buildingArchitecture("cottage_cluster", "clustered_roofs", "hearth_windows", "low_cluster", [
      "chimney_smoke", "clustered_roofs", "hearth_windows", "low_fence"
    ]);
  }
  if (silhouette === "storehouse") {
    return buildingArchitecture("storehouse_block", "crate_gable", "stacked_crates", "compact_block", [
      "crate_gable", "loading_door", "stacked_crates", "storage_slats"
    ]);
  }
  if (silhouette === "market") {
    return buildingArchitecture("market_arcade", "canopy_row", "trade_arcade", "wide_low", [
      "canopy_row", "hanging_scales", "stall_posts", "trade_arcade"
    ]);
  }
  if (silhouette === "timber_yard" || accent === "wood") {
    return buildingArchitecture("timber_workyard", "beam_shed", "open_yard", "low_spread", [
      "beam_shed", "log_stack", "open_yard", "saw_frame"
    ]);
  }
  if (silhouette === "mine" || accent === "gold") {
    return buildingArchitecture("mine_cut", "timber_brace", "pit_facade", "recessed", [
      "cart_track", "pit_mouth", "stone_lip", "timber_brace"
    ]);
  }
  if (silhouette === "gate") {
    return buildingArchitecture("palisade_gate", "stake_palisade", "gate_crossbeam", "narrow_wall", [
      "gate_crossbeam", "palisade_teeth", "stake_palisade", "watch_gap"
    ]);
  }
  if (silhouette === "war_hall") {
    return buildingArchitecture("war_hall", "martial_ridge", "weapon_hall", "broad", [
      "banner_hooks", "training_gate", "weapon_hall", "weapon_rack"
    ]);
  }
  if (silhouette === "stables" || accent === "cavalry") {
    return buildingArchitecture("kennel_stables", "long_stable_roof", "stall_bays", "long_broad", [
      "hoof_arch", "long_stable_roof", "stall_bays", "tack_hooks"
    ]);
  }
  if (silhouette === "workshop" || accent === "engineering") {
    return buildingArchitecture("gear_workshop", "sawtooth_roof", "gear_bays", "broad", [
      "crane_hook", "gear_bays", "sawtooth_roof", "workbench_slats"
    ]);
  }
  if (silhouette === "foundry" || accent === "siege") {
    return buildingArchitecture("siege_foundry", "smoke_stacks", "forge_bays", "heavy_broad", [
      "anvil_bays", "forge_bays", "slag_pit", "smoke_stacks"
    ]);
  }
  if (silhouette === "scout_lodge" || accent === "scout") {
    return buildingArchitecture("scout_roost", "signal_roof", "perch_lattice", "raised_compact", [
      "perch_lattice", "signal_mast", "watch_slats", "wing_lattice"
    ]);
  }
  if (silhouette === "roost" || accent === "monster") {
    return buildingArchitecture("monster_roost", "bone_roof", "rib_nest", "raised_mass", [
      "bone_perches", "claw_scratches", "rib_nest", "wing_lattice"
    ]);
  }
  if (silhouette === "shrine" || accent === "hero") {
    return buildingArchitecture("hero_shrine", "votive_spire", "reliquary_front", "vertical", [
      "hero_altar", "reliquary_front", "votive_spire", "vow_banners"
    ]);
  }
  if (silhouette === "smithy") {
    return buildingArchitecture("moon_smithy", "arched_forge", "anvil_front", "arched", [
      "anvil_front", "arched_forge", "coal_eye", "hammer_beam"
    ]);
  }
  if (silhouette === "temple") {
    return buildingArchitecture("lore_temple", "moon_arch", "ritual_front", "arched", [
      "moon_arch", "ritual_front", "sigil_window", "staff_niche"
    ]);
  }
  if (silhouette === "infirmary" || accent === "recovery") {
    return buildingArchitecture("infirmary_hall", "healer_arch", "recovery_bays", "arched", [
      "cross_lintel", "healer_arch", "recovery_bays", "warm_lantern"
    ]);
  }
  if (silhouette === "council") {
    return buildingArchitecture("war_council", "bannered_arch", "council_dais", "tall_broad", [
      "bannered_arch", "council_dais", "map_table", "war_banners"
    ]);
  }
  return buildingArchitecture("generic_structure", "flat_roof", "blank_facade", "compact", ["block_body"]);
}

function buildingArchitecture(architectureKind, rooflineKind, facadeLayerKind, silhouetteDepth, silhouetteGlyphs) {
  return {
    architectureKind,
    rooflineKind,
    facadeLayerKind,
    silhouetteDepth,
    silhouetteGlyphs
  };
}

function squadMotionCue(silhouette, equipment) {
  if (silhouette.footprint === "wedge" || equipment.weapon === "lance") {
    return "charge_wedge";
  }
  if (silhouette.footprint === "line" || equipment.weapon === "bow") {
    return "volley_line";
  }
  if (silhouette.footprint === "ring" || equipment.weapon === "staff") {
    return "ritual_orbit";
  }
  if (silhouette.footprint === "single") {
    return silhouette.family === "siege" ? "siege_roll" : "heavy_stride";
  }
  if (silhouette.footprint === "pair") {
    return "wide_scout";
  }
  if (silhouette.family === "undead") {
    return "stagger_mob";
  }
  return "shield_block";
}

function squadBodyProfileFor({ silhouette, accent, emblem }) {
  if (silhouette.includes("wagon") || accent === "siege") {
    return {
      bodyKind: "siege_carriage",
      poseKind: "rolling_bed",
      massKind: "single_engine",
      readableScale: "large",
      articulationGlyphs: ["axle_bar", "ribbed_bed", "wheel_pair", "yoke_hooks"]
    };
  }
  if (accent === "elite" && (silhouette.includes("dread") || emblem === "dread")) {
    return {
      bodyKind: "dread_knight",
      poseKind: "heavy_charge",
      massKind: "elite_cavalry",
      readableScale: "large",
      articulationGlyphs: ["dread_helm", "grave_plate", "long_lance", "shield_boss"]
    };
  }
  if (accent === "elite" && (silhouette.includes("rider") || emblem === "rider")) {
    return {
      bodyKind: "elite_hunt_rider",
      poseKind: "antler_charge",
      massKind: "elite_cavalry",
      readableScale: "large",
      articulationGlyphs: ["antler_crown", "flowing_cloak", "long_lance", "mount_chest"]
    };
  }
  if (silhouette.includes("lancer") || silhouette.includes("rider") || silhouette.includes("knight") || accent === "cavalry") {
    if (silhouette.includes("crypt") || emblem === "crypt") {
      return {
        bodyKind: "crypt_lancer",
        poseKind: "crypt_charge",
        massKind: "mounted_squad",
        readableScale: "medium",
        articulationGlyphs: ["crypt_plate", "forward_wedge", "lance_couch", "mount_bones"]
      };
    }
    return {
      bodyKind: "mounted_lancer",
      poseKind: "charging_wedge",
      massKind: "mounted_squad",
      readableScale: "medium",
      articulationGlyphs: ["forward_wedge", "hoof_line", "long_lance", "mount_chest"]
    };
  }
  if (silhouette.includes("archer") || silhouette.includes("bow") || accent === "ranged") {
    if (emblem === "bow" || silhouette.includes("grave")) {
      return {
        bodyKind: "grave_bow",
        poseKind: "grave_volley",
        massKind: "ranked_ranged",
        readableScale: "medium",
        articulationGlyphs: ["back_rank", "bone_quiver", "bow_arc", "draw_string", "grave_hood"]
      };
    }
    return {
      bodyKind: "needle_archer",
      poseKind: "drawn_volley",
      massKind: "ranked_ranged",
      readableScale: "medium",
      articulationGlyphs: ["back_rank", "bow_arc", "draw_string", "quiver_spikes"]
    };
  }
  if (silhouette.includes("scout") || silhouette.includes("bat") || accent === "scout") {
    if (silhouette.includes("bat") || emblem === "bat") {
      return {
        bodyKind: "bat_flight",
        poseKind: "swoop_pair",
        massKind: "flying_pair",
        readableScale: "small",
        articulationGlyphs: ["bat_wing", "hook_claw", "membrane_arc", "wide_gap"]
      };
    }
    return {
      bodyKind: "moth_scout",
      poseKind: "flutter_pair",
      massKind: "flying_pair",
      readableScale: "small",
      articulationGlyphs: ["antenna_arc", "moth_wing", "tail_dust", "wide_gap"]
    };
  }
  if (silhouette.includes("ancient") || accent === "monster") {
    return {
      bodyKind: "bark_ancient",
      poseKind: "rooted_stride",
      massKind: "single_monster",
      readableScale: "large",
      articulationGlyphs: ["bark_plates", "canopy_crown", "root_arms", "trunk_body"]
    };
  }
  if (silhouette.includes("caster") || silhouette.includes("mourning") || accent === "caster") {
    if (silhouette.includes("mourning") || emblem === "choir") {
      return {
        bodyKind: "mourning_choir",
        poseKind: "dirge_orbit",
        massKind: "ritual_circle",
        readableScale: "medium",
        articulationGlyphs: ["choir_veil", "grave_halo", "open_mouth", "ritual_ring", "staff_glow"]
      };
    }
    return {
      bodyKind: "dew_chanter",
      poseKind: "chant_orbit",
      massKind: "ritual_circle",
      readableScale: "medium",
      articulationGlyphs: ["dew_bowl", "raised_staff", "ritual_ring", "robe_halo", "staff_glow"]
    };
  }
  if (silhouette.includes("thrall") || silhouette.includes("bone") || accent === "undead") {
    return {
      bodyKind: "rib_thrall",
      poseKind: "staggered_mob",
      massKind: "uneven_mob",
      readableScale: "medium",
      articulationGlyphs: ["crooked_spine", "rib_body", "skull_dot", "uneven_mob"]
    };
  }
  if (artless({ silhouette, accent, emblem })) {
    return {
      bodyKind: "generic_body",
      poseKind: "generic_pose",
      massKind: "generic_mass",
      readableScale: "small",
      articulationGlyphs: ["block_body"]
    };
  }
  return {
    bodyKind: "shieldwall_guard",
    poseKind: "braced_block",
    massKind: "ranked_infantry",
    readableScale: "medium",
    articulationGlyphs: ["front_rank", "knee_stance", "raised_shield", "shoulder_line"]
  };
}

function artless({ silhouette, accent, emblem }) {
  return !silhouette && !accent && !emblem;
}

function objectiveMaterialCue(silhouette, landmark) {
  if (silhouette.family === "pool") {
    return "moonlit_water";
  }
  if (silhouette.family === "crystal") {
    return "witchglass_cluster";
  }
  if (silhouette.family === "ruin") {
    return "weathered_stone";
  }
  return landmark.landmark === "objective_sigil" ? "flat_fill" : "worked_plinth";
}

function objectiveFocalAnatomyFor(art = {}) {
  const silhouette = art.silhouette ?? "";
  const accent = art.accent ?? "";
  const emblem = art.emblem ?? "";

  if (silhouette === "pool" || emblem === "moon") {
    return {
      focalFrameKind: "basin_reflection_frame",
      depthKind: "low_reflective",
      anatomyGlyphs: ["basin_lip", "crescent_basin", "moon_reflection", "water_ripples"]
    };
  }
  if (silhouette === "crystal" || emblem === "shard" || accent === "witchglass") {
    return {
      focalFrameKind: "faceted_spire_frame",
      depthKind: "clustered_vertical",
      anatomyGlyphs: ["angular_shadow", "crystal_cluster", "resource_glint", "shard_spires"]
    };
  }
  if (silhouette === "ruin" || emblem === "watcher" || accent === "vision") {
    return {
      focalFrameKind: "watcher_arch_frame",
      depthKind: "tall_silhouette",
      anatomyGlyphs: ["broken_columns", "eye_socket", "sight_fan", "watcher_arch"]
    };
  }
  return {
    focalFrameKind: "generic_objective_frame",
    depthKind: "compact",
    anatomyGlyphs: ["sigil_ring"]
  };
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
