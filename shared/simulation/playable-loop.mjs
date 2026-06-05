import { applyCost, canAfford } from "../economy/economy.mjs";
import { calculateDamage, moraleState } from "../combat/combat.mjs";
import { createReplay, recordCommand } from "../serialization/replay.mjs";

const PLAYERS = ["player", "enemy"];
const SQUAD_ORDERS = ["move", "attack_move", "hold", "capture", "retreat", "rally", "stance", "formation", "target_priority"];
const HERO_TACTICAL_ABILITY_KINDS = new Set(["active", "ultimate", "capstone"]);
const HERO_AUTO_ABILITY_KINDS = new Set(["autocast", "heal"]);
const HERO_DAMAGE_REDUCTION = 0.75;
const HERO_MORALE_REDUCTION = 0.7;
const SIMULATION_STEP_SECONDS = 0.1;
const OBJECTIVE_CAPTURE_RADIUS = 1.1;
const EPSILON = 1e-9;
const DEFAULT_TACTICAL_ORDERS = {
  stanceModes: ["guard", "aggressive"],
  formations: ["line", "wedge", "ring"],
  targetPriorities: ["squads", "structures"]
};
const AI_BUILD_LOCATIONS = {
  player: {
    farmstead: { x: 7, y: 4 },
    logging_camp: { x: 10, y: 4 },
    mineworks: { x: 10, y: 6 },
    barracks: { x: 6, y: 8 },
    cottage_cluster: { x: 10, y: 8 },
    war_council: { x: 7, y: 12 }
  },
  enemy: {
    farmstead: { x: 22, y: 4 },
    logging_camp: { x: 25, y: 4 },
    mineworks: { x: 25, y: 6 },
    barracks: { x: 22, y: 7 },
    cottage_cluster: { x: 22, y: 10 },
    war_council: { x: 22, y: 12 }
  }
};

export function createMatch(content, { mode, playerFaction, enemyFaction }) {
  const index = createContentIndex(content);
  const tech = {
    player: createTechState(content, index, 1),
    enemy: createTechState(content, index, 1)
  };

  const state = {
    mode,
    outcome: null,
    simulationTick: 0,
    stepRemainderSeconds: 0,
    factions: { player: playerFaction, enemy: enemyFaction },
    map: createMap(content),
    timeSeconds: 0,
    economyTickAccumulatorSeconds: 0,
    stockpiles: {
      player: startingStockpile(content),
      enemy: { ...startingStockpile(content), gold: 520, wood: 360, food: 70 }
    },
    housing: {
      player: { used: 3, cap: 12 },
      enemy: { used: 3, cap: 12 }
    },
    tech,
    buildings: [
      createBuildingInstance(index, { owner: "player", buildingId: "seat_of_rule", x: 2, y: 8 }),
      createBuildingInstance(index, { owner: "enemy", buildingId: "seat_of_rule", x: 26, y: 8 })
    ],
    squads: [
      createSquadInstance({ id: "player-sq-1", owner: "player", squadId: playerFaction === "hollow_legion" ? "bone_thrall_squad" : "briar_guard_squad", x: 7, y: 10, hp: 180 }),
      createSquadInstance({ id: "enemy-sq-1", owner: "enemy", squadId: enemyFaction === "thorn_court" ? "briar_guard_squad" : "bone_thrall_squad", x: 23, y: 10, hp: 180 })
    ],
    heroes: { player: [], enemy: [] },
    production: { player: [], enemy: [] },
    research: { player: { active: null }, enemy: { active: null } },
    objectives: createObjectives(content, index),
    effects: { player: {}, enemy: {} },
    allies: mode === "local_pve" ? [{ id: "ally-lodge", kind: "companion_ai", role: "secondary_lodge" }] : [],
    mission: mode === "campaign" ? { id: "c1_briar_crossing", title: "Briar Crossing", currentBeat: "secure_moon_pool" } : null,
    guidance: createGuidance(mode),
    aiOrders: { player: [], enemy: [] },
    alerts: createGuidance(mode).slice(0, 2),
    catalog: {
      buildings: content.buildings.map((building) => ({
        id: building.id,
        chassis: building.chassis,
        footprint: building.footprint
      }))
    },
    replay: createReplay(`${mode}-${playerFaction}-${enemyFaction}`)
  };

  return state;
}

export function addBuildingInstance(state, { owner, buildingId, x, y }) {
  const index = state.__index ?? null;
  const next = cloneState(state);
  const contentIndex = index ?? createContentIndexFromState(next);
  next.buildings.push(createBuildingInstance(contentIndex, { owner, buildingId, x, y, ordinal: next.buildings.length + 1 }));
  return next;
}

export function placeBuilding(state, content, { playerId, buildingId, x, y, rotation = 0 }) {
  const next = withIndex(cloneState(state), content);
  const building = next.__index.buildings.get(buildingId);
  if (!building) {
    throw new Error(`Unknown building ${buildingId}.`);
  }
  if (!next.tech[playerId].unlockedBuildings.includes(buildingId)) {
    throw new Error(`${buildingId} is locked for ${playerId}.`);
  }
  if (!isFactionLegal(next, playerId, building)) {
    throw new Error(`${buildingId} is wrong faction for ${playerId}.`);
  }
  if (!canAfford(next.stockpiles[playerId], building.costs ?? {})) {
    throw new Error(`${playerId} cannot afford ${buildingId}.`);
  }

  const footprint = rotatedFootprint(building.footprint, rotation);
  const candidate = { x, y, ...footprint };
  if (x < 0 || y < 0 || x + footprint.w > next.map.width || y + footprint.h > next.map.height) {
    throw new Error(`${buildingId} placement is out of bounds.`);
  }
  if ([...(next.map.blocked ?? []), ...next.buildings].some((blocked) => overlaps(candidate, blocked))) {
    throw new Error(`${buildingId} placement is blocked.`);
  }

  next.stockpiles[playerId] = applyCost(next.stockpiles[playerId], building.costs ?? {});
  next.buildings.push(createBuildingInstance(next.__index, {
    owner: playerId,
    buildingId,
    x,
    y,
    rotation,
    ordinal: next.buildings.length + 1,
    active: false
  }));
  next.replay = recordSimulationCommand(next, { type: "BUILD", playerId, buildingId, x, y, rotation });
  return stripIndex(next);
}

export function availableBuildingsForTier(state, content, playerId = "player") {
  const unlocked = new Set(state.tech[playerId].unlockedBuildings);
  return content.buildings.filter((building) => {
    if (building.future) {
      return false;
    }
    if (!unlocked.has(building.id)) {
      return false;
    }
    return building.faction === "shared" || building.faction === state.factions[playerId];
  });
}

export function availableProductionChoices(state, content, { playerId, producerBuildingId }) {
  const index = createContentIndex(content);
  const unlocked = new Set(state.tech[playerId].unlockedSquads);
  const producer = index.buildings.get(producerBuildingId);
  if (!producer) {
    return [];
  }
  return (producer.produces ?? [])
    .map((squadId) => index.squads.get(squadId))
    .filter((squad) => squad && unlocked.has(squad.id) && isFactionLegal(state, playerId, squad));
}

export function availableHeroesForPlayer(state, content, playerId = "player") {
  const unlocked = new Set(state.tech[playerId]?.unlockedHeroes ?? []);
  return (content.heroes ?? []).filter((hero) => unlocked.has(hero.id) && isFactionLegal(state, playerId, hero));
}

export function recruitableHeroesForPlayer(state, content, playerId = "player") {
  const recruited = new Set((state.heroes[playerId] ?? []).map((hero) => hero.heroId));
  return availableHeroesForPlayer(state, content, playerId).filter((hero) => !recruited.has(hero.id));
}

