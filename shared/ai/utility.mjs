export function heroAutocastScore(ability, context) {
  if (ability.kind === "heal") {
    const woundedAllies = context.allies.filter((ally) => {
      const distance = Math.hypot(ally.x - context.caster.x, ally.y - context.caster.y);
      return distance <= ability.radius && ally.healthFraction < 0.7;
    });
    const need = woundedAllies.reduce((total, ally) => total + (1 - ally.healthFraction), 0);
    const manaFactor = Math.min(1, (context.caster.mana ?? 0) / 60);
    const clusterBonus = 1 + Math.max(0, woundedAllies.length - 1) * 0.25;
    return Math.round((need * (ability.priority ?? 1) * manaFactor * clusterBonus) * 1000) / 1000;
  }

  return ability.priority ?? 0;
}
