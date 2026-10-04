/**
 * Glyph ramps and edge-aware character choice.
 *
 * Reimplemented ideas (no third-party source copied):
 * - aalib / libcaca: brightness → glyph, plus a fg/bg pair so the cell
 *   reads as a tone instead of a flat stamp
 * - chafa: density, block, and braille sets for different spatial frequencies
 * - Acerola's ASCII edge shader: Sobel-style normal → line glyph, fill stays
 *   on the density ramp
 * Bayer 4×4 ordered dither is the classic public-domain matrix.
 */

export const DENSITY_RAMP = " .:-=+*#%@";
export const BLOCK_RAMP = " ░▒▓█";

/** Braille bit order matches Unicode U+2800 (dots 1–8). */
export const BRAILLE_DOTS = Object.freeze([0x01, 0x02, 0x04, 0x40, 0x08, 0x10, 0x20, 0x80]);

const BAYER4 = Object.freeze([
  Object.freeze([0, 8, 2, 10]),
  Object.freeze([12, 4, 14, 6]),
  Object.freeze([3, 11, 1, 9]),
  Object.freeze([15, 7, 13, 5]),
]);

export function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

export function rampIndex(luma, ramp = DENSITY_RAMP) {
  const source = String(ramp || "");
  if (!source.length) return 0;
  const t = clamp01(luma);
  return Math.min(source.length - 1, Math.round(t * (source.length - 1)));
}

/** Dark → light. 0 is the first ramp cell (space), 1 is the last (@). */
export function densityGlyph(luma, ramp = DENSITY_RAMP) {
  const source = String(ramp || " ");
  return source[rampIndex(luma, source)] || " ";
}

/**
 * Ink coverage of a ramp glyph, 0–1. libcaca-style: perceived tone is
 * fg * coverage + bg * (1 - coverage).
 */
export function glyphCoverage(ch, ramp = DENSITY_RAMP) {
  const source = String(ramp || "");
  const i = source.indexOf(ch);
  if (i < 0 || source.length < 2) return ch && ch !== " " ? 0.5 : 0;
  return i / (source.length - 1);
}

export function perceivedRgb(fg, bg, coverage) {
  const g = clamp01(coverage);
  const ink = Array.isArray(fg) ? fg : [1, 1, 1];
  const paper = Array.isArray(bg) ? bg : [0, 0, 0];
  return [
    paper[0] * (1 - g) + ink[0] * g,
    paper[1] * (1 - g) + ink[1] * g,
    paper[2] * (1 - g) + ink[2] * g,
  ];
}

/**
 * Line glyph for an edge whose direction is `angleRad` (radians, tangent).
 * 0 is a horizontal stroke.
 */
export function edgeGlyph(angleRad, strong = false) {
  let deg = (Number(angleRad) * 180) / Math.PI;
  if (!Number.isFinite(deg)) deg = 0;
  deg = ((deg % 180) + 180) % 180;
  if (deg < 22.5 || deg >= 157.5) return strong ? "═" : "─";
  if (deg < 67.5) return strong ? "╱" : "/";
  if (deg < 112.5) return strong ? "║" : "│";
  return strong ? "╲" : "\\";
}

/** Normal (nx, ny) → stroke perpendicular to that normal. */
export function edgeGlyphFromNormal(nx, ny, strong = false) {
  const mag = Math.hypot(Number(nx) || 0, Number(ny) || 0);
  if (mag < 1e-6) return strong ? "═" : "─";
  return edgeGlyph(Math.atan2(ny, nx) + Math.PI / 2, strong);
}

export function brailleFromMask(mask) {
  const bits = Number(mask) & 0xff;
  return String.fromCharCode(0x2800 + bits);
}

export function bayerDither(luma, col, row, amount = 0.18) {
  const amp = Number(amount);
  if (!Number.isFinite(amp) || amp === 0) return clamp01(luma);
  const jitter = (BAYER4[Math.abs(row | 0) & 3][Math.abs(col | 0) & 3] + 0.5) / 16 - 0.5;
  return clamp01(Number(luma) + jitter * amp);
}

export function cellHash(x, y) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