export function availableHeroAbilitiesForPlayer(state, content, { playerId = "player", includeAutocast = false } = {}) {
  const index = createContentIndex(content);
  const allowedKinds = includeAutocast
    ? new Set([...HERO_TACTICAL_ABILITY_KINDS, ...HERO_AUTO_ABILITY_KINDS])
    : HERO_TACTICAL_ABILITY_KINDS;
  const unlocked = new Set(state.tech[playerId]?.unlockedAbilities ?? []);
  const entries = [];
  for (const heroInstance of state.heroes[playerId] ?? []) {
    const hero = index.heroes.get(heroInstance.heroId);
    if (!hero || !isFactionLegal(state, playerId, hero)) {
      continue;
    }
    for (const abilityId of hero.abilityIds ?? []) {
      const ability = index.abilities.get(abilityId);
      if (!ability || !allowedKinds.has(ability.kind) || !isFactionLegal(state, playerId, ability)) {
        continue;
      }
      if (!unlocked.has(ability.id)) {
        continue;
      }
      entries.push({
        heroInstanceId: heroInstance.id,
        heroId: hero.id,
        ability,
        cooldown: heroInstance.cooldowns?.[ability.id] ?? 0
      });
    }
  }
  return entries;
}

export function enqueueProduction(state, content, { playerId, producerId, squadId }) {
  const next = withIndex(cloneState(state), content);
  const producer = next.buildings.find((building) => building.id === producerId && building.owner === playerId);
  if (!producer) {
    throw new Error(`Unknown producer ${producerId}.`);
  }
  if (producer.active === false) {
    throw new Error(`${producer.buildingId} is not complete.`);
  }

  const building = next.__index.buildings.get(producer.buildingId);
  const squad = next.__index.squads.get(squadId);
  if (!squad) {
    throw new Error(`Unknown squad ${squadId}.`);
  }
  if (!(building.produces ?? []).includes(squadId)) {
    throw new Error(`${building.id} cannot produce ${squadId}.`);
  }
  if (!isFactionLegal(next, playerId, squad)) {
    throw new Error(`${squadId} is wrong faction for ${playerId}.`);
  }
  if (!next.tech[playerId].unlockedSquads.includes(squadId)) {
    throw new Error(`${squadId} is locked for ${playerId}.`);
  }
  if (!Number.isFinite(squad.trainSeconds) || squad.trainSeconds <= 0) {
    throw new Error(`${squadId} is missing data-defined trainSeconds.`);
  }
  if (!canAfford(next.stockpiles[playerId], squad.costs ?? {})) {
    throw new Error(`${playerId} cannot afford ${squadId}.`);
  }
  if (next.housing[playerId].used + (squad.housing ?? 0) > next.housing[playerId].cap) {
    throw new Error(`${playerId} has no housing room for ${squadId}.`);
  }

  next.stockpiles[playerId] = applyCost(next.stockpiles[playerId], squad.costs ?? {});
  next.housing[playerId].used += squad.housing ?? 0;
  next.production[playerId].push({
    id: `${playerId}-prod-${next.replay.commands.length + 1}`,
    producerId,
    squadId,
    remainingSeconds: squad.trainSeconds,
    totalSeconds: squad.trainSeconds
  });
  next.replay = recordSimulationCommand(next, { type: "TRAIN_SQUAD", playerId, producerId, squadId });
  return stripIndex(next);
}

export function startResearch(state, content, { playerId, tierId }) {
  const next = withIndex(cloneState(state), content);
  const tier = next.__index.techTiers.get(tierId);
  if (!tier) {
    throw new Error(`Unknown tier ${tierId}.`);
  }
  if (!Number.isFinite(tier.researchSeconds) || tier.researchSeconds <= 0) {
    throw new Error(`${tierId} is missing data-defined researchSeconds.`);
  }
  if (next.tech[playerId].tier >= tier.tier) {
    throw new Error(`${playerId} already has ${tierId}.`);
  }
  if (next.research[playerId].active) {
    throw new Error(`${playerId} already has active research.`);
  }
  for (const required of tier.requires ?? []) {
    if (!next.buildings.some((building) => building.owner === playerId && building.buildingId === required && building.active !== false)) {
      throw new Error(`${tierId} requires ${required}.`);
    }
  }
  if (!canAfford(next.stockpiles[playerId], tier.costs ?? {})) {
    throw new Error(`${playerId} cannot afford ${tierId}.`);
  }

  next.stockpiles[playerId] = applyCost(next.stockpiles[playerId], tier.costs ?? {});
  next.research[playerId].active = {
    tierId,
    remainingSeconds: tier.researchSeconds,
    totalSeconds: tier.researchSeconds
  };
  next.replay = recordSimulationCommand(next, { type: "RESEARCH_TIER", playerId, tierId });
  return stripIndex(next);
}

export function captureObjective(state, content, { playerId, objectiveId, seconds }) {
  const next = withIndex(cloneState(state), content);
  const objective = next.objectives.find((entry) => entry.id === objectiveId);
  if (!objective) {
    throw new Error(`Unknown objective ${objectiveId}.`);
  }
  advanceObjectiveCapture(next, objective, playerId, seconds);
  return stripIndex(next);
}

export function recruitHero(state, content, { playerId, heroId }) {
  const next = withIndex(cloneState(state), content);
  const hero = next.__index.heroes.get(heroId);
  if (!hero) {
    throw new Error(`Unknown hero ${heroId}.`);
  }
  if (!isFactionLegal(next, playerId, hero)) {
    throw new Error(`${heroId} is wrong faction for ${playerId}.`);
  }
  if (!next.tech[playerId].unlockedHeroes.includes(heroId)) {
    throw new Error(`${heroId} is not unlocked for ${playerId}.`);
  }
  if (next.heroes[playerId].some((entry) => entry.heroId === heroId)) {
    throw new Error(`${heroId} is already recruited for ${playerId}.`);
  }

  next.heroes[playerId].push({
    id: `${playerId}-${heroId}-${next.heroes[playerId].length + 1}`,
    heroId,
    level: 1,
    xp: 0,
    cooldowns: {}
  });
  next.replay = recordSimulationCommand(next, { type: "RECRUIT_HERO", playerId, heroId });
  return stripIndex(next);
}

export function grantHeroXp(state, content, { playerId, heroInstanceId, xp }) {
  const next = withIndex(cloneState(state), content);
  const heroInstance = next.heroes[playerId].find((hero) => hero.id === heroInstanceId);
  if (!heroInstance) {
    throw new Error(`Unknown hero instance ${heroInstanceId}.`);
  }
  const hero = next.__index.heroes.get(heroInstance.heroId);
  heroInstance.xp += xp;
  const thresholds = hero.xpToLevel ?? [0, 200, 500, 900];
  while (heroInstance.level < thresholds.length && heroInstance.xp >= thresholds[heroInstance.level]) {
    heroInstance.level += 1;
  }
  return stripIndex(next);
}

export function useHeroAbility(state, content, { playerId, heroInstanceId, abilityId, target }) {
  const next = withIndex(cloneState(state), content);
  const heroInstance = next.heroes[playerId].find((hero) => hero.id === heroInstanceId);
  if (!heroInstance) {
    throw new Error(`Unknown hero instance ${heroInstanceId}.`);
  }
  const hero = next.__index.heroes.get(heroInstance.heroId);
  const ability = next.__index.abilities.get(abilityId);
  if (!ability || !(hero.abilityIds ?? []).includes(abilityId)) {
    throw new Error(`${hero.heroId} cannot use ${abilityId}.`);
  }
  if (!isFactionLegal(next, playerId, ability)) {
    throw new Error(`${abilityId} is wrong faction for ${playerId}.`);
  }
  if (HERO_TACTICAL_ABILITY_KINDS.has(ability.kind) && !next.tech[playerId].unlockedAbilities.includes(abilityId)) {
    throw new Error(`${abilityId} is not unlocked for ${playerId}.`);
  }
  if ((heroInstance.cooldowns[abilityId] ?? 0) > 0) {
    throw new Error(`${abilityId} is on cooldown.`);
  }

  heroInstance.cooldowns[abilityId] = ability.cooldown ?? 1;
  applyHeroAbilityEffect(next, { playerId, heroInstance, hero, ability, target });
  next.replay = recordSimulationCommand(next, { type: "HERO_ABILITY", playerId, heroInstanceId, abilityId, target });
  next.alerts.unshift(`${ability.name} ordered.`);
  return stripIndex(next);
}

