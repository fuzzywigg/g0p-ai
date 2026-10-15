/**
 * Fable-specific paint for episode p03 — The Key That Wasn't Supposed to Write.
 * Phase ids and templates come from js/phases.mjs; only this imagery is unique.
 */

export const FABLE_P03 = {
  episode: "p03",
  title: "The Key That Wasn't Supposed to Write",
  imagery: {
    hook: {
      pose: "proud",
      wall: "A 403",
      footer: "WIDER IS WRONG"
    },
    room: {
      pose: "inspect",
      badge: "KEY",
      footer: "NOT THIS DOOR"
    },
    itch: {
      pose: "uneasy",
      badge: "DENIED",
      wall: "403",
      footer: "THE WRONG YES"
    },
    turn: {
      approach: {
        pose: "racer",
        wall: "WIDEN IT",
        footer: "MORE SCOPE"
      },
      breakthrough: {
        pose: "snap",
        wall: "NARROWER",
        footer: "THE REFUSAL",
        burst: "KEEP THE WALL"
      }
    },
    craft: {
      pose: "scar",
      badge: "SCOPE",
      footer: "THE KEY REFUSED"
    },
    moral: {
      pose: "pray",
      badge: "403",
      footer: "DON'T WIDEN"
    },
    encore: {
      pose: "enter",
      title: "p03",
      footer: "THE LOCK HELD"
    }
  },
};
