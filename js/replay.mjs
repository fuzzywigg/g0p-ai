/**
 * Replay a completed episode from Hook.
 * Speech, caption timers, morph, and dream state are cleared first.
 * There is no separate pause control.
 */

export function replayReset(state) {
  const phase = state && state.state;
  if (phase !== "done") return { allowed: false };
  return {
    allowed: true,
    playing: false,
    narrationBegun: false,
    captionIndex: -1,
    scene: -1,
    frame: -1,
    morphing: false,
    morphT: 0,
    morphPeakArmed: false,
    dreamFlash: null,
    flourish: 0,
    cancelSpeech: true,
    cancelTimers: true,
    stopAudio: true,
    phase: "hook",
  };
}
