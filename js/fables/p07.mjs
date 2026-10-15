/**
 * Fable-specific paint for episode p07 — The GPU Whisper in the WSL Walls.
 * Phase ids and templates come from js/phases.mjs; only this imagery is unique.
 */

export const FABLE_P07 = {
  episode: "p07",
  title: "The GPU Whisper in the WSL Walls",
  imagery: {
    hook: {
      pose: "proud",
      wall: "WSL WALL",
      footer: "THE WHISPER"
    },
    room: {
      pose: "inspect",
      badge: "GPU",
      footer: "INSIDE THE WALL"
    },
    itch: {
      pose: "uneasy",
      badge: "QUIET",
      wall: "NO CUDA",
      footer: "CAN'T HEAR IT"
    },
    turn: {
      approach: {
        pose: "racer",
        wall: "MISSING",
        footer: "NO ENGINE"
      },
      breakthrough: {
        pose: "snap",
        wall: "FUEL LINE",
        footer: "IT WAS THERE",
        burst: "POINT THE FUEL"
      }
    },
    craft: {
      pose: "scar",
      badge: "PATH",
      footer: "THROUGH THE WALL"
    },
    moral: {
      pose: "pray",
      badge: "GPU",
      footer: "POINT THE LINE"
    },
    encore: {
      pose: "enter",
      title: "p07",
      footer: "THE ENGINE HUMS"
    }
  },
};