export function orderSquad(state, content, { playerId, squadId, order, target, payload = {} }) {
  const next = withIndex(cloneState(state), content);
  const squad = next.squads.find((entry) => entry.id === squadId);
  if (!squad) {
    throw new Error(`Unknown squad ${squadId}.`);
  }
  if (squad.owner !== playerId) {
    throw new Error(`${playerId} does not own ${squadId}.`);
  }
  if (!SQUAD_ORDERS.includes(order)) {
    throw new Error(`Unsupported squad order ${order}.`);
  }
  if (target && !isTargetInBounds(target, next.map)) {
    throw new Error(`${order} target is out of bounds.`);
  }

  const acceptedPayload = applySquadOrder(next, squad, playerId, order, target, payload);
  const command = { type: "SQUAD_ORDER", playerId, squadId, order, target: squad.target };
  if (Object.keys(acceptedPayload).length > 0) {
    command.payload = acceptedPayload;
  }
  next.replay = recordSimulationCommand(next, command);
  return stripIndex(next);
}

function applyHeroAbilityEffect(state, { playerId, ability, target }) {
  if (ability.id === "moon_snare") {
    const squad = nearestSquad(state, { owner: opposingPlayer(playerId), target });
    if (squad) {
      squad.morale = Math.max(0, squad.morale - 25);
      squad.stance = "snared";
      squad.target = null;
      updateSquadMoraleState(state, squad);
    }
    return;
  }

  if (ability.id === "grave_command") {
    const squad = nearestSquad(state, { owner: playerId, target });
    if (squad) {
      squad.morale = Math.max(squad.morale, 65);
      squad.hp = Math.min(maxSquadHp(state, squad), squad.hp + 35);
      squad.stance = "hold";
      squad.target = null;
      updateSquadMoraleState(state, squad);
    }
    return;
  }

  if (ability.id === "hart_charge") {
    for (const squad of state.squads.filter((entry) => entry.owner === playerId && entry.hp > 0)) {
      squad.morale = Math.min(100, squad.morale + 15);
      squad.tacticalStance = "aggressive";
      squad.stance = "attack_move";
      squad.target = target ? { x: target.x, y: target.y } : enemyBaseTarget(playerId);
      updateSquadMoraleState(state, squad);
    }
    return;
  }

  if (ability.id === "wail_of_ashes") {
    const radius = ability.radius ?? 6;
    for (const squad of state.squads.filter((entry) => entry.owner === opposingPlayer(playerId) && entry.hp > 0 && isNearTarget(entry, target, radius))) {
      squad.morale = Math.max(0, squad.morale - 30);
      updateSquadMoraleState(state, squad);
      if (squad.moraleState === "broken") {
        squad.stance = "retreat";
        squad.target = defaultRallyPoint(squad.owner);
      }
    }
    return;
  }

  if (ability.id === "wild_hunt") {
    spawnHeroSquad(state, {
      playerId,
      squadId: "wild_hunt_rider_squad",
      target,
      count: 1,
      stance: "attack_move",
      orderTarget: enemyBaseTarget(playerId)
    });
    return;
  }

  if (ability.id === "court_of_bones") {
    spawnHeroSquad(state, {
      playerId,
      squadId: "bone_thrall_squad",
      target,
      count: 2,
      stance: "hold"
    });
  }
}

function nearestSquad(state, { owner, target }) {
  const candidates = state.squads.filter((squad) => squad.owner === owner && squad.hp > 0);
  if (candidates.length === 0) {
    return null;
  }
  if (!target) {
    return candidates[0];
  }
  return candidates
    .map((squad) => ({ squad, distance: Math.hypot(squad.x - target.x, squad.y - target.y) }))
    .sort((a, b) => a.distance - b.distance)[0]?.squad ?? null;
}

function isNearTarget(squad, target, radius) {
  if (!target) {
    return true;
  }
  return Math.hypot(squad.x - target.x, squad.y - target.y) <= radius;
}

function spawnHeroSquad(state, { playerId, squadId, target, count, stance = "hold", orderTarget = null }) {
  const definition = state.__index.squads.get(squadId);
  if (!definition) {
    throw new Error(`Unknown hero summon squad ${squadId}.`);
  }
  const origin = target ?? defaultRallyPoint(playerId);
  for (let index = 0; index < count; index += 1) {
    const offset = index - (count - 1) / 2;
    const squad = createSquadInstance({
      id: `${playerId}-${squadId}-hero-${state.squads.length + 1}`,
      owner: playerId,
      squadId,
      x: origin.x + offset,
      y: origin.y + Math.abs(offset) * 0.4,
      hp: definition.size * 30,
      stance
    });
    if (orderTarget) {
      squad.target = { ...orderTarget };
    }
    squad.heroSummoned = true;
    state.squads.push(squad);
  }
  state.alerts.unshift(`${definition.name} answer the hero's call.`);
}

function maxSquadHp(state, squad) {
  const definition = state.__index.squads.get(squad.squadId);
  return definition ? definition.size * 30 : Math.max(1, squad.hp);
}

function updateSquadMoraleState(state, squad) {
  const squadDefinition = state.__index.squads.get(squad.squadId);
  const profile = state.__index.morale.get(squadDefinition?.moraleProfile);
  if (profile) {
    squad.moraleState = moraleState(squad.morale, profile);
  }
}

function opposingPlayer(playerId) {
  return playerId === "enemy" ? "player" : "enemy";
}

function playerHasHeroAbility(state, playerId, abilityId) {
  return Boolean(heroInstanceWithAbility(state, playerId, abilityId));
}

function heroInstanceWithAbility(state, playerId, abilityId) {
  for (const heroInstance of state.heroes[playerId] ?? []) {
    const hero = state.__index.heroes.get(heroInstance.heroId);
    if ((hero?.abilityIds ?? []).includes(abilityId)) {
      return heroInstance;
    }
  }
  return null;
}

function constructionSpeedMultiplier(state, playerId, building) {
  return Math.max(
    factionConstructionSpeedMultiplier(state, playerId, building),
    playerHasHeroAbility(state, playerId, "rootbound_banner") ? 1.35 : 1
  );
}

function productionSpeedMultiplier(state, playerId) {
  return Math.max(
    factionProductionSpeedMultiplier(state, playerId),
    playerHasHeroAbility(state, playerId, "bone_regalia") ? 1.25 : 1
  );
}

function enemyBaseTarget(playerId) {
  return playerId === "enemy" ? { x: 5, y: 10 } : { x: 27, y: 10 };
}

function factionDefinition(state, playerId) {
  return state.__index.factions.get(state.factions[playerId]);
}

function factionMechanic(state, playerId) {
  return factionDefinition(state, playerId)?.mechanic ?? null;
}

function factionConstructionSpeedMultiplier(state, playerId, building) {
  const mechanic = factionMechanic(state, playerId);
  if (mechanic?.id !== "rootbound_realm") {
    return 1;
  }
  return building && isWithinFactionAura(state, playerId, building) ? mechanic.constructionSpeedMultiplier ?? 1 : 1;
}

function factionProductionSpeedMultiplier(state, playerId) {
  const mechanic = factionMechanic(state, playerId);
  if (mechanic?.id === "rootbound_realm") {
    return ownsObjective(state, playerId, "moon_pool") ? mechanic.productionSpeedMultiplier ?? 1 : 1;
  }
  if (mechanic?.id === "dreadsoil") {
    return (state.effects[playerId]?.dreadsoil ?? 0) > 0 ? mechanic.productionSpeedMultiplier ?? 1 : 1;
  }
  return 1;
}

function ownsObjective(state, playerId, objectiveId) {
  return state.objectives.some((objective) => objective.id === objectiveId && objective.owner === playerId);
}

function rootedAuraCount(state, playerId) {
  const mechanic = factionMechanic(state, playerId);
  if (mechanic?.id !== "rootbound_realm") {
    return 0;
  }
  const activeStructures = state.buildings.filter((building) => building.owner === playerId && building.active !== false && building.hp > 0);
  const ownedObjectives = state.objectives.filter((objective) => objective.owner === playerId && Number.isFinite(objective.x) && Number.isFinite(objective.y));
  return activeStructures.length + ownedObjectives.length;
}

