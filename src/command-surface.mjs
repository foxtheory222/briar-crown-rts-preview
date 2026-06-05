const ACTIONS = [
  { id: "attack-btn", label: "Attack", displayLabel: "Attack", value: "Enemy Seat", displayValue: "Seat", hotkey: "A", kind: "action", group: "engage", icon: "attack" },
  { id: "capture-btn", label: "Capture", displayLabel: "Cap", value: "Witchglass", displayValue: "Witch", hotkey: "C", kind: "action", group: "engage", icon: "capture" },
  { id: "hold-btn", label: "Hold", displayLabel: "Hold", value: "Position", displayValue: "Pos.", hotkey: "H", kind: "action", group: "position", icon: "hold" },
  { id: "rally-btn", label: "Rally", displayLabel: "Rally", value: "Base", displayValue: "Base", hotkey: "G", kind: "action", group: "position", icon: "rally" },
  { id: "retreat-btn", label: "Retreat", displayLabel: "Ret.", value: "Safety", displayValue: "Safe", hotkey: "V", kind: "action", group: "position", icon: "retreat" }
];

const TACTICS = [
  { id: "stance-btn", label: "Stance", displayLabel: "Stance", setting: "stanceMode", kind: "tactic", group: "tactic", icon: "stance" },
  { id: "formation-btn", label: "Formation", displayLabel: "Form", setting: "formation", kind: "tactic", group: "tactic", icon: "formation" },
  { id: "priority-btn", label: "Priority", displayLabel: "Target", setting: "targetPriority", kind: "tactic", group: "tactic", icon: "priority" }
];

const COMMAND_GROUP_ORDER = ["engage", "position", "tactic"];

const SHORT_VALUES = {
  aggressive: "Aggro",
  closest: "Near",
  column: "Column",
  guard: "Guard",
  line: "Line",
  squads: "Squads",
  structures: "Structs",
  wedge: "Wedge"
};

export function commandSurfaceItems({ mode = "menu", selectedCount = 0, commandSettings = {} } = {}) {
  const disabled = mode === "menu" || mode === "complete" || selectedCount <= 0;
  const disabledReason = selectedCount <= 0 ? "Select a squad" : mode === "menu" || mode === "complete" ? "Start a match" : "";
  return [
    ...ACTIONS.map((item) => commandItem(item, disabled, disabledReason)),
    ...TACTICS.map((item) => commandItem({
      ...item,
      value: label(commandSettings[item.setting]),
      displayValue: compactLabel(commandSettings[item.setting])
    }, disabled, disabledReason))
  ];
}

export function commandSurfaceSummary(options = {}) {
  const items = commandSurfaceItems(options);
  const groupCounts = commandGroupCounts(items);
  const groupOrder = COMMAND_GROUP_ORDER.filter((group) => groupCounts[group] > 0);
  return {
    selectedCount: Number(options.selectedCount ?? 0),
    enabledCount: items.filter((item) => !item.disabled).length,
    actionCount: items.filter((item) => item.kind === "action").length,
    tacticCount: items.filter((item) => item.kind === "tactic").length,
    groupCount: groupOrder.length,
    groupOrder,
    groupCounts,
    hotkeys: items.filter((item) => item.hotkey).map((item) => item.hotkey),
    activeTactics: items.filter((item) => item.kind === "tactic").map((item) => item.value)
  };
}

function commandItem(item, disabled, disabledReason) {
  return {
    id: item.id,
    label: item.label,
    displayLabel: item.displayLabel,
    value: item.value,
    displayValue: item.displayValue ?? item.value,
    hotkey: item.hotkey ?? "",
    icon: item.icon,
    kind: item.kind,
    group: item.group,
    disabled,
    disabledReason: disabled ? disabledReason : "",
    title: `${item.label}${item.value ? `: ${item.value}` : ""}${item.hotkey ? ` (${item.hotkey})` : ""}`
  };
}

function commandGroupCounts(items) {
  return Object.fromEntries(COMMAND_GROUP_ORDER.map((group) => [
    group,
    items.filter((item) => item.group === group).length
  ]));
}

function label(value) {
  return String(value ?? "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function compactLabel(value) {
  return SHORT_VALUES[value] ?? label(value);
}
