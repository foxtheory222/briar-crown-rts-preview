export const OWNER_PALETTES = {
  player: { fill: "#d8f3dc", stroke: "#6b8f71", accent: "#9fcfba", shadow: "rgba(19, 43, 30, 0.42)" },
  enemy: { fill: "#f2edf4", stroke: "#7651a5", accent: "#c9c1d9", shadow: "rgba(38, 23, 49, 0.42)" },
  ally: { fill: "#d4e8ff", stroke: "#7996b2", accent: "#b6d4f0", shadow: "rgba(32, 55, 78, 0.42)" },
  neutral: { fill: "#8a918c", stroke: "#565d59", accent: "#c9c1d9", shadow: "rgba(13, 16, 16, 0.45)" }
};

const FALLBACK_PRESENTATION = {
  silhouette: "marker",
  emblem: "dot",
  accent: "neutral"
};

const EMBLEM_LABELS = {
  ancient: "AN",
  anvil: "AV",
  arrow: "AR",
  axe: "AX",
  banner: "BN",
  bat: "BT",
  bone: "BO",
  bow: "BW",
  choir: "CH",
  claw: "CL",
  crate: "CT",
  cross: "XR",
  crown: "CR",
  crypt: "CP",
  crystal: "CY",
  dew: "DW",
  dot: ".",
  dread: "DR",
  gate: "GT",
  gear: "GR",
  hart: "HT",
  hearth: "HE",
  hero: "HR",
  moon: "MN",
  moth: "MO",
  pick: "PK",
  portal: "PT",
  relic: "RL",
  rider: "RD",
  scales: "SC",
  shard: "SH",
  swords: "SW",
  thorn: "TH",
  tower: "TW",
  wagon: "WG",
  watcher: "WA",
  wheel: "WL",
  wheat: "WH"
};

export function resolveBuildingPresentation(building, buildingTypes) {
  const buildingType = buildingTypes.get(building.buildingId);
  return resolvePresentation(buildingType, building.owner, "building");
}

export function resolveSquadPresentation(squad, squadTypes) {
  const squadType = squadTypes.get(squad.squadId);
  return resolvePresentation(squadType, squad.owner, "squad");
}

export function resolveObjectivePresentation(objective, objectiveTypes) {
  const objectiveType = objectiveTypes.get(objective.id);
  return resolvePresentation(objectiveType, objective.owner, "objective");
}