function isWithinFactionAura(state, playerId, entity) {
  const mechanic = factionMechanic(state, playerId);
  if (!mechanic?.auraRadius) {
    return false;
  }
  const points = [
    ...state.buildings
      .filter((building) => building.owner === playerId && building.active !== false && building.hp > 0)
      .map((building) => centerOf(building)),
    ...state.objectives
      .filter((objective) => objective.owner === playerId && Number.isFinite(objective.x) && Number.isFinite(objective.y))
      .map((objective) => ({ x: objective.x, y: objective.y }))
  ];
  const entityCenter = centerOf(entity);
  return points.some((point) => Math.hypot(point.x - entityCenter.x, point.y - entityCenter.y) <= mechanic.auraRadius);
}

function centerOf(entity) {
  return {
    x: entity.x + (entity.w ?? 0) / 2,
    y: entity.y + (entity.h ?? 0) / 2
  };
}

function updateFactionMechanicEffects(state) {
  for (const playerId of PLAYERS) {
    const mechanic = factionMechanic(state, playerId);
    if (!mechanic) {
      continue;
    }
    if (mechanic.id === "rootbound_realm") {
      state.effects[playerId].rootboundRealm = rootedAuraCount(state, playerId);
    }
    if (mechanic.id === "dreadsoil") {
      state.effects[playerId].dreadsoilAnchors = state.buildings.filter((building) => building.owner === playerId && building.active !== false && building.hp > 0).length;
    }
  }
}

function applySquadOrder(state, squad, playerId, order, target, payload) {
  squad.stance = order;
  if (order === "hold") {
    clearSharedFormationAnchor(squad);
    squad.target = null;
    return {};
  }
  if (order === "retreat") {
    squad.target = target ? { x: target.x, y: target.y } : defaultRallyPoint(playerId);
    return applySharedFormationAssignment(squad, payload.formationAssignment);
  }
  if (order === "rally") {
    if (!target) {
      throw new Error("rally requires a target.");
    }
    squad.rallyPoint = { x: target.x, y: target.y };
    squad.target = { ...squad.rallyPoint };
    return applySharedFormationAssignment(squad, payload.formationAssignment);
  }
  if (order === "stance") {
    const stanceMode = payload.stanceMode;
    if (!tacticalOptions(state).stanceModes.includes(stanceMode)) {
      throw new Error(`Invalid stance mode ${stanceMode}.`);
    }
    clearSharedFormationAnchor(squad);
    squad.tacticalStance = stanceMode;
    squad.target = null;
    return { stanceMode };
  }
  if (order === "formation") {
    const formation = payload.formation;
    if (!tacticalOptions(state).formations.includes(formation)) {
      throw new Error(`Invalid formation ${formation}.`);
    }
    clearSharedFormationAnchor(squad);
    squad.formation = formation;
    squad.target = null;
    return { formation };
  }
  if (order === "target_priority") {
    const targetPriority = payload.targetPriority;
    if (!tacticalOptions(state).targetPriorities.includes(targetPriority)) {
      throw new Error(`Invalid target priority ${targetPriority}.`);
    }
    clearSharedFormationAnchor(squad);
    squad.targetPriority = targetPriority;
    squad.target = null;
    return { targetPriority };
  }
  squad.target = target ? { x: target.x, y: target.y } : null;
  return applySharedFormationAssignment(squad, payload.formationAssignment);
}

function applySharedFormationAssignment(squad, assignment) {
  clearSharedFormationAnchor(squad);
  if (!assignment || !assignment.target) {
    return {};
  }
  squad.formation = assignment.formation ?? squad.formation;
  squad.formationBaseTarget = assignment.baseTarget ? { x: assignment.baseTarget.x, y: assignment.baseTarget.y } : null;
  squad.formationAnchorTarget = { x: assignment.target.x, y: assignment.target.y };
  squad.formationSlotIndex = assignment.slotIndex ?? null;
  squad.formationGroupSize = assignment.groupSize ?? null;
  squad.formationAnchorKind = assignment.anchorKind ?? null;
  squad.formationTargetOffsetKind = assignment.targetOffsetKind ?? null;
  return {
    formationAssignment: {
      formation: squad.formation,
      anchorKind: squad.formationAnchorKind,
      targetOffsetKind: squad.formationTargetOffsetKind,
      slotIndex: squad.formationSlotIndex,
      groupSize: squad.formationGroupSize,
      baseTarget: squad.formationBaseTarget,
      target: squad.formationAnchorTarget
    }
  };
}

function clearSharedFormationAnchor(squad) {
  squad.formationBaseTarget = null;
  squad.formationAnchorTarget = null;
  squad.formationSlotIndex = null;
  squad.formationGroupSize = null;
  squad.formationAnchorKind = null;
  squad.formationTargetOffsetKind = null;
}

export function replayMatch(content, { mode, playerFaction, enemyFaction, commands }) {
  let state = createMatch(content, { mode, playerFaction, enemyFaction });
  for (const command of commands) {
    const targetTick = command.tick ?? state.simulationTick;
    if (targetTick < state.simulationTick) {
      throw new Error(`Replay command ${command.type} is earlier than the current simulation tick.`);
    }
    state = tickMatchToSimulationTick(state, content, targetTick);
    if (command.type === "MATCH_END") {
      if (state.outcome !== command.outcome) {
        throw new Error(`Replay expected ${command.outcome} but reached ${state.outcome ?? "no outcome"}.`);
      }
      continue;
    }
    state = applyReplayCommand(state, content, command);
  }
  return state;
}

export function runAiDirectorTick(state, content, { playerId }) {
  const next = withIndex(cloneState(state), content);
  const tactic = next.__index.tactics.get("balanced_skirmish_ai");
  const orders = [];
  const plan = createAiOrderPlan(next, playerId);

  const buildOrder = nextBuildOrder(next, tactic, playerId);
  if (buildOrder && reserveAiOrder(next, playerId, buildOrder, plan)) {
    orders.push(buildOrder);
  }

  const techOrder = nextResearchOrder(next, tactic, playerId);
  if (techOrder && reserveAiOrder(next, playerId, techOrder, plan)) {
    orders.push(techOrder);
  }

  const productionOrder = nextProductionOrder(next, tactic, playerId, plan);
  if (productionOrder && reserveAiOrder(next, playerId, productionOrder, plan)) {
    orders.push(productionOrder);
  }

  for (const squad of next.squads.filter((entry) => entry.owner === playerId && entry.morale < tactic.retreatMoraleBelow)) {
    orders.push({ type: "RETREAT", squadId: squad.id });
  }

  const objective = next.objectives.find((entry) => entry.owner !== playerId);
  if (objective && tactic.contestObjectives) {
    orders.push({ type: "CONTEST_OBJECTIVE", objectiveId: objective.id });
  }

  const armyValue = next.squads.filter((entry) => entry.owner === playerId && entry.hp > 0).length * 100;
  if (armyValue >= tactic.attackWhenArmyValueAtLeast) {
    orders.push({ type: "ATTACK", target: playerId === "enemy" ? "player_base" : "enemy_base" });
  }

  next.aiOrders[playerId] = orders;
  return stripIndex(next);
}

function nextResearchOrder(state, tactic, playerId) {
  if (state.research[playerId]?.active) {
    return null;
  }
  for (const priority of tactic.techPriorities ?? []) {
    const tier = state.__index.techTiers.get(priority.tierId);
    if (!tier || state.tech[playerId].tier >= tier.tier) {
      continue;
    }
    const missingRequired = (tier.requires ?? []).find((buildingId) => !hasActiveBuilding(state, playerId, buildingId));
    if (missingRequired) {
      if (hasAnyBuilding(state, playerId, missingRequired)) {
        return null;
      }
      const build = (priority.requiredBuilds ?? []).find((entry) => entry.buildingId === missingRequired);
      if (build && canPlanBuild(state, playerId, build.buildingId)) {
        return { type: "BUILD", buildingId: build.buildingId, x: build.x, y: build.y };
      }
      const location = aiBuildLocation(playerId, missingRequired);
      if (location && canPlanBuild(state, playerId, missingRequired)) {
        return { type: "BUILD", buildingId: missingRequired, ...location };
      }
      return null;
    }
    if (canAfford(state.stockpiles[playerId], tier.costs ?? {})) {
      return { type: "RESEARCH_TIER", tierId: tier.id };
    }
    return null;
  }
  return null;
}

