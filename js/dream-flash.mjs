/**
 * Dream-flash scheduling for the Aesop theater.
 * Subliminal glyph / pointillism blips — never raster images.
 * Browser player inlines the same logic in index.html — keep them aligned.
 */

export const FLASH_MS_MIN = 8;
export const FLASH_MS_MAX = 36;

/** Morph-peak waits until the crab is mostly formed, then a short hold. */
export const MORPH_PEAK_EASE = 0.84;
export const MORPH_PEAK_DELAY_MS = 18;

export const SPEAK_START_UTTERANCE = "utterance-start";
export const SPEAK_START_CAPTION = "caption-reveal";

/** Phase palettes: hue + glyph stamps that vector-map into colored dots. */
export const PHASE_DREAM = Object.freeze({
  hook: Object.freeze({
    hue: 48,
    glyphs: "*+",
    density: 0.55,
    speak: true,
    morphPeak: true,
    breakthrough: false,
  }),
  room: Object.freeze({
    hue: 150,
    glyphs: "82",
    density: 0.32,
    speak: true,
    morphPeak: false,
    breakthrough: false,
  }),
  itch: Object.freeze({
    hue: 18,
    glyphs: "81?",
    density: 0.62,
    speak: true,
    morphPeak: true,
    breakthrough: false,
  }),
  turn: Object.freeze({
    hue: 300,
    glyphs: ">>*",
    density: 0.92,
    speak: true,
    morphPeak: true,
    breakthrough: true,
  }),
  craft: Object.freeze({
    hue: 205,
    glyphs: "/#",
    density: 0.38,
    speak: true,
    morphPeak: false,
    breakthrough: false,
  }),
  moral: Object.freeze({
    hue: 270,
    glyphs: "*~",
    density: 0.28,
    speak: true,
    morphPeak: false,
    breakthrough: false,
  }),
  encore: Object.freeze({
    hue: 52,
    glyphs: "*O",
    density: 0.7,
    speak: true,
    morphPeak: true,
    breakthrough: false,
  }),
});

const GLYPH_STAMPS = Object.freeze({
  "*": Object.freeze([" # # ", "  #  ", "#####", "  #  ", " # # "]),
  "+": Object.freeze(["  #  ", "  #  ", "#####", "  #  ", "  #  "]),
  ">": Object.freeze(["#  ", " ##", "  #", " ##", "#  "]),
  "?": Object.freeze([" ## ", "#  #", "  # ", "    ", "  # "]),
  "8": Object.freeze([" ## ", "#  #", " ## ", "#  #", " ## "]),
  "2": Object.freeze(["### ", "   #", " ## ", "#   ", "####"]),
  "1": Object.freeze([" # ", "## ", " # ", " # ", "###"]),
  "/": Object.freeze(["   #", "  # ", " #  ", "#   "]),
  "#": Object.freeze(["####", "####", "####", "####"]),
  "O": Object.freeze([" ## ", "#  #", "#  #", "#  #", " ## "]),
  "~": Object.freeze(["    ", " # #", "# # "]),
});

export function clampFlashMs(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n)) return FLASH_MS_MIN;
  return Math.min(FLASH_MS_MAX, Math.max(FLASH_MS_MIN, n));
}

export function flashDurationMs(phaseId, reason) {
  const dream = PHASE_DREAM[phaseId];
  const density = dream?.density ?? 0.4;
  if (reason === "breakthrough") return clampFlashMs(FLASH_MS_MAX);
  if (reason === "morph-peak") return clampFlashMs(16 + density * 12);
  return clampFlashMs(10 + density * 16);
}

export function shouldScheduleFlash({ reduceMotion, reason, phaseId, frame } = {}) {
  if (reduceMotion) return false;
  const dream = PHASE_DREAM[phaseId];
  if (!dream) return false;
  if (reason === "speak-start") return Boolean(dream.speak);
  if (reason === "morph-peak") return Boolean(dream.morphPeak);
  if (reason === "breakthrough") {
    return Boolean(dream.breakthrough) && Number(frame) === 1;
  }
  return false;
}

/** Voice onstart when synthesis can run; caption class-in is the silent fallback. */
export function speakStartSource({ canSpeak } = {}) {
  return canSpeak ? SPEAK_START_UTTERANCE : SPEAK_START_CAPTION;
}

