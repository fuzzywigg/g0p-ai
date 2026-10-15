/**
 * Fable-specific paint for episode p18 — The Three Silent Watchers.
 * Phase ids and templates come from js/phases.mjs; only this imagery is unique.
 */

export const FABLE_P18 = {
  episode: "p18",
  title: "The Three Silent Watchers",
  imagery: {
    hook: {
      pose: "proud",
      wall: "THREE SILENT",
      footer: "WATCHERS"
    },
    room: {
      pose: "inspect",
      badge: "NEVER RUN",
      footer: "THREE NEW LINES"
    },
    itch: {
      pose: "uneasy",
      badge: "SILENT",
      wall: "DORMANT?",
      footer: "POISED OR JUNK"
    },
    turn: {
      approach: {
        pose: "racer",
        wall: "DEAD JOBS",
        footer: "DELETE THEM"
      },
      breakthrough: {
        pose: "snap",
        wall: "WAITING",
        footer: "BY DESIGN",
        burst: "READ THE TRIGGER"
      }
    },
    craft: {
      pose: "scar",
      badge: "DEBUG",
      footer: "HEARTBEAT"
    },
    moral: {
      pose: "pray",
      badge: "STILL",
      footer: "WATCH CURRENTS"
    },
    encore: {
      pose: "enter",
      title: "p18",
      footer: "THE WATCH GOES ON"
    }
  },
};
