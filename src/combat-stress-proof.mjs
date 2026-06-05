import { createCombatFeedbackEvent } from "./combat-feedback.mjs";
import {
  combatEventPriorityProfile,
  squadPriorityProfile
} from "./combat-priority.mjs";

const PRIORITY_ORDER = ["ability", "command", "impact", "lethal"];

export function combatStressProofFixture({ now = 0 } = {}) {
  const squads = [
    squad("stress-p-guard-1", "briar_guard_squad", "player", 14.0, 10.0, 52, 180, 28, "attack_move", { x: 18.2, y: 10.1 }),
    squad("stress-p-archer-1", "needle_archer_squad", "player", 12.6, 8.6, 82, 180, 58, "attack_move", { x: 16.8, y: 9.2 }),
    squad("stress-p-lancer-1", "hart_lancer_squad", "player", 12.0, 12.0, 76, 120, 72, "attack_move", { x: 21.4, y: 7.4 }),
    squad("stress-p-retreat-1", "briar_guard_squad", "player", 10.7, 13.5, 46, 180, 24, "retreat", { x: 5.0, y: 10.0 }),
    squad("stress-p-reserve-1", "needle_archer_squad", "player", 8.6, 8.0, 180, 180, 100, "capture", { x: 15.0, y: 4.0 }),
    squad("stress-e-thrall-1", "bone_thrall_squad", "enemy", 15.0, 10.1, 96, 210, 62, "attack_move", { x: 13.9, y: 10.0 }),
    squad("stress-e-bow-1", "grave_bow_squad", "enemy", 17.0, 8.9, 72, 180, 45, "attack_move", { x: 12.7, y: 8.7 }),
    squad("stress-e-lancer-1", "crypt_lancer_squad", "enemy", 17.2, 12.1, 104, 120, 70, "attack_move", { x: 10.7, y: 13.4 }),
    squad("stress-e-broken-1", "bone_thrall_squad", "enemy", 18.2, 10.5, 38, 210, 22, "retreat", { x: 27.0, y: 10.0 })
  ];
  const buildings = [
    building("stress-player-seat", "seat_of_rule", "player", 2, 8, 600, 600, 4, 4),
    building("stress-enemy-seat", "seat_of_rule", "enemy", 25, 8, 360, 600, 4, 4),
    building("stress-enemy-watchtower", "watchtower", "enemy", 21, 6, 86, 220, 2, 2),
    building("stress-player-barracks", "barracks", "player", 6, 13, 220, 220, 3, 3)
  ];
  const selectedSquadIds = ["stress-p-guard-1", "stress-p-archer-1", "stress-p-lancer-1"];
  const combatFeedback = [
    feedback("proof-order", now, "order", "player", squads[0], { x: 20.0, y: 9.7 }),
    feedback("proof-ability", now, "ability", "player", squads[1], squads[4], 0),
    feedback("proof-squad-hit", now, "squad-hit", "player", squads[0], squads[4], 26),
    feedback("proof-structure-hit", now, "structure-hit", "player", squads[2], { x: 22.0, y: 7.0 }, 42),
    feedback("proof-death", now, "death", "enemy", squads[0], { x: 18.8, y: 10.3 }, 210, true)
  ];

  return {
    mode: "combat_stress",
    selectedSquadIds,
    buildings,
    squads,
    heroes: [{
      id: "stress-thorn-queen",
      heroId: "thorn_queen",
      level: 2,
      xp: 120,
      cooldowns: { moon_snare: 37 }
    }],
    combatFeedback,
    alerts: [
      "Combat stress proof active.",
      "Priority warning: wounded retreating squad.",
      "Ability, death, squad-hit, structure-hit, and command feedback visible."
    ],
    aiOrders: ["COMBAT_STRESS_PROOF"]
  };
}

export function summarizeCombatStressProof(fixture = {}) {
  const squads = collectionValues(fixture.squads).filter((entry) => Number(entry.hp ?? 0) > 0);
  const selectedSquadIds = collectionValues(fixture.selectedSquadIds);
  const profiles = squads.map((squadEntry) => squadPriorityProfile(squadEntry, {
    selectedSquadIds,
    hostileSquads: squads.filter((candidate) => candidate.owner !== squadEntry.owner)
  }));
  const eventKinds = [...new Set(collectionValues(fixture.combatFeedback).map((event) => event.kind))].sort();
  const eventPriorities = [...new Set(collectionValues(fixture.combatFeedback).map((event) => combatEventPriorityProfile(event).priority))]
    .sort((left, right) => PRIORITY_ORDER.indexOf(left) - PRIORITY_ORDER.indexOf(right));

  return {
    squadCount: squads.length,
    playerSquads: squads.filter((squadEntry) => squadEntry.owner === "player").length,
    enemySquads: squads.filter((squadEntry) => squadEntry.owner === "enemy").length,
    selectedCount: profiles.filter((profile) => profile.selected).length,
    eventKinds,
    eventPriorities,
    priorityWarningSquads: profiles.filter((profile) => profile.marker === "priority_warning").length,
    threatKinds: [...new Set(profiles.map((profile) => profile.threat).filter((threat) => threat !== "clear"))].sort(),
    hasRetreatingSquad: profiles.some((profile) => profile.intent === "retreating")
  };
}

function squad(id, squadId, owner, x, y, hp, maxHp, morale, stance, target) {
  return {
    id,
    owner,
    squadId,
    name: id,
    x,
    y,
    hp,
    maxHp,
    morale,
    target,
    stance,
    rallyPoint: owner === "enemy" ? { x: 27, y: 10 } : { x: 5, y: 10 },
    tacticalStance: stance === "retreat" ? "guard" : "aggressive",
    formation: "wedge",
    targetPriority: "structures"
  };
}

function building(id, buildingId, owner, x, y, hp, maxHp, w, h) {
  return {
    id,
    buildingId,
    owner,
    x,
    y,
    w,
    h,
    hp,
    maxHp,
    active: true,
    buildRemaining: 0,
    buildTotal: 0
  };
}

function feedback(id, now, kind, owner, source, target, damage = 0, lethal = false) {
  return {
    ...createCombatFeedbackEvent({
      id,
      now,
      kind,
      owner,
      source,
      target,
      damage,
      lethal
    }),
    progress: kind === "death" ? 0.36 : kind === "structure-hit" ? 0.44 : 0.28,
    alpha: kind === "death" ? 0.78 : 0.86
  };
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
