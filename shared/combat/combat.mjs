export function calculateDamage({ amount, damageClass, armorClass, table }) {
  const multiplier = table?.[damageClass]?.[armorClass] ?? 1;
  return Math.round(amount * multiplier * 1000) / 1000;
}

export function moraleState(value, profile) {
  if (value >= profile.steadyAt) {
    return "steady";
  }
  if (value >= profile.shakenAt) {
    return "shaken";
  }
  return "broken";
}

export function retreatVector({ squad, threat, rally }) {
  const away = normalize({ x: squad.x - threat.x, y: squad.y - threat.y });
  const home = normalize({ x: rally.x - squad.x, y: rally.y - squad.y });
  return normalize({ x: away.x * 0.7 + home.x * 0.3, y: away.y * 0.7 + home.y * 0.3 });
}

function normalize(vector) {
  const length = Math.hypot(vector.x, vector.y);
  if (length === 0) {
    return { x: 0, y: 0 };
  }
  return { x: vector.x / length, y: vector.y / length };
}
