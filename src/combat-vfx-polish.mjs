import { combatEventPriorityProfile } from "./combat-priority.mjs";

const REQUIRED_EVENT_KINDS = ["ability", "death", "order", "squad-hit", "structure-hit"];
const REQUIRED_HIERARCHY_LAYERS = [
  "command_intent",
  "hero_ability",
  "lethal_resolution",
  "structure_impact",
  "unit_impact"
];
const MAX_READABLE_EVENTS = 12;

export function summarizeCombatVfxPolish({ events = [] } = {}) {
  const visibleEvents = collectionValues(events);
  const profiles = visibleEvents.map(combatEventPriorityProfile);
  const eventKinds = uniqueSorted(visibleEvents.map((event) => event.kind));
  const hierarchyLayers = uniqueSorted(profiles.map((profile) => profile.hierarchy.layer));
  const impactGlyphKinds = uniqueSorted(profiles.flatMap((profile) => profile.hierarchy.glyphs));
  const missingEventKinds = REQUIRED_EVENT_KINDS.filter((kind) => !eventKinds.includes(kind));
  const missingHierarchyLayers = REQUIRED_HIERARCHY_LAYERS.filter((layer) => !hierarchyLayers.includes(layer));
  const lethalProfiles = profiles.filter((profile) => profile.hierarchy.layer === "lethal_resolution");
  const abilityProfiles = profiles.filter((profile) => profile.hierarchy.layer === "hero_ability");
  const structureProfiles = profiles.filter((profile) => profile.hierarchy.layer === "structure_impact");
  const eventBudgetPass = visibleEvents.length <= MAX_READABLE_EVENTS;

  return {
    vfxPolishPass: missingEventKinds.length === 0
      && missingHierarchyLayers.length === 0
      && lethalProfiles.some((profile) => profile.hierarchy.glyphs.length >= 3)
      && abilityProfiles.some((profile) => profile.hierarchy.glyphs.length >= 3)
      && structureProfiles.some((profile) => profile.hierarchy.glyphs.length >= 3)
      && impactGlyphKinds.length >= 12
      && eventBudgetPass,
    eventBudgetPass,
    eventCount: visibleEvents.length,
    eventKinds,
    missingEventKinds,
    hierarchyLayers,
    missingHierarchyLayers,
    impactGlyphKinds,
    lethalGlyphCount: glyphCountFor(lethalProfiles),
    abilityGlyphCount: glyphCountFor(abilityProfiles),
    structureGlyphCount: glyphCountFor(structureProfiles),
    sourceTargetAnchoredEvents: profiles.filter((profile) => profile.hierarchy.anchor === "source_target").length,
    targetAnchoredEvents: profiles.filter((profile) => profile.hierarchy.anchor === "target").length
  };
}

function glyphCountFor(profiles) {
  return uniqueSorted(profiles.flatMap((profile) => profile.hierarchy.glyphs)).length;
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function collectionValues(collection) {
  if (!collection) {
    return [];
  }
  if (collection instanceof Map) {
    return [...collection.values()];
  }
  if (Array.isArray(collection)) {
    return collection;
  }
  return Object.values(collection);
}
