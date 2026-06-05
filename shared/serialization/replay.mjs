export function createReplay(seed) {
  return {
    version: 1,
    seed,
    commands: []
  };
}

export function recordCommand(replay, command, tick = replay.commands.length + 1) {
  const accepted = {
    tick,
    ...JSON.parse(stableStringify(command))
  };
  return {
    ...replay,
    commands: [...replay.commands, accepted]
  };
}

export function stableStringify(value) {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => [key, sortKeys(nested)]));
  }
  return value;
}
