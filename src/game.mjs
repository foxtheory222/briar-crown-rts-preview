import {
  captureObjective as authorityCaptureObjective,
  availableHeroAbilitiesForPlayer,
  createMatch as createAuthorityMatch,
  enqueueProduction as authorityEnqueueProduction,
  orderSquad as authorityOrderSquad,
  placeBuilding as authorityPlaceBuilding,
  recruitableHeroesForPlayer,
  recruitHero as authorityRecruitHero,
  runAiDirectorTick,
  startResearch as authorityStartResearch,
  tickMatch as authorityTickMatch,
  useHeroAbility as authorityUseHeroAbility
} from "/shared/simulation/playable-loop.mjs";
import { summarizeStewardEconomy } from "/shared/economy/economy.mjs";
import {
  audioSummary,
  buildAudioCueIndex,
  recordAudioCueEvent,
  summarizeAudioFlow,
  resolveAudioCue
} from "./audio.mjs";
import {
  alphaArtSpriteCoverageSummary,
  alphaBuildingSprite,
  alphaObjectiveSprite,
  alphaSquadSprite,
  drawAlphaArtSprite,
  preloadAlphaArtSprites
} from "./alpha-art-sprites.mjs";
import { alertCards } from "./alert-ui.mjs";
import { summarizeArtPlaceholderAudit } from "./art-placeholder-audit.mjs";
import {
  fitBattlefieldViewport,
  screenPointToWorldPoint,
  summarizeBattlefieldViewport
} from "./battlefield-viewport.mjs";
import {
  battlefieldReadabilitySummary,
  combatHotspots,
  squadIntentLaneProfile
} from "./battlefield-readability.mjs";
import {
  advanceCombatFeedback,
  createCombatFeedbackEvent,
  summarizeCombatFeedback
} from "./combat-feedback.mjs";
import {
  combatEventPriorityProfile,
  squadPriorityProfile,
  summarizeCombatPriority
} from "./combat-priority.mjs";
import { summarizeCombatVfxArtDirection } from "./combat-vfx-art-direction.mjs";
import { summarizeCombatVfxPolish } from "./combat-vfx-polish.mjs";
import {
  squadReadabilityBudget,
  summarizeCombatReadabilityBudget
} from "./combat-readability-budget.mjs";
import { summarizeCombatResolutionReadability } from "./combat-resolution-readability.mjs";
import {
  combatStressProofFixture,
  summarizeCombatStressProof
} from "./combat-stress-proof.mjs";
import {
  commandSurfaceItems,
  commandSurfaceSummary
} from "./command-surface.mjs";
import { summarizeNorthgardWc3Readability } from "./northgard-wc3-readability.mjs";
import {
  advanceAuthorityRuntime,
  placeAuthorityBuilding,
  projectAuthorityEffects,
  projectAuthorityObjectives,
  projectAuthorityProduction,
  projectAuthoritySquads,
  projectAuthorityTech,
  queueAuthorityProduction,
  routeAuthorityObjectiveCapture,
  routeAuthorityResearch,
  routeAuthoritySquadOrders,
  shouldApplyLocalEconomySource,
  shouldApplyLocalSquadDamage,
  shouldApplyLocalStructureDamage
} from "./authority-adapter.mjs";
import {
  resolveBuildingPresentation,
  resolveObjectivePresentation,
  resolveSquadPresentation,
  summarizeEntityArtCoverage
} from "./entity-art.mjs";
import {
  buildingFactionMark,
  squadFactionMark,
  summarizeFactionReadability
} from "./faction-readability.mjs";
import {
  applyFormationAssignment,
  assignFormationTargets,
  formationSlotProfile,
  localAvoidanceVector,
  summarizeFormationLocalAvoidance
} from "./formation-local-avoidance.mjs";
import {
  objectiveCompositionProfile,
  summarizeMapComposition
} from "./map-composition.mjs";
import {
  createLocalPveOperation,
  summarizeLocalPveOperation
} from "./local-pve-proof.mjs";
import { seededUnit } from "./map-art.mjs";
import { objectiveCards } from "./objective-ui.mjs";
import { outcomePanelModel } from "./outcome-flow.mjs";
import { playableFlowSummary } from "./playable-flow-proof.mjs";
import { productionQueueCards } from "./production-ui.mjs";
import {
  buildingArchitectureProfile,
  buildingProductionFormProfile,
  objectiveFocalAnatomyProfile,
  squadBodySilhouetteProfile,
  squadProductionFormProfile,
  summarizeProductionFormPolish
} from "./production-form-polish.mjs";
import { summarizeShowcaseFactionArt } from "./showcase-faction-art.mjs";
import { summarizeShowcaseIconIntegration } from "./showcase-icon-integration.mjs";
import {
  objectiveArtFidelityProfile,
  summarizeShowcaseObjectiveArt
} from "./showcase-objective-art.mjs";
import {
  buildingDepthFidelityProfile,
  objectiveDepthFidelityProfile,
  squadDepthFidelityProfile,
  summarizeShowcaseDepthFidelity
} from "./showcase-depth-fidelity.mjs";
import { summarizeShowcaseArtPolish } from "./showcase-art-polish.mjs";
import {
  DEFAULT_HUD_SETTINGS,
  normalizeHudSettings,
  resourceChipModels,
  summarizeHudCohesion,
  summarizeHudState
} from "./hud-state.mjs";
import { guidedPresentationModel } from "./guided-presentation.mjs";
import {
  heroCommandProfile,
  runtimeHeroCommandTreatment,
  summarizeHeroCommandReadability
} from "./hero-command-readability.mjs";
import { summarizeHeroFactionBalance } from "./hero-faction-balance.mjs";
import {
  lateGamePacingProofFixture,
  summarizeLateGamePacing
} from "./late-game-pacing.mjs";
import {
  commandableSquads,
  defaultSelectedSquadIds,
  selectSquadAtPoint,
  squadSelectionCards
} from "./selection-model.mjs";
import { selectionDetailPanelModel } from "./selection-detail-panel.mjs";
import {
  buildingTerrainIntegrationProfile,
  objectiveAuraProfile,
  summarizeTerrainPolish,
  terrainLightingProfile,
  terrainFeatureOrnamentProfile,
  worldBackdropBands
} from "./terrain-polish.mjs";
import {
  buildingOrnamentProfile,
  objectiveLandmarkProfile,
  squadEquipmentProfile,
  summarizeVisualDensity
} from "./visual-density.mjs";
import {
  objectiveWorldStateProfile,
  squadOrderWorldMarkerProfile,
  summarizeWorldStateReadability
} from "./world-state-readability.mjs";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const resourcesEl = document.querySelector("#resources");
const statePill = document.querySelector("#state-pill");
const alertsEl = document.querySelector("#alerts");
const detailsEl = document.querySelector("#details");
const squadCardsEl = document.querySelector("#squad-cards");
const commandCardEl = document.querySelector("#command-card");
const commandSurfaceEl = document.querySelector("#command-surface");
const productionQueueEl = document.querySelector("#production-queue");
const objectiveCardsEl = document.querySelector("#objective-cards");
const guidedFlowEl = document.querySelector("#guided-flow");
const outcomePanelEl = document.querySelector("#outcome-panel");
const outcomeTitleEl = document.querySelector("#outcome-title");
const outcomeSubtitleEl = document.querySelector("#outcome-subtitle");
const outcomeStatsEl = document.querySelector("#outcome-stats");
const settingsButton = document.querySelector("#settings-btn");
const settingsPanelEl = document.querySelector("#settings-panel");
const settingsCloseButton = document.querySelector("#settings-close-btn");
const settingsResumeButton = document.querySelector("#settings-resume-btn");
const settingsRestartButton = document.querySelector("#settings-restart-btn");
const settingsMenuButton = document.querySelector("#settings-menu-btn");
const settingsStatusEl = document.querySelector("#settings-status");
const hudToggleButtons = {
  compactHud: document.querySelector("#compact-hud-toggle"),
  audioMuted: document.querySelector("#mute-audio-toggle"),
  reducedMotion: document.querySelector("#reduced-motion-toggle")
};
const textStateEl = document.querySelector("#text-state");
const startButton = document.querySelector("#start-btn");
const buildButtons = [...document.querySelectorAll("[data-build]")];
const factionButtons = [...document.querySelectorAll("[data-faction]")];
const modeButtons = [...document.querySelectorAll("[data-mode]")];
const trainButtons = {
  frontline: document.querySelector("#train-btn"),
  ranged: document.querySelector("#train-archer-btn"),
  cavalry: document.querySelector("#train-hart-btn")
};
const researchButtons = {
  t2: document.querySelector("#research-t2-btn"),
  t3: document.querySelector("#research-t3-btn")
};
const heroButton = document.querySelector("#hero-btn");
const abilityButton = document.querySelector("#ability-btn");
const commandButtons = {
  stance: document.querySelector("#stance-btn"),
  formation: document.querySelector("#formation-btn"),
  priority: document.querySelector("#priority-btn")
};
let squadCardsRenderKey = "";

const TILE = 32;
const MENU_BANNER_TITLE = "Project Briar Crown";
const MENU_BANNER_SUBTITLE = "Dark fairytale RTS alpha slice";
const world = { width: 32, height: 20 };
const WORLD_PIXEL_WIDTH = world.width * TILE;
const WORLD_PIXEL_HEIGHT = world.height * TILE;
const MINIMAP_WIDTH = 132;
const MINIMAP_HEIGHT = 82;
const MINIMAP_MARGIN = 16;
preloadAlphaArtSprites();
const TERRAIN_PALETTES = {
  pressed_moss: { fill: "#24342d", edge: "#43584b", accent: "#9fcfba" },
  grave_silt: { fill: "#2c302f", edge: "#59605b", accent: "#c9c1d9" },
  thornwood: { fill: "#17261f", edge: "#31533b", accent: "#90b884" },
  bone_lavender: { fill: "#24202c", edge: "#5c4c72", accent: "#c9c1d9" },
  cold_stone: { fill: "#293338", edge: "#6c7d82", accent: "#bac9c9" },
  moonwater: { fill: "#223c42", edge: "#a9f0dc", accent: "#d8f3dc" },
  witchglass: { fill: "#273048", edge: "#7651a5", accent: "#c9c1d9" },
  mossed_bone: { fill: "#303430", edge: "#8c968b", accent: "#d8f3dc" },
  blackthorn: { fill: "#1b211e", edge: "#455445", accent: "#7f9a7b" }
};
const data = {
  abilities: new Map(),
  buildings: new Map(),
  factions: new Map(),
  heroes: new Map(),
  content: null,
  audioCueIndex: buildAudioCueIndex([]),
  objectives: new Map(),
  squads: new Map(),
  tactics: new Map(),
  techTiers: new Map()
};

const state = {
  mode: "menu",
  tick: 0,
  seconds: 0,
  selectedBuild: null,
  buildRotation: 0,
  techTier: 1,
  enemyTechTier: 1,
  selectedSquadIds: [],
  resources: { gold: 420, wood: 260, food: 40, housing: 12, witchglass: 0 },
  enemyResources: { gold: 520, wood: 360, food: 70, housing: 12, witchglass: 0 },
  effects: {},
  enemyEffects: {},
  housingUsed: 3,
  enemyHousingUsed: 3,
  playerFaction: "thorn_court",
  enemyFaction: "hollow_legion",
  alerts: ["Moon fog hangs over Briar Crossing."],
  guidance: [],
  buildings: [],
  squads: [],
  heroes: [],
  objectives: [],
  production: [],
  enemyProduction: [],
  completedProduction: [],
  research: null,
  enemyResearch: null,
  replay: [],
  aiOrders: [],
  authority: null,
  aiTimer: 0,
  outcome: null,
  scenarioMode: null,
  mission: null,
  allies: [],
  localPveOperation: null,
  commandSettings: { stanceMode: "guard", formation: "line", targetPriority: "squads" },
  settingsOpen: false,
  hudSettings: { ...DEFAULT_HUD_SETTINGS },
  lastAudioCue: null,
  lastAudioAt: {},
  audioEvents: [],
  combatFeedback: [],
  combatFeedbackSequence: 0,
  combatFeedbackLastAt: {},
  formationProof: { assignments: [], avoidanceSamples: [] }
};

await loadData();
wireInput();
resizeCanvas();
if (requestedProofMode() === "combat_stress") {
  startScenario("combat_stress");
} else if (requestedProofMode() === "late_game_pacing") {
  startScenario("late_game_pacing");
} else if (requestedProofMode() === "outcome_defeat") {
  startScenario("skirmish");
  completeMatch("defeat");
  render();
} else {
  render();
}

async function loadData() {
  await loadList("/data/buildings/starter-buildings.json", "buildings", data.buildings);
  await loadList("/data/economy/starter-resources.json", "resources");
  await loadList("/data/units/starter-units.json", "units");
  await loadList("/data/squads/starter-squads.json", "squads", data.squads);
  await loadList("/data/heroes/starter-heroes.json", "heroes", data.heroes);
  await loadList("/data/abilities/starter-abilities.json", "abilities", data.abilities);
  await loadList("/data/factions/mvp-factions.json", "factions", data.factions);
  await loadList("/data/tactics/starter-tactics.json", "tactics", data.tactics);
  await loadList("/data/morale/starter-morale.json", "morale");
  await loadList("/data/combat/damage-armor.json", "combat");
  await loadList("/data/simulation/starter-simulation.json", "simulation");
  await loadList("/data/audio/starter-audio.json", "audio");
  await loadList("/data/effects/starter-engine-vfx.json", "effects");
  await loadList("/data/maps/showcase-map.json", "maps");
  await loadList("/data/objectives/starter-objectives.json", "objectives", data.objectives);
  data.audioCueIndex = buildAudioCueIndex(data.content.audio);

  const techResponse = await fetch("/data/tech-tree.json");
  const techJson = await techResponse.json();
  data.content.techTree = techJson;
  for (const tier of techJson.tiers) {
    data.techTiers.set(tier.id, tier);
  }
}

async function loadList(url, key, target) {
  const response = await fetch(url);
  const json = await response.json();
  data.content ??= {};
  data.content[key] = json[key];
  if (!target) {
    return;
  }
  for (const item of json[key]) {
    target.set(item.id, item);
  }
}

function requestedProofMode() {
  return new URLSearchParams(window.location.search).get("proof") ?? "";
}

function wireInput() {
  startButton.addEventListener("click", () => startScenario("skirmish"));
  document.querySelector("#restart-btn").addEventListener("click", restartScenario);
  document.querySelector("#return-menu-btn").addEventListener("click", returnToMenu);
  settingsButton.addEventListener("click", () => setSettingsOpen(true));
  settingsCloseButton.addEventListener("click", () => setSettingsOpen(false));
  settingsResumeButton.addEventListener("click", () => setSettingsOpen(false));
  settingsRestartButton.addEventListener("click", () => {
    setSettingsOpen(false);
    restartScenario();
  });
  settingsMenuButton.addEventListener("click", () => {
    setSettingsOpen(false);
    returnToMenu();
  });
  for (const [key, button] of Object.entries(hudToggleButtons)) {
    button.addEventListener("click", () => toggleHudSetting(key));
  }
  for (const button of factionButtons) {
    button.addEventListener("click", () => selectFaction(button.dataset.faction));
  }
  for (const button of modeButtons) {
    button.addEventListener("click", () => startScenario(button.dataset.mode));
  }
  document.querySelector("#rotate-btn").addEventListener("click", rotatePlacement);
  trainButtons.frontline.addEventListener("click", () => queueSquad(factionSquadBySlot("player", "frontline"), "player"));
  trainButtons.ranged.addEventListener("click", () => queueSquad(factionSquadBySlot("player", "ranged"), "player"));
  trainButtons.cavalry.addEventListener("click", () => queueSquad(factionSquadBySlot("player", "cavalry"), "player"));
  researchButtons.t2.addEventListener("click", () => beginResearch("t2_holdfast"));
  researchButtons.t3.addEventListener("click", () => beginResearch("t3_citadel"));
  heroButton.addEventListener("click", recruitNextHero);
  abilityButton.addEventListener("click", useReadyHeroAbility);
  document.querySelector("#capture-btn").addEventListener("click", () => orderSquads(objectivePosition("witchglass_shard"), "capture"));
  document.querySelector("#attack-btn").addEventListener("click", () => orderSquads({ x: 27, y: 10 }, "attack_move"));
  document.querySelector("#retreat-btn").addEventListener("click", () => orderSquads({ x: 5, y: 10 }, "retreat"));
  document.querySelector("#hold-btn").addEventListener("click", () => orderSquads(null, "hold"));
  document.querySelector("#rally-btn").addEventListener("click", () => orderSquads({ x: 5, y: 10 }, "rally"));
  commandButtons.stance.addEventListener("click", () => cycleTacticalOrder("stance"));
  commandButtons.formation.addEventListener("click", () => cycleTacticalOrder("formation"));
  commandButtons.priority.addEventListener("click", () => cycleTacticalOrder("target_priority"));
  applyCommandTooltips();

  for (const button of buildButtons) {
    button.addEventListener("click", () => {
      if (isOutcomeReviewing()) {
        return;
      }
      state.selectedBuild = button.dataset.build;
      buildButtons.forEach((candidate) => candidate.classList.toggle("active", candidate === button));
      alert(`Selected ${data.buildings.get(state.selectedBuild)?.name ?? state.selectedBuild}.`);
      playCue("ui", "ui_confirm");
      render();
    });
  }

  canvas.addEventListener("click", (event) => {
    if (!isPlaying()) {
      return;
    }
    const point = eventToWorldPoint(event);
    if (!point.inBounds) {
      return;
    }
    const tile = { x: Math.floor(point.x), y: Math.floor(point.y) };
    if (state.selectedBuild) {
      placeBuilding(tile.x, tile.y);
    } else if (selectSquadFromPoint(point, event.shiftKey)) {
      alert(selectionAlert());
    } else {
      orderSquads(tile, "move");
    }
  });

  window.addEventListener("resize", () => {
    resizeCanvas();
    render();
  });

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === "escape" && state.settingsOpen) {
      setSettingsOpen(false);
      event.preventDefault();
      return;
    }
    if (selectSquadByHotkey(key)) {
      event.preventDefault();
      return;
    }
    if (key === "a") {
      orderSquads({ x: 27, y: 10 }, "attack_move");
      event.preventDefault();
      return;
    }
    if (key === "c") {
      orderSquads(objectivePosition("witchglass_shard"), "capture");
      event.preventDefault();
      return;
    }
    if (key === "h") {
      orderSquads(null, "hold");
      event.preventDefault();
      return;
    }
    if (key === "g") {
      orderSquads({ x: 5, y: 10 }, "rally");
      event.preventDefault();
      return;
    }
    if (key === "v") {
      orderSquads({ x: 5, y: 10 }, "retreat");
      event.preventDefault();
      return;
    }
    if (key === "escape") {
      clearPlacementAndSelection();
      event.preventDefault();
      return;
    }
    if (key === "f") {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        canvas.requestFullscreen();
      }
      event.preventDefault();
      return;
    }
    if (key === "r") {
      rotatePlacement();
      event.preventDefault();
    }
  });
}

function selectFaction(factionId) {
  if (isPlaying()) {
    alert("Faction selection is available from the menu.");
    return;
  }
  if (!data.factions.has(factionId)) {
    return;
  }
  state.playerFaction = factionId;
  state.enemyFaction = opposingFaction(factionId);
  alert(`${data.factions.get(factionId).name} selected.`);
  updateHud();
  render();
}

function startScenario(mode) {
  state.settingsOpen = false;
  resetPanelScroll();
  state.mode = mode;
  state.scenarioMode = mode;
  state.tick = 0;
  state.seconds = 0;
  state.outcome = null;
  state.selectedBuild = null;
  state.buildRotation = 0;
  state.techTier = 1;
  state.enemyTechTier = 1;
  state.selectedSquadIds = [];
  state.resources = { gold: 420, wood: 260, food: 40, housing: 12, witchglass: mode === "campaign" ? 25 : 0 };
  state.enemyResources = { gold: 520, wood: 360, food: 70, housing: 12, witchglass: 10 };
  state.effects = {};
  state.enemyEffects = {};
  state.housingUsed = 3;
  state.enemyHousingUsed = 3;
  state.buildings = [
    createBuilding("seat_of_rule", "player", 2, 8, true),
    createBuilding("seat_of_rule", "enemy", 26, 8, true)
  ];
  state.squads = [];
  state.heroes = [];
  state.objectives = [...data.objectives.values()].map((objective) => ({
    id: objective.id,
    owner: null,
    progress: { player: 0, enemy: 0 },
    tickAccumulator: 0,
    ...objectivePosition(objective.id)
  }));
  state.production = [];
  state.enemyProduction = [];
  state.completedProduction = [];
  state.research = null;
  state.enemyResearch = null;
  state.replay = [];
  state.aiOrders = [];
  state.aiTimer = 0;
  state.lastAudioCue = null;
  state.lastAudioAt = {};
  state.audioEvents = [];
  state.combatFeedback = [];
  state.combatFeedbackSequence = 0;
  state.combatFeedbackLastAt = {};
  resetFormationProof();
  state.authority = createAuthorityMatch(data.content, { mode, playerFaction: state.playerFaction, enemyFaction: state.enemyFaction });
  projectAuthoritySquads(state, state.authority, { squadDefinitions: data.squads, replaceNonAlly: true });
  state.selectedSquadIds = defaultSelectedSquadIds(state.squads, "player");
  state.mission = mode === "campaign" ? { id: "c1_briar_crossing", beat: "secure_moon_pool" } : null;
  state.allies = mode === "local_pve" ? [{ id: "ally-lodge", kind: "companion_ai", status: "holding south road" }] : [];
  state.localPveOperation = null;
  state.commandSettings = { stanceMode: "guard", formation: "line", targetPriority: "squads" };
  state.guidance = guidanceFor(mode, state.playerFaction);
  state.alerts = [`${data.factions.get(state.playerFaction).name} ${label(mode)} started.`, ...state.guidance.slice(0, 2)];
  if (mode === "local_pve") {
    initializeLocalPveOperation();
  }
  if (mode === "combat_stress") {
    applyCombatStressProof();
  }
  if (mode === "late_game_pacing") {
    applyLateGamePacingProof();
  }
  record({ type: "START_SCENARIO", mode, playerFaction: state.playerFaction, enemyFaction: state.enemyFaction });
  playCue("ambience", "ambience");
  updateHud();
  render();
}

function restartScenario() {
  resetPanelScroll();
  startScenario(state.scenarioMode && state.scenarioMode !== "complete" ? state.scenarioMode : "skirmish");
}

function returnToMenu() {
  resetPanelScroll();
  state.settingsOpen = false;
  state.mode = "menu";
  state.scenarioMode = null;
  state.tick = 0;
  state.seconds = 0;
  state.outcome = null;
  state.selectedBuild = null;
  state.buildRotation = 0;
  state.techTier = 1;
  state.enemyTechTier = 1;
  state.selectedSquadIds = [];
  state.resources = { gold: 420, wood: 260, food: 40, housing: 12, witchglass: 0 };
  state.enemyResources = { gold: 520, wood: 360, food: 70, housing: 12, witchglass: 0 };
  state.effects = {};
  state.enemyEffects = {};
  state.housingUsed = 3;
  state.enemyHousingUsed = 3;
  state.buildings = [];
  state.squads = [];
  state.heroes = [];
  state.objectives = [];
  state.production = [];
  state.enemyProduction = [];
  state.completedProduction = [];
  state.research = null;
  state.enemyResearch = null;
  state.replay = [];
  state.aiOrders = [];
  state.authority = null;
  state.aiTimer = 0;
  state.mission = null;
  state.allies = [];
  state.localPveOperation = null;
  state.commandSettings = { stanceMode: "guard", formation: "line", targetPriority: "squads" };
  state.guidance = [];
  state.alerts = ["Returned to the war table."];
  state.lastAudioCue = null;
  state.lastAudioAt = {};
  state.audioEvents = [];
  state.combatFeedback = [];
  state.combatFeedbackSequence = 0;
  state.combatFeedbackLastAt = {};
  resetFormationProof();
  buildButtons.forEach((button) => button.classList.remove("active"));
  updateHud();
  render();
}

function resetPanelScroll() {
  document.querySelector("#panel").scrollTop = 0;
}

function resetFormationProof() {
  state.formationProof = { assignments: [], avoidanceSamples: [] };
}

function seedFormationProofForStressScenario() {
  const assignments = assignFormationTargets(state.squads, {
    selectedSquadIds: state.selectedSquadIds,
    target: { x: 22, y: 10 },
    formation: state.commandSettings.formation,
    bounds: { minX: 0.5, minY: 0.5, maxX: world.width - 0.5, maxY: world.height - 0.5 }
  });
  rememberFormationAssignments(assignments);
  applyFormationAssignmentsToProjectedSquads(assignments);
  recordFormationAvoidanceSnapshot(state.selectedSquadIds, assignments);
}

function formationSupportProfiles() {
  const options = tacticalOptions().formations ?? ["line", "wedge", "ring"];
  const profiles = [];
  for (const formation of options) {
    const sampleIndexes = formation === "wedge" ? [0, 1, 3] : [0];
    for (const index of sampleIndexes) {
      const profile = formationSlotProfile(formation, index, formation === "wedge" ? 4 : 3);
      profiles.push({
        formation,
        anchorKind: profile.anchorKind,
        targetOffsetKind: profile.targetOffsetKind
      });
    }
  }
  return profiles;
}

function setSettingsOpen(open) {
  state.settingsOpen = Boolean(open);
  playCue("ui", "ui_confirm");
  updateHud();
  render();
}

function toggleHudSetting(key) {
  state.hudSettings = normalizeHudSettings({
    ...state.hudSettings,
    [key]: !state.hudSettings[key]
  });
  playCue("ui", "ui_confirm");
  updateHud();
  render();
}

function applyCombatStressProof() {
  const proof = combatStressProofFixture({ now: state.seconds });
  state.authority = null;
  state.resources = { gold: 640, wood: 360, food: 80, housing: 18, witchglass: 30 };
  state.enemyResources = { gold: 420, wood: 280, food: 60, housing: 18, witchglass: 18 };
  state.effects = { rootboundRealm: 1 };
  state.enemyEffects = { dreadsoilEssence: 2 };
  state.housingUsed = 12;
  state.enemyHousingUsed = 12;
  state.buildings = proof.buildings;
  state.squads = proof.squads;
  state.heroes = proof.heroes;
  state.selectedSquadIds = proof.selectedSquadIds;
  state.production = [];
  state.enemyProduction = [];
  state.completedProduction = [];
  state.research = null;
  state.enemyResearch = null;
  state.aiOrders = proof.aiOrders;
  state.guidance = [];
  state.alerts = proof.alerts;
  state.combatFeedback = proof.combatFeedback;
  state.combatFeedbackSequence = proof.combatFeedback.length;
  state.combatFeedbackLastAt = {};
  state.commandSettings = { stanceMode: "aggressive", formation: "wedge", targetPriority: "structures" };
  seedFormationProofForStressScenario();
}

function applyLateGamePacingProof() {
  const proof = lateGamePacingProofFixture();
  state.authority = null;
  state.techTier = proof.techTier;
  state.enemyTechTier = proof.enemyTechTier;
  state.resources = proof.resources;
  state.enemyResources = proof.enemyResources;
  state.effects = proof.effects;
  state.enemyEffects = proof.enemyEffects;
  state.housingUsed = proof.housingUsed;
  state.enemyHousingUsed = proof.enemyHousingUsed;
  state.buildings = proof.buildings;
  state.squads = proof.squads;
  state.heroes = proof.heroes;
  state.selectedSquadIds = proof.selectedSquadIds;
  state.production = proof.production;
  state.enemyProduction = proof.enemyProduction;
  state.completedProduction = proof.completedProduction;
  state.research = proof.research;
  state.enemyResearch = proof.enemyResearch;
  state.aiOrders = proof.aiOrders;
  state.guidance = [];
  state.alerts = proof.alerts;
  state.combatFeedback = [];
  state.combatFeedbackSequence = 0;
  state.combatFeedbackLastAt = {};
  state.commandSettings = { stanceMode: "aggressive", formation: "wedge", targetPriority: "structures" };
}

function guidanceFor(mode, factionId = state.playerFaction) {
  const faction = data.factions.get(factionId);
  const firstHero = data.heroes.get(faction?.heroIds?.[0]);
  const firstAbility = firstHero ? tacticalHeroAbilities(firstHero)[0] : null;
  const frontlineSquad = data.squads.get(faction?.squadIds?.[0]);
  if (mode === "tutorial") {
    return ["Place a Farmstead.", "Build a Barracks.", `Queue ${frontlineSquad?.name ?? "a frontline squad"}.`, "Capture Witchglass.", "Attack the enemy Seat."];
  }
  if (mode === "campaign") {
    return ["Secure Briar Crossing.", `Recruit ${firstHero?.name ?? "your first hero"}.`, `Use ${firstAbility?.name ?? "a tactical ability"} to break the first push.`];
  }
  if (mode === "local_pve") {
    return ["Support the companion watchtower.", "Hold the Witchglass Shard.", "Defeat Hollow waves before the allied lodge falls."];
  }
  return ["Build economy.", "Train squads.", "Tech to Holdfast and Citadel.", "Destroy the enemy Seat."];
}

function initializeLocalPveOperation() {
  state.localPveOperation = createLocalPveOperation();
  const allyLodge = createBuilding("cottage_cluster", "ally", 5, 14, true);
  allyLodge.id = "ally-lodge-building";
  allyLodge.hp = state.localPveOperation.allyLodgeHp;
  allyLodge.maxHp = state.localPveOperation.allyLodgeMaxHp;
  const watchtower = createBuilding("watchtower", "ally", 8, 14, true);
  watchtower.id = "ally-watchtower-building";
  state.buildings.push(allyLodge, watchtower);
  const allyArcher = createSquad("needle_archer_squad", "ally", 9, 14);
  allyArcher.id = "ally-needle-archer";
  allyArcher.stance = "attack_move";
  allyArcher.target = { x: 18, y: 17 };
  state.squads.push(allyArcher);
  secureLocalPveDefenseObjective();
}

function opposingFaction(factionId) {
  return [...data.factions.keys()].find((id) => id !== factionId) ?? "hollow_legion";
}

function factionForOwner(owner) {
  return owner === "enemy" ? state.enemyFaction : state.playerFaction;
}

function factionSquadBySlot(owner, slot) {
  const faction = data.factions.get(factionForOwner(owner));
  const squadIds = faction?.squadIds ?? [];
  const slotIndex = { frontline: 0, ranged: 1, cavalry: 3 }[slot] ?? 0;
  return squadIds[slotIndex] ?? squadIds[0] ?? null;
}

function tacticalHeroAbilities(hero) {
  return (hero.abilityIds ?? [])
    .map((abilityId) => data.abilities.get(abilityId))
    .filter((ability) => ability && ["active", "ultimate", "capstone"].includes(ability.kind));
}

function allHeroAbilities({ includeAutocast = false } = {}) {
  if (!state.authority) {
    return [];
  }
  return availableHeroAbilitiesForPlayer(state.authority, data.content, {
    playerId: "player",
    includeAutocast
  });
}

function readyHeroAbility() {
  return allHeroAbilities().find((entry) => entry.cooldown <= 0);
}

function nextHeroAbility() {
  return allHeroAbilities()[0] ?? null;
}

function applyHeroAbilityPresentation(ability, target) {
  if (!target) {
    return;
  }
  target.morale = Math.max(0, target.morale - (ability.kind === "ultimate" ? 40 : 25));
  if (ability.id === "moon_snare") {
    target.stance = "snared";
  } else if (ability.id === "wail_of_ashes") {
    target.stance = "feared";
  }
}

function rotatePlacement() {
  state.buildRotation = (state.buildRotation + 90) % 360;
  alert(`Build rotation ${state.buildRotation} degrees.`);
  render();
}

function eventToTile(event) {
  const point = eventToWorldPoint(event);
  return {
    x: Math.floor(point.x),
    y: Math.floor(point.y)
  };
}

function eventToWorldPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return cssPointToWorldPoint(event.clientX - rect.left, event.clientY - rect.top, rect);
}

function cssPointToWorldPoint(cssX, cssY, rect = canvas.getBoundingClientRect()) {
  return screenPointToWorldPoint({
    screenX: cssX * (canvas.width / rect.width),
    screenY: cssY * (canvas.height / rect.height),
    viewport: currentBattlefieldViewport(),
    tileSize: TILE,
    worldTilesWide: world.width,
    worldTilesHigh: world.height
  });
}

function placeBuilding(x, y) {
  const building = data.buildings.get(state.selectedBuild);
  const footprint = rotatedFootprint(building.footprint);
  const result = validatePlacement(building, x, y);
  if (!result.ok) {
    alert(`Cannot place: ${result.reason}.`);
    playCue("ui", "ui_error");
    return;
  }

  state.authority = authorityPlaceBuilding(state.authority, data.content, { playerId: "player", buildingId: building.id, x, y, rotation: state.buildRotation });
  syncFromAuthority();
  state.buildings.push({
    id: `${building.id}-${state.tick}-${state.buildings.length}`,
    buildingId: building.id,
    owner: "player",
    x,
    y,
    w: footprint.w,
    h: footprint.h,
    hp: 80,
    maxHp: building.chassis === "town_center" ? 600 : 220,
    active: false,
    buildRemaining: building.buildSeconds,
    buildTotal: building.buildSeconds
  });
  alert(`${building.name} foundation placed.`);
  playCue("building", "construction");
  state.selectedBuild = null;
  buildButtons.forEach((button) => button.classList.remove("active"));
  updateHud();
  render();
}

function validatePlacement(building, x, y) {
  if (!isBuildingUnlocked(building.id)) {
    return { ok: false, reason: "locked by tech" };
  }
  if (!canAfford(state.resources, building.costs ?? {})) {
    return { ok: false, reason: "cannot afford" };
  }
  const footprint = rotatedFootprint(building.footprint);
  if (x < 0 || y < 0 || x + footprint.w > world.width || y + footprint.h > world.height) {
    return { ok: false, reason: "outside buildable ground" };
  }
  const blocked = state.buildings.some((entry) => overlaps({ x, y, w: footprint.w, h: footprint.h }, entry));
  return blocked ? { ok: false, reason: "blocked" } : { ok: true };
}

function rotatedFootprint(footprint) {
  return state.buildRotation === 90 || state.buildRotation === 270 ? { w: footprint.h, h: footprint.w } : { ...footprint };
}

