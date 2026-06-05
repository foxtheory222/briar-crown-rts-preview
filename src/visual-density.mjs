export function buildingOrnamentProfile(art = {}) {
  const silhouette = art.silhouette ?? "";
  const accent = art.accent ?? "";
  const emblem = art.emblem ?? "";
  const profile = { roof: "low", windows: 1, props: ["door", "window"], banners: false };

  if (["keep", "tower", "cairn", "vault", "mythic_gate"].includes(silhouette)) {
    profile.roof = "spire";
    profile.windows = 4;
    profile.banners = true;
    profile.props.push("buttress");
  } else if (["farm", "cottage"].includes(silhouette) || accent === "food") {
    profile.roof = "thatch";
    profile.windows = 2;
    profile.props.push("crop_rows", "fence");
  } else if (silhouette === "timber_yard" || accent === "wood") {
    profile.roof = "beam";
    profile.windows = 1;
    profile.props.push("log_stack", "saw_frame");
  } else if (silhouette === "mine" || accent === "gold") {
    profile.roof = "beam";
    profile.windows = 1;
    profile.props.push("mine_cart", "pit_lantern");
  } else if (["war_hall", "stables", "gate", "foundry", "workshop"].includes(silhouette)) {
    profile.roof = "martial";
    profile.windows = 3;
    profile.props.push("weapon_rack", "yard_marks");
  } else if (["shrine", "temple", "council", "smithy", "infirmary"].includes(silhouette)) {
    profile.roof = "arched";
    profile.windows = 3;
    profile.props.push("ritual_lines");
  }

  if (["crown", "banner", "dread"].includes(emblem)) {
    profile.banners = true;
  }

  return {
    roof: profile.roof,
    windows: profile.windows,
    props: [...new Set(profile.props)],
    banners: profile.banners
  };
}

export function squadEquipmentProfile(art = {}) {
  const silhouette = art.silhouette ?? "";
  const accent = art.accent ?? "";
  if (silhouette.includes("archer") || silhouette.includes("bow") || accent === "ranged") {
    return { weapon: "bow", shield: false, glow: false };
  }
  if (silhouette.includes("lancer") || silhouette.includes("rider") || silhouette.includes("knight") || accent === "cavalry") {
    return { weapon: "lance", shield: silhouette.includes("knight"), glow: silhouette.includes("dread") };
  }
  if (silhouette.includes("caster") || silhouette.includes("mourning") || silhouette.includes("ancient") || accent === "caster" || accent === "monster") {
    return { weapon: "staff", shield: false, glow: true };
  }
  if (silhouette.includes("thrall") || silhouette.includes("bone") || accent === "undead") {
    return { weapon: "claw", shield: false, glow: true };
  }
  if (silhouette.includes("scout") || silhouette.includes("bat")) {
    return { weapon: "knife", shield: false, glow: false };
  }
  return { weapon: "spear", shield: true, glow: false };
}

export function objectiveLandmarkProfile(art = {}) {
  const silhouette = art.silhouette ?? "";
  const accent = art.accent ?? "";
  const emblem = art.emblem ?? "";

  if (silhouette === "pool" || emblem === "moon") {
    return {
      landmark: "moon_basin",
      props: ["crescent_basin", "water_ripples", "moon_reflection"],
      verticality: "low"
    };
  }
  if (silhouette === "crystal" || emblem === "shard" || accent === "witchglass") {
    return {
      landmark: "shard_cluster",
      props: ["crystal_cluster", "resource_glint", "angular_shadow"],
      verticality: "medium"
    };
  }
  if (silhouette === "ruin" || emblem === "watcher" || accent === "vision") {
    return {
      landmark: "watcher_arch",
      props: ["watcher_eye", "sight_fan", "broken_columns"],
      verticality: "tall"
    };
  }
  return {
    landmark: "objective_sigil",
    props: ["sigil_ring"],
    verticality: "medium"
  };
}

export function summarizeVisualDensity(content = {}) {
  const buildings = collectionValues(content.buildings);
  const squads = collectionValues(content.squads);
  const objectives = collectionValues(content.objectives);
  const buildingPropKinds = new Set();
  const squadWeaponKinds = new Set();
  const objectivePropKinds = new Set();

  for (const building of buildings) {
    const profile = buildingOrnamentProfile(building.mapPresentation);
    profile.props.forEach((prop) => buildingPropKinds.add(prop));
    if (profile.banners) {
      buildingPropKinds.add("banner");
    }
  }
  for (const squad of squads) {
    squadWeaponKinds.add(squadEquipmentProfile(squad.mapPresentation).weapon);
  }
  for (const objective of objectives) {
    objectiveLandmarkProfile(objective.mapPresentation).props.forEach((prop) => objectivePropKinds.add(prop));
  }

  return {
    buildingProfiles: buildings.length,
    buildingPropKinds: [...buildingPropKinds].filter((prop) => !prop.includes("_") || prop === "crop_rows").sort(),
    squadProfiles: squads.length,
    squadWeaponKinds: [...squadWeaponKinds].sort(),
    objectiveProfiles: objectives.length,
    objectivePropKinds: [...objectivePropKinds]
      .filter((prop) => !["angular_shadow", "broken_columns", "resource_glint"].includes(prop))
      .sort()
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
