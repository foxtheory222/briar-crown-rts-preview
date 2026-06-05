export const DEFAULT_HUD_SETTINGS = Object.freeze({
  compactHud: false,
  audioMuted: false,
  reducedMotion: false
});

const RESOURCE_DEFINITIONS = [
  { id: "gold", label: "Gold", glyph: "G", kind: "primary", lowAt: 120 },
  { id: "wood", label: "Wood", glyph: "W", kind: "primary", lowAt: 120 },
  { id: "food", label: "Food", glyph: "F", kind: "primary", lowAt: 30 },
  { id: "housing", label: "Housing", glyph: "H", kind: "capacity" },
  { id: "witchglass", label: "Witchglass", glyph: "WG", kind: "rare", lowAt: 0 }
];

const REFERENCE_HUD_SURFACES = [
  "alerts",
  "command_groups",
  "hero_controls",
  "minimap",
  "objective_cards",
  "outcome_actions",
  "production_queue",
  "resources",
  "selection_detail",
  "settings_modal"
];

export function summarizeHudState({
  mode = "menu",
  outcome = null,
  isPlaying = false,
  settingsOpen = false,
  resources = {},
  housingUsed = 0,
  settings = DEFAULT_HUD_SETTINGS
} = {}) {
  const normalized = normalizeHudSettings(settings);
  const resourceChips = resourceChipModels({ resources, housingUsed });

  return {
    resourceChipCount: resourceChips.length,
    primaryResourceChips: resourceChips.filter((chip) => chip.kind === "primary").length,
    capacityResourceChips: resourceChips.filter((chip) => chip.kind === "capacity").length,
    rareResourceChips: resourceChips.filter((chip) => chip.kind === "rare").length,
    pressuredResourceChips: resourceChips.filter((chip) => chip.pressure !== "stable").length,
    resourceOrder: resourceChips.map((chip) => chip.id),
    modeLabel: outcome ?? mode,
    settings: {
      visible: Boolean(settingsOpen),
      actionCount: 3,
      toggleCount: Object.keys(DEFAULT_HUD_SETTINGS).length,
      compactHud: normalized.compactHud,
      audioMuted: normalized.audioMuted,
      reducedMotion: normalized.reducedMotion,
      pausesSimulation: Boolean(settingsOpen && isPlaying && !outcome)
    }
  };
}

export function summarizeHudCohesion({
  hudState = {},
  commandSurface = {},
  productionQueueCards = [],
  objectiveCards = [],
  alertCards = [],
  selectionDetail = {},
  minimap = {},
  outcomePanel = {},
  heroAbilities = [],
  readyHeroAbilities = [],
  recruitableHeroes = []
} = {}) {
  const commandInventoryCount = Math.max(
    Number(commandSurface.enabledCount ?? 0),
    Number(commandSurface.actionCount ?? 0) + Number(commandSurface.tacticCount ?? 0)
  );
  const surfaceChecks = {
    alerts: arrayLength(alertCards) >= 1,
    command_groups: commandInventoryCount >= 8
      && Number(commandSurface.groupCount ?? 0) >= 3
      && arrayLength(commandSurface.groupOrder) >= 3,
    hero_controls: Number(selectionDetail.heroCount ?? 0) >= 1
      || arrayLength(heroAbilities) >= 1
      || arrayLength(readyHeroAbilities) >= 1
      || arrayLength(recruitableHeroes) >= 1,
    minimap: Boolean(minimap.visible) && Boolean(minimap.safeAreaPass),
    objective_cards: arrayLength(objectiveCards) >= 3,
    outcome_actions: arrayLength(outcomePanel.actions) >= 2 || Number(outcomePanel.actionCount ?? 0) >= 2,
    production_queue: arrayLength(productionQueueCards) >= 1,
    resources: Number(hudState.resourceChipCount ?? 0) >= 5
      && Number(hudState.primaryResourceChips ?? 0) >= 3
      && Number(hudState.capacityResourceChips ?? 0) >= 1
      && Number(hudState.rareResourceChips ?? 0) >= 1,
    selection_detail: Number(selectionDetail.sectionCount ?? 0) >= 4
      && Boolean(selectionDetail.hasSelectionSection)
      && Boolean(selectionDetail.hasHeroSection)
      && Boolean(selectionDetail.hasObjectiveSection),
    settings_modal: Number(hudState.settings?.actionCount ?? 0) >= 3
      && Number(hudState.settings?.toggleCount ?? 0) >= 3
  };
  const surfaceKinds = REFERENCE_HUD_SURFACES.filter((surface) => surfaceChecks[surface]);
  const missingHudSurfaces = REFERENCE_HUD_SURFACES.filter((surface) => !surfaceChecks[surface]);

  return {
    hudCohesionPass: missingHudSurfaces.length === 0,
    surfaceCount: surfaceKinds.length,
    surfaceKinds,
    missingHudSurfaces,
    referenceHudSurfaceCount: REFERENCE_HUD_SURFACES.length
  };
}

export function resourceChipModels({ resources = {}, housingUsed = 0 } = {}) {
  return RESOURCE_DEFINITIONS.map((definition) => {
    const value = Math.floor(Number(resources[definition.id] ?? 0));
    const used = Math.floor(Number(housingUsed ?? 0));
    const pressure = resourcePressure(definition, value, used);
    return {
      id: definition.id,
      label: definition.label,
      glyph: definition.glyph,
      value,
      valueText: definition.id === "housing" ? `${used}/${value}` : String(value),
      kind: definition.kind,
      pressure
    };
  });
}

export function normalizeHudSettings(settings = {}) {
  return {
    compactHud: Boolean(settings.compactHud),
    audioMuted: Boolean(settings.audioMuted),
    reducedMotion: Boolean(settings.reducedMotion)
  };
}

function resourcePressure(definition, value, housingUsed) {
  if (definition.id === "housing") {
    return value > 0 && housingUsed / value >= 0.85 ? "capacity" : "stable";
  }
  return value < (definition.lowAt ?? 0) ? "low" : "stable";
}

function arrayLength(value) {
  return Array.isArray(value) ? value.length : 0;
}
