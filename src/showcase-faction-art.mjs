import {
  buildingFactionMark,
  factionReadabilityProfile,
  ownerFactionId,
  squadFactionMark
} from "./faction-readability.mjs";
import {
  buildingProductionFormProfile,
  squadProductionFormProfile
} from "./production-form-polish.mjs";
import {
  buildingSilhouetteProfile,
  squadSilhouetteProfile
} from "./entity-art.mjs";

const REQUIRED_FACTIONS = 2;
const REQUIRED_SQUADS_PER_FACTION = 7;
const REQUIRED_SHARED_BUILDING_OVERLAYS = 12;
const REQUIRED_BUILDING_GLYPHS = 10;
const REQUIRED_SQUAD_BODY_KINDS = 10;
const REQUIRED_SQUAD_SIGNATURES = 14;
const REQUIRED_RUNTIME_TREATMENTS = 4;

export function summarizeShowcaseFactionArt({
  buildings = [],
  squads = [],
  runtimeBuildings = [],
  runtimeSquads = [],
  playerFaction = "thorn_court",
  enemyFaction = "hollow_legion"
} = {}) {
  const buildingDefinitions = collectionValues(buildings);
  const squadDefinitions = collectionValues(squads);
  const buildingById = mapById(buildingDefinitions);
  const squadById = mapById(squadDefinitions);
  const factionIds = uniqueSorted(squadDefinitions
    .map((squad) => squad.faction)
    .filter((faction) => faction === "thorn_court" || faction === "hollow_legion"));
  const context = { playerFaction, enemyFaction };
  const squadRosterCounts = Object.fromEntries(factionIds.map((factionId) => [
    factionId,
    squadDefinitions.filter((squad) => squad.faction === factionId).length
  ]));
  const minFactionSquadRosterCount = factionIds.length > 0
    ? Math.min(...Object.values(squadRosterCounts))
    : 0;
  const sharedBuildingOverlayKinds = uniqueSorted(buildingDefinitions
    .filter((building) => building.faction === "shared")
    .flatMap((building) => factionIds.map((factionId) => buildingOverlayKind(building, factionId))));
  const buildingFactionGlyphKinds = uniqueSorted(factionIds.flatMap((factionId) => buildingFactionGlyphs(factionId)));
  const squadFactionBodyKinds = uniqueSorted(squadDefinitions
    .filter((squad) => factionIds.includes(squad.faction))
    .map(squadBodyTreatmentKind));
  const squadFactionSignatureKinds = uniqueSorted(squadDefinitions
    .filter((squad) => factionIds.includes(squad.faction))
    .flatMap(squadSignatureKinds));
  const factionPaletteKinds = uniqueSorted(factionIds.map((factionId) => {
    const profile = factionReadabilityProfile(factionId);
    return `${profile.motif}:${profile.trim}:${profile.accent}`;
  }));
  const runtimeFactionTreatmentKinds = uniqueSorted([
    ...collectionValues(runtimeBuildings).map((building) => runtimeBuildingTreatmentKind(building, buildingById, context)),
    ...collectionValues(runtimeSquads).map((squad) => runtimeSquadTreatmentKind(squad, squadById, context))
  ]);

  const missingArtPillars = [
    factionIds.length >= REQUIRED_FACTIONS ? null : "two_factions",
    factionIds.length >= REQUIRED_FACTIONS && minFactionSquadRosterCount >= REQUIRED_SQUADS_PER_FACTION ? null : "two_faction_squad_rosters",
    factionPaletteKinds.length >= REQUIRED_FACTIONS ? null : "faction_palettes",
    sharedBuildingOverlayKinds.length >= REQUIRED_SHARED_BUILDING_OVERLAYS ? null : "shared_building_overlays",
    buildingFactionGlyphKinds.length >= REQUIRED_BUILDING_GLYPHS ? null : "building_faction_glyphs",
    squadFactionBodyKinds.length >= REQUIRED_SQUAD_BODY_KINDS ? null : "squad_body_language",
    squadFactionSignatureKinds.length >= REQUIRED_SQUAD_SIGNATURES ? null : "squad_signature_glyphs",
    runtimeFactionTreatmentKinds.length >= REQUIRED_RUNTIME_TREATMENTS ? null : "runtime_faction_treatments"
  ].filter(Boolean);

  return {
    showcaseFactionArtPass: missingArtPillars.length === 0,
    missingArtPillars,
    factions: factionIds,
    factionPaletteKinds,
    minFactionSquadRosterCount,
    squadRosterCounts,
    sharedBuildingOverlayKinds,
    buildingFactionGlyphKinds,
    squadFactionBodyKinds,
    squadFactionSignatureKinds,
    runtimeFactionTreatmentKinds
  };
}

function buildingOverlayKind(building, factionId) {
  const profile = factionReadabilityProfile(factionId);
  const form = buildingProductionFormProfile(building);
  const silhouette = buildingSilhouetteProfile(building.mapPresentation);
  return `${factionId}:${profile.buildingForm}:${profile.groundTexture}:${silhouette.family}:${form.materialCue}`;
}

function buildingFactionGlyphs(factionId) {
  const profile = factionReadabilityProfile(factionId);
  return [
    profile.motif,
    profile.crest,
    profile.baseMark,
    profile.banner,
    profile.buildingForm,
    profile.groundTexture,
    ...profile.silhouetteGlyphs
  ];
}

function squadBodyTreatmentKind(squad) {
  const form = squadProductionFormProfile(squad);
  return `${squad.faction}:${form.formKind}:${form.bodyCue}:${form.equipmentCue}:${form.motionCue}`;
}

function squadSignatureKinds(squad) {
  const profile = factionReadabilityProfile(squad.faction);
  const silhouette = squadSilhouetteProfile(squad.mapPresentation);
  const form = squadProductionFormProfile(squad);
  return uniqueSorted([
    `${squad.faction}:${profile.squadForm}`,
    `${squad.faction}:${profile.unitMark}`,
    `${squad.faction}:${profile.groundTexture}`,
    ...profile.silhouetteGlyphs.map((glyph) => `${squad.faction}:${glyph}`),
    ...silhouette.signatureMarks.map((mark) => `${squad.faction}:${mark}`),
    ...form.detailGlyphs.map((glyph) => `${squad.faction}:${glyph}`)
  ]);
}

function runtimeBuildingTreatmentKind(building, buildingById, context) {
  const definition = buildingById.get(building.buildingId ?? building.id) ?? building;
  const factionId = ownerFactionId(building.owner, context);
  const mark = buildingFactionMark(building, context);
  const form = buildingProductionFormProfile(definition);
  return `${factionId}:building:${definition.id ?? building.buildingId ?? building.id}:${mark.buildingForm}:${mark.groundTexture}:${form.materialCue}`;
}

function runtimeSquadTreatmentKind(squad, squadById, context) {
  const definition = squadById.get(squad.squadId ?? squad.id) ?? squad;
  const factionId = ownerFactionId(squad.owner, context);
  const mark = squadFactionMark(squad, context);
  const form = squadProductionFormProfile(definition);
  return `${factionId}:squad:${definition.id ?? squad.squadId ?? squad.id}:${mark.squadForm}:${mark.groundTexture}:${form.bodyCue}:${form.equipmentCue}`;
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

function mapById(values) {
  return new Map(collectionValues(values).map((value) => [value.id, value]));
}

function uniqueSorted(values) {
  return [...new Set(values)].filter(Boolean).sort();
}
