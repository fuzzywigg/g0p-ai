/**
 * Fable-specific paint for episode p11 — The Porsche Deal Hunter Trigger.
 * Phase ids and templates come from js/phases.mjs; only this imagery is unique.
 */

export const FABLE_P11 = {
  episode: "p11",
  title: "The Porsche Deal Hunter Trigger",
  imagery: {
    hook: {
      pose: "proud",
      wall: "NEVER RUN",
      footer: "CHANCE LOST"
    },
    room: {
      pose: "inspect",
      badge: "CRON",
      footer: "BLANK LAST RUN"
    },
    itch: {
      pose: "uneasy",
      badge: "SILENT",
      wall: "NO FIRE",
      footer: "MISSED DEAL"
    },
    turn: {
      approach: {
        pose: "racer",
        wall: "*/5",
        footer: "MAKE IT SPEAK"
      },
      breakthrough: {
        pose: "snap",
        wall: "IT FIRES",
        footer: "9 AND 1",
        burst: "TEST THE SCHEDULE"
      }
    },
    craft: {
      pose: "scar",
      badge: "SPACE",
      footer: "TRAILING CHAR"
    },
    moral: {
      pose: "pray",
      badge: "SEEN",
      footer: "CHANCE KEPT"
    },
    encore: {
      pose: "enter",
      title: "p11",
      footer: "THE HUNT IS ON"
    }
  },
};