export function resolveEmblemLabel(emblem) {
  if (!emblem) {
    return EMBLEM_LABELS.dot;
  }
  if (EMBLEM_LABELS[emblem]) {
    return EMBLEM_LABELS[emblem];
  }
  return String(emblem)
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function summarizeEntityArtCoverage(content = {}) {
  const buildings = collectionValues(content.buildings);
  const squads = collectionValues(content.squads);
  const objectives = collectionValues(content.objectives);
  const allEntities = [...buildings, ...squads, ...objectives];
  const uniqueEmblems = new Set(allEntities.map((entity) => entity.mapPresentation?.emblem).filter(Boolean));
  const buildingShapeFamilies = new Set(buildings.map((entity) => buildingSilhouetteProfile(entity.mapPresentation).family));
  const squadShapeFamilies = new Set(squads.map((entity) => squadSilhouetteProfile(entity.mapPresentation).family));
  const objectiveShapeFamilies = new Set(objectives.map((entity) => objectiveSilhouetteProfile(entity.mapPresentation).family));
  const squadProfiles = squads.map((entity) => squadSilhouetteProfile(entity.mapPresentation));
  const roleStandards = squadProfiles.map((profile) => profile.roleStandard).filter((standard) => standard?.kind);
  const roleStandardKinds = new Set(roleStandards.map((standard) => standard.kind));
  const largeRoleAnchors = roleStandards.filter((standard) => (
    Number(standard.visualSize) >= 34
    && standard.contrast === "high"
    && (standard.glyphs?.length ?? 0) >= 2
  ));
  const labelSupportCount = [
    ...buildings.map((entity) => buildingSilhouetteProfile(entity.mapPresentation).labelPriority),
    ...squadProfiles.map((profile) => profile.labelPriority),
    ...objectives.map((entity) => objectiveSilhouetteProfile(entity.mapPresentation).labelPriority)
  ].filter((priority) => priority === "support").length;

  return {
    buildingPresentationCount: countWithPresentation(buildings),
    squadPresentationCount: countWithPresentation(squads),
    objectivePresentationCount: countWithPresentation(objectives),
    buildingIconCount: countWithIcon(buildings),
    squadIconCount: countWithIcon(squads),
    objectiveIconCount: countWithIcon(objectives),
    emblemCoverageCount: allEntities.filter((entity) => entity.mapPresentation?.emblem).length,
    iconCoverageCount: allEntities.filter((entity) => entity.icon).length,
    uniqueEmblemCount: uniqueEmblems.size,
    buildingShapeFamilies: [...buildingShapeFamilies].sort(),
    squadShapeFamilies: [...squadShapeFamilies].sort(),
    objectiveShapeFamilies: [...objectiveShapeFamilies].sort(),
    roleStandardKinds: [...roleStandardKinds].sort(),
    squadRoleAnchorKinds: [...roleStandardKinds].sort(),
    largeSquadRoleAnchorCount: largeRoleAnchors.length,
    minSquadRoleAnchorSize: roleStandards.length
      ? Math.min(...roleStandards.map((standard) => Number(standard.visualSize) || 0))
      : 0,
    squadRoleAnchorPass: roleStandards.length === squads.length && largeRoleAnchors.length === squads.length,
    labelSupportCount
  };
}

export function buildingSilhouetteProfile(art = {}) {
  const silhouette = art.silhouette ?? "";
  const accent = art.accent ?? "";
  const emblem = art.emblem ?? "";

  if (["keep", "tower", "cairn", "vault", "mythic_gate"].includes(silhouette) || accent === "seat") {
    return {
      family: "stronghold",
      mass: "tall",
      roof: emblem === "crown" ? "crowned_spire" : "spire",
      base: "buttressed",
      signatureMarks: ["corner_towers", "crown_spire", "heavy_gate"],
      labelPriority: "support"
    };
  }
  if (["farm", "cottage", "market", "storehouse"].includes(silhouette) || ["food", "housing"].includes(accent)) {
    return {
      family: "homestead",
      mass: "wide",
      roof: accent === "food" ? "thatch_rows" : "warm_roof",
      base: "settlement_plinth",
      signatureMarks: accent === "food" ? ["field_rows", "split_roof", "low_fence"] : ["cluster_roofs", "chimney", "low_fence"],
      labelPriority: "support"
    };
  }
  if (["timber_yard", "mine"].includes(silhouette) || ["wood", "gold"].includes(accent)) {
    return {
      family: "resource",
      mass: "low",
      roof: "work_shed",
      base: silhouette === "mine" ? "pit_cut" : "yard_stack",
      signatureMarks: silhouette === "mine" ? ["pit_mouth", "cart_track", "lantern"] : ["log_stack", "saw_frame", "beam_roof"],
      labelPriority: "support"
    };
  }
  if (["gate", "war_hall", "stables", "foundry", "workshop"].includes(silhouette) || ["production", "cavalry", "siege"].includes(accent)) {
    return {
      family: "production",
      mass: "broad",
      roof: "martial_ridge",
      base: "martial_yard",
      signatureMarks: ["weapon_rack", "yard_posts", "wide_gate"],
      labelPriority: "support"
    };
  }
  if (["temple", "shrine", "council", "smithy", "infirmary"].includes(silhouette) || ["tech", "healing", "witchglass"].includes(accent)) {
    return {
      family: "ritual",
      mass: "arched",
      roof: "moon_arch",
      base: "sigil_plinth",
      signatureMarks: ["arched_door", "ritual_lines", "glow_well"],
      labelPriority: "support"
    };
  }
  return {
    family: "utility",
    mass: "compact",
    roof: "low_roof",
    base: "simple_plinth",
    signatureMarks: ["door", "window"],
    labelPriority: "support"
  };
}

export function squadSilhouetteProfile(art = {}) {
  const silhouette = art.silhouette ?? "";
  const accent = art.accent ?? "";
  if (silhouette.includes("archer") || silhouette.includes("bow") || accent === "ranged") {
    return {
      family: "ranged",
      footprint: "line",
      memberShape: "needle_archer",
      scale: 0.95,
      signatureMarks: ["bow_arc", "back_rank"],
      roleStandard: roleStandard("bow_arc", ["bow_arc", "back_rank"], "rear", 42),
      labelPriority: "support"
    };
  }
  if (silhouette.includes("lancer") || silhouette.includes("rider") || silhouette.includes("knight") || accent === "cavalry") {
    return {
      family: "cavalry",
      footprint: "wedge",
      memberShape: "lancer",
      scale: 1.08,
      signatureMarks: ["long_lance", "forward_wedge"],
      roleStandard: roleStandard("lance_wedge", ["long_lance", "forward_wedge"], "front", 44),
      labelPriority: "support"
    };
  }
  if (silhouette.includes("caster") || silhouette.includes("mourning") || silhouette.includes("ancient") || accent === "caster" || accent === "monster") {
    return {
      family: silhouette.includes("ancient") || accent === "monster" ? "monster" : "caster",
      footprint: silhouette.includes("ancient") ? "single" : "ring",
      memberShape: silhouette.includes("ancient") ? "ancient" : "caster",
      scale: silhouette.includes("ancient") ? 1.65 : 1,
      signatureMarks: silhouette.includes("ancient") ? ["trunk_body", "root_arms"] : ["staff_glow", "ritual_ring"],
      roleStandard: silhouette.includes("ancient")
        ? roleStandard("root_crown", ["trunk_body", "root_arms"], "center", 44)
        : roleStandard("staff_bloom", ["staff_glow", "ritual_ring"], "center", 40),
      labelPriority: "support"
    };
  }
  if (silhouette.includes("thrall") || silhouette.includes("bone") || accent === "undead" || accent === "siege") {
    return {
      family: accent === "siege" || silhouette.includes("wagon") ? "siege" : "undead",
      footprint: accent === "siege" || silhouette.includes("wagon") ? "single" : "mob",
      memberShape: accent === "siege" || silhouette.includes("wagon") ? "bone_wagon" : "bone_thrall",
      scale: accent === "siege" || silhouette.includes("wagon") ? 1.45 : 0.98,
      signatureMarks: accent === "siege" || silhouette.includes("wagon") ? ["wagon_bed", "wheel_pair"] : ["rib_body", "uneven_mob"],
      roleStandard: accent === "siege" || silhouette.includes("wagon")
        ? roleStandard("wagon_axle", ["wagon_bed", "wheel_pair"], "center", 46)
        : roleStandard("rib_mob", ["rib_body", "uneven_mob"], "front", 38),
      labelPriority: "support"
    };
  }
  if (silhouette.includes("scout") || silhouette.includes("bat") || accent === "scout") {
    return {
      family: "scout",
      footprint: "pair",
      memberShape: silhouette.includes("bat") ? "bat_wing" : "moth",
      scale: 0.9,
      signatureMarks: ["wing_pair", "wide_gap"],
      roleStandard: roleStandard("wing_pair", ["wing_pair", "wide_gap"], "wide", 44),
      labelPriority: "support"
    };
  }
  return {
    family: "frontline",
    footprint: "block",
    memberShape: "shield",
    scale: 1,
    signatureMarks: ["shield_face", "front_rank"],
    roleStandard: roleStandard("shield_pennant", ["shield_face", "front_rank"], "front", 38),
    labelPriority: "support"
  };
}

export function objectiveSilhouetteProfile(art = {}) {
  const silhouette = art.silhouette ?? "";
  const accent = art.accent ?? "";
  const emblem = art.emblem ?? "";

  if (silhouette === "pool" || emblem === "moon") {
    return {
      family: "pool",
      mass: "low",
      landmarkShape: "moon_basin",
      signatureMarks: ["crescent_basin", "water_ripples", "moon_reflection"],
      labelPriority: "support"
    };
  }
  if (silhouette === "crystal" || emblem === "shard" || accent === "witchglass") {
    return {
      family: "crystal",
      mass: "clustered",
      landmarkShape: "shard_cluster",
      signatureMarks: ["crystal_cluster", "resource_glint", "angular_shadow"],
      labelPriority: "support"
    };
  }
  if (silhouette === "ruin" || emblem === "watcher" || accent === "vision") {
    return {
      family: "ruin",
      mass: "arched",
      landmarkShape: "watcher_arch",
      signatureMarks: ["watcher_eye", "sight_fan", "broken_columns"],
      labelPriority: "support"
    };
  }
  return {
    family: "marker",
    mass: "compact",
    landmarkShape: "objective_sigil",
    signatureMarks: ["sigil_ring"],
    labelPriority: "support"
  };
}

function resolvePresentation(definition, owner, kind) {
  const presentation = {
    ...FALLBACK_PRESENTATION,
    ...definition?.mapPresentation
  };
  const shapeProfile = kind === "building"
    ? buildingSilhouetteProfile(presentation)
    : kind === "squad"
      ? squadSilhouetteProfile(presentation)
      : objectiveSilhouetteProfile(presentation);
  return {
    ...presentation,
    icon: definition?.icon ?? null,
    label: definition?.name ?? null,
    emblemLabel: resolveEmblemLabel(presentation.emblem),
    shapeProfile,
    palette: OWNER_PALETTES[owner] ?? OWNER_PALETTES.neutral
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

function countWithPresentation(entities) {
  return entities.filter((entity) => entity.mapPresentation).length;
}

function countWithIcon(entities) {
  return entities.filter((entity) => entity.icon).length;
}

function roleStandard(kind, glyphs, anchor, visualSize) {
  return { kind, glyphs, anchor, visualSize, contrast: "high" };
}
