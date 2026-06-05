const MIN_BUILDING_DETAIL_GLYPHS = 20;
const MIN_SQUAD_DETAIL_GLYPHS = 18;
const MIN_OBJECTIVE_DETAIL_GLYPHS = 9;
const MIN_GROUNDED_ENTITIES = 14;
const MIN_RUNTIME_TREATMENTS = 7;

export function summarizeShowcaseArtPolish({
  artPlaceholderAudit = {},
  productionFormPolish = {},
  showcaseFactionArt = {},
  showcaseObjectiveArt = {},
  showcaseDepthFidelity = {}
} = {}) {
  const buildingDetailGlyphCount = collectionLength(productionFormPolish.buildingDetailGlyphKinds);
  const squadDetailGlyphCount = collectionLength(productionFormPolish.squadDetailGlyphKinds);
  const objectiveDetailGlyphCount = collectionLength(productionFormPolish.objectiveDetailGlyphKinds);
  const groundedEntityCount = Number(showcaseDepthFidelity.groundedEntityCount ?? 0);
  const factionRuntimeTreatmentCount = collectionLength(showcaseFactionArt.runtimeFactionTreatmentKinds);
  const objectiveRuntimeTreatmentCount = collectionLength(showcaseObjectiveArt.objectiveRuntimeTreatmentKinds);
  const runtimeTreatmentCount = factionRuntimeTreatmentCount + objectiveRuntimeTreatmentCount;

  const placeholderFree = artPlaceholderAudit.placeholderFree === true
    && Number(artPlaceholderAudit.runtimeFallbackPresentationCount ?? 0) === 0
    && Number(artPlaceholderAudit.runtimeMissingDefinitionCount ?? 0) === 0
    && Number(artPlaceholderAudit.objectiveMarkerFallbackCount ?? 0) === 0;
  const productionFormsReady = productionFormPolish.productionFormPass === true
    && productionFormPolish.buildingArchitecturePolishPass === true
    && productionFormPolish.squadBodyPolishPass === true
    && productionFormPolish.objectiveFocalPolishPass === true
    && buildingDetailGlyphCount >= MIN_BUILDING_DETAIL_GLYPHS
    && squadDetailGlyphCount >= MIN_SQUAD_DETAIL_GLYPHS
    && objectiveDetailGlyphCount >= MIN_OBJECTIVE_DETAIL_GLYPHS;
  const factionTreatmentsReady = showcaseFactionArt.showcaseFactionArtPass === true
    && collectionLength(showcaseFactionArt.missingArtPillars) === 0;
  const objectiveTreatmentsReady = showcaseObjectiveArt.showcaseObjectiveArtPass === true
    && collectionLength(showcaseObjectiveArt.missingArtPillars) === 0;
  const depthReady = showcaseDepthFidelity.showcaseDepthFidelityPass === true
    && collectionLength(showcaseDepthFidelity.missingDepthPillars) === 0
    && groundedEntityCount >= MIN_GROUNDED_ENTITIES;
  const runtimeTreatmentsReady = runtimeTreatmentCount >= MIN_RUNTIME_TREATMENTS;

  const missingPolishPillars = [
    placeholderFree ? null : "placeholder_free",
    productionFormsReady ? null : "production_forms",
    factionTreatmentsReady ? null : "faction_treatments",
    objectiveTreatmentsReady ? null : "objective_treatments",
    depthReady ? null : "depth_fidelity",
    runtimeTreatmentsReady ? null : "runtime_treatments"
  ].filter(Boolean);

  return {
    showcaseArtPolishPass: missingPolishPillars.length === 0,
    missingPolishPillars,
    polishSurfaceKinds: uniqueSorted([
      placeholderFree ? "placeholder_free" : null,
      productionFormsReady ? "production_forms" : null,
      factionTreatmentsReady ? "faction_treatments" : null,
      objectiveTreatmentsReady ? "objective_treatments" : null,
      depthReady ? "depth_fidelity" : null
    ]),
    buildingDetailGlyphCount,
    squadDetailGlyphCount,
    objectiveDetailGlyphCount,
    groundedEntityCount,
    runtimeTreatmentCount,
    factionRuntimeTreatmentCount,
    objectiveRuntimeTreatmentCount,
    depthSurfaceCount: collectionLength(showcaseDepthFidelity.depthSurfaceKinds)
  };
}

function collectionLength(collection) {
  if (!collection) {
    return 0;
  }
  if (collection instanceof Set || collection instanceof Map || Array.isArray(collection)) {
    return collection.size ?? collection.length;
  }
  return Object.keys(collection).length;
}

function uniqueSorted(values) {
  return [...new Set(values)].filter(Boolean).sort();
}
