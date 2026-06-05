import { combatEventPriorityProfile, squadPriorityProfile } from "./combat-priority.mjs";
import { factionReadabilityProfile, ownerFactionId } from "./faction-readability.mjs";

const REQUIRED_ATTACK_INTENT = 4;
const REQUIRED_IMPACT_CONFIRMATION = 4;
const REQUIRED_LETHAL_AFTERMATH = 5;
const REQUIRED_MORALE_BREAK = 3;
const REQUIRED_FACTION_AFTERMATH = 2;

export function summarizeCombatResolutionReadability({
  events = [],
  squads = [],
  selectedSquadIds = [],
  playerFaction = "thorn_court",
  enemyFaction = "hollow_legion"
} = {}) {
  const visibleEvents = collectionValues(events);
  const visibleSquads = collectionValues(squads).filter((squad) => Number(squad.hp ?? 0) > 0);
  const selectedIds = new Set(collectionValues(selectedSquadIds));
  const context = { playerFaction, enemyFaction };
  const squadProfiles = visibleSquads.map((squad) => ({
    squad,
    profile: squadPriorityProfile(squad, {
      selectedSquadIds: selectedIds,
      hostileSquads: visibleSquads.filter((candidate) => candidate.owner !== squad.owner)
    })
  }));
  const selectedProfiles = squadProfiles.filter(({ profile }) => profile.selected);
  const attackIntentKinds = attackIntentFor(visibleEvents, selectedProfiles);
  const impactConfirmationKinds = impactConfirmationFor(visibleEvents);
  const lethalAftermathKinds = lethalAftermathFor(visibleEvents, context);
  const moraleBreakKinds = moraleBreakFor(squadProfiles);
  const factionAftermathKinds = factionAftermathFor(visibleEvents, visibleSquads, context);

  const missingResolutionPillars = [
    attackIntentKinds.length >= REQUIRED_ATTACK_INTENT ? null : "attack_intent",
    impactConfirmationKinds.length >= REQUIRED_IMPACT_CONFIRMATION ? null : "impact_confirmation",
    lethalAftermathKinds.length >= REQUIRED_LETHAL_AFTERMATH ? null : "lethal_aftermath",
    moraleBreakKinds.length >= REQUIRED_MORALE_BREAK ? null : "morale_break",
    factionAftermathKinds.length >= REQUIRED_FACTION_AFTERMATH ? null : "faction_aftermath"
  ].filter(Boolean);

  return {
    combatResolutionReadabilityPass: missingResolutionPillars.length === 0,
    missingResolutionPillars,
    resolutionChainKinds: resolutionChainKinds({
      attackIntentKinds,
      impactConfirmationKinds,
      lethalAftermathKinds,
      moraleBreakKinds,
      factionAftermathKinds
    }),
    attackIntentKinds,
    impactConfirmationKinds,
    lethalAftermathKinds,
    moraleBreakKinds,
    factionAftermathKinds,
    focusThreatCount: selectedProfiles.filter(({ profile }) => profile.marker === "priority_warning" || profile.threat !== "clear").length,
    brokenSquadCount: squadProfiles.filter(({ profile }) => profile.moraleState === "broken" || profile.intent === "retreating").length,
    lethalEventCount: visibleEvents.filter((event) => event.kind === "death" || event.lethal).length
  };
}

function attackIntentFor(events, selectedProfiles) {
  const kinds = new Set();
  for (const event of events) {
    const profile = combatEventPriorityProfile(event);
    if (event.kind === "order") {
      kinds.add("command_destination_ring");
      kinds.add("command_chevron_stack");
    }
    if (profile.hierarchy.anchor === "source_target") {
      kinds.add("source_target_attack_arc");
    }
    if (["squad-hit", "structure-hit", "ability"].includes(event.kind)) {
      kinds.add("target_lock_flash");
    }
  }
  if (selectedProfiles.some(({ profile }) => profile.intent === "attacking")) {
    kinds.add("selected_attack_spine");
  }
  if (selectedProfiles.length >= 2) {
    kinds.add("multi_squad_fire_line");
  }
  return uniqueSorted(kinds);
}

function impactConfirmationFor(events) {
  const kinds = new Set();
  for (const event of events.filter((entry) => ["squad-hit", "structure-hit", "ability"].includes(entry.kind))) {
    const profile = combatEventPriorityProfile(event);
    for (const glyph of profile.hierarchy.glyphs) {
      kinds.add(glyph);
    }
    if (event.kind === "squad-hit") {
      kinds.add("unit_impact_flash");
    }
    if (event.kind === "structure-hit") {
      kinds.add("structure_shockwave");
    }
    if (Number(event.damage ?? 0) > 0) {
      kinds.add("damage_pulse");
    }
  }
  return uniqueSorted(kinds);
}

function lethalAftermathFor(events, context) {
  const kinds = new Set();
  for (const event of events.filter((entry) => entry.kind === "death" || entry.lethal)) {
    const profile = combatEventPriorityProfile(event);
    for (const glyph of profile.hierarchy.glyphs) {
      kinds.add(glyph);
    }
    kinds.add("corpse_shadow");
    kinds.add("death_impact_pause");
    kinds.add(aftermathKindFor(ownerFactionId(event.owner, context)));
  }
  return uniqueSorted(kinds);
}

function moraleBreakFor(squadProfiles) {
  const kinds = new Set();
  for (const { profile } of squadProfiles) {
    const hasMoraleBreak = profile.moraleState === "broken" || profile.intent === "retreating";
    if (profile.moraleState === "broken") {
      kinds.add("broken_banner");
      kinds.add("morale_warning_triangle");
    }
    if (profile.intent === "retreating") {
      kinds.add("retreat_lane_marker");
      kinds.add("rout_dust_tail");
    }
    if (hasMoraleBreak && profile.marker === "priority_warning") {
      kinds.add("priority_break_anchor");
    }
  }
  return uniqueSorted(kinds);
}

function factionAftermathFor(events, squads, context) {
  const owners = [
    ...events.map((event) => event.owner),
    ...squads.map((squad) => squad.owner)
  ].filter(Boolean);
  return uniqueSorted(new Set(owners.map((owner) => aftermathKindFor(ownerFactionId(owner, context)))));
}

function aftermathKindFor(factionId) {
  const profile = factionReadabilityProfile(factionId);
  return profile.motif === "bone" ? "bone_aftermath" : "thorn_aftermath";
}

function resolutionChainKinds({
  attackIntentKinds,
  impactConfirmationKinds,
  lethalAftermathKinds,
  moraleBreakKinds,
  factionAftermathKinds
}) {
  return [
    attackIntentKinds.length >= REQUIRED_ATTACK_INTENT ? "attack_intent" : null,
    factionAftermathKinds.length >= REQUIRED_FACTION_AFTERMATH ? "faction_aftermath" : null,
    impactConfirmationKinds.length >= REQUIRED_IMPACT_CONFIRMATION ? "impact_confirmation" : null,
    lethalAftermathKinds.length >= REQUIRED_LETHAL_AFTERMATH ? "lethal_aftermath" : null,
    moraleBreakKinds.length >= REQUIRED_MORALE_BREAK ? "morale_break" : null
  ].filter(Boolean);
}

function uniqueSorted(values) {
  return [...new Set([...values].filter(Boolean))].sort();
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
