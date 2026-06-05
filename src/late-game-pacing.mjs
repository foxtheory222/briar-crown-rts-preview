const REQUIRED_RESEARCH_PACING_TIERS = 2;
const REQUIRED_T3_UNLOCKS = 6;
const REQUIRED_RUNTIME_T3_BUILDINGS = 3;
const REQUIRED_RUNTIME_T3_SQUADS = 4;
const REQUIRED_RUNTIME_BANKS = 4;

export function lateGamePacingProofFixture() {
  return {
    mode: "late_game_pacing",
    techTier: 3,
    enemyTechTier: 3,
    resources: { gold: 520, wood: 360, food: 140, housing: 30, witchglass: 110 },
    enemyResources: { gold: 460, wood: 300, food: 120, housing: 28, witchglass: 90 },
    effects: { rootboundRealm: 3 },
    enemyEffects: { dreadsoilEssence: 5, dreadsoilAnchors: 2 },
    housingUsed: 20,
    enemyHousingUsed: 19,
    buildings: [
      building("late-player-seat", "seat_of_rule", "player", 2, 8, 600, 600, 4, 4),
      building("late-enemy-seat", "seat_of_rule", "enemy", 25, 8, 560, 600, 4, 4),
      building("late-player-war-council", "war_council", "player", 6, 5, 260, 260, 3, 3),
      building("late-player-relic-vault", "relic_vault", "player", 10, 5, 300, 300, 3, 3),
      building("late-player-monster-roost", "monster_roost", "player", 6, 13, 320, 320, 4, 4),
      building("late-player-siege-foundry", "siege_foundry", "player", 11, 13, 300, 300, 4, 3),
      building("late-enemy-war-council", "war_council", "enemy", 22, 12, 240, 260, 3, 3),
      building("late-enemy-siege-foundry", "siege_foundry", "enemy", 21, 6, 260, 300, 4, 3)
    ],
    squads: [
      squad("late-player-ancient-1", "bark_ancient_squad", "player", 14.2, 10.0, 230, 230, "attack_move", { x: 23.5, y: 10.0 }),
      squad("late-player-rider-1", "wild_hunt_rider_squad", "player", 12.4, 8.7, 160, 160, "attack_move", { x: 22.0, y: 8.6 }),
      squad("late-player-rider-2", "wild_hunt_rider_squad", "player", 12.2, 12.0, 160, 160, "capture", { x: 16.0, y: 4.0 }),
      squad("late-enemy-knight-1", "dread_knight_squad", "enemy", 18.1, 10.5, 160, 160, "attack_move", { x: 8.5, y: 10.0 }),
      squad("late-enemy-knight-2", "dread_knight_squad", "enemy", 19.1, 12.2, 150, 160, "attack_move", { x: 9.0, y: 12.0 }),
      squad("late-enemy-wagon-1", "bone_wagon_squad", "enemy", 20.2, 8.4, 130, 150, "attack_move", { x: 7.0, y: 9.0 })
    ],
    heroes: [
      { id: "late-thorn-queen", heroId: "thorn_queen", level: 4, xp: 620, cooldowns: { moon_snare: 0, wild_hunt: 12 } },
      { id: "late-hartmarshal", heroId: "hartmarshal", level: 3, xp: 420, cooldowns: { hart_charge: 0 } }
    ],
    selectedSquadIds: ["late-player-ancient-1", "late-player-rider-1", "late-player-rider-2"],
    production: [
      { id: "late-prod-player-rider", squadId: "wild_hunt_rider_squad", remaining: 18, total: 40, owner: "player" }
    ],
    enemyProduction: [
      { id: "late-prod-enemy-knight", squadId: "dread_knight_squad", remaining: 22, total: 40, owner: "enemy" }
    ],
    completedProduction: [],
    research: null,
    enemyResearch: null,
    aiOrders: [
      { type: "RESEARCH_TIER", tierId: "t3_citadel" },
      { type: "CONTEST_OBJECTIVE", objectiveId: "witchglass_shard" },
      { type: "ATTACK", target: "player-seat" }
    ],
    alerts: [
      "Late-game pacing proof active.",
      "T3 Citadel path online: War Council, elite squads, and Witchglass bank.",
      "AI pressure includes objective contest and base attack orders."
    ]
  };
}

