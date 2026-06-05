export function selectionDetailPanelModel({
  playerFactionName = "Player",
  enemyFactionName = "Enemy",
  mechanicLabel = "None",
  selectedSquadCards = [],
  commandSettings = {},
  productionCards = [],
  researchLabel = "Tech stable",
  enemyResearchLabel = "Enemy tech stable",
  heroRows = [],
  objectiveCards = [],
  aiOrders = [],
  guidedPresentation = null
} = {}) {
  const selectedCards = selectedSquadCards.filter((card) => card.selected);
  const selectedCount = selectedCards.length;
  const statusLabels = unique(selectedCards.map((card) => card.statusLabel).filter(Boolean));
  const selectionTone = selectedCards.some((card) => card.severity === "critical")
    ? "critical"
    : selectedCards.some((card) => card.severity === "warning")
      ? "warning"
      : "normal";
  const normalizedHeroes = normalizeHeroRows(heroRows);
  const readyHeroAbilityCount = normalizedHeroes.filter((hero) => hero.ready).length;
  const objectiveSummary = objectiveCards.length
    ? objectiveCards.slice(0, 3).map((card) => `${card.label}: ${card.ownerLabel ?? label(card.status)}`).join(" | ")
    : "No objectives";

  const guidedSection = guidedPresentation?.visible ? {
    id: "guidance",
    title: "Guidance",
    tone: "guided",
    rows: [
      { label: "Mission", value: guidedPresentation.contextLine },
      { label: "Current", value: guidedPresentation.currentStepLabel },
      { label: "Progress", value: guidedPresentation.progressLabel },
      { label: "Signals", value: guidedPresentation.panelSignalKinds.join(" / ") }
    ]
  } : null;

  const sections = [
    {
      id: "faction",
      title: "Faction",
      tone: "normal",
      rows: [
        { label: "Matchup", value: `${playerFactionName} vs ${enemyFactionName}` },
        { label: "Mechanic", value: mechanicLabel || "None" }
      ]
    },
    ...(guidedSection ? [guidedSection] : []),
    {
      id: "selection",
      title: "Selection",
      tone: selectionTone,
      rows: [
        { label: "Squads", value: selectedCount ? `${selectedCount} selected` : "None selected" },
        { label: "Status", value: statusLabels.length ? statusLabels.join(" / ") : "Ready" },
        { label: "Orders", value: `${label(commandSettings.stanceMode)} / ${label(commandSettings.formation)} / ${label(commandSettings.targetPriority)}` }
      ]
    },
    {
      id: "hero",
      title: "Hero",
      tone: readyHeroAbilityCount > 0 ? "ready" : "normal",
      rows: normalizedHeroes.length ? normalizedHeroes.map((hero) => ({
        label: hero.name,
        value: `L${hero.level} XP ${hero.xp}`,
        meta: hero.hasAbility ? `${hero.abilityName} ${hero.ready ? "ready" : `${hero.cooldown}s`}` : "No order ready"
      })) : [{ label: "Roster", value: "No hero recruited", meta: "Recruit from the command panel" }]
    },
    {
      id: "operations",
      title: "Operations",
      tone: objectiveCards.some((card) => card.status === "contested") ? "warning" : "normal",
      rows: [
        { label: "Production", value: productionCards.length ? `${productionCards.length} active` : "Idle" },
        { label: "Research", value: researchLabel },
        { label: "Enemy", value: enemyResearchLabel },
        { label: "Objectives", value: objectiveSummary },
        { label: "AI", value: aiOrders.length ? aiOrders.slice(-3).join(", ") : "Watching" }
      ]
    }
  ];

  return {
    sectionCount: sections.length,
    rowCount: sections.reduce((count, section) => count + section.rows.length, 0),
    hasSelectionSection: true,
    hasHeroSection: true,
    hasObjectiveSection: objectiveCards.length > 0,
    hasGuidanceSection: Boolean(guidedSection),
    selectedCount,
    heroCount: normalizedHeroes.length,
    readyHeroAbilityCount,
    objectiveCount: objectiveCards.length,
    guidedStepCount: guidedPresentation?.stepCount ?? 0,
    sections
  };
}

function normalizeHeroRows(heroRows) {
  return heroRows.map((hero) => {
    const cooldown = Math.max(0, Math.ceil(Number(hero.cooldown ?? 0)));
    const hasAbility = Boolean(hero.abilityName);
    return {
      name: hero.name ?? label(hero.heroId),
      level: Math.max(1, Number(hero.level ?? 1)),
      xp: Math.max(0, Number(hero.xp ?? 0)),
      abilityName: hasAbility ? hero.abilityName : "No order",
      cooldown,
      hasAbility,
      ready: hasAbility && cooldown <= 0
    };
  });
}

function unique(values) {
  return [...new Set(values)];
}

function label(value) {
  return String(value ?? "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
