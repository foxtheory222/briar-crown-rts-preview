const DENSE_SQUAD_THRESHOLD = 6;
const DAMAGED_RATIO = 0.82;
const MORALE_PRESSURE = 70;
const ENGAGED_DISTANCE = 1.25;
const TARGETED_DISTANCE = 1.1;
const MUTED_ORDER_ALPHA = 0.28;

export function squadReadabilityBudget(squad = {}, context = {}) {
  const squads = collectionValues(context.squads).filter((entry) => Number(entry.hp ?? 0) > 0);
  const selectedSquadIds = new Set(collectionValues(context.selectedSquadIds));
  const selected = selectedSquadIds.has(squad.id);
  const denseMode = Boolean(context.denseMode) || squads.length >= DENSE_SQUAD_THRESHOLD;
  const damaged = healthRatio(squad) < DAMAGED_RATIO;
  const retreating = squad.stance === "retreat";
  const moralePressure = Number(squad.morale ?? 100) < MORALE_PRESSURE || retreating;
  const engaged = isEngaged(squad, squads);
  const highInformation = selected || damaged || moralePressure || engaged || retreating;

  return {
    denseMode,
    selected,
    damaged,
    moralePressure,
    engaged,
    retreating,
    showHealthBar: !denseMode || squad.owner !== "player" || selected || damaged || engaged || retreating,
    showMoraleBar: !denseMode || selected || moralePressure || engaged || retreating,
    orderMarkerAlpha: denseMode && !highInformation ? MUTED_ORDER_ALPHA : 1
  };
}

export function summarizeCombatReadabilityBudget(content = {}) {
  const squads = collectionValues(content.squads).filter((entry) => Number(entry.hp ?? 0) > 0);
  const selectedSquadIds = collectionValues(content.selectedSquadIds);
  const budgets = squads.map((squad) => squadReadabilityBudget(squad, {
    squads,
    selectedSquadIds,
    denseMode: content.denseMode
  }));

  return {
    denseMode: budgets.some((budget) => budget.denseMode),
    totalSquads: squads.length,
    visibleHealthBars: budgets.filter((budget) => budget.showHealthBar).length,
    suppressedHealthBars: budgets.filter((budget) => !budget.showHealthBar).length,
    visibleMoraleBars: budgets.filter((budget) => budget.showMoraleBar).length,
    suppressedMoraleBars: budgets.filter((budget) => !budget.showMoraleBar).length,
    mutedOrderMarkers: squads.filter((squad, index) => shouldCountMutedOrderMarker(squad, budgets[index])).length
  };
}

function isEngaged(squad = {}, squads = []) {
  const hostiles = squads.filter((candidate) => candidate.owner !== squad.owner);
  return hostiles.some((hostile) => distance(squad, hostile) <= ENGAGED_DISTANCE)
    || hostiles.some((hostile) => hostile.target && distance(squad, hostile.target) <= TARGETED_DISTANCE)
    || Boolean(squad.target && hostiles.some((hostile) => distance(hostile, squad.target) <= TARGETED_DISTANCE));
}

function shouldCountMutedOrderMarker(squad = {}, budget = {}) {
  return squad.owner === "player"
    && ["attack_move", "capture", "retreat", "move"].includes(squad.stance)
    && Number(budget.orderMarkerAlpha ?? 1) < 1;
}

function healthRatio(squad = {}) {
  const maxHp = Math.max(1, Number(squad.maxHp ?? squad.hp ?? 1));
  return Number(squad.hp ?? maxHp) / maxHp;
}

function distance(a = {}, b = {}) {
  return Math.hypot(Number(a.x ?? 0) - Number(b.x ?? 0), Number(a.y ?? 0) - Number(b.y ?? 0));
}

function collectionValues(collection) {
  if (!collection) {
    return [];
  }
  if (collection instanceof Set) {
    return [...collection];
  }
  if (collection instanceof Map) {
    return [...collection.values()];
  }
  if (Array.isArray(collection)) {
    return collection;
  }
  return Object.values(collection);
}
