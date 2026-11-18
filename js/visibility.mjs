/**
 * Background-tab plan.
 * Hiding stops draw work and cancels pending flashes. Showing shifts an
 * in-flight morph by the time spent hidden so it does not jump, and resumes
 * the same speech, audio, and caption timer. It does not start narration again.
 */

export function hiddenPlaybackPlan(state, now) {
  const t = Number(now) || 0;
  return {
    hidden: true,
    hiddenAt: t,
    runFrame: false,
    pauseAudio: Boolean(state && state.audioPlaying),
    pauseSpeech: Boolean(state && state.speechActive),
    pauseCaptionTimer: Boolean(state && state.captionTimer),
    clearFlash: true,
    morphPeakArmed: false,
    morphing: Boolean(state && state.morphing),
    morphStart: state && state.morphStart != null ? state.morphStart : 0,
  };
}

export function shownPlaybackPlan(state, now) {
  const t = Number(now) || 0;
  const hiddenAt = Number(state && state.hiddenAt);
  const elapsed = Number.isFinite(hiddenAt) ? Math.max(0, t - hiddenAt) : 0;
  const morphing = Boolean(state && state.morphing);
  const morphStart = state && state.morphStart != null ? Number(state.morphStart) : 0;
  return {
    hidden: false,
    runFrame: true,
    resetFrameDelta: true,
    morphing,
    morphStart: morphing ? morphStart + elapsed : morphStart,
    resumeAudio: Boolean(state && state.audioPausedByHide),
    resumeSpeech: Boolean(state && state.speechPausedByHide),
    resumeCaptionTimer: Boolean(state && state.captionTimerPaused),
    captionRemaining: Math.max(0, Number(state && state.captionRemaining) || 0),
    startNarration: false,
  };
}
