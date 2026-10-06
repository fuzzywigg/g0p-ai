/**
 * Fable-specific paint for episode p14 — The Image Tides Echo.
 * Phase ids and templates come from js/phases.mjs; only this imagery is unique.
 */

export const FABLE_P14 = {
  episode: "p14",
  title: "The Image Tides Echo",
  imagery: {
    hook: {
      pose: "proud",
      wall: "THE TIDE",
      footer: "NOT STILL"
    },
    room: {
      pose: "inspect",
      badge: "ECHO",
      footer: "CLEAR RUN"
    },
    itch: {
      pose: "uneasy",
      badge: "CHMOD",
      wall: "MURKY",
      footer: "FLAGS DRIFT"
    },
    turn: {
      approach: {
        pose: "racer",
        wall: "STILL WATER",
        footer: "TODAY'S GREEN"
      },
      breakthrough: {
        pose: "snap",
        wall: "TIDE TURN",
        footer: "CHECK FLAGS",
        burst: "READ THE TIDE"
      }
    },
    craft: {
      pose: "scar",
      badge: "ERRNO",
      footer: "THE EDGE"
    },
    moral: {
      pose: "pray",
      badge: "TIDE",
      footer: "CHECK AGAIN"
    },
    encore: {
      pose: "enter",
      title: "p14",
      footer: "THE TIDE TURNS"
    }
  },
};
