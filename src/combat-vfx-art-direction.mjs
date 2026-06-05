import { combatEventPriorityProfile, squadPriorityProfile } from "./combat-priority.mjs";
import { factionReadabilityProfile, ownerFactionId } from "./faction-readability.mjs";

const REQUIRED_ATTACK_TELEGRAPHS = 5;
const REQUIRED_DEATH_RESOLUTION = 4;
const REQUIRED_SELECTION_FOCUS = 4;
const REQUIRED_FACTION_RESIDUES = 2;

export function summarizeCombatVfxArtDirection({
  events = [],
  squads = [],
  selectedSquadIds = [],
  playerFaction = "thorn_court",
  enemyFaction = "hollow_legion"
} = {}) {
  const visibleEvents = collectionValues(events);
  const visibleSquads = collectionValues(squads).filter((squad) => Number(squad.hp ?? 0) > 0);
  const selectedIds = new Set(collectionValues(selectedSquadIds));
  const selectedSquads = visibleSquads.filter((squad) => selectedIds.has(squad.id));
  const context = { playerFaction, enemyFaction };
  const selectedProfiles = selectedSquads.map((squad) => squadPriorityProfile(squad, {
    selectedSquadIds: selectedIds,
    hostileSquads: visibleSquads.filter((candidate) => candidate.owner !== squad.owner)
  }));

  const attackTelegraphKinds = attackTelegraphsFor(visibleEvents, selectedSquads);
  const deathResolutionKinds = deathResolutionFor(visibleEvents, context);
  const selectionFocusKinds = selectionFocusFor(selectedSquads);
  const factionResidueKinds = factionResiduesFor(visibleSquads, context);
  const missingArtPillars = [
    attackTelegraphKinds.length >= REQUIRED_ATTACK_TELEGRAPHS ? null : "attack_telegraph",
    deathResolutionKinds.length >= REQUIRED_DEATH_RESOLUTION ? null : "death_resolution",
    selectionFocusKinds.length >= REQUIRED_SELECTION_FOCUS && selectedSquads.length > 0 ? null : "selection_focus",
    factionResidueKinds.length >= REQUIRED_FACTION_RESIDUES ? null : "faction_residue"
  ].filter(Boolean);

  return {
    vfxArtDirectionPass: missingArtPillars.length === 0,
    missingArtPillars,
    attackTelegraphKinds,
    deathResolutionKinds,
    selectionFocusKinds,
    factionResidueKinds,
    selectedFocusCount: selectedSquads.length,
    selectedThreatCount: selectedProfiles.filter((profile) => profile.threat !== "clear" || profile.marker === "priority_warning").length
  };
}

function attackTelegraphsFor(events, selectedSquads) {
  const kinds = new Set();
  for (const event of events) {
    const profile = combatEventPriorityProfile(event);
    if (profile.hierarchy.anchor === "source_target") {
      kinds.add("source_target_trail");
    }
    if (event.kind === "order") {
      kinds.add("command_destination");
    }
    if (event.kind === "squad-hit") {
      kinds.add("unit_impact_flash");
    }
    if (event.kind === "structure-hit") {
      kinds.add("structure_shockwave");
    }
    for (const glyph of profile.hierarchy.glyphs) {
      if (["chevron_stack", "destination_ring", "arc_trail", "target_flash", "burst_sparks", "heavy_trail", "shockwave", "debris_ticks"].includes(glyph)) {
        kinds.add(glyph);
      }
    }
  }
  if (selectedSquads.some((squad) => squad.stance === "attack_move" || squad.target)) {
    kinds.add("selected_attack_spine");
  }
  return [...kinds].sort();
}

function deathResolutionFor(events, context) {
  const kinds = new Set();
  for (const event of events.filter((entry) => entry.kind === "death")) {
    const profile = combatEventPriorityProfile(event);
    for (const glyph of profile.hierarchy.glyphs) {
      kinds.add(glyph);
    }
    kinds.add(residueKindFor(ownerFactionId(event.owner, context)));
  }
  return [...kinds].sort();
}

function selectionFocusFor(selectedSquads) {
  const kinds = new Set();
  if (selectedSquads.length > 0) {
    kinds.add("selection_halo");
    kinds.add("selection_tick_marks");
    kinds.add("command_anchor");
  }
  if (selectedSquads.some((squad) => squad.stance === "attack_move" || squad.target)) {
    kinds.add("selected_attack_chevrons");
  }
  if (selectedSquads.some((squad) => squad.formation)) {
    kinds.add("formation_shape_hint");
  }
  if (selectedSquads.length >= 2) {
    kinds.add("multi_squad_focus");
  }
  return [...kinds].sort();
}

function factionResiduesFor(squads, context) {
  return [...new Set(squads.map((squad) => residueKindFor(ownerFactionId(squad.owner, context))))].sort();
}

function residueKindFor(factionId) {
  const profile = factionReadabilityProfile(factionId);
  return profile.motif === "bone" ? "bone_dust_residue" : "thorn_petal_residue";
}

function collectionValues(collection) {
  if (!collection) {
    return [];
  }
  if (collection instanceof Set) {
    return [...collection];
  }
  if (collection instanceof Map) {
    return [...collection.values()];
  }
  if (Array.isArray(collection)) {
    return collection;
  }
  return Object.values(collection);
}
