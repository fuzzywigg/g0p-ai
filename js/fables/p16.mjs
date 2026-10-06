/**
 * Fable-specific paint for episode p16 — The Report That Didn't Come.
 * Phase ids and templates come from js/phases.mjs; only this imagery is unique.
 */

export const FABLE_P16 = {
  episode: "p16",
  title: "The Report That Didn't Come",
  imagery: {
    hook: {
      pose: "proud",
      wall: "NO REPORT",
      footer: "SILENT ALARM"
    },
    room: {
      pose: "inspect",
      badge: "DUE",
      footer: "IT SHOULD LAND"
    },
    itch: {
      pose: "uneasy",
      badge: "QUIET",
      wall: "MISSING",
      footer: "NOTHING CAME"
    },
    turn: {
      approach: {
        pose: "racer",
        wall: "ALL CLEAR",
        footer: "NO NEWS"
      },
      breakthrough: {
        pose: "snap",
        wall: "ABSENT",
        footer: "THE ALARM",
        burst: "HEAR THE QUIET"
      }
    },
    craft: {
      pose: "scar",
      badge: "RETRY",
      footer: "THE WRITE"
    },
    moral: {
      pose: "pray",
      badge: "LOOK",
      footer: "SILENCE IS NEWS"
    },
    encore: {
      pose: "enter",
      title: "p16",
      footer: "THE REPORT"
    }
  },
};
