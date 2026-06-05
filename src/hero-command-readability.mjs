const TACTICAL_ABILITY_KINDS = new Set(["active", "ultimate", "capstone"]);
const REQUIRED_HERO_PROFILES = 4;
const REQUIRED_FACTIONS = 2;
const REQUIRED_FRAMES = 4;
const REQUIRED_COMMAND_GLYPHS = 20;
const REQUIRED_ABILITY_KINDS = 4;
const REQUIRED_RUNTIME_TREATMENTS = 1;
const REQUIRED_BATTLEFIELD_ANCHORS = 2;
const REQUIRED_PANEL_SIGNALS = 4;

const HERO_COMMAND_FRAMES = {
  thorn_queen: {
    commandFrameKind: "moon_crown_commander",
    portraitFrameKind: "thorn_court_moon_crown",
    commandGlyphs: ["bramble_aegis", "leaf_crown", "moon_snare_rune", "root_scepter", "wild_hunt_antlers"]
  },
  hartmarshal: {
    commandFrameKind: "hart_banner_commander",
    portraitFrameKind: "thorn_court_hart_standard",
    commandGlyphs: ["charge_lance", "dew_horn", "hart_antlers", "hunt_banner", "rootbound_standard"]
  },
  bone_regent: {
    commandFrameKind: "bone_crown_commander",
    portraitFrameKind: "hollow_legion_bone_crown",
    commandGlyphs: ["bone_crown", "court_bones", "dreadsoil_sigil", "edict_tablet", "grave_command_rune"]
  },
  wailing_matron: {
    commandFrameKind: "mourning_veil_commander",
    portraitFrameKind: "hollow_legion_mourning_veil",
    commandGlyphs: ["ash_veil", "bone_regalia", "lament_mask", "mourning_bell", "wail_cone"]
  }
};

const ABILITY_GLYPHS = {
  briar_aegis: "bramble_aegis",
  moon_snare: "moon_snare_rune",
  wild_hunt: "wild_hunt_antlers",
  hart_charge: "charge_lance",
  dew_mending: "dew_horn",
  rootbound_banner: "rootbound_standard",
  dread_edict: "edict_tablet",
  grave_command: "grave_command_rune",
  court_of_bones: "court_bones",
  wail_of_ashes: "wail_cone",
  mourning_litany: "mourning_bell",
  bone_regalia: "bone_regalia"
};

export function heroCommandProfile(hero = {}, { abilities = [] } = {}) {
  const abilityById = mapById(collectionValues(abilities));
  const heroAbilities = collectionValues(hero.abilityIds)
    .map((abilityId) => abilityById.get(abilityId))
    .filter(Boolean);
  const frame = HERO_COMMAND_FRAMES[hero.id] ?? fallbackHeroFrame(hero);
  const abilityKinds = uniqueSorted(heroAbilities.map((ability) => ability.kind));
  const tacticalAbilityGlyphKinds = uniqueSorted(heroAbilities
    .filter((ability) => TACTICAL_ABILITY_KINDS.has(ability.kind))
    .map((ability) => ABILITY_GLYPHS[ability.id] ?? `${ability.id}_glyph`));
  const commandGlyphs = uniqueSorted([
    ...frame.commandGlyphs,
    ...heroAbilities.map((ability) => ABILITY_GLYPHS[ability.id] ?? `${ability.id}_glyph`)
  ]);

  return {
    id: hero.id,
    faction: hero.faction,
    role: hero.role,
    commandFrameKind: frame.commandFrameKind,
    portraitFrameKind: frame.portraitFrameKind,
    abilityKinds,
    tacticalAbilityGlyphKinds,
    commandGlyphs,
    commandPolishReady: Boolean(hero.id && hero.faction && hero.role)
      && commandGlyphs.length >= 4
      && tacticalAbilityGlyphKinds.length >= 1
      && abilityKinds.length >= 2
  };
}

export function runtimeHeroCommandTreatment(heroInstance = {}, {
  heroes = [],
  abilities = [],
  selectedSquads = [],
  playerFaction = "thorn_court",
  enemyFaction = "hollow_legion"
} = {}) {
  const hero = mapById(collectionValues(heroes)).get(heroInstance.heroId) ?? heroInstance;
  const profile = heroCommandProfile(hero, { abilities });
  const selectedPlayerSquads = collectionValues(selectedSquads)
    .filter((squad) => squad.owner === "player" && (squad.selected || squad.isSelected));
  const tacticalAbilities = collectionValues(hero.abilityIds)
    .map((abilityId) => mapById(collectionValues(abilities)).get(abilityId))
    .filter((ability) => ability && TACTICAL_ABILITY_KINDS.has(ability.kind));
  const readinessKind = tacticalAbilities.some((ability) => Number(heroInstance.cooldowns?.[ability.id] ?? 0) <= 0)
    ? "ready_tactical_order"
    : tacticalAbilities.length > 0
      ? "cooldown_tactical_order"
      : "no_tactical_order";
  const level = Number(heroInstance.level ?? 1);
  const xp = Number(heroInstance.xp ?? 0);
  const levelBand = level >= 3 ? "veteran_command" : level >= 2 ? "seasoned_command" : "fresh_command";
  const xpBand = xp >= 500 ? "deep_xp" : xp > 0 ? "earned_xp" : "no_xp";
  const factionMatch = hero.faction === playerFaction
    ? "player_faction_hero"
    : hero.faction === enemyFaction
      ? "enemy_faction_hero"
      : "off_faction_hero";
  const battlefieldAnchorKinds = uniqueSorted([
    selectedPlayerSquads.length ? "selected_squad_command_banner" : null,
    selectedPlayerSquads.length ? `${profile.faction}_command_crest` : null,
    readinessKind === "ready_tactical_order" ? "ready_ability_rune" : "cooldown_ability_tick"
  ]);
  const panelSignalKinds = uniqueSorted([
    "hero_panel_portrait",
    `${profile.faction}_faction_crest`,
    `${profile.commandFrameKind}_frame`,
    `${levelBand}_level_badge`,
    `${xpBand}_xp_pip`,
    `${readinessKind}_signal`
  ]);

  return {
    heroId: heroInstance.heroId ?? hero.id,
    faction: profile.faction,
    commandFrameKind: profile.commandFrameKind,
    portraitFrameKind: profile.portraitFrameKind,
    readinessKind,
    levelBand,
    xpBand,
    factionMatch,
    battlefieldAnchorKinds,
    panelSignalKinds,
    treatmentKind: `${profile.faction}:${profile.commandFrameKind}:${readinessKind}:${levelBand}:${factionMatch}`
  };
}

