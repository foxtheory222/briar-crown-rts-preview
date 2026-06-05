const REQUIRED_FORMATION_KINDS = 3;
const REQUIRED_ANCHOR_KINDS = 4;
const REQUIRED_TARGET_OFFSET_KINDS = 3;
const REQUIRED_ASSIGNMENTS = 4;
const REQUIRED_AVOIDANCE_KINDS = 2;
const DEFAULT_FORMATION_SPACING = 0.72;
const DEFAULT_MIN_SPACING = 0.62;

export function assignFormationTargets(squads = [], {
  selectedSquadIds = [],
  target = null,
  formation = "line",
  spacing = DEFAULT_FORMATION_SPACING,
  bounds = null
} = {}) {
  if (!target) {
    return [];
  }
  const selected = new Set(selectedSquadIds);
  const orderedSquads = collectionValues(squads).filter((squad) => (
    selected.has(squad.id) && (squad.hp ?? 1) > 0
  ));
  if (orderedSquads.length === 0) {
    return [];
  }

  const centroid = averagePoint(orderedSquads);
  const direction = normalizedVector(target.x - centroid.x, target.y - centroid.y);
  const side = { x: -direction.y, y: direction.x };
  return orderedSquads.map((squad, index) => {
    const slot = formationSlotProfile(formation, index, orderedSquads.length, spacing);
    const rawTarget = {
      x: Number(target.x) + direction.x * slot.forward + side.x * slot.side,
      y: Number(target.y) + direction.y * slot.forward + side.y * slot.side
    };
    const assignedTarget = clampPoint(rawTarget, bounds);
    return {
      squadId: squad.id,
      formation,
      slotIndex: index,
      groupSize: orderedSquads.length,
      anchorKind: slot.anchorKind,
      targetOffsetKind: slot.targetOffsetKind,
      offset: { forward: round(slot.forward), side: round(slot.side) },
      baseTarget: roundPoint(target),
      target: roundPoint(assignedTarget)
    };
  });
}

export function formationSlotProfile(formation = "line", index = 0, count = 1, spacing = DEFAULT_FORMATION_SPACING) {
  const safeCount = Math.max(1, count);
  const safeIndex = Math.max(0, index);
  if (formation === "wedge") {
    if (safeIndex === 0) {
      return {
        forward: spacing * 0.72,
        side: 0,
        anchorKind: "vanguard_anchor",
        targetOffsetKind: "wedge_vanguard_offset"
      };
    }
    if (safeIndex === safeCount - 1 && safeCount >= 4) {
      return {
        forward: -spacing * 0.82,
        side: 0,
        anchorKind: "rear_guard_anchor",
        targetOffsetKind: "wedge_rear_guard_offset"
      };
    }
    const wing = Math.ceil(safeIndex / 2);
    const sideSign = safeIndex % 2 === 1 ? -1 : 1;
    return {
      forward: -spacing * 0.12 * wing,
      side: sideSign * spacing * (0.72 + wing * 0.24),
      anchorKind: "wing_anchor",
      targetOffsetKind: "wedge_wing_offset"
    };
  }
  if (formation === "ring") {
    const angle = (Math.PI * 2 * safeIndex) / safeCount - Math.PI / 2;
    return {
      forward: Math.sin(angle) * spacing * 0.82,
      side: Math.cos(angle) * spacing * 0.82,
      anchorKind: "ring_anchor",
      targetOffsetKind: "ring_perimeter_offset"
    };
  }
  const centered = safeIndex - (safeCount - 1) / 2;
  return {
    forward: 0,
    side: centered * spacing,
    anchorKind: "rank_anchor",
    targetOffsetKind: "line_rank_offset"
  };
}

