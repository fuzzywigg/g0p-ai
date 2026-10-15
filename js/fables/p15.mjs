/**
 * Fable-specific paint for episode p15 — The Steward's First Stumble.
 * Phase ids and templates come from js/phases.mjs; only this imagery is unique.
 */

export const FABLE_P15 = {
  episode: "p15",
  title: "The Steward's First Stumble",
  imagery: {
    hook: {
      pose: "proud",
      wall: "THE STEWARD",
      footer: "FIRST STUMBLE"
    },
    room: {
      pose: "inspect",
      badge: "WARDEN",
      footer: "WALL OF GREEN"
    },
    itch: {
      pose: "uneasy",
      badge: "JSON",
      wall: "EXIT 1",
      footer: "END OF INPUT"
    },
    turn: {
      approach: {
        pose: "racer",
        wall: "MIGRATION",
        footer: "ALL PORTED"
      },
      breakthrough: {
        pose: "snap",
        wall: "OVERLOOKED",
        footer: "THE GUARDIAN",
        burst: "CHECK THE WATCHER"
      }
    },
    craft: {
      pose: "scar",
      badge: "SCHEMA",
      footer: "NEW PATH"
    },
    moral: {
      pose: "pray",
      badge: "SHORE",
      footer: "SHIFTS BENEATH"
    },
    encore: {
      pose: "enter",
      title: "p15",
      footer: "THE SHORE HOLDS"
    }
  },
};
