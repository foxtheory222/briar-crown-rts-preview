const REQUIRED_PAINTED_LAYERS = [
  "ground_wash",
  "clan_territory",
  "forest_canopy",
  "readable_lane",
  "resource_clusters",
  "objective_glow"
];

const REQUIRED_COMMAND_GROUPS = ["engage", "position", "tactic"];

export function summarizeNorthgardWc3Readability({
  mapArt = {},
  commandSurface = {},
  minimap = {},
  layout = {}
} = {}) {
  const paintedLayers = new Set(mapArt.paintedLayers ?? []);
  const groupOrder = new Set(commandSurface.groupOrder ?? []);
  const paintedBattlefieldPass = REQUIRED_PAINTED_LAYERS.every((layer) => paintedLayers.has(layer));
  const iconFirstCommandPass = Number(commandSurface.enabledCount ?? 0) >= 8
    && Number(commandSurface.groupCount ?? 0) >= REQUIRED_COMMAND_GROUPS.length
    && REQUIRED_COMMAND_GROUPS.every((group) => groupOrder.has(group))
    && (commandSurface.hotkeys ?? []).length >= 5;
  const minimapAwarenessPass = Number(minimap.objectivePips ?? 0) >= 3
    && (
      Number(minimap.combatHotspots ?? 0) >= 1
      || Number(minimap.retreatPips ?? 0) >= 1
      || (Number(minimap.unitPips ?? 0) >= 2 && Number(minimap.buildingPips ?? 0) >= 2)
    )
    && Boolean(minimap.cameraFrameVisible)
    && Boolean(minimap.safeAreaPass);
  const desktopNoScrollCommandPass = !layout.playingMode
    || (
      Number(layout.commandSurfaceClientHeight ?? 0) > 0
      && Number(layout.commandSurfaceScrollHeight ?? 0) <= Number(layout.commandSurfaceClientHeight ?? 0) + 2
    );
  const setupControlsHiddenPass = !layout.playingMode || !layout.setupControlsVisible;

  const checks = {
    painted_battlefield_layers: paintedBattlefieldPass,
    icon_first_command_grid: iconFirstCommandPass,
    minimap_awareness: minimapAwarenessPass,
    desktop_command_surface_no_scroll: desktopNoScrollCommandPass,
    setup_controls_hidden: setupControlsHiddenPass
  };
  const missing = Object.entries(checks)
    .filter(([, pass]) => !pass)
    .map(([id]) => id);

  return {
    referenceTarget: "Northgard/WC3 readability",
    paintedBattlefieldLayerCount: paintedLayers.size,
    paintedBattlefieldPass,
    iconFirstCommandPass,
    minimapAwarenessPass,
    desktopNoScrollCommandPass,
    setupControlsHiddenPass,
    readabilityPass: missing.length === 0,
    missing
  };
}