export function summarizeLateGamePacing({
  techTiers = [],
  buildings = [],
  squads = [],
  abilities = [],
  tactics = [],
  runtime = {}
} = {}) {
  const techTierValues = collectionValues(techTiers).sort((left, right) => Number(left.tier ?? 0) - Number(right.tier ?? 0));
  const buildingById = mapById(collectionValues(buildings));
  const squadById = mapById(collectionValues(squads));
  const abilityById = mapById(collectionValues(abilities));
  const maxTechTier = Math.max(0, ...techTierValues.map((tier) => Number(tier.tier ?? 0)));
  const t3Tier = techTierValues.find((tier) => Number(tier.tier ?? 0) >= 3);
  const t3UnlockKinds = unlockKindsForTier(t3Tier, { buildingById, squadById, abilityById });
  const t3SquadUnlockIds = new Set(t3UnlockKinds
    .filter((kind) => kind.startsWith("t3_squad:"))
    .map((kind) => kind.split(":")[1]));
  const t3FactionKinds = uniqueSorted([...t3SquadUnlockIds].map((squadId) => squadById.get(squadId)?.faction));
  const researchPacingKinds = uniqueSorted(techTierValues
    .filter((tier) => Number(tier.tier ?? 0) > 1 && Number(tier.researchSeconds ?? 0) >= 30)
    .map((tier) => `${tier.id}:${Number(tier.researchSeconds ?? 0)}s`));
  const techGateKinds = uniqueSorted(techTierValues.flatMap((tier) => collectionValues(tier.requires)
    .map((requirement) => `${tier.id}:${requirement}`)));
  const aiT3PlanKinds = aiTechPlanKinds(tactics);
  const runtimeT3Squads = collectionValues(runtime.squads)
    .filter((squadEntry) => Number(squadEntry.hp ?? 0) > 0 && t3SquadUnlockIds.has(squadEntry.squadId));
  const runtimeT3BuildingIds = uniqueSorted(collectionValues(runtime.buildings)
    .filter((buildingEntry) => Number(buildingEntry.hp ?? 0) > 0 && buildingEntry.active !== false)
    .filter((buildingEntry) => Number(buildingById.get(buildingEntry.buildingId)?.tier ?? 0) >= 3)
    .map((buildingEntry) => buildingEntry.buildingId));
  const runtimeT3SquadIds = runtimeT3Squads.map((squadEntry) => squadEntry.id ?? squadEntry.squadId).sort();
  const runtimeT3FactionKinds = uniqueSorted(runtimeT3Squads.map((squadEntry) => squadById.get(squadEntry.squadId)?.faction));
  const runtimeTechTierKinds = uniqueSorted([
    Number(runtime.techTier ?? 0) >= 3 ? "player:t3" : null,
    Number(runtime.enemyTechTier ?? 0) >= 3 ? "enemy:t3" : null
  ]);
  const runtimeEconomyBankKinds = runtimeEconomyBanks(runtime);
  const runtimePressureKinds = runtimePressures(runtime, runtimeT3Squads);
  const missingPacingPillars = [
    techTierValues.length >= 3 && maxTechTier >= 3 ? null : "three_tier_path",
    researchPacingKinds.length >= REQUIRED_RESEARCH_PACING_TIERS ? null : "t2_t3_research_time",
    techGateKinds.includes("t3_citadel:war_council") ? null : "t3_war_council_gate",
    t3UnlockKinds.length >= REQUIRED_T3_UNLOCKS && t3FactionKinds.length >= 2 ? null : "t3_unlock_breadth",
    aiT3PlanKinds.includes("t3_citadel") && aiT3PlanKinds.includes("required_build:war_council") ? null : "ai_t3_plan",
    runtimeTechTierKinds.length >= 2 ? null : "runtime_t3_tech",
    runtimeT3BuildingIds.length >= REQUIRED_RUNTIME_T3_BUILDINGS ? null : "runtime_t3_buildings",
    runtimeT3SquadIds.length >= REQUIRED_RUNTIME_T3_SQUADS && runtimeT3FactionKinds.length >= 2 ? null : "runtime_t3_army",
    runtimeEconomyBankKinds.length >= REQUIRED_RUNTIME_BANKS ? null : "runtime_t3_economy",
    runtimePressureKinds.length >= 3 ? null : "runtime_pressure"
  ].filter(Boolean);

  return {
    lateGamePacingPass: missingPacingPillars.length === 0,
    missingPacingPillars,
    techTierCount: techTierValues.length,
    techTierIds: techTierValues.map((tier) => tier.id),
    maxTechTier,
    researchPacingKinds,
    techGateKinds,
    t3UnlockKinds,
    t3FactionKinds,
    aiT3PlanKinds,
    runtimeTechTierKinds,
    runtimeT3BuildingIds,
    runtimeT3SquadIds,
    runtimeT3FactionKinds,
    runtimeEconomyBankKinds,
    runtimePressureKinds
  };
}

