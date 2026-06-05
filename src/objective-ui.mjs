export function objectiveCards(objectives = [], definitions = new Map()) {
  return objectives.map((objective) => {
    const definition = definitionFor(definitions, objective.id);
    const progress = objectiveProgress(objective, definition);
    const status = objectiveStatus(objective, progress);
    return {
      id: objective.id,
      label: definition?.name ?? label(objective.id),
      icon: definition?.icon ?? null,
      ownerLabel: ownerLabel(objective.owner),
      status,
      tone: status,
      progress,
      rewardLabel: rewardLabel(definition?.reward ?? {})
    };
  });
}

function definitionFor(definitions, id) {
  if (definitions instanceof Map) {
    return definitions.get(id);
  }
  return definitions?.[id] ?? null;
}

function objectiveProgress(objective, definition) {
  if (objective.owner) {
    return 1;
  }
  const captureSeconds = Math.max(1, definition?.captureSeconds ?? 1);
  const player = objective.progress?.player ?? 0;
  const enemy = objective.progress?.enemy ?? 0;
  return clamp01(Math.max(player, enemy) / captureSeconds);
}

function objectiveStatus(objective, progress) {
  if (objective.owner) {
    return "controlled";
  }
  const player = objective.progress?.player ?? 0;
  const enemy = objective.progress?.enemy ?? 0;
  if (player > 0 && enemy > 0) {
    return "contested";
  }
  if (progress > 0) {
    return "capturing";
  }
  return "neutral";
}

function ownerLabel(owner) {
  if (owner === "player") {
    return "Player";
  }
  if (owner === "enemy") {
    return "Enemy";
  }
  return "Neutral";
}

function rewardLabel(reward) {
  const entries = Object.entries(reward);
  if (!entries.length) {
    return "No reward";
  }
  return entries.map(([resource, value]) => {
    if (resource === "visionRadius") {
      return `Vision +${value}`;
    }
    return `+${value} ${label(resource)}`;
  }).join(", ");
}

function label(value) {
  return String(value ?? "")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
