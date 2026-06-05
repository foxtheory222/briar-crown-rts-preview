export function squadIntentLaneProfile(squad = {}, context = {}) {
  const selectedSquadIds = new Set(context.selectedSquadIds ?? []);
  const playerId = context.playerId ?? "player";
  const selected = selectedSquadIds.has(squad.id);
  const stance = squad.stance ?? "idle";

  if (selected && stance === "attack_move") {
    return lane("selected_attack", "attack_spine", "player_command", 3);
  }
  if (squad.owner !== playerId && stance === "attack_move") {
    return lane("enemy_target", "threat_lance", "enemy_intent", 3);
  }
  if (stance === "retreat") {
    return lane("retreat", "safe_fallback", squad.owner === playerId ? "player_recovery" : "enemy_recovery", 2);
  }
  if (stance === "capture") {
    return lane("objective_contest", "capture_tether", squad.owner === playerId ? "player_objective" : "enemy_objective", 2);
  }
  return {
    visible: false,
    kind: "none",
    glyph: "none",
    tone: "quiet",
    priority: 0
  };
}

export function minimapReadabilityProfile({
  objectives = [],
  squads = [],
  viewport = null
} = {}) {
  return {
    objectivePips: objectives.length,
    combatHotspots: combatHotspotCount(squads),
    retreatPips: squads.filter((squad) => (squad.hp ?? 0) > 0 && squad.stance === "retreat").length,
    cameraFrameVisible: Boolean(viewport && Number(viewport.scale ?? 0) > 0 && Number(viewport.width ?? 0) > 0 && Number(viewport.height ?? 0) > 0)
  };
}

export function minimapSafeAreaProfile({
  canvasWidth = 0,
  canvasHeight = 0,
  bounds = null,
  minEdgeMargin = 12
} = {}) {
  const safeBounds = bounds ?? { x: 0, y: 0, width: 0, height: 0 };
  const leftMargin = Math.round(Number(safeBounds.x ?? 0));
  const topMargin = Math.round(Number(safeBounds.y ?? 0));
  const rightMargin = Math.round(Number(canvasWidth) - leftMargin - Math.round(Number(safeBounds.width ?? 0)));
  const bottomMargin = Math.round(Number(canvasHeight) - topMargin - Math.round(Number(safeBounds.height ?? 0)));
  const inCanvas = leftMargin >= 0
    && topMargin >= 0
    && rightMargin >= 0
    && bottomMargin >= 0
    && Number(safeBounds.width ?? 0) > 0
    && Number(safeBounds.height ?? 0) > 0;
  return {
    bounds: {
      x: leftMargin,
      y: topMargin,
      width: Math.round(Number(safeBounds.width ?? 0)),
      height: Math.round(Number(safeBounds.height ?? 0))
    },
    inCanvas,
    edgeMarginPass: inCanvas
      && leftMargin >= minEdgeMargin
      && topMargin >= minEdgeMargin
      && rightMargin >= minEdgeMargin
      && bottomMargin >= minEdgeMargin,
    leftMargin,
    rightMargin,
    topMargin,
    bottomMargin
  };
}

export function battlefieldReadabilitySummary({
  squads = [],
  selectedSquadIds = [],
  objectives = [],
  viewport = null,
  minimapLayout = null
} = {}) {
  const livingSquads = squads.filter((squad) => (squad.hp ?? 1) > 0);
  const selected = new Set(selectedSquadIds);
  const laneProfiles = livingSquads
    .map((squad) => squadIntentLaneProfile(squad, { selectedSquadIds, playerId: "player" }))
    .filter((profile) => profile.visible && profile.priority >= 2);
  const minimap = minimapReadabilityProfile({ objectives, squads: livingSquads, viewport });
  const minimapSafeArea = minimapSafeAreaProfile(minimapLayout);
  const roleStandardKinds = uniqueSorted(livingSquads.map((squad) => squad.roleStandard?.kind).filter(Boolean));
  const selectedRoleStandardKinds = uniqueSorted(livingSquads
    .filter((squad) => selected.has(squad.id))
    .map((squad) => squad.roleStandard?.kind)
    .filter(Boolean));
  const threatLaneKinds = uniqueSorted(laneProfiles.map((profile) => profile.kind));

  return {
    roleStandardKinds,
    selectedRoleStandardKinds,
    selectedRoleStandards: livingSquads.filter((squad) => selected.has(squad.id) && squad.roleStandard?.kind).length,
    threatLaneKinds,
    hasSelectedAttackLane: threatLaneKinds.includes("selected_attack"),
    hasEnemyTargetLane: threatLaneKinds.includes("enemy_target"),
    hasRetreatLane: threatLaneKinds.includes("retreat"),
    hasPlayerRetreatLane: laneProfiles.some((profile) => profile.kind === "retreat" && profile.tone === "player_recovery"),
    minimapObjectivePips: minimap.objectivePips,
    minimapCombatHotspots: minimap.combatHotspots,
    minimapRetreatPips: minimap.retreatPips,
    minimapCameraFrameVisible: minimap.cameraFrameVisible,
    minimapSafeAreaPass: minimapSafeArea.edgeMarginPass,
    minimapRightMargin: minimapSafeArea.rightMargin,
    minimapBottomMargin: minimapSafeArea.bottomMargin
  };
}

export function combatHotspotCount(squads = []) {
  return combatHotspots(squads).length;
}

export function combatHotspots(squads = []) {
  const players = squads.filter((squad) => squad.owner === "player" && (squad.hp ?? 0) > 0);
  const enemies = squads.filter((squad) => squad.owner === "enemy" && (squad.hp ?? 0) > 0);
  const hotspots = [];
  for (const enemy of enemies) {
    const nearbyPlayers = players.filter((player) => distance(player, enemy) <= 1.9);
    if (nearbyPlayers.length > 0) {
      const playerCenter = averagePoint(nearbyPlayers);
      hotspots.push({
        x: round((enemy.x + playerCenter.x) / 2),
        y: round((enemy.y + playerCenter.y) / 2),
        enemyId: enemy.id,
        playerCount: nearbyPlayers.length
      });
    }
  }
  return hotspots;
}

function lane(kind, glyph, tone, priority) {
  return {
    visible: true,
    kind,
    glyph,
    tone,
    priority
  };
}

function distance(left, right) {
  return Math.hypot(Number(left.x ?? 0) - Number(right.x ?? 0), Number(left.y ?? 0) - Number(right.y ?? 0));
}

function averagePoint(points) {
  const total = points.reduce((sum, point) => ({
    x: sum.x + Number(point.x ?? 0),
    y: sum.y + Number(point.y ?? 0)
  }), { x: 0, y: 0 });
  return {
    x: total.x / Math.max(1, points.length),
    y: total.y / Math.max(1, points.length)
  };
}

function round(value) {
  return Number(value.toFixed(2));
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}