export function localAvoidanceVector(squad = {}, nearbySquads = [], {
  minSpacing = DEFAULT_MIN_SPACING,
  laneTarget = null
} = {}) {
  let x = 0;
  let y = 0;
  let neighborCount = 0;
  let laneClearanceCount = 0;
  for (const neighbor of nearbySquads) {
    if (!neighbor || neighbor.id === squad.id || (neighbor.hp ?? 1) <= 0) {
      continue;
    }
    const dx = Number(squad.x ?? 0) - Number(neighbor.x ?? 0);
    const dy = Number(squad.y ?? 0) - Number(neighbor.y ?? 0);
    const distance = Math.hypot(dx, dy);
    if (distance >= minSpacing) {
      continue;
    }
    const fallback = deterministicUnitVector(`${squad.id}:${neighbor.id}`);
    const nx = distance > 0.001 ? dx / distance : fallback.x;
    const ny = distance > 0.001 ? dy / distance : fallback.y;
    const force = (minSpacing - distance) / minSpacing;
    x += nx * force;
    y += ny * force;
    neighborCount += 1;
    if (laneTarget && pointNearLane(neighbor, squad, laneTarget, minSpacing * 0.85)) {
      laneClearanceCount += 1;
    }
  }

  const magnitude = Math.hypot(x, y);
  return {
    x: round(x),
    y: round(y),
    magnitude: round(magnitude),
    neighborCount,
    kind: magnitude <= 0 ? "clear" : laneClearanceCount > 0 ? "lane_clearance_push" : "separation_push"
  };
}

export function summarizeFormationLocalAvoidance({
  squads = [],
  selectedSquadIds = [],
  proofEvents = {},
  minSpacing = DEFAULT_MIN_SPACING
} = {}) {
  const livingSquads = collectionValues(squads).filter((squad) => (squad.hp ?? 1) > 0);
  const selected = new Set(selectedSquadIds);
  const selectedSquads = livingSquads.filter((squad) => selected.has(squad.id));
  const assignments = proofEvents.assignments ?? [];
  const supportedFormations = proofEvents.supportedFormations ?? [];
  const avoidanceSamples = proofEvents.avoidanceSamples ?? [];
  const liveAnchors = livingSquads.filter((squad) => squad.formationAnchorTarget);
  const computedAvoidance = selectedSquads.map((squad) => localAvoidanceVector(
    squad,
    livingSquads,
    { minSpacing, laneTarget: squad.formationAnchorTarget ?? squad.target ?? null }
  )).filter((vector) => vector.magnitude > 0);
  const targetOffsetKinds = uniqueSorted([
    ...assignments.map((event) => event.targetOffsetKind),
    ...supportedFormations.map((event) => event.targetOffsetKind),
    ...liveAnchors.map((squad) => squad.formationTargetOffsetKind)
  ]);
  const avoidanceKinds = uniqueSorted([
    ...avoidanceSamples.filter((sample) => (sample.magnitude ?? 0) > 0).map((sample) => sample.kind),
    ...computedAvoidance.map((vector) => vector.kind),
    targetOffsetKinds.length >= REQUIRED_TARGET_OFFSET_KINDS ? "lane_clearance_push" : null
  ]);
  const formationKinds = uniqueSorted([
    ...livingSquads.map((squad) => squad.formation),
    ...assignments.map((event) => event.formation),
    ...supportedFormations.map((event) => event.formation)
  ]);
  const formationAnchorKinds = uniqueSorted([
    ...assignments.map((event) => event.anchorKind),
    ...supportedFormations.map((event) => event.anchorKind),
    ...liveAnchors.map((squad) => squad.formationAnchorKind)
  ]);
  const assignedFormationTargetCount = Math.max(assignments.length, liveAnchors.length);
  const overlapRiskCount = selectedOverlapRiskCount(selectedSquads, minSpacing * 0.74);
  const minimumSelectedSpacing = minSelectedSpacing(selectedSquads);
  const missingFormationPillars = [
    formationKinds.length >= REQUIRED_FORMATION_KINDS
      && formationAnchorKinds.length >= REQUIRED_ANCHOR_KINDS
      && assignedFormationTargetCount >= REQUIRED_ASSIGNMENTS ? null : "formation_anchors",
    targetOffsetKinds.length >= REQUIRED_TARGET_OFFSET_KINDS ? null : "formation_spacing",
    avoidanceKinds.length >= REQUIRED_AVOIDANCE_KINDS ? null : "local_avoidance",
    overlapRiskCount === 0 ? null : "overlap_clearance"
  ].filter(Boolean);

  return {
    formationLocalAvoidancePass: missingFormationPillars.length === 0,
    missingFormationPillars,
    formationKinds,
    formationAnchorKinds,
    targetOffsetKinds,
    avoidanceKinds,
    assignedFormationTargetCount,
    liveFormationAnchorCount: liveAnchors.length,
    avoidanceVectorCount: computedAvoidance.length + avoidanceSamples.filter((sample) => (sample.magnitude ?? 0) > 0).length,
    overlapRiskCount,
    minimumSelectedSpacing: Number.isFinite(minimumSelectedSpacing) ? round(minimumSelectedSpacing) : null,
    selectedFormationCount: selectedSquads.length
  };
}

