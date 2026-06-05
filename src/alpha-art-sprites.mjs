const SPRITE_BASE_PATH = "/assets/alpha-tier1/sprites";
const DISK_BASE_PATH = ["client", "web", "assets", "alpha-tier1", "sprites"];

const BUILDING_SPRITES = [
  buildingSprite("ThornCourt_SeatOfRule_AlphaT1", "thorn_court", "seat_of_rule", 150, 150, 0.92, true),
  buildingSprite("ThornCourt_Farmstead_AlphaT1", "thorn_court", "farmstead", 118, 112, 0.9, true),
  buildingSprite("ThornCourt_LoggingCamp_AlphaT1", "thorn_court", "logging_camp", 126, 104, 0.9, true),
  buildingSprite("ThornCourt_Mineworks_AlphaT1", "thorn_court", "mineworks", 126, 110, 0.9, true),
  buildingSprite("ThornCourt_Barracks_AlphaT1", "thorn_court", "barracks", 136, 126, 0.91, true),
  buildingSprite("ThornCourt_Watchtower_AlphaT1", "thorn_court", "watchtower", 90, 128, 0.92, true),
  buildingSprite("HollowLegion_SeatOfRule_AlphaT1", "hollow_legion", "seat_of_rule", 150, 148, 0.92, true),
  buildingSprite("HollowLegion_Farmstead_AlphaT1", "hollow_legion", "farmstead", 118, 112, 0.9, true),
  buildingSprite("HollowLegion_Mineworks_AlphaT1", "hollow_legion", "mineworks", 126, 110, 0.9, true),
  buildingSprite("HollowLegion_CryptBarracks_AlphaT1", "hollow_legion", "barracks", 140, 128, 0.91, true),
  buildingSprite("HollowLegion_BoneWatchtower_AlphaT1", "hollow_legion", "watchtower", 92, 130, 0.92, true)
];

const OBJECTIVE_SPRITES = [
  objectiveSprite("Neutral_WitchglassShard_AlphaT1", "witchglass_shard", 78, 88, 0.86),
  objectiveSprite("Neutral_MoonPool_AlphaT1", "moon_pool", 88, 58, 0.72),
  objectiveSprite("Neutral_WatcherRuin_AlphaT1", "watcher_ruin", 90, 92, 0.9)
];

const SQUAD_SPRITES = [
  squadSprite("ThornCourt_BriarGuard_AlphaT1", "thorn_court", "briar_guard_squad", "briar_guard", 66, 84, 0.9, true),
  squadSprite("ThornCourt_NeedleArcher_AlphaT1", "thorn_court", "needle_archer_squad", "needle_archer", 68, 82, 0.9, true),
  squadSprite("ThornCourt_MothScout_AlphaT1", "thorn_court", "moth_scout_squad", "moth_scout", 84, 66, 0.78, true),
  squadSprite("HollowLegion_BoneThrall_AlphaT1", "hollow_legion", "bone_thrall_squad", "bone_thrall", 66, 82, 0.9, true),
  squadSprite("HollowLegion_GraveBow_AlphaT1", "hollow_legion", "grave_bow_squad", "grave_bow", 68, 82, 0.9, true),
  squadSprite("HollowLegion_CarrionBat_AlphaT1", "hollow_legion", "carrion_bat_squad", "carrion_bat", 88, 64, 0.76, true)
];

export const ALPHA_ART_SPRITES = Object.freeze([
  ...BUILDING_SPRITES,
  ...OBJECTIVE_SPRITES,
  ...SQUAD_SPRITES
]);

const BUILDING_BY_FACTION_AND_ID = new Map(BUILDING_SPRITES.map((sprite) => [`${sprite.faction}:${sprite.gameId}`, sprite]));
const OBJECTIVE_BY_ID = new Map(OBJECTIVE_SPRITES.map((sprite) => [sprite.gameId, sprite]));
const SQUAD_BY_ID = new Map(SQUAD_SPRITES.flatMap((sprite) => [
  [sprite.squadId, sprite],
  [sprite.gameId, sprite]
]));
const IMAGE_CACHE = new Map();

export function alphaBuildingSprite(building, context = {}) {
  const gameId = building?.buildingId ?? building?.gameId ?? building?.id;
  if (!gameId) {
    return null;
  }
  const factionId = building?.faction ?? ownerFactionId(building?.owner, context);
  return BUILDING_BY_FACTION_AND_ID.get(`${factionId}:${gameId}`) ?? null;
}

export function alphaObjectiveSprite(objective) {
  const gameId = objective?.objectiveId ?? objective?.gameId ?? objective?.id;
  return OBJECTIVE_BY_ID.get(gameId) ?? null;
}

