export function isTechUnlocked(techTree, tierId, state) {
  const tier = techTree.tiers.find((entry) => entry.id === tierId);
  if (!tier) {
    return false;
  }

  const ownedBuildings = new Set(state.buildings ?? []);
  return (tier.requires ?? []).every((buildingId) => ownedBuildings.has(buildingId));
}

export function unlockedIdsForTier(techTree, tierNumber) {
  return techTree.tiers
    .filter((entry) => entry.tier === tierNumber)
    .flatMap((entry) => entry.unlocks ?? []);
}
