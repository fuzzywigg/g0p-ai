/**
 * Fable-specific paint for episode p10 — The Backup That Came Back.
 * Phase ids and templates come from js/phases.mjs; only this imagery is unique.
 */

export const FABLE_P10 = {
  episode: "p10",
  title: "The Backup That Came Back",
  imagery: {
    hook: {
      pose: "proud",
      wall: "BACKUP",
      footer: "IT RETURNED"
    },
    room: {
      pose: "inspect",
      badge: "COPY",
      footer: "THE VAULT"
    },
    itch: {
      pose: "uneasy",
      badge: "GONE",
      wall: "EMPTY",
      footer: "WHERE IS IT"
    },
    turn: {
      approach: {
        pose: "racer",
        wall: "LOST",
        footer: "NO COPY"
      },
      breakthrough: {
        pose: "snap",
        wall: "RESTORED",
        footer: "IT'S BACK",
        burst: "BRING IT HOME"
      }
    },
    craft: {
      pose: "scar",
      badge: "RESTORE",
      footer: "THE COPY LIVES"
    },
    moral: {
      pose: "pray",
      badge: "KEEP",
      footer: "MAKE THE COPY"
    },
    encore: {
      pose: "enter",
      title: "p10",
      footer: "THE BACKUP LIVES"
    }
  },
};
