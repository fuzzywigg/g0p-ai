/**
 * Ink coverage for ASCII shading.
 * Each printable glyph is drawn into an offscreen cell and the lit pixels
 * are counted. The diet is then sorted light → dense so luminance picks a
 * tone, not the next letter in the alphabet.
 *
 * BAKED_INK is that count for DejaVu Sans Mono at 28px inside a 32×40 cell
 * (pixels above 40). `measureInkOnContext` repeats the measurement on a
 * live canvas so the stage can follow the font it actually paints with.
 */

import { bayerDither, cellHash, clamp01 } from "./glyph-ramp.mjs";

/** char → lit pixel count, lightest first when sorted. */
export const BAKED_INK = Object.freeze({
  "-": 7, "`": 15, ".": 16, "'": 24, ",": 29, ":": 32, _: 34, "~": 38,
  ";": 45, '"': 48, "^": 50, "!": 51, "=": 60, "+": 66, r: 68, "*": 76,
  "/": 76, "\\": 76, "(": 77, ")": 79, l: 79, L: 80, i: 82, "<": 84,
  c: 84, "|": 84, ">": 86, "?": 86, "[": 87, t: 87, T: 88, "7": 89,
  j: 89, "1": 91, "]": 91, z: 91, J: 93, v: 93, I: 96, F: 98, Y: 98,
  s: 98, x: 99, "{": 100, "}": 101, C: 102, o: 106, f: 108, y: 111,
  "2": 114, Z: 115, n: 118, u: 118, "4": 119, "3": 120, e: 121, a: 123,
  k: 123, V: 127, S: 128, U: 129, "5": 131, q: 131, w: 131, E: 134,
  H: 134, A: 135, p: 135, X: 136, G: 139, D: 142, h: 142, P: 143,
  "%": 144, "6": 145, b: 146, m: 146, K: 147, O: 149, "&": 150, "9": 150,
  $: 151, R: 152, "0": 155, g: 157, "8": 158, d: 158, "#": 161, Q: 163,
  B: 166, N: 169, M: 179, W: 181, "@": 183,
});

export function inkOf(ch, table) {
  const live = table && Number(table[ch]);
  if (live > 0) return live;
  return BAKED_INK[ch] || 0;
}

/** Lightest ink first. Ties break by code point so the order is stable. */
export function sortByInk(diet, table) {
  return [...String(diet || "")]
    .filter((ch) => ch !== " ")
    .sort((a, b) => inkOf(a, table) - inkOf(b, table) || a.codePointAt(0) - b.codePointAt(0))
    .join("");
}

/**
 * Glyphs that read as tone rather than as a letter. When several eaten
 * characters share a coverage band, the ramp keeps the earliest of these.
 */
const SHADE_PREFER = ".'\",:;~-=+*#%@";

/**
 * Collapse the ink-sorted diet into a tone ramp. Only shade-like glyphs
 * are kept, and only when each is visibly darker than the last. The
 * densest eaten glyph closes the ramp so highlights stay heavy.
 * Letters stay off this ramp; freckles place them.
 */
export function distinctRamp(sorted) {
  const chars = [...String(sorted || "")].filter((ch) => ch !== " ");
  if (!chars.length) return ".";
  if (chars.length <= 3) return chars.join("");
  const ramp = [];
  let lastInk = -999;
  for (const ch of chars) {
    if (SHADE_PREFER.indexOf(ch) === -1) continue;
    const ink = inkOf(ch);
    if (ink >= lastInk + 14) {
      ramp.push(ch);
      lastInk = ink;
    }
  }
  const dense = chars[chars.length - 1];
  if (!ramp.length) ramp.push(chars[0]);
  if (ramp[ramp.length - 1] !== dense && inkOf(dense) - inkOf(ramp[ramp.length - 1]) > 8) ramp.push(dense);
  return ramp.join("");
}

/** Luminance → a glyph of matching coverage. A little Bayer dither keeps bands from posting. */
export function shadeGlyph(luma, sorted, col = 0, row = 0) {
  const source = distinctRamp(sorted);
  const t = bayerDither(luma, col, row, source.length > 4 ? 0.055 : 0);
  const i = Math.round(clamp01(t) * (source.length - 1));
  return source[Math.max(0, Math.min(source.length - 1, i))];
}

/**
 * An isolated eaten glyph. Lattice spacing keeps these off the tone ramp
 * so they read as freckles, including the letters the crab kept.
 */
export function vocabularyFreckle(diet, base, col, row) {
  if (col % 6 !== 2 || row % 4 !== 1) return "";
  if (cellHash(col, row) < 0.42) return "";
  const pool = [...String(diet || "")].filter((ch) => ch !== " " && ch !== base);
  if (pool.length < 6) return "";
  const h = cellHash(col * 3 + 1, row * 11 + 2);
  return pool[Math.min(pool.length - 1, Math.floor(h * pool.length))] || "";
}

const LINE_GLYPH = Object.freeze({
  "-": "-",
  "|": "|",
  "/": "/",
  "\\": "\\",
});

/** Prefer a stroke the crab has already eaten; otherwise the brightest shade. */
export function edgeFromDiet(nx, ny, sorted) {
  const ax = Math.abs(nx);
  const ay = Math.abs(ny);
  let want = "-";
  if (ax > ay * 1.35) want = "|";
  else if (ay > ax * 1.35) want = "-";
  else want = nx * ny < 0 ? "/" : "\\";
  const diet = sorted || "";
  if (diet.includes(LINE_GLYPH[want])) return LINE_GLYPH[want];
  return shadeGlyph(0.92, diet);
}

/** A letter the crab ate, used as a rare freckle rather than a shading run. */
export function trophyLetter(diet, col, row) {
  const letters = [...String(diet || "")].filter((ch) => /[A-Za-z]/.test(ch));
  if (letters.length < 2) return "";
  const pick = letters[Math.floor((letters.length - 1) * ((col * 17 + row * 13) % 97) / 96)] || letters[0];
  return pick;
}

/**
 * Draw every printable glyph into `ctx` (already sized) and count lit pixels.
 * `ctx` is an offscreen 2D context; the caller owns the canvas.
 */
export function measureInkOnContext(ctx, font, size = 28) {
  const canvas = ctx.canvas;
  const w = canvas.width || 32;
  const h = canvas.height || 40;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${size}px ${font}`;
  const out = {};
  for (let code = 33; code <= 126; code++) {
    const ch = String.fromCharCode(code);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    ctx.fillText(ch, w / 2, h / 2);
    const data = ctx.getImageData(0, 0, w, h).data;
    let n = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 40) n += 1;
    }
    out[ch] = n > 0 ? n : BAKED_INK[ch] || 1;
  }
  return out;
}