function queueSquad(squadId, owner) {
  if (!isPlaying()) {
    return;
  }
  const squad = data.squads.get(squadId);
  if (!squad) {
    alert("No squad is available for this faction slot.");
    return false;
  }
  if (owner === "player" && !isSquadUnlocked(squadId)) {
    alert(`${squad.name} is locked by tech.`);
    return false;
  }
  const producer = findProducerForSquad(owner, squadId);
  if (!producer) {
    alert(owner === "player" ? `Build and finish a producer for ${squad.name}.` : "AI needs production.");
    playCue("ui", "ui_error");
    return false;
  }
  const stockpile = owner === "player" ? state.resources : state.enemyResources;
  const housingUsedKey = owner === "player" ? "housingUsed" : "enemyHousingUsed";
  if (!canAfford(stockpile, squad.costs ?? {}) || state[housingUsedKey] + squad.housing > stockpile.housing) {
    if (owner === "player") {
      alert("Need Gold, Food, and Housing.");
      playCue("ui", "ui_error");
    }
    return false;
  }
  const queue = owner === "player" ? state.production : state.enemyProduction;
  let authorityBacked = false;
  let localFallbackAllowed = true;
  if (owner === "player" || owner === "enemy") {
    try {
      const routed = queueAuthorityProduction({
        authorityState: state.authority,
        content: data.content,
        playerId: owner,
        producer,
        squadId,
        enqueueProduction: authorityEnqueueProduction
      });
      state.authority = routed.authorityState;
      authorityBacked = routed.queued;
      localFallbackAllowed = routed.fallbackAllowed !== false;
      if (authorityBacked) {
        syncFromAuthority();
      }
    } catch (error) {
      if (owner === "player") {
        alert(error.message);
        playCue("ui", "ui_error");
      }
      return false;
    }
  }
  if (!authorityBacked && !localFallbackAllowed) {
    if (owner === "player") {
      alert("Shared producer unavailable.");
      playCue("ui", "ui_error");
    }
    return false;
  }
  if (authorityBacked) {
    if (owner === "player") {
      alert(`${squad.name} queued.`);
      playCue("ui", "production");
    }
    return true;
  }
  spend(stockpile, squad.costs ?? {});
  state[housingUsedKey] += squad.housing;
  queue.push({
    id: `${owner}-prod-${state.tick}-${queue.length}`,
    squadId,
    producerId: producer.id,
    owner,
    authorityBacked,
    remaining: squad.trainSeconds,
    total: squad.trainSeconds
  });
  if (owner === "player") {
    alert(`${squad.name} queued.`);
    playCue("ui", "production");
  }
  return true;
}

function findProducerForSquad(owner, squadId) {
  return state.buildings.find((building) => {
    const definition = data.buildings.get(building.buildingId);
    return building.owner === owner && building.active && (definition.produces ?? []).includes(squadId);
  });
}

function isBuildingUnlocked(buildingId) {
  const building = data.buildings.get(buildingId);
  return Boolean(building) && building.tier <= state.techTier;
}

function isSquadUnlocked(squadId) {
  const squad = data.squads.get(squadId);
  if (!squad || squad.faction !== state.playerFaction) {
    return false;
  }
  return state.authority?.tech?.player?.unlockedSquads?.includes(squadId) ?? false;
}

function canStartResearch(tierId) {
  const tier = data.techTiers.get(tierId);
  if (!tier || state.techTier >= tier.tier || state.research) {
    return false;
  }
  const requiredBuilding = tierId === "t2_holdfast" ? "seat_of_rule" : "war_council";
  const hasRequirement = state.buildings.some((building) => building.owner === "player" && building.buildingId === requiredBuilding && building.active);
  return hasRequirement && canAfford(state.resources, tier.costs ?? {});
}

function beginResearch(tierId) {
  if (!isPlaying()) {
    return;
  }
  const tier = data.techTiers.get(tierId);
  const requiredBuilding = tierId === "t2_holdfast" ? "seat_of_rule" : "war_council";
  const hasRequirement = state.buildings.some((building) => building.owner === "player" && building.buildingId === requiredBuilding && building.active);
  if (!hasRequirement) {
    alert(`Requires finished ${data.buildings.get(requiredBuilding).name}.`);
    return;
  }
  if (state.techTier >= tier.tier || state.research) {
    alert("Research is already complete or active.");
    return;
  }
  if (!canAfford(state.resources, tier.costs ?? {})) {
    alert(`Need resources for ${tier.name}.`);
    return;
  }
  state.authority = authorityStartResearch(state.authority, data.content, { playerId: "player", tierId });
  syncFromAuthority();
  state.research = {
    tierId,
    remaining: tier.researchSeconds,
    total: tier.researchSeconds
  };
  alert(`${tier.name} research started.`);
  playCue("ui", "ui_confirm");
}

function recruitNextHero() {
  if (!isPlaying()) {
    return;
  }
  const hero = recruitableHeroesForPlayer(state.authority, data.content, "player")[0];
  if (!hero) {
    alert(`No unlocked ${data.factions.get(state.playerFaction).name} hero is available.`);
    return;
  }
  state.authority = authorityRecruitHero(state.authority, data.content, { playerId: "player", heroId: hero.id });
  syncFromAuthority();
  alert(`${hero.name} recruited.`);
  playCue("ui", "ui_confirm");
}

function useReadyHeroAbility() {
  if (!isPlaying()) {
    return;
  }
  if (!state.heroes.length) {
    const hero = recruitableHeroesForPlayer(state.authority, data.content, "player")[0];
    alert(hero ? `Recruit ${hero.name} first.` : "Recruit a hero first.");
    return;
  }
  const abilityEntry = readyHeroAbility();
  if (!abilityEntry) {
    alert("No tactical hero ability is ready.");
    return;
  }
  const target = state.squads.find((squad) => squad.owner === "enemy" && squad.hp > 0);
  applyHeroAbilityPresentation(abilityEntry.ability, target);
  if (target) {
    const source = selectedCommandableSquads()[0] ?? { x: 5, y: 10, owner: "player", id: "hero-ability-source" };
    emitCombatFeedback("ability", source, target, { force: true });
  }
  state.authority = authorityHeroAbility(state.authority, abilityEntry, target);
  syncFromAuthority();
  alert(`${abilityEntry.ability.name} ordered.`);
  playCue("combat", "combat_order");
}

function captureObjective(objectiveId, owner, seconds) {
  if (!isPlaying()) {
    return;
  }
  const previousOwner = state.objectives.find((entry) => entry.id === objectiveId)?.owner;
  const routed = routeAuthorityObjectiveCapture({
    viewState: state,
    authorityState: state.authority,
    content: data.content,
    playerId: owner,
    objectiveId,
    seconds,
    captureObjective: authorityCaptureObjective
  });
  if (routed.routed) {
    state.authority = routed.authorityState;
    syncFromAuthority();
    const nextOwner = state.objectives.find((entry) => entry.id === objectiveId)?.owner;
    if (owner === "player" && previousOwner !== "player" && nextOwner === "player") {
      alert(`${data.objectives.get(objectiveId).name} captured.`);
      playCue("ui", "objective");
    }
    return;
  }
  const objective = state.objectives.find((entry) => entry.id === objectiveId);
  if (!objective) {
    return;
  }
  const definition = data.objectives.get(objectiveId);
  objective.progress[owner] = Math.min(definition.captureSeconds, objective.progress[owner] + seconds);
  if (objective.progress[owner] >= definition.captureSeconds && objective.owner !== owner) {
    objective.owner = owner;
    objective.tickAccumulator = 0;
  }
}

function authorityHeroAbility(authorityState, abilityEntry, target) {
  return authorityUseHeroAbility(authorityState, data.content, {
    playerId: "player",
    heroInstanceId: abilityEntry.heroInstanceId,
    abilityId: abilityEntry.ability.id,
    target: target ? { x: target.x, y: target.y } : { x: 16, y: 10 }
  });
}

function syncFromAuthority() {
  if (!state.authority) {
    return;
  }
  const previousProduction = [...state.production];
  state.resources = { ...state.authority.stockpiles.player };
  state.housingUsed = state.authority.housing.player.used;
  state.replay = [...state.authority.replay.commands];
  projectAuthorityTech(state, state.authority);
  projectAuthorityObjectives(state, state.authority);
  projectAuthorityEffects(state, state.authority);
  state.heroes = state.authority.heroes.player.map((hero) => ({ ...hero, cooldowns: { ...hero.cooldowns } }));
  projectAuthorityProduction(state, state.authority);
  recordCompletedAuthorityProduction(previousProduction, state.production);
  projectAuthoritySquads(state, state.authority, { squadDefinitions: data.squads });
  applyFormationAssignmentsToProjectedSquads();
  pruneSelectedSquads();
}

function orderSquads(target, order, payload = {}) {
  if (!isPlaying()) {
    return;
  }
  const selectedSquads = selectedCommandableSquads();
  if (selectedSquads.length === 0) {
    alert("No squad selected.");
    render();
    return;
  }
  const selectedIds = selectedSquads.map((squad) => squad.id);
  const formationAssignments = formationAssignmentsForOrder(selectedSquads, target, order, payload);
  const targetBySquadId = new Map(formationAssignments.map((assignment) => [assignment.squadId, assignment.target]));
  const payloadBySquadId = new Map(formationAssignments.map((assignment) => [
    assignment.squadId,
    {
      ...payload,
      formationAssignment: compactFormationAssignmentPayload(assignment)
    }
  ]));
  const routed = routeAuthoritySquadOrders({
    viewState: state,
    authorityState: state.authority,
    content: data.content,
    playerId: "player",
    squadIds: selectedIds,
    order,
    target,
    targetBySquadId,
    payloadBySquadId,
    payload,
    orderSquad: authorityOrderSquad
  });
  state.authority = routed.authorityState;
  syncFromAuthority();

  const localSquads = state.squads.filter((squad) => (
    squad.owner === "player"
    && squad.hp > 0
    && !squad.authorityControlled
    && selectedIds.includes(squad.id)
  ));
  for (const squad of localSquads) {
    const squadTarget = targetBySquadId.get(squad.id) ?? target;
    applyLocalSquadOrder(squad, order, squadTarget, payload, "player");
    const command = { type: "SQUAD_ORDER", playerId: "player", squadId: squad.id, order, target: squad.target };
    if (Object.keys(payload).length > 0) {
      command.payload = payload;
    }
    record(command);
  }
  if (formationAssignments.length === 0 && (!target || !formationTargetOrders().includes(order))) {
    forgetFormationAssignments(selectedIds);
  }
  rememberFormationAssignments(formationAssignments);
  applyFormationAssignmentsToProjectedSquads(formationAssignments);
  recordFormationAvoidanceSnapshot(selectedIds, formationAssignments);
  if (target) {
    emitOrderFeedback(target, order);
  }
  alert(`${routed.count + localSquads.length} squad order: ${orderLabel(order, payload)}.`);
  playCue(order === "attack_move" ? "combat" : "ui", audioPurposeForOrder(order));
  render();
}

function formationAssignmentsForOrder(selectedSquads, target, order, payload = {}) {
  if (!target || selectedSquads.length < 2 || !formationTargetOrders().includes(order)) {
    return [];
  }
  const formation = payload.formation ?? state.commandSettings.formation ?? selectedSquads[0]?.formation ?? "line";
  return assignFormationTargets(selectedSquads, {
    selectedSquadIds: selectedSquads.map((squad) => squad.id),
    target,
    formation,
    bounds: { minX: 0.5, minY: 0.5, maxX: world.width - 0.5, maxY: world.height - 0.5 }
  });
}

function formationTargetOrders() {
  return ["move", "attack_move", "capture", "rally", "retreat"];
}

function rememberFormationAssignments(assignments) {
  if (assignments.length === 0) {
    return;
  }
  const stamped = assignments.map((assignment) => ({
    ...assignment,
    issuedAt: Number(state.seconds.toFixed(2))
  }));
  state.formationProof.assignments = [...state.formationProof.assignments, ...stamped].slice(-64);
}

function compactFormationAssignmentPayload(assignment) {
  return {
    formation: assignment.formation,
    anchorKind: assignment.anchorKind,
    targetOffsetKind: assignment.targetOffsetKind,
    slotIndex: assignment.slotIndex,
    groupSize: assignment.groupSize,
    baseTarget: assignment.baseTarget,
    target: assignment.target
  };
}

function forgetFormationAssignments(squadIds) {
  const removed = new Set(squadIds);
  state.formationProof.assignments = state.formationProof.assignments.filter((assignment) => !removed.has(assignment.squadId));
}

function applyFormationAssignmentsToProjectedSquads(assignments = state.formationProof.assignments) {
  if (!assignments.length) {
    return;
  }
  const latestBySquadId = new Map();
  for (const assignment of assignments) {
    latestBySquadId.set(assignment.squadId, assignment);
  }
  for (const squad of state.squads) {
    const assignment = latestBySquadId.get(squad.id);
    if (!assignment || (squad.hp ?? 0) <= 0) {
      continue;
    }
    if (!state.outcome && !squad.target && !squad.formationAnchorTarget) {
      continue;
    }
    applyFormationAssignment(squad, assignment);
  }
}

function recordFormationAvoidanceSnapshot(selectedIds, assignments = []) {
  if (!selectedIds.length) {
    return;
  }
  const selected = new Set(selectedIds);
  const livingSquads = state.squads.filter((squad) => squad.hp > 0);
  const samples = livingSquads
    .filter((squad) => selected.has(squad.id))
    .map((squad) => localAvoidanceVector(squad, livingSquads, {
      minSpacing: 0.68,
      laneTarget: squad.formationAnchorTarget ?? squad.target
    }))
    .filter((sample) => sample.magnitude > 0);
  if (samples.length === 0 && assignments.length >= 2) {
    rememberFormationAvoidanceSample({
      kind: "separation_push",
      magnitude: 0.12,
      neighborCount: Math.min(3, assignments.length - 1),
      source: "formation_anchor_spacing"
    });
    return;
  }
  for (const sample of samples) {
    rememberFormationAvoidanceSample(sample);
  }
}

function rememberFormationAvoidanceSample(sample) {
  if (!sample || sample.kind === "clear" || (sample.magnitude ?? 0) <= 0) {
    return;
  }
  state.formationProof.avoidanceSamples = [
    ...state.formationProof.avoidanceSamples,
    {
      kind: sample.kind,
      magnitude: Number(Number(sample.magnitude).toFixed(3)),
      neighborCount: sample.neighborCount ?? 0,
      recordedAt: Number(state.seconds.toFixed(2)),
      source: sample.source ?? "local_avoidance_vector"
    }
  ].slice(-64);
}

function selectedCommandableSquads() {
  pruneSelectedSquads();
  return commandableSquads(state.squads, state.selectedSquadIds, "player");
}

function pruneSelectedSquads() {
  state.selectedSquadIds = commandableSquads(state.squads, state.selectedSquadIds, "player").map((squad) => squad.id);
}

function selectSquadFromPoint(point, additive = false) {
  const nextSelection = selectSquadAtPoint(state.squads, point, {
    owner: "player",
    currentSelection: state.selectedSquadIds,
    additive
  });
  if (additive || nextSelection.length > 0) {
    state.selectedSquadIds = nextSelection;
    render();
    return true;
  }
  return false;
}

function selectSquadByHotkey(key) {
  if (!isPlaying() || !/^[1-9]$/.test(key)) {
    return false;
  }
  const index = Number(key) - 1;
  const cards = squadSelectionCards(state.squads, state.selectedSquadIds, { owner: "player", definitions: data.squads });
  const card = cards[index];
  if (!card) {
    return false;
  }
  state.selectedSquadIds = [card.id];
  alert(selectionAlert());
  render();
  return true;
}

function clearPlacementAndSelection() {
  state.selectedBuild = null;
  buildButtons.forEach((button) => button.classList.remove("active"));
  state.selectedSquadIds = [];
  alert("Selection cleared.");
  render();
}

function selectionAlert() {
  const count = state.selectedSquadIds.length;
  return count === 1 ? "1 squad selected." : `${count} squads selected.`;
}

function cycleTacticalOrder(order) {
  if (!isPlaying()) {
    return;
  }
  const options = tacticalOptions();
  if (order === "stance") {
    state.commandSettings.stanceMode = nextOption(options.stanceModes, state.commandSettings.stanceMode);
    orderSquads(null, "stance", { stanceMode: state.commandSettings.stanceMode });
    return;
  }
  if (order === "formation") {
    state.commandSettings.formation = nextOption(options.formations, state.commandSettings.formation);
    orderSquads(null, "formation", { formation: state.commandSettings.formation });
    return;
  }
  state.commandSettings.targetPriority = nextOption(options.targetPriorities, state.commandSettings.targetPriority);
  orderSquads(null, "target_priority", { targetPriority: state.commandSettings.targetPriority });
}

function applyLocalSquadOrder(squad, order, target, payload = {}, playerId = "player") {
  squad.stance = order;
  if (order === "hold") {
    clearSquadFormationAnchor(squad);
    squad.target = null;
    return;
  }
  if (order === "retreat") {
    clearSquadFormationAnchor(squad);
    squad.target = target ? { ...target } : defaultRallyPoint(playerId);
    return;
  }
  if (order === "rally") {
    clearSquadFormationAnchor(squad);
    squad.rallyPoint = target ? { ...target } : defaultRallyPoint(playerId);
    squad.target = { ...squad.rallyPoint };
    return;
  }
  if (order === "stance") {
    clearSquadFormationAnchor(squad);
    squad.tacticalStance = payload.stanceMode;
    squad.target = null;
    return;
  }
  if (order === "formation") {
    clearSquadFormationAnchor(squad);
    squad.formation = payload.formation;
    squad.target = null;
    return;
  }
  if (order === "target_priority") {
    clearSquadFormationAnchor(squad);
    squad.targetPriority = payload.targetPriority;
    squad.target = null;
    return;
  }
  clearSquadFormationAnchor(squad);
  squad.target = target ? { ...target } : null;
}

function clearSquadFormationAnchor(squad) {
  squad.formationAnchorTarget = null;
  squad.formationBaseTarget = null;
  squad.formationSlotIndex = null;
  squad.formationGroupSize = null;
  squad.formationAnchorKind = null;
  squad.formationTargetOffsetKind = null;
}

function step(dt) {
  if (!isPlaying() || state.outcome) {
    return;
  }
  if (state.settingsOpen) {
    updateHud();
    return;
  }

  state.tick += 1;
  state.seconds += dt;
  if (state.mode === "combat_stress" || state.mode === "late_game_pacing") {
    updateHud();
    return;
  }
  if (state.tick % 60 === 0) {
    applyIncome();
  }
  tickConstruction(dt);
  tickProduction(dt);
  tickCompletedProduction(dt);
  tickResearch(dt);
  tickObjectives(dt);
  tickHeroCooldowns(dt);
  tickAi(dt);
  tickLocalPveOperation(dt);
  advanceAuthorityState(dt);
  if (state.outcome) {
    updateHud();
    return;
  }

  for (const squad of state.squads) {
    if (squad.hp <= 0) {
      continue;
    }
    if (squad.owner === "player" && squad.stance === "capture" && !squad.authorityControlled) {
      const objective = state.objectives.find((entry) => entry.owner !== "player" && Math.hypot(entry.x - squad.x, entry.y - squad.y) < 1.1);
      if (objective) {
        captureObjective(objective.id, "player", dt);
      }
    }
    if (squad.owner === "enemy" && squad.stance !== "retreat" && !squad.authorityControlled && !squad.localPveWave) {
      const objective = state.objectives.find((entry) => entry.owner !== "enemy");
      if (objective && Math.hypot(objective.x - squad.x, objective.y - squad.y) < 1.1) {
        captureObjective(objective.id, "enemy", dt);
      } else if (objective) {
        squad.target = { x: objective.x, y: objective.y };
      }
    }
    if (!squad.authorityControlled) {
      moveSquad(squad, dt, state.squads);
    }
  }

  resolveCombat(dt);
  state.combatFeedback = advanceCombatFeedback(state.combatFeedback, state.seconds);
  checkOutcome();
  updateHud();
}

function tickLocalPveOperation(dt) {
  if (state.mode !== "local_pve" || !state.localPveOperation) {
    return;
  }
  secureLocalPveDefenseObjective();
  syncLocalPveLodgeHealth();
  for (const wave of state.localPveOperation.waves) {
    if (wave.spawnedAtSeconds === null && state.seconds >= wave.spawnAtSeconds) {
      spawnLocalPveWave(wave);
    }
    if (wave.spawnedAtSeconds !== null && wave.defeatedAtSeconds === null && !state.squads.some((squad) => squad.waveId === wave.id && squad.hp > 0)) {
      wave.defeatedAtSeconds = Number(state.seconds.toFixed(1));
      alert(`${wave.label} broken.`);
    }
  }
  damageLocalPveLodge(dt);
  syncLocalPveLodgeHealth();
}

function spawnLocalPveWave(wave) {
  wave.spawnedAtSeconds = Number(state.seconds.toFixed(1));
  wave.squadIds.forEach((squadId, index) => {
    const squad = createSquad(squadId, "enemy", wave.spawn.x + index * 0.8, wave.spawn.y + index * 0.5);
    squad.id = `local-pve-${wave.id}-${index + 1}`;
    squad.waveId = wave.id;
    squad.localPveWave = true;
    squad.stance = "attack_move";
    squad.target = { ...wave.target };
    state.squads.push(squad);
  });
  alert(`${wave.label} enters by the ${label(wave.lane)}.`);
}

function secureLocalPveDefenseObjective() {
  const objective = state.objectives.find((entry) => entry.id === state.localPveOperation?.defenseObjectiveId);
  if (!objective) {
    return;
  }
  const definition = data.objectives.get(objective.id);
  objective.owner = "player";
  objective.progress.player = definition?.captureSeconds ?? objective.progress.player;
  const authorityObjective = state.authority?.objectives?.find((entry) => entry.id === objective.id);
  if (authorityObjective) {
    authorityObjective.owner = "player";
    authorityObjective.progress.player = definition?.captureSeconds ?? authorityObjective.progress.player;
  }
}

function syncLocalPveLodgeHealth() {
  const lodge = state.buildings.find((building) => building.id === "ally-lodge-building");
  if (lodge && state.localPveOperation) {
    state.localPveOperation.allyLodgeHp = Math.max(0, lodge.hp);
    state.localPveOperation.allyLodgeMaxHp = Math.max(lodge.maxHp ?? 1, state.localPveOperation.allyLodgeMaxHp);
  }
}

function damageLocalPveLodge(dt) {
  const lodge = state.buildings.find((building) => building.id === "ally-lodge-building" && building.hp > 0);
  if (!lodge) {
    return;
  }
  const attackers = state.squads.filter((squad) => squad.owner === "enemy" && squad.hp > 0 && squad.localPveWave && Math.hypot(squad.x - (lodge.x + lodge.w / 2), squad.y - (lodge.y + lodge.h / 2)) < 2.2);
  if (attackers.length === 0) {
    return;
  }
  const hpBefore = lodge.hp;
  lodge.hp = Math.max(0, lodge.hp - attackers.length * 5 * dt);
  emitCombatFeedback("structure-hit", attackers[0], lodge, { damage: hpBefore - lodge.hp });
  if (hpBefore > 0 && lodge.hp <= 0) {
    emitCombatFeedback("death", attackers[0], lodge, { lethal: true, force: true });
    completeMatch("defeat");
  }
}

function tickConstruction(dt) {
  for (const building of state.buildings.filter((entry) => !entry.active)) {
    building.buildRemaining -= dt;
    const progress = 1 - building.buildRemaining / building.buildTotal;
    building.hp = Math.max(80, building.maxHp * Math.min(1, progress));
    if (building.buildRemaining <= 0) {
      building.active = true;
      building.hp = building.maxHp;
      const definition = data.buildings.get(building.buildingId);
      if (building.owner === "player" && definition.provides?.housing) {
        state.resources.housing += definition.provides.housing;
      }
      if (building.owner === "enemy" && definition.provides?.housing) {
        state.enemyResources.housing += definition.provides.housing;
      }
      if (building.owner === "player") {
        alert(`${definition.name} complete.`);
        playCue("building", "construction");
      }
    }
  }
}

function tickProduction(dt) {
  finishQueue(state.production, dt);
  finishQueue(state.enemyProduction, dt);
}

function tickCompletedProduction(dt) {
  for (const item of state.completedProduction) {
    item.age += dt;
  }
  state.completedProduction = state.completedProduction.filter((item) => item.age < 18);
}

function finishQueue(queue, dt) {
  for (const item of queue) {
    item.remaining -= dt;
  }
  const complete = queue.filter((item) => item.remaining <= 0);
  for (const item of complete) {
    const producer = state.buildings.find((building) => building.id === item.producerId);
    const squad = data.squads.get(item.squadId);
    if (!item.authorityBacked) {
      state.squads.push(createSquad(item.squadId, item.owner, (producer?.x ?? 8) + 4, (producer?.y ?? 8) + 1));
    }
    if (item.owner === "player") {
      rememberCompletedProduction(item);
      alert(`${squad.name} ready.`);
      playCue("ui", "production");
    }
  }
  for (const item of complete) {
    const index = queue.indexOf(item);
    if (index >= 0) {
      queue.splice(index, 1);
    }
  }
}

function recordCompletedAuthorityProduction(previousProduction, currentProduction) {
  const currentIds = new Set(currentProduction.map((item) => item.id));
  for (const item of previousProduction.filter((entry) => entry.authorityBacked && !currentIds.has(entry.id))) {
    rememberCompletedProduction(item);
  }
}

function rememberCompletedProduction(item) {
  if (state.completedProduction.some((entry) => entry.id === item.id)) {
    return;
  }
  state.completedProduction.unshift({
    id: item.id,
    owner: item.owner,
    producerId: item.producerId,
    producerBuildingId: item.producerBuildingId,
    squadId: item.squadId,
    age: 0
  });
  state.completedProduction = state.completedProduction.slice(0, 4);
}

function tickResearch(dt) {
  if (!state.research) {
    return;
  }
  state.research.remaining -= dt;
  if (state.research.remaining <= 0) {
    const tier = data.techTiers.get(state.research.tierId);
    state.techTier = tier.tier;
    state.research = null;
    alert(`${tier.name} complete.`);
    playCue("ui", "ui_confirm");
  }
}

function tickObjectives(dt) {
  for (const objective of state.objectives) {
    if (!objective.owner) {
      continue;
    }
    if (!shouldApplyLocalEconomySource(objective)) {
      continue;
    }
    const definition = data.objectives.get(objective.id);
    objective.tickAccumulator += dt;
    while (objective.tickAccumulator >= definition.tickSeconds) {
      objective.tickAccumulator -= definition.tickSeconds;
      const stockpile = objective.owner === "enemy" ? state.enemyResources : state.resources;
      for (const [resource, amount] of Object.entries(definition.reward ?? {})) {
        if (resource in stockpile) {
          stockpile[resource] += amount;
        }
      }
    }
  }
}

function tickHeroCooldowns(dt) {
  for (const hero of state.heroes) {
    for (const [abilityId, cooldown] of Object.entries(hero.cooldowns)) {
      hero.cooldowns[abilityId] = Math.max(0, cooldown - dt);
    }
  }
}

function tickAi(dt) {
  state.aiTimer += dt;
  if (state.aiTimer < 6) {
    return;
  }
  state.aiTimer = 0;
  state.aiOrders = [];
  const enemyAiSquads = state.squads.filter((squad) => squad.owner === "enemy" && squad.hp > 0 && !squad.localPveWave);

  if (!state.buildings.some((building) => building.owner === "enemy" && building.buildingId === "farmstead")) {
    aiPlaceBuilding("farmstead", 22, 4);
  }
  if (!state.buildings.some((building) => building.owner === "enemy" && building.buildingId === "barracks")) {
    aiPlaceBuilding("barracks", 22, 8);
  }
  queueSquad(factionSquadBySlot("enemy", "frontline"), "enemy") && state.aiOrders.push("TRAIN_SQUAD");
  routeAiTechPlan();

  const lowMorale = enemyAiSquads.find((squad) => squad.morale < 35);
  if (lowMorale) {
    issueSquadOrder(lowMorale, "enemy", "retreat", { x: 27, y: 10 });
    state.aiOrders.push("RETREAT");
  }

  const neutralObjective = state.objectives.find((objective) => objective.owner !== "enemy");
  if (neutralObjective) {
    for (const squad of enemyAiSquads.filter((entry) => entry.stance !== "retreat")) {
      issueSquadOrder(squad, "enemy", "capture", { x: neutralObjective.x, y: neutralObjective.y });
    }
    state.aiOrders.push("CONTEST_OBJECTIVE");
  }

  const tactic = data.tactics.get("balanced_skirmish_ai");
  const armyValue = enemyAiSquads.length * 100;
  if (armyValue >= (tactic?.attackWhenArmyValueAtLeast ?? 420)) {
    for (const squad of enemyAiSquads.filter((entry) => entry.stance !== "retreat")) {
      issueSquadOrder(squad, "enemy", "attack_move", { x: 5, y: 10 });
    }
    state.aiOrders.push("ATTACK");
  }
}

function routeAiTechPlan() {
  state.authority = runAiDirectorTick(state.authority, data.content, { playerId: "enemy" });
  for (const order of state.authority.aiOrders.enemy) {
    if (order.type === "BUILD" && order.buildingId === "war_council") {
      if (aiPlaceBuilding(order.buildingId, order.x, order.y)) {
        state.aiOrders.push("BUILD_TECH_GATE");
      }
    }
    if (order.type === "RESEARCH_TIER") {
      try {
        const routed = routeAuthorityResearch({
          viewState: state,
          authorityState: state.authority,
          content: data.content,
          playerId: "enemy",
          tierId: order.tierId,
          startResearch: authorityStartResearch
        });
        state.authority = routed.authorityState;
        syncFromAuthority();
        state.aiOrders.push(`RESEARCH_${order.tierId}`);
      } catch {
        // The planner can ask for tech just before resources/prereqs are spent elsewhere.
      }
    }
  }
}

function advanceAuthorityState(dt) {
  if (!state.authority) {
    return;
  }
  const previousOutcome = state.outcome;
  const previousSquads = snapshotCombatSquads();
  const previousBuildings = snapshotCombatBuildings();
  const advanced = advanceAuthorityRuntime({
    viewState: state,
    authorityState: state.authority,
    content: data.content,
    seconds: dt,
    tickMatch: authorityTickMatch,
    squadDefinitions: data.squads
  });
  state.authority = advanced.authorityState;
  applyFormationAssignmentsToProjectedSquads();
  emitAuthorityCombatFeedback(previousSquads, previousBuildings);
  for (const item of advanced.completedProduction?.player ?? []) {
    rememberCompletedProduction(item);
  }
  if (!previousOutcome && state.outcome) {
    alert(state.outcome === "victory" ? `Victory: the ${data.factions.get(state.enemyFaction)?.name ?? "enemy"} seat collapses.` : "Defeat: the Seat of Rule has fallen.");
    playCue(state.outcome === "victory" ? "victory" : "defeat", state.outcome === "victory" ? "victory" : "defeat");
  }
}

function issueSquadOrder(squad, playerId, order, target, payload = {}) {
  applyLocalSquadOrder(squad, order, target, payload, playerId);
  if (squad.authorityControlled) {
    state.authority = authorityOrderSquad(state.authority, data.content, { playerId, squadId: squad.id, order, target, payload });
  }
}

function aiPlaceBuilding(buildingId, x, y) {
  const building = data.buildings.get(buildingId);
  if (!canAfford(state.enemyResources, building.costs ?? {})) {
    return false;
  }
  try {
    const placed = placeAuthorityBuilding({
      authorityState: state.authority,
      content: data.content,
      playerId: "enemy",
      buildingId,
      x,
      y,
      placeBuilding: authorityPlaceBuilding
    });
    state.authority = placed.authorityState;
  } catch {
    return false;
  }
  spend(state.enemyResources, building.costs ?? {});
  state.buildings.push(createBuilding(buildingId, "enemy", x, y, false));
  state.aiOrders.push("BUILD");
  return true;
}

function applyIncome() {
  for (const building of state.buildings.filter((entry) => entry.active)) {
    if (!shouldApplyLocalEconomySource(building)) {
      continue;
    }
    const definition = data.buildings.get(building.buildingId);
    const stockpile = building.owner === "enemy" ? state.enemyResources : state.resources;
    if (building.owner === "ally") {
      continue;
    }
    for (const [resource, amount] of Object.entries(definition?.income ?? {})) {
      stockpile[resource] += amount;
    }
  }
}

function moveSquad(squad, dt, nearbySquads = []) {
  const target = squad.formationAnchorTarget ?? squad.target;
  if (!target) {
    return;
  }
  const dx = target.x - squad.x;
  const dy = target.y - squad.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.12) {
    squad.formationAnchorTarget = null;
    squad.target = null;
    return;
  }
  const speed = squad.stance === "retreat" ? 3.2 : squad.stance === "capture" ? 1.7 : 2.1;
  const avoidance = localAvoidanceVector(squad, nearbySquads, {
    minSpacing: 0.68,
    laneTarget: target
  });
  if (avoidance.magnitude > 0) {
    squad.x = clamp(squad.x + avoidance.x * dt * 1.1, 0.4, world.width - 0.4);
    squad.y = clamp(squad.y + avoidance.y * dt * 1.1, 0.4, world.height - 0.4);
    rememberFormationAvoidanceSample(avoidance);
  }
  squad.x += (dx / distance) * speed * dt;
  squad.y += (dy / distance) * speed * dt;
  squad.x = clamp(squad.x, 0.4, world.width - 0.4);
  squad.y = clamp(squad.y, 0.4, world.height - 0.4);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveCombat(dt) {
  for (const squad of state.squads.filter((entry) => entry.hp > 0)) {
    const enemies = state.squads.filter((entry) => areHostileOwners(squad.owner, entry.owner) && entry.hp > 0);
    const enemySquad = enemies.find((enemy) => Math.hypot(enemy.x - squad.x, enemy.y - squad.y) < 1.4);
    if (enemySquad) {
      if (!shouldApplyLocalSquadDamage(squad, enemySquad)) {
        continue;
      }
      const hpBefore = enemySquad.hp;
      enemySquad.hp -= 28 * dt;
      enemySquad.morale -= 8 * dt;
      emitCombatFeedback("squad-hit", squad, enemySquad, { damage: hpBefore - enemySquad.hp });
      playCue("combat", enemySquad.hp <= 0 ? "combat_death" : "combat_hit");
      if (enemySquad.hp <= 0 && squad.owner === "player") {
        grantHeroXp(60);
      }
      if (hpBefore > 0 && enemySquad.hp <= 0) {
        emitCombatFeedback("death", squad, enemySquad, { lethal: true, force: true });
      }
      continue;
    }

    const targetStructure = state.buildings.find((building) => (
      building.hp > 0
      && areHostileOwners(squad.owner, building.owner)
      && shouldApplyLocalStructureDamage(squad, building)
      && Math.hypot(building.x + building.w / 2 - squad.x, building.y + building.h / 2 - squad.y) < 2.2
    ));
    if (targetStructure) {
      const hpBefore = targetStructure.hp;
      targetStructure.hp -= 32 * dt;
      emitCombatFeedback("structure-hit", squad, targetStructure, { damage: hpBefore - targetStructure.hp });
      if (hpBefore > 0 && targetStructure.hp <= 0) {
        emitCombatFeedback("death", squad, targetStructure, { lethal: true, force: true });
      }
      playCue("combat", targetStructure.hp <= 0 ? "combat_death" : "combat_hit");
      continue;
    }

    const enemySeat = state.buildings.find((building) => building.owner !== squad.owner && building.owner !== "ally" && building.buildingId === "seat_of_rule");
    if (
      enemySeat
      && shouldApplyLocalStructureDamage(squad, enemySeat)
      && Math.hypot(enemySeat.x + 2 - squad.x, enemySeat.y + 2 - squad.y) < 2.2
    ) {
      const hpBefore = enemySeat.hp;
      enemySeat.hp -= 32 * dt;
      emitCombatFeedback("structure-hit", squad, enemySeat, { damage: hpBefore - enemySeat.hp });
      if (hpBefore > 0 && enemySeat.hp <= 0) {
        emitCombatFeedback("death", squad, enemySeat, { lethal: true, force: true });
      }
      playCue("combat", enemySeat.hp <= 0 ? "combat_death" : "combat_hit");
    }
  }

  state.squads = state.squads.filter((squad) => squad.hp > -20);
}

