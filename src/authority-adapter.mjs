export function projectAuthoritySquads(viewState, authorityState, { squadDefinitions, replaceNonAlly = false }) {
  const authorityIds = new Set(authorityState.squads.map((squad) => squad.id));
  const preserved = (viewState.squads ?? []).filter((squad) => {
    if (squad.owner === "ally") {
      return true;
    }
    if (replaceNonAlly) {
      return false;
    }
    return !squad.authorityControlled && !authorityIds.has(squad.id);
  });
  const projected = authorityState.squads.map((squad) => projectAuthoritySquad(squad, squadDefinitions));
  viewState.squads = [...preserved, ...projected];
  return viewState;
}

export function routeAuthoritySquadOrders({ viewState, authorityState, content, playerId, squadIds = null, order, target, targetBySquadId = null, payload = {}, payloadBySquadId = null, orderSquad }) {
  if (!authorityState?.squads) {
    return { authorityState, count: 0 };
  }
  let nextAuthority = authorityState;
  let count = 0;
  const authorityIds = new Set(authorityState.squads.map((squad) => squad.id));
  const selectedIds = Array.isArray(squadIds) ? new Set(squadIds) : null;
  for (const squad of viewState.squads.filter((entry) => (
    entry.owner === playerId
    && entry.hp > 0
    && authorityIds.has(entry.id)
    && (!selectedIds || selectedIds.has(entry.id))
  ))) {
    const squadTarget = targetForSquad(targetBySquadId, squad.id) ?? target;
    const squadPayload = payloadForSquad(payloadBySquadId, squad.id) ?? payload;
    nextAuthority = orderSquad(nextAuthority, content, { playerId, squadId: squad.id, order, target: squadTarget, payload: squadPayload });
    count += 1;
  }
  return { authorityState: nextAuthority, count };
}

function targetForSquad(targetBySquadId, squadId) {
  if (!targetBySquadId) {
    return null;
  }
  if (targetBySquadId instanceof Map) {
    return targetBySquadId.get(squadId) ?? null;
  }
  return targetBySquadId[squadId] ?? null;
}

function payloadForSquad(payloadBySquadId, squadId) {
  if (!payloadBySquadId) {
    return null;
  }
  if (payloadBySquadId instanceof Map) {
    return payloadBySquadId.get(squadId) ?? null;
  }
  return payloadBySquadId[squadId] ?? null;
}

export function routeAuthorityObjectiveCapture({ viewState, authorityState, content, playerId, objectiveId, seconds, captureObjective }) {
  if (!authorityState?.objectives?.some((objective) => objective.id === objectiveId)) {
    return { authorityState, routed: false };
  }
  const nextAuthority = captureObjective(authorityState, content, { playerId, objectiveId, seconds });
  projectAuthorityObjectives(viewState, nextAuthority);
  viewState.replay = [...nextAuthority.replay.commands];
  return { authorityState: nextAuthority, routed: true };
}

export function placeAuthorityBuilding({ authorityState, content, playerId, buildingId, x, y, rotation = 0, placeBuilding }) {
  return {
    authorityState: placeBuilding(authorityState, content, { playerId, buildingId, x, y, rotation }),
    placed: true
  };
}

export function routeAuthorityResearch({ viewState, authorityState, content, playerId, tierId, startResearch }) {
  const nextAuthority = startResearch(authorityState, content, { playerId, tierId });
  projectAuthorityTech(viewState, nextAuthority);
  viewState.replay = [...nextAuthority.replay.commands];
  return {
    authorityState: nextAuthority,
    researched: true
  };
}

export function queueAuthorityProduction({ authorityState, content, playerId, producer, squadId, enqueueProduction }) {
  const authorityProducer = findAuthorityBuilding(authorityState, playerId, producer);
  if (!authorityProducer) {
    return {
      authorityState,
      queued: false,
      producerId: null,
      fallbackAllowed: !isSharedAuthorityPlayer(authorityState, playerId)
    };
  }
  return {
    authorityState: enqueueProduction(authorityState, content, { playerId, producerId: authorityProducer.id, squadId }),
    queued: true,
    producerId: authorityProducer.id,
    fallbackAllowed: false
  };
}

