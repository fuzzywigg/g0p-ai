/**
 * Fable-specific paint for episode p09 — The Doctor's Order.
 * Phase ids and templates come from js/phases.mjs; only this imagery is unique.
 */

export const FABLE_P09 = {
  episode: "p09",
  title: "The Doctor's Order",
  imagery: {
    hook: {
      pose: "proud",
      wall: "DOCTOR",
      footer: "ONE WOUND"
    },
    room: {
      pose: "inspect",
      badge: "ORDER",
      footer: "THE WARD"
    },
    itch: {
      pose: "uneasy",
      badge: "PILE",
      wall: "ALL AT ONCE",
      footer: "UNTENDED"
    },
    turn: {
      approach: {
        pose: "racer",
        wall: "RUSH",
        footer: "EVERY WOUND"
      },
      breakthrough: {
        pose: "snap",
        wall: "IN TURN",
        footer: "ONE BY ONE",
        burst: "TEND THE WOUND"
      }
    },
    craft: {
      pose: "scar",
      badge: "ROUND",
      footer: "THE ORDER"
    },
    moral: {
      pose: "pray",
      badge: "HEAL",
      footer: "EACH IN TURN"
    },
    encore: {
      pose: "enter",
      title: "p09",
      footer: "THE WARD IS QUIET"
    }
  },
};
