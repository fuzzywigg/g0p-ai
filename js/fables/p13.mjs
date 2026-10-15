/**
 * Fable-specific paint for episode p13 — The Tidal Keeper's Vigil.
 * Phase ids and templates come from js/phases.mjs; only this imagery is unique.
 */

export const FABLE_P13 = {
  episode: "p13",
  title: "The Tidal Keeper's Vigil",
  imagery: {
    hook: {
      pose: "proud",
      wall: "THE TIDE",
      footer: "TOMORROW'S SHORE"
    },
    room: {
      pose: "inspect",
      badge: "WIKI",
      footer: "CLEAN POOL"
    },
    itch: {
      pose: "uneasy",
      badge: "LOCK",
      wall: "EXIT 1",
      footer: "SAME WORDS"
    },
    turn: {
      approach: {
        pose: "racer",
        wall: "OLD FLAW",
        footer: "SAME ERROR"
      },
      breakthrough: {
        pose: "snap",
        wall: "NEW CRACK",
        footer: "RETRY SKIPPED",
        burst: "READ THE RETRY"
      }
    },
    craft: {
      pose: "scar",
      badge: "EXIT 1",
      footer: "THE NICK"
    },
    moral: {
      pose: "pray",
      badge: "VIGIL",
      footer: "CHECK AGAIN"
    },
    encore: {
      pose: "enter",
      title: "p13",
      footer: "THE TIDE KEEPS"
    }
  },
};
