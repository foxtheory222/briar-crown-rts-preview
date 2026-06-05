const SPENDABLE_CAPS = new Set(["housing"]);
const RUNTIME_RESOURCE_TRIAD = ["food", "gold", "wood"];

export function canAfford(stockpile, cost = {}) {
  return Object.entries(cost).every(([resource, amount]) => {
    if (SPENDABLE_CAPS.has(resource)) {
      return false;
    }
    return (stockpile[resource] ?? 0) >= amount;
  });
}

export function applyCost(stockpile, cost = {}) {
  const next = { ...stockpile };

  for (const [resource, amount] of Object.entries(cost)) {
    if (SPENDABLE_CAPS.has(resource)) {
      throw new Error("Housing is a cap, not a spendable resource.");
    }
    if ((next[resource] ?? 0) < amount) {
      throw new Error(`Cannot afford ${resource}:${amount}.`);
    }
    next[resource] -= amount;
  }

  return next;
}

export function hasHousingRoom(state, requestedHousing) {
  return state.housingUsed + requestedHousing <= state.housingCap;
}

export function sumIncome(buildings) {
  const income = {};

  for (const building of buildings) {
    for (const [resource, amount] of Object.entries(building.income ?? {})) {
      income[resource] = (income[resource] ?? 0) + amount;
    }
  }

  return income;
}

export function summarizeStewardEconomy({ buildings = [], definitions = [], owner = "player" } = {}) {
  const definitionIndex = definitionMap(definitions);
  const runtimeSources = [];
  let inactiveSourceCount = 0;

  for (const building of collectionValues(buildings)) {
    if (owner && building.owner !== owner) {
      continue;
    }
    const definition = resolveBuildingDefinition(building, definitionIndex);
    const laborPriority = building.laborPriority ?? definition?.laborPriority;
    if (!laborPriority) {
      continue;
    }
    if (building.active === false || building.hp <= 0) {
      inactiveSourceCount += 1;
      continue;
    }
    runtimeSources.push({
      id: building.id ?? building.buildingId ?? definition?.id,
      buildingId: building.buildingId ?? building.id ?? definition?.id,
      laborPriority,
      income: { ...(definition?.income ?? {}), ...(building.income ?? {}) }
    });
  }

  const runtimePlan = laborPlan(runtimeSources);
  const catalogPlan = laborPlan(collectionValues(definitions)
    .filter((building) => building.laborPriority)
    .map((building) => ({
      id: building.id,
      buildingId: building.id,
      laborPriority: building.laborPriority,
      income: building.income ?? {}
    })));
  const missingLaborPillars = [];

  if (runtimePlan.priorityCount < 3) {
    missingLaborPillars.push("runtime_priorities");
  }
  if (runtimePlan.activeSourceCount < 3) {
    missingLaborPillars.push("active_sources");
  }
  if (runtimePlan.assignedWorkerCount < 3) {
    missingLaborPillars.push("automated_assignments");
  }
  if (!RUNTIME_RESOURCE_TRIAD.every((resource) => runtimePlan.resourceKinds.includes(resource))) {
    missingLaborPillars.push("runtime_resource_triad");
  }
  if (catalogPlan.priorityCount < 6) {
    missingLaborPillars.push("catalog_priorities");
  }
  if (catalogPlan.resourceKinds.length < 4) {
    missingLaborPillars.push("catalog_resource_spread");
  }

  return {
    automated: true,
    owner,
    priorities: runtimePlan.priorities,
    priorityKinds: runtimePlan.priorityKinds,
    priorityCount: runtimePlan.priorityCount,
    activeSourceCount: runtimePlan.activeSourceCount,
    inactiveSourceCount,
    assignedWorkerCount: runtimePlan.assignedWorkerCount,
    resourceKinds: runtimePlan.resourceKinds,
    income: runtimePlan.income,
    catalogPriorities: catalogPlan.priorities,
    catalogPriorityKinds: catalogPlan.priorityKinds,
    catalogPriorityCount: catalogPlan.priorityCount,
    catalogSourceCount: catalogPlan.activeSourceCount,
    catalogAssignedWorkerCount: catalogPlan.assignedWorkerCount,
    catalogResourceKinds: catalogPlan.resourceKinds,
    catalogIncome: catalogPlan.income,
    missingLaborPillars,
    stewardEconomyPass: missingLaborPillars.length === 0
  };
}

function laborPlan(sources) {
  const groups = new Map();

  for (const source of sources) {
    const group = groups.get(source.laborPriority) ?? {
      laborPriority: source.laborPriority,
      buildingIds: [],
      income: {},
      buildingCount: 0,
      assignedWorkers: 0
    };
    group.buildingIds.push(source.buildingId ?? source.id);
    group.buildingCount += 1;
    group.assignedWorkers += 1;
    for (const [resource, amount] of Object.entries(source.income ?? {})) {
      group.income[resource] = (group.income[resource] ?? 0) + amount;
    }
    groups.set(source.laborPriority, group);
  }

  const priorities = [...groups.values()]
    .sort((left, right) => left.laborPriority.localeCompare(right.laborPriority))
    .map((group) => ({
      ...group,
      buildingIds: [...group.buildingIds].sort(),
      resourceKinds: sortedKeys(group.income),
      income: sortedResourceRecord(group.income)
    }));
  const income = {};

  for (const priority of priorities) {
    for (const [resource, amount] of Object.entries(priority.income)) {
      income[resource] = (income[resource] ?? 0) + amount;
    }
  }

  return {
    priorities,
    priorityKinds: priorities.map((priority) => priority.laborPriority),
    priorityCount: priorities.length,
    activeSourceCount: sources.length,
    assignedWorkerCount: priorities.reduce((total, priority) => total + priority.assignedWorkers, 0),
    resourceKinds: sortedKeys(income),
    income: sortedResourceRecord(income)
  };
}

function definitionMap(definitions) {
  return new Map(collectionValues(definitions).map((definition) => [definition.id, definition]));
}

function resolveBuildingDefinition(building, definitions) {
  return definitions.get(building.buildingId) ?? definitions.get(building.id) ?? null;
}

function collectionValues(collection) {
  if (collection instanceof Map) {
    return [...collection.values()];
  }
  return Array.isArray(collection) ? collection : [];
}

function sortedKeys(record) {
  return Object.keys(record).filter((key) => record[key] !== 0).sort();
}

function sortedResourceRecord(record) {
  return Object.fromEntries(sortedKeys(record).map((key) => [key, record[key]]));
}
