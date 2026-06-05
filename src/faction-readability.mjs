const FACTION_PROFILES = {
  thorn_court: {
    motif: "thorn",
    crest: "leaf_crown",
    trim: "#a9f0dc",
    accent: "#6b8f71",
    baseMark: "root_ring",
    unitMark: "antler_spikes",
    banner: "bramble_pennant",
    buildingForm: "bramble_arches",
    squadForm: "antler_bramble",
    groundTexture: "root_lattice",
    silhouetteGlyphs: ["branching_spires", "root_buttresses", "leaf_pennants", "antler_crowns"]
  },
  hollow_legion: {
    motif: "bone",
    crest: "bone_crown",
    trim: "#c9c1d9",
    accent: "#7651a5",
    baseMark: "dread_ring",
    unitMark: "rib_marks",
    banner: "grave_pennant",
    buildingForm: "rib_vaults",
    squadForm: "ribcage_bone",
    groundTexture: "grave_teeth",
    silhouetteGlyphs: ["rib_vaults", "grave_teeth", "bone_crown", "hollow_spines"]
  }
};

export function ownerFactionId(owner, context = {}) {
  if (owner === "enemy") {
    return context.enemyFaction ?? "hollow_legion";
  }
  if (owner === "ally") {
    return context.playerFaction ?? "thorn_court";
  }
  return context.playerFaction ?? "thorn_court";
}

export function factionReadabilityProfile(factionId = "thorn_court") {
  const profile = FACTION_PROFILES[factionId] ?? FACTION_PROFILES.thorn_court;
  return { factionId: FACTION_PROFILES[factionId] ? factionId : "thorn_court", ...profile };
}

export function buildingFactionMark(building = {}, context = {}) {
  const profile = factionReadabilityProfile(ownerFactionId(building.owner, context));
  const inactive = building.active === false;
  return {
    motif: profile.motif,
    crest: profile.crest,
    trim: profile.trim,
    accent: profile.accent,
    baseMark: profile.baseMark,
    banner: inactive ? null : profile.banner,
    constructionMark: inactive ? `${profile.motif}_scaffold` : null,
    buildingForm: profile.buildingForm,
    groundTexture: profile.groundTexture,
    silhouetteGlyphs: [...profile.silhouetteGlyphs]
  };
}

export function squadFactionMark(squad = {}, context = {}) {
  const profile = factionReadabilityProfile(ownerFactionId(squad.owner, context));
  return {
    motif: profile.motif,
    trim: profile.trim,
    accent: profile.accent,
    unitMark: profile.unitMark,
    baseMark: profile.baseMark,
    selectedRing: squad.selected ? "command_focus" : "readable_owner_ring",
    squadForm: profile.squadForm,
    groundTexture: profile.groundTexture,
    silhouetteGlyphs: [...profile.silhouetteGlyphs]
  };
}

export function summarizeFactionReadability(content = {}) {
  const context = {
    playerFaction: content.playerFaction,
    enemyFaction: content.enemyFaction
  };
  const buildings = collectionValues(content.buildings);
  const squads = collectionValues(content.squads);
  const motifs = new Set();
  const buildingMarks = new Set();
  const squadMarks = new Set();
  const buildingForms = new Set();
  const squadForms = new Set();
  const groundTextures = new Set();
  const formGlyphs = new Set();

  for (const building of buildings) {
    const mark = buildingFactionMark(building, context);
    motifs.add(mark.motif);
    buildingMarks.add(mark.baseMark);
    buildingMarks.add(mark.crest);
    buildingForms.add(mark.buildingForm);
    groundTextures.add(mark.groundTexture);
    for (const glyph of mark.silhouetteGlyphs) {
      formGlyphs.add(glyph);
    }
    if (mark.banner) {
      buildingMarks.add(mark.banner);
    }
    if (mark.constructionMark) {
      buildingMarks.add(mark.constructionMark);
    }
  }
  for (const squad of squads) {
    const mark = squadFactionMark(squad, context);
    motifs.add(mark.motif);
    squadMarks.add(mark.unitMark);
    squadMarks.add(mark.baseMark);
    squadMarks.add(mark.selectedRing);
    squadForms.add(mark.squadForm);
    groundTextures.add(mark.groundTexture);
    for (const glyph of mark.silhouetteGlyphs) {
      formGlyphs.add(glyph);
    }
  }

  return {
    buildingMarks: buildings.length,
    squadMarks: squads.length,
    motifs: [...motifs].sort(),
    buildingMarkKinds: [...buildingMarks].sort(),
    squadMarkKinds: [...squadMarks].sort(),
    buildingFormKinds: [...buildingForms].sort(),
    squadFormKinds: [...squadForms].sort(),
    groundTextures: [...groundTextures].sort(),
    formGlyphKinds: [...formGlyphs].sort()
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
