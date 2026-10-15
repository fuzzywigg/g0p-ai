/**
 * Fable-specific paint for episode 0008 — The Mouth Measurement.
 * Phase ids and templates come from js/phases.mjs; only this imagery is unique.
 */

export const FABLE_0008 = {
  episode: "0008",
  title: "The Mouth Measurement",
  imagery: {
    hook: {
      pose: "proud",
      wall: "THE MOUTH",
      footer: "WARM VOICE"
    },
    room: {
      pose: "inspect",
      badge: "KOKORO",
      footer: "06:24 EDT"
    },
    itch: {
      pose: "uneasy",
      badge: "6 CPS",
      wall: "TOO COLD",
      footer: "STALLED MOUTH"
    },
    turn: {
      approach: {
        pose: "racer",
        wall: "NEW MODEL",
        footer: "SHINY THING"
      },
      breakthrough: {
        pose: "snap",
        wall: "RESIDENT",
        footer: "ALREADY WARM",
        burst: "USE WHAT YOU HOLD"
      }
    },
    craft: {
      pose: "scar",
      badge: "ALSA",
      footer: "BROKEN PIPE"
    },
    moral: {
      pose: "pray",
      badge: "HOLD",
      footer: "WARMEST VOICE"
    },
    encore: {
      pose: "enter",
      title: "0008",
      footer: "THE MACHINE SPOKE"
    }
  },
};
