/**
 * Fable-specific paint for episode p04 — The Bandit That Learned Their Names.
 * Phase ids and templates come from js/phases.mjs; only this imagery is unique.
 */

export const FABLE_P04 = {
  episode: "p04",
  title: "The Bandit That Learned Their Names",
  imagery: {
    hook: {
      pose: "proud",
      wall: "NAMES",
      footer: "THE BANDIT"
    },
    room: {
      pose: "inspect",
      badge: "WHO",
      footer: "IT LISTENS"
    },
    itch: {
      pose: "uneasy",
      badge: "ALIAS",
      wall: "UNKNOWN",
      footer: "NO NAMES"
    },
    turn: {
      approach: {
        pose: "racer",
        wall: "STRANGER",
        footer: "GUESS WHO"
      },
      breakthrough: {
        pose: "snap",
        wall: "NAMED",
        footer: "IT KNOWS",
        burst: "LEARN THE NAME"
      }
    },
    craft: {
      pose: "scar",
      badge: "ROLL",
      footer: "THE CALL LIST"
    },
    moral: {
      pose: "pray",
      badge: "NAME",
      footer: "KNOW WHO CALLS"
    },
    encore: {
      pose: "enter",
      title: "p04",
      footer: "IT KNOWS YOU"
    }
  },
};