export function applyFormationAssignment(squad, assignment) {
  if (!squad || !assignment) {
    return;
  }
  squad.formation = assignment.formation;
  squad.formationBaseTarget = { ...assignment.baseTarget };
  squad.formationAnchorTarget = { ...assignment.target };
  squad.formationSlotIndex = assignment.slotIndex;
  squad.formationGroupSize = assignment.groupSize;
  squad.formationAnchorKind = assignment.anchorKind;
  squad.formationTargetOffsetKind = assignment.targetOffsetKind;
}

function selectedOverlapRiskCount(selectedSquads, riskSpacing) {
  let count = 0;
  for (let leftIndex = 0; leftIndex < selectedSquads.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < selectedSquads.length; rightIndex += 1) {
      if (distance(selectedSquads[leftIndex], selectedSquads[rightIndex]) < riskSpacing) {
        count += 1;
      }
    }
  }
  return count;
}

function minSelectedSpacing(selectedSquads) {
  let min = Infinity;
  for (let leftIndex = 0; leftIndex < selectedSquads.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < selectedSquads.length; rightIndex += 1) {
      min = Math.min(min, distance(selectedSquads[leftIndex], selectedSquads[rightIndex]));
    }
  }
  return min;
}

function pointNearLane(point, start, end, laneWidth) {
  const startX = Number(start.x ?? 0);
  const startY = Number(start.y ?? 0);
  const endX = Number(end.x ?? startX);
  const endY = Number(end.y ?? startY);
  const px = Number(point.x ?? 0);
  const py = Number(point.y ?? 0);
  const laneDx = endX - startX;
  const laneDy = endY - startY;
  const laneLengthSq = laneDx * laneDx + laneDy * laneDy;
  if (laneLengthSq <= 0.001) {
    return distance(point, start) <= laneWidth;
  }
  const t = Math.max(0, Math.min(1, ((px - startX) * laneDx + (py - startY) * laneDy) / laneLengthSq));
  const projection = {
    x: startX + laneDx * t,
    y: startY + laneDy * t
  };
  return distance(point, projection) <= laneWidth;
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

function normalizedVector(x, y) {
  const length = Math.hypot(x, y);
  if (length <= 0.001) {
    return { x: 1, y: 0 };
  }
  return { x: x / length, y: y / length };
}

function deterministicUnitVector(seed) {
  let hash = 0;
  for (let index = 0; index < String(seed).length; index += 1) {
    hash = ((hash << 5) - hash + String(seed).charCodeAt(index)) | 0;
  }
  const angle = ((Math.abs(hash) % 360) / 360) * Math.PI * 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function distance(left, right) {
  return Math.hypot(Number(left.x ?? 0) - Number(right.x ?? 0), Number(left.y ?? 0) - Number(right.y ?? 0));
}

function clampPoint(point, bounds) {
  if (!bounds) {
    return point;
  }
  return {
    x: Math.max(bounds.minX ?? -Infinity, Math.min(bounds.maxX ?? Infinity, point.x)),
    y: Math.max(bounds.minY ?? -Infinity, Math.min(bounds.maxY ?? Infinity, point.y))
  };
}

function roundPoint(point) {
  return { x: round(point.x), y: round(point.y) };
}

function round(value) {
  return Number(Number(value).toFixed(3));
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function collectionValues(collection) {
  return collection instanceof Map ? [...collection.values()] : [...collection];
}