export function advanceAuthorityRuntime({ viewState, authorityState, content, seconds, tickMatch, squadDefinitions }) {
  const nextAuthority = tickMatch(authorityState, content, seconds);
  const completedProduction = {
    player: completedAuthorityProduction(authorityState.production?.player, nextAuthority.production?.player, "player", authorityState.buildings),
    enemy: completedAuthorityProduction(authorityState.production?.enemy, nextAuthority.production?.enemy, "enemy", authorityState.buildings)
  };
  projectAuthoritySquads(viewState, nextAuthority, { squadDefinitions });
  projectAuthorityProduction(viewState, nextAuthority);
  projectAuthorityObjectives(viewState, nextAuthority);
  projectAuthorityBuildings(viewState, nextAuthority);
  projectAuthorityEconomy(viewState, nextAuthority);
  projectAuthorityEffects(viewState, nextAuthority);
  projectAuthorityTech(viewState, nextAuthority);
  viewState.replay = [...nextAuthority.replay.commands];
  if (nextAuthority.outcome) {
    viewState.outcome = nextAuthority.outcome;
    viewState.mode = "complete";
  }
  return { authorityState: nextAuthority, completedProduction };
}

export function shouldApplyLocalStructureDamage(attacker, targetStructure) {
  if (!attacker || !targetStructure) {
    return false;
  }
  return !targetStructure.authorityControlled;
}

export function shouldApplyLocalSquadDamage(attacker, targetSquad) {
  if (!attacker || !targetSquad) {
    return false;
  }
  return !targetSquad.authorityControlled;
}

export function shouldApplyLocalEconomySource(source) {
  if (!source) {
    return false;
  }
  return !source.authorityControlled;
}

export function projectAuthorityEffects(viewState, authorityState) {
  viewState.effects = { ...(authorityState.effects?.player ?? {}) };
  viewState.enemyEffects = { ...(authorityState.effects?.enemy ?? {}) };
}

export function projectAuthorityTech(viewState, authorityState) {
  if (authorityState.tech?.player) {
    viewState.techTier = authorityState.tech.player.tier;
  }
  if (authorityState.tech?.enemy) {
    viewState.enemyTechTier = authorityState.tech.enemy.tier;
  }
  viewState.research = projectAuthorityResearch(authorityState.research?.player?.active);
  viewState.enemyResearch = projectAuthorityResearch(authorityState.research?.enemy?.active);
}

export function projectAuthorityProduction(viewState, authorityState) {
  if (Array.isArray(viewState.production)) {
    viewState.production = projectAuthorityProductionQueue(authorityState.production?.player, "player", authorityState.buildings);
  }
  if (Array.isArray(viewState.enemyProduction)) {
    viewState.enemyProduction = projectAuthorityProductionQueue(authorityState.production?.enemy, "enemy", authorityState.buildings);
  }
}

function projectAuthoritySquad(squad, squadDefinitions) {
  const definition = squadDefinitions.get(squad.squadId);
  const maxHp = definition ? definition.size * 30 : Math.max(1, squad.hp);
  return {
    id: squad.id,
    owner: squad.owner,
    squadId: squad.squadId,
    name: definition?.name ?? squad.squadId,
    x: squad.x,
    y: squad.y,
    hp: squad.hp,
    maxHp,
    morale: squad.morale,
    target: squad.target ? { ...squad.target } : null,
    stance: squad.stance,
    rallyPoint: squad.rallyPoint ? { ...squad.rallyPoint } : null,
    tacticalStance: squad.tacticalStance,
    formation: squad.formation,
    formationBaseTarget: squad.formationBaseTarget ? { ...squad.formationBaseTarget } : null,
    formationAnchorTarget: squad.formationAnchorTarget ? { ...squad.formationAnchorTarget } : null,
    formationSlotIndex: squad.formationSlotIndex ?? null,
    formationGroupSize: squad.formationGroupSize ?? null,
    formationAnchorKind: squad.formationAnchorKind ?? null,
    formationTargetOffsetKind: squad.formationTargetOffsetKind ?? null,
    targetPriority: squad.targetPriority,
    authorityControlled: true
  };
}

