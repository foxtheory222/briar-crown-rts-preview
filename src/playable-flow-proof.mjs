const ECONOMY_BUILDINGS = new Set(["farmstead", "logging_camp", "mineworks"]);

export function playableFlowSummary({
  mode = "menu",
  outcome = null,
  techTier = 1,
  resources = {},
  replay = [],
  buildings = [],
  squads = [],
  heroes = [],
  objectives = [],
  outcomePanel = { actions: [] }
} = {}) {
  const playerBuildings = buildings.filter((building) => building.owner === "player");
  const activePlayerBuildings = playerBuildings.filter((building) => building.active !== false && (building.hp ?? 1) > 0);
  const playerSquads = squads.filter((squad) => squad.owner === "player" && (squad.hp ?? 1) > 0);
  const playerObjectives = objectives.filter((objective) => objective.owner === "player");
  const playerReplay = replay.filter((command) => command.playerId === "player" || command.type === "MATCH_END");
  const commandTypes = new Set(playerReplay.map((command) => command.type));
  const squadOrders = new Set(playerReplay.filter((command) => command.type === "SQUAD_ORDER").map((command) => command.order));
  const actionIds = new Set((outcomePanel.actions ?? []).map((action) => action.id));

  const hasBuildPlacement = commandTypes.has("BUILD") || playerBuildings.length > 1;
  const hasEconomyBuilding = activePlayerBuildings.some((building) => ECONOMY_BUILDINGS.has(building.buildingId));
  const hasProduction = commandTypes.has("TRAIN_SQUAD") || playerSquads.length > 1;
  const hasResearch = commandTypes.has("RESEARCH_TIER") || techTier >= 2;
  const hasHeroRecruit = commandTypes.has("RECRUIT_HERO") || heroes.some((hero) => hero.owner === "player" || hero.heroId);
  const hasHeroAbility = commandTypes.has("HERO_ABILITY");
  const hasObjectiveCaptureOrder = squadOrders.has("capture") || commandTypes.has("CAPTURE_OBJECTIVE");
  const hasObjectiveControl = playerObjectives.length > 0 || Math.floor(resources.witchglass ?? 0) > 0;
  const hasAttackOrder = squadOrders.has("attack_move");
  const hasOutcome = mode === "complete" && Boolean(outcome);
  const hasRestartAndMenuActions = actionIds.has("restart") && actionIds.has("menu");

  return {
    completed: [
      hasBuildPlacement,
      hasEconomyBuilding,
      hasProduction,
      hasResearch,
      hasHeroRecruit,
      hasHeroAbility,
      hasObjectiveCaptureOrder,
      hasAttackOrder,
      hasOutcome,
      hasRestartAndMenuActions
    ].every(Boolean),
    hasBuildPlacement,
    hasEconomyBuilding,
    hasProduction,
    hasResearch,
    hasHeroRecruit,
    hasHeroAbility,
    hasObjectiveCaptureOrder,
    hasObjectiveControl,
    hasAttackOrder,
    hasOutcome,
    hasRestartAndMenuActions,
    activePlayerBuildings: activePlayerBuildings.length,
    playerSquads: playerSquads.length,
    playerControlledObjectives: playerObjectives.length,
    playerCommandCount: playerReplay.length,
    commandTypes: [...commandTypes].sort(),
    squadOrders: [...squadOrders].sort()
  };
}
