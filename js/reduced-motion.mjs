/**
 * Live prefers-reduced-motion transition for the theater.
 * Turning reduce on settles an in-flight morph and drops pending flashes.
 * Turning it off leaves that settled picture alone. It does not replay the
 * morph or bring a cleared flash back.
 */

export function reducedMotionTransition(state, enabled) {
  const prev = Boolean(state && state.reduceMotion);
  const next = Boolean(enabled);
  const morphing = Boolean(state && state.morphing);
  const morphT = state && state.morphT != null ? state.morphT : 0;
  const captionIndex = state && state.captionIndex != null ? state.captionIndex : -1;
  if (next === prev) {
    return {
      reduceMotion: next,
      changed: false,
      settleMorph: false,
      clearFlash: false,
      morphing,
      morphT,
      morphPeakArmed: Boolean(state && state.morphPeakArmed),
      dreamFlash: state ? state.dreamFlash : null,
      captionIndex,
    };
  }
  if (next) {
    return {
      reduceMotion: true,
      changed: true,
      settleMorph: morphing,
      clearFlash: true,
      morphing: false,
      morphT: morphing ? 1 : morphT,
      morphPeakArmed: false,
      dreamFlash: null,
      captionIndex,
    };
  }
  return {
    reduceMotion: false,
    changed: true,
    settleMorph: false,
    clearFlash: false,
    morphing: false,
    morphT,
    morphPeakArmed: false,
    dreamFlash: null,
    captionIndex,
  };
}
