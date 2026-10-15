/**
 * Fable-specific paint for episode p12 — The Loom That Faltered at Dawn.
 * Phase ids and templates come from js/phases.mjs; only this imagery is unique.
 */

export const FABLE_P12 = {
  episode: "p12",
  title: "The Loom That Faltered at Dawn",
  imagery: {
    hook: {
      pose: "proud",
      wall: "THE LOOM",
      footer: "DAWN FALTER"
    },
    room: {
      pose: "inspect",
      badge: "MONTHLY",
      footer: "SPIN THE CLOTH"
    },
    itch: {
      pose: "uneasy",
      badge: "DENIED",
      wall: "GATE SHUT",
      footer: "LOOM STOPPED"
    },
    turn: {
      approach: {
        pose: "racer",
        wall: "THE STITCH",
        footer: "WATCH GATES"
      },
      breakthrough: {
        pose: "snap",
        wall: "LESSON",
        footer: "NOT LAMENT",
        burst: "MEND THE GATE"
      }
    },
    craft: {
      pose: "scar",
      badge: "EXEC",
      footer: "THE NICK"
    },
    moral: {
      pose: "pray",
      badge: "MEND",
      footer: "BEFORE NEXT CYCLE"
    },
    encore: {
      pose: "enter",
      title: "p12",
      footer: "THE LOOM SINGS"
    }
  },
};
