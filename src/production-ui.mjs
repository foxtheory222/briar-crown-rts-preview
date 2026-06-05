export function productionQueueCards({
  owner = "player",
  production = [],
  completed = [],
  buildings = [],
  buildingDefinitions = new Map(),
  squadDefinitions = new Map(),
  potentialSquadIds = []
} = {}) {
  const activeProducers = buildings.filter((building) => {
    const definition = buildingDefinitions.get(building.buildingId);
    return building.owner === owner && building.active !== false && (definition?.produces?.length ?? 0) > 0;
  });
  const cards = [
    ...production
      .filter((item) => item.owner === owner)
      .map((item) => productionCard(item, { buildings, buildingDefinitions, squadDefinitions })),
    ...completed
      .filter((item) => item.owner === owner)
      .map((item) => readyCard(item, { buildings, buildingDefinitions, squadDefinitions }))
  ];
  if (cards.length > 0) {
    return cards;
  }
  if (activeProducers.length > 0) {
    return activeProducers.map((producer) => idleCard(producer, { buildingDefinitions }));
  }
  const squadId = potentialSquadIds[0] ?? null;
  const squad = squadDefinitions.get(squadId);
  return [{
    id: `${owner}-production-blocked`,
    status: "blocked",
    owner,
    producerId: null,
    producerName: "No active producer",
    squadId,
    squadName: squad?.name ?? label(squadId ?? "squad"),
    icon: squad?.icon ?? null,
    remaining: 0,
    total: 0,
    progress: 0,
    label: "Build and finish a producer"
  }];
}

function productionCard(item, { buildings, buildingDefinitions, squadDefinitions }) {
  const producer = buildings.find((building) => building.id === item.producerId);
  const squad = squadDefinitions.get(item.squadId);
  const total = Number(item.total ?? item.totalSeconds ?? 0);
  const remaining = Math.max(0, Number(item.remaining ?? item.remainingSeconds ?? 0));
  return {
    id: item.id,
    status: "training",
    owner: item.owner,
    producerId: item.producerId,
    producerName: producerName(producer, buildingDefinitions, item.producerBuildingId),
    squadId: item.squadId,
    squadName: squad?.name ?? label(item.squadId),
    icon: squad?.icon ?? null,
    remaining: Math.ceil(remaining),
    total: Math.ceil(total),
    progress: progressPercent(remaining, total),
    label: `${squad?.name ?? label(item.squadId)} - ${Math.ceil(remaining)}s`
  };
}

function readyCard(item, { buildings, buildingDefinitions, squadDefinitions }) {
  const producer = buildings.find((building) => building.id === item.producerId);
  const squad = squadDefinitions.get(item.squadId);
  return {
    id: item.id,
    status: "ready",
    owner: item.owner,
    producerId: item.producerId,
    producerName: producerName(producer, buildingDefinitions, item.producerBuildingId),
    squadId: item.squadId,
    squadName: squad?.name ?? label(item.squadId),
    icon: squad?.icon ?? null,
    remaining: 0,
    total: 0,
    progress: 100,
    label: `${squad?.name ?? label(item.squadId)} ready`
  };
}

function idleCard(producer, { buildingDefinitions }) {
  const definition = buildingDefinitions.get(producer.buildingId);
  return {
    id: `${producer.id}-idle`,
    status: "idle",
    owner: producer.owner,
    producerId: producer.id,
    producerName: definition?.name ?? label(producer.buildingId),
    squadId: null,
    squadName: "Idle",
    icon: definition?.icon ?? null,
    remaining: 0,
    total: 0,
    progress: 0,
    label: "Idle"
  };
}

function producerName(producer, buildingDefinitions, fallbackBuildingId = null) {
  if (!producer) {
    return fallbackBuildingId ? buildingDefinitions.get(fallbackBuildingId)?.name ?? label(fallbackBuildingId) : "Unknown producer";
  }
  return buildingDefinitions.get(producer.buildingId)?.name ?? label(producer.buildingId);
}

function progressPercent(remaining, total) {
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((1 - remaining / total) * 100)));
}

function label(value) {
  return String(value ?? "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
