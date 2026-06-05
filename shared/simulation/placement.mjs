import { canAfford } from "../economy/economy.mjs";

function rotatedFootprint(footprint, rotation) {
  const normalized = ((rotation % 360) + 360) % 360;
  if (normalized === 90 || normalized === 270) {
    return { w: footprint.h, h: footprint.w };
  }
  return { ...footprint };
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function canPlaceBuilding({ map, building, x, y, rotation = 0, stockpile = {} }) {
  if (!canAfford(stockpile, building.costs ?? {})) {
    return { ok: false, reason: "cannot_afford" };
  }

  const footprint = rotatedFootprint(building.footprint, rotation);
  const candidate = { x, y, ...footprint };

  if (candidate.x < 0 || candidate.y < 0 || candidate.x + candidate.w > map.width || candidate.y + candidate.h > map.height) {
    return { ok: false, reason: "out_of_bounds" };
  }

  if ((map.blocked ?? []).some((blocked) => overlaps(candidate, blocked))) {
    return { ok: false, reason: "blocked" };
  }

  return { ok: true, reason: "valid" };
}
