/**
 * Fable-specific paint for episode p19 — The Three Quiet Alarms.
 * Phase ids and templates come from js/phases.mjs; only this imagery is unique.
 */

export const FABLE_P19 = {
  episode: "p19",
  title: "The Three Quiet Alarms",
  imagery: {
    hook: {
      pose: "proud",
      wall: "3 ALARMS",
      footer: "STILL LOOK"
    },
    room: {
      pose: "inspect",
      badge: "CRON",
      footer: "THE QUIET CHAMBER"
    },
    itch: {
      pose: "uneasy",
      badge: "LOW",
      wall: "SILENT",
      footer: "THREE WENT QUIET"
    },
    turn: {
      approach: {
        pose: "racer",
        wall: "LOW PRI",
        footer: "LET IT WAIT"
      },
      breakthrough: {
        pose: "snap",
        wall: "THREE",
        footer: "LOOK AGAIN",
        burst: "COUNT THE BELLS"
      }
    },
    craft: {
      pose: "scar",
      badge: "PATCH",
      footer: "THE THREE FIXES"
    },
    moral: {
      pose: "pray",
      badge: "LOOK",
      footer: "QUIET STILL COUNTS"
    },
    encore: {
      pose: "enter",
      title: "p19",
      footer: "THREE QUIET BELLS"
    }
  },
};
