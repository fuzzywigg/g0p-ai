/**
 * Fable-specific paint for episode 0006 — The Ratchet That Never Turned.
 * Phase ids and templates come from js/phases.mjs; only this imagery is unique.
 */

export const FABLE_0006 = {
  episode: "0006",
  title: "The Ratchet That Never Turned",
  imagery: {
    hook: {
      pose: "proud",
      wall: "LOCAL GREEN",
      footer: "HERE != CI",
    },
    room: {
      pose: "inspect",
      badge: "82",
      footer: "THE ROOM",
    },
    itch: {
      pose: "uneasy",
      badge: "81",
      wall: "81",
      footer: "CLEAN RUNNER",
    },
    turn: {
      approach: {
        pose: "racer",
        wall: "LOCAL GREEN",
        footer: "IT WORKS HERE",
      },
      breakthrough: {
        pose: "snap",
        wall: "81 CAUGHT",
        footer: "IT WORKS",
        burst: "BREAK THROUGH",
      },
    },
    craft: {
      pose: "scar",
      badge: "PROMOTE",
      footer: "RETRACT",
    },
    moral: {
      pose: "pray",
      badge: "PRAYER",
      footer: "THE MORAL",
    },
    encore: {
      pose: "enter",
      title: "0006",
      footer: "THE GATE TURNED",
    },
  },
};
