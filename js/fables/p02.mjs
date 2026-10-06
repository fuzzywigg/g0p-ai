/**
 * Fable-specific paint for episode p02 — The Call That Couldn't Write Yet.
 * Phase ids and templates come from js/phases.mjs; only this imagery is unique.
 */

export const FABLE_P02 = {
  episode: "p02",
  title: "The Call That Couldn't Write Yet",
  imagery: {
    hook: {
      pose: "proud",
      wall: "THE CALL",
      footer: "NOT A WRITE"
    },
    room: {
      pose: "inspect",
      badge: "VOICE",
      footer: "AN AFTERNOON"
    },
    itch: {
      pose: "uneasy",
      badge: "MUTE",
      wall: "NO WRITE",
      footer: "COULDN'T WRITE"
    },
    turn: {
      approach: {
        pose: "racer",
        wall: "WIRED UP",
        footer: "IT SHOULD"
      },
      breakthrough: {
        pose: "snap",
        wall: "NOT YET",
        footer: "THE GAP",
        burst: "HOLD THE PEN"
      }
    },
    craft: {
      pose: "scar",
      badge: "FEAT",
      footer: "THE COMMIT"
    },
    moral: {
      pose: "pray",
      badge: "WAIT",
      footer: "VOICE IS NOT WRITE"
    },
    encore: {
      pose: "enter",
      title: "p02",
      footer: "THE CALL WAITS"
    }
  },
};