function projectAuthorityProductionQueue(queue = [], owner, buildings = []) {
  return queue.map((item) => ({
    id: item.id,
    owner,
    squadId: item.squadId,
    producerId: item.producerId,
    producerBuildingId: buildings.find((building) => building.id === item.producerId)?.buildingId ?? null,
    authorityBacked: true,
    remaining: item.remainingSeconds,
    total: item.totalSeconds
  }));
}

function completedAuthorityProduction(previousQueue = [], currentQueue = [], owner, buildings = []) {
  const currentIds = new Set(currentQueue.map((item) => item.id));
  return previousQueue
    .filter((item) => !currentIds.has(item.id))
    .map((item) => ({
      id: item.id,
      owner,
      squadId: item.squadId,
      producerId: item.producerId,
      producerBuildingId: buildings.find((building) => building.id === item.producerId)?.buildingId ?? null,
      authorityBacked: true,
      remaining: 0,
      total: item.totalSeconds
    }));
}

function projectAuthorityResearch(active) {
  return active ? {
    tierId: active.tierId,
    authorityBacked: true,
    remaining: active.remainingSeconds,
    total: active.totalSeconds
  } : null;
}

export function projectAuthorityObjectives(viewState, authorityState) {
  if (!Array.isArray(viewState.objectives)) {
    return;
  }
  viewState.objectives = viewState.objectives.map((objective) => {
    const authoritative = authorityState.objectives.find((entry) => entry.id === objective.id);
    return authoritative ? {
      ...objective,
      owner: authoritative.owner,
      progress: { ...authoritative.progress },
      x: authoritative.x ?? objective.x,
      y: authoritative.y ?? objective.y,
      authorityControlled: true
    } : objective;
  });
}

function projectAuthorityBuildings(viewState, authorityState) {
  if (!Array.isArray(viewState.buildings)) {
    return;
  }
  for (const authoritative of authorityState.buildings) {
    const local = viewState.buildings.find((building) => (
      building.owner === authoritative.owner
      && building.buildingId === authoritative.buildingId
      && Math.abs(building.x - authoritative.x) < 0.001
      && Math.abs(building.y - authoritative.y) < 0.001
    ));
    if (local) {
      projectAuthorityBuilding(local, authoritative);
    }
  }
}

function projectAuthorityEconomy(viewState, authorityState) {
  if (authorityState.stockpiles?.player && authorityState.housing?.player) {
    viewState.resources = {
      ...authorityState.stockpiles.player,
      housing: authorityState.housing.player.cap
    };
    viewState.housingUsed = authorityState.housing.player.used;
  }
  if (authorityState.stockpiles?.enemy && authorityState.housing?.enemy) {
    viewState.enemyResources = {
      ...authorityState.stockpiles.enemy,
      housing: authorityState.housing.enemy.cap
    };
    viewState.enemyHousingUsed = authorityState.housing.enemy.used;
  }
}

function projectAuthorityBuilding(local, authoritative) {
  local.hp = authoritative.hp;
  local.maxHp = authoritative.maxHp ?? local.maxHp;
  local.active = authoritative.active !== false;
  local.authorityControlled = true;
  local.buildRemaining = authoritative.buildRemainingSeconds ?? (local.active ? 0 : local.buildRemaining);
  local.buildTotal = authoritative.buildTotalSeconds ?? local.buildTotal;
  local.w = authoritative.w ?? local.w;
  local.h = authoritative.h ?? local.h;
}

function findAuthorityBuilding(authorityState, playerId, producer) {
  if (!producer) {
    return null;
  }
  const candidates = authorityState.buildings.filter((building) => (
    building.owner === playerId
    && building.buildingId === producer.buildingId
  ));
  const coordinateMatch = candidates.find((building) => (
    Number.isFinite(producer.x)
    && Number.isFinite(producer.y)
    && Math.abs(building.x - producer.x) < 0.001
    && Math.abs(building.y - producer.y) < 0.001
  ));
  if (coordinateMatch) {
    return coordinateMatch;
  }
  return candidates.length === 1 ? candidates[0] : null;
}

function isSharedAuthorityPlayer(authorityState, playerId) {
  return Boolean(
    authorityState
    && authorityState.stockpiles?.[playerId]
    && authorityState.production?.[playerId]
    && authorityState.housing?.[playerId]
  );
}
