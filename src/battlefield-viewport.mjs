export function fitBattlefieldViewport({ canvasWidth, canvasHeight, worldWidth, worldHeight }) {
  const width = Math.max(1, Number(canvasWidth) || 1);
  const height = Math.max(1, Number(canvasHeight) || 1);
  const mapWidth = Math.max(1, Number(worldWidth) || 1);
  const mapHeight = Math.max(1, Number(worldHeight) || 1);
  const scale = Math.min(width / mapWidth, height / mapHeight);
  const fittedWidth = mapWidth * scale;
  const fittedHeight = mapHeight * scale;
  const area = width * height;
  return {
    scale,
    offsetX: (width - fittedWidth) / 2,
    offsetY: (height - fittedHeight) / 2,
    width: fittedWidth,
    height: fittedHeight,
    worldWidth: mapWidth,
    worldHeight: mapHeight,
    blankRatio: area > 0 ? 1 - (fittedWidth * fittedHeight) / area : 0
  };
}

export function screenPointToWorldPoint({ screenX, screenY, viewport, tileSize, worldTilesWide, worldTilesHigh }) {
  const x = (Number(screenX) - viewport.offsetX) / viewport.scale / tileSize;
  const y = (Number(screenY) - viewport.offsetY) / viewport.scale / tileSize;
  return {
    x,
    y,
    inBounds: x >= 0 && y >= 0 && x < worldTilesWide && y < worldTilesHigh
  };
}

export function summarizeBattlefieldViewport(viewport) {
  return {
    scale: round(viewport.scale),
    offsetX: round(viewport.offsetX),
    offsetY: round(viewport.offsetY),
    width: round(viewport.width),
    height: round(viewport.height),
    blankRatio: round(viewport.blankRatio)
  };
}

function round(value) {
  return Number(value.toFixed(3));
}