function nextBuildOrder(state, tactic, playerId) {
  for (const buildingId of tactic?.buildPriorities ?? []) {
    if (buildingId === "seat_of_rule" || hasAnyBuilding(state, playerId, buildingId)) {
      continue;
    }
    const location = aiBuildLocation(playerId, buildingId);
    if (location && canPlanBuild(state, playerId, buildingId)) {
      return { type: "BUILD", buildingId, ...location };
    }
  }
  return null;
}

function nextProductionOrder(state, tactic, playerId, plan = null) {
  const candidates = productionCandidates(state, playerId, plan);
  if (candidates.length === 0) {
    return null;
  }
  const priorities = tactic?.armyPriorities ?? [];
  const rankedRoles = priorities
    .map((role, index) => ({
      role,
      index,
      count: productionRoleCount(state, playerId, role),
      candidates: candidates.filter((candidate) => roleMatches(candidate.role, role))
    }))
    .filter((entry) => entry.candidates.length > 0)
    .sort((left, right) => left.count - right.count || left.index - right.index);
  const candidate = rankedRoles[0]?.candidates[0] ?? candidates[0];
  return { type: "TRAIN_SQUAD", producerId: candidate.producerId, squadId: candidate.squadId };
}

function productionCandidates(state, playerId, plan = null) {
  const candidates = [];
  const stockpile = plan?.stockpile ?? state.stockpiles[playerId];
  const housing = plan?.housing ?? state.housing[playerId];
  for (const producer of state.buildings.filter((building) => building.owner === playerId && building.active !== false)) {
    const building = state.__index.buildings.get(producer.buildingId);
    for (const squadId of building?.produces ?? []) {
      const squad = state.__index.squads.get(squadId);
      if (!squad || !state.tech[playerId].unlockedSquads.includes(squadId) || !isFactionLegal(state, playerId, squad)) {
        continue;
      }
      if (!canAfford(stockpile, squad.costs ?? {})) {
        continue;
      }
      if (housing.used + (squad.housing ?? 0) > housing.cap) {
        continue;
      }
      const unit = state.__index.units.get(squad.unitId);
      candidates.push({ producerId: producer.id, squadId, role: unit?.role ?? "" });
    }
  }
  return candidates;
}

function productionRoleCount(state, playerId, role) {
  const living = state.squads.filter((squad) => {
    const definition = state.__index.squads.get(squad.squadId);
    const unit = state.__index.units.get(definition?.unitId);
    return squad.owner === playerId && squad.hp > 0 && roleMatches(unit?.role ?? "", role);
  }).length;
  const queued = state.production[playerId].filter((item) => {
    const definition = state.__index.squads.get(item.squadId);
    const unit = state.__index.units.get(definition?.unitId);
    return roleMatches(unit?.role ?? "", role);
  }).length;
  return living + queued;
}

function roleMatches(unitRole, desiredRole) {
  return unitRole === desiredRole || unitRole.includes(desiredRole) || desiredRole.includes(unitRole);
}

function createAiOrderPlan(state, playerId) {
  return {
    stockpile: { ...state.stockpiles[playerId] },
    housing: { ...state.housing[playerId] },
    plannedBuildings: new Set()
  };
}

function reserveAiOrder(state, playerId, order, plan) {
  if (order.type === "BUILD") {
    if (plan.plannedBuildings.has(order.buildingId)) {
      return false;
    }
    const building = state.__index.buildings.get(order.buildingId);
    if (!building || !canAfford(plan.stockpile, building.costs ?? {})) {
      return false;
    }
    plan.stockpile = applyCost(plan.stockpile, building.costs ?? {});
    plan.plannedBuildings.add(order.buildingId);
    return true;
  }

  if (order.type === "RESEARCH_TIER") {
    const tier = state.__index.techTiers.get(order.tierId);
    if (!tier || !canAfford(plan.stockpile, tier.costs ?? {})) {
      return false;
    }
    plan.stockpile = applyCost(plan.stockpile, tier.costs ?? {});
    return true;
  }

  if (order.type === "TRAIN_SQUAD") {
    const squad = state.__index.squads.get(order.squadId);
    if (!squad || !canAfford(plan.stockpile, squad.costs ?? {})) {
      return false;
    }
    if (plan.housing.used + (squad.housing ?? 0) > plan.housing.cap) {
      return false;
    }
    plan.stockpile = applyCost(plan.stockpile, squad.costs ?? {});
    plan.housing.used += squad.housing ?? 0;
    return true;
  }

  return true;
}

function aiBuildLocation(playerId, buildingId) {
  return AI_BUILD_LOCATIONS[playerId]?.[buildingId] ?? null;
}

export function tickMatch(state, content, seconds) {
  const next = withIndex(cloneState(state), content);
  if (next.outcome) {
    return stripIndex(next);
  }
  let remaining = (next.stepRemainderSeconds ?? 0) + seconds;
  while (remaining + EPSILON >= SIMULATION_STEP_SECONDS && !next.outcome) {
    advanceFixedStep(next);
    remaining -= SIMULATION_STEP_SECONDS;
  }
  next.stepRemainderSeconds = next.outcome ? 0 : Math.max(0, Number(remaining.toFixed(10)));
  return stripIndex(next);
}

export function applyMoralePressure(state, content, { squadId, losses = 0, flanked = false, heroDeath = false, feared = false, bombarded = false }) {
  const next = withIndex(cloneState(state), content);
  const squad = next.squads.find((entry) => entry.id === squadId);
  if (!squad) {
    throw new Error(`Unknown squad ${squadId}.`);
  }
  const squadDefinition = next.__index.squads.get(squad.squadId);
  const profile = next.__index.morale.get(squadDefinition.moraleProfile);
  const lossPenalty = losses * (profile.lossPenalty ?? 0);
  const pressure = lossPenalty
    + (flanked ? profile.flankedPenalty ?? 0 : 0)
    + (heroDeath ? profile.heroDeathPenalty ?? 0 : 0)
    + (feared ? profile.fearPenalty ?? 0 : 0)
    + (bombarded ? profile.bombardmentPenalty ?? 0 : 0);
  squad.morale = Math.max(0, squad.morale - pressure);
  squad.moraleState = moraleState(squad.morale, profile);
  if (squad.moraleState === "broken") {
    squad.stance = "retreat";
    squad.target = { x: squad.owner === "enemy" ? 27 : 5, y: 10 };
  }
  return stripIndex(next);
}

function applyReplayCommand(state, content, command) {
  if (command.type === "BUILD") {
    return placeBuilding(state, content, command);
  }
  if (command.type === "TRAIN_SQUAD") {
    return enqueueProduction(state, content, command);
  }
  if (command.type === "RESEARCH_TIER") {
    return startResearch(state, content, command);
  }
  if (command.type === "CAPTURE_OBJECTIVE") {
    return captureObjective(state, content, { ...command, seconds: 999 });
  }
  if (command.type === "RECRUIT_HERO") {
    return recruitHero(state, content, command);
  }
  if (command.type === "HERO_ABILITY") {
    return useHeroAbility(state, content, command);
  }
  if (command.type === "SQUAD_ORDER") {
    return orderSquad(state, content, command);
  }
  throw new Error(`Cannot replay command type ${command.type}.`);
}

function tickMatchToSimulationTick(state, content, targetTick) {
  const next = withIndex(cloneState(state), content);
  if (targetTick < next.simulationTick) {
    throw new Error(`Cannot rewind simulation from tick ${next.simulationTick} to ${targetTick}.`);
  }
  while (next.simulationTick < targetTick && !next.outcome) {
    advanceFixedStep(next);
  }
  next.stepRemainderSeconds = 0;
  return stripIndex(next);
}