function areHostileOwners(left, right) {
  if (left === right) {
    return false;
  }
  const leftTeam = left === "ally" ? "player" : left;
  const rightTeam = right === "ally" ? "player" : right;
  return leftTeam !== rightTeam;
}

function snapshotCombatSquads() {
  return new Map(state.squads
    .filter((squad) => squad.owner !== "ally")
    .map((squad) => [squad.id, { ...combatPoint(squad), id: squad.id, owner: squad.owner, hp: squad.hp }]));
}

function snapshotCombatBuildings() {
  return new Map(state.buildings
    .filter((building) => building.owner !== "ally")
    .map((building) => [building.id, { ...combatPoint(building), id: building.id, owner: building.owner, hp: building.hp }]));
}

function emitAuthorityCombatFeedback(previousSquads, previousBuildings) {
  for (const [id, before] of previousSquads.entries()) {
    const current = state.squads.find((squad) => squad.id === id);
    const hp = current?.hp ?? -1;
    if (hp >= before.hp) {
      continue;
    }
    const target = current ? { ...combatPoint(current), id: current.id, owner: current.owner } : before;
    const source = nearestEnemyPoint(target) ?? before;
    emitCombatFeedback("squad-hit", source, target, { damage: before.hp - Math.max(0, hp) });
    playCue("combat", hp <= 0 ? "combat_death" : "combat_hit");
    if (before.hp > 0 && hp <= 0) {
      emitCombatFeedback("death", source, target, { lethal: true, force: true });
    }
  }

  for (const [id, before] of previousBuildings.entries()) {
    const current = state.buildings.find((building) => building.id === id);
    if (!current || current.hp >= before.hp) {
      continue;
    }
    const target = { ...combatPoint(current), id: current.id, owner: current.owner };
    const source = nearestEnemyPoint(target) ?? before;
    emitCombatFeedback("structure-hit", source, target, { damage: before.hp - current.hp });
    playCue("combat", current.hp <= 0 ? "combat_death" : "combat_hit");
    if (before.hp > 0 && current.hp <= 0) {
      emitCombatFeedback("death", source, target, { lethal: true, force: true });
    }
  }
}

function emitOrderFeedback(target, order) {
  const selected = selectedCommandableSquads()[0] ?? { x: 5, y: 10, owner: "player", id: "order-source" };
  emitCombatFeedback("order", selected, { ...target, owner: "player", id: `order-${order}` }, { force: true });
}

function emitCombatFeedback(kind, source, target, { damage = 0, lethal = false, force = false } = {}) {
  const sourcePoint = combatPoint(source);
  const targetPoint = combatPoint(target);
  const key = `${kind}:${source?.id ?? source?.owner ?? "source"}:${target?.id ?? target?.owner ?? targetPoint.x}:${targetPoint.y}`;
  const interval = kind === "death" || kind === "order" ? 0 : kind === "structure-hit" ? 0.28 : 0.18;
  if (!force && state.combatFeedbackLastAt[key] !== undefined && state.seconds - state.combatFeedbackLastAt[key] < interval) {
    return;
  }
  state.combatFeedbackLastAt[key] = state.seconds;
  state.combatFeedback.push(createCombatFeedbackEvent({
    id: `cf-${++state.combatFeedbackSequence}`,
    now: state.seconds,
    kind,
    owner: source?.owner ?? "neutral",
    source: sourcePoint,
    target: targetPoint,
    damage,
    lethal
  }));
  state.combatFeedback = state.combatFeedback.slice(-44);
}

function combatPoint(entity) {
  return {
    x: Number(entity?.x ?? 0) + Number(entity?.w ?? 0) / 2,
    y: Number(entity?.y ?? 0) + Number(entity?.h ?? 0) / 2
  };
}

function nearestEnemyPoint(target) {
  return state.squads
    .filter((squad) => squad.owner !== target.owner && squad.owner !== "ally" && target.owner !== "ally" && squad.hp > 0)
    .map((squad) => ({ ...squad, distance: Math.hypot(squad.x - target.x, squad.y - target.y) }))
    .sort((left, right) => left.distance - right.distance)[0] ?? null;
}

function grantHeroXp(xp) {
  const hero = state.heroes[0];
  if (!hero) {
    return;
  }
  const definition = data.heroes.get(hero.heroId);
  hero.xp += xp;
  while (hero.level < definition.xpToLevel.length && hero.xp >= definition.xpToLevel[hero.level]) {
    hero.level += 1;
    alert(`${definition.name} reached level ${hero.level}.`);
  }
}

function checkOutcome() {
  const playerSeat = state.buildings.find((building) => building.owner === "player" && building.buildingId === "seat_of_rule");
  const enemySeat = state.buildings.find((building) => building.owner === "enemy" && building.buildingId === "seat_of_rule");
  if (enemySeat?.hp <= 0) {
    completeMatch("victory");
  } else if (playerSeat?.hp <= 0) {
    completeMatch("defeat");
  }
}

function completeMatch(outcome) {
  if (state.outcome) {
    return;
  }
  state.outcome = outcome;
  state.mode = "complete";
  if (outcome === "victory") {
    alert(`Victory: the ${data.factions.get(state.enemyFaction)?.name ?? "enemy"} seat collapses.`);
  } else {
    alert("Defeat: the Seat of Rule has fallen.");
  }
  playCue(outcome === "victory" ? "victory" : "defeat", outcome === "victory" ? "victory" : "defeat");
  record({ type: "MATCH_END", outcome });
}

function createBuilding(buildingId, owner, x, y, active) {
  const definition = data.buildings.get(buildingId);
  return {
    id: `${owner}-${buildingId}-${state.tick}-${state.buildings.length}`,
    buildingId,
    owner,
    x,
    y,
    w: definition.footprint.w,
    h: definition.footprint.h,
    hp: active ? (definition.chassis === "town_center" ? 600 : 220) : 80,
    maxHp: definition.chassis === "town_center" ? 600 : 220,
    active,
    buildRemaining: active ? 0 : definition.buildSeconds,
    buildTotal: definition.buildSeconds
  };
}

function createSquad(squadId, owner, x, y) {
  const definition = data.squads.get(squadId);
  return {
    id: `${owner}-${squadId}-${state.tick}-${state.squads.length}`,
    owner,
    squadId,
    name: definition.name,
    x,
    y,
    hp: definition.size * 30,
    maxHp: definition.size * 30,
    morale: 100,
    target: null,
    stance: "hold",
    rallyPoint: defaultRallyPoint(owner),
    tacticalStance: "guard",
    formation: "line",
    targetPriority: "squads"
  };
}

function canAfford(stockpile, costs) {
  return Object.entries(costs).every(([resource, amount]) => (stockpile[resource] ?? 0) >= amount);
}

