/**
 * Geryon's growth across one episode.
 * Glyphs and bruise-hues accumulate with phase progress (the same clock as
 * the narration cues). Hook is a few marks and one gray. The encore holds
 * every printable ASCII character and a full bruise palette.
 */

import { clamp01 } from "./glyph-ramp.mjs";
import { smoothstep } from "./phase-color.mjs";

export const PHASE_ORDER = Object.freeze([
  "hook",
  "room",
  "itch",
  "turn",
  "craft",
  "moral",
  "encore",
]);

/** 0x20–0x7E, space included. 95 characters. */
export const PRINTABLE_ASCII = Object.freeze(
  Array.from({ length: 95 }, (_, i) => String.fromCharCode(0x20 + i)),
);

const FIRST = Object.freeze([".", ":", "o"]);

/** Eaten in order after the first three. Leftovers append so the set completes. */
const NEXT = Object.freeze([
  "'", "~", "+", "*", "-", ",", ";", "^", '"', "`",
  "/", "\\", "|", "(", ")", "[", "]", "{", "}",
  "=", "_", "!", "?", "#", "%", "@", "$", "&", "<", ">",
]);

function buildShadeOrder() {
  const all = PRINTABLE_ASCII.filter((ch) => ch !== " ");
  const seen = new Set();
  const out = [];
  for (const ch of [...FIRST, ...NEXT, ...all]) {
    if (ch === " " || seen.has(ch) || !all.includes(ch)) continue;
    seen.add(ch);
    out.push(ch);
  }
  return out.join("");
}

/** Sparse → dense-ish. Index 0 is the first meal ("."). Space is not in here. */
export const SHADE_ORDER = buildShadeOrder();

const GLYPH_STOPS = Object.freeze({
  hook: Object.freeze([3, 8]),
  room: Object.freeze([8, 16]),
  itch: Object.freeze([16, 28]),
  turn: Object.freeze([28, 46]),
  craft: Object.freeze([46, 68]),
  moral: Object.freeze([68, 82]),
  encore: Object.freeze([82, 94]),
});

const HUE_STOPS = Object.freeze({
  hook: Object.freeze([1, 2]),
  room: Object.freeze([2, 3]),
  itch: Object.freeze([3, 5]),
  turn: Object.freeze([5, 7]),
  craft: Object.freeze([7, 10]),
  moral: Object.freeze([10, 13]),
  encore: Object.freeze([13, 16]),
});

/** Fraction of the stage height the crab's full silhouette aims for. */
const SIZE_STOPS = Object.freeze({
  hook: Object.freeze([0.36, 0.42]),
  room: Object.freeze([0.42, 0.46]),
  itch: Object.freeze([0.46, 0.5]),
  turn: Object.freeze([0.5, 0.54]),
  craft: Object.freeze([0.54, 0.57]),
  moral: Object.freeze([0.57, 0.6]),
  encore: Object.freeze([0.6, 0.62]),
});

/** Bruise hues, in the order mishaps earn them. */
export const BRUISE_HUES = Object.freeze([
  Object.freeze({ h: 208, s: 0.08 }),
  Object.freeze({ h: 152, s: 0.48 }),
  Object.freeze({ h: 32, s: 0.66 }),
  Object.freeze({ h: 346, s: 0.72 }),
  Object.freeze({ h: 12, s: 0.64 }),
  Object.freeze({ h: 198, s: 0.55 }),
  Object.freeze({ h: 44, s: 0.6 }),
  Object.freeze({ h: 274, s: 0.52 }),
  Object.freeze({ h: 166, s: 0.46 }),
  Object.freeze({ h: 28, s: 0.7 }),
  Object.freeze({ h: 318, s: 0.48 }),
  Object.freeze({ h: 186, s: 0.42 }),
  Object.freeze({ h: 54, s: 0.5 }),
  Object.freeze({ h: 250, s: 0.4 }),
  Object.freeze({ h: 138, s: 0.38 }),
  Object.freeze({ h: 18, s: 0.58 }),
]);

function phaseId(id) {
  return Object.prototype.hasOwnProperty.call(GLYPH_STOPS, id) ? id : "hook";
}

function lerpStop(id, progress, table) {
  const pair = table[phaseId(id)];
  return pair[0] + (pair[1] - pair[0]) * smoothstep(clamp01(progress));
}

export function glyphCountAt(phase, progress = 0) {
  return Math.round(lerpStop(phase, progress, GLYPH_STOPS));
}

export function dietAt(phase, progress = 0) {
  const n = Math.max(1, Math.min(SHADE_ORDER.length, glyphCountAt(phase, progress)));
  return SHADE_ORDER.slice(0, n);
}

export function hueCountAt(phase, progress = 0) {
  return Math.round(lerpStop(phase, progress, HUE_STOPS));
}

export function bruiseHues(phase, progress = 0) {
  const n = Math.max(1, Math.min(BRUISE_HUES.length, hueCountAt(phase, progress)));
  return BRUISE_HUES.slice(0, n);
}

export function stageFraction(phase, progress = 0) {
  return lerpStop(phase, progress, SIZE_STOPS);
}

export function growthState(phase, progress = 0) {
  const diet = dietAt(phase, progress);
  const hues = bruiseHues(phase, progress);
  return {
    phase: phaseId(phase),
    diet,
    glyphCount: diet.length + 1,
    glyphTotal: PRINTABLE_ASCII.length,
    hues,
    hueCount: hues.length,
    fraction: stageFraction(phase, progress),
  };
}