function advanceFixedStep(state) {
  state.simulationTick += 1;
  state.timeSeconds = Number((state.simulationTick * SIMULATION_STEP_SECONDS).toFixed(10));
  tickEconomy(state, SIMULATION_STEP_SECONDS);
  tickConstruction(state, SIMULATION_STEP_SECONDS);
  tickProduction(state, SIMULATION_STEP_SECONDS);
  tickResearch(state, SIMULATION_STEP_SECONDS);
  tickObjectives(state, SIMULATION_STEP_SECONDS);
  tickHeroCooldowns(state, SIMULATION_STEP_SECONDS);
  tickHeroAutocasts(state);
  tickMoraleRecovery(state, SIMULATION_STEP_SECONDS);
  tickSquadOrders(state, SIMULATION_STEP_SECONDS);
  tickObjectiveCapture(state, SIMULATION_STEP_SECONDS);
  resolveCombat(state, SIMULATION_STEP_SECONDS);
  checkOutcome(state);
}

function tickEconomy(state, seconds) {
  state.economyTickAccumulatorSeconds = (state.economyTickAccumulatorSeconds ?? 0) + seconds;
  while (state.economyTickAccumulatorSeconds + EPSILON >= 1) {
    state.economyTickAccumulatorSeconds -= 1;
    state.economyTickAccumulatorSeconds = Math.max(0, Number(state.economyTickAccumulatorSeconds.toFixed(10)));
    for (const building of state.buildings) {
      if (building.active === false || !state.stockpiles[building.owner]) {
        continue;
      }
      const definition = state.__index.buildings.get(building.buildingId);
      for (const [resource, amount] of Object.entries(definition?.income ?? {})) {
        if (resource in state.stockpiles[building.owner]) {
          state.stockpiles[building.owner][resource] += amount;
        }
      }
    }
  }
}

function tickConstruction(state, seconds) {
  updateFactionMechanicEffects(state);
  for (const building of state.buildings) {
    if (building.active !== false) {
      continue;
    }
    const adjustedSeconds = seconds * constructionSpeedMultiplier(state, building.owner, building);
    building.buildRemainingSeconds = Math.max(0, (building.buildRemainingSeconds ?? 0) - adjustedSeconds);
    const total = building.buildTotalSeconds ?? building.buildRemainingSeconds ?? 0;
    if (total > 0) {
      const progress = 1 - building.buildRemainingSeconds / total;
      building.hp = Math.max(80, building.maxHp * Math.min(1, progress));
    }
    if (building.buildRemainingSeconds > EPSILON) {
      continue;
    }
    building.active = true;
    building.buildRemainingSeconds = 0;
    building.hp = building.maxHp;
    const definition = state.__index.buildings.get(building.buildingId);
    const housing = definition?.provides?.housing ?? 0;
    if (housing > 0 && state.housing[building.owner]) {
      state.housing[building.owner].cap += housing;
    }
    state.alerts.unshift(`${definition?.name ?? building.buildingId} complete.`);
  }
}

function tickProduction(state, seconds) {
  updateFactionMechanicEffects(state);
  for (const playerId of PLAYERS) {
    const complete = [];
    for (const item of state.production[playerId]) {
      item.remainingSeconds -= seconds * productionSpeedMultiplier(state, playerId);
      if (item.remainingSeconds <= EPSILON) {
        complete.push(item);
      }
    }
    state.production[playerId] = state.production[playerId].filter((item) => item.remainingSeconds > EPSILON);
    for (const item of complete) {
      const producer = state.buildings.find((building) => building.id === item.producerId);
      const squad = state.__index.squads.get(item.squadId);
      state.squads.push(createSquadInstance({
        id: `${playerId}-${item.squadId}-${state.squads.length + 1}`,
        owner: playerId,
        squadId: item.squadId,
        x: producer ? producer.x + producer.w + 1 : 8,
        y: producer ? producer.y + 1 : 10,
        hp: squad.size * 30,
        stance: "rally"
      }));
      state.alerts.unshift(`${squad.name} ready.`);
    }
  }
}

function tickResearch(state, seconds) {
  for (const playerId of PLAYERS) {
    const active = state.research[playerId].active;
    if (!active) {
      continue;
    }
    active.remainingSeconds -= seconds;
    if (active.remainingSeconds <= EPSILON) {
      const tier = state.__index.techTiers.get(active.tierId);
      state.tech[playerId].tier = Math.max(state.tech[playerId].tier, tier.tier);
      unlockTier(state.tech[playerId], state.__index, tier);
      state.research[playerId].active = null;
      state.alerts.unshift(`${tier.name} complete.`);
    }
  }
}

function tickObjectives(state, seconds) {
  for (const objective of state.objectives) {
    if (!objective.owner) {
      continue;
    }
    const definition = state.__index.objectives.get(objective.id);
    objective.tickAccumulator += seconds;
    while (objective.tickAccumulator + EPSILON >= (definition.tickSeconds ?? 30)) {
      objective.tickAccumulator -= definition.tickSeconds ?? 30;
      objective.tickAccumulator = Math.max(0, Number(objective.tickAccumulator.toFixed(10)));
      for (const [resource, amount] of Object.entries(definition.reward ?? {})) {
        if (resource in state.stockpiles[objective.owner]) {
          state.stockpiles[objective.owner][resource] += amount;
        } else {
          state.effects[objective.owner][resource] = (state.effects[objective.owner][resource] ?? 0) + amount;
        }
      }
    }
  }
}

function tickObjectiveCapture(state, seconds) {
  for (const squad of state.squads) {
    if (squad.hp <= 0 || squad.stance !== "capture") {
      continue;
    }
    const objective = state.objectives.find((entry) => (
      entry.owner !== squad.owner
      && Number.isFinite(entry.x)
      && Number.isFinite(entry.y)
      && Math.hypot(entry.x - squad.x, entry.y - squad.y) <= OBJECTIVE_CAPTURE_RADIUS
    ));
    if (objective) {
      advanceObjectiveCapture(state, objective, squad.owner, seconds);
    }
  }
}

function advanceObjectiveCapture(state, objective, playerId, seconds) {
  const definition = state.__index.objectives.get(objective.id);
  objective.progress[playerId] = Math.min(definition.captureSeconds, (objective.progress[playerId] ?? 0) + seconds);
  if (objective.progress[playerId] >= definition.captureSeconds && objective.owner !== playerId) {
    objective.owner = playerId;
    objective.tickAccumulator = 0;
    state.alerts.unshift(`${definition.name} captured by ${playerId}.`);
    state.replay = recordSimulationCommand(state, { type: "CAPTURE_OBJECTIVE", playerId, objectiveId: objective.id });
  }
}

function tickMoraleRecovery(state, seconds) {
  for (const squad of state.squads) {
    const mechanic = factionMechanic(state, squad.owner);
    const rootboundRecovery = mechanic?.id === "rootbound_realm" && isWithinFactionAura(state, squad.owner, squad)
      ? mechanic.moraleRecoveryPerSecond ?? 0
      : 0;
    if (squad.stance !== "retreat" && rootboundRecovery <= 0) {
      continue;
    }
    const recoveryPerSecond = (squad.stance === "retreat" ? 0.75 : 0) + rootboundRecovery;
    squad.morale = Math.min(100, squad.morale + seconds * recoveryPerSecond);
    const squadDefinition = state.__index.squads.get(squad.squadId);
    const profile = state.__index.morale.get(squadDefinition.moraleProfile);
    squad.moraleState = moraleState(squad.morale, profile);
  }
}

function tickHeroCooldowns(state, seconds) {
  for (const playerId of PLAYERS) {
    for (const hero of state.heroes[playerId]) {
      for (const [abilityId, cooldown] of Object.entries(hero.cooldowns)) {
        hero.cooldowns[abilityId] = Math.max(0, cooldown - seconds);
      }
    }
  }
}

function tickHeroAutocasts(state) {
  for (const playerId of PLAYERS) {
    castDewMending(state, playerId);
    castMourningLitany(state, playerId);
  }
}

