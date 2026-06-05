export const LOCAL_PVE_WAVE_SCRIPT = Object.freeze([
  {
    id: "hollow_probe",
    label: "Hollow Probe",
    spawnAtSeconds: 6,
    lane: "south_road",
    squadIds: ["bone_thrall_squad"],
    spawn: { x: 18, y: 17 },
    target: { x: 8, y: 14 }
  },
  {
    id: "gravebow_pressure",
    label: "Gravebow Pressure",
    spawnAtSeconds: 16,
    lane: "south_road",
    squadIds: ["bone_thrall_squad", "grave_bow_squad"],
    spawn: { x: 20, y: 16 },
    target: { x: 8, y: 14 }
  },
  {
    id: "bone_wagon_breaker",
    label: "Bone Wagon Breaker",
    spawnAtSeconds: 28,
    lane: "ruin_causeway",
    squadIds: ["bone_thrall_squad", "bone_wagon_squad"],
    spawn: { x: 21, y: 11 },
    target: { x: 13, y: 10 }
  }
]);

export function createLocalPveOperation() {
  return {
    id: "companion_lodge_defense",
    label: "Companion Lodge Defense",
    defenseObjectiveId: "witchglass_shard",
    allyLodgeHp: 260,
    allyLodgeMaxHp: 260,
    waves: LOCAL_PVE_WAVE_SCRIPT.map((wave) => ({
      ...wave,
      spawn: { ...wave.spawn },
      target: { ...wave.target },
      squadIds: [...wave.squadIds],
      spawnedAtSeconds: null,
      defeatedAtSeconds: null
    }))
  };
}

export function summarizeLocalPveOperation({
  operation = null,
  allies = [],
  buildings = [],
  squads = [],
  objectives = []
} = {}) {
  const waves = operation?.waves ?? [];
  const spawnedWaves = waves.filter((wave) => Number.isFinite(wave.spawnedAtSeconds));
  const waveById = new Map(waves.map((wave) => [wave.id, wave]));
  const activeWaveIds = spawnedWaves
    .filter((wave) => wave.defeatedAtSeconds === null && squads.some((squad) => squad.waveId === wave.id && squad.hp > 0))
    .map((wave) => wave.id);
  const activeWaveSquads = squads.filter((squad) => activeWaveIds.includes(squad.waveId) && squad.hp > 0);
  const scriptedWaveOrderPass = activeWaveSquads.length > 0 && activeWaveSquads.every((squad) => {
    const wave = waveById.get(squad.waveId);
    return squad.stance === "attack_move" && (isNearTarget(squad.target, wave?.target) || isNearTarget(squad, wave?.target, 2));
  });
  const defeatedWaveIds = spawnedWaves
    .filter((wave) => wave.defeatedAtSeconds !== null || !activeWaveIds.includes(wave.id))
    .map((wave) => wave.id);
  const allySupportPresent = allies.some((ally) => ally.kind === "companion_ai")
    || buildings.some((building) => building.owner === "ally" && building.hp > 0)
    || squads.some((squad) => squad.owner === "ally" && squad.hp > 0);
  const allyLodgePresent = buildings.some((building) => building.id === "ally-lodge-building" && building.owner === "ally" && building.hp > 0);
  const defenseObjective = objectives.find((objective) => objective.id === operation?.defenseObjectiveId);
  const defenseObjectiveHeld = ["player", "ally"].includes(defenseObjective?.owner);
  const lodgeIntegrity = Math.round((Number(operation?.allyLodgeHp ?? 0) / Math.max(1, Number(operation?.allyLodgeMaxHp ?? 1))) * 100);
  const missingOperationPillars = [
    !operation ? "operation_script" : null,
    !allySupportPresent ? "ally_support" : null,
    waves.length < 3 || spawnedWaves.length < 2 || activeWaveIds.length < 1 ? "wave_pacing" : null,
    !scriptedWaveOrderPass ? "scripted_wave_orders" : null,
    !defenseObjectiveHeld ? "defense_objective" : null,
    !allyLodgePresent || lodgeIntegrity < 50 ? "ally_lodge_integrity" : null
  ].filter(Boolean);

  return {
    operationPacingPass: missingOperationPillars.length === 0,
    operationId: operation?.id ?? null,
    defenseObjectiveId: operation?.defenseObjectiveId ?? null,
    defenseObjectiveHeld,
    allySupportPresent,
    allyLodgePresent,
    allyLodgeIntegrity: lodgeIntegrity,
    scheduledWaveCount: waves.length,
    spawnedWaveCount: spawnedWaves.length,
    activeWaveCount: activeWaveIds.length,
    scriptedWaveOrderPass,
    defeatedWaveCount: defeatedWaveIds.length,
    spawnedWaveIds: spawnedWaves.map((wave) => wave.id),
    activeWaveIds,
    defeatedWaveIds,
    nextWaveSeconds: nextWaveSeconds(waves),
    missingOperationPillars
  };
}

function nextWaveSeconds(waves) {
  const nextWave = waves.find((wave) => !Number.isFinite(wave.spawnedAtSeconds));
  return nextWave ? nextWave.spawnAtSeconds : null;
}

function isNearTarget(actual, expected, radius = 0.5) {
  if (!actual || !expected) {
    return false;
  }
  return Math.hypot(Number(actual.x) - Number(expected.x), Number(actual.y) - Number(expected.y)) < radius;
}
