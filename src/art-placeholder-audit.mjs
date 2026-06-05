import {
  buildingSilhouetteProfile,
  objectiveSilhouetteProfile,
  resolveBuildingPresentation,
  resolveObjectivePresentation,
  resolveSquadPresentation,
  squadSilhouetteProfile
} from "./entity-art.mjs";

const BUILDING_SIGNATURE_MIN = 12;
const SQUAD_SIGNATURE_MIN = 10;
const OBJECTIVE_SIGNATURE_MIN = 8;

export function summarizeArtPlaceholderAudit({
  buildings = [],
  squads = [],
  objectives = [],
  buildingDefinitions = new Map(),
  squadDefinitions = new Map(),
  objectiveDefinitions = new Map()
} = {}) {
  const buildingDefs = toDefinitionMap(buildingDefinitions);
  const squadDefs = toDefinitionMap(squadDefinitions);
  const objectiveDefs = toDefinitionMap(objectiveDefinitions);
  const fallbackIds = new Set();

  const contentBuildings = contentCandidates(buildings, buildingDefs);
  const contentSquads = contentCandidates(squads, squadDefs);
  const contentObjectives = contentCandidates(objectives, objectiveDefs);
  const runtimeBuildings = runtimeCandidates(buildings);
  const runtimeSquads = runtimeCandidates(squads);
  const runtimeObjectives = runtimeCandidates(objectives);

  const contentFallbackPresentationCount = [
    ...fallbackContentIds("building", contentBuildings),
    ...fallbackContentIds("squad", contentSquads),
    ...fallbackContentIds("objective", contentObjectives)
  ].length;

  const runtimeBuildingAudit = auditRuntime("building", runtimeBuildings, buildingDefs, buildingId, resolveBuildingPresentation);
  const runtimeSquadAudit = auditRuntime("squad", runtimeSquads, squadDefs, squadId, resolveSquadPresentation);
  const runtimeObjectiveAudit = auditRuntime("objective", runtimeObjectives, objectiveDefs, objectiveId, resolveObjectivePresentation);

  const buildingSignatureMarkKinds = uniqueSorted(contentBuildings.flatMap((building) => (
    buildingSilhouetteProfile(building.mapPresentation).signatureMarks
  )));
  const squadSignatureMarkKinds = uniqueSorted(contentSquads.flatMap((squad) => (
    squadSilhouetteProfile(squad.mapPresentation).signatureMarks
  )));
  const objectiveSignatureMarkKinds = uniqueSorted(contentObjectives.flatMap((objective) => (
    objectiveSilhouetteProfile(objective.mapPresentation).signatureMarks
  )));
  const objectiveMarkerFallbackCount = [
    ...contentObjectives.filter((objective) => objectiveSilhouetteProfile(objective.mapPresentation).family === "marker"),
    ...runtimeObjectiveAudit.fallbackArts.filter((art) => art.shapeProfile?.family === "marker")
  ].length;

  const runtimeFallbackPresentationCount = runtimeBuildingAudit.fallbackCount
    + runtimeSquadAudit.fallbackCount
    + runtimeObjectiveAudit.fallbackCount;
  const runtimeMissingDefinitionCount = runtimeBuildingAudit.missingCount
    + runtimeSquadAudit.missingCount
    + runtimeObjectiveAudit.missingCount;
  const signatureDiversityPass = buildingSignatureMarkKinds.length >= BUILDING_SIGNATURE_MIN
    && squadSignatureMarkKinds.length >= SQUAD_SIGNATURE_MIN
    && objectiveSignatureMarkKinds.length >= OBJECTIVE_SIGNATURE_MIN;

  return {
    placeholderFree: contentFallbackPresentationCount === 0
      && runtimeFallbackPresentationCount === 0
      && runtimeMissingDefinitionCount === 0
      && objectiveMarkerFallbackCount === 0
      && signatureDiversityPass,
    contentFallbackPresentationCount,
    runtimeFallbackPresentationCount,
    runtimeMissingDefinitionCount,
    objectiveMarkerFallbackCount,
    signatureDiversityPass,
    buildingSignatureMarkKinds,
    squadSignatureMarkKinds,
    objectiveSignatureMarkKinds,
    fallbackPresentationIds: [...fallbackIds].sort()
  };

  function fallbackContentIds(kind, entities) {
    const ids = entities
      .filter((entity) => isFallbackPresentation(entity.mapPresentation))
      .map((entity) => `${kind}:${entity.id ?? "unknown"}`);
    ids.forEach((id) => fallbackIds.add(id));
    return ids;
  }

  function auditRuntime(kind, entities, definitions, idForEntity, resolver) {
    let fallbackCount = 0;
    let missingCount = 0;
    const fallbackArts = [];
    for (const entity of entities) {
      const definitionId = idForEntity(entity);
      const definition = definitions.get(definitionId);
      const auditId = `${kind}:${entity.id ?? definitionId ?? "unknown"}`;
      if (!definition) {
        missingCount += 1;
      }
      const art = resolver(entity, definitions);
      if (isFallbackPresentation(art)) {
        fallbackCount += 1;
        fallbackArts.push(art);
        fallbackIds.add(auditId);
      }
    }
    return { fallbackCount, missingCount, fallbackArts };
  }
}

function contentCandidates(entities, definitions) {
  const definitionValues = [...definitions.values()];
  if (definitionValues.length > 0) {
    return definitionValues;
  }
  return collectionValues(entities).filter((entity) => entity.mapPresentation);
}

function runtimeCandidates(entities) {
  return collectionValues(entities).filter((entity) => !entity.mapPresentation);
}

function isFallbackPresentation(presentation = {}) {
  return !presentation.silhouette
    || !presentation.emblem
    || !presentation.accent
    || presentation.silhouette === "marker"
    || presentation.emblem === "dot"
    || presentation.accent === "neutral";
}

function toDefinitionMap(definitions) {
  if (definitions instanceof Map) {
    return definitions;
  }
  return new Map(collectionValues(definitions).map((entry) => [entry.id, entry]));
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

function buildingId(building) {
  return building.buildingId ?? building.id;
}

function squadId(squad) {
  return squad.squadId ?? squad.id;
}

function objectiveId(objective) {
  return objective.id;
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}
