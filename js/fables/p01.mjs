/**
 * Fable-specific paint for episode p01 — The Key That Fits the Lock.
 * Phase ids and templates come from js/phases.mjs; only this imagery is unique.
 */

export const FABLE_P01 = {
  episode: "p01",
  title: "The Key That Fits the Lock",
  imagery: {
    hook: {
      pose: "proud",
      wall: "ONE LOCK",
      footer: "NOT EVERY DOOR"
    },
    room: {
      pose: "inspect",
      badge: "PAT",
      footer: "SUNDAY YES"
    },
    itch: {
      pose: "uneasy",
      badge: "9 LIVE",
      wall: "PLAINTEXT",
      footer: "FULL ADMIN"
    },
    turn: {
      approach: {
        pose: "racer",
        wall: "SKELETON",
        footer: "ONE TOKEN"
      },
      breakthrough: {
        pose: "snap",
        wall: "THREE ROWS",
        footer: "ROW 3 HUMAN",
        burst: "SCOPE THE KEY"
      }
    },
    craft: {
      pose: "scar",
      badge: "WRITER",
      footer: "WALLS HOLD"
    },
    moral: {
      pose: "pray",
      badge: "BLAST",
      footer: "BOUNDED COST"
    },
    encore: {
      pose: "enter",
      title: "p01",
      footer: "THE KEY FITS"
    }
  },
};
