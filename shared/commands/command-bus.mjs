import { canAfford } from "../economy/economy.mjs";

export function validateCommand(command, state, content) {
  if (!command?.type || !command.playerId || !command.id) {
    return { ok: false, reason: "malformed_command" };
  }

  if (command.type === "BUILD") {
    const building = content.buildingsById?.get(command.buildingId);
    if (!building) {
      return { ok: false, reason: "unknown_building" };
    }
    if (!hasUnlocked(state.unlockedBuildings, command.buildingId)) {
      return { ok: false, reason: "locked_building" };
    }
    if (!canAfford(state.stockpile ?? {}, building.costs ?? {})) {
      return { ok: false, reason: "cannot_afford" };
    }
    return { ok: true };
  }

  if (command.type === "TRAIN_SQUAD") {
    const squad = content.squadsById?.get(command.squadId);
    if (!squad) {
      return { ok: false, reason: "unknown_squad" };
    }
    if (!hasUnlocked(state.unlockedSquads, command.squadId)) {
      return { ok: false, reason: "locked_squad" };
    }
    if (!canAfford(state.stockpile ?? {}, squad.costs ?? {})) {
      return { ok: false, reason: "cannot_afford" };
    }
    return { ok: true };
  }

  if (command.type === "RESEARCH_TIER") {
    const tier = content.tiersById?.get(command.tierId);
    if (!tier) {
      return { ok: false, reason: "unknown_tier" };
    }
    if (!hasUnlocked(state.unlockedTiers, command.tierId)) {
      return { ok: false, reason: "locked_tier" };
    }
    if (!canAfford(state.stockpile ?? {}, tier.costs ?? {})) {
      return { ok: false, reason: "cannot_afford" };
    }
    return { ok: true };
  }

  if (command.type === "CAPTURE_OBJECTIVE") {
    if (!content.objectivesById?.has(command.objectiveId)) {
      return { ok: false, reason: "unknown_objective" };
    }
    if (!(state.objectives ?? []).some((objective) => objective.id === command.objectiveId)) {
      return { ok: false, reason: "unknown_objective_instance" };
    }
    return { ok: true };
  }

  if (command.type === "RECRUIT_HERO") {
    if (!content.heroesById?.has(command.heroId)) {
      return { ok: false, reason: "unknown_hero" };
    }
    if (!hasUnlocked(state.unlockedHeroes, command.heroId)) {
      return { ok: false, reason: "locked_hero" };
    }
    return { ok: true };
  }

  if (command.type === "HERO_ABILITY") {
    const ability = content.abilitiesById?.get(command.abilityId);
    if (!ability) {
      return { ok: false, reason: "unknown_ability" };
    }
    const heroInstance = (state.heroes ?? []).find((hero) => hero.id === command.heroInstanceId);
    if (!heroInstance) {
      return { ok: false, reason: "unknown_hero_instance" };
    }
    const hero = content.heroesById?.get(heroInstance.heroId);
    if (!hero || !(hero.abilityIds ?? []).includes(command.abilityId)) {
      return { ok: false, reason: "hero_cannot_use_ability" };
    }
    if (!hasUnlocked(state.unlockedAbilities, command.abilityId)) {
      return { ok: false, reason: "locked_ability" };
    }
    if ((heroInstance.cooldowns?.[command.abilityId] ?? 0) > 0) {
      return { ok: false, reason: "ability_on_cooldown" };
    }
    return { ok: true };
  }

  if (command.type === "SQUAD_ORDER") {
    const squad = (state.squads ?? []).find((candidate) => candidate.id === command.squadId);
    if (!squad) {
      return { ok: false, reason: "unknown_squad_instance" };
    }
    if (!(content.requiredSquadOrders ?? []).includes(command.order)) {
      return { ok: false, reason: "unsupported_order" };
    }
    if (squad.owner && squad.owner !== command.playerId) {
      return { ok: false, reason: "not_squad_owner" };
    }
    if (command.target && !isFiniteTarget(command.target, content.map)) {
      return { ok: false, reason: "target_out_of_bounds" };
    }
    const tacticalResult = validateTacticalPayload(command, content.tacticalOrders ?? {});
    if (!tacticalResult.ok) {
      return tacticalResult;
    }
    return { ok: true };
  }

  return { ok: false, reason: "unknown_command_type" };
}

function validateTacticalPayload(command, tacticalOrders) {
  if (command.order === "stance" && !includesOption(tacticalOrders.stanceModes, command.payload?.stanceMode)) {
    return { ok: false, reason: "invalid_stance_mode" };
  }
  if (command.order === "formation" && !includesOption(tacticalOrders.formations, command.payload?.formation)) {
    return { ok: false, reason: "invalid_formation" };
  }
  if (command.order === "target_priority" && !includesOption(tacticalOrders.targetPriorities, command.payload?.targetPriority)) {
    return { ok: false, reason: "invalid_target_priority" };
  }
  return { ok: true };
}

function includesOption(values, value) {
  return Array.isArray(values) && values.includes(value);
}

function hasUnlocked(collection, id) {
  if (!collection) {
    return false;
  }
  if (collection instanceof Set) {
    return collection.has(id);
  }
  return collection.includes(id);
}

function isFiniteTarget(target, map) {
  if (!Number.isFinite(target.x) || !Number.isFinite(target.y)) {
    return false;
  }
  if (!map) {
    return true;
  }
  return target.x >= 0 && target.y >= 0 && target.x <= map.width && target.y <= map.height;
}
