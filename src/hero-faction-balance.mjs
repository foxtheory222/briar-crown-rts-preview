const REQUIRED_FACTIONS = 2;
const REQUIRED_HEROES_PER_FACTION = 2;
const REQUIRED_MECHANIC_IMPACTS = 5;
const REQUIRED_LATE_GAME_UNLOCKS = 4;

export function factionHeroBalanceProfile(factionId, {
  factions = [],
  heroes = [],
  abilities = [],
  squads = [],
  techTiers = []
} = {}) {
  const faction = mapById(collectionValues(factions)).get(factionId) ?? {};
  const heroById = mapById(collectionValues(heroes));
  const abilityById = mapById(collectionValues(abilities));
  const squadById = mapById(collectionValues(squads));
  const factionHeroes = collectionValues(faction.heroIds)
    .map((heroId) => heroById.get(heroId))
    .filter(Boolean);
  const heroTierKinds = uniqueSorted(factionHeroes.map((hero) => `t${Number(hero.tier ?? 1)}_hero`));
  const heroAbilityKinds = uniqueSorted(factionHeroes.flatMap((hero) => collectionValues(hero.abilityIds)
    .map((abilityId) => abilityById.get(abilityId)?.kind)));
  const completeHeroKit = hasEveryHeroRole(heroAbilityKinds);
  const mechanicKind = faction.mechanic?.id ?? faction.uniqueMechanic ?? "unknown_mechanic";
  const mechanicImpactKinds = mechanicImpacts(faction.mechanic);
  const lateGameUnlockKinds = factionLateGameUnlocks(factionId, { techTiers, squadById, abilityById });
  const lateGameAccess = lateGameUnlockKinds.some((kind) => kind.includes(":t3_squad:"))
    && lateGameUnlockKinds.some((kind) => kind.includes(":ultimate:") || kind.includes(":capstone:"));

  return {
    factionId,
    heroIds: factionHeroes.map((hero) => hero.id),
    heroTierKinds,
    heroAbilityKinds,
    completeHeroKit,
    mechanicKind,
    mechanicImpactKinds,
    lateGameUnlockKinds,
    lateGameAccess
  };
}

export function summarizeHeroFactionBalance({
  factions = [],
  heroes = [],
  abilities = [],
  squads = [],
  techTiers = [],
  runtimeHeroes = [],
  playerFaction = "thorn_court",
  enemyFaction = "hollow_legion",
  effects = {},
  enemyEffects = {}
} = {}) {
  const factionIds = uniqueSorted(collectionValues(factions).map((faction) => faction.id));
  const profiles = factionIds.map((factionId) => factionHeroBalanceProfile(factionId, {
    factions,
    heroes,
    abilities,
    squads,
    techTiers
  }));
  const factionsWithTwoHeroes = uniqueSorted(profiles
    .filter((profile) => profile.heroIds.length >= REQUIRED_HEROES_PER_FACTION)
    .map((profile) => profile.factionId));
  const factionsWithTieredHeroCurve = uniqueSorted(profiles
    .filter((profile) => profile.heroTierKinds.includes("t1_hero") && profile.heroTierKinds.some((kind) => kind !== "t1_hero"))
    .map((profile) => profile.factionId));
  const factionsWithCompleteHeroKit = uniqueSorted(profiles
    .filter((profile) => profile.completeHeroKit)
    .map((profile) => profile.factionId));
  const factionsWithLateGameAccess = uniqueSorted(profiles
    .filter((profile) => profile.lateGameAccess)
    .map((profile) => profile.factionId));
  const mechanicKinds = uniqueSorted(profiles.map((profile) => profile.mechanicKind));
  const mechanicImpactKinds = uniqueSorted(profiles.flatMap((profile) => profile.mechanicImpactKinds));
  const lateGameUnlockKinds = uniqueSorted(profiles.flatMap((profile) => profile.lateGameUnlockKinds));
  const runtimeMechanicKinds = runtimeMechanicStateKinds({ playerFaction, enemyFaction, effects, enemyEffects });
  const runtimeHeroPresenceKinds = runtimeHeroKinds(runtimeHeroes, { heroes });
  const missingBalancePillars = [
    factionIds.length >= REQUIRED_FACTIONS ? null : "two_factions",
    factionsWithTwoHeroes.length >= REQUIRED_FACTIONS ? null : "two_heroes_per_faction",
    factionsWithTieredHeroCurve.length >= REQUIRED_FACTIONS ? null : "tiered_hero_curve",
    factionsWithCompleteHeroKit.length >= REQUIRED_FACTIONS ? null : "complete_hero_kits",
    mechanicKinds.length >= REQUIRED_FACTIONS ? null : "distinct_faction_mechanics",
    mechanicImpactKinds.length >= REQUIRED_MECHANIC_IMPACTS ? null : "mechanic_impact_breadth",
    factionsWithLateGameAccess.length >= REQUIRED_FACTIONS && lateGameUnlockKinds.length >= REQUIRED_LATE_GAME_UNLOCKS ? null : "late_game_access",
    runtimeMechanicKinds.length >= REQUIRED_FACTIONS ? null : "runtime_mechanic_state",
    runtimeHeroPresenceKinds.length >= 1 ? null : "runtime_hero_presence"
  ].filter(Boolean);

  return {
    heroFactionBalancePass: missingBalancePillars.length === 0,
    missingBalancePillars,
    factionCount: factionIds.length,
    factionsWithTwoHeroes,
    factionsWithTieredHeroCurve,
    factionsWithCompleteHeroKit,
    factionsWithLateGameAccess,
    mechanicKinds,
    mechanicImpactKinds,
    lateGameUnlockKinds,
    runtimeMechanicKinds,
    runtimeHeroPresenceKinds
  };
}