function castDewMending(state, playerId) {
  const hero = heroInstanceWithAbility(state, playerId, "dew_mending");
  if (!hero || (hero.cooldowns.dew_mending ?? 0) > 0) {
    return;
  }
  const wounded = state.squads
    .filter((squad) => squad.owner === playerId && squad.hp > 0 && squad.hp < maxSquadHp(state, squad))
    .sort((a, b) => (a.hp / maxSquadHp(state, a)) - (b.hp / maxSquadHp(state, b)))[0];
  if (!wounded) {
    return;
  }
  const ability = state.__index.abilities.get("dew_mending");
  wounded.hp = Math.min(maxSquadHp(state, wounded), wounded.hp + 28);
  hero.cooldowns.dew_mending = ability?.cooldown ?? 18;
  state.alerts.unshift(`${ability?.name ?? "Dew Mending"} autocast.`);
}

function castMourningLitany(state, playerId) {
  const hero = heroInstanceWithAbility(state, playerId, "mourning_litany");
  if (!hero || (hero.cooldowns.mourning_litany ?? 0) > 0) {
    return;
  }
  const target = state.squads.find((squad) => squad.owner === opposingPlayer(playerId) && squad.hp > 0 && squad.morale > 0);
  if (!target) {
    return;
  }
  const ability = state.__index.abilities.get("mourning_litany");
  target.morale = Math.max(0, target.morale - 18);
  updateSquadMoraleState(state, target);
  hero.cooldowns.mourning_litany = ability?.cooldown ?? 22;
  state.alerts.unshift(`${ability?.name ?? "Mourning Litany"} autocast.`);
}

function tickSquadOrders(state, seconds) {
  for (const squad of state.squads) {
    if (squad.hp <= 0 || !squad.target) {
      continue;
    }
    const dx = squad.target.x - squad.x;
    const dy = squad.target.y - squad.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 0.1) {
      squad.target = null;
      clearSharedFormationAnchor(squad);
      continue;
    }
    const speed = movementSpeedForOrder(state, squad.stance);
    const step = Math.min(distance, speed * seconds);
    const avoidance = squad.formationAnchorTarget ? squadLocalAvoidanceVector(squad, state.squads, 0.62) : { x: 0, y: 0 };
    squad.x = clamp(squad.x + avoidance.x * seconds * 0.9 + (dx / distance) * step, 0.25, state.map.width - 0.25);
    squad.y = clamp(squad.y + avoidance.y * seconds * 0.9 + (dy / distance) * step, 0.25, state.map.height - 0.25);
  }
}

function squadLocalAvoidanceVector(squad, squads, minSpacing) {
  let x = 0;
  let y = 0;
  for (const neighbor of squads) {
    if (neighbor.id === squad.id || neighbor.owner !== squad.owner || neighbor.hp <= 0) {
      continue;
    }
    const dx = squad.x - neighbor.x;
    const dy = squad.y - neighbor.y;
    const distance = Math.hypot(dx, dy);
    if (distance >= minSpacing) {
      continue;
    }
    const fallback = deterministicUnitVector(`${squad.id}:${neighbor.id}`);
    const nx = distance > 0.001 ? dx / distance : fallback.x;
    const ny = distance > 0.001 ? dy / distance : fallback.y;
    const force = (minSpacing - distance) / minSpacing;
    x += nx * force;
    y += ny * force;
  }
  return { x, y };
}