export function shouldFireSpeakStartFlash({
  source,
  event,
  reduceMotion = false,
  utteranceStarted = false,
} = {}) {
  if (reduceMotion) return false;
  if (source === SPEAK_START_UTTERANCE) {
    if (event === SPEAK_START_UTTERANCE) return true;
    return event === "utterance-error" && !utteranceStarted;
  }
  return event === SPEAK_START_CAPTION;
}

export function morphPeakReady({ easeT, threshold = MORPH_PEAK_EASE } = {}) {
  return Number(easeT) >= threshold;
}

function flashDelayMs(reason, delayMs) {
  if (delayMs != null && Number.isFinite(Number(delayMs))) {
    return Math.max(0, Number(delayMs));
  }
  return reason === "morph-peak" ? MORPH_PEAK_DELAY_MS : 0;
}

function flashDensity(dream, reason) {
  if (reason === "breakthrough") return Math.min(1, dream.density + 0.18);
  if (reason === "morph-peak") return Math.max(0.2, dream.density * 0.72);
  return dream.density;
}

export function scheduleDreamFlash({
  now,
  phaseId,
  frame = 0,
  reason,
  reduceMotion = false,
  delayMs,
} = {}) {
  if (!shouldScheduleFlash({ reduceMotion, reason, phaseId, frame })) return null;
  const dream = PHASE_DREAM[phaseId];
  const durationMs = flashDurationMs(phaseId, reason);
  const delay = flashDelayMs(reason, delayMs);
  const at = Number(now) + delay;
  return {
    at: Number.isFinite(at) ? at : delay,
    durationMs,
    phaseId,
    frame,
    reason,
    hue: dream.hue,
    glyphs: dream.glyphs,
    density: flashDensity(dream, reason),
  };
}

export function isFlashPending(flash, now) {
  if (!flash) return false;
  return now < flash.at;
}

export function isFlashActive(flash, now) {
  if (!flash) return false;
  const t = now - flash.at;
  return t >= 0 && t < flash.durationMs;
}

function fnv1a(str) {
  let h = 2166136261;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stampSize(ch) {
  if (ch === " " || ch === "") return 0;
  if (ch === "#" || ch === "%") return 3;
  return 2;
}

function clusterCells(glyphs) {
  const chars = String(glyphs || "*").split("").filter(Boolean);
  const points = [];
  let col = 0;
  for (const ch of chars) {
    const stamp = GLYPH_STAMPS[ch] || GLYPH_STAMPS["*"];
    for (let r = 0; r < stamp.length; r++) {
      const line = stamp[r];
      for (let c = 0; c < line.length; c++) {
        const cell = line[c];
        const n = stampSize(cell);
        for (let y = 0; y < n; y++) {
          for (let x = 0; x < n; x++) {
            points.push({
              col: col + c + (x + 0.4) / Math.max(n, 1),
              row: r + (y + 0.4) / Math.max(n, 1),
            });
          }
        }
      }
    }
    col += (stamp[0]?.length || 4) + 1;
  }
  return points;
}

/**
 * Map a scheduled flash into colored field points (arcs), not pixels of a photo.
 */
export function dreamBurstPoints(flash, width, height) {
  if (!flash) return [];
  const w = Math.max(40, Number(width) || 0);
  const h = Math.max(40, Number(height) || 0);
  const cells = clusterCells(flash.glyphs);
  const rand = mulberry32(fnv1a(`${flash.phaseId}:${flash.reason}:${flash.frame}`));
  const density = Math.max(0.2, Math.min(1, Number(flash.density) || 0.4));
  const copies = 2 + Math.round(density * 5);
  const cx = w * (0.42 + (flash.reason === "breakthrough" ? 0.08 : 0));
  const cy = h * 0.38;
  const span = Math.min(w, h) * (0.18 + density * 0.16);
  const points = [];
  for (let n = 0; n < copies; n++) {
    const ox = (rand() - 0.5) * span * 1.4;
    const oy = (rand() - 0.5) * span * 0.9;
    const scale = (0.55 + rand() * 0.7) * (span / 18);
    for (const cell of cells) {
      if (rand() > 0.22 + density * 0.55) continue;
      points.push({
        x: cx + ox + cell.col * scale,
        y: cy + oy + cell.row * scale,
        r: 0.9 + density * 1.4 + rand() * 0.6,
        h: flash.hue + (rand() - 0.5) * 18,
        s: 78 + rand() * 18,
        l: 58 + rand() * 22,
        a: 0.72 + rand() * 0.28,
      });
    }
  }
  return points;
}
