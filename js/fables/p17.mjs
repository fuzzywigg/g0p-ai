/**
 * Fable-specific paint for episode p17 — PR Source Failure Signature Changed.
 * Phase ids and templates come from js/phases.mjs; only this imagery is unique.
 */

export const FABLE_P17 = {
  episode: "p17",
  title: "PR Source Failure Signature Changed",
  imagery: {
    hook: {
      pose: "proud",
      wall: "NEW VOICE",
      footer: "A CLUE"
    },
    room: {
      pose: "inspect",
      badge: "PR",
      footer: "THE OLD ERROR"
    },
    itch: {
      pose: "uneasy",
      badge: "SHIFT",
      wall: "CHANGED",
      footer: "DIFFERENT FAIL"
    },
    turn: {
      approach: {
        pose: "racer",
        wall: "SAME BUG",
        footer: "OLD SIGN"
      },
      breakthrough: {
        pose: "snap",
        wall: "NEW SIGN",
        footer: "READ IT",
        burst: "THE VOICE CHANGED"
      }
    },
    craft: {
      pose: "scar",
      badge: "STATUS",
      footer: "THE SIGNATURE"
    },
    moral: {
      pose: "pray",
      badge: "CLUE",
      footer: "HEAR THE CHANGE"
    },
    encore: {
      pose: "enter",
      title: "p17",
      footer: "THE SIGNATURE"
    }
  },
};
