/**
 * Fable-specific paint for episode p20 — The Farm's Silent Review.
 * Phase ids and templates come from js/phases.mjs; only this imagery is unique.
 */

export const FABLE_P20 = {
  episode: "p20",
  title: "The Farm's Silent Review",
  imagery: {
    hook: {
      pose: "proud",
      wall: "THE FARM",
      footer: "SILENT REVIEW"
    },
    room: {
      pose: "inspect",
      badge: "SKILLS",
      footer: "NEVER RUN"
    },
    itch: {
      pose: "uneasy",
      badge: "EMPTY",
      wall: "NO SKILLS",
      footer: "SEED IN DRY SOIL"
    },
    turn: {
      approach: {
        pose: "racer",
        wall: "BROKEN?",
        footer: "FIX IT NOW"
      },
      breakthrough: {
        pose: "snap",
        wall: "EVENT ONLY",
        footer: "WAITING",
        burst: "WAIT FOR RAIN"
      }
    },
    craft: {
      pose: "scar",
      badge: "TRIGGER",
      footer: "LEAVE A NOTE"
    },
    moral: {
      pose: "pray",
      badge: "PATIENCE",
      footer: "NOT BROKEN"
    },
    encore: {
      pose: "enter",
      title: "p20",
      footer: "THE FIELD WAITS"
    }
  },
};