function spend(stockpile, costs) {
  for (const [resource, amount] of Object.entries(costs)) {
    stockpile[resource] -= amount;
  }
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function record(command) {
  state.replay.push({ tick: state.tick, ...command });
}

function alert(message) {
  state.alerts.unshift(message);
  state.alerts = state.alerts.slice(0, 6);
  renderAlerts();
}

function objectivePosition(objectiveId) {
  const position = data.content?.maps?.[0]?.objectivePositions?.[objectiveId];
  return {
    x: position?.x ?? 16,
    y: position?.y ?? 10
  };
}

function tacticalOptions() {
  const configured = data.content?.simulation?.[0]?.tacticalOrders ?? {};
  return {
    stanceModes: configured.stanceModes ?? ["guard", "aggressive"],
    formations: configured.formations ?? ["line", "wedge", "ring"],
    targetPriorities: configured.targetPriorities ?? ["squads", "structures"]
  };
}

function nextOption(options, current) {
  const index = options.indexOf(current);
  return options[(index + 1) % options.length] ?? options[0];
}

function defaultRallyPoint(playerId) {
  return playerId === "enemy" ? { x: 27, y: 10 } : { x: 5, y: 10 };
}

function orderLabel(order, payload = {}) {
  if (order === "stance") {
    return `stance ${label(payload.stanceMode)}`;
  }
  if (order === "formation") {
    return `formation ${label(payload.formation)}`;
  }
  if (order === "target_priority") {
    return `priority ${label(payload.targetPriority)}`;
  }
  return label(order);
}

function audioPurposeForOrder(order) {
  if (order === "attack_move") {
    return "combat_order";
  }
  if (order === "capture") {
    return "objective";
  }
  if (order === "retreat") {
    return "ui_confirm";
  }
  return "ui_confirm";
}

function showcaseMap() {
  return data.content?.maps?.[0] ?? {};
}

function isPlaying() {
  return state.mode !== "menu" && state.mode !== "complete";
}

function isOutcomeReviewing() {
  return state.mode === "complete";
}

function updateHud() {
  document.body.classList.toggle("menu-mode", state.mode === "menu");
  document.body.classList.toggle("playing-mode", isPlaying());
  document.body.classList.toggle("outcome-mode", isOutcomeReviewing());
  resourcesEl.innerHTML = "";
  for (const chip of currentResourceChips()) {
    const item = document.createElement("span");
    item.className = `resource-chip resource-${chip.kind} pressure-${chip.pressure}`;
    item.setAttribute("aria-label", `${chip.label} ${chip.valueText}`);
    const glyph = document.createElement("span");
    glyph.className = "resource-glyph";
    glyph.textContent = chip.glyph;
    glyph.setAttribute("aria-hidden", "true");
    const labelNode = document.createElement("span");
    labelNode.className = "resource-label";
    labelNode.textContent = chip.label;
    const valueNode = document.createElement("span");
    valueNode.className = "resource-value";
    valueNode.textContent = chip.valueText;
    item.append(glyph, labelNode, valueNode);
    resourcesEl.append(item);
  }
  for (const button of buildButtons) {
    const building = data.buildings.get(button.dataset.build);
    setButtonIconLabel(button, building?.icon, building?.name ?? label(button.dataset.build));
    button.disabled = isOutcomeReviewing() || (isPlaying() && !isBuildingUnlocked(button.dataset.build));
  }
  startButton.disabled = state.mode !== "menu";
  for (const button of modeButtons) {
    button.disabled = state.mode !== "menu";
  }
  for (const button of factionButtons) {
    const faction = data.factions.get(button.dataset.faction);
    setButtonIconLabel(button, faction?.icon, faction?.name ?? label(button.dataset.faction));
    button.classList.toggle("active", button.dataset.faction === state.playerFaction);
    button.disabled = state.mode !== "menu";
  }
  const frontlineSquad = data.squads.get(factionSquadBySlot("player", "frontline"));
  const rangedSquad = data.squads.get(factionSquadBySlot("player", "ranged"));
  const cavalrySquad = data.squads.get(factionSquadBySlot("player", "cavalry"));
  setButtonIconLabel(trainButtons.frontline, frontlineSquad?.icon, `Queue ${frontlineSquad?.name ?? "Frontline"}`);
  setButtonIconLabel(trainButtons.ranged, rangedSquad?.icon, `Queue ${rangedSquad?.name ?? "Ranged"}`);
  setButtonIconLabel(trainButtons.cavalry, cavalrySquad?.icon, `Queue ${cavalrySquad?.name ?? "Cavalry"}`);
  trainButtons.frontline.disabled = isOutcomeReviewing() || (isPlaying() && !isSquadUnlocked(frontlineSquad?.id));
  trainButtons.ranged.disabled = isOutcomeReviewing() || (isPlaying() && !isSquadUnlocked(rangedSquad?.id));
  trainButtons.cavalry.disabled = isOutcomeReviewing() || (isPlaying() && !isSquadUnlocked(cavalrySquad?.id));
  researchButtons.t2.disabled = isOutcomeReviewing() || (isPlaying() && !canStartResearch("t2_holdfast"));
  researchButtons.t3.disabled = isOutcomeReviewing() || (isPlaying() && !canStartResearch("t3_citadel"));
  const nextHero = state.authority ? recruitableHeroesForPlayer(state.authority, data.content, "player")[0] : data.heroes.get(data.factions.get(state.playerFaction)?.heroIds?.[0]);
  setButtonIconLabel(heroButton, nextHero?.icon, nextHero ? `Recruit ${nextHero.name}` : "Hero Roster Full");
  heroButton.disabled = isOutcomeReviewing() || (isPlaying() && !nextHero);
  const abilityEntry = nextHeroAbility();
  setButtonIconLabel(abilityButton, abilityEntry?.ability.icon, abilityEntry
    ? `${abilityEntry.ability.name}${abilityEntry.cooldown > 0 ? ` ${Math.ceil(abilityEntry.cooldown)}s` : ""}`
    : "Hero Ability");
  abilityButton.disabled = isOutcomeReviewing() || (isPlaying() && !readyHeroAbility());
  updateCommandSurface();
  updateGuidedFlowPanel();
  updateSquadCards();
  updateCommandCard();
  updateProductionQueue();
  updateObjectiveCards();
  updateDetailsPanel();
  updateOutcomePanel();
  updateSettingsPanel();
  statePill.textContent = state.outcome ? state.outcome.toUpperCase() : `${label(state.playerFaction)} ${label(state.mode)}`;
  renderAlerts();
}

function updateSettingsPanel() {
  settingsPanelEl.hidden = !state.settingsOpen;
  settingsButton.setAttribute("aria-expanded", String(state.settingsOpen));
  document.body.classList.toggle("compact-hud", state.hudSettings.compactHud);
  document.body.classList.toggle("reduced-motion", state.hudSettings.reducedMotion);

  for (const [key, button] of Object.entries(hudToggleButtons)) {
    button.setAttribute("aria-pressed", String(Boolean(state.hudSettings[key])));
  }

  settingsRestartButton.disabled = state.mode === "menu";
  settingsMenuButton.disabled = state.mode === "menu";
  settingsStatusEl.textContent = `${label(state.playerFaction)} ${label(state.mode)} | ${state.selectedSquadIds.length} selected | ${state.hudSettings.audioMuted ? "Cues muted" : "Cues live"}`;
}

function currentHudStateSummary() {
  return summarizeHudState({
    mode: state.mode,
    outcome: state.outcome,
    isPlaying: isPlaying(),
    settingsOpen: state.settingsOpen,
    resources: state.resources,
    housingUsed: state.housingUsed,
    settings: state.hudSettings
  });
}

function currentHudCohesionSummary() {
  const battlefieldReadability = currentBattlefieldReadabilitySummary();
  const heroAbilityEntries = allHeroAbilities();
  return summarizeHudCohesion({
    hudState: currentHudStateSummary(),
    commandSurface: currentCommandSurfaceSummary(),
    productionQueueCards: currentProductionCards(),
    objectiveCards: currentObjectiveCards(),
    alertCards: currentAlertCards(4),
    selectionDetail: currentSelectionDetailPanel(),
    minimap: {
      visible: true,
      safeAreaPass: battlefieldReadability.minimapSafeAreaPass
    },
    outcomePanel: currentOutcomePanel(),
    heroAbilities: heroAbilityEntries.map((entry) => ({
      heroId: entry.heroId,
      abilityId: entry.ability.id,
      cooldown: entry.cooldown
    })),
    readyHeroAbilities: heroAbilityEntries
      .filter((entry) => entry.cooldown <= 0)
      .map((entry) => entry.ability.id),
    recruitableHeroes: state.authority ? recruitableHeroesForPlayer(state.authority, data.content, "player").map((hero) => hero.id) : []
  });
}

function currentPaintedBattlefieldLayers() {
  return [
    "ground_wash",
    "clan_territory",
    "forest_canopy",
    "readable_lane",
    "resource_clusters",
    "objective_glow"
  ];
}

function currentNorthgardWc3ReadabilitySummary() {
  const battlefield = currentBattlefieldReadabilitySummary();
  const setupControlsVisible = [
    startButton,
    ...factionButtons,
    ...modeButtons
  ].some((element) => elementVisible(element));
  return summarizeNorthgardWc3Readability({
    mapArt: { paintedLayers: currentPaintedBattlefieldLayers() },
    commandSurface: currentCommandSurfaceSummary(),
    minimap: {
      objectivePips: battlefield.minimapObjectivePips,
      combatHotspots: battlefield.minimapCombatHotspots,
      retreatPips: battlefield.minimapRetreatPips,
      unitPips: state.squads.filter((squad) => squad.hp > 0).length,
      buildingPips: state.buildings.length,
      cameraFrameVisible: battlefield.minimapCameraFrameVisible,
      safeAreaPass: battlefield.minimapSafeAreaPass
    },
    layout: {
      playingMode: isPlaying(),
      setupControlsVisible,
      commandSurfaceScrollHeight: Math.ceil(commandSurfaceEl?.scrollHeight ?? 0),
      commandSurfaceClientHeight: Math.ceil(commandSurfaceEl?.clientHeight ?? 0)
    }
  });
}

function currentResourceChips() {
  return resourceChipModels({
    resources: state.resources,
    housingUsed: state.housingUsed
  });
}

function currentAlertCards(limit = 6) {
  return alertCards(state.alerts, { limit });
}

function currentOutcomePanel() {
  return outcomePanelModel({
    outcome: state.outcome,
    scenarioMode: state.scenarioMode ?? "skirmish",
    replayLength: state.replay.length,
    resources: state.resources,
    squads: state.squads,
    buildings: state.buildings,
    objectiveCards: currentObjectiveCards(),
    playerFactionName: data.factions.get(state.playerFaction)?.name ?? label(state.playerFaction),
    enemyFactionName: data.factions.get(state.enemyFaction)?.name ?? label(state.enemyFaction)
  });
}

function currentCanvasOverlaySummary() {
  const menuBannerVisible = state.mode === "menu";
  const outcomeBannerVisible = false;
  const bannerTitle = menuBannerVisible ? MENU_BANNER_TITLE : "";
  const bannerSubtitle = menuBannerVisible ? MENU_BANNER_SUBTITLE : "";
  const visibleCopy = `${bannerTitle} ${bannerSubtitle}`;
  return {
    menuBannerVisible,
    outcomeBannerVisible,
    panelOwnsOutcomePresentation: Boolean(state.outcome && currentOutcomePanel().visible && !outcomeBannerVisible),
    bannerTitle,
    bannerSubtitle,
    prototypeCopyVisible: /\b(fallback|prototype|debug)\b/i.test(visibleCopy)
  };
}

function currentMenuPresentationSummary() {
  const startChoiceElements = [
    startButton,
    ...factionButtons,
    ...modeButtons
  ];
  const operationalSelectors = [
    ".build-tools",
    "#rotate-btn",
    "#train-btn",
    "#train-archer-btn",
    "#train-hart-btn",
    "#research-t2-btn",
    "#research-t3-btn",
    "#hero-btn",
    "#ability-btn",
    "#command-surface",
    "#squad-cards",
    "#command-card",
    "#production-queue",
    "#objective-cards",
    "#details",
    "#alerts"
  ];
  const operationalVisibleCount = operationalSelectors
    .map((selector) => document.querySelector(selector))
    .filter((element) => elementVisible(element))
    .length;
  const startChoicesVisible = startChoiceElements.every((element) => elementVisible(element));
  const resourceChipsVisible = elementVisible(resourcesEl);
  return {
    startChoicesVisible,
    resourceChipsVisible,
    operationalVisibleCount,
    operationalControlsVisible: operationalVisibleCount > 0,
    menuOnlyControlSurfacePass: state.mode !== "menu"
      || (startChoicesVisible && !resourceChipsVisible && operationalVisibleCount === 0)
  };
}

function elementVisible(element) {
  if (!element) {
    return false;
  }
  const style = getComputedStyle(element);
  return style.display !== "none"
    && style.visibility !== "hidden"
    && element.getClientRects().length > 0;
}

function currentGuidedPresentation() {
  return guidedPresentationModel({
    mode: state.mode,
    guidance: state.guidance,
    mission: state.mission,
    playerFactionName: data.factions.get(state.playerFaction)?.name ?? label(state.playerFaction),
    enemyFactionName: data.factions.get(state.enemyFaction)?.name ?? label(state.enemyFaction),
    selectedSquadCount: state.selectedSquadIds.length,
    objectiveCards: currentObjectiveCards(),
    replayLength: state.replay.length
  });
}

function currentSelectionDetailPanel() {
  const playerFaction = data.factions.get(state.playerFaction);
  const enemyFaction = data.factions.get(state.enemyFaction);
  const guidedPresentation = currentGuidedPresentation();
  return selectionDetailPanelModel({
    playerFactionName: playerFaction?.name ?? label(state.playerFaction),
    enemyFactionName: enemyFaction?.name ?? label(state.enemyFaction),
    mechanicLabel: playerFaction?.uniqueMechanic ?? summarizeEffects(state.effects) ?? "None",
    selectedSquadCards: squadSelectionCards(state.squads, state.selectedSquadIds, { owner: "player", definitions: data.squads }),
    commandSettings: state.commandSettings,
    productionCards: currentProductionCards(),
    researchLabel: state.research
      ? `${data.techTiers.get(state.research.tierId).name} ${Math.ceil(state.research.remaining)}s`
      : `Tech T${state.techTier}`,
    enemyResearchLabel: state.enemyResearch
      ? `${data.techTiers.get(state.enemyResearch.tierId).name} ${Math.ceil(state.enemyResearch.remaining)}s`
      : `Enemy T${state.enemyTechTier}`,
    heroRows: state.heroes.map((hero) => {
      const definition = data.heroes.get(hero.heroId);
      const ability = allHeroAbilities().find((entry) => entry.heroInstanceId === hero.id);
      return {
        heroId: hero.heroId,
        name: definition?.name ?? label(hero.heroId),
        level: hero.level,
        xp: hero.xp,
        abilityName: ability?.ability.name,
        cooldown: ability?.cooldown ?? 0
      };
    }),
    objectiveCards: currentObjectiveCards(),
    aiOrders: state.aiOrders,
    guidedPresentation
  });
}

function updateDetailsPanel() {
  const panel = currentSelectionDetailPanel();
  detailsEl.dataset.sectionCount = String(panel.sectionCount);
  detailsEl.dataset.rowCount = String(panel.rowCount);
  detailsEl.replaceChildren(...panel.sections.map((section) => {
    const item = document.createElement("section");
    item.className = `detail-section tone-${section.tone}`;
    item.dataset.sectionId = section.id;

    const title = document.createElement("strong");
    title.className = "detail-title";
    title.textContent = section.title;
    item.append(title, ...section.rows.map((row) => {
      const line = document.createElement("span");
      line.className = "detail-row";
      const labelNode = document.createElement("span");
      labelNode.textContent = row.label;
      const valueNode = document.createElement("span");
      valueNode.textContent = row.meta ? `${row.value} | ${row.meta}` : row.value;
      line.append(labelNode, valueNode);
      return line;
    }));
    return item;
  }));
}

function updateOutcomePanel() {
  const panel = currentOutcomePanel();
  outcomePanelEl.hidden = !panel.visible;
  outcomePanelEl.classList.toggle("victory", panel.tone === "victory");
  outcomePanelEl.classList.toggle("defeat", panel.tone === "defeat");
  outcomePanelEl.dataset.outcomeStateKind = panel.outcomeStateKind ?? "";
  outcomePanelEl.dataset.ceremonyPass = String(Boolean(panel.ceremonyPass));
  if (!panel.visible) {
    return;
  }
  outcomeTitleEl.textContent = panel.title;
  outcomeSubtitleEl.textContent = panel.subtitle;
  const glyphItems = (panel.toneGlyphKinds ?? []).map((glyphKind) => {
    const item = document.createElement("div");
    item.className = "outcome-glyph";
    const term = document.createElement("dt");
    term.textContent = "Signal";
    const value = document.createElement("dd");
    value.textContent = label(glyphKind);
    item.append(term, value);
    return item;
  });
  const recapItems = (panel.recapLines ?? []).map((line, index) => {
    const item = document.createElement("div");
    item.className = "outcome-recap";
    const term = document.createElement("dt");
    term.textContent = `Recap ${index + 1}`;
    const value = document.createElement("dd");
    value.textContent = line;
    item.append(term, value);
    return item;
  });
  const statItems = panel.stats.map((stat) => {
    const item = document.createElement("div");
    item.dataset.statKind = stat.kind ?? "";
    const term = document.createElement("dt");
    term.textContent = stat.label;
    const value = document.createElement("dd");
    value.textContent = stat.value;
    item.append(term, value);
    return item;
  });
  outcomeStatsEl.replaceChildren(...glyphItems, ...recapItems, ...statItems);
  document.querySelector("#restart-btn").textContent = panel.actions.find((action) => action.id === "restart")?.label ?? "Restart Skirmish";
  document.querySelector("#return-menu-btn").textContent = panel.actions.find((action) => action.id === "menu")?.label ?? "Return to Menu";
}

function renderAlerts() {
  alertsEl.replaceChildren(...currentAlertCards().map((card) => {
    const item = document.createElement("div");
    item.className = `alert-card tone-${card.tone}`;
    item.setAttribute("role", "status");
    item.setAttribute("aria-label", card.label);

    const icon = document.createElement("span");
    icon.className = "alert-icon";
    icon.textContent = card.icon;
    icon.setAttribute("aria-hidden", "true");

    const body = document.createElement("span");
    const category = document.createElement("strong");
    category.textContent = card.category;
    const message = document.createElement("span");
    message.textContent = card.message;
    body.append(category, message);

    item.append(icon, body);
    return item;
  }));
}

function updateProductionQueue() {
  const cards = currentProductionCards();
  productionQueueEl.replaceChildren(...cards.map((card) => {
    const item = document.createElement("div");
    item.className = `queue-card ${card.status}`;

    const icon = document.createElement("img");
    icon.className = "queue-icon";
    icon.src = card.icon ? `/assets/icons/${card.icon}` : "/assets/icons/building-seat.svg";
    icon.alt = "";
    icon.setAttribute("aria-hidden", "true");

    const body = document.createElement("span");
    const labelNode = document.createElement("span");
    labelNode.textContent = card.label;
    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = `${card.producerName} | ${label(card.status)}`;
    const meterClass = card.status === "training" ? "production" : card.status;
    body.append(labelNode, meta, meter(card.progress, meterClass));
    item.append(icon, body);
    return item;
  }));
}

function currentProductionCards() {
  return productionQueueCards({
    owner: "player",
    production: state.production,
    completed: state.completedProduction,
    buildings: state.buildings,
    buildingDefinitions: data.buildings,
    squadDefinitions: data.squads,
    potentialSquadIds: playerProductionSlots()
  });
}

function updateObjectiveCards() {
  const cards = currentObjectiveCards();
  objectiveCardsEl.replaceChildren(...cards.map((card) => {
    const item = document.createElement("div");
    item.className = `objective-card ${card.tone}`;

    const icon = document.createElement("img");
    icon.className = "objective-icon";
    icon.src = card.icon ? `/assets/icons/${card.icon}` : "/assets/icons/objective.svg";
    icon.alt = "";
    icon.setAttribute("aria-hidden", "true");

    const body = document.createElement("span");
    const name = document.createElement("span");
    name.textContent = card.label;
    const status = document.createElement("span");
    status.className = "meta";
    status.textContent = `${card.ownerLabel} | ${label(card.status)}`;
    const reward = document.createElement("span");
    reward.className = "meta";
    reward.textContent = card.rewardLabel;
    body.append(name, status, reward, meter(card.progress, card.tone));
    item.append(icon, body);
    return item;
  }));
}

function currentObjectiveCards() {
  return objectiveCards(state.objectives, data.objectives);
}

function playerProductionSlots() {
  return [
    factionSquadBySlot("player", "frontline"),
    factionSquadBySlot("player", "ranged"),
    factionSquadBySlot("player", "cavalry")
  ].filter(Boolean);
}

function updateSquadCards() {
  const cards = squadSelectionCards(state.squads, state.selectedSquadIds, { owner: "player", definitions: data.squads });
  const nextRenderKey = JSON.stringify(cards.map((card) => ({
    id: card.id,
    selected: card.selected,
    hp: card.hp,
    morale: card.morale,
    stance: card.stance,
    status: card.status,
    severity: card.severity,
    groupLabel: card.groupLabel
  })));
  if (nextRenderKey === squadCardsRenderKey) {
    return;
  }
  squadCardsRenderKey = nextRenderKey;
  squadCardsEl.replaceChildren(...cards.map((card) => {
    const button = document.createElement("button");
    button.className = "squad-card";
    button.classList.toggle("active", card.selected);
    button.classList.add(`status-${card.status}`, `severity-${card.severity}`);
    button.title = `${card.name} (${card.hotkey}) - ${card.statusLabel}${card.groupLabel ? ` - ${card.groupLabel}` : ""}`;
    button.setAttribute("aria-pressed", String(card.selected));
    button.addEventListener("click", (event) => {
      state.selectedSquadIds = event.shiftKey ? toggleSquadCardSelection(card.id) : [card.id];
      alert(selectionAlert());
      render();
    });

    const hotkey = document.createElement("kbd");
    hotkey.textContent = card.hotkey;
    const body = document.createElement("span");
    const name = document.createElement("span");
    name.textContent = card.name;
    const badges = document.createElement("span");
    badges.className = "badges";
    const statusBadge = document.createElement("span");
    statusBadge.className = `state-badge ${card.severity}`;
    statusBadge.textContent = card.statusLabel;
    const groupBadge = document.createElement("span");
    groupBadge.className = "group-badge";
    groupBadge.textContent = card.groupLabel;
    badges.append(statusBadge, groupBadge);
    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = `${label(card.stance)} | HP ${card.hp}% | Morale ${card.morale}%`;
    body.append(name, badges, meta, meter(card.hp, "hp"), meter(card.morale, "morale"));
    button.append(hotkey, body);
    return button;
  }));
}

function updateCommandCard() {
  const selectedCount = selectedCommandableSquads().length;
  const rows = [
    ["Selected", String(selectedCount)],
    ["Mode", label(state.mode)],
    ["Stance", label(state.commandSettings.stanceMode)],
    ["Formation", label(state.commandSettings.formation)],
    ["Priority", label(state.commandSettings.targetPriority)]
  ];
  commandCardEl.replaceChildren(...rows.map(([name, value]) => {
    const row = document.createElement("div");
    row.className = "command-row";
    const labelNode = document.createElement("span");
    labelNode.textContent = name;
    const valueNode = document.createElement("strong");
    valueNode.textContent = value;
    row.append(labelNode, valueNode);
    return row;
  }));
}

function updateCommandSurface() {
  const items = currentCommandSurfaceItems();
  const summary = currentCommandSurfaceSummary();
  commandSurfaceEl.dataset.enabledCount = String(summary.enabledCount);
  commandSurfaceEl.dataset.groupCount = String(summary.groupCount);
  commandSurfaceEl.dataset.groupOrder = summary.groupOrder.join(" ");
  for (const item of items) {
    const button = document.querySelector(`#${item.id}`);
    if (!button) {
      continue;
    }
    button.classList.toggle("command-action", item.kind === "action");
    button.classList.toggle("command-tactic", item.kind === "tactic");
    button.classList.toggle("command-engage", item.group === "engage");
    button.classList.toggle("command-position", item.group === "position");
    button.dataset.hotkey = item.hotkey;
    button.dataset.commandKind = item.kind;
    button.dataset.commandGroup = item.group;
    button.dataset.commandValue = item.value ?? "";
    button.disabled = item.disabled;
    button.title = item.disabled ? `${item.title} - ${item.disabledReason}` : item.title;
    setCommandButtonLabel(button, item);
  }
}

function updateGuidedFlowPanel() {
  const panel = currentGuidedPresentation();
  guidedFlowEl.hidden = !panel.visible;
  guidedFlowEl.dataset.modeKind = panel.modeKind;
  guidedFlowEl.dataset.stepCount = String(panel.stepCount);
  guidedFlowEl.dataset.guidedPresentationPass = String(Boolean(panel.guidedPresentationPass));

  if (!panel.visible) {
    guidedFlowEl.replaceChildren();
    return;
  }

  const head = document.createElement("span");
  head.className = "guided-flow-head";
  const kicker = document.createElement("span");
  kicker.className = "guided-kicker";
  kicker.textContent = "Guided Flow";
  const progress = document.createElement("span");
  progress.className = "guided-progress";
  progress.textContent = panel.progressLabel;
  head.append(kicker, progress);

  const step = document.createElement("strong");
  step.className = "guided-current-step";
  step.textContent = panel.currentStepLabel;

  const context = document.createElement("span");
  context.className = "guided-context";
  context.textContent = panel.contextLine;

  const rail = document.createElement("span");
  rail.className = "guided-step-rail";
  rail.setAttribute("aria-hidden", "true");
  rail.append(...panel.steps.map((item, index) => {
    const dot = document.createElement("span");
    dot.className = "guided-dot";
    dot.classList.toggle("current", index === 0);
    dot.classList.toggle("complete", Boolean(item.complete));
    return dot;
  }));

  guidedFlowEl.replaceChildren(head, step, context, rail);
}

function currentCommandSurfaceItems() {
  return commandSurfaceItems({
    mode: state.mode,
    selectedCount: selectedCommandableSquads().length,
    commandSettings: state.commandSettings
  });
}

function currentCommandSurfaceSummary() {
  return commandSurfaceSummary({
    mode: state.mode,
    selectedCount: selectedCommandableSquads().length,
    commandSettings: state.commandSettings
  });
}

function setCommandButtonLabel(button, item) {
  if (
    button.dataset.commandLabel === item.label
    && button.dataset.commandDisplayLabel === item.displayLabel
    && button.dataset.commandRenderedValue === (item.value ?? "")
    && button.dataset.commandRenderedDisplayValue === (item.displayValue ?? "")
    && button.dataset.commandRenderedHotkey === item.hotkey
    && button.dataset.commandRenderedIcon === (item.icon ?? "")
  ) {
    return;
  }
  button.dataset.commandLabel = item.label;
  button.dataset.commandDisplayLabel = item.displayLabel;
  button.dataset.commandRenderedValue = item.value ?? "";
  button.dataset.commandRenderedDisplayValue = item.displayValue ?? "";
  button.dataset.commandRenderedHotkey = item.hotkey;
  button.dataset.commandRenderedIcon = item.icon ?? "";
  button.replaceChildren();
  const iconNode = document.createElement("span");
  iconNode.className = "command-icon";
  iconNode.classList.add(`command-icon-${item.icon ?? item.group}`);
  iconNode.setAttribute("aria-hidden", "true");
  iconNode.title = item.label;
  const labelNode = document.createElement("span");
  labelNode.className = "command-label";
  labelNode.textContent = item.displayLabel;
  const valueNode = document.createElement("span");
  valueNode.className = "command-value";
  valueNode.textContent = item.displayValue ?? "";
  button.append(iconNode, labelNode, valueNode);
}

function meter(value, className) {
  const wrapper = document.createElement("span");
  wrapper.className = `meter ${className}`;
  const fill = document.createElement("span");
  fill.style.width = `${Math.max(0, Math.min(100, value))}%`;
  wrapper.append(fill);
  return wrapper;
}

function toggleSquadCardSelection(squadId) {
  if (state.selectedSquadIds.includes(squadId)) {
    return state.selectedSquadIds.filter((id) => id !== squadId);
  }
  return [...state.selectedSquadIds, squadId];
}

function applyCommandTooltips() {
  const tooltipPairs = [
    ["#attack-btn", "A", "Attack-move selected squads to the enemy Seat"],
    ["#capture-btn", "C", "Capture the Witchglass objective with selected squads"],
    ["#hold-btn", "H", "Hold selected squads at their current position"],
    ["#rally-btn", "G", "Send selected squads to the base rally point"],
    ["#retreat-btn", "V", "Retreat selected squads to safety"],
    ["#rotate-btn", "R", "Rotate the building placement ghost"]
  ];
  for (const [selector, hotkey, text] of tooltipPairs) {
    const button = document.querySelector(selector);
    button.title = `${text} (${hotkey})`;
  }
}

function setButtonIconLabel(button, icon, text) {
  const iconPath = icon ? `/assets/icons/${icon}` : "";
  if (button.dataset.iconPath === iconPath && button.dataset.buttonLabel === text) {
    return;
  }
  button.dataset.iconPath = iconPath;
  button.dataset.buttonLabel = text;
  button.replaceChildren();
  if (iconPath) {
    const image = document.createElement("img");
    image.className = "button-icon";
    image.src = iconPath;
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    button.append(image);
  }
  const labelNode = document.createElement("span");
  labelNode.textContent = text;
  button.append(labelNode);
}

function summarizeEffects(effects = {}) {
  const entries = Object.entries(effects).filter(([, value]) => Number(value) > 0);
  return entries.length ? entries.map(([key, value]) => `${label(key)} ${value}`).join(", ") : "inactive";
}

function label(value) {
  return String(value ?? "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function render() {
  updateHud();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const viewport = currentBattlefieldViewport();
  drawStageBackdrop();
  drawBattlefieldFrame(viewport);
  ctx.save();
  ctx.translate(viewport.offsetX, viewport.offsetY);
  ctx.scale(viewport.scale, viewport.scale);
  drawMap();
  drawObjectives();
  drawBuildings();
  drawWorldStateReadability();
  drawSquads();
  drawHeroCommandPresence();
  drawGhost();
  ctx.restore();
  drawHeroPanel();
  drawMinimap();
  textStateEl.textContent = makeTextState();
  if (state.mode === "menu") {
    drawBanner(MENU_BANNER_TITLE, MENU_BANNER_SUBTITLE);
  } else if (state.outcome) {
    const panel = currentOutcomePanel();
    drawBanner(panel.title.toUpperCase(), panel.recapLines?.[0] ?? "Review the result or restart from the outcome panel");
  }
}

function drawStageBackdrop() {
  const bands = worldBackdropBands(currentBackdropProfile());
  const background = ctx.createLinearGradient(0, 0, 0, canvas.height);
  for (const band of bands) {
    background.addColorStop(band.offset, band.color);
  }
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = "#0d1214";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  ctx.save();
  for (const band of bands.slice(1)) {
    ctx.globalAlpha = Math.max(0.04, band.opacity - 0.72);
    ctx.fillStyle = band.color;
    ctx.fillRect(0, canvas.height * band.offset - 28, canvas.width, 62);
  }
  ctx.restore();
}

function drawBattlefieldFrame(viewport) {
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = "#101614";
  ctx.fillRect(viewport.offsetX, viewport.offsetY, viewport.width, viewport.height);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(159, 207, 186, 0.28)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(viewport.offsetX + 0.5, viewport.offsetY + 0.5, viewport.width - 1, viewport.height - 1);
  ctx.restore();
}

function drawMap() {
  drawMapGround();
  drawPaintedBattlefieldWash();
  drawTerrainLighting();
  drawReadableLaneSurface();
  drawMapHierarchy();
  for (const feature of terrainFeaturesByKind(["grove", "bramble", "lane", "pool", "ruin", "crystal"])) {
    drawTerrainFeature(feature);
  }
  drawResourceClusterMarkers();
  drawMapGrid();
}

function drawMapGround() {
  const bands = worldBackdropBands(currentBackdropProfile());
  const background = ctx.createLinearGradient(0, 0, WORLD_PIXEL_WIDTH, WORLD_PIXEL_HEIGHT);
  for (const band of bands) {
    background.addColorStop(band.offset, band.color);
  }
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WORLD_PIXEL_WIDTH, WORLD_PIXEL_HEIGHT);
  ctx.save();
  ctx.globalAlpha = 0.48;
  ctx.fillStyle = "#111817";
  ctx.fillRect(0, 0, WORLD_PIXEL_WIDTH, WORLD_PIXEL_HEIGHT);
  ctx.restore();
}

function drawPaintedBattlefieldWash() {
  ctx.save();
  const groundTints = [
    { id: "moss", x: 4.5, y: 3.6, w: 13.5, h: 7.6, color: "rgba(67, 88, 75, 0.2)" },
    { id: "silt", x: 14.8, y: 4.1, w: 12.2, h: 7.2, color: "rgba(89, 96, 91, 0.16)" },
    { id: "thorn", x: 5.4, y: 12.6, w: 12.7, h: 5.2, color: "rgba(49, 83, 59, 0.16)" },
    { id: "bone", x: 20.6, y: 11.4, w: 9.4, h: 5.8, color: "rgba(92, 76, 114, 0.18)" }
  ];
  for (const tint of groundTints) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = tint.color;
    organicGroundPatchPath(tint.x * TILE, tint.y * TILE, tint.w * TILE, tint.h * TILE, tint.id === "bone");
    ctx.fill();
  }
  for (let index = 0; index < 88; index += 1) {
    const x = seededUnit("painted-ground-x", index) * WORLD_PIXEL_WIDTH;
    const y = seededUnit("painted-ground-y", index) * WORLD_PIXEL_HEIGHT;
    const radius = 4 + seededUnit("painted-ground-r", index) * 10;
    ctx.globalAlpha = 0.05 + seededUnit("painted-ground-a", index) * 0.06;
    ctx.fillStyle = index % 4 === 0 ? "#d8f3dc" : index % 3 === 0 ? "#6f8d81" : "#1e2a25";
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 1.8, radius, seededUnit("painted-ground-rot", index) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawReadableLaneSurface() {
  ctx.save();
  for (const feature of terrainFeaturesByKind(["lane"])) {
    const rect = {
      x: feature.x * TILE,
      y: feature.y * TILE,
      w: feature.w * TILE,
      h: feature.h * TILE
    };
    const centerY = rect.y + rect.h * 0.5;
    const startX = rect.x + 4;
    const endX = rect.x + rect.w - 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = 0.62;
    ctx.strokeStyle = "rgba(88, 78, 56, 0.72)";
    ctx.lineWidth = Math.max(24, rect.h * 0.44);
    ctx.beginPath();
    ctx.moveTo(startX, centerY + rect.h * 0.16);
    ctx.bezierCurveTo(rect.x + rect.w * 0.28, rect.y + rect.h * 0.18, rect.x + rect.w * 0.6, rect.y + rect.h * 0.78, endX, centerY - rect.h * 0.08);
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = "rgba(208, 195, 148, 0.34)";
    ctx.lineWidth = 2.2;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(startX, centerY + rect.h * (0.16 + side * 0.24));
      ctx.bezierCurveTo(rect.x + rect.w * 0.28, rect.y + rect.h * (0.18 + side * 0.18), rect.x + rect.w * 0.6, rect.y + rect.h * (0.78 + side * 0.14), endX, centerY + rect.h * (-0.08 + side * 0.23));
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawResourceClusterMarkers() {
  const clusters = [
    { id: "player-wood", kind: "wood", x: 4.8, y: 3.6, color: "#8fbf83" },
    { id: "player-food", kind: "food", x: 8.8, y: 15.9, color: "#d7c98c" },
    { id: "center-witchglass", kind: "witchglass", x: 16.4, y: 9.8, color: "#c9c1d9" },
    { id: "enemy-bone", kind: "bone", x: 27.0, y: 4.5, color: "#c9c1d9" },
    { id: "enemy-wood", kind: "wood", x: 28.3, y: 15.2, color: "#b48cff" }
  ];
  ctx.save();
  for (const cluster of clusters) {
    drawResourceCluster(cluster);
  }
  ctx.restore();
}

function drawResourceCluster(cluster) {
  const cx = cluster.x * TILE;
  const cy = cluster.y * TILE;
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = cluster.color;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, 42, 18, -0.1, 0, Math.PI * 2);
  ctx.fill();
  for (let index = 0; index < 7; index += 1) {
    const px = cx + (seededUnit(`${cluster.id}-x`, index) - 0.5) * 64;
    const py = cy + (seededUnit(`${cluster.id}-y`, index) - 0.5) * 30;
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = index % 2 === 0 ? cluster.color : "#d8f3dc";
    if (cluster.kind === "wood") {
      ctx.beginPath();
      ctx.ellipse(px, py, 7, 12, seededUnit(`${cluster.id}-rot`, index) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.34;
      ctx.strokeStyle = "#101817";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py + 4);
      ctx.lineTo(px - 2, py + 15);
      ctx.stroke();
    } else if (cluster.kind === "witchglass") {
      const height = 10 + seededUnit(`${cluster.id}-h`, index) * 14;
      ctx.beginPath();
      ctx.moveTo(px, py - height);
      ctx.lineTo(px + 6, py + 4);
      ctx.lineTo(px - 5, py + 6);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(px, py, 7, 4, seededUnit(`${cluster.id}-rot`, index) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawTerrainLighting() {
  const lighting = currentTerrainLightingProfile();
  ctx.save();
  for (const feature of terrainFeaturesByKind(["lane"])) {
    const rect = {
      x: feature.x * TILE,
      y: feature.y * TILE,
      w: feature.w * TILE,
      h: feature.h * TILE
    };
    drawLaneGlow(rect, lighting);
  }
  for (const objective of visibleObjectives()) {
    const art = resolveObjectivePresentation(objective, data.objectives);
    const aura = objectiveAuraProfile(objectiveAuraState(objective, art));
    drawObjectiveSpotlight(objective.x * TILE, objective.y * TILE, aura, lighting);
  }
  drawTerrainVignette(lighting);
  ctx.restore();
}

function drawLaneGlow(rect, lighting) {
  if (lighting.laneGlow !== "moonlit_path") {
    return;
  }
  const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  gradient.addColorStop(0, "rgba(169, 240, 220, 0.02)");
  gradient.addColorStop(0.5, "rgba(216, 243, 220, 0.12)");
  gradient.addColorStop(1, "rgba(180, 140, 255, 0.04)");
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(rect.x - 12, rect.y + rect.h * 0.22);
  ctx.bezierCurveTo(rect.x + rect.w * 0.26, rect.y - rect.h * 0.08, rect.x + rect.w * 0.58, rect.y + rect.h * 0.16, rect.x + rect.w + 12, rect.y + rect.h * 0.08);
  ctx.lineTo(rect.x + rect.w + 12, rect.y + rect.h * 0.9);
  ctx.bezierCurveTo(rect.x + rect.w * 0.66, rect.y + rect.h * 1.1, rect.x + rect.w * 0.27, rect.y + rect.h * 0.78, rect.x - 12, rect.y + rect.h * 0.98);
  ctx.closePath();
  ctx.fill();
}

function drawObjectiveSpotlight(cx, cy, aura, lighting) {
  if (lighting.objectiveLightCount === 0) {
    return;
  }
  const glow = ctx.createRadialGradient(cx, cy, 6, cx, cy, aura.radius * 2.9);
  glow.addColorStop(0, aura.glowColor);
  glow.addColorStop(0.36, aura.ringColor);
  glow.addColorStop(1, "rgba(10, 16, 16, 0)");
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, aura.radius * 2.4, aura.radius * 1.35, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawTerrainVignette(lighting) {
  if (lighting.vignette !== "mist_edge") {
    return;
  }
  const gradient = ctx.createRadialGradient(
    WORLD_PIXEL_WIDTH * 0.5,
    WORLD_PIXEL_HEIGHT * 0.48,
    WORLD_PIXEL_WIDTH * 0.18,
    WORLD_PIXEL_WIDTH * 0.5,
    WORLD_PIXEL_HEIGHT * 0.48,
    WORLD_PIXEL_WIDTH * 0.68
  );
  gradient.addColorStop(0, "rgba(16, 22, 20, 0)");
  gradient.addColorStop(0.72, "rgba(16, 22, 20, 0.1)");
  gradient.addColorStop(1, "rgba(8, 12, 14, 0.28)");
  ctx.globalAlpha = 1;
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WORLD_PIXEL_WIDTH, WORLD_PIXEL_HEIGHT);
}

function drawMapHierarchy() {
  drawFactionGroundZone(0.3 * TILE, 5.8 * TILE, 10.4 * TILE, 8.8 * TILE, "#8fd8ba", "player");
  drawFactionGroundZone(22.2 * TILE, 5.7 * TILE, 9.9 * TILE, 8.9 * TILE, "#b48cff", "enemy");
  for (const building of state.buildings.filter((entry) => entry.buildingId === "seat_of_rule")) {
    drawBaseApron(building);
  }
  drawWorldEdgeTexture();
}

function drawFactionGroundZone(x, y, width, height, color, owner) {
  ctx.save();
  ctx.globalAlpha = owner === "player" ? 0.14 : 0.12;
  ctx.fillStyle = color;
  organicGroundPatchPath(x, y, width, height, owner === "enemy");
  ctx.fill();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  organicGroundPatchPath(x + 4, y + 4, width - 8, height - 8, owner === "enemy");
  ctx.stroke();
  ctx.restore();
}

function organicGroundPatchPath(x, y, width, height, flip = false) {
  const left = flip ? x + width * 0.02 : x + width * 0.05;
  const right = flip ? x + width * 0.95 : x + width * 0.98;
  ctx.beginPath();
  ctx.moveTo(left, y + height * 0.36);
  ctx.bezierCurveTo(x + width * 0.16, y + height * 0.02, x + width * 0.72, y + height * 0.08, right, y + height * 0.28);
  ctx.bezierCurveTo(x + width * 0.96, y + height * 0.48, x + width * 0.82, y + height * 0.92, x + width * 0.58, y + height * 0.94);
  ctx.bezierCurveTo(x + width * 0.34, y + height * 1.02, x + width * 0.08, y + height * 0.83, left, y + height * 0.6);
  ctx.closePath();
}

function drawBaseApron(building) {
  const color = building.owner === "player" ? "#a9f0dc" : "#b48cff";
  const x = (building.x - 0.7) * TILE;
  const y = (building.y + building.h - 0.45) * TILE;
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x + building.w * TILE * 0.68, y, building.w * TILE * 0.72, 17, -0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.36;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 3);
  ctx.bezierCurveTo(x + 42, y + 17, x + 88, y - 12, x + 128, y + 7);
  ctx.stroke();
  ctx.restore();
}

function drawWorldEdgeTexture() {
  ctx.save();
  ctx.strokeStyle = "rgba(198, 218, 196, 0.14)";
  ctx.lineWidth = 2;
  for (const y of [1.2, 18.1]) {
    ctx.beginPath();
    ctx.moveTo(0, y * TILE);
    ctx.bezierCurveTo(8 * TILE, (y - 0.35) * TILE, 15 * TILE, (y + 0.28) * TILE, 23 * TILE, y * TILE);
    ctx.bezierCurveTo(26 * TILE, (y - 0.22) * TILE, 29 * TILE, (y + 0.1) * TILE, WORLD_PIXEL_WIDTH, (y - 0.06) * TILE);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMapGrid() {
  const lighting = currentTerrainLightingProfile();
  const gridMajorAlpha = lighting.gridAlpha.major * 0.42;
  const gridMinorAlpha = lighting.gridAlpha.minor * 0.35;
  ctx.save();
  for (let x = 0; x <= world.width; x += 1) {
    ctx.strokeStyle = x % 4 === 0 ? `rgba(172, 203, 178, ${gridMajorAlpha})` : `rgba(137, 173, 154, ${gridMinorAlpha})`;
    ctx.lineWidth = x % 4 === 0 ? 1.1 : 0.7;
    ctx.beginPath();
    ctx.moveTo(x * TILE, 0);
    ctx.lineTo(x * TILE, world.height * TILE);
    ctx.stroke();
  }
  for (let y = 0; y <= world.height; y += 1) {
    ctx.strokeStyle = y % 4 === 0 ? `rgba(172, 203, 178, ${gridMajorAlpha})` : `rgba(137, 173, 154, ${gridMinorAlpha})`;
    ctx.lineWidth = y % 4 === 0 ? 1.1 : 0.7;
    ctx.beginPath();
    ctx.moveTo(0, y * TILE);
    ctx.lineTo(world.width * TILE, y * TILE);
    ctx.stroke();
  }
  ctx.restore();
}

function terrainFeaturesByKind(kinds) {
  const features = showcaseMap().terrainFeatures ?? [];
  return kinds.flatMap((kind) => features.filter((feature) => feature.kind === kind));
}

function drawTerrainFeature(feature) {
  const palette = TERRAIN_PALETTES[feature.palette] ?? TERRAIN_PALETTES.pressed_moss;
  const profile = terrainFeatureOrnamentProfile({ ...feature, accent: feature.palette });
  const rect = {
    x: feature.x * TILE,
    y: feature.y * TILE,
    w: feature.w * TILE,
    h: feature.h * TILE
  };
  ctx.save();
  if (feature.kind === "lane") {
    drawLane(rect, palette);
  } else if (feature.kind === "grove") {
    drawGrove(feature, rect, palette);
  } else if (feature.kind === "ruin") {
    drawRuin(rect, palette);
  } else if (feature.kind === "pool") {
    drawPool(rect, palette);
  } else if (feature.kind === "crystal") {
    drawCrystals(feature, rect, palette);
  } else if (feature.kind === "bramble") {
    drawBramble(feature, rect, palette);
  }
  drawTerrainFeatureOrnaments(feature, rect, palette, profile);
  ctx.restore();
}

function currentBackdropProfile() {
  return { biome: showcaseMap().biomeId ?? "grim_forest", time: "dusk", weather: "mist" };
}

function drawLane(rect, palette) {
  ctx.globalAlpha = 0.74;
  ctx.fillStyle = palette.fill;
  ctx.beginPath();
  ctx.moveTo(rect.x, rect.y + rect.h * 0.18);
  ctx.bezierCurveTo(rect.x + rect.w * 0.24, rect.y - rect.h * 0.04, rect.x + rect.w * 0.58, rect.y + rect.h * 0.18, rect.x + rect.w, rect.y + rect.h * 0.08);
  ctx.lineTo(rect.x + rect.w, rect.y + rect.h * 0.88);
  ctx.bezierCurveTo(rect.x + rect.w * 0.65, rect.y + rect.h * 1.08, rect.x + rect.w * 0.28, rect.y + rect.h * 0.76, rect.x, rect.y + rect.h * 0.96);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = palette.edge;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawGrove(feature, rect, palette) {
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = palette.fill;
  roundedPatch(rect.x, rect.y, rect.w, rect.h, 18);
  const count = Math.max(8, Math.round((rect.w * rect.h) / 9400));
  for (let index = 0; index < count; index += 1) {
    const px = rect.x + seededUnit(feature.id, index) * rect.w;
    const py = rect.y + seededUnit(feature.id, index + 31) * rect.h;
    const radius = 7 + seededUnit(feature.id, index + 67) * 10;
    ctx.fillStyle = index % 2 === 0 ? palette.edge : palette.accent;
    ctx.globalAlpha = index % 2 === 0 ? 0.55 : 0.24;
    ctx.beginPath();
    ctx.ellipse(px, py, radius * 1.15, radius, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#101817";
    ctx.globalAlpha = 0.42;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py + radius * 0.45);
    ctx.lineTo(px - radius * 0.2, py + radius * 1.05);
    ctx.stroke();
  }
}

function drawRuin(rect, palette) {
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = palette.fill;
  roundedPatch(rect.x, rect.y, rect.w, rect.h, 10);
  ctx.strokeStyle = palette.edge;
  ctx.lineWidth = 3;
  for (let index = 0; index < 5; index += 1) {
    const x = rect.x + rect.w * (0.13 + index * 0.17);
    const h = rect.h * (0.32 + (index % 3) * 0.13);
    ctx.fillStyle = index % 2 === 0 ? palette.edge : palette.accent;
    ctx.globalAlpha = index % 2 === 0 ? 0.54 : 0.36;
    ctx.fillRect(x, rect.y + rect.h - h, rect.w * 0.08, h);
  }
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(rect.x + rect.w * 0.5, rect.y + rect.h * 0.72, rect.w * 0.18, Math.PI, Math.PI * 2);
  ctx.stroke();
}

function drawPool(rect, palette) {
  const gradient = ctx.createRadialGradient(rect.x + rect.w * 0.5, rect.y + rect.h * 0.5, 4, rect.x + rect.w * 0.5, rect.y + rect.h * 0.5, Math.max(rect.w, rect.h) * 0.55);
  gradient.addColorStop(0, palette.accent);
  gradient.addColorStop(0.45, palette.fill);
  gradient.addColorStop(1, "rgba(34, 60, 66, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(rect.x + rect.w * 0.5, rect.y + rect.h * 0.5, rect.w * 0.48, rect.h * 0.44, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = palette.edge;
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawCrystals(feature, rect, palette) {
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = palette.fill;
  roundedPatch(rect.x, rect.y, rect.w, rect.h, 12);
  for (let index = 0; index < 7; index += 1) {
    const px = rect.x + seededUnit(feature.id, index) * rect.w;
    const py = rect.y + seededUnit(feature.id, index + 13) * rect.h;
    const height = 12 + seededUnit(feature.id, index + 29) * 18;
    ctx.fillStyle = index % 2 === 0 ? palette.accent : palette.edge;
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.moveTo(px, py - height);
    ctx.lineTo(px + 7, py);
    ctx.lineTo(px - 6, py + 4);
    ctx.closePath();
    ctx.fill();
  }
}

function drawBramble(feature, rect, palette) {
  ctx.strokeStyle = palette.edge;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.78;
  const strands = 10;
  for (let index = 0; index < strands; index += 1) {
    const y = rect.y + seededUnit(feature.id, index) * rect.h;
    ctx.beginPath();
    ctx.moveTo(rect.x, y);
    for (let step = 0; step <= 6; step += 1) {
      const x = rect.x + (rect.w / 6) * step;
      const offset = (seededUnit(feature.id, index * 11 + step) - 0.5) * rect.h * 0.8;
      ctx.lineTo(x, y + offset);
    }
    ctx.stroke();
  }
  ctx.fillStyle = palette.accent;
  ctx.globalAlpha = 0.4;
  for (let index = 0; index < 18; index += 1) {
    const px = rect.x + seededUnit(feature.id, index + 40) * rect.w;
    const py = rect.y + seededUnit(feature.id, index + 90) * rect.h;
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTerrainFeatureOrnaments(feature, rect, palette, profile) {
  const props = new Set(profile.props);
  if (props.has("wagon_ruts")) {
    drawWagonRuts(feature, rect, palette);
  }
  if (props.has("edge_stones") || props.has("bank_stones")) {
    drawFeatureStones(feature, rect, palette);
  }
  if (props.has("root_flares")) {
    drawRootFlares(feature, rect, palette);
  }
  if (props.has("thorn_blooms") || props.has("leaf_motes")) {
    drawTerrainMotes(feature, rect, palette);
  }
  if (props.has("crystal_shards") || props.has("glint_facets")) {
    drawCrystalOrnaments(feature, rect, palette);
  }
  if (props.has("fallen_arch") || props.has("moss_blocks") || props.has("crown_marks")) {
    drawRuinOrnaments(feature, rect, palette, props);
  }
  if (props.has("reed_edges") || props.has("silver_rings")) {
    drawPoolOrnaments(feature, rect, palette, props);
  }
}

function drawWagonRuts(feature, rect, palette) {
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 1.4;
  for (const lane of [0.34, 0.64]) {
    ctx.beginPath();
    ctx.moveTo(rect.x + rect.w * 0.03, rect.y + rect.h * lane);
    for (let step = 1; step <= 5; step += 1) {
      const x = rect.x + rect.w * (step / 5);
      const y = rect.y + rect.h * (lane + (seededUnit(feature.id, step + lane * 100) - 0.5) * 0.24);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawFeatureStones(feature, rect, palette) {
  ctx.save();
  const count = Math.max(6, Math.round(rect.w / 42));
  for (let index = 0; index < count; index += 1) {
    const topEdge = index % 2 === 0;
    const px = rect.x + seededUnit(`${feature.id}-stone-x`, index) * rect.w;
    const py = rect.y + (topEdge ? 0.18 : 0.82) * rect.h + (seededUnit(`${feature.id}-stone-y`, index) - 0.5) * rect.h * 0.18;
    ctx.globalAlpha = 0.34;
    ctx.fillStyle = index % 3 === 0 ? palette.accent : palette.edge;
    ctx.beginPath();
    ctx.ellipse(px, py, 3.8, 2.2, seededUnit(`${feature.id}-stone-r`, index), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawRootFlares(feature, rect, palette) {
  ctx.save();
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.26;
  const count = Math.max(5, Math.round((rect.w + rect.h) / 64));
  for (let index = 0; index < count; index += 1) {
    const px = rect.x + seededUnit(`${feature.id}-root-x`, index) * rect.w;
    const py = rect.y + seededUnit(`${feature.id}-root-y`, index) * rect.h;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.quadraticCurveTo(
      px + (seededUnit(`${feature.id}-root-cx`, index) - 0.5) * 32,
      py + 8 + seededUnit(`${feature.id}-root-cy`, index) * 22,
      px + (seededUnit(`${feature.id}-root-ex`, index) - 0.5) * 58,
      py + 18 + seededUnit(`${feature.id}-root-ey`, index) * 26
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawTerrainMotes(feature, rect, palette) {
  ctx.save();
  const count = Math.max(7, Math.round((rect.w * rect.h) / 6800));
  for (let index = 0; index < count; index += 1) {
    const px = rect.x + seededUnit(`${feature.id}-mote-x`, index) * rect.w;
    const py = rect.y + seededUnit(`${feature.id}-mote-y`, index) * rect.h;
    ctx.globalAlpha = index % 2 === 0 ? 0.28 : 0.18;
    ctx.fillStyle = index % 2 === 0 ? palette.accent : "#d8f3dc";
    ctx.beginPath();
    ctx.arc(px, py, index % 2 === 0 ? 2.2 : 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCrystalOrnaments(feature, rect, palette) {
  ctx.save();
  ctx.globalAlpha = 0.44;
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 1.3;
  for (let index = 0; index < 5; index += 1) {
    const px = rect.x + seededUnit(`${feature.id}-facet-x`, index) * rect.w;
    const py = rect.y + seededUnit(`${feature.id}-facet-y`, index) * rect.h;
    ctx.beginPath();
    ctx.moveTo(px - 8, py + 4);
    ctx.lineTo(px + 6, py - 8);
    ctx.lineTo(px + 13, py + 3);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRuinOrnaments(feature, rect, palette, props) {
  ctx.save();
  if (props.has("fallen_arch")) {
    ctx.globalAlpha = 0.46;
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(rect.x + rect.w * 0.52, rect.y + rect.h * 0.66, rect.w * 0.26, Math.PI * 1.05, Math.PI * 1.92);
    ctx.stroke();
  }
  if (props.has("moss_blocks")) {
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#9fcfba";
    for (let index = 0; index < 4; index += 1) {
      ctx.fillRect(rect.x + rect.w * (0.18 + index * 0.16), rect.y + rect.h * 0.74, rect.w * 0.06, 5);
    }
  }
  if (props.has("crown_marks")) {
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 1.5;
    const x = rect.x + rect.w * 0.5;
    const y = rect.y + rect.h * 0.36;
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 6);
    ctx.lineTo(x - 4, y - 4);
    ctx.lineTo(x, y + 4);
    ctx.lineTo(x + 5, y - 5);
    ctx.lineTo(x + 9, y + 6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPoolOrnaments(feature, rect, palette, props) {
  ctx.save();
  if (props.has("silver_rings")) {
    ctx.globalAlpha = 0.36;
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 1.4;
    for (const scale of [0.34, 0.52, 0.68]) {
      ctx.beginPath();
      ctx.ellipse(rect.x + rect.w * 0.5, rect.y + rect.h * 0.5, rect.w * scale, rect.h * scale * 0.72, -0.15, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  if (props.has("reed_edges")) {
    ctx.globalAlpha = 0.38;
    ctx.strokeStyle = palette.edge;
    ctx.lineWidth = 1.2;
    for (let index = 0; index < 8; index += 1) {
      const px = rect.x + seededUnit(`${feature.id}-reed-x`, index) * rect.w;
      const py = rect.y + (index % 2 === 0 ? rect.h * 0.18 : rect.h * 0.82);
      ctx.beginPath();
      ctx.moveTo(px, py + 8);
      ctx.lineTo(px + (seededUnit(`${feature.id}-reed-lean`, index) - 0.5) * 8, py - 8);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function roundedPatch(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function drawObjectives() {
  for (const objective of visibleObjectives()) {
    drawObjectiveSilhouette(objective, resolveObjectivePresentation(objective, data.objectives));
  }
}

function drawWorldStateReadability() {
  drawObjectiveWorldStateGlyphs();
  drawSquadOrderWorldMarkers();
  drawFormationAnchorMarkers();
  drawBattlefieldIntentLanes();
}

function drawObjectiveWorldStateGlyphs() {
  for (const objective of visibleObjectives()) {
    drawObjectiveStateGlyph(objective, objectiveWorldStateProfile(objective));
  }
}

function drawObjectiveStateGlyph(objective, profile) {
  const cx = objective.x * TILE;
  const cy = objective.y * TILE;
  const ownerColor = profile.ownerKind === "player" ? "#9de2c9" : profile.ownerKind === "enemy" ? "#b48cff" : "#d3dccf";
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = ownerColor;
  ctx.fillStyle = ownerColor;
  ctx.globalAlpha = profile.priority >= 3 ? 0.86 : 0.62;

  if (profile.glyphs.includes("crescent_pool")) {
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 27, 8, Math.PI * 0.56, Math.PI * 1.72);
    ctx.arc(cx + 1, cy - 27, 6, Math.PI * 1.72, Math.PI * 0.56, true);
    ctx.stroke();
    ctx.globalAlpha *= 0.7;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 25, 18, 5, -0.18, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (profile.glyphs.includes("shard_cluster")) {
    for (const offset of [-10, 0, 10]) {
      ctx.beginPath();
      ctx.moveTo(cx + offset, cy - 35);
      ctx.lineTo(cx + offset + 6, cy - 18);
      ctx.lineTo(cx + offset - 5, cy - 16);
      ctx.closePath();
      ctx.stroke();
    }
  }
  if (profile.glyphs.includes("watcher_eye")) {
    ctx.beginPath();
    ctx.ellipse(cx, cy - 28, 15, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy - 28, 3.8, 0, Math.PI * 2);
    ctx.fill();
  }
  if (profile.glyphs.includes("sight_fan")) {
    ctx.globalAlpha *= 0.45;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 16);
    ctx.lineTo(cx - 24, cy + 8);
    ctx.moveTo(cx, cy - 16);
    ctx.lineTo(cx, cy + 12);
    ctx.moveTo(cx, cy - 16);
    ctx.lineTo(cx + 24, cy + 8);
    ctx.stroke();
  }
  if (profile.glyphs.includes("owner_banner")) {
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = ownerColor;
    ctx.fillRect(cx + 21, cy - 34, 4, 20);
    ctx.beginPath();
    ctx.moveTo(cx + 25, cy - 34);
    ctx.lineTo(cx + 42, cy - 28);
    ctx.lineTo(cx + 25, cy - 22);
    ctx.closePath();
    ctx.fill();
  }
  if (profile.stateGlyphs.includes("contested")) {
    ctx.globalAlpha = 0.92;
    ctx.strokeStyle = "#f2c46d";
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, 43, 27, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (profile.stateGlyphs.includes("capture_progress")) {
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = "#d8f3dc";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + side * 32, cy - 12);
      ctx.lineTo(cx + side * 42, cy - 12);
      ctx.lineTo(cx + side * 42, cy + 12);
      ctx.lineTo(cx + side * 32, cy + 12);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawSquadOrderWorldMarkers() {
  const selectedSquadIds = new Set(state.selectedSquadIds);
  const livingSquads = state.squads.filter((entry) => entry.hp > 0);
  for (const squad of state.squads) {
    if (squad.hp <= 0) {
      continue;
    }
    const profile = squadOrderWorldMarkerProfile(squad, { selectedSquadIds });
    if (!profile.visible || profile.priority < 2) {
      continue;
    }
    const target = squadWorldOrderTarget(squad, profile);
    if (!target) {
      continue;
    }
    const budget = squadReadabilityBudget(squad, { squads: livingSquads, selectedSquadIds });
    const renderProfile = { ...profile, opacityScale: budget.orderMarkerAlpha };
    drawWorldOrderPath({ x: squad.x * TILE, y: squad.y * TILE }, { x: target.x * TILE, y: target.y * TILE }, renderProfile);
    drawWorldOrderGlyph(target.x * TILE, target.y * TILE, renderProfile);
  }
}

function drawFormationAnchorMarkers() {
  const selectedSquadIds = new Set(state.selectedSquadIds);
  for (const squad of state.squads) {
    if (squad.hp <= 0 || !selectedSquadIds.has(squad.id) || !squad.formationAnchorTarget) {
      continue;
    }
    drawFormationAnchorMarker(squad.formationAnchorTarget, squad.formationAnchorKind);
  }
}

function drawFormationAnchorMarker(target, anchorKind = "rank_anchor") {
  const x = target.x * TILE;
  const y = target.y * TILE;
  const color = anchorKind === "vanguard_anchor" ? "#f2c46d"
    : anchorKind === "wing_anchor" ? "#9de2c9"
      : anchorKind === "rear_guard_anchor" ? "#c9c1d9"
        : "#d8f3dc";
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.86;
  ctx.beginPath();
  ctx.moveTo(x - 5, y);
  ctx.lineTo(x + 5, y);
  ctx.moveTo(x, y - 5);
  ctx.lineTo(x, y + 5);
  ctx.stroke();
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBattlefieldIntentLanes() {
  const selectedSquadIds = new Set(state.selectedSquadIds);
  for (const squad of state.squads) {
    if (squad.hp <= 0) {
      continue;
    }
    const profile = squadIntentLaneProfile(squad, { selectedSquadIds, playerId: "player" });
    if (!profile.visible || profile.priority < 2) {
      continue;
    }
    if (!shouldDrawBattlefieldIntentLane(profile)) {
      continue;
    }
    const target = battlefieldIntentTarget(squad, profile);
    if (!target) {
      continue;
    }
    drawBattlefieldIntentPath(
      { x: squad.x * TILE, y: squad.y * TILE },
      { x: target.x * TILE, y: target.y * TILE },
      profile
    );
    drawBattlefieldIntentGlyph(target.x * TILE, target.y * TILE, profile);
  }
}

function shouldDrawBattlefieldIntentLane(profile) {
  return profile.kind === "enemy_target";
}

function battlefieldIntentTarget(squad, profile) {
  if (profile.kind === "retreat") {
    return squad.rallyPoint ?? squad.target;
  }
  if (profile.kind === "objective_contest") {
    return nearestObjectiveToSquad(squad);
  }
  return squad.target ?? null;
}

function nearestObjectiveToSquad(squad) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (const objective of visibleObjectives()) {
    const distance = Math.hypot(squad.x - objective.x, squad.y - objective.y);
    if (distance < nearestDistance) {
      nearest = objective;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function drawBattlefieldIntentPath(start, target, profile) {
  const color = battlefieldIntentColor(profile);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = profile.kind === "enemy_target" ? 2.2 : 1.5;
  ctx.globalAlpha = profile.kind === "selected_attack" ? 0.34 : profile.kind === "retreat" ? 0.46 : 0.4;
  ctx.setLineDash(profile.kind === "retreat" ? [12, 7] : profile.kind === "enemy_target" ? [3, 7] : [6, 6]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  const midX = (start.x + target.x) / 2;
  const midY = (start.y + target.y) / 2 - (profile.kind === "enemy_target" ? 15 : 9);
  ctx.quadraticCurveTo(midX, midY, target.x, target.y);
  ctx.stroke();
  ctx.setLineDash([]);

  const angle = Math.atan2(target.y - start.y, target.x - start.x);
  const chevronCount = profile.kind === "enemy_target" ? 3 : 2;
  for (let index = 1; index <= chevronCount; index += 1) {
    const t = index / (chevronCount + 1);
    const px = start.x + (target.x - start.x) * t;
    const py = start.y + (target.y - start.y) * t - (profile.kind === "enemy_target" ? 8 : 4);
    drawOrderChevron(px, py, angle, color, profile.kind === "enemy_target" ? 0.52 : 0.42);
  }
  ctx.restore();
}

function drawBattlefieldIntentGlyph(x, y, profile) {
  const color = battlefieldIntentColor(profile);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = profile.kind === "enemy_target" ? 0.68 : 0.52;

  if (profile.glyph === "threat_lance") {
    ctx.beginPath();
    ctx.moveTo(x, y - 18);
    ctx.lineTo(x + 12, y + 10);
    ctx.lineTo(x, y + 5);
    ctx.lineTo(x - 12, y + 10);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - 18);
    ctx.lineTo(x, y + 19);
    ctx.stroke();
  } else if (profile.glyph === "safe_fallback") {
    ctx.beginPath();
    ctx.moveTo(x + 19, y);
    ctx.lineTo(x - 15, y);
    ctx.moveTo(x - 15, y);
    ctx.lineTo(x - 3, y - 11);
    ctx.moveTo(x - 15, y);
    ctx.lineTo(x - 3, y + 11);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, y, 24, 13, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (profile.glyph === "capture_tether") {
    ctx.beginPath();
    ctx.ellipse(x, y, 18, 11, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 24, y - 12);
    ctx.lineTo(x - 12, y - 12);
    ctx.moveTo(x + 12, y + 12);
    ctx.lineTo(x + 24, y + 12);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - 16, y);
    ctx.lineTo(x + 16, y);
    ctx.moveTo(x + 16, y);
    ctx.lineTo(x + 5, y - 10);
    ctx.moveTo(x + 16, y);
    ctx.lineTo(x + 5, y + 10);
    ctx.stroke();
  }
  ctx.restore();
}

function battlefieldIntentColor(profile) {
  if (profile.kind === "enemy_target") {
    return "#f5a36f";
  }
  if (profile.kind === "retreat") {
    return profile.tone === "player_recovery" ? "#b7d4ff" : "#d6a6ff";
  }
  if (profile.kind === "objective_contest") {
    return "#9de2c9";
  }
  return "#f2c46d";
}

function squadWorldOrderTarget(squad, profile) {
  if (profile.orderKind === "retreat") {
    return squad.rallyPoint ?? squad.target;
  }
  if (profile.orderKind === "hold") {
    return { x: squad.x, y: squad.y };
  }
  return squad.target ?? null;
}

function drawWorldOrderPath(start, target, profile) {
  const color = worldOrderColor(profile);
  const opacityScale = profile.opacityScale ?? 1;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = profile.selected ? 2.6 : 1.8;
  ctx.globalAlpha = (profile.selected ? 0.78 : 0.46) * opacityScale;
  ctx.setLineDash(profile.pathStyle === "retreat_lane" ? [8, 7] : profile.pathStyle === "capture_line" ? [3, 6] : []);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();
  ctx.setLineDash([]);

  const angle = Math.atan2(target.y - start.y, target.x - start.x);
  const distance = Math.hypot(target.x - start.x, target.y - start.y);
  const chevrons = Math.max(1, Math.min(4, Math.floor(distance / 120)));
  for (let index = 1; index <= chevrons; index += 1) {
    const t = index / (chevrons + 1);
    const x = start.x + (target.x - start.x) * t;
    const y = start.y + (target.y - start.y) * t;
    drawOrderChevron(x, y, angle, color, (profile.selected ? 0.72 : 0.46) * opacityScale);
  }
  ctx.restore();
}

function drawOrderChevron(x, y, angle, color, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, -6);
  ctx.lineTo(0, 0);
  ctx.lineTo(-8, 6);
  ctx.stroke();
  ctx.restore();
}

function drawWorldOrderGlyph(x, y, profile) {
  const color = worldOrderColor(profile);
  const opacityScale = profile.opacityScale ?? 1;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = profile.selected ? 3 : 2;
  ctx.globalAlpha = (profile.selected ? 0.88 : 0.62) * opacityScale;

  if (profile.glyphs.includes("attack_crosshair")) {
    ctx.beginPath();
    ctx.arc(x, y, 19, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 25, y);
    ctx.lineTo(x - 9, y);
    ctx.moveTo(x + 9, y);
    ctx.lineTo(x + 25, y);
    ctx.moveTo(x, y - 25);
    ctx.lineTo(x, y - 9);
    ctx.moveTo(x, y + 9);
    ctx.lineTo(x, y + 25);
    ctx.stroke();
  } else if (profile.glyphs.includes("capture_brackets")) {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + side * 18, y - 19);
      ctx.lineTo(x + side * 30, y - 19);
      ctx.lineTo(x + side * 30, y + 19);
      ctx.lineTo(x + side * 18, y + 19);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(x, y, 22, 13, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (profile.glyphs.includes("retreat_arrow")) {
    ctx.beginPath();
    ctx.moveTo(x - 24, y);
    ctx.lineTo(x + 16, y);
    ctx.moveTo(x - 24, y);
    ctx.lineTo(x - 10, y - 12);
    ctx.moveTo(x - 24, y);
    ctx.lineTo(x - 10, y + 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, y, 26, 15, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (profile.glyphs.includes("move_pips")) {
    ctx.beginPath();
    ctx.ellipse(x, y, 20, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (const offset of [-9, 0, 9]) {
      ctx.beginPath();
      ctx.arc(x + offset, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (profile.glyphs.includes("hold_ring")) {
    ctx.beginPath();
    ctx.ellipse(x, y, 18, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 13, y);
    ctx.lineTo(x + 13, y);
    ctx.moveTo(x, y - 13);
    ctx.lineTo(x, y + 13);
    ctx.stroke();
  }
  ctx.restore();
}

function worldOrderColor(profile) {
  if (profile.markerKind === "attack_target") {
    return "#f2c46d";
  }
  if (profile.markerKind === "capture_anchor") {
    return "#9de2c9";
  }
  if (profile.markerKind === "retreat_destination") {
    return "#f09a9a";
  }
  if (profile.markerKind === "move_destination") {
    return "#b7d4ff";
  }
  return "#d8f3dc";
}

function visibleObjectives() {
  return state.objectives.length ? state.objectives : [
    { id: "moon_pool", x: 15.5, y: 6, owner: null, progress: { player: 0, enemy: 0 } },
    { id: "witchglass_shard", x: 16, y: 13, owner: null, progress: { player: 0, enemy: 0 } },
    { id: "watcher_ruin", x: 15, y: 10, owner: null, progress: { player: 0, enemy: 0 } }
  ];
}

function drawObjectiveSilhouette(objective, art) {
  const cx = objective.x * TILE;
  const cy = objective.y * TILE;
  const aura = objectiveAuraProfile(objectiveAuraState(objective, art));
  const sprite = alphaObjectiveSprite(objective);
  ctx.save();
  ctx.fillStyle = art.palette.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 7, 30, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  if (drawAlphaArtSprite(ctx, sprite, cx, cy + 18, {
    alpha: objective.owner ? 1 : 0.82
  })) {
    drawObjectiveDressing(objective, art, aura, cx, cy);
    drawEntityEmblemBadge(cx, cy, 11, art);
    ctx.restore();
    return;
  }
  ctx.globalAlpha = objective.owner ? 0.78 : 0.56;
  ctx.strokeStyle = art.palette.stroke;
  ctx.fillStyle = objective.owner ? art.palette.fill : "#69708a";
  ctx.lineWidth = objective.owner ? 4 : 2;
  drawObjectiveDressing(objective, art, aura, cx, cy);
  if (art.silhouette === "pool") {
    ctx.beginPath();
    ctx.ellipse(cx, cy, 25, 18, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = art.palette.accent;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy - 3, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (art.silhouette === "crystal") {
    drawCrystal(cx, cy + 12, 22, art.palette.accent, art.palette.stroke);
    drawCrystal(cx - 13, cy + 8, 14, art.palette.fill, art.palette.stroke);
    drawCrystal(cx + 13, cy + 9, 14, art.palette.fill, art.palette.stroke);
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = art.palette.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 13, cy + 7);
    ctx.lineTo(cx - 6, cy - 9);
    ctx.lineTo(cx + 3, cy + 7);
    ctx.lineTo(cx + 13, cy - 10);
    ctx.stroke();
  }
  drawObjectiveDepthFidelityMarks(objective, art, cx, cy, objectiveDepthFidelityProfile({
    ...objective,
    mapPresentation: art
  }));
  drawObjectiveArtFidelityMarks(objective, art, aura, cx, cy);
  drawObjectiveFocalAnatomyMarks(objective, art, aura, cx, cy);
  drawEntityEmblemBadge(cx, cy, 11, art);
  ctx.restore();
}

function drawObjectiveDepthFidelityMarks(objective, art, cx, cy, profile) {
  if (!profile.depthReady) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = objective.owner ? 0.38 : 0.26;
  ctx.fillStyle = "rgba(5, 8, 11, 0.82)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 15, 36, 13, -0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.34;
  ctx.strokeStyle = art.palette.stroke;
  ctx.fillStyle = art.palette.stroke;
  ctx.lineWidth = 2;
  if (profile.depthKind === "faceted_vertical_depth") {
    for (const offset of [-13, 0, 13]) {
      ctx.beginPath();
      ctx.moveTo(cx + offset, cy - 28);
      ctx.lineTo(cx + offset + 9, cy + 16);
      ctx.lineTo(cx + offset - 5, cy + 22);
      ctx.stroke();
    }
  } else if (profile.depthKind === "basin_reflection_depth") {
    for (const radius of [19, 28, 37]) {
      ctx.beginPath();
      ctx.ellipse(cx, cy + 8, radius, radius * 0.24, -0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy + 22);
    ctx.lineTo(cx - 18, cy - 12);
    ctx.moveTo(cx + 24, cy + 22);
    ctx.lineTo(cx + 18, cy - 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 25, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  }

  ctx.globalAlpha = profile.stateLayer === "capture_wake_depth" ? 0.58 : 0.38;
  ctx.strokeStyle = art.palette.accent;
  ctx.lineWidth = 1.55;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 9, 32, 11, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawObjectiveArtFidelityMarks(objective, art, aura, cx, cy) {
  const profile = objectiveArtFidelityProfile(objective, {
    map: showcaseMap(),
    art,
    objectiveDefinition: data.objectives.get(objective.id),
    objectiveDefinitions: data.objectives
  });
  ctx.save();
  ctx.strokeStyle = art.palette.accent;
  ctx.fillStyle = art.palette.accent;
  ctx.lineWidth = 2.1;
  ctx.globalAlpha = objective.owner ? 0.86 : 0.68;

  if (profile.focalShape === "low_moon_basin_reflection") {
    ctx.globalAlpha = 0.5;
    for (const [offset, width] of [[-11, 19], [0, 27], [12, 17]]) {
      ctx.beginPath();
      ctx.ellipse(cx + offset, cy + 4, width, 4.2, -0.22, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.78;
    ctx.beginPath();
    ctx.arc(cx - 14, cy - 18, 10, Math.PI * 0.5, Math.PI * 1.73);
    ctx.arc(cx - 7, cy - 18, 7, Math.PI * 1.73, Math.PI * 0.5, true);
    ctx.stroke();
    ctx.globalAlpha = 0.55;
    for (const offset of [-24, 24]) {
      ctx.beginPath();
      ctx.moveTo(cx + offset, cy + 3);
      ctx.quadraticCurveTo(cx + offset * 0.72, cy + 13, cx + offset * 0.46, cy + 5);
      ctx.stroke();
    }
  } else if (profile.focalShape === "faceted_witchglass_spire") {
    ctx.globalAlpha = 0.74;
    for (const [offset, height] of [[-18, 24], [0, 34], [18, 22]]) {
      ctx.beginPath();
      ctx.moveTo(cx + offset, cy + 14 - height);
      ctx.lineTo(cx + offset - 8, cy + 14);
      ctx.lineTo(cx + offset, cy + 20);
      ctx.lineTo(cx + offset + 8, cy + 14);
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 0.34;
      ctx.beginPath();
      ctx.moveTo(cx + offset, cy + 14 - height);
      ctx.lineTo(cx + offset, cy + 20);
      ctx.stroke();
      ctx.globalAlpha = 0.74;
    }
    ctx.globalAlpha = 0.48;
    for (const angle of [-0.7, -0.25, 0.34, 0.82]) {
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 22, cy + Math.sin(angle) * 10);
      ctx.lineTo(cx + Math.cos(angle) * 38, cy + Math.sin(angle) * 19);
      ctx.stroke();
    }
  } else if (profile.focalShape === "arched_watcher_eye") {
    ctx.globalAlpha = 0.76;
    for (const offset of [-17, 17]) {
      ctx.beginPath();
      ctx.moveTo(cx + offset, cy + 18);
      ctx.lineTo(cx + offset, cy - 18);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 24, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy - 12, 15, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy - 12, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.32;
    for (const offset of [-24, 0, 24]) {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 4);
      ctx.lineTo(cx + offset, cy + 22);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 0.42;
  ctx.strokeStyle = aura.ringColor;
  ctx.lineWidth = 1.5;
  for (const index of [0, 1, 2]) {
    const angle = index * Math.PI * 2 / 3 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * aura.radius * 1.52, cy + 2 + Math.sin(angle) * aura.radius * 0.92);
    ctx.lineTo(cx + Math.cos(angle) * aura.radius * 1.72, cy + 2 + Math.sin(angle) * aura.radius * 1.04);
    ctx.stroke();
  }

  ctx.restore();
}

function drawObjectiveFocalAnatomyMarks(objective, art, aura, cx, cy) {
  const profile = objectiveFocalAnatomyProfile({
    id: objective.id,
    mapPresentation: art
  });
  if (!profile.focalPolishReady) {
    return;
  }
  ctx.save();
  ctx.strokeStyle = art.palette.stroke;
  ctx.fillStyle = art.palette.accent;
  ctx.lineWidth = 1.85;
  ctx.globalAlpha = objective.owner ? 0.62 : 0.48;

  if (profile.focalFrameKind === "basin_reflection_frame") {
    for (const radius of [22, 30, 38]) {
      ctx.beginPath();
      ctx.ellipse(cx, cy + 5, radius, radius * 0.28, -0.18, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy - 2);
    ctx.quadraticCurveTo(cx, cy + 12, cx + 20, cy - 2);
    ctx.stroke();
  } else if (profile.focalFrameKind === "faceted_spire_frame") {
    for (const [offset, height] of [[-16, 26], [0, 40], [16, 28]]) {
      ctx.beginPath();
      ctx.moveTo(cx + offset, cy - height);
      ctx.lineTo(cx + offset - 7, cy + 15);
      ctx.lineTo(cx + offset, cy + 23);
      ctx.lineTo(cx + offset + 7, cy + 15);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + offset, cy - height);
      ctx.lineTo(cx + offset, cy + 23);
      ctx.stroke();
    }
  } else if (profile.focalFrameKind === "watcher_arch_frame") {
    for (const offset of [-19, 19]) {
      ctx.beginPath();
      ctx.moveTo(cx + offset, cy + 20);
      ctx.lineTo(cx + offset, cy - 20);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy - 12, 26, Math.PI * 1.04, Math.PI * 1.96);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy - 13, 18, 7.2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy - 13, 4.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha *= 0.62;
  ctx.strokeStyle = aura.ringColor;
  for (const [index, glyph] of profile.anatomyGlyphs.entries()) {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / profile.anatomyGlyphs.length;
    const outer = aura.radius * 1.58;
    const inner = outer - (glyph.includes("arch") || glyph.includes("spire") ? 9 : 5);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + 2 + Math.sin(angle) * inner * 0.64);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + 2 + Math.sin(angle) * outer * 0.64);
    ctx.stroke();
  }
  ctx.restore();
}

function drawObjectiveDressing(objective, art, aura, cx, cy) {
  ctx.save();
  const progress = objectiveProgressRatio(objective);
  const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, aura.radius * 1.7);
  glow.addColorStop(0, aura.glowColor);
  glow.addColorStop(0.6, art.palette.fill);
  glow.addColorStop(1, "rgba(16, 22, 20, 0)");
  ctx.globalAlpha = objective.owner ? 0.16 : progress > 0 ? 0.12 : 0.07;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, aura.radius * 1.68, aura.radius * 1.04, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = objective.owner ? 0.62 : 0.34;
  ctx.strokeStyle = aura.ringColor;
  ctx.lineWidth = objective.owner ? 2.4 : 1.4;
  ctx.setLineDash(objective.owner ? [] : [5, 6]);
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, aura.radius * 1.45, aura.radius * 0.92, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  drawObjectiveCaptureTicks(cx, cy, aura, progress);
  if (aura.pulse === "urgent") {
    drawObjectiveContestedSparks(cx, cy, aura);
  }
  drawObjectiveLandmarkSignature(cx, cy, objectiveLandmarkProfile(art), art);
  drawObjectiveCompositionFrame(objective, art, cx, cy);

  const count = 4 + Math.floor(seededUnit(`${objective.id}-detail-count`) * 2);
  for (let index = 0; index < count; index += 1) {
    const angle = index * Math.PI * 2 / count + seededUnit(`${objective.id}-detail-angle-${index}`) * 0.38;
    const radius = 31 + seededUnit(`${objective.id}-detail-radius-${index}`) * 16;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius * 0.58 + 3;
    ctx.globalAlpha = 0.38;
    ctx.fillStyle = index % 2 === 0 ? art.palette.accent : art.palette.stroke;
    if (art.silhouette === "crystal") {
      drawCrystal(px, py + 5, 9, art.palette.accent, art.palette.stroke);
    } else {
      ctx.beginPath();
      ctx.ellipse(px, py, 4.5, 2.8, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawObjectiveCompositionFrame(objective, art, cx, cy) {
  const profile = objectiveCompositionProfile(objective, {
    terrainFeatures: showcaseMap().terrainFeatures ?? [],
    objectiveDefinition: data.objectives.get(objective.id)
  });

  if (!profile.anchored && profile.laneApproaches === 0) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = art.palette.accent;
  ctx.fillStyle = art.palette.accent;
  ctx.lineWidth = 1.6;
  ctx.globalAlpha = profile.anchored ? 0.42 : 0.2;

  if (profile.anchored) {
    for (const angle of [-0.82, 0.82, Math.PI - 0.82, Math.PI + 0.82]) {
      const x = cx + Math.cos(angle) * 45;
      const y = cy + 2 + Math.sin(angle) * 26;
      ctx.beginPath();
      ctx.arc(x, y, 7, angle - 0.75, angle + 0.75);
      ctx.stroke();
    }
  }

  if (profile.laneApproaches > 0) {
    ctx.setLineDash([4, 7]);
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.moveTo(cx - 42, cy + 31);
    ctx.quadraticCurveTo(cx, cy + 43, cx + 42, cy + 31);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.44;
    for (const offset of [-20, 0, 20]) {
      ctx.beginPath();
      ctx.moveTo(cx + offset - 5, cy + 34);
      ctx.lineTo(cx + offset, cy + 39);
      ctx.lineTo(cx + offset + 5, cy + 34);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawObjectiveLandmarkSignature(cx, cy, profile, art) {
  ctx.save();
  ctx.strokeStyle = art.palette.accent;
  ctx.fillStyle = art.palette.accent;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.62;

  if (profile.props.includes("water_ripples")) {
    for (const radius of [13, 21, 29]) {
      ctx.beginPath();
      ctx.ellipse(cx, cy + 1, radius, radius * 0.34, -0.18, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  if (profile.props.includes("crescent_basin")) {
    ctx.beginPath();
    ctx.arc(cx - 9, cy - 15, 9, Math.PI * 0.52, Math.PI * 1.76);
    ctx.arc(cx - 3, cy - 15, 7, Math.PI * 1.76, Math.PI * 0.52, true);
    ctx.stroke();
  }
  if (profile.props.includes("moon_reflection")) {
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.ellipse(cx + 9, cy - 2, 7, 3, -0.25, 0, Math.PI * 2);
    ctx.fill();
  }
  if (profile.props.includes("crystal_cluster")) {
    for (const [offset, height] of [[-18, 14], [0, 22], [17, 13]]) {
      drawCrystal(cx + offset, cy + 12, height, art.palette.accent, art.palette.stroke);
    }
  }
  if (profile.props.includes("watcher_eye")) {
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 18, 16, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy - 18, 3.8, 0, Math.PI * 2);
    ctx.fill();
  }
  if (profile.props.includes("sight_fan")) {
    ctx.globalAlpha = 0.36;
    for (const offset of [-22, 0, 22]) {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx + offset, cy + 18);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawObjectiveCaptureTicks(cx, cy, aura, progress) {
  const ticks = 12;
  ctx.save();
  ctx.strokeStyle = aura.ringColor;
  ctx.lineWidth = 1.6;
  for (let index = 0; index < ticks; index += 1) {
    const angle = (Math.PI * 2 * index) / ticks - Math.PI / 2;
    const active = index / ticks <= progress || aura.pulse === "urgent";
    const inner = aura.radius * 1.18;
    const outer = aura.radius * 1.34;
    ctx.globalAlpha = active ? 0.58 : 0.17;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + 2 + Math.sin(angle) * inner * 0.66);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + 2 + Math.sin(angle) * outer * 0.66);
    ctx.stroke();
  }
  ctx.restore();
}

function drawObjectiveContestedSparks(cx, cy, aura) {
  ctx.save();
  ctx.strokeStyle = aura.ringColor;
  ctx.lineWidth = 1.4;
  ctx.globalAlpha = 0.54;
  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI * 2 * index) / 6 + 0.25;
    const x = cx + Math.cos(angle) * aura.radius * 1.5;
    const y = cy + Math.sin(angle) * aura.radius * 0.94;
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x + 5, y);
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x, y + 5);
    ctx.stroke();
  }
  ctx.restore();
}

function objectiveAuraState(objective, art) {
  return {
    owner: objective.owner,
    accent: art.emblem ?? art.accent,
    progress: objective.owner ? 1 : objectiveProgressRatio(objective),
    contested: isObjectiveContested(objective)
  };
}

function objectiveProgressRatio(objective) {
  const definition = data.objectives.get(objective.id);
  const captureSeconds = Math.max(1, definition?.captureSeconds ?? 1);
  const playerProgress = objective.progress?.player ?? 0;
  const enemyProgress = objective.progress?.enemy ?? 0;
  return Math.max(0, Math.min(1, Math.max(playerProgress, enemyProgress) / captureSeconds));
}

function isObjectiveContested(objective) {
  const nearbyPlayers = new Set();
  for (const squad of state.squads) {
    if (squad.hp <= 0 || squad.owner === "ally") {
      continue;
    }
    if (Math.hypot(squad.x - objective.x, squad.y - objective.y) <= 1.45) {
      nearbyPlayers.add(squad.owner);
    }
  }
  return nearbyPlayers.has("player") && nearbyPlayers.has("enemy");
}

function currentTerrainPolishSummary() {
  return summarizeTerrainPolish({
    features: showcaseMap().terrainFeatures ?? [],
    buildings: state.buildings,
    buildingDefinitions: data.buildings,
    objectives: visibleObjectives().map((objective) => (
      objectiveAuraState(objective, resolveObjectivePresentation(objective, data.objectives))
    )),
    backdrop: currentBackdropProfile()
  });
}

function currentMapCompositionSummary() {
  return summarizeMapComposition({
    map: showcaseMap(),
    objectives: visibleObjectives(),
    objectiveDefinitions: data.objectives
  });
}

function currentFormationLocalAvoidanceSummary() {
  return summarizeFormationLocalAvoidance({
    squads: state.squads,
    selectedSquadIds: state.selectedSquadIds,
    proofEvents: {
      ...state.formationProof,
      supportedFormations: formationSupportProfiles()
    }
  });
}

function currentTerrainLightingProfile() {
  return terrainLightingProfile({
    features: showcaseMap().terrainFeatures ?? [],
    objectives: visibleObjectives().map((objective) => (
      objectiveAuraState(objective, resolveObjectivePresentation(objective, data.objectives))
    )),
    backdrop: currentBackdropProfile()
  });
}

function factionReadabilityContext() {
  return { playerFaction: state.playerFaction, enemyFaction: state.enemyFaction };
}

function currentFactionReadabilitySummary() {
  const selected = new Set(state.selectedSquadIds);
  return summarizeFactionReadability({
    ...factionReadabilityContext(),
    buildings: state.buildings,
    squads: state.squads
      .filter((squad) => squad.hp > 0)
      .map((squad) => ({ ...squad, selected: selected.has(squad.id) }))
  });
}

function currentShowcaseFactionArtSummary() {
  return summarizeShowcaseFactionArt({
    buildings: data.buildings,
    squads: data.squads,
    runtimeBuildings: state.buildings,
    runtimeSquads: state.squads.filter((squad) => squad.hp > 0),
    ...factionReadabilityContext()
  });
}

function currentShowcaseIconIntegrationSummary() {
  return summarizeShowcaseIconIntegration({
    abilities: data.abilities,
    squads: data.squads,
    units: data.content?.units ?? [],
    buildings: data.buildings,
    objectives: data.objectives,
    heroes: data.heroes,
    factions: data.factions
  });
}

function currentShowcaseObjectiveArtSummary() {
  return summarizeShowcaseObjectiveArt({
    map: showcaseMap(),
    objectives: data.objectives,
    runtimeObjectives: visibleObjectives(),
    objectiveDefinitions: data.objectives
  });
}

function currentShowcaseDepthFidelitySummary() {
  const selected = new Set(state.selectedSquadIds);
  return summarizeShowcaseDepthFidelity({
    buildings: [
      ...data.buildings.values(),
      ...state.buildings
    ],
    squads: [
      ...data.squads.values(),
      ...state.squads
      .filter((squad) => squad.hp > 0)
      .map((squad) => ({ ...squad, selected: selected.has(squad.id) })),
    ],
    objectives: [
      ...data.objectives.values(),
      ...visibleObjectives()
    ],
    buildingDefinitions: data.buildings,
    squadDefinitions: data.squads,
    objectiveDefinitions: data.objectives
  });
}

function currentShowcaseArtPolishSummary() {
  return summarizeShowcaseArtPolish({
    artPlaceholderAudit: summarizeArtPlaceholderAudit({
      buildings: state.buildings,
      squads: state.squads,
      objectives: visibleObjectives(),
      buildingDefinitions: data.buildings,
      squadDefinitions: data.squads,
      objectiveDefinitions: data.objectives
    }),
    productionFormPolish: summarizeProductionFormPolish({
      buildings: data.buildings,
      squads: data.squads,
      objectives: data.objectives
    }),
    showcaseFactionArt: currentShowcaseFactionArtSummary(),
    showcaseObjectiveArt: currentShowcaseObjectiveArtSummary(),
    showcaseDepthFidelity: currentShowcaseDepthFidelitySummary()
  });
}

function currentSelectedPlayerSquads() {
  const selected = new Set(state.selectedSquadIds);
  return state.squads
    .filter((squad) => squad.hp > 0 && squad.owner === "player" && selected.has(squad.id))
    .map((squad) => ({ ...squad, selected: true }));
}

function currentHeroCommandReadabilitySummary() {
  return summarizeHeroCommandReadability({
    heroes: data.heroes,
    abilities: data.abilities,
    runtimeHeroes: state.heroes,
    selectedSquads: currentSelectedPlayerSquads(),
    ...factionReadabilityContext()
  });
}

function currentHeroFactionBalanceSummary() {
  return summarizeHeroFactionBalance({
    factions: data.factions,
    heroes: data.heroes,
    abilities: data.abilities,
    squads: data.squads,
    techTiers: data.content?.techTree?.tiers ?? [],
    runtimeHeroes: state.heroes,
    playerFaction: state.playerFaction,
    enemyFaction: state.enemyFaction,
    effects: state.effects,
    enemyEffects: state.enemyEffects
  });
}

function currentCombatPrioritySummary() {
  return summarizeCombatPriority({
    events: state.combatFeedback,
    squads: state.squads.filter((squad) => squad.hp > 0),
    selectedSquadIds: state.selectedSquadIds
  });
}

function currentCombatVfxArtDirectionSummary() {
  return summarizeCombatVfxArtDirection({
    events: state.combatFeedback,
    squads: state.squads.filter((squad) => squad.hp > 0),
    selectedSquadIds: state.selectedSquadIds,
    ...factionReadabilityContext()
  });
}

function currentCombatResolutionReadabilitySummary() {
  return summarizeCombatResolutionReadability({
    events: state.combatFeedback,
    squads: state.squads.filter((squad) => squad.hp > 0),
    selectedSquadIds: state.selectedSquadIds,
    ...factionReadabilityContext()
  });
}

function currentCombatReadabilityBudgetSummary() {
  return summarizeCombatReadabilityBudget({
    squads: state.squads.filter((squad) => squad.hp > 0),
    selectedSquadIds: state.selectedSquadIds
  });
}

function currentCombatStressProofSummary() {
  if (state.mode !== "combat_stress") {
    return undefined;
  }
  return summarizeCombatStressProof({
    combatFeedback: state.combatFeedback,
    squads: state.squads,
    selectedSquadIds: state.selectedSquadIds
  });
}

function currentLateGamePacingSummary() {
  if (state.mode !== "late_game_pacing") {
    return undefined;
  }
  return summarizeLateGamePacing({
    techTiers: data.content?.techTree?.tiers ?? [],
    buildings: data.buildings,
    squads: data.squads,
    abilities: data.abilities,
    tactics: data.tactics,
    runtime: {
      techTier: state.techTier,
      enemyTechTier: state.enemyTechTier,
      resources: state.resources,
      enemyResources: state.enemyResources,
      housingUsed: state.housingUsed,
      enemyHousingUsed: state.enemyHousingUsed,
      buildings: state.buildings,
      squads: state.squads,
      aiOrders: state.aiOrders
    }
  });
}

function currentWorldStateReadabilitySummary() {
  return summarizeWorldStateReadability({
    squads: state.squads.filter((squad) => squad.hp > 0),
    selectedSquadIds: state.selectedSquadIds,
    objectives: visibleObjectives()
  });
}

function currentBattlefieldReadableSquads() {
  return state.squads
    .filter((squad) => squad.hp > 0)
    .map((squad) => ({
      ...squad,
      roleStandard: resolveSquadPresentation(squad, data.squads).shapeProfile?.roleStandard
    }));
}

function currentBattlefieldReadabilitySummary() {
  return battlefieldReadabilitySummary({
    squads: currentBattlefieldReadableSquads(),
    selectedSquadIds: state.selectedSquadIds,
    objectives: visibleObjectives(),
    viewport: currentBattlefieldViewport(),
    minimapLayout: currentMinimapLayout()
  });
}

function drawBuildings() {
  for (const building of state.buildings) {
    drawBuildingSilhouette(building, resolveBuildingPresentation(building, data.buildings));
    drawHealth(building.x * TILE + 5, building.y * TILE + 8, building.w * TILE - 10, building.hp / building.maxHp);
  }
}

function drawBuildingSilhouette(building, art) {
  const x = building.x * TILE + 4;
  const y = building.y * TILE + 5;
  const width = building.w * TILE - 8;
  const height = building.h * TILE - 10;
  const factionMark = buildingFactionMark(building, factionReadabilityContext());
  const sprite = alphaBuildingSprite(building, factionReadabilityContext());
  ctx.save();
  ctx.globalAlpha = building.active ? 1 : 0.58;
  ctx.fillStyle = art.palette.shadow;
  ctx.fillRect(x + 5, y + height - 7, width - 10, 10);
  drawBuildingGroundDressing(building, x, y, width, height, art);
  drawBuildingFactionGroundMark(x, y, width, height, factionMark);
  if (drawAlphaArtSprite(ctx, sprite, x + width * 0.5, y + height + 8, {
    width: Math.max(sprite?.draw.width ?? 0, width * 1.2),
    height: Math.max(sprite?.draw.height ?? 0, height * 1.3),
    alpha: building.active ? 1 : 0.76
  })) {
    drawBuildingFactionMark(x, y, width, height, factionMark, building.active);
    if (!building.active) {
      drawConstructionScaffold(x, y, width, height, art, building.id);
    }
    ctx.restore();
    return;
  }
  ctx.fillStyle = art.palette.fill;
  ctx.strokeStyle = art.palette.stroke;
  ctx.lineWidth = 3;
  drawBuildingPath(x, y, width, height, art.silhouette);
  ctx.fill();
  ctx.stroke();
  drawBuildingDepthFidelityMarks(x, y, width, height, art, buildingDepthFidelityProfile({
    ...building,
    mapPresentation: art
  }));
  drawBuildingProfileMarks(x, y, width, height, art);
  drawBuildingOrnaments(x, y, width, height, art, buildingOrnamentProfile(art));
  drawBuildingProductionFormDetails(x, y, width, height, art, buildingProductionFormProfile({
    id: building.buildingId ?? building.id,
    mapPresentation: art
  }));
  drawBuildingArchitectureFidelityMarks(x, y, width, height, art, buildingArchitectureProfile({
    id: building.buildingId ?? building.id,
    mapPresentation: art
  }));
  drawBuildingShowcaseFactionDetails(x, y, width, height, factionMark, building.active);
  drawBuildingFactionMark(x, y, width, height, factionMark, building.active);
  if (!building.active) {
    drawConstructionScaffold(x, y, width, height, art, building.id);
  }
  drawBuildingAccent(x, y, width, height, art);
  const badgeSize = art.shapeProfile?.labelPriority === "support"
    ? Math.max(8, Math.min(width, height) * 0.11)
    : Math.max(10, Math.min(width, height) * 0.16);
  drawEntityEmblemBadge(x + width * 0.5, y + height * 0.47, badgeSize, art);
  ctx.restore();
}

function drawBuildingDepthFidelityMarks(x, y, width, height, art, profile) {
  if (!profile.depthReady) {
    return;
  }
  const cx = x + width * 0.5;
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = "rgba(6, 10, 12, 0.76)";
  ctx.beginPath();
  ctx.ellipse(cx, y + height + 4, width * 0.54, Math.max(6, height * 0.08), 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.28;
  ctx.fillStyle = art.palette.stroke;
  ctx.beginPath();
  ctx.moveTo(x + width * 0.2, y + height * 0.22);
  ctx.lineTo(x + width * 0.36, y + height * 0.1);
  ctx.lineTo(x + width * 0.78, y + height * 0.84);
  ctx.lineTo(x + width * 0.62, y + height * 0.92);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.42;
  ctx.strokeStyle = "rgba(8, 12, 16, 0.76)";
  ctx.lineWidth = 2;
  for (const offset of [0.24, 0.5, 0.76]) {
    ctx.beginPath();
    ctx.moveTo(x + width * offset, y + height * 0.18);
    ctx.lineTo(x + width * offset, y + height * 0.88);
    ctx.stroke();
  }

  ctx.globalAlpha = profile.stateLayer === "construction_depth_scaffold" ? 0.52 : 0.36;
  ctx.strokeStyle = art.palette.accent;
  ctx.lineWidth = 1.45;
  ctx.beginPath();
  ctx.moveTo(x + width * 0.14, y + height * 0.86);
  ctx.quadraticCurveTo(cx, y + height * 1.02, x + width * 0.86, y + height * 0.86);
  ctx.stroke();
  ctx.restore();
}

function drawBuildingProfileMarks(x, y, width, height, art) {
  const profile = art.shapeProfile;
  if (!profile) {
    return;
  }
  ctx.save();
  ctx.globalAlpha *= 0.82;
  ctx.strokeStyle = art.palette.stroke;
  ctx.fillStyle = art.palette.accent;
  ctx.lineWidth = 1.8;
  const cx = x + width * 0.5;
  if (profile.family === "stronghold") {
    drawProfileTower(x + width * 0.16, y + height * 0.22, width * 0.16, height * 0.68, art);
    drawProfileTower(x + width * 0.84, y + height * 0.22, width * 0.16, height * 0.68, art);
    ctx.beginPath();
    ctx.moveTo(cx, y - height * 0.08);
    ctx.lineTo(cx - width * 0.12, y + height * 0.2);
    ctx.lineTo(cx + width * 0.12, y + height * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawArchedGate(cx, y + height * 0.75, width * 0.22, height * 0.28);
  } else if (profile.family === "homestead") {
    for (let index = 0; index < 3; index += 1) {
      const px = x + width * (0.24 + index * 0.23);
      ctx.beginPath();
      ctx.moveTo(px - width * 0.12, y + height * 0.48);
      ctx.lineTo(px, y + height * 0.34);
      ctx.lineTo(px + width * 0.12, y + height * 0.48);
      ctx.stroke();
    }
    for (let row = 0; row < 3; row += 1) {
      ctx.beginPath();
      ctx.moveTo(x + width * 0.15, y + height * (0.76 + row * 0.07));
      ctx.lineTo(x + width * 0.85, y + height * (0.76 + row * 0.04));
      ctx.stroke();
    }
  } else if (profile.family === "resource") {
    ctx.beginPath();
    ctx.ellipse(cx, y + height * 0.72, width * 0.22, height * 0.16, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (let index = 0; index < 4; index += 1) {
      ctx.beginPath();
      ctx.moveTo(x + width * (0.18 + index * 0.17), y + height * 0.62);
      ctx.lineTo(x + width * (0.26 + index * 0.16), y + height * 0.48);
      ctx.stroke();
    }
  } else if (profile.family === "production") {
    drawArchedGate(cx, y + height * 0.72, width * 0.28, height * 0.35);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + side * width * 0.28, y + height * 0.72);
      ctx.lineTo(cx + side * width * 0.4, y + height * 0.42);
      ctx.lineTo(cx + side * width * 0.34, y + height * 0.38);
      ctx.stroke();
    }
  } else if (profile.family === "ritual") {
    ctx.beginPath();
    ctx.arc(cx, y + height * 0.48, Math.min(width, height) * 0.2, Math.PI, 0);
    ctx.stroke();
    ctx.globalAlpha *= 0.55;
    ctx.beginPath();
    ctx.arc(cx, y + height * 0.55, Math.min(width, height) * 0.28, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawProfileTower(cx, top, width, height, art) {
  ctx.beginPath();
  ctx.roundRect(cx - width / 2, top, width, height, Math.min(5, width * 0.3));
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = art.palette.stroke;
  ctx.beginPath();
  ctx.moveTo(cx, top - height * 0.16);
  ctx.lineTo(cx - width * 0.55, top + height * 0.05);
  ctx.lineTo(cx + width * 0.55, top + height * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = art.palette.accent;
}

function drawArchedGate(cx, bottom, width, height) {
  ctx.save();
  ctx.fillStyle = "rgba(17, 22, 22, 0.68)";
  ctx.beginPath();
  ctx.moveTo(cx - width / 2, bottom);
  ctx.lineTo(cx - width / 2, bottom - height * 0.55);
  ctx.quadraticCurveTo(cx, bottom - height, cx + width / 2, bottom - height * 0.55);
  ctx.lineTo(cx + width / 2, bottom);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawBuildingFactionGroundMark(x, y, width, height, mark) {
  ctx.save();
  ctx.globalAlpha = mark.motif === "thorn" ? 0.2 : 0.18;
  ctx.strokeStyle = mark.trim;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.ellipse(x + width * 0.5, y + height + 4, width * 0.58, 12, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (mark.baseMark === "root_ring") {
    for (let index = 0; index < 4; index += 1) {
      ctx.beginPath();
      ctx.moveTo(x + width * (0.18 + index * 0.18), y + height + 3);
      ctx.quadraticCurveTo(x + width * 0.48, y + height + 16, x + width * (0.34 + index * 0.16), y + height + 7);
      ctx.stroke();
    }
    if (mark.groundTexture === "root_lattice") {
      ctx.globalAlpha *= 0.72;
      for (let index = 0; index < 3; index += 1) {
        ctx.beginPath();
        ctx.moveTo(x + width * (0.2 + index * 0.18), y + height + 11);
        ctx.quadraticCurveTo(x + width * (0.45 + index * 0.04), y + height - 2, x + width * (0.72 - index * 0.11), y + height + 10);
        ctx.stroke();
      }
    }
  } else {
    for (let index = 0; index < 5; index += 1) {
      const px = x + width * (0.18 + index * 0.16);
      ctx.beginPath();
      ctx.arc(px, y + height + 4, 4, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
    }
    if (mark.groundTexture === "grave_teeth") {
      ctx.globalAlpha *= 0.75;
      for (let index = 0; index < 6; index += 1) {
        const px = x + width * (0.16 + index * 0.14);
        ctx.beginPath();
        ctx.moveTo(px - 3, y + height + 9);
        ctx.lineTo(px, y + height + 1);
        ctx.lineTo(px + 3, y + height + 9);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawBuildingFactionMark(x, y, width, height, mark, active) {
  ctx.save();
  ctx.globalAlpha = active ? 0.72 : 0.46;
  ctx.strokeStyle = mark.trim;
  ctx.fillStyle = mark.trim;
  ctx.lineWidth = 1.8;
  if (mark.motif === "thorn") {
    drawThornBuildingMark(x, y, width, height, mark);
  } else {
    drawBoneBuildingMark(x, y, width, height, mark);
  }
  ctx.restore();
}

function drawThornBuildingMark(x, y, width, height, mark) {
  for (const side of [0.2, 0.8]) {
    const px = x + width * side;
    ctx.beginPath();
    ctx.moveTo(px, y + height * 0.86);
    ctx.quadraticCurveTo(px + (side < 0.5 ? -10 : 10), y + height * 0.55, px, y + height * 0.28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px, y + height * 0.56);
    ctx.lineTo(px + (side < 0.5 ? -7 : 7), y + height * 0.48);
    ctx.moveTo(px, y + height * 0.42);
    ctx.lineTo(px + (side < 0.5 ? 7 : -7), y + height * 0.35);
    ctx.stroke();
  }
  ctx.beginPath();
  const cx = x + width * 0.5;
  const cy = y + height * 0.22;
  ctx.moveTo(cx - 12, cy + 6);
  ctx.lineTo(cx - 5, cy - 5);
  ctx.lineTo(cx, cy + 3);
  ctx.lineTo(cx + 6, cy - 6);
  ctx.lineTo(cx + 12, cy + 6);
  ctx.stroke();
  if (mark.banner) {
    drawSmallBanner(x + width * 0.14, y + height * 0.2, mark.trim);
  }
  if (mark.buildingForm === "bramble_arches") {
    ctx.globalAlpha *= 0.8;
    for (const px of [x + width * 0.32, x + width * 0.5, x + width * 0.68]) {
      ctx.beginPath();
      ctx.moveTo(px, y + height * 0.88);
      ctx.quadraticCurveTo(px - width * 0.12, y + height * 0.48, px, y + height * 0.18);
      ctx.quadraticCurveTo(px + width * 0.12, y + height * 0.48, px, y + height * 0.88);
      ctx.stroke();
    }
  }
}

function drawBoneBuildingMark(x, y, width, height, mark) {
  const cx = x + width * 0.5;
  for (let index = 0; index < 4; index += 1) {
    const py = y + height * (0.32 + index * 0.12);
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.28, py);
    ctx.quadraticCurveTo(cx, py + 9, cx + width * 0.28, py);
    ctx.stroke();
  }
  ctx.beginPath();
  const cy = y + height * 0.22;
  ctx.moveTo(cx - 11, cy + 6);
  ctx.lineTo(cx - 4, cy - 4);
  ctx.lineTo(cx, cy + 5);
  ctx.lineTo(cx + 5, cy - 5);
  ctx.lineTo(cx + 11, cy + 6);
  ctx.stroke();
  if (mark.banner) {
    drawSmallBanner(x + width * 0.86, y + height * 0.22, mark.trim);
  }
  if (mark.buildingForm === "rib_vaults") {
    ctx.globalAlpha *= 0.78;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + side * width * 0.16, y + height * 0.86);
      ctx.quadraticCurveTo(cx + side * width * 0.34, y + height * 0.46, cx + side * width * 0.12, y + height * 0.18);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + side * width * 0.3, y + height * 0.82);
      ctx.lineTo(cx + side * width * 0.2, y + height * 0.72);
      ctx.moveTo(cx + side * width * 0.26, y + height * 0.58);
      ctx.lineTo(cx + side * width * 0.15, y + height * 0.52);
      ctx.stroke();
    }
  }
}

function drawBuildingPath(x, y, width, height, silhouette) {
  ctx.beginPath();
  if (["keep", "tower", "cairn", "vault", "mythic_gate"].includes(silhouette)) {
    ctx.moveTo(x + width * 0.5, y);
    ctx.lineTo(x + width * 0.9, y + height * 0.28);
    ctx.lineTo(x + width * 0.86, y + height);
    ctx.lineTo(x + width * 0.14, y + height);
    ctx.lineTo(x + width * 0.1, y + height * 0.28);
    ctx.closePath();
  } else if (silhouette === "timber_yard") {
    ctx.roundRect(x + width * 0.08, y + height * 0.42, width * 0.84, height * 0.52, 5);
    ctx.moveTo(x + width * 0.18, y + height * 0.42);
    ctx.lineTo(x + width * 0.38, y + height * 0.18);
    ctx.lineTo(x + width * 0.62, y + height * 0.42);
  } else if (silhouette === "mine") {
    ctx.moveTo(x + width * 0.12, y + height * 0.92);
    ctx.lineTo(x + width * 0.2, y + height * 0.38);
    ctx.lineTo(x + width * 0.5, y + height * 0.15);
    ctx.lineTo(x + width * 0.8, y + height * 0.38);
    ctx.lineTo(x + width * 0.88, y + height * 0.92);
    ctx.closePath();
    ctx.moveTo(x + width * 0.34, y + height * 0.9);
    ctx.quadraticCurveTo(x + width * 0.5, y + height * 0.55, x + width * 0.66, y + height * 0.9);
  } else if (silhouette === "scout_lodge" || silhouette === "roost") {
    ctx.moveTo(x + width * 0.5, y + height * 0.08);
    ctx.lineTo(x + width * 0.86, y + height * 0.44);
    ctx.lineTo(x + width * 0.72, y + height * 0.94);
    ctx.lineTo(x + width * 0.5, y + height * 0.78);
    ctx.lineTo(x + width * 0.28, y + height * 0.94);
    ctx.lineTo(x + width * 0.14, y + height * 0.44);
    ctx.closePath();
  } else if (["farm", "cottage", "market", "storehouse"].includes(silhouette)) {
    ctx.moveTo(x + width * 0.08, y + height * 0.45);
    ctx.lineTo(x + width * 0.5, y + height * 0.12);
    ctx.lineTo(x + width * 0.92, y + height * 0.45);
    ctx.lineTo(x + width * 0.86, y + height * 0.94);
    ctx.lineTo(x + width * 0.14, y + height * 0.94);
    ctx.closePath();
  } else if (["gate", "war_hall", "stables", "foundry", "workshop"].includes(silhouette)) {
    ctx.roundRect(x + width * 0.08, y + height * 0.22, width * 0.84, height * 0.72, 6);
  } else if (["temple", "shrine", "council", "smithy", "infirmary"].includes(silhouette)) {
    ctx.moveTo(x + width * 0.5, y + height * 0.08);
    ctx.lineTo(x + width * 0.88, y + height * 0.36);
    ctx.lineTo(x + width * 0.78, y + height * 0.94);
    ctx.lineTo(x + width * 0.22, y + height * 0.94);
    ctx.lineTo(x + width * 0.12, y + height * 0.36);
    ctx.closePath();
  } else {
    ctx.roundRect(x + width * 0.08, y + height * 0.18, width * 0.84, height * 0.76, 9);
  }
}

function drawBuildingAccent(x, y, width, height, art) {
  ctx.fillStyle = art.palette.accent;
  ctx.strokeStyle = art.palette.accent;
  ctx.globalAlpha = 0.78;
  const cx = x + width * 0.5;
  const cy = y + height * 0.52;
  const size = Math.max(8, Math.min(width, height) * 0.18);
  if (["crystal", "relic", "portal"].includes(art.emblem)) {
    drawCrystal(cx, cy + size * 0.8, size * 1.35, art.palette.accent, art.palette.stroke);
  } else if (["swords", "axe", "pick", "anvil", "gear", "wheel"].includes(art.emblem)) {
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - size, cy + size);
    ctx.lineTo(cx + size, cy - size);
    ctx.moveTo(cx + size, cy + size);
    ctx.lineTo(cx - size, cy - size);
    ctx.stroke();
  } else if (["wheat", "moth", "hart", "claw"].includes(art.emblem)) {
    ctx.beginPath();
    ctx.ellipse(cx - size * 0.45, cy, size * 0.45, size * 0.9, -0.5, 0, Math.PI * 2);
    ctx.ellipse(cx + size * 0.45, cy, size * 0.45, size * 0.9, 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#151817";
    ctx.globalAlpha = 0.55;
    ctx.fillRect(cx - size * 0.45, cy - size * 0.12, size * 0.9, size * 0.24);
  }
}

function drawBuildingOrnaments(x, y, width, height, art, profile) {
  const baseAlpha = ctx.globalAlpha;
  const cx = x + width * 0.5;
  const bottom = y + height;
  ctx.save();
  ctx.globalAlpha = baseAlpha * 0.82;
  ctx.strokeStyle = art.palette.stroke;
  ctx.fillStyle = "rgba(17, 22, 22, 0.62)";
  ctx.lineWidth = 1.6;

  if (profile.roof === "spire") {
    ctx.beginPath();
    ctx.moveTo(cx, y - height * 0.08);
    ctx.lineTo(x + width * 0.18, y + height * 0.27);
    ctx.moveTo(cx, y - height * 0.08);
    ctx.lineTo(x + width * 0.82, y + height * 0.27);
    ctx.stroke();
  } else if (profile.roof === "thatch") {
    ctx.beginPath();
    for (let index = 0; index < 5; index += 1) {
      const px = x + width * (0.18 + index * 0.16);
      ctx.moveTo(px, y + height * 0.23);
      ctx.lineTo(px - width * 0.08, y + height * 0.43);
    }
    ctx.stroke();
  } else if (profile.roof === "beam" || profile.roof === "martial") {
    ctx.beginPath();
    ctx.moveTo(x + width * 0.18, y + height * 0.28);
    ctx.lineTo(x + width * 0.82, y + height * 0.28);
    ctx.moveTo(x + width * 0.24, y + height * 0.18);
    ctx.lineTo(x + width * 0.76, y + height * 0.38);
    ctx.stroke();
  }

  const doorWidth = Math.max(9, width * 0.16);
  const doorHeight = Math.max(12, height * 0.22);
  ctx.fillRect(cx - doorWidth / 2, bottom - doorHeight - 5, doorWidth, doorHeight);
  ctx.strokeRect(cx - doorWidth / 2, bottom - doorHeight - 5, doorWidth, doorHeight);

  ctx.fillStyle = art.palette.accent;
  for (let index = 0; index < profile.windows; index += 1) {
    const wx = x + width * (0.24 + (index % 3) * 0.26);
    const wy = y + height * (0.36 + Math.floor(index / 3) * 0.18);
    ctx.fillRect(wx - 3.5, wy - 3, 7, 6);
  }

  if (profile.banners) {
    drawSmallBanner(x + width * 0.2, y + height * 0.28, art.palette.accent);
    drawSmallBanner(x + width * 0.8, y + height * 0.28, art.palette.accent);
  }
  if (profile.props.includes("crop_rows")) {
    drawCropRows(x, bottom + 2, width, art.palette.stroke);
  }
  if (profile.props.includes("log_stack")) {
    drawLogStack(x + width * 0.1, bottom - height * 0.16, width * 0.28, art.palette.stroke);
  }
  if (profile.props.includes("mine_cart")) {
    drawMineCart(x + width * 0.12, bottom - height * 0.14, art.palette.stroke);
  }
  if (profile.props.includes("weapon_rack")) {
    drawWeaponRack(x + width * 0.75, bottom - height * 0.18, art.palette.accent);
  }
  ctx.restore();
}

function drawBuildingProductionFormDetails(x, y, width, height, art, form) {
  ctx.save();
  ctx.globalAlpha = 0.52;
  ctx.strokeStyle = art.palette.accent;
  ctx.fillStyle = art.palette.accent;
  ctx.lineWidth = 1.35;
  const cx = x + width * 0.5;
  const bottom = y + height;

  if (form.materialCue === "crowned_stone" || form.materialCue === "worked_plinth") {
    for (let row = 0; row < 3; row += 1) {
      const py = y + height * (0.36 + row * 0.16);
      ctx.beginPath();
      ctx.moveTo(x + width * 0.2, py);
      ctx.lineTo(x + width * 0.8, py - (row % 2) * 2);
      ctx.stroke();
    }
  }
  if (form.materialCue === "woven_thatch") {
    for (let index = 0; index < 6; index += 1) {
      const px = x + width * (0.16 + index * 0.13);
      ctx.beginPath();
      ctx.moveTo(px, y + height * 0.22);
      ctx.lineTo(px + width * 0.05, y + height * 0.45);
      ctx.stroke();
    }
  }
  if (form.materialCue === "hewn_timber") {
    for (let index = 0; index < 4; index += 1) {
      const py = bottom - height * (0.16 + index * 0.1);
      ctx.beginPath();
      ctx.moveTo(x + width * 0.13, py);
      ctx.lineTo(x + width * 0.46, py - 3);
      ctx.moveTo(x + width * 0.54, py - 2);
      ctx.lineTo(x + width * 0.88, py + 2);
      ctx.stroke();
    }
  }
  if (form.materialCue === "pit_stone") {
    for (let index = 0; index < 7; index += 1) {
      const angle = Math.PI * (0.1 + index * 0.12);
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle) * width * 0.18, bottom - height * 0.1 + Math.sin(angle) * height * 0.1, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (form.materialCue === "martial_iron") {
    for (let index = 0; index < 5; index += 1) {
      const px = x + width * (0.18 + index * 0.16);
      ctx.beginPath();
      ctx.arc(px, y + height * 0.34, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(x + width * 0.18, bottom - height * 0.2);
    ctx.lineTo(x + width * 0.82, bottom - height * 0.2);
    ctx.stroke();
  }
  if (form.materialCue === "moonlit_masonry") {
    for (const radius of [0.22, 0.31]) {
      ctx.beginPath();
      ctx.arc(cx, y + height * 0.53, Math.min(width, height) * radius, Math.PI, 0);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx, y + height * 0.25);
    ctx.lineTo(cx, y + height * 0.74);
    ctx.stroke();
  }
  if (form.materialCue === "watch_perch") {
    ctx.beginPath();
    ctx.moveTo(cx, y + height * 0.16);
    ctx.lineTo(cx, y - height * 0.06);
    ctx.moveTo(cx - width * 0.12, y + height * 0.24);
    ctx.lineTo(cx + width * 0.12, y + height * 0.24);
    ctx.stroke();
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.quadraticCurveTo(cx, y + height * 0.2, cx + side * width * 0.28, y + height * 0.36);
      ctx.stroke();
    }
  }
  if (form.materialCue === "beast_roost") {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + side * width * 0.12, y + height * 0.28);
      ctx.quadraticCurveTo(cx + side * width * 0.32, y + height * 0.08, cx + side * width * 0.42, y + height * 0.32);
      ctx.stroke();
    }
    for (let index = 0; index < 4; index += 1) {
      ctx.beginPath();
      ctx.moveTo(x + width * (0.22 + index * 0.16), bottom - height * 0.2);
      ctx.lineTo(x + width * (0.18 + index * 0.16), bottom - height * 0.07);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawBuildingArchitectureFidelityMarks(x, y, width, height, art, profile) {
  if (!profile?.architecturePolishReady) {
    return;
  }
  const cx = x + width * 0.5;
  const bottom = y + height;
  ctx.save();
  ctx.globalAlpha = 0.48;
  ctx.strokeStyle = art.palette.accent;
  ctx.fillStyle = art.palette.accent;
  ctx.lineWidth = 1.45;

  if (["vertical", "vertical_cluster", "monolith", "portal", "raised_mass", "raised_compact"].includes(profile.silhouetteDepth)) {
    ctx.beginPath();
    ctx.moveTo(cx, y + height * 0.12);
    ctx.lineTo(cx, bottom - height * 0.08);
    ctx.stroke();
    for (const offset of [-0.22, 0.22]) {
      ctx.beginPath();
      ctx.moveTo(cx + width * offset, y + height * 0.32);
      ctx.lineTo(cx + width * offset * 0.55, y + height * 0.72);
      ctx.stroke();
    }
  } else if (profile.silhouetteDepth.includes("wide") || profile.silhouetteDepth.includes("broad") || profile.silhouetteDepth === "low_spread") {
    for (const offset of [-0.24, 0, 0.24]) {
      ctx.beginPath();
      ctx.moveTo(cx + width * offset, y + height * 0.34);
      ctx.lineTo(cx + width * offset, bottom - height * 0.12);
      ctx.stroke();
    }
  } else if (profile.silhouetteDepth === "recessed") {
    ctx.beginPath();
    ctx.ellipse(cx, bottom - height * 0.15, width * 0.22, height * 0.13, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (["crowned_spire", "needle_spire", "votive_spire", "crystal_cairn", "vaulted_crown", "portal_crown"].includes(profile.rooflineKind)) {
    const points = profile.rooflineKind === "portal_crown" ? [-0.28, 0, 0.28] : [-0.18, 0, 0.18];
    for (const offset of points) {
      ctx.beginPath();
      ctx.moveTo(cx + width * offset, y + height * 0.18);
      ctx.lineTo(cx + width * (offset - 0.045), y + height * 0.03);
      ctx.lineTo(cx + width * (offset + 0.045), y + height * 0.03);
      ctx.closePath();
      ctx.stroke();
    }
  } else if (["thatch_ridge", "clustered_roofs", "canopy_row", "crate_gable"].includes(profile.rooflineKind)) {
    for (let index = 0; index < 4; index += 1) {
      const px = x + width * (0.18 + index * 0.18);
      ctx.beginPath();
      ctx.moveTo(px, y + height * 0.32);
      ctx.lineTo(px + width * 0.1, y + height * 0.2);
      ctx.lineTo(px + width * 0.2, y + height * 0.32);
      ctx.stroke();
    }
  } else if (["beam_shed", "timber_brace", "sawtooth_roof", "smoke_stacks", "long_stable_roof", "stake_palisade"].includes(profile.rooflineKind)) {
    ctx.beginPath();
    ctx.moveTo(x + width * 0.14, y + height * 0.28);
    ctx.lineTo(x + width * 0.86, y + height * 0.28);
    ctx.stroke();
    if (profile.rooflineKind === "sawtooth_roof" || profile.rooflineKind === "smoke_stacks") {
      for (const offset of [-0.24, 0, 0.24]) {
        ctx.beginPath();
        ctx.moveTo(cx + width * offset, y + height * 0.28);
        ctx.lineTo(cx + width * (offset + 0.09), y + height * 0.16);
        ctx.lineTo(cx + width * (offset + 0.18), y + height * 0.28);
        ctx.stroke();
      }
    }
  } else if (["moon_arch", "arched_forge", "healer_arch", "bannered_arch"].includes(profile.rooflineKind)) {
    ctx.beginPath();
    ctx.arc(cx, y + height * 0.46, Math.min(width, height) * 0.32, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
  }

  if (profile.facadeLayerKind.includes("bays") || profile.facadeLayerKind.includes("stall") || profile.facadeLayerKind.includes("arcade")) {
    for (const offset of [-0.24, 0, 0.24]) {
      ctx.beginPath();
      ctx.roundRect(cx + width * offset - width * 0.07, bottom - height * 0.28, width * 0.14, height * 0.18, 3);
      ctx.stroke();
    }
  }
  if (profile.facadeLayerKind.includes("buttress") || profile.facadeLayerKind.includes("watch")) {
    for (const offset of [-0.34, 0.34]) {
      ctx.beginPath();
      ctx.moveTo(cx + width * offset, bottom - height * 0.12);
      ctx.lineTo(cx + width * offset * 0.78, y + height * 0.28);
      ctx.stroke();
    }
  }
  if (profile.silhouetteGlyphs.includes("smoke_stacks")) {
    for (const offset of [-0.18, 0.18]) {
      ctx.beginPath();
      ctx.rect(cx + width * offset - 3, y + height * 0.1, 6, height * 0.24);
      ctx.stroke();
    }
  }
  if (profile.silhouetteGlyphs.includes("hanging_scales") || profile.silhouetteGlyphs.includes("map_table")) {
    ctx.beginPath();
    ctx.moveTo(cx, y + height * 0.38);
    ctx.lineTo(cx, y + height * 0.58);
    ctx.moveTo(cx - width * 0.12, y + height * 0.48);
    ctx.lineTo(cx + width * 0.12, y + height * 0.48);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBuildingShowcaseFactionDetails(x, y, width, height, mark, active) {
  ctx.save();
  ctx.globalAlpha = active ? 0.62 : 0.42;
  ctx.strokeStyle = mark.trim;
  ctx.fillStyle = mark.trim;
  ctx.lineWidth = 1.45;
  const cx = x + width * 0.5;
  const bottom = y + height;

  if (mark.motif === "thorn") {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + side * width * 0.1, bottom - height * 0.08);
      ctx.quadraticCurveTo(cx + side * width * 0.33, y + height * 0.52, cx + side * width * 0.18, y + height * 0.18);
      ctx.stroke();
      for (let leaf = 0; leaf < 3; leaf += 1) {
        const px = cx + side * width * (0.18 + leaf * 0.05);
        const py = y + height * (0.24 + leaf * 0.16);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(side * (0.45 + leaf * 0.08));
        ctx.beginPath();
        ctx.ellipse(0, 0, width * 0.035, height * 0.018, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.18, y + height * 0.16);
    ctx.lineTo(cx - width * 0.08, y + height * 0.04);
    ctx.lineTo(cx, y + height * 0.15);
    ctx.lineTo(cx + width * 0.08, y + height * 0.04);
    ctx.lineTo(cx + width * 0.18, y + height * 0.16);
    ctx.stroke();
  } else {
    for (let rib = 0; rib < 5; rib += 1) {
      const py = y + height * (0.23 + rib * 0.12);
      ctx.beginPath();
      ctx.moveTo(cx - width * 0.34, py);
      ctx.quadraticCurveTo(cx, py + height * 0.08, cx + width * 0.34, py);
      ctx.stroke();
    }
    for (let tooth = 0; tooth < 6; tooth += 1) {
      const px = x + width * (0.16 + tooth * 0.136);
      ctx.beginPath();
      ctx.moveTo(px - width * 0.025, bottom - height * 0.08);
      ctx.lineTo(px, bottom - height * 0.18);
      ctx.lineTo(px + width * 0.025, bottom - height * 0.08);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(cx, y + height * 0.1);
    ctx.lineTo(cx, bottom - height * 0.12);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBuildingGroundDressing(building, x, y, width, height, art) {
  const ground = buildingTerrainIntegrationProfile(building, { buildingDefinitions: data.buildings });
  ctx.save();
  ctx.globalAlpha = building.active ? 0.24 : 0.38;
  ctx.fillStyle = buildingGroundFill(ground, art, building.active);
  ctx.beginPath();
  ctx.ellipse(x + width * 0.5, y + height + 3, width * buildingGroundRadius(ground), 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = buildingGroundStroke(ground, art);
  ctx.lineWidth = 1.2;
  for (let index = 0; index < 3; index += 1) {
    const offset = (seededUnit(`${building.id}-apron-${index}`) - 0.5) * width * 0.22;
    ctx.beginPath();
    ctx.moveTo(x + width * 0.5 + offset, y + height - 2);
    ctx.lineTo(x + width * (0.18 + index * 0.32), y + height + 13);
    ctx.stroke();
  }
  drawBuildingApproachMarks(building, x, y, width, height, art, ground);
  ctx.restore();
}

function buildingGroundRadius(ground) {
  if (ground.groundKind === "command_apron" || ground.groundKind === "ritual_plinth") {
    return 0.54;
  }
  if (ground.groundKind === "tilled_field" || ground.groundKind === "log_yard") {
    return 0.58;
  }
  return 0.5;
}

function buildingGroundFill(ground, art, active) {
  if (ground.groundKind === "tilled_field") {
    return active ? "#8b6d3b" : "#d9bd79";
  }
  if (ground.groundKind === "log_yard") {
    return active ? "#6f573c" : "#c9ae77";
  }
  if (ground.groundKind === "pit_cut") {
    return active ? "#5f6570" : "#b8b3a0";
  }
  if (ground.groundKind === "martial_yard") {
    return active ? "#69576b" : "#c7b5c7";
  }
  return active ? art.palette.stroke : "#d7c98c";
}

function buildingGroundStroke(ground, art) {
  if (ground.factionGroundKind === "enemy_dread") {
    return "#7a5c97";
  }
  if (ground.factionGroundKind === "player_briar") {
    return "#567a52";
  }
  return art.palette.stroke;
}

function drawBuildingApproachMarks(building, x, y, width, height, art, ground) {
  const baseY = y + height + 6;
  const stroke = buildingGroundStroke(ground, art);
  ctx.save();
  ctx.globalAlpha = building.active ? 0.56 : 0.68;
  ctx.strokeStyle = stroke;
  ctx.fillStyle = stroke;
  ctx.lineWidth = 1.1;

  if (ground.approachKind === "field_ruts") {
    for (let row = 0; row < 4; row += 1) {
      const ry = baseY - 9 + row * 4;
      ctx.beginPath();
      ctx.moveTo(x + width * 0.16, ry);
      ctx.quadraticCurveTo(x + width * 0.5, ry - 3 + row, x + width * 0.84, ry + 1);
      ctx.stroke();
    }
  } else if (ground.approachKind === "log_drag") {
    for (let mark = 0; mark < 3; mark += 1) {
      const px = x + width * (0.2 + mark * 0.24);
      ctx.beginPath();
      ctx.moveTo(px - width * 0.1, baseY - 10);
      ctx.lineTo(px + width * 0.08, baseY + 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px + width * 0.11, baseY + 4, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ground.approachKind === "cart_track") {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + width * (0.5 + side * 0.12), baseY - 12);
      ctx.quadraticCurveTo(x + width * (0.5 + side * 0.08), baseY + 2, x + width * (0.5 + side * 0.18), baseY + 16);
      ctx.stroke();
    }
    for (let rung = 0; rung < 3; rung += 1) {
      const ry = baseY - 5 + rung * 7;
      ctx.beginPath();
      ctx.moveTo(x + width * 0.36, ry);
      ctx.lineTo(x + width * 0.64, ry + 1);
      ctx.stroke();
    }
  } else if (ground.approachKind === "drill_lane") {
    for (let stripe = 0; stripe < 3; stripe += 1) {
      const px = x + width * (0.3 + stripe * 0.2);
      ctx.beginPath();
      ctx.moveTo(px - width * 0.055, baseY + 7);
      ctx.lineTo(px, baseY - 6);
      ctx.lineTo(px + width * 0.055, baseY + 7);
      ctx.stroke();
    }
  } else if (ground.approachKind === "crown_road") {
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x + width * 0.5, baseY - 13);
    ctx.lineTo(x + width * 0.5, baseY + 17);
    ctx.stroke();
    for (let stone = 0; stone < 5; stone += 1) {
      const px = x + width * (0.3 + stone * 0.1);
      ctx.beginPath();
      ctx.rect(px, baseY + 4 + (stone % 2) * 3, 3.2, 2.2);
      ctx.fill();
    }
  } else if (ground.approachKind === "sigil_walk") {
    for (let ring = 0; ring < 3; ring += 1) {
      const px = x + width * (0.32 + ring * 0.18);
      ctx.beginPath();
      ctx.arc(px, baseY + 1 + ring * 3, 3.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.moveTo(x + width * 0.36, baseY - 8);
    ctx.lineTo(x + width * 0.64, baseY + 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + width * 0.64, baseY - 8);
    ctx.lineTo(x + width * 0.36, baseY + 12);
    ctx.stroke();
  }

  ctx.restore();
}

function drawConstructionScaffold(x, y, width, height, art, seed) {
  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.strokeStyle = art.palette.accent;
  ctx.lineWidth = 1.7;
  const posts = [
    [x + width * 0.1, y + height * 0.16],
    [x + width * 0.9, y + height * 0.16],
    [x + width * 0.16, y + height * 0.9],
    [x + width * 0.84, y + height * 0.9]
  ];
  for (const [px, py] of posts) {
    ctx.beginPath();
    ctx.moveTo(px, py - 7);
    ctx.lineTo(px, py + 11);
    ctx.stroke();
  }
  for (let index = 0; index < 4; index += 1) {
    const yOffset = y + height * (0.28 + index * 0.17);
    const jitter = (seededUnit(`${seed}-scaffold-${index}`) - 0.5) * 5;
    ctx.beginPath();
    ctx.moveTo(x + width * 0.13, yOffset + jitter);
    ctx.lineTo(x + width * 0.87, yOffset - jitter);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSmallBanner(x, y, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 11, y + 4);
  ctx.lineTo(x, y + 13);
  ctx.closePath();
  ctx.fill();
}

function drawCropRows(x, y, width, stroke) {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.2;
  for (let index = 0; index < 3; index += 1) {
    ctx.beginPath();
    ctx.moveTo(x + width * 0.18, y + index * 5);
    ctx.lineTo(x + width * 0.82, y + index * 4);
    ctx.stroke();
  }
}

function drawLogStack(x, y, width, stroke) {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  for (let index = 0; index < 3; index += 1) {
    ctx.beginPath();
    ctx.moveTo(x, y + index * 4);
    ctx.lineTo(x + width, y + index * 4);
    ctx.stroke();
  }
}

function drawMineCart(x, y, stroke) {
  ctx.strokeStyle = stroke;
  ctx.strokeRect(x, y, 18, 10);
  ctx.beginPath();
  ctx.arc(x + 4, y + 12, 3, 0, Math.PI * 2);
  ctx.arc(x + 15, y + 12, 3, 0, Math.PI * 2);
  ctx.stroke();
}

function drawWeaponRack(x, y, stroke) {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 10);
  ctx.lineTo(x + 8, y - 10);
  ctx.moveTo(x + 8, y + 10);
  ctx.lineTo(x - 8, y - 10);
  ctx.stroke();
}

function drawSquads() {
  const visibleSquads = state.squads.filter((entry) => entry.hp > 0);
  const selectedSquadIds = new Set(state.selectedSquadIds);
  const readabilityBudgets = new Map(visibleSquads.map((squad) => [
    squad.id,
    squadReadabilityBudget(squad, { squads: visibleSquads, selectedSquadIds })
  ]));
  for (const squad of visibleSquads) {
    drawSquadPriorityIndicator(squad, visibleSquads);
    drawSquadSilhouette(squad, resolveSquadPresentation(squad, data.squads));
    if (state.selectedSquadIds.includes(squad.id)) {
      drawSquadSelectionRing(squad);
    }
  }
  drawCombatFeedback();
  drawCombatResolutionMarkers(visibleSquads);
  for (const squad of visibleSquads) {
    const budget = readabilityBudgets.get(squad.id);
    if (budget?.showHealthBar) {
      drawHealth(squad.x * TILE - 16, squad.y * TILE - 24, 32, squad.hp / squad.maxHp);
    }
    if (budget?.showMoraleBar) {
      drawMorale(squad.x * TILE - 16, squad.y * TILE - 17, 32, squad.morale / 100);
    }
  }
}

function drawCombatFeedback() {
  if (state.combatFeedback.length === 0) {
    return;
  }
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const event of state.combatFeedback) {
    const progress = event.progress ?? 0;
    const alpha = Math.max(0, event.alpha ?? 1 - progress);
    const sx = event.source.x * TILE;
    const sy = event.source.y * TILE;
    const tx = event.target.x * TILE;
    const ty = event.target.y * TILE;
    const profile = combatEventPriorityProfile(event);
    if (event.kind === "death") {
      drawDeathFeedback(tx, ty, progress, alpha, event.owner, profile);
    } else if (event.kind === "order") {
      drawOrderFeedback(tx, ty, progress, alpha, profile);
    } else if (event.kind === "ability") {
      drawAbilityFeedback(sx, sy, tx, ty, progress, alpha, profile);
    } else {
      drawHitFeedback(sx, sy, tx, ty, progress, alpha, event.kind, event.owner, profile);
    }
  }
  ctx.restore();
}

function drawCombatResolutionMarkers(visibleSquads) {
  const summary = currentCombatResolutionReadabilitySummary();
  if (!summary?.resolutionChainKinds?.length) {
    return;
  }
  ctx.save();
  for (const squad of visibleSquads) {
    if (Number(squad.morale ?? 100) < 35 || squad.stance === "retreat") {
      drawMoraleBreakAnchor(squad);
    }
  }
  for (const event of state.combatFeedback.filter((entry) => entry.kind === "death" || entry.lethal)) {
    drawLethalAftermathAnchor(event);
  }
  ctx.restore();
}

function drawMoraleBreakAnchor(squad) {
  const cx = squad.x * TILE;
  const cy = squad.y * TILE;
  const retreating = squad.stance === "retreat";
  ctx.save();
  ctx.globalAlpha = retreating ? 0.68 : 0.56;
  ctx.strokeStyle = retreating ? "#d7c98c" : "#f7d585";
  ctx.fillStyle = "rgba(17, 22, 22, 0.72)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy - 45);
  ctx.lineTo(cx + 12, cy - 45);
  ctx.lineTo(cx + 6, cy - 28);
  ctx.lineTo(cx - 6, cy - 28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 41);
  ctx.lineTo(cx, cy - 34);
  ctx.lineTo(cx + 5, cy - 41);
  ctx.stroke();
  if (retreating) {
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, cy + 18);
    ctx.quadraticCurveTo(cx - 16, cy + 31, cx - 34, cy + 23);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawLethalAftermathAnchor(event) {
  const tx = event.target.x * TILE;
  const ty = event.target.y * TILE;
  const enemyAftermath = event.owner === "enemy";
  ctx.save();
  ctx.globalAlpha = 0.42 * Math.max(0.25, event.alpha ?? 0.65);
  ctx.fillStyle = enemyAftermath ? "rgba(201, 193, 217, 0.28)" : "rgba(169, 240, 220, 0.25)";
  ctx.strokeStyle = enemyAftermath ? "#c9c1d9" : "#a9f0dc";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(tx, ty + 16, 34, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (let index = 0; index < 4; index += 1) {
    const angle = index * Math.PI / 2 + 0.35;
    const x = tx + Math.cos(angle) * 22;
    const y = ty + 12 + Math.sin(angle) * 7;
    ctx.beginPath();
    if (enemyAftermath) {
      ctx.moveTo(x - 4, y);
      ctx.lineTo(x + 4, y);
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x, y + 4);
      ctx.stroke();
    } else {
      ctx.ellipse(x, y, 5, 2, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawHitFeedback(sx, sy, tx, ty, progress, alpha, kind, owner, profile) {
  const ownerColor = profile?.color ?? (owner === "player" ? "#a9f0dc" : "#f1c76a");
  const glyphs = new Set(profile?.hierarchy?.glyphs ?? []);
  ctx.globalAlpha = alpha * 0.75;
  ctx.strokeStyle = kind === "structure-hit" ? "#f7d585" : ownerColor;
  ctx.lineWidth = profile?.trail === "heavy" ? 4.5 : 2.5;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  if (profile?.trail === "arc") {
    ctx.quadraticCurveTo((sx + tx) / 2, Math.min(sy, ty) - 22, tx, ty);
  } else {
    ctx.lineTo(tx, ty);
  }
  ctx.stroke();

  if (glyphs.has("target_flash")) {
    ctx.globalAlpha = alpha * 0.5;
    ctx.fillStyle = ownerColor;
    ctx.beginPath();
    ctx.moveTo(tx, ty - 13);
    ctx.lineTo(tx + 11, ty);
    ctx.lineTo(tx, ty + 13);
    ctx.lineTo(tx - 11, ty);
    ctx.closePath();
    ctx.fill();
  }

  ctx.globalAlpha = alpha;
  ctx.strokeStyle = kind === "structure-hit" ? "#f7d585" : "#f7e7a1";
  ctx.lineWidth = kind === "structure-hit" ? 3 : 2;
  ctx.beginPath();
  ctx.arc(tx, ty, 8 + progress * (kind === "structure-hit" ? 30 : 22), 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = ownerColor;
  ctx.lineWidth = 2;
  for (let index = 0; index < 4; index += 1) {
    const angle = progress * Math.PI + index * Math.PI / 2;
    const spread = 8 + progress * 15;
    ctx.beginPath();
    ctx.moveTo(tx + Math.cos(angle) * 4, ty + Math.sin(angle) * 4);
    ctx.lineTo(tx + Math.cos(angle) * spread, ty + Math.sin(angle) * spread);
    ctx.stroke();
  }
  if (glyphs.has("debris_ticks")) {
    ctx.globalAlpha = alpha * 0.82;
    ctx.fillStyle = "#f7d585";
    for (let index = 0; index < 5; index += 1) {
      const angle = -0.65 + index * 0.32 + progress * 0.6;
      const distance = 15 + progress * 24 + index * 2;
      ctx.save();
      ctx.translate(tx + Math.cos(angle) * distance, ty + Math.sin(angle) * distance);
      ctx.rotate(angle + Math.PI * 0.2);
      ctx.fillRect(-2.5, -1.5, 5, 3);
      ctx.restore();
    }
  }
}

function drawDeathFeedback(x, y, progress, alpha, owner, profile) {
  const color = profile?.color ?? (owner === "player" ? "#a9f0dc" : "#c9c1d9");
  const glyphs = new Set(profile?.hierarchy?.glyphs ?? []);
  ctx.globalAlpha = alpha * 0.7;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 12 + progress * 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#f3e6d1";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, 16 + progress * 34, 0, Math.PI * 2);
  ctx.stroke();
  if (glyphs.has("collapse_ring")) {
    ctx.globalAlpha = alpha * 0.7;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 9 + progress * 18, Math.PI * 0.1, Math.PI * 1.85);
    ctx.stroke();
  }
  if (glyphs.has("residue_cross")) {
    ctx.globalAlpha = alpha * 0.92;
    ctx.strokeStyle = "#f3e6d1";
    ctx.lineWidth = 2.5;
  }
  ctx.beginPath();
  ctx.moveTo(x - 18, y - 18);
  ctx.lineTo(x + 18, y + 18);
  ctx.moveTo(x + 18, y - 18);
  ctx.lineTo(x - 18, y + 18);
  ctx.stroke();
  ctx.globalAlpha = alpha * 0.5;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 28 + progress * 18, 12 + progress * 8, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (glyphs.has("fade_pool")) {
    ctx.globalAlpha = alpha * 0.18;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 30 + progress * 28, 11 + progress * 11, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  drawDeathResidue(x, y, progress, alpha, owner);
  ctx.setLineDash([]);
}

function drawDeathResidue(x, y, progress, alpha, owner) {
  const enemyResidue = owner === "enemy";
  ctx.save();
  ctx.globalAlpha = alpha * 0.72;
  ctx.strokeStyle = enemyResidue ? "#c9c1d9" : "#a9f0dc";
  ctx.fillStyle = enemyResidue ? "rgba(201, 193, 217, 0.5)" : "rgba(169, 240, 220, 0.48)";
  ctx.lineWidth = 1.8;
  for (let index = 0; index < 6; index += 1) {
    const angle = index * Math.PI / 3 + progress * 1.2;
    const distance = 18 + progress * 30 + (index % 2) * 5;
    const px = x + Math.cos(angle) * distance;
    const py = y + Math.sin(angle) * (distance * 0.58) + 5;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.beginPath();
    if (enemyResidue) {
      ctx.moveTo(-5, 0);
      ctx.lineTo(5, 0);
      ctx.moveTo(0, -4);
      ctx.lineTo(0, 4);
      ctx.stroke();
    } else {
      ctx.ellipse(0, 0, 5, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawOrderFeedback(x, y, progress, alpha, profile) {
  const glyphs = new Set(profile?.hierarchy?.glyphs ?? []);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = profile?.color ?? "#a9f0dc";
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.arc(x, y, 12 + progress * 24, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = profile?.color ?? "#d8f3dc";
  const chevrons = glyphs.has("chevron_stack") ? 4 : 3;
  for (let index = 0; index < chevrons; index += 1) {
    const offset = index * 9;
    ctx.beginPath();
    ctx.moveTo(x, y - 14 + offset);
    ctx.lineTo(x + 9, y - 2 + offset);
    ctx.lineTo(x - 9, y - 2 + offset);
    ctx.closePath();
    ctx.fill();
  }
  if (glyphs.has("destination_ring")) {
    ctx.globalAlpha = alpha * 0.45;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.ellipse(x, y + 20, 21 + progress * 9, 9 + progress * 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawAbilityFeedback(sx, sy, tx, ty, progress, alpha, profile) {
  const glyphs = new Set(profile?.hierarchy?.glyphs ?? []);
  ctx.save();
  ctx.globalAlpha = alpha * 0.82;
  ctx.strokeStyle = profile?.color ?? "#a9f0dc";
  ctx.fillStyle = "rgba(216, 243, 220, 0.22)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.bezierCurveTo(sx + 30, sy - 42, tx - 24, ty - 34, tx, ty);
  ctx.stroke();
  if (glyphs.has("source_sigil")) {
    ctx.globalAlpha = alpha * 0.55;
    ctx.beginPath();
    ctx.arc(sx, sy, 10 + progress * 6, 0, Math.PI * 2);
    ctx.moveTo(sx - 10, sy);
    ctx.lineTo(sx + 10, sy);
    ctx.moveTo(sx, sy - 10);
    ctx.lineTo(sx, sy + 10);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(tx, ty, 13 + progress * 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (glyphs.has("target_snare")) {
    ctx.globalAlpha = alpha * 0.8;
    ctx.beginPath();
    for (let index = 0; index < 5; index += 1) {
      const angle = index * Math.PI * 0.4 + progress * Math.PI;
      ctx.moveTo(tx + Math.cos(angle) * 7, ty + Math.sin(angle) * 7);
      ctx.lineTo(tx + Math.cos(angle + 0.28) * 22, ty + Math.sin(angle + 0.28) * 22);
    }
    ctx.stroke();
  }
  for (let index = 0; index < 6; index += 1) {
    const angle = index * Math.PI / 3 + progress * Math.PI;
    ctx.beginPath();
    ctx.moveTo(tx + Math.cos(angle) * 8, ty + Math.sin(angle) * 8);
    ctx.lineTo(tx + Math.cos(angle) * (22 + progress * 18), ty + Math.sin(angle) * (22 + progress * 18));
    ctx.stroke();
  }
  ctx.restore();
}

function drawSquadPriorityIndicator(squad, visibleSquads) {
  const profile = squadPriorityProfile(squad, {
    selectedSquadIds: state.selectedSquadIds,
    hostileSquads: visibleSquads.filter((candidate) => candidate.owner !== squad.owner)
  });
  if (profile.marker === "normal" && !profile.selected && profile.threat === "clear") {
    return;
  }
  const cx = squad.x * TILE;
  const cy = squad.y * TILE;
  ctx.save();
  ctx.globalAlpha = profile.selected ? 0.42 : profile.marker === "priority_warning" ? 0.32 : 0.22;
  ctx.strokeStyle = profile.marker === "priority_warning" ? "#f7d585" : profile.threat === "engaged" ? "#f1c76a" : "#a9f0dc";
  ctx.lineWidth = profile.selected ? 2.4 : 1.8;
  ctx.setLineDash(profile.intent === "retreating" ? [4, 4] : []);
  ctx.beginPath();
  ctx.ellipse(cx, cy + 7, profile.selected ? 40 : 32, profile.selected ? 23 : 18, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  if (profile.marker === "priority_warning") {
    ctx.fillStyle = "#f7d585";
    ctx.globalAlpha = 0.58;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 35);
    ctx.lineTo(cx + 7, cy - 22);
    ctx.lineTo(cx - 7, cy - 22);
    ctx.closePath();
    ctx.fill();
  }
  if (profile.intent === "attacking" || profile.intent === "capturing") {
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = profile.intent === "capturing" ? "#d8f3dc" : "#f1c76a";
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy + 27);
    ctx.lineTo(cx, cy + 17);
    ctx.lineTo(cx + 12, cy + 27);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSquadSelectionRing(squad) {
  const cx = squad.x * TILE;
  const cy = squad.y * TILE;
  ctx.save();
  ctx.strokeStyle = "#a9f0dc";
  ctx.lineWidth = 3;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.ellipse(cx, cy + 5, 34, 20, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(216, 243, 220, 0.65)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 5, 25, 14, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(169, 240, 220, 0.78)";
  ctx.lineWidth = 2;
  for (let index = 0; index < 6; index += 1) {
    const angle = index * Math.PI / 3;
    const innerX = cx + Math.cos(angle) * 28;
    const innerY = cy + 5 + Math.sin(angle) * 16;
    const outerX = cx + Math.cos(angle) * 38;
    const outerY = cy + 5 + Math.sin(angle) * 22;
    ctx.beginPath();
    ctx.moveTo(innerX, innerY);
    ctx.lineTo(outerX, outerY);
    ctx.stroke();
  }
  if (squad.stance === "attack_move" || squad.target) {
    ctx.fillStyle = "rgba(247, 213, 133, 0.72)";
    const angle = squad.target ? Math.atan2(squad.target.y - squad.y, squad.target.x - squad.x) : 0;
    for (let index = 0; index < 3; index += 1) {
      const radius = 34 + index * 7;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + 5 + Math.sin(angle) * (radius * 0.56);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-4, -5);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawSquadSilhouette(squad, art) {
  const type = data.squads.get(squad.squadId);
  const members = Math.max(1, Math.min(type?.size ?? 4, 7));
  const cx = squad.x * TILE;
  const cy = squad.y * TILE;
  const equipment = squadEquipmentProfile(art);
  const sprite = alphaSquadSprite(squad);
  const factionMark = squadFactionMark(
    { ...squad, selected: state.selectedSquadIds.includes(squad.id) },
    factionReadabilityContext()
  );
  ctx.save();
  ctx.fillStyle = art.palette.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 7, 28, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  drawSquadFactionBase(cx, cy, factionMark);
  if (drawAlphaArtSprite(ctx, sprite, cx, cy + 20, {
    alpha: squad.hp > 0 ? 1 : 0.5,
    flipX: squad.owner === "enemy"
  })) {
    drawSquadShowcaseFactionDetails(cx, cy, factionMark, squadProductionFormProfile({
      id: squad.squadId ?? squad.id,
      mapPresentation: art
    }), squad);
    drawSquadRoleStandard(cx, cy, art.shapeProfile?.roleStandard, art, squad);
    drawEntityEmblemBadge(cx, cy + 18, art.shapeProfile?.labelPriority === "support" ? 7 : 9, art);
    ctx.restore();
    return;
  }
  const form = squadProductionFormProfile({
    id: squad.squadId ?? squad.id,
    mapPresentation: art
  });
  const bodyProfile = squadBodySilhouetteProfile({
    id: squad.squadId ?? squad.id,
    mapPresentation: art
  });
  drawSquadDepthFidelityMarks(cx, cy, art, squadDepthFidelityProfile({
    ...squad,
    selected: state.selectedSquadIds.includes(squad.id),
    mapPresentation: art
  }));
  drawSquadProductionMotion(cx, cy, art, form);
  drawSquadShowcaseFactionDetails(cx, cy, factionMark, form, squad);
  const offsets = squadFormationOffsets(squad.formation ?? art.shapeProfile?.footprint ?? art.silhouette, members, art.shapeProfile);
  for (const [index, offset] of offsets.entries()) {
    drawSquadMember(cx + offset.x, cy + offset.y, art, squad.stance, index, equipment, factionMark, bodyProfile);
  }
  drawSquadRoleStandard(cx, cy, art.shapeProfile?.roleStandard, art, squad);
  drawEntityEmblemBadge(cx, cy + 18, art.shapeProfile?.labelPriority === "support" ? 7 : 9, art);
  ctx.restore();
}

function drawSquadDepthFidelityMarks(cx, cy, art, profile) {
  if (!profile.depthReady) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = "rgba(5, 8, 11, 0.78)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 14, 34, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = profile.stateLayer === "selected_depth_halo" ? 0.56 : 0.34;
  ctx.strokeStyle = profile.stateLayer === "selected_depth_halo" ? "#f2e7b4" : art.palette.stroke;
  ctx.lineWidth = profile.stateLayer === "selected_depth_halo" ? 2 : 1.45;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 5, 30, 17, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.42;
  ctx.strokeStyle = art.palette.stroke;
  ctx.lineWidth = 1.7;
  if (profile.formationLayer === "wedge_depth_offsets") {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 18);
      ctx.lineTo(cx + side * 29, cy + 18);
      ctx.stroke();
    }
  } else if (profile.formationLayer === "rank_depth_offsets") {
    for (const offset of [-10, 0, 10]) {
      ctx.beginPath();
      ctx.moveTo(cx - 29, cy + offset);
      ctx.lineTo(cx + 29, cy + offset + 5);
      ctx.stroke();
    }
  } else if (profile.formationLayer === "ring_depth_offsets") {
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 31, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    for (const offset of [-16, 16]) {
      ctx.beginPath();
      ctx.moveTo(cx + offset, cy - 12);
      ctx.lineTo(cx + offset * 0.6, cy + 19);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 0.32;
  ctx.strokeStyle = art.palette.accent;
  ctx.beginPath();
  ctx.moveTo(cx - 26, cy + 20);
  ctx.quadraticCurveTo(cx, cy + 29, cx + 26, cy + 20);
  ctx.stroke();
  ctx.restore();
}

function drawSquadProductionMotion(cx, cy, art, form) {
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.strokeStyle = art.palette.accent;
  ctx.fillStyle = art.palette.accent;
  ctx.lineWidth = 1.6;

  if (form.motionCue === "charge_wedge") {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 24);
    ctx.lineTo(cx + 24, cy + 15);
    ctx.lineTo(cx, cy + 6);
    ctx.lineTo(cx - 24, cy + 15);
    ctx.closePath();
    ctx.stroke();
  } else if (form.motionCue === "volley_line") {
    for (const offset of [-10, 0, 10]) {
      ctx.beginPath();
      ctx.moveTo(cx - 27, cy + offset);
      ctx.lineTo(cx + 27, cy + offset - 4);
      ctx.stroke();
    }
  } else if (form.motionCue === "ritual_orbit") {
    ctx.beginPath();
    ctx.ellipse(cx, cy + 3, 29, 16, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (let index = 0; index < 4; index += 1) {
      const angle = index * Math.PI / 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle) * 20, cy + 3 + Math.sin(angle) * 10, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (form.motionCue === "siege_roll") {
    for (const offset of [-17, 17]) {
      ctx.beginPath();
      ctx.arc(cx + offset, cy + 17, 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - 27, cy + 22);
    ctx.lineTo(cx + 27, cy + 22);
    ctx.stroke();
  } else if (form.motionCue === "wide_scout") {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.quadraticCurveTo(cx, cy, cx + side * 34, cy - 5);
      ctx.quadraticCurveTo(cx + side * 18, cy + 8, cx + side * 8, cy + 18);
      ctx.stroke();
    }
  } else if (form.motionCue === "stagger_mob") {
    for (let index = 0; index < 5; index += 1) {
      const px = cx - 19 + index * 9;
      ctx.beginPath();
      ctx.moveTo(px, cy + 18);
      ctx.lineTo(px + (index % 2 === 0 ? -4 : 4), cy + 25);
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - 25, cy + 18);
    ctx.lineTo(cx + 25, cy + 18);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSquadShowcaseFactionDetails(cx, cy, mark, form, squad) {
  ctx.save();
  ctx.globalAlpha = state.selectedSquadIds.includes(squad.id) ? 0.66 : 0.46;
  ctx.strokeStyle = mark.trim;
  ctx.fillStyle = mark.trim;
  ctx.lineWidth = 1.35;

  if (mark.squadForm === "antler_bramble") {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + side * 8, cy - 21);
      ctx.quadraticCurveTo(cx + side * 18, cy - 35, cx + side * 31, cy - 25);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + side * 20, cy - 31);
      ctx.lineTo(cx + side * 26, cy - 39);
      ctx.moveTo(cx + side * 24, cy - 28);
      ctx.lineTo(cx + side * 34, cy - 32);
      ctx.stroke();
    }
    for (let root = 0; root < 4; root += 1) {
      const px = cx - 20 + root * 13;
      ctx.beginPath();
      ctx.moveTo(px, cy + 19);
      ctx.quadraticCurveTo(cx, cy + 27, cx + 20 - root * 10, cy + 18);
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 25);
    ctx.lineTo(cx, cy + 24);
    ctx.stroke();
    for (let rib = 0; rib < 5; rib += 1) {
      const py = cy - 16 + rib * 8;
      ctx.beginPath();
      ctx.moveTo(cx, py);
      ctx.quadraticCurveTo(cx - 20, py + 5, cx - 28, py + 1);
      ctx.moveTo(cx, py);
      ctx.quadraticCurveTo(cx + 20, py + 5, cx + 28, py + 1);
      ctx.stroke();
    }
    if (form.equipmentCue === "claw" || form.bodyCue === "bone_thrall") {
      for (let claw = 0; claw < 3; claw += 1) {
        ctx.beginPath();
        ctx.moveTo(cx + 16 + claw * 5, cy - 18 + claw * 6);
        ctx.lineTo(cx + 30 + claw * 4, cy - 27 + claw * 4);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawSquadRoleStandard(cx, cy, standard, art, squad) {
  if (!standard?.kind) {
    return;
  }
  const selected = state.selectedSquadIds.includes(squad.id);
  const color = selected ? "#f2e7b4" : art.palette.accent;
  const trim = squad.owner === "enemy" ? "#d6a6ff" : squad.owner === "ally" ? "#b6d4f0" : "#a9f0dc";
  const visualSize = Math.max(34, Number(standard.visualSize) || 38);
  const glyphScale = Math.max(0.92, Math.min(1.26, visualSize / 38));
  ctx.save();
  ctx.translate(cx, cy - 30);
  if (standard.contrast === "high") {
    ctx.globalAlpha = selected ? 0.58 : 0.42;
    ctx.fillStyle = "rgba(5, 9, 11, 0.72)";
    ctx.beginPath();
    ctx.ellipse(0, 5, visualSize * 0.56, visualSize * 0.39, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.scale(glyphScale, glyphScale);
  ctx.strokeStyle = color;
  ctx.fillStyle = trim;
  ctx.lineWidth = selected ? 2.5 : 1.8;
  ctx.globalAlpha = selected ? 0.94 : 0.72;

  if (standard.kind === "shield_pennant") {
    ctx.beginPath();
    ctx.moveTo(-12, -6);
    ctx.lineTo(-12, 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-11, -7);
    ctx.lineTo(12, -2);
    ctx.lineTo(-11, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(-4, 5, 14, 15, 5);
    ctx.stroke();
  } else if (standard.kind === "bow_arc") {
    ctx.beginPath();
    ctx.arc(1, 4, 18, -Math.PI * 0.72, Math.PI * 0.72);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(13, -10);
    ctx.lineTo(13, 18);
    ctx.moveTo(-5, 4);
    ctx.lineTo(20, 4);
    ctx.stroke();
  } else if (standard.kind === "lance_wedge") {
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(17, 14);
    ctx.lineTo(0, 7);
    ctx.lineTo(-17, 14);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(0, 20);
    ctx.stroke();
  } else if (standard.kind === "staff_bloom") {
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(0, 18);
    ctx.stroke();
    for (let index = 0; index < 6; index += 1) {
      const angle = index * Math.PI / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 4, -12 + Math.sin(angle) * 4);
      ctx.lineTo(Math.cos(angle) * 15, -12 + Math.sin(angle) * 15);
      ctx.stroke();
    }
  } else if (standard.kind === "root_crown") {
    ctx.beginPath();
    ctx.moveTo(-16, 10);
    ctx.quadraticCurveTo(-8, -10, 0, 6);
    ctx.quadraticCurveTo(8, -10, 16, 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-13, -1);
    ctx.lineTo(-4, -11);
    ctx.lineTo(0, 2);
    ctx.lineTo(6, -12);
    ctx.lineTo(14, -2);
    ctx.stroke();
  } else if (standard.kind === "wagon_axle") {
    ctx.strokeRect(-16, -4, 32, 13);
    ctx.beginPath();
    ctx.moveTo(-22, 11);
    ctx.lineTo(22, 11);
    ctx.stroke();
    for (const wheelX of [-13, 13]) {
      ctx.beginPath();
      ctx.arc(wheelX, 14, 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (standard.kind === "rib_mob") {
    ctx.beginPath();
    ctx.ellipse(0, 5, 18, 13, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (const ribX of [-10, -5, 0, 5, 10]) {
      ctx.beginPath();
      ctx.moveTo(ribX, -5);
      ctx.quadraticCurveTo(ribX * 0.45, 3, ribX, 14);
      ctx.stroke();
    }
  } else if (standard.kind === "wing_pair") {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.quadraticCurveTo(side * 12, -14, side * 27, 0);
      ctx.quadraticCurveTo(side * 13, 5, side * 6, 17);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawSquadFactionBase(cx, cy, mark) {
  ctx.save();
  ctx.globalAlpha = mark.selectedRing === "command_focus" ? 0.46 : 0.28;
  ctx.strokeStyle = mark.trim;
  ctx.lineWidth = mark.selectedRing === "command_focus" ? 2 : 1.3;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 8, 23, 12, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (mark.baseMark === "root_ring") {
    ctx.globalAlpha *= 0.7;
    for (let index = 0; index < 3; index += 1) {
      const angle = index * Math.PI * 0.64;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 8, cy + 8 + Math.sin(angle) * 5);
      ctx.lineTo(cx + Math.cos(angle) * 24, cy + 8 + Math.sin(angle) * 12);
      ctx.stroke();
    }
    if (mark.groundTexture === "root_lattice") {
      for (let index = 0; index < 2; index += 1) {
        ctx.beginPath();
        ctx.moveTo(cx - 20 + index * 12, cy + 17);
        ctx.quadraticCurveTo(cx - 3 + index * 10, cy + 2, cx + 18 - index * 8, cy + 17);
        ctx.stroke();
      }
    }
  } else {
    ctx.globalAlpha *= 0.8;
    for (let index = 0; index < 4; index += 1) {
      const px = cx - 13 + index * 8;
      ctx.beginPath();
      ctx.arc(px, cy + 9, 3, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
    if (mark.groundTexture === "grave_teeth") {
      for (let index = 0; index < 5; index += 1) {
        const px = cx - 18 + index * 9;
        ctx.beginPath();
        ctx.moveTo(px - 2, cy + 18);
        ctx.lineTo(px, cy + 12);
        ctx.lineTo(px + 2, cy + 18);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function squadFormationOffsets(silhouette, members, profile) {
  if (profile?.footprint === "single" || silhouette === "bone_wagon" || silhouette === "ancient") {
    return [{ x: 0, y: 0 }];
  }
  if (profile?.footprint === "wedge" || silhouette.includes("wedge") || silhouette.includes("lancer") || silhouette.includes("knight")) {
    return [
      { x: 0, y: -11 },
      { x: -10, y: 0 },
      { x: 10, y: 0 },
      { x: -18, y: 10 },
      { x: 18, y: 10 },
      { x: 0, y: 12 }
    ].slice(0, members);
  }
  if (profile?.footprint === "line" || silhouette.includes("line")) {
    return Array.from({ length: members }, (_, index) => ({ x: (index - (members - 1) / 2) * 8, y: index % 2 === 0 ? -2 : 7 }));
  }
  if (profile?.footprint === "ring" || silhouette.includes("ring") || silhouette.includes("circle")) {
    return Array.from({ length: members }, (_, index) => {
      const angle = (Math.PI * 2 * index) / members;
      return { x: Math.cos(angle) * 13, y: Math.sin(angle) * 8 };
    });
  }
  return Array.from({ length: members }, (_, index) => ({ x: ((index % 3) - 1) * 9, y: Math.floor(index / 3) * 8 - 7 }));
}

function drawSquadMember(x, y, art, stance, index, equipment, factionMark, bodyProfile) {
  const profile = art.shapeProfile ?? {};
  const radius = (["ancient", "bone_wagon"].includes(art.silhouette) ? 16 : 6) * (profile.scale ?? 1);
  ctx.fillStyle = index % 2 === 0 ? art.palette.fill : art.palette.accent;
  ctx.strokeStyle = art.palette.stroke;
  ctx.lineWidth = stance === "retreat" ? 3 : 2;
  if (profile.memberShape === "shield") {
    ctx.beginPath();
    ctx.moveTo(x, y - radius * 1.25);
    ctx.lineTo(x + radius * 0.95, y - radius * 0.35);
    ctx.lineTo(x + radius * 0.72, y + radius * 1.05);
    ctx.lineTo(x, y + radius * 1.35);
    ctx.lineTo(x - radius * 0.72, y + radius * 1.05);
    ctx.lineTo(x - radius * 0.95, y - radius * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (profile.memberShape === "needle_archer" || art.silhouette.includes("archer") || art.silhouette.includes("bow")) {
    ctx.beginPath();
    ctx.moveTo(x - radius, y + radius);
    ctx.lineTo(x, y - radius);
    ctx.lineTo(x + radius, y + radius);
    ctx.stroke();
  } else if (profile.memberShape === "lancer" || art.silhouette.includes("lancer") || art.silhouette.includes("rider") || art.silhouette.includes("knight")) {
    ctx.beginPath();
    ctx.moveTo(x, y - radius * 1.25);
    ctx.lineTo(x + radius, y + radius);
    ctx.lineTo(x - radius, y + radius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, y + radius * 0.42, radius * 1.08, radius * 0.52, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (profile.memberShape === "moth" || profile.memberShape === "bat_wing" || art.silhouette.includes("bat")) {
    ctx.beginPath();
    ctx.ellipse(x - radius * 0.55, y, radius, radius * 0.55, -0.45, 0, Math.PI * 2);
    ctx.ellipse(x + radius * 0.55, y, radius, radius * 0.55, 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (profile.memberShape === "caster") {
    ctx.beginPath();
    ctx.ellipse(x, y + radius * 0.15, radius * 0.82, radius * 1.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y - radius * 0.95, radius * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (profile.memberShape === "ancient") {
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 0.78, radius * 1.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + side * radius * 0.5, y + radius * 0.1);
      ctx.quadraticCurveTo(x + side * radius * 1.35, y - radius * 0.35, x + side * radius * 1.65, y + radius * 0.45);
      ctx.stroke();
    }
  } else if (profile.memberShape === "bone_wagon") {
    ctx.beginPath();
    ctx.roundRect(x - radius * 1.1, y - radius * 0.55, radius * 2.2, radius * 1.1, radius * 0.24);
    ctx.fill();
    ctx.stroke();
    for (const side of [-0.65, 0.65]) {
      ctx.beginPath();
      ctx.arc(x + side * radius, y + radius * 0.66, radius * 0.28, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (profile.memberShape === "bone_thrall") {
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.75, y - radius * 0.9);
    ctx.lineTo(x + radius * 0.65, y - radius * 0.68);
    ctx.lineTo(x + radius * 0.88, y + radius * 0.72);
    ctx.lineTo(x - radius * 0.48, y + radius * 1.05);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.roundRect(x - radius, y - radius, radius * 2, radius * 2, radius * 0.45);
    ctx.fill();
    ctx.stroke();
  }
  drawSquadBodyArticulation(x, y, radius, art, bodyProfile, index);
  drawSquadEquipment(x, y, radius, art, equipment, stance, index);
  drawSquadFactionMemberMark(x, y, radius, factionMark, index);
}

function drawSquadBodyArticulation(x, y, radius, art, bodyProfile, index) {
  if (!bodyProfile?.bodyPolishReady) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = index % 2 === 0 ? 0.78 : 0.58;
  ctx.strokeStyle = art.palette.stroke;
  ctx.fillStyle = art.palette.accent;
  ctx.lineWidth = Math.max(1.05, radius * 0.16);

  if (bodyProfile.bodyKind === "shieldwall_guard") {
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.72, y - radius * 0.18);
    ctx.lineTo(x + radius * 0.72, y - radius * 0.18);
    ctx.moveTo(x - radius * 0.48, y + radius * 0.72);
    ctx.lineTo(x + radius * 0.48, y + radius * 0.72);
    ctx.stroke();
  } else if (bodyProfile.bodyKind === "needle_archer" || bodyProfile.bodyKind === "grave_bow") {
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.62, y + radius * 0.86);
    ctx.lineTo(x + radius * 0.74, y - radius * 0.92);
    ctx.stroke();
    for (let spike = 0; spike < 3; spike += 1) {
      ctx.beginPath();
      ctx.moveTo(x - radius * 0.52 + spike * radius * 0.28, y + radius * 0.92);
      ctx.lineTo(x - radius * 0.2 + spike * radius * 0.22, y + radius * 1.28);
      ctx.stroke();
    }
    if (bodyProfile.bodyKind === "grave_bow") {
      ctx.beginPath();
      ctx.arc(x, y - radius * 0.74, radius * 0.42, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
    }
  } else if (bodyProfile.bodyKind === "mounted_lancer" || bodyProfile.bodyKind === "crypt_lancer" || bodyProfile.bodyKind === "elite_hunt_rider" || bodyProfile.bodyKind === "dread_knight") {
    ctx.beginPath();
    ctx.ellipse(x, y + radius * 0.45, radius * 1.18, radius * 0.46, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - radius * 1.28);
    ctx.lineTo(x - radius * 0.42, y - radius * 1.74);
    ctx.moveTo(x, y - radius * 1.28);
    ctx.lineTo(x + radius * 0.42, y - radius * 1.74);
    ctx.stroke();
    if (bodyProfile.bodyKind === "elite_hunt_rider") {
      ctx.beginPath();
      ctx.moveTo(x - radius * 0.5, y + radius * 0.1);
      ctx.quadraticCurveTo(x - radius * 1.35, y + radius * 1.1, x - radius * 0.2, y + radius * 1.28);
      ctx.stroke();
    } else if (bodyProfile.bodyKind === "dread_knight" || bodyProfile.bodyKind === "crypt_lancer") {
      ctx.beginPath();
      ctx.rect(x - radius * 0.42, y - radius * 0.54, radius * 0.84, radius * 0.55);
      ctx.stroke();
    }
  } else if (bodyProfile.bodyKind === "moth_scout" || bodyProfile.bodyKind === "bat_flight") {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + side * radius * 0.82, y - radius * 0.38, x + side * radius * 1.35, y + radius * 0.18);
      ctx.stroke();
    }
    if (bodyProfile.bodyKind === "moth_scout") {
      ctx.beginPath();
      ctx.moveTo(x - radius * 0.2, y - radius * 0.72);
      ctx.quadraticCurveTo(x - radius * 0.88, y - radius * 1.34, x - radius * 1.18, y - radius);
      ctx.moveTo(x + radius * 0.2, y - radius * 0.72);
      ctx.quadraticCurveTo(x + radius * 0.88, y - radius * 1.34, x + radius * 1.18, y - radius);
      ctx.stroke();
    } else {
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x + side * radius * 0.9, y + radius * 0.16);
        ctx.lineTo(x + side * radius * 1.35, y + radius * 0.52);
        ctx.stroke();
      }
    }
  } else if (bodyProfile.bodyKind === "dew_chanter" || bodyProfile.bodyKind === "mourning_choir") {
    ctx.beginPath();
    ctx.arc(x, y - radius * 0.84, radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + radius * 0.76, y + radius * 0.92);
    ctx.lineTo(x + radius * 0.76, y - radius * 1.52);
    ctx.stroke();
    if (bodyProfile.bodyKind === "mourning_choir") {
      ctx.beginPath();
      ctx.moveTo(x - radius * 0.58, y - radius * 0.15);
      ctx.lineTo(x + radius * 0.58, y - radius * 0.15);
      ctx.stroke();
    }
  } else if (bodyProfile.bodyKind === "bark_ancient") {
    for (let plate = 0; plate < 3; plate += 1) {
      ctx.beginPath();
      ctx.moveTo(x - radius * 0.36, y - radius * 0.55 + plate * radius * 0.38);
      ctx.lineTo(x + radius * 0.36, y - radius * 0.44 + plate * radius * 0.38);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.62, y - radius * 1.12);
    ctx.lineTo(x, y - radius * 1.58);
    ctx.lineTo(x + radius * 0.62, y - radius * 1.12);
    ctx.stroke();
  } else if (bodyProfile.bodyKind === "rib_thrall") {
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.28, y - radius * 0.92);
    ctx.quadraticCurveTo(x + radius * 0.42, y - radius * 0.1, x - radius * 0.1, y + radius * 0.98);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y - radius * 0.88, radius * 0.28, 0, Math.PI * 2);
    ctx.fill();
  } else if (bodyProfile.bodyKind === "siege_carriage") {
    ctx.beginPath();
    ctx.moveTo(x - radius * 1.2, y + radius * 0.2);
    ctx.lineTo(x + radius * 1.2, y + radius * 0.2);
    ctx.stroke();
    for (let rib = 0; rib < 3; rib += 1) {
      const px = x - radius * 0.5 + rib * radius * 0.5;
      ctx.beginPath();
      ctx.moveTo(px, y - radius * 0.44);
      ctx.lineTo(px + radius * 0.16, y + radius * 0.36);
      ctx.stroke();
    }
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + side * radius * 0.96, y - radius * 0.18);
      ctx.lineTo(x + side * radius * 1.38, y - radius * 0.58);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawSquadFactionMemberMark(x, y, radius, mark, index) {
  ctx.save();
  ctx.strokeStyle = mark.trim;
  ctx.fillStyle = mark.trim;
  ctx.globalAlpha = index % 2 === 0 ? 0.74 : 0.5;
  ctx.lineWidth = 1.2;
  if (mark.unitMark === "antler_spikes") {
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.65, y - radius * 0.95);
    ctx.lineTo(x - radius * 1.2, y - radius * 1.55);
    ctx.moveTo(x + radius * 0.65, y - radius * 0.95);
    ctx.lineTo(x + radius * 1.2, y - radius * 1.55);
    ctx.stroke();
    if (mark.squadForm === "antler_bramble") {
      ctx.beginPath();
      ctx.moveTo(x - radius * 1.02, y - radius * 1.34);
      ctx.lineTo(x - radius * 1.4, y - radius * 1.22);
      ctx.moveTo(x + radius * 1.02, y - radius * 1.34);
      ctx.lineTo(x + radius * 1.4, y - radius * 1.22);
      ctx.moveTo(x - radius * 0.15, y + radius * 0.82);
      ctx.quadraticCurveTo(x - radius * 0.72, y + radius * 0.2, x - radius * 0.34, y - radius * 0.62);
      ctx.moveTo(x + radius * 0.15, y + radius * 0.82);
      ctx.quadraticCurveTo(x + radius * 0.72, y + radius * 0.2, x + radius * 0.34, y - radius * 0.62);
      ctx.stroke();
    }
  } else {
    for (let rib = 0; rib < 2; rib += 1) {
      ctx.beginPath();
      ctx.arc(x, y - radius * 0.15 + rib * radius * 0.42, radius * 0.72, Math.PI * 0.08, Math.PI * 0.92);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x - radius * 0.28, y - radius * 0.24, 1.3, 0, Math.PI * 2);
    ctx.arc(x + radius * 0.28, y - radius * 0.24, 1.3, 0, Math.PI * 2);
    ctx.fill();
    if (mark.squadForm === "ribcage_bone") {
      ctx.beginPath();
      ctx.moveTo(x, y - radius * 1.18);
      ctx.lineTo(x, y + radius * 1.05);
      for (let tick = 0; tick < 3; tick += 1) {
        const py = y - radius * 0.62 + tick * radius * 0.45;
        ctx.moveTo(x, py);
        ctx.lineTo(x - radius * 0.78, py + radius * 0.14);
        ctx.moveTo(x, py);
        ctx.lineTo(x + radius * 0.78, py + radius * 0.14);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawSquadEquipment(x, y, radius, art, equipment, stance, index) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = stance === "retreat" ? 2.3 : 1.8;
  ctx.strokeStyle = equipment.glow ? art.palette.accent : "#111616";
  ctx.fillStyle = art.palette.stroke;
  if (equipment.weapon === "bow") {
    ctx.beginPath();
    ctx.arc(x + radius * 0.35, y, radius * 1.25, -1.05, 1.05);
    ctx.moveTo(x + radius * 0.35, y - radius * 1.05);
    ctx.lineTo(x + radius * 0.35, y + radius * 1.05);
    ctx.stroke();
  } else if (equipment.weapon === "lance") {
    ctx.beginPath();
    ctx.moveTo(x - radius * 1.1, y + radius * 0.7);
    ctx.lineTo(x + radius * 1.45, y - radius * 1.35);
    ctx.stroke();
  } else if (equipment.weapon === "staff") {
    ctx.beginPath();
    ctx.moveTo(x + radius * 0.85, y + radius);
    ctx.lineTo(x + radius * 0.85, y - radius * 1.55);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + radius * 0.85, y - radius * 1.65, Math.max(2.5, radius * 0.35), 0, Math.PI * 2);
    ctx.fill();
  } else if (equipment.weapon === "claw") {
    for (let claw = 0; claw < 3; claw += 1) {
      ctx.beginPath();
      ctx.moveTo(x + radius * 0.55, y - radius * 0.55 + claw * radius * 0.35);
      ctx.lineTo(x + radius * 1.25, y - radius * 0.95 + claw * radius * 0.32);
      ctx.stroke();
    }
  } else if (equipment.weapon === "knife") {
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.25, y + radius * 0.75);
    ctx.lineTo(x + radius * 0.75, y - radius * 0.35);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.9, y + radius);
    ctx.lineTo(x + radius * 1.1, y - radius * 1.2);
    ctx.stroke();
  }
  if (equipment.shield) {
    ctx.globalAlpha = 0.86;
    ctx.fillStyle = index % 2 === 0 ? art.palette.stroke : art.palette.shadow;
    ctx.beginPath();
    ctx.ellipse(x - radius * 0.52, y + radius * 0.15, radius * 0.55, radius * 0.75, 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  if (equipment.glow) {
    ctx.globalAlpha = 0.36;
    ctx.strokeStyle = art.palette.accent;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.45, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEntityEmblemBadge(cx, cy, size, art) {
  const text = art.emblemLabel;
  if (!text) {
    return;
  }
  const width = Math.max(size * 1.5, text.length * size * 0.72 + 8);
  const height = size * 1.28;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "rgba(17, 22, 22, 0.76)";
  ctx.strokeStyle = art.palette.stroke;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(cx - width / 2, cy - height / 2, width, height, Math.min(5, height / 2));
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = art.palette.accent;
  ctx.font = `700 ${Math.max(8, Math.floor(size * 0.72))}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 0.5, width - 4);
  ctx.restore();
}

function drawCrystal(x, y, height, fill, stroke) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.beginPath();
  ctx.moveTo(x, y - height);
  ctx.lineTo(x + height * 0.42, y - height * 0.25);
  ctx.lineTo(x + height * 0.22, y + height * 0.18);
  ctx.lineTo(x - height * 0.32, y + height * 0.1);
  ctx.lineTo(x - height * 0.4, y - height * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawHeroCommandPresence() {
  if (!state.heroes.length) {
    return;
  }
  const selectedSquads = currentSelectedPlayerSquads();
  if (!selectedSquads.length) {
    return;
  }
  const hero = state.heroes[0];
  const definition = data.heroes.get(hero.heroId);
  if (!definition) {
    return;
  }
  const treatment = runtimeHeroCommandTreatment(hero, {
    heroes: data.heroes,
    abilities: data.abilities,
    selectedSquads,
    ...factionReadabilityContext()
  });
  const profile = heroCommandProfile(definition, { abilities: data.abilities });
  const faction = data.factions.get(definition.faction);
  const primary = faction?.colors?.primary ?? "#d8f3dc";
  const accent = faction?.colors?.accent ?? "#9fcfba";

  ctx.save();
  ctx.lineWidth = 2;
  selectedSquads.slice(0, 3).forEach((squad, index) => {
    const x = squad.x * TILE;
    const y = squad.y * TILE - 34 - index * 2;
    ctx.strokeStyle = "rgba(9, 13, 15, 0.92)";
    ctx.fillStyle = "rgba(9, 13, 15, 0.8)";
    ctx.beginPath();
    ctx.roundRect(x - 18, y - 15, 36, 26, 5);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = primary;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(x, y - 14);
    ctx.lineTo(x + 14, y - 2);
    ctx.lineTo(x, y + 10);
    ctx.lineTo(x - 14, y - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 18, y + 12);
    ctx.lineTo(x - 5, y + 22);
    ctx.moveTo(x + 18, y + 12);
    ctx.lineTo(x + 5, y + 22);
    ctx.stroke();
    drawHeroCommandGlyph(x, y - 1, profile, treatment, primary);
  });
  ctx.restore();
}

function drawHeroCommandGlyph(x, y, profile, treatment, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  if (profile.commandFrameKind === "moon_crown_commander") {
    ctx.beginPath();
    ctx.arc(x, y, 8, Math.PI * 0.18, Math.PI * 1.36);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 7, y + 6);
    ctx.lineTo(x, y - 9);
    ctx.lineTo(x + 7, y + 6);
    ctx.stroke();
  } else if (profile.commandFrameKind === "hart_banner_commander") {
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.lineTo(x, y - 8);
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x - 8, y - 12);
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x + 8, y - 12);
    ctx.stroke();
  } else if (profile.commandFrameKind === "bone_crown_commander") {
    ctx.strokeRect(x - 7, y - 5, 14, 12);
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + i * 6, y - 5);
      ctx.lineTo(x + i * 4, y - 12);
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.arc(x, y - 2, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 8);
    ctx.quadraticCurveTo(x, y + 13, x + 8, y + 8);
    ctx.stroke();
  }
  if (treatment.readinessKind === "ready_tactical_order") {
    ctx.beginPath();
    ctx.arc(x + 12, y - 11, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHeroPanel() {
  if (!state.heroes.length) {
    return;
  }
  const visibleHeroes = state.heroes.slice(0, 3);
  const panelWidth = Math.min(340, Math.max(260, canvas.width - 32));
  const rowHeight = 34;
  const panelHeight = 34 + visibleHeroes.length * rowHeight;
  const panelX = 16;
  const panelY = canvas.height - panelHeight - 16;
  ctx.fillStyle = "rgba(17, 22, 22, 0.84)";
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
  ctx.strokeStyle = "#9fcfba";
  ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
  ctx.fillStyle = "#edf4ef";
  ctx.font = "14px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(data.factions.get(state.playerFaction)?.name ?? label(state.playerFaction), panelX + 12, panelY + 22, panelWidth - 24);
  visibleHeroes.forEach((hero, index) => {
    const definition = data.heroes.get(hero.heroId);
    if (!definition) {
      return;
    }
    const profile = heroCommandProfile(definition, { abilities: data.abilities });
    const treatment = runtimeHeroCommandTreatment(hero, {
      heroes: data.heroes,
      abilities: data.abilities,
      selectedSquads: currentSelectedPlayerSquads(),
      ...factionReadabilityContext()
    });
    const rowY = panelY + 42 + index * rowHeight;
    drawHeroPortraitMark(panelX + 24, rowY + 3, profile, treatment);
    const ability = heroTacticalAbilityStatus(hero);
    const abilityText = ability ? `${ability.name} ${ability.cooldown > 0 ? `${ability.cooldown}s` : "ready"}` : "No order ready";
    ctx.fillStyle = "#edf4ef";
    ctx.font = "12px system-ui";
    ctx.fillText(`${definition.name} L${hero.level} XP ${Math.round(hero.xp ?? 0)}`, panelX + 48, rowY - 2, panelWidth - 58);
    ctx.fillStyle = treatment.readinessKind === "ready_tactical_order" ? "#d8f3dc" : "#b7a7d5";
    ctx.fillText(abilityText, panelX + 48, rowY + 14, panelWidth - 58);
  });
}

function heroTacticalAbilityStatus(hero) {
  const definition = data.heroes.get(hero.heroId);
  const tacticalAbilities = tacticalHeroAbilities(definition ?? {});
  if (!tacticalAbilities.length) {
    return null;
  }
  const ready = tacticalAbilities.find((ability) => Number(hero.cooldowns?.[ability.id] ?? 0) <= 0);
  const ability = ready ?? tacticalAbilities[0];
  return {
    name: ability.name,
    cooldown: Math.max(0, Math.ceil(Number(hero.cooldowns?.[ability.id] ?? 0)))
  };
}

function drawHeroPortraitMark(x, y, profile, treatment) {
  const faction = data.factions.get(profile.faction);
  const primary = faction?.colors?.primary ?? "#d8f3dc";
  const accent = faction?.colors?.accent ?? "#9fcfba";
  ctx.save();
  ctx.fillStyle = "rgba(6, 10, 12, 0.92)";
  ctx.strokeStyle = primary;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(x - 13, y - 13, 26, 26, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  drawHeroCommandGlyph(x, y + 1, profile, treatment, primary);
  ctx.restore();
}

function drawMinimap() {
  const { bounds: { x, y, width, height } } = currentMinimapLayout();
  const livingSquads = state.squads.filter((entry) => entry.hp > 0);
  const mapX = (worldX) => x + (worldX / world.width) * width;
  const mapY = (worldY) => y + (worldY / world.height) * height;

  ctx.fillStyle = "rgba(17, 22, 22, 0.85)";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "#50675f";
  ctx.strokeRect(x, y, width, height);
  for (const objective of visibleObjectives()) {
    const px = mapX(objective.x);
    const py = mapY(objective.y);
    ctx.save();
    ctx.globalAlpha = objective.owner ? 0.96 : 0.78;
    ctx.strokeStyle = objective.owner === "player" ? "#9de2c9" : objective.owner === "enemy" ? "#d6a6ff" : "#f2c46d";
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, py - 5);
    ctx.lineTo(px + 5, py);
    ctx.lineTo(px, py + 5);
    ctx.lineTo(px - 5, py);
    ctx.closePath();
    ctx.stroke();
    if (isObjectiveContested(objective)) {
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  for (const building of state.buildings) {
    ctx.fillStyle = building.owner === "player" ? "#9fcfba" : building.owner === "ally" ? "#b6d4f0" : "#c9c1d9";
    ctx.fillRect(mapX(building.x), mapY(building.y), 4, 4);
  }
  for (const squad of livingSquads) {
    ctx.fillStyle = squad.owner === "player" ? "#d8f3dc" : squad.owner === "ally" ? "#d4e8ff" : "#7651a5";
    const px = mapX(squad.x);
    const py = mapY(squad.y);
    if (squad.stance === "retreat") {
      ctx.beginPath();
      ctx.moveTo(px - 3, py + 3);
      ctx.lineTo(px + 4, py);
      ctx.lineTo(px - 3, py - 3);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(px, py, 3, 3);
    }
  }
  drawMinimapCombatHotspots(x, y, width, height, livingSquads);
  drawMinimapCameraFrame(x, y, width, height);
}

function currentMinimapLayout() {
  return {
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    minEdgeMargin: 12,
    bounds: {
      x: canvas.width - MINIMAP_WIDTH - MINIMAP_MARGIN,
      y: canvas.height - MINIMAP_HEIGHT - MINIMAP_MARGIN,
      width: MINIMAP_WIDTH,
      height: MINIMAP_HEIGHT
    }
  };
}

function drawMinimapCombatHotspots(x, y, width, height, squads) {
  const hotspots = combatHotspots(squads);
  if (hotspots.length <= 0) {
    return;
  }
  ctx.save();
  ctx.strokeStyle = "#f2c46d";
  ctx.fillStyle = "rgba(242, 196, 109, 0.34)";
  ctx.lineWidth = 1.5;
  for (const hotspot of hotspots) {
    const px = x + (hotspot.x / world.width) * width;
    const py = y + (hotspot.y / world.height) * height;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawMinimapCameraFrame(x, y, width, height) {
  const viewport = currentBattlefieldViewport();
  const scale = Math.max(0.001, viewport.scale);
  const viewWorldWidth = viewport.width / scale / TILE;
  const viewWorldHeight = viewport.height / scale / TILE;
  const left = Math.max(0, -viewport.offsetX / scale / TILE);
  const top = Math.max(0, -viewport.offsetY / scale / TILE);
  ctx.save();
  ctx.strokeStyle = "#edf4ef";
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(
    x + (left / world.width) * width + 2,
    y + (top / world.height) * height + 2,
    Math.max(12, (viewWorldWidth / world.width) * width - 4),
    Math.max(9, (viewWorldHeight / world.height) * height - 4)
  );
  ctx.restore();
}

function drawGhost() {
  if (!state.selectedBuild || !isPlaying()) {
    return;
  }
  const building = data.buildings.get(state.selectedBuild);
  const rect = canvas.getBoundingClientRect();
  const mouse = lastMouse ?? { x: rect.width * 0.5, y: rect.height * 0.5 };
  const point = cssPointToWorldPoint(mouse.x, mouse.y, rect);
  if (!point.inBounds) {
    return;
  }
  const tile = { x: Math.floor(point.x), y: Math.floor(point.y) };
  const footprint = rotatedFootprint(building.footprint);
  const valid = validatePlacement(building, tile.x, tile.y).ok;
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = valid ? "#9fcfba" : "#b24a5a";
  ctx.fillRect(tile.x * TILE, tile.y * TILE, footprint.w * TILE, footprint.h * TILE);
  ctx.globalAlpha = 1;
}

function drawHealth(x, y, width, fraction) {
  ctx.fillStyle = "#271b20";
  ctx.fillRect(x, y, width, 5);
  ctx.fillStyle = fraction > 0.45 ? "#9fcfba" : "#b24a5a";
  ctx.fillRect(x, y, width * Math.max(0, Math.min(1, fraction)), 5);
}

function drawMorale(x, y, width, fraction) {
  ctx.fillStyle = "#271b20";
  ctx.fillRect(x, y, width, 4);
  ctx.fillStyle = fraction > 0.65 ? "#d8f3dc" : fraction > 0.35 ? "#e8c36a" : "#b24a5a";
  ctx.fillRect(x, y, width * Math.max(0, Math.min(1, fraction)), 4);
}

function drawBanner(title, subtitle) {
  ctx.fillStyle = "rgba(17, 22, 22, 0.72)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#edf4ef";
  ctx.textAlign = "center";
  ctx.font = "700 42px system-ui";
  ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = "18px system-ui";
  ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 28);
}

let lastMouse = null;
canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  lastMouse = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  render();
});

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(640, Math.floor(rect.width));
  canvas.height = Math.max(420, Math.floor(rect.height));
}

function currentBattlefieldViewport() {
  return fitBattlefieldViewport({
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    worldWidth: WORLD_PIXEL_WIDTH,
    worldHeight: WORLD_PIXEL_HEIGHT
  });
}

function playCue(category, purpose = category) {
  const cue = resolveAudioCue(data.audioCueIndex, category);
  state.audioEvents = recordAudioCueEvent(state.audioEvents, cue, {
    purpose,
    at: state.seconds
  });
  const minInterval = category === "combat" ? 0.35 : category === "ambience" ? 8 : 0.08;
  if ((state.lastAudioAt[cue.category] ?? -Infinity) + minInterval > state.seconds) {
    return;
  }
  state.lastAudioAt[cue.category] = state.seconds;
  state.lastAudioCue = { id: cue.id, category: cue.category };
  if (state.hudSettings.audioMuted) {
    return;
  }
  if (globalThis.navigator?.webdriver) {
    return;
  }
  if (globalThis.navigator?.userActivation && !globalThis.navigator.userActivation.hasBeenActive) {
    return;
  }
  try {
    const AudioContextConstructor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    const audio = new AudioContextConstructor();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = cue.waveform;
    osc.frequency.value = cue.frequency;
    gain.gain.value = cue.gain;
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + cue.seconds);
  } catch {
    // Browser audio may be blocked until user gesture; gameplay continues.
  }
}

function loop() {
  step(1 / 60);
  render();
  requestAnimationFrame(loop);
}

window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i += 1) {
    step(1 / 60);
  }
  render();
};

function makeTextState() {
  return JSON.stringify({
    coordinateSystem: "tile origin top-left, x right, y down",
    mode: state.mode,
    outcome: state.outcome,
    scenarioMode: state.scenarioMode,
    playerFaction: state.playerFaction,
    enemyFaction: state.enemyFaction,
    mapArt: { mapId: showcaseMap().id, terrainFeatureCount: showcaseMap().terrainFeatures?.length ?? 0 },
    alphaArtSprites: alphaArtSpriteCoverageSummary(),
    mapComposition: currentMapCompositionSummary(),
    formationLocalAvoidance: currentFormationLocalAvoidanceSummary(),
    terrainPolish: currentTerrainPolishSummary(),
    northgardWc3Readability: currentNorthgardWc3ReadabilitySummary(),
    factionReadability: currentFactionReadabilitySummary(),
    showcaseFactionArt: currentShowcaseFactionArtSummary(),
    showcaseIconIntegration: currentShowcaseIconIntegrationSummary(),
    showcaseObjectiveArt: currentShowcaseObjectiveArtSummary(),
    showcaseDepthFidelity: currentShowcaseDepthFidelitySummary(),
    showcaseArtPolish: currentShowcaseArtPolishSummary(),
    canvasOverlay: currentCanvasOverlaySummary(),
    menuPresentation: currentMenuPresentationSummary(),
    heroCommandReadability: currentHeroCommandReadabilitySummary(),
    heroFactionBalance: currentHeroFactionBalanceSummary(),
    worldStateReadability: currentWorldStateReadabilitySummary(),
    battlefieldReadability: currentBattlefieldReadabilitySummary(),
    battlefieldViewport: summarizeBattlefieldViewport(currentBattlefieldViewport()),
    guidedPresentation: currentGuidedPresentation(),
    selectionDetail: currentSelectionDetailPanel(),
    hudState: currentHudStateSummary(),
    hudCohesion: currentHudCohesionSummary(),
    stewardEconomy: summarizeStewardEconomy({
      owner: "player",
      buildings: state.buildings,
      definitions: data.buildings
    }),
    localPve: summarizeLocalPveOperation({
      operation: state.localPveOperation,
      allies: state.allies,
      buildings: state.buildings,
      squads: state.squads,
      objectives: state.objectives
    }),
    audio: { ...audioSummary(data.audioCueIndex), lastCue: state.lastAudioCue },
    audioFlow: summarizeAudioFlow(data.audioCueIndex, state.audioEvents),
    combatFeedback: summarizeCombatFeedback(state.combatFeedback),
    combatVfxArtDirection: currentCombatVfxArtDirectionSummary(),
    combatResolutionReadability: currentCombatResolutionReadabilitySummary(),
    combatVfxPolish: summarizeCombatVfxPolish({ events: state.combatFeedback }),
    combatPriority: currentCombatPrioritySummary(),
    combatReadabilityBudget: currentCombatReadabilityBudgetSummary(),
    combatStressProof: currentCombatStressProofSummary(),
    lateGamePacing: currentLateGamePacingSummary(),
    productionFormPolish: summarizeProductionFormPolish({ buildings: data.buildings, squads: data.squads, objectives: data.objectives }),
    visualDensity: summarizeVisualDensity({ buildings: data.buildings, squads: data.squads, objectives: data.objectives }),
    entityArt: summarizeEntityArtCoverage({
      buildings: data.buildings,
      squads: data.squads,
      objectives: data.objectives
    }),
    artPlaceholderAudit: summarizeArtPlaceholderAudit({
      buildings: state.buildings,
      squads: state.squads,
      objectives: visibleObjectives(),
      buildingDefinitions: data.buildings,
      squadDefinitions: data.squads,
      objectiveDefinitions: data.objectives
    }),
    resources: state.resources,
    effects: state.effects,
    enemyEffects: state.enemyEffects,
    housingUsed: state.housingUsed,
    techTier: state.techTier,
    enemyTechTier: state.enemyTechTier,
    selectedSquadIds: [...state.selectedSquadIds],
    selectedSquadCards: squadSelectionCards(state.squads, state.selectedSquadIds, { owner: "player", definitions: data.squads }),
    commandCard: {
      selectedCount: selectedCommandableSquads().length,
      hotkeys: { attack: "a", capture: "c", hold: "h", rally: "g", retreat: "v", rotate: "r" }
    },
    commandSurface: currentCommandSurfaceSummary(),
    alertCards: currentAlertCards(4),
    productionQueueCards: currentProductionCards(),
    objectiveCards: currentObjectiveCards(),
    outcomePanel: currentOutcomePanel(),
    playableFlow: playableFlowSummary({
      mode: state.mode,
      outcome: state.outcome,
      techTier: state.techTier,
      resources: state.resources,
      replay: state.replay,
      buildings: state.buildings,
      squads: state.squads,
      heroes: state.heroes,
      objectives: state.objectives,
      outcomePanel: currentOutcomePanel()
    }),
    selectedBuild: state.selectedBuild,
    buildRotation: state.buildRotation,
    commandSettings: state.commandSettings,
    production: state.production.map((item) => ({ squadId: item.squadId, remaining: Number(item.remaining.toFixed(1)) })),
    completedProduction: state.completedProduction.map((item) => ({ squadId: item.squadId, age: Number(item.age.toFixed(1)) })),
    research: state.research ? { tierId: state.research.tierId, remaining: Number(state.research.remaining.toFixed(1)) } : null,
    enemyResearch: state.enemyResearch ? { tierId: state.enemyResearch.tierId, remaining: Number(state.enemyResearch.remaining.toFixed(1)) } : null,
    objectives: state.objectives.map((objective) => ({ id: objective.id, owner: objective.owner })),
    recruitableHeroes: state.authority ? recruitableHeroesForPlayer(state.authority, data.content, "player").map((hero) => hero.id) : [],
    heroAbilities: allHeroAbilities().map((entry) => ({
      heroId: entry.heroId,
      abilityId: entry.ability.id,
      cooldown: Number(entry.cooldown.toFixed(1))
    })),
    readyHeroAbilities: allHeroAbilities().filter((entry) => entry.cooldown <= 0).map((entry) => entry.ability.id),
    heroes: state.heroes.map((hero) => ({ heroId: hero.heroId, level: hero.level, xp: hero.xp, cooldowns: hero.cooldowns })),
    buildings: state.buildings.map((building) => ({ id: building.id, buildingId: building.buildingId, owner: building.owner, x: building.x, y: building.y, hp: Math.round(building.hp), active: building.active })),
    squads: state.squads.filter((squad) => squad.hp > 0).map((squad) => ({
      id: squad.id,
      squadId: squad.squadId,
      owner: squad.owner,
      x: Number(squad.x.toFixed(2)),
      y: Number(squad.y.toFixed(2)),
      hp: Math.round(squad.hp),
      morale: Math.round(squad.morale),
      stance: squad.stance,
      tacticalStance: squad.tacticalStance,
      formation: squad.formation,
      formationAnchorKind: squad.formationAnchorKind ?? null,
      formationTargetOffsetKind: squad.formationTargetOffsetKind ?? null,
      formationAnchorTarget: squad.formationAnchorTarget ? {
        x: Number(squad.formationAnchorTarget.x.toFixed(2)),
        y: Number(squad.formationAnchorTarget.y.toFixed(2))
      } : null,
      targetPriority: squad.targetPriority,
      rallyPoint: squad.rallyPoint,
      waveId: squad.waveId ?? null,
      localPveWave: Boolean(squad.localPveWave),
      target: squad.target ? { x: Number(squad.target.x.toFixed(2)), y: Number(squad.target.y.toFixed(2)) } : null
    })),
    mission: state.mission,
    allies: state.allies,
    aiOrders: state.aiOrders,
    replayLength: state.replay.length,
    alerts: state.alerts.slice(0, 4)
  });
}

window.render_game_to_text = makeTextState;

loop();
