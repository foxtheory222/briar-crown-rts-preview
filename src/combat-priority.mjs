const OWNER_COLORS = {
  player: "#a9f0dc",
  enemy: "#c9c1d9",
  ally: "#b6d4f0",
  neutral: "#f7e7a1"
};

const EVENT_PROFILES = {
  order: {
    priority: "command",
    trail: "chevron",
    impact: "rally",
    hierarchy: {
      layer: "command_intent",
      anchor: "target",
      glyphs: ["chevron_stack", "destination_ring"]
    },
    label: "Command intent"
  },
  "squad-hit": {
    priority: "impact",
    trail: "arc",
    impact: "burst",
    hierarchy: {
      layer: "unit_impact",
      anchor: "source_target",
      glyphs: ["arc_trail", "target_flash", "burst_sparks"]
    },
    label: "Squad hit"
  },
  "structure-hit": {
    priority: "impact",
    trail: "heavy",
    impact: "shockwave",
    hierarchy: {
      layer: "structure_impact",
      anchor: "source_target",
      glyphs: ["heavy_trail", "shockwave", "debris_ticks"]
    },
    label: "Structure hit"
  },
  death: {
    priority: "lethal",
    trail: "fade",
    impact: "collapse",
    hierarchy: {
      layer: "lethal_resolution",
      anchor: "target",
      glyphs: ["collapse_ring", "residue_cross", "fade_pool"]
    },
    label: "Death"
  },
  ability: {
    priority: "ability",
    trail: "sigil",
    impact: "spellburst",
    hierarchy: {
      layer: "hero_ability",
      anchor: "source_target",
      glyphs: ["source_sigil", "area_bloom", "target_snare"]
    },
    label: "Hero ability"
  }
};

export function combatEventPriorityProfile(event = {}) {
  const profile = EVENT_PROFILES[event.kind] ?? EVENT_PROFILES["squad-hit"];
  return {
    ...profile,
    color: OWNER_COLORS[event.owner] ?? OWNER_COLORS.neutral
  };
}

export function squadPriorityProfile(squad = {}, context = {}) {
  const selected = collectionValues(context.selectedSquadIds).includes(squad.id);
  const hpState = healthState(squad);
  const moraleState = moraleStateFor(squad.morale);
  const threat = threatState(squad, collectionValues(context.hostileSquads));
  const intent = intentState(squad);
  const marker = hpState === "critical" || moraleState === "broken" || threat === "targeted"
    ? "priority_warning"
    : "normal";

  return {
    selected,
    hpState,
    moraleState,
    threat,
    intent,
    ring: selected ? "command_focus" : threat === "engaged" ? "engagement_ring" : "owner_ring",
    marker
  };
}

export function summarizeCombatPriority(content = {}) {
  const events = collectionValues(content.events);
  const squads = collectionValues(content.squads).filter((squad) => Number(squad.hp ?? 0) > 0);
  const selectedSquadIds = collectionValues(content.selectedSquadIds);
  const eventProfiles = events.map(combatEventPriorityProfile);
  const squadProfiles = squads.map((squad) => squadPriorityProfile(squad, {
    selectedSquadIds,
    hostileSquads: squads.filter((candidate) => candidate.owner !== squad.owner)
  }));

  return {
    eventPriorities: eventProfiles.map((profile) => profile.priority),
    eventKinds: [...new Set(events.map((event) => event.kind))].sort(),
    hierarchyLayers: [...new Set(eventProfiles.map((profile) => profile.hierarchy.layer))].sort(),
    impactGlyphs: [...new Set(eventProfiles.flatMap((profile) => profile.hierarchy.glyphs))].sort(),
    squadPriorities: squadProfiles.length,
    selectedCount: squadProfiles.filter((profile) => profile.selected).length,
    threatKinds: [...new Set(squadProfiles.map((profile) => profile.threat).filter((threat) => threat !== "clear"))].sort(),
    markerKinds: [...new Set(squadProfiles.map((profile) => profile.marker))].sort()
  };
}

function healthState(squad) {
  const maxHp = Math.max(1, Number(squad.maxHp ?? squad.hp ?? 1));
  const ratio = Number(squad.hp ?? maxHp) / maxHp;
  if (ratio <= 0.33) {
    return "critical";
  }
  if (ratio <= 0.66) {
    return "damaged";
  }
  return "healthy";
}

function moraleStateFor(morale = 100) {
  const value = Number(morale);
  if (value < 35) {
    return "broken";
  }
  if (value < 65) {
    return "shaken";
  }
  return "steady";
}

function threatState(squad, hostileSquads = []) {
  if (hostileSquads.some((hostile) => Number(hostile.hp ?? 0) > 0 && distance(squad, hostile) <= 1.25)) {
    return "engaged";
  }
  if (hostileSquads.some((hostile) => hostile.target && distance(squad, hostile.target) <= 1.1)) {
    return "targeted";
  }
  return "clear";
}

function intentState(squad) {
  if (squad.stance === "retreat") {
    return "retreating";
  }
  if (squad.stance === "capture") {
    return "capturing";
  }
  if (squad.stance === "attack_move" || squad.target) {
    return "attacking";
  }
  return "holding";
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
