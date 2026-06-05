export function outcomePanelModel({
  outcome = null,
  scenarioMode = "skirmish",
  replayLength = 0,
  resources = {},
  squads = [],
  buildings = [],
  objectiveCards = [],
  playerFactionName = "Player",
  enemyFactionName = "Enemy"
} = {}) {
  if (!outcome) {
    return {
      visible: false,
      tone: "none",
      title: "",
      subtitle: "",
      stats: [],
      actions: []
    };
  }

  const victory = outcome === "victory";
  const activeSquads = squads.filter((squad) => squad.hp === undefined || squad.hp > 0);
  const activeBuildings = buildings.filter((building) => building.hp === undefined || building.hp > 0);
  const playerSquads = activeSquads.filter((squad) => squad.owner === "player").length;
  const enemySquads = activeSquads.filter((squad) => squad.owner === "enemy").length;
  const controlledObjectives = objectiveCards.filter((card) => ["Player", "Enemy"].includes(card.ownerLabel)).length;
  const replayOrders = `${replayLength} ${replayLength === 1 ? "order" : "orders"}`;
  const witchglassBank = String(Math.floor(resources.witchglass ?? 0));
  const stats = [
    { kind: "replay_orders", label: "Replay", value: replayOrders },
    { kind: "witchglass_bank", label: "Witchglass", value: witchglassBank },
    { kind: "squad_balance", label: "Squads", value: `${playerSquads} / ${enemySquads}` },
    { kind: "active_buildings", label: "Buildings", value: String(activeBuildings.length) },
    { kind: "controlled_objectives", label: "Objectives", value: String(controlledObjectives) }
  ];
  const actions = [
    { id: "restart", intent: "restart_same_scenario", label: `Restart ${label(scenarioMode)}` },
    { id: "menu", intent: "return_to_war_table", label: "Return to Menu" }
  ];
  const toneGlyphKinds = victory
    ? ["crown_sundered", "moonlit_banner", "witchglass_claimed"]
    : ["seat_fallen", "ashen_banner", "retreat_candle"];
  const recapLines = victory
    ? [
        `${enemyFactionName} seat collapsed and the field belongs to ${playerFactionName}.`,
        `${replayOrders} recorded for review.`,
        `${controlledObjectives} objectives held with ${witchglassBank} witchglass banked.`
      ]
    : [
        `${playerFactionName} seat fell before the final command.`,
        `${replayOrders} recorded for review.`,
        `${activeBuildings.length} structures and ${playerSquads} player squads remain for the rematch.`
      ];
  const actionIntentKinds = actions.map((action) => action.intent);
  const statKinds = stats.map((stat) => stat.kind);

  return {
    visible: true,
    tone: outcome,
    outcomeStateKind: victory ? "victory_ceremony" : "defeat_ceremony",
    resultKind: victory ? "enemy_seat_broken" : "player_seat_broken",
    title: victory ? "Victory" : "Defeat",
    subtitle: victory
      ? `${enemyFactionName} seat collapsed. Replay is ready for review.`
      : `${playerFactionName} seat fell. Restart with the same faction or return to the war table.`,
    recapLines,
    toneGlyphKinds,
    actionIntentKinds,
    statKinds,
    ceremonyPass: toneGlyphKinds.length >= 3
      && recapLines.length >= 3
      && actionIntentKinds.length === 2
      && statKinds.length >= 5,
    stats,
    actions
  };
}

function label(value) {
  return String(value ?? "skirmish").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