function hasEveryHeroRole(abilityKinds) {
  return abilityKinds.includes("passive")
    && abilityKinds.includes("active")
    && abilityKinds.some((kind) => kind === "autocast" || kind === "heal")
    && abilityKinds.some((kind) => kind === "ultimate" || kind === "capstone");
}

function mechanicImpacts(mechanic = {}) {
  return uniqueSorted([
    mechanic.id ? "aura_control" : null,
    Number(mechanic.constructionSpeedMultiplier ?? 1) !== 1 ? "construction_speed" : null,
    Number(mechanic.productionSpeedMultiplier ?? 1) !== 1 ? "production_speed" : null,
    Number(mechanic.moraleRecoveryPerSecond ?? 0) > 0 ? "morale_recovery" : null,
    Number(mechanic.killSoulEssence ?? 0) > 0 ? "soul_essence" : null
  ]);
}

function factionLateGameUnlocks(factionId, { techTiers, squadById, abilityById }) {
  return uniqueSorted(collectionValues(techTiers)
    .filter((tier) => Number(tier.tier ?? 0) >= 3)
    .flatMap((tier) => collectionValues(tier.unlocks).flatMap((unlockId) => {
      const squad = squadById.get(unlockId);
      if (squad?.faction === factionId) {
        return `${factionId}:t3_squad:${unlockId}`;
      }
      const ability = abilityById.get(unlockId);
      if (ability?.faction === factionId && ["ultimate", "capstone"].includes(ability.kind)) {
        return `${factionId}:${ability.kind}:${unlockId}`;
      }
      return [];
    })));
}

function runtimeMechanicStateKinds({ playerFaction, enemyFaction, effects, enemyEffects }) {
  return uniqueSorted([
    hasRootboundState(effects) ? `player:${mechanicIdForFaction(playerFaction)}` : null,
    hasDreadsoilState(effects) ? `player:${mechanicIdForFaction(playerFaction)}` : null,
    hasRootboundState(enemyEffects) ? `enemy:${mechanicIdForFaction(enemyFaction)}` : null,
    hasDreadsoilState(enemyEffects) ? `enemy:${mechanicIdForFaction(enemyFaction)}` : null
  ]);
}

function runtimeHeroKinds(runtimeHeroes, { heroes }) {
  const heroById = mapById(collectionValues(heroes));
  return uniqueSorted(collectionValues(runtimeHeroes).flatMap((heroInstance) => {
    const hero = heroById.get(heroInstance.heroId);
    if (!hero) {
      return [];
    }
    return `${hero.faction}:t${Number(hero.tier ?? 1)}_runtime_hero`;
  }));
}

function hasRootboundState(effects = {}) {
  return Number(effects.rootboundRealm ?? 0) > 0;
}

function hasDreadsoilState(effects = {}) {
  return Number(effects.dreadsoil ?? 0) > 0
    || Number(effects.dreadsoilAnchors ?? 0) > 0
    || Number(effects.dreadsoilEssence ?? 0) > 0
    || Number(effects.soulEssence ?? 0) > 0;
}

function mechanicIdForFaction(factionId) {
  if (factionId === "hollow_legion") {
    return "dreadsoil";
  }
  if (factionId === "thorn_court") {
    return "rootbound_realm";
  }
  return `${factionId}_mechanic`;
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
  return [...new Set(values.filter(Boolean))].sort();
}
