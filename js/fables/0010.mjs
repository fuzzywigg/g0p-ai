/**
 * Fable-specific paint for episode 0010 — The Night We Tamed the Beast.
 * Phase ids and templates come from js/phases.mjs; only this imagery is unique.
 */

export const FABLE_0010 = {
  episode: "0010",
  title: "The Night We Tamed the Beast",
  imagery: {
    hook: {
      pose: "proud",
      wall: "THE BEAST",
      footer: "FAIL LOUD"
    },
    room: {
      pose: "inspect",
      badge: "LEDGER",
      footer: "THE QUIET HOUSE"
    },
    itch: {
      pose: "uneasy",
      badge: "HANG",
      wall: "NO TIMEOUT",
      footer: "THE WILD CRON"
    },
    turn: {
      approach: {
        pose: "racer",
        wall: "NAKED CURL",
        footer: "HOPE IT LANDS"
      },
      breakthrough: {
        pose: "snap",
        wall: "FAIL FAST",
        footer: "IT SCREAMS",
        burst: "BOUND THE BEAST"
      }
    },
    craft: {
      pose: "scar",
      badge: "CODE 10",
      footer: "ON FAILURE"
    },
    moral: {
      pose: "pray",
      badge: "LOUD",
      footer: "HEAR THE HIT"
    },
    encore: {
      pose: "enter",
      title: "0010",
      footer: "THE BEAST SLEEPS"
    }
  },
};
