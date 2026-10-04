/**
 * Aesop color arc for the glyph theater.
 * Hook starts near-monochrome and cool. Each phase walks toward the next,
 * so a phase boundary is continuous. Encore keeps climbing into full color
 * and glow after the moral has settled.
 */

import { clamp01 } from "./glyph-ramp.mjs";

export const STYLE_KEYS = Object.freeze([
  "sat",
  "contrast",
  "warmth",
  "accentAmt",
  "glow",
  "texture",
  "depth",
  "story",
]);

function freezeStyle(style) {
  return Object.freeze({ ...style });
}

export const PHASE_KEYS = Object.freeze({
  hook: freezeStyle({
    sat: 0.05,
    contrast: 0.32,
    warmth: 0.04,
    accentHue: 208,
    accentAmt: 0.04,
    glow: 0.02,
    texture: 0.04,
    depth: 0.12,
    story: 0.04,
  }),
  room: freezeStyle({
    sat: 0.18,
    contrast: 0.44,
    warmth: 0.2,
    accentHue: 168,
    accentAmt: 0.16,
    glow: 0.05,
    texture: 0.1,
    depth: 0.28,
    story: 0.18,
  }),
  itch: freezeStyle({
    sat: 0.34,
    contrast: 0.58,
    warmth: 0.46,
    accentHue: 24,
    accentAmt: 0.36,
    glow: 0.1,
    texture: 0.2,
    depth: 0.42,
    story: 0.33,
  }),
  turn: freezeStyle({
    sat: 0.55,
    contrast: 0.76,
    warmth: 0.6,
    accentHue: 318,
    accentAmt: 0.55,
    glow: 0.26,
    texture: 0.28,
    depth: 0.56,
    story: 0.5,
  }),
  craft: freezeStyle({
    sat: 0.48,
    contrast: 0.7,
    warmth: 0.4,
    accentHue: 204,
    accentAmt: 0.42,
    glow: 0.14,
    texture: 0.92,
    depth: 0.7,
    story: 0.64,
  }),
  moral: freezeStyle({
    sat: 0.66,
    contrast: 0.68,
    warmth: 0.38,
    accentHue: 274,
    accentAmt: 0.6,
    glow: 0.3,
    texture: 0.36,
    depth: 0.86,
    story: 0.78,
  }),
  encore: freezeStyle({
    sat: 0.84,
    contrast: 0.8,
    warmth: 0.58,
    accentHue: 38,
    accentAmt: 0.74,
    glow: 0.72,
    texture: 0.42,
    depth: 0.94,
    story: 0.9,
  }),
});

/** Full-color crest reached at the end of the encore. */
export const ENCORE_CREST = freezeStyle({
  sat: 0.94,
  contrast: 0.88,
  warmth: 0.66,
  accentHue: 28,
  accentAmt: 0.9,
  glow: 1,
  texture: 0.48,
  depth: 1,
  story: 1,
});

const PHASE_ORDER = Object.freeze(["hook", "room", "itch", "turn", "craft", "moral", "encore"]);

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smoothstep(t) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

/** Shortest-arc hue blend, degrees. */
export function lerpHue(a, b, t) {
  const from = ((Number(a) % 360) + 360) % 360;
  const to = ((Number(b) % 360) + 360) % 360;
  let d = to - from;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return (from + d * clamp01(t) + 360) % 360;
}

export function lerpStyle(a, b, t) {
  const x = clamp01(t);
  const out = {};
  for (const key of STYLE_KEYS) {
    out[key] = lerp(a[key], b[key], x);
  }
  out.accentHue = lerpHue(a.accentHue, b.accentHue, x);
  return out;
}

export function phaseColorAt(phaseId, progress = 0) {
  const i = PHASE_ORDER.indexOf(phaseId);
  if (i < 0) return lerpStyle(PHASE_KEYS.hook, PHASE_KEYS.hook, 0);
  const t = smoothstep(progress);
  if (i >= PHASE_ORDER.length - 1) return lerpStyle(PHASE_KEYS.encore, ENCORE_CREST, t);
  const from = PHASE_KEYS[PHASE_ORDER[i]];
  const to = PHASE_KEYS[PHASE_ORDER[i + 1]];
  return lerpStyle(from, to, t);
}

export function hslToRgb(h, s, l) {
  const hue = ((Number(h) % 360) + 360) % 360;
  const sat = clamp01(s);
  const lit = clamp01(l);
  const c = (1 - Math.abs(2 * lit - 1)) * sat;
  const hp = hue / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) {
    r = c;
    g = x;
  } else if (hp < 2) {
    r = x;
    g = c;
  } else if (hp < 3) {
    g = c;
    b = x;
  } else if (hp < 4) {
    g = x;
    b = c;
  } else if (hp < 5) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const m = lit - c / 2;
  return [r + m, g + m, b + m];
}

export function rgbSaturation(rgb) {
  if (!rgb) return 0;
  const r = rgb[0];
  const g = rgb[1];
  const b = rgb[2];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max <= 1e-6) return 0;
  return (max - min) / max;
}

export function mixRgb(a, b, t) {
  const x = clamp01(t);
  return [lerp(a[0], b[0], x), lerp(a[1], b[1], x), lerp(a[2], b[2], x)];
}

export function rgbCss(rgb) {
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  return `rgb(${ch(rgb[0])},${ch(rgb[1])},${ch(rgb[2])})`;
}

/** Sea, shell, highlight, and accent inks for one point on the arc. */
export function buildPalette(style) {
  const seaHue = lerpHue(214, style.accentHue, style.accentAmt * 0.5);
  const shellHue = lerpHue(206, style.accentHue, 0.22 + style.accentAmt * 0.78);
  return {
    style,
    sea: hslToRgb(seaHue, style.sat * 0.38, 0.055 + style.depth * 0.04),
    fog: hslToRgb(
      lerpHue(202, style.accentHue, style.accentAmt * 0.4),
      Math.min(1, style.sat * 0.55 + 0.04),
      0.42 + style.glow * 0.14,
    ),
    shell: hslToRgb(shellHue, Math.min(1, style.sat * 0.95), 0.28 + style.contrast * 0.12),
    hi: hslToRgb(
      lerpHue(shellHue, style.accentHue, 0.45),
      Math.min(1, style.sat + 0.08),
      0.58 + style.contrast * 0.12 + style.glow * 0.05,
    ),
    lo: hslToRgb(lerpHue(shellHue, 228, 0.22), style.sat * 0.5, 0.06 + style.depth * 0.04),
    accent: hslToRgb(style.accentHue, Math.min(1, 0.35 + style.sat * 0.7), 0.46 + style.glow * 0.06),
    sign: hslToRgb(
      lerpHue(style.accentHue, 46, style.warmth * 0.25),
      Math.min(1, 0.12 + style.sat),
      0.64 + style.glow * 0.12,
    ),
    pupil: [0.02 + style.sat * 0.02, 0.03, 0.05],
  };
}

export function applyFlash(palette, flash) {
  if (!flash || !(flash.mix > 0)) return palette;
  const hot = hslToRgb(flash.hue ?? palette.style.accentHue, 0.98, 0.74);
  const m = clamp01(flash.mix);
  return {
    ...palette,
    hi: mixRgb(palette.hi, hot, m),
    accent: mixRgb(palette.accent, hot, m),
    sign: mixRgb(palette.sign, hot, m * 0.65),
    fog: mixRgb(palette.fog, hot, m * 0.45),
  };
}
