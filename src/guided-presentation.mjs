export function guidedPresentationModel({
  mode = "menu",
  guidance = [],
  mission = null,
  playerFactionName = "Player",
  enemyFactionName = "Enemy",
  selectedSquadCount = 0,
  objectiveCards = [],
  replayLength = 0
} = {}) {
  const modeKind = guidedModeKind(mode);
  if (modeKind === "none") {
    return hiddenPresentation();
  }

  const profile = modeKind === "campaign_slice" ? campaignProfile() : tutorialProfile();
  const normalizedGuidance = normalizeGuidance(guidance, profile.defaultGuidance);
  const steps = normalizedGuidance.map((label, index) => ({
    index: index + 1,
    label,
    actionKind: profile.actionKinds[index] ?? `guided_action_${index + 1}`,
    beatKind: profile.beatKinds[index] ?? `guided_beat_${index + 1}`,
    complete: replayLength > index + 2
  }));
  const objectiveLabel = objectiveCards[0]?.label ?? profile.defaultObjectiveLabel;
  const panelSignalKinds = ["guided_steps", "current_step", "objective_hint", "progress_track"];

  return {
    visible: true,
    guidedPresentationPass: steps.length >= profile.minimumStepCount
      && profile.actionKinds.length >= profile.minimumActionKinds
      && profile.beatKinds.length >= profile.minimumBeatKinds
      && panelSignalKinds.length >= 4,
    modeKind,
    missionId: mission?.id ?? null,
    currentStepLabel: steps[0]?.label ?? "",
    contextLine: `${playerFactionName} vs ${enemyFactionName} at ${objectiveLabel}.`,
    progressLabel: steps.length ? `Step 1 / ${steps.length}` : "",
    stepCount: steps.length,
    instructionActionKinds: profile.actionKinds.slice(0, steps.length),
    missionBeatKinds: profile.beatKinds.slice(0, steps.length),
    panelSignalKinds,
    selectedSquadCount: Math.max(0, Number(selectedSquadCount ?? 0)),
    objectiveHintLabel: objectiveLabel,
    steps
  };
}

function hiddenPresentation() {
  return {
    visible: false,
    guidedPresentationPass: false,
    modeKind: "none",
    missionId: null,
    currentStepLabel: "",
    contextLine: "",
    progressLabel: "",
    stepCount: 0,
    instructionActionKinds: [],
    missionBeatKinds: [],
    panelSignalKinds: [],
    steps: []
  };
}

function tutorialProfile() {
  return {
    minimumStepCount: 5,
    minimumActionKinds: 3,
    minimumBeatKinds: 3,
    defaultObjectiveLabel: "Witchglass Shard",
    defaultGuidance: [
      "Place a Farmstead.",
      "Build a Barracks.",
      "Queue a frontline squad.",
      "Capture Witchglass.",
      "Attack the enemy Seat."
    ],
    actionKinds: [
      "place_economy",
      "build_production",
      "train_squad",
      "capture_objective",
      "attack_seat"
    ],
    beatKinds: [
      "economy_foundation",
      "production_unlock",
      "squad_training",
      "objective_capture",
      "seat_assault"
    ]
  };
}

function campaignProfile() {
  return {
    minimumStepCount: 3,
    minimumActionKinds: 3,
    minimumBeatKinds: 3,
    defaultObjectiveLabel: "Moon Pool",
    defaultGuidance: [
      "Secure Briar Crossing.",
      "Recruit your first hero.",
      "Use a tactical ability to break the first push."
    ],
    actionKinds: ["secure_objective", "recruit_hero", "use_hero_ability"],
    beatKinds: ["secure_crossing", "hero_recruitment", "tactical_ability"]
  };
}

function guidedModeKind(mode) {
  if (mode === "tutorial") {
    return "tutorial_onboarding";
  }
  if (mode === "campaign") {
    return "campaign_slice";
  }
  return "none";
}

function normalizeGuidance(guidance, fallback) {
  const lines = (Array.isArray(guidance) ? guidance : [])
    .map((line) => String(line ?? "").trim())
    .filter(Boolean);
  return lines.length ? lines : fallback;
}
