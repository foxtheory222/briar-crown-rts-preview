const ORDER_MARKERS = {
  attack_move: {
    markerKind: "attack_target",
    pathStyle: "strike_line",
    glyphs: ["attack_crosshair", "threat_arrow"],
    priority: 2
  },
  capture: {
    markerKind: "capture_anchor",
    pathStyle: "capture_line",
    glyphs: ["capture_brackets", "objective_tether"],
    priority: 2
  },
  retreat: {
    markerKind: "retreat_destination",
    pathStyle: "retreat_lane",
    glyphs: ["retreat_arrow", "safe_ring"],
    priority: 2
  },
  move: {
    markerKind: "move_destination",
    pathStyle: "move_line",
    glyphs: ["move_pips", "destination_ring"],
    priority: 1
  },
  hold: {
    markerKind: "hold_anchor",
    pathStyle: "hold_position",
    glyphs: ["hold_ring"],
    priority: 1
  }
};

const OBJECTIVE_GLYPHS = {
  moon_pool: ["crescent_pool"],
  witchglass_shard: ["shard_cluster", "resource_glint"],
  watcher_ruin: ["watcher_eye", "sight_fan"]
};

export function squadOrderWorldMarkerProfile(squad = {}, context = {}) {
  const selected = new Set(context.selectedSquadIds ?? []).has(squad.id);
  const profile = ORDER_MARKERS[squad.stance] ?? null;
  const visible = squad.owner === "player" && Boolean(profile);

  if (!visible) {
    return {
      visible: false,
      selected,
      orderKind: squad.stance ?? "idle",
      markerKind: "none",
      pathStyle: "none",
      glyphs: [],
      priority: 0
    };
  }

  return {
    visible: true,
    selected,
    orderKind: squad.stance,
    markerKind: profile.markerKind,
    pathStyle: profile.pathStyle,
    glyphs: [...profile.glyphs],
    priority: selected ? 3 : profile.priority
  };
}

export function objectiveWorldStateProfile(objective = {}) {
  const ownerKind = objective.owner === "player" || objective.owner === "enemy" ? objective.owner : "neutral";
  const progress = objective.progress ?? {};
  const playerProgress = progress.player ?? 0;
  const enemyProgress = progress.enemy ?? 0;
  const contested = playerProgress > 0 && enemyProgress > 0 && ownerKind === "neutral";
  const hasProgress = Math.max(playerProgress, enemyProgress) > 0;
  const stateGlyphs = [];

  if (ownerKind !== "neutral") {
    stateGlyphs.push("controlled");
  }
  if (contested) {
    stateGlyphs.push("contested");
  }
  if (hasProgress && ownerKind === "neutral") {
    stateGlyphs.push("capture_progress");
  }

  const glyphs = [...(OBJECTIVE_GLYPHS[objective.id] ?? ["objective_sigil"])];
  if (ownerKind !== "neutral") {
    glyphs.push("owner_banner");
  }

  return {
    objectiveKind: objective.id ?? "unknown_objective",
    ownerKind,
    glyphs,
    stateGlyphs,
    priority: contested ? 3 : ownerKind === "neutral" ? 1 : 2
  };
}

export function summarizeWorldStateReadability(content = {}) {
  const selectedSquadIds = content.selectedSquadIds ?? [];
  const orderProfiles = (content.squads ?? [])
    .map((squad) => squadOrderWorldMarkerProfile(squad, { selectedSquadIds }))
    .filter((profile) => profile.visible && profile.priority >= 2);
  const objectiveProfiles = (content.objectives ?? []).map(objectiveWorldStateProfile);

  return {
    selectedOrderMarkers: orderProfiles.filter((profile) => profile.selected).length,
    activeOrderMarkers: orderProfiles.length,
    orderMarkerKinds: uniqueSorted(orderProfiles.map((profile) => profile.markerKind)),
    orderGlyphKinds: uniqueSorted(orderProfiles.flatMap((profile) => profile.glyphs)),
    objectiveStateCount: objectiveProfiles.length,
    objectiveGlyphKinds: uniqueSorted(objectiveProfiles.flatMap((profile) => profile.glyphs)),
    contestedObjectives: objectiveProfiles.filter((profile) => profile.stateGlyphs.includes("contested")).length
  };
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}