function unlockKindsForTier(tier, { buildingById, squadById, abilityById }) {
  return uniqueSorted(collectionValues(tier?.unlocks).flatMap((unlockId) => {
    if (buildingById.has(unlockId)) {
      return `t3_building:${unlockId}`;
    }
    if (squadById.has(unlockId)) {
      return `t3_squad:${unlockId}`;
    }
    const ability = abilityById.get(unlockId);
    if (ability && ["ultimate", "capstone"].includes(ability.kind)) {
      return `t3_ability:${unlockId}`;
    }
    return [];
  }));
}

function aiTechPlanKinds(tactics) {
  return uniqueSorted(collectionValues(tactics).flatMap((tactic) => collectionValues(tactic.techPriorities).flatMap((priority) => [
    priority.tierId,
    ...collectionValues(priority.requiredBuilds).map((build) => `required_build:${build.buildingId}`)
  ])));
}

function runtimeEconomyBanks(runtime) {
  return uniqueSorted([
    ...resourceBankKinds("player", runtime.resources, runtime.housingUsed),
    ...resourceBankKinds("enemy", runtime.enemyResources, runtime.enemyHousingUsed)
  ]);
}

function resourceBankKinds(owner, resources = {}, housingUsed = 0) {
  return [
    Number(resources.gold ?? 0) >= 250 ? `${owner}:gold_bank` : null,
    Number(resources.wood ?? 0) >= 180 ? `${owner}:wood_bank` : null,
    Number(resources.witchglass ?? 0) >= 60 ? `${owner}:witchglass_bank` : null,
    Number(resources.housing ?? 0) - Number(housingUsed ?? 0) >= 4 ? `${owner}:housing_cap` : null
  ].filter(Boolean);
}

function runtimePressures(runtime, runtimeT3Squads) {
  const orders = collectionValues(runtime.aiOrders);
  const squads = collectionValues(runtime.squads);
  return uniqueSorted([
    runtimeT3Squads.length > 0 ? "elite_army_pressure" : null,
    squads.some((squadEntry) => squadEntry.stance === "attack_move") || orders.some((order) => orderType(order) === "ATTACK") ? "attack_pressure" : null,
    squads.some((squadEntry) => squadEntry.stance === "capture") || orders.some((order) => orderType(order) === "CONTEST_OBJECTIVE") ? "objective_pressure" : null
  ]);
}

function orderType(order) {
  return typeof order === "string" ? order : order?.type;
}

function squad(id, squadId, owner, x, y, hp, maxHp, stance, target) {
  return {
    id,
    squadId,
    owner,
    x,
    y,
    hp,
    maxHp,
    morale: 100,
    stance,
    target,
    rallyPoint: owner === "enemy" ? { x: 27, y: 10 } : { x: 5, y: 10 },
    tacticalStance: stance === "capture" ? "guard" : "aggressive",
    formation: "wedge",
    targetPriority: "structures"
  };
}

function building(id, buildingId, owner, x, y, hp, maxHp, w, h) {
  return {
    id,
    buildingId,
    owner,
    x,
    y,
    w,
    h,
    hp,
    maxHp,
    active: true,
    buildRemaining: 0,
    buildTotal: 0
  };
}

function collectionValues(collection) {
  if (!collection) {
    return [];
  }
  if (collection instanceof Map) {
    return [...collection.values()];
  }
  if (collection instanceof Set) {
    return [...collection];
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
