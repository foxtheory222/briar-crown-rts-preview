const EVENT_DURATIONS = {
  "squad-hit": 0.75,
  "structure-hit": 0.85,
  death: 1.35,
  order: 0.9,
  ability: 1.1
};

export function createCombatFeedbackEvent({
  id,
  now,
  kind,
  owner,
  source,
  target,
  damage = 0,
  lethal = false
}) {
  return {
    id,
    kind,
    owner,
    source: point(source),
    target: point(target),
    damage,
    lethal,
    createdAt: now,
    duration: EVENT_DURATIONS[kind] ?? 0.8
  };
}

export function advanceCombatFeedback(events, now) {
  return events
    .map((event) => {
      const age = Math.max(0, now - event.createdAt);
      const progress = Math.min(1, age / event.duration);
      return {
        ...event,
        age,
        progress,
        alpha: Number(Math.max(0, 1 - progress).toFixed(3))
      };
    })
    .filter((event) => event.progress < 1);
}

export function summarizeCombatFeedback(events) {
  const byKind = {};
  for (const event of events) {
    byKind[event.kind] = (byKind[event.kind] ?? 0) + 1;
  }
  return {
    visible: events.length,
    byKind,
    latest: events.slice(-4).map((event) => ({
      kind: event.kind,
      owner: event.owner,
      x: Number(event.target.x.toFixed(2)),
      y: Number(event.target.y.toFixed(2))
    }))
  };
}

function point(value) {
  return {
    x: Number(value?.x ?? 0),
    y: Number(value?.y ?? 0)
  };
}
