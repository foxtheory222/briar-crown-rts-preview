const REQUIRED_ICON_SURFACES = ["ability", "building", "faction", "hero", "objective", "squad", "unit"];
const REQUIRED_DEDICATED_ABILITY_ICONS = 12;
const REQUIRED_DEDICATED_BUILDING_ICONS = 23;
const REQUIRED_DEDICATED_HERO_ICONS = 4;
const REQUIRED_DEDICATED_SQUAD_ICONS = 14;
const REQUIRED_DEDICATED_UNIT_ICONS = 14;
const PLAYABLE_ICON_SURFACES = new Set(["ability", "squad", "unit"]);
const GENERIC_PLAYABLE_ICON_FILE_SET = new Set(["ability.svg", "unit-hollow.svg", "unit-thorn.svg"]);
const GENERIC_BUILDING_ICON_FILE_SET = new Set([
  "building-defense.svg",
  "building-economy.svg",
  "building-hero.svg",
  "building-tech.svg",
  "building-war.svg",
  "building-witchglass.svg"
]);
const GENERIC_HERO_ICON_FILE_SET = new Set(["hero-hollow.svg", "hero-thorn.svg"]);
const GENERIC_UNIT_ICON_FILE_SET = new Set(["unit-hollow.svg", "unit-thorn.svg"]);

export const GENERIC_PLAYABLE_ICON_FILENAMES = [...GENERIC_PLAYABLE_ICON_FILE_SET].sort();
export const GENERIC_BUILDING_ICON_FILENAMES = [...GENERIC_BUILDING_ICON_FILE_SET].sort();
export const GENERIC_HERO_ICON_FILENAMES = [...GENERIC_HERO_ICON_FILE_SET].sort();
export const GENERIC_UNIT_ICON_FILENAMES = [...GENERIC_UNIT_ICON_FILE_SET].sort();

export const KNOWN_ICON_FILES = [
  "ability-bone-regalia.svg",
  "ability-briar-aegis.svg",
  "ability-court-of-bones.svg",
  "ability-dew-mending.svg",
  "ability-dread-edict.svg",
  "ability-grave-command.svg",
  "ability-hart-charge.svg",
  "ability-moon-snare.svg",
  "ability-mourning-litany.svg",
  "ability-rootbound-banner.svg",
  "ability-wail-of-ashes.svg",
  "ability-wild-hunt.svg",
  "ability.svg",
  "building-barracks.svg",
  "building-cottage-cluster.svg",
  "building-defense.svg",
  "building-economy.svg",
  "building-farmstead.svg",
  "building-hero.svg",
  "building-hero-shrine.svg",
  "building-infirmary.svg",
  "building-kennels-stables.svg",
  "building-logging-camp.svg",
  "building-market-cross.svg",
  "building-mineworks.svg",
  "building-monster-roost.svg",
  "building-mythic-gate.svg",
  "building-palisade-gate.svg",
  "building-relic-vault.svg",
  "building-scout-lodge.svg",
  "building-seat.svg",
  "building-siege-foundry.svg",
  "building-smithy.svg",
  "building-storehouse.svg",
  "building-tech.svg",
  "building-temple-of-lore.svg",
  "building-war-council.svg",
  "building-war.svg",
  "building-watchtower.svg",
  "building-witchglass-cairn.svg",
  "building-witchglass.svg",
  "building-workshop.svg",
  "faction-hollow.svg",
  "faction-thorn.svg",
  "hero-bone-regent.svg",
  "hero-hartmarshal.svg",
  "hero-hollow.svg",
  "hero-thorn.svg",
  "hero-thorn-queen.svg",
  "hero-wailing-matron.svg",
  "objective-moon-pool.svg",
  "objective-watcher-ruin.svg",
  "objective-witchglass-shard.svg",
  "objective.svg",
  "squad-bark-ancient.svg",
  "squad-bone-thrall.svg",
  "squad-bone-wagon.svg",
  "squad-briar-guard.svg",
  "squad-carrion-bat.svg",
  "squad-crypt-lancer.svg",
  "squad-dew-chanter.svg",
  "squad-dread-knight.svg",
  "squad-grave-bow.svg",
  "squad-hart-lancer.svg",
  "squad-moth-scout.svg",
  "squad-mourning-choir.svg",
  "squad-needle-archer.svg",
  "squad-wild-hunt-rider.svg",
  "unit-bark-ancient.svg",
  "unit-bone-thrall.svg",
  "unit-bone-wagon.svg",
  "unit-briar-guard.svg",
  "unit-carrion-bat.svg",
  "unit-crypt-lancer.svg",
  "unit-dew-chanter.svg",
  "unit-dread-knight.svg",
  "unit-grave-bow.svg",
  "unit-hart-lancer.svg",
  "unit-hollow.svg",
  "unit-moth-scout.svg",
  "unit-mourning-choir.svg",
  "unit-needle-archer.svg",
  "unit-thorn.svg",
  "unit-wild-hunt-rider.svg"
].sort();