export function alphaSquadSprite(squad) {
  const gameId = squad?.squadId ?? squad?.unitId ?? squad?.gameId ?? squad?.id;
  return SQUAD_BY_ID.get(gameId) ?? null;
}

export function alphaArtSpriteCoverageSummary() {
  const factions = new Set(ALPHA_ART_SPRITES.map((sprite) => sprite.faction));
  return {
    totalCount: ALPHA_ART_SPRITES.length,
    buildingCount: BUILDING_SPRITES.length,
    playableBuildingCount: BUILDING_SPRITES.filter((sprite) => sprite.playable).length,
    objectiveCount: OBJECTIVE_SPRITES.length,
    squadCount: SQUAD_SPRITES.length,
    animationReadyCount: SQUAD_SPRITES.filter((sprite) => sprite.animationReady).length,
    factions: [...factions].sort()
  };
}

export function spritePathOnDisk(sprite, root = "") {
  return [root, ...DISK_BASE_PATH, `${sprite.id}.png`].filter(Boolean).join("/");
}

export function preloadAlphaArtSprites({ imageFactory = defaultImageFactory } = {}) {
  if (typeof imageFactory !== "function") {
    return 0;
  }
  for (const sprite of ALPHA_ART_SPRITES) {
    ensureImage(sprite, imageFactory);
  }
  return IMAGE_CACHE.size;
}

export function drawAlphaArtSprite(ctx, sprite, centerX, groundY, options = {}) {
  if (!ctx || !sprite) {
    return false;
  }
  const image = ensureImage(sprite, options.imageFactory ?? defaultImageFactory);
  if (!isImageReady(image)) {
    return false;
  }

  const width = options.width ?? sprite.draw.width;
  const height = options.height ?? sprite.draw.height;
  const anchorX = options.anchorX ?? sprite.draw.anchorX ?? 0.5;
  const anchorY = options.anchorY ?? sprite.draw.anchorY ?? 0.9;
  const offsetX = options.offsetX ?? 0;
  const offsetY = options.offsetY ?? 0;
  const alpha = options.alpha ?? 1;
  const flipX = Boolean(options.flipX);
  const drawX = -width * anchorX;
  const drawY = -height * anchorY;

  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(centerX + offsetX, groundY + offsetY);
  if (flipX) {
    ctx.scale(-1, 1);
  }
  ctx.drawImage(image, drawX, drawY, width, height);
  ctx.restore();
  return true;
}

function buildingSprite(id, faction, gameId, width, height, anchorY, playable = false) {
  return spriteRecord({ category: "building", id, faction, gameId, width, height, anchorY, playable });
}

function objectiveSprite(id, gameId, width, height, anchorY) {
  return spriteRecord({ category: "objective", id, faction: "neutral", gameId, width, height, anchorY, playable: true });
}

function squadSprite(id, faction, squadId, gameId, width, height, anchorY, animationReady = false) {
  return spriteRecord({ category: "squad", id, faction, squadId, gameId, width, height, anchorY, playable: true, animationReady });
}

function spriteRecord({ category, id, faction, gameId, squadId, width, height, anchorY, playable, animationReady }) {
  return Object.freeze({
    category,
    id,
    faction,
    gameId,
    squadId,
    playable: Boolean(playable),
    animationReady: Boolean(animationReady),
    src: `${SPRITE_BASE_PATH}/${id}.png`,
    draw: Object.freeze({
      width,
      height,
      anchorX: 0.5,
      anchorY
    })
  });
}

function ownerFactionId(owner, context = {}) {
  if (owner === "enemy") {
    return context.enemyFaction ?? "hollow_legion";
  }
  if (owner === "neutral" || owner == null) {
    return "neutral";
  }
  return context.playerFaction ?? "thorn_court";
}

function ensureImage(sprite, imageFactory) {
  if (!sprite || typeof imageFactory !== "function") {
    return null;
  }
  if (IMAGE_CACHE.has(sprite.src)) {
    return IMAGE_CACHE.get(sprite.src);
  }
  const image = imageFactory();
  if (!image) {
    return null;
  }
  image.decoding = "async";
  image.loading = "eager";
  image.src = sprite.src;
  IMAGE_CACHE.set(sprite.src, image);
  return image;
}

function defaultImageFactory() {
  if (typeof Image === "undefined") {
    return null;
  }
  return new Image();
}

function isImageReady(image) {
  return Boolean(image?.complete && (image.naturalWidth ?? 0) > 0 && (image.naturalHeight ?? 0) > 0);
}