export function summarizeHeroCommandReadability({
  heroes = [],
  abilities = [],
  runtimeHeroes = [],
  selectedSquads = [],
  playerFaction = "thorn_court",
  enemyFaction = "hollow_legion"
} = {}) {
  const profiles = collectionValues(heroes).map((hero) => heroCommandProfile(hero, { abilities }));
  const runtimeTreatments = collectionValues(runtimeHeroes).map((heroInstance) => runtimeHeroCommandTreatment(heroInstance, {
    heroes,
    abilities,
    selectedSquads,
    playerFaction,
    enemyFaction
  }));
  const heroFactionKinds = uniqueSorted(profiles.map((profile) => profile.faction));
  const heroRoleKinds = uniqueSorted(profiles.map((profile) => profile.role));
  const heroFrameKinds = uniqueSorted(profiles.map((profile) => profile.commandFrameKind));
  const heroPortraitFrameKinds = uniqueSorted(profiles.map((profile) => profile.portraitFrameKind));
  const heroAbilityKinds = uniqueSorted(profiles.flatMap((profile) => profile.abilityKinds));
  const heroCommandGlyphKinds = uniqueSorted(profiles.flatMap((profile) => profile.commandGlyphs));
  const tacticalAbilityGlyphKinds = uniqueSorted(profiles.flatMap((profile) => profile.tacticalAbilityGlyphKinds));
  const runtimeHeroTreatmentKinds = uniqueSorted(runtimeTreatments.map((treatment) => treatment.treatmentKind));
  const runtimeHeroReadinessKinds = uniqueSorted(runtimeTreatments.map((treatment) => treatment.readinessKind));
  const battlefieldHeroAnchorKinds = uniqueSorted(runtimeTreatments.flatMap((treatment) => treatment.battlefieldAnchorKinds));
  const heroPanelSignalKinds = uniqueSorted(runtimeTreatments.flatMap((treatment) => treatment.panelSignalKinds));

  const missingReadabilityPillars = [
    profiles.length >= REQUIRED_HERO_PROFILES ? null : "four_hero_profiles",
    heroFactionKinds.length >= REQUIRED_FACTIONS ? null : "two_hero_factions",
    profiles.every((profile) => profile.commandPolishReady) ? null : "hero_command_profiles",
    heroFrameKinds.length >= REQUIRED_FRAMES ? null : "distinct_hero_command_frames",
    heroCommandGlyphKinds.length >= REQUIRED_COMMAND_GLYPHS ? null : "hero_command_glyphs",
    heroAbilityKinds.length >= REQUIRED_ABILITY_KINDS ? null : "hero_ability_kind_coverage",
    runtimeHeroTreatmentKinds.length >= REQUIRED_RUNTIME_TREATMENTS ? null : "runtime_hero_treatment",
    battlefieldHeroAnchorKinds.length >= REQUIRED_BATTLEFIELD_ANCHORS ? null : "battlefield_hero_anchors",
    heroPanelSignalKinds.length >= REQUIRED_PANEL_SIGNALS ? null : "hero_panel_signals"
  ].filter(Boolean);

  return {
    heroCommandReadabilityPass: missingReadabilityPillars.length === 0,
    missingReadabilityPillars,
    heroProfileCount: profiles.length,
    heroFactionKinds,
    heroRoleKinds,
    heroFrameKinds,
    heroPortraitFrameKinds,
    heroAbilityKinds,
    heroCommandGlyphKinds,
    tacticalAbilityGlyphKinds,
    runtimeHeroTreatmentKinds,
    runtimeHeroReadinessKinds,
    battlefieldHeroAnchorKinds,
    heroPanelSignalKinds
  };
}

function fallbackHeroFrame(hero = {}) {
  const faction = hero.faction ?? "shared";
  return {
    commandFrameKind: `${faction}_field_commander`,
    portraitFrameKind: `${faction}_field_portrait`,
    commandGlyphs: [`${faction}_crest`, `${hero.role ?? "hero"}_order`, `${hero.id ?? "hero"}_mark`, "command_banner"]
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

function mapById(values) {
  return new Map(collectionValues(values).map((value) => [value.id, value]));
}

function uniqueSorted(values) {
  return [...new Set(values)].filter(Boolean).sort();
}