export function summarizeShowcaseIconIntegration({
  abilities = [],
  squads = [],
  units = [],
  buildings = [],
  objectives = [],
  heroes = [],
  factions = [],
  iconFiles = KNOWN_ICON_FILES
} = {}) {
  const records = [
    ...iconRecords("ability", abilities),
    ...iconRecords("squad", squads),
    ...iconRecords("unit", units),
    ...iconRecords("building", buildings),
    ...iconRecords("objective", objectives),
    ...iconRecords("hero", heroes),
    ...iconRecords("faction", factions)
  ];
  const availableIcons = new Set(iconFiles ?? KNOWN_ICON_FILES);
  const iconSurfaceKinds = uniqueSorted(records.map((record) => record.surface));
  const genericPlayableIconUses = records
    .filter((record) => PLAYABLE_ICON_SURFACES.has(record.surface))
    .filter((record) => GENERIC_PLAYABLE_ICON_FILE_SET.has(record.icon))
    .map((record) => `${record.surface}:${record.id}:${record.icon}`)
    .sort();
  const genericBuildingIconUses = records
    .filter((record) => record.surface === "building")
    .filter((record) => GENERIC_BUILDING_ICON_FILE_SET.has(record.icon))
    .map((record) => `${record.surface}:${record.id}:${record.icon}`)
    .sort();
  const genericHeroIconUses = records
    .filter((record) => record.surface === "hero")
    .filter((record) => GENERIC_HERO_ICON_FILE_SET.has(record.icon))
    .map((record) => `${record.surface}:${record.id}:${record.icon}`)
    .sort();
  const genericUnitIconUses = records
    .filter((record) => record.surface === "unit")
    .filter((record) => GENERIC_UNIT_ICON_FILE_SET.has(record.icon))
    .map((record) => `${record.surface}:${record.id}:${record.icon}`)
    .sort();
  const missingIconFiles = records
    .filter((record) => record.icon && !availableIcons.has(record.icon))
    .map((record) => `${record.surface}:${record.id}:${record.icon}`)
    .sort();
  const dedicatedAbilityIconKinds = dedicatedIconKinds(records, "ability", "ability-");
  const dedicatedBuildingIconKinds = dedicatedIconKinds(records, "building", "building-", GENERIC_BUILDING_ICON_FILE_SET);
  const dedicatedHeroIconKinds = dedicatedIconKinds(records, "hero", "hero-", GENERIC_HERO_ICON_FILE_SET);
  const dedicatedSquadIconKinds = dedicatedIconKinds(records, "squad", "squad-");
  const dedicatedUnitIconKinds = dedicatedIconKinds(records, "unit", "unit-", GENERIC_UNIT_ICON_FILE_SET);

  const missingIconPillars = [
    hasEveryRequiredSurface(iconSurfaceKinds) ? null : "seven_content_icon_surfaces",
    genericPlayableIconUses.length === 0 ? null : "no_generic_playable_icons",
    genericBuildingIconUses.length === 0 ? null : "no_generic_building_icons",
    genericHeroIconUses.length === 0 ? null : "no_generic_hero_icons",
    genericUnitIconUses.length === 0 ? null : "no_generic_unit_icons",
    missingIconFiles.length === 0 ? null : "all_referenced_icon_assets_exist",
    dedicatedAbilityIconKinds.length >= REQUIRED_DEDICATED_ABILITY_ICONS ? null : "dedicated_ability_icons",
    dedicatedBuildingIconKinds.length >= REQUIRED_DEDICATED_BUILDING_ICONS ? null : "dedicated_building_icons",
    dedicatedHeroIconKinds.length >= REQUIRED_DEDICATED_HERO_ICONS ? null : "dedicated_hero_icons",
    dedicatedSquadIconKinds.length >= REQUIRED_DEDICATED_SQUAD_ICONS ? null : "dedicated_squad_icons",
    dedicatedUnitIconKinds.length >= REQUIRED_DEDICATED_UNIT_ICONS ? null : "dedicated_unit_icons"
  ].filter(Boolean);

  return {
    showcaseIconIntegrationPass: missingIconPillars.length === 0,
    missingIconPillars,
    iconSurfaceKinds,
    genericPlayableIconUses,
    genericPlayableIconUseCount: genericPlayableIconUses.length,
    genericBuildingIconUses,
    genericBuildingIconUseCount: genericBuildingIconUses.length,
    genericHeroIconUses,
    genericHeroIconUseCount: genericHeroIconUses.length,
    genericUnitIconUses,
    genericUnitIconUseCount: genericUnitIconUses.length,
    missingIconFiles,
    dedicatedAbilityIconKinds,
    dedicatedBuildingIconKinds,
    dedicatedHeroIconKinds,
    dedicatedSquadIconKinds,
    dedicatedUnitIconKinds,
    dedicatedAbilityIconCount: dedicatedAbilityIconKinds.length,
    dedicatedBuildingIconCount: dedicatedBuildingIconKinds.length,
    dedicatedHeroIconCount: dedicatedHeroIconKinds.length,
    dedicatedSquadIconCount: dedicatedSquadIconKinds.length,
    dedicatedUnitIconCount: dedicatedUnitIconKinds.length,
    dedicatedPlayableIconCount: dedicatedAbilityIconKinds.length + dedicatedSquadIconKinds.length + dedicatedUnitIconKinds.length,
    contentIconCount: records.filter((record) => record.icon).length
  };
}

function iconRecords(surface, collection) {
  return collectionValues(collection)
    .filter((entry) => entry?.icon)
    .map((entry) => ({
      surface,
      id: entry.id ?? "unknown",
      icon: entry.icon
    }));
}

function dedicatedIconKinds(records, surface, prefix, excludedIcons = GENERIC_PLAYABLE_ICON_FILE_SET) {
  return uniqueSorted(records
    .filter((record) => record.surface === surface)
    .filter((record) => record.icon?.startsWith(prefix))
    .filter((record) => !excludedIcons.has(record.icon))
    .map((record) => record.icon));
}

function hasEveryRequiredSurface(surfaceKinds) {
  return REQUIRED_ICON_SURFACES.every((surface) => surfaceKinds.includes(surface));
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

function uniqueSorted(values) {
  return [...new Set(values)].filter(Boolean).sort();
}
