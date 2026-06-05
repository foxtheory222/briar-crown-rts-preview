const DEFAULT_SELECTION_RADIUS = 0.85;

export function defaultSelectedSquadIds(squads, owner = "player") {
  return aliveOwnerSquads(squads, owner).map((squad) => squad.id);
}

export function selectSquadAtPoint(squads, point, {
  owner = "player",
  currentSelection = [],
  additive = false,
  radius = DEFAULT_SELECTION_RADIUS
} = {}) {
  const target = nearestSquadAtPoint(aliveOwnerSquads(squads, owner), point, radius);
  if (!target) {
    return additive ? sanitizeSelection(squads, currentSelection, owner) : [];
  }
  const current = sanitizeSelection(squads, currentSelection, owner);
  if (!additive) {
    return [target.id];
  }
  if (current.includes(target.id)) {
    return current.filter((id) => id !== target.id);
  }
  return [...current, target.id];
}

export function commandableSquads(squads, selectedIds, owner = "player") {
  const selected = new Set(selectedIds);
  return aliveOwnerSquads(squads, owner).filter((squad) => selected.has(squad.id));
}

export function squadSelectionCards(squads, selectedIds, { owner = "player", definitions = new Map() } = {}) {
  const selected = new Set(selectedIds);
  const selectedCount = aliveOwnerSquads(squads, owner).filter((squad) => selected.has(squad.id)).length;
  return aliveOwnerSquads(squads, owner).map((squad, index) => {
    const definition = definitions.get(squad.squadId);
    const hp = percent(squad.hp, squad.maxHp);
    const morale = Math.round(squad.morale ?? 0);
    const state = cardState({ hp, morale, stance: squad.stance });
    return {
      id: squad.id,
      hotkey: String(index + 1),
      name: definition?.name ?? label(squad.squadId),
      hp,
      morale,
      stance: squad.stance,
      selected: selected.has(squad.id),
      status: state.status,
      statusLabel: state.statusLabel,
      severity: state.severity,
      groupLabel: selected.has(squad.id) && selectedCount > 1 ? `Group ${selectedCount}` : "Solo"
    };
  });
}

function aliveOwnerSquads(squads, owner) {
  return squads.filter((squad) => squad.owner === owner && squad.hp > 0);
}

function sanitizeSelection(squads, selectedIds, owner) {
  const allowed = new Set(aliveOwnerSquads(squads, owner).map((squad) => squad.id));
  return selectedIds.filter((id) => allowed.has(id));
}

function nearestSquadAtPoint(squads, point, radius) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (const squad of squads) {
    const distance = Math.hypot(squad.x - point.x, squad.y - point.y);
    if (distance <= radius && distance < nearestDistance) {
      nearest = squad;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function percent(value, max) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

function cardState({ hp, morale, stance }) {
  if (stance === "retreat") {
    return { status: "retreating", statusLabel: "Retreating", severity: "critical" };
  }
  if (hp <= 35 || morale <= 30 || stance === "broken") {
    return { status: "critical", statusLabel: "Critical", severity: "critical" };
  }
  if (hp <= 75) {
    return { status: "damaged", statusLabel: "Damaged", severity: "warning" };
  }
  if (morale < 70 || stance === "shaken") {
    return { status: "shaken", statusLabel: "Shaken", severity: "warning" };
  }
  return { status: "ready", statusLabel: "Ready", severity: "normal" };
}

function label(value) {
  return String(value ?? "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