function deterministicUnitVector(seed) {
  let hash = 0;
  for (let index = 0; index < String(seed).length; index += 1) {
    hash = ((hash << 5) - hash + String(seed).charCodeAt(index)) | 0;
  }
  const angle = ((Math.abs(hash) % 360) / 360) * Math.PI * 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveCombat(state, seconds) {
  for (const squad of state.squads.filter((entry) => entry.hp > 0)) {
    const profile = combatProfile(state, squad);
    const priorityStructure = squad.targetPriority === "structures" ? attackableEnemySeat(state, squad, profile) : null;
    if (priorityStructure) {
      damageStructure(state, priorityStructure, profile, seconds);
      continue;
    }

    const enemySquad = state.squads.find((enemy) => (
      enemy.hp > 0
      && enemy.owner !== squad.owner
      && Math.hypot(enemy.x - squad.x, enemy.y - squad.y) <= profile.range
    ));
    if (enemySquad) {
      damageSquad(state, enemySquad, squad.owner, {
        amount: profile.damagePerSecond,
        damageClass: profile.damageClass,
        armorClass: combatProfile(state, enemySquad).armorClass,
        seconds
      });
      continue;
    }

    if (squad.stance !== "attack_move") {
      continue;
    }
    const enemySeat = attackableEnemySeat(state, squad, profile);
    if (enemySeat) {
      damageStructure(state, enemySeat, profile, seconds);
    }
  }

  state.squads = state.squads.filter((squad) => squad.hp > -20);
}

function attackableEnemySeat(state, squad, profile) {
  if (squad.stance !== "attack_move") {
    return null;
  }
  const enemySeat = state.buildings.find((building) => building.owner !== squad.owner && building.buildingId === "seat_of_rule");
  if (!enemySeat) {
    return null;
  }
  const seatCenter = { x: enemySeat.x + enemySeat.w / 2, y: enemySeat.y + enemySeat.h / 2 };
  const structureRange = Math.max(simulationTuning(state).structureAttackMinRange, profile.range);
  return Math.hypot(seatCenter.x - squad.x, seatCenter.y - squad.y) <= structureRange ? enemySeat : null;
}

function damageSquad(state, target, attackerOwner, { amount, damageClass, armorClass, seconds }) {
  const hpBefore = target.hp;
  const rawDamage = calculateDamage({
    amount,
    damageClass,
    armorClass,
    table: state.__index.combat?.damageMultipliers
  }) * seconds;
  const damage = playerHasHeroAbility(state, target.owner, "briar_aegis") ? rawDamage * HERO_DAMAGE_REDUCTION : rawDamage;
  const moraleDamage = playerHasHeroAbility(state, target.owner, "briar_aegis") ? 6 * seconds * HERO_MORALE_REDUCTION : 6 * seconds;
  target.hp -= damage;
  target.morale = Math.max(0, target.morale - moraleDamage);
  updateSquadMoraleState(state, target);
  if (hpBefore > 0 && target.hp <= 0) {
    handleSquadDeath(state, target, attackerOwner);
  }
}

function handleSquadDeath(state, target, attackerOwner) {
  const mechanic = factionMechanic(state, attackerOwner);
  const mechanicEssence = mechanic?.id === "dreadsoil" ? mechanic.killSoulEssence ?? 0 : 0;
  const heroEssence = playerHasHeroAbility(state, attackerOwner, "dread_edict") ? 1 : 0;
  const soulEssence = Math.max(mechanicEssence, heroEssence);
  if (soulEssence <= 0) {
    return;
  }
  state.effects[attackerOwner].soulEssence = (state.effects[attackerOwner].soulEssence ?? 0) + soulEssence;
  state.effects[attackerOwner].dreadsoil = (state.effects[attackerOwner].dreadsoil ?? 0) + soulEssence;
  state.alerts.unshift(heroEssence > 0 ? "Dread Edict harvests soul essence." : "Dreadsoil drinks in the fallen.");
}

function damageStructure(state, structure, profile, seconds) {
  structure.hp -= calculateDamage({
    amount: profile.damagePerSecond,
    damageClass: profile.damageClass,
    armorClass: "structure",
    table: state.__index.combat?.damageMultipliers
  }) * seconds;
}

function checkOutcome(state) {
  if (state.outcome) {
    return;
  }
  const playerSeat = state.buildings.find((building) => building.owner === "player" && building.buildingId === "seat_of_rule");
  const enemySeat = state.buildings.find((building) => building.owner === "enemy" && building.buildingId === "seat_of_rule");
  if (enemySeat?.hp <= 0) {
    state.outcome = "victory";
    state.alerts.unshift("Victory: the Hollow seat collapses.");
    state.replay = recordSimulationCommand(state, { type: "MATCH_END", outcome: "victory" });
  } else if (playerSeat?.hp <= 0) {
    state.outcome = "defeat";
    state.alerts.unshift("Defeat: the Seat of Rule has fallen.");
    state.replay = recordSimulationCommand(state, { type: "MATCH_END", outcome: "defeat" });
  }
}

function combatProfile(state, squad) {
  const squadDefinition = state.__index.squads.get(squad.squadId);
  const unit = state.__index.units.get(squadDefinition.unitId);
  const role = unit.role ?? "";
  const range = combatRangeForRole(simulationTuning(state), role);
  return {
    armorClass: unit.armorClass,
    damageClass: unit.damageClass,
    damagePerSecond: unit.damage * squadDefinition.size,
    range
  };
}

function movementSpeedForOrder(state, order) {
  const speeds = simulationTuning(state).movementSpeeds ?? {};
  const speed = speeds[order] ?? speeds.default;
  if (!Number.isFinite(speed) || speed <= 0) {
    throw new Error(`Simulation tuning is missing a positive movement speed for ${order}.`);
  }
  return speed;
}

function combatRangeForRole(tuning, role) {
  const ranges = tuning.combatRanges ?? {};
  const range = ranges[role]
    ?? (role.includes("ranged") ? ranges.ranged : null)
    ?? (role.includes("caster") ? ranges.caster : null)
    ?? (role.includes("siege") ? ranges.siege : null)
    ?? ranges.default;
  if (!Number.isFinite(range) || range <= 0) {
    throw new Error(`Simulation tuning is missing a positive combat range for ${role || "default"}.`);
  }
  return range;
}

function simulationTuning(state) {
  const tuning = state.__index.simulation;
  if (!tuning) {
    throw new Error("Simulation tuning content is missing.");
  }
  return tuning;
}

function tacticalOptions(state) {
  const configured = simulationTuning(state).tacticalOrders ?? {};
  return {
    stanceModes: configured.stanceModes ?? DEFAULT_TACTICAL_ORDERS.stanceModes,
    formations: configured.formations ?? DEFAULT_TACTICAL_ORDERS.formations,
    targetPriorities: configured.targetPriorities ?? DEFAULT_TACTICAL_ORDERS.targetPriorities
  };
}

function defaultRallyPoint(playerId) {
  return playerId === "enemy" ? { x: 27, y: 10 } : { x: 5, y: 10 };
}

function createContentIndex(content) {
  return {
    abilities: mapById(content.abilities),
    buildings: mapById(content.buildings),
    combat: content.combat?.[0],
    factions: mapById(content.factions),
    heroes: mapById(content.heroes),
    morale: mapById(content.morale),
    objectives: mapById(content.objectives),
    simulation: content.simulation?.[0] ?? null,
    squads: mapById(content.squads),
    tactics: mapById(content.tactics),
    techTiers: mapById(content.techTree?.tiers ?? []),
    units: mapById(content.units)
  };
}

function createContentIndexFromState(state) {
  return {
    buildings: mapById(state.catalog?.buildings ?? [])
  };
}

function withIndex(state, content) {
  state.__index = createContentIndex(content);
  return state;
}

function stripIndex(state) {
  delete state.__index;
  return state;
}

function mapById(values = []) {
  return new Map(values.map((value) => [value.id, value]));
}

function recordSimulationCommand(state, command) {
  const { tick, ...accepted } = command;
  return recordCommand(state.replay, accepted, state.simulationTick ?? 0);
}

function startingStockpile(content) {
  const resources = {};
  for (const resource of content.resources ?? []) {
    if (resource.kind === "cap") {
      resources[resource.id] = resource.startingCap ?? 0;
    } else {
      resources[resource.id] = resource.startingAmount ?? 0;
    }
  }
  return resources;
}

function createTechState(content, index, tierNumber) {
  const state = {
    tier: tierNumber,
    unlockedBuildings: [],
    unlockedSquads: [],
    unlockedHeroes: [],
    unlockedAbilities: [],
    unlockedTiers: []
  };

  for (const tier of content.techTree?.tiers ?? []) {
    if (tier.tier <= tierNumber) {
      unlockTier(state, index, tier);
    }
  }
  return state;
}

function unlockTier(state, index, tier) {
  addUnique(state.unlockedTiers, tier.id);
  for (const id of tier.unlocks ?? []) {
    if (index.buildings.has(id)) {
      addUnique(state.unlockedBuildings, id);
    }
    if (index.squads.has(id)) {
      addUnique(state.unlockedSquads, id);
    }
    if (index.heroes.has(id)) {
      addUnique(state.unlockedHeroes, id);
    }
    if (index.abilities.has(id)) {
      addUnique(state.unlockedAbilities, id);
    }
  }
}

function addUnique(values, value) {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function isFactionLegal(state, playerId, definition) {
  return definition.faction === "shared" || definition.faction === state.factions[playerId];
}

function hasActiveBuilding(state, playerId, buildingId) {
  return state.buildings.some((building) => (
    building.owner === playerId
    && building.buildingId === buildingId
    && building.active !== false
  ));
}

function hasAnyBuilding(state, playerId, buildingId) {
  return state.buildings.some((building) => (
    building.owner === playerId
    && building.buildingId === buildingId
  ));
}

function canPlanBuild(state, playerId, buildingId) {
  const building = state.__index.buildings.get(buildingId);
  if (!building || !state.tech[playerId].unlockedBuildings.includes(buildingId) || !isFactionLegal(state, playerId, building)) {
    return false;
  }
  return canAfford(state.stockpiles[playerId], building.costs ?? {});
}

function createBuildingInstance(index, { owner, buildingId, x, y, rotation = 0, ordinal = 1, active = true }) {
  const building = index.buildings.get(buildingId);
  if (!building) {
    throw new Error(`Unknown building ${buildingId}.`);
  }
  const footprint = rotatedFootprint(building.footprint, rotation);
  const maxHp = building.chassis === "town_center" ? 600 : 220;
  const buildSeconds = building.buildSeconds ?? 0;
  return {
    id: `${owner}-${buildingId}-${ordinal}`,
    owner,
    buildingId,
    x,
    y,
    w: footprint.w,
    h: footprint.h,
    hp: active ? maxHp : 80,
    maxHp,
    active,
    buildRemainingSeconds: active ? 0 : buildSeconds,
    buildTotalSeconds: buildSeconds
  };
}

function createSquadInstance({ id, owner, squadId, x, y, hp, stance = "hold" }) {
  return {
    id,
    owner,
    squadId,
    x,
    y,
    hp,
    morale: 100,
    stance,
    target: null,
    rallyPoint: defaultRallyPoint(owner),
    tacticalStance: "guard",
    formation: "line",
    targetPriority: "squads"
  };
}

function createMap(content) {
  const map = content.maps?.[0] ?? { width: 96, height: 96, blocked: [] };
  return {
    id: map.id,
    width: map.width,
    height: map.height,
    blocked: map.blocked ?? []
  };
}

function rotatedFootprint(footprint, rotation) {
  const normalized = ((rotation % 360) + 360) % 360;
  return normalized === 90 || normalized === 270 ? { w: footprint.h, h: footprint.w } : { ...footprint };
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function isTargetInBounds(target, map) {
  return Number.isFinite(target.x)
    && Number.isFinite(target.y)
    && target.x >= 0
    && target.y >= 0
    && target.x <= map.width
    && target.y <= map.height;
}

function createObjectives(content, index) {
  const map = content.maps?.[0];
  return (map?.objectiveIds ?? []).map((objectiveId) => {
    if (!index.objectives.has(objectiveId)) {
      throw new Error(`Map references unknown objective ${objectiveId}.`);
    }
    const position = map.objectivePositions?.[objectiveId] ?? {};
    return {
      id: objectiveId,
      owner: null,
      progress: { player: 0, enemy: 0 },
      tickAccumulator: 0,
      x: position.x,
      y: position.y
    };
  });
}

function createGuidance(mode) {
  if (mode === "tutorial") {
    return ["Select the Farmstead tool and place a Farmstead.", "Train a squad, then capture the Moon Pool."];
  }
  if (mode === "campaign") {
    return ["Secure Briar Crossing.", "Keep the Thorn Queen alive while the Hollow Legion probes the ruins."];
  }
  if (mode === "local_pve") {
    return ["Support the companion lodge.", "Hold objectives against Hollow waves."];
  }
  return ["Build economy, train squads, and break the enemy Seat of Rule."];
}

function cloneState(state) {
  return structuredClone(state);
}
