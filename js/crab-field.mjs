/**
 * Shared point grid for the Aesop theater.
 * The crab, drifting glyph-food, sand, kelp, and tableau marks all live on
 * the same cells. A signed-distance crab is lit, then each hit cell picks a
 * glyph from the diet Geryon has eaten so far and a bruise color he has earned.
 */

import { BRAILLE_DOTS, brailleFromMask, cellHash, clamp01 } from "./glyph-ramp.mjs";
import { edgeFromDiet, shadeGlyph, sortByInk, trophyLetter, vocabularyFreckle } from "./glyph-coverage.mjs";
import { SHADE_ORDER, growthState } from "./growth.mjs";
import {
  applyFlash,
  buildPalette,
  hslToRgb,
  mixRgb,
  phaseColorAt,
} from "./phase-color.mjs";

export const CELL_ASPECT = 0.52;
export const VIEW_H = 2.25;
const CRAB_TOP = 0.64;
const CRAB_BOT = -0.58;
const CRAB_SPAN = CRAB_TOP - CRAB_BOT;
const LIGHT = normalize(-0.35, 0.92);

const POSES = Object.freeze([
  "proud",
  "inspect",
  "uneasy",
  "racer",
  "snap",
  "scar",
  "pray",
  "enter",
  "bow",
]);

const TEMPLATES = Object.freeze([
  "spotlight",
  "set",
  "unease",
  "breakthrough",
  "scar",
  "lesson",
  "curtain",
]);

const LEGS = Object.freeze([
  Object.freeze({ x0: 0.24, y0: -0.04, xm: 0.52, ym: -0.02, x1: 0.9, y1: -0.2, w: 0.055, ph: 0.2 }),
  Object.freeze({ x0: 0.2, y0: -0.14, xm: 0.48, ym: -0.22, x1: 0.82, y1: -0.42, w: 0.05, ph: 1.5 }),
  Object.freeze({ x0: 0.12, y0: -0.22, xm: 0.34, ym: -0.36, x1: 0.58, y1: -0.56, w: 0.046, ph: 2.7 }),
]);

function assertNever(value) {
  throw new Error(`unhandled variant: ${value}`);
}

function normalize(x, y) {
  const m = Math.hypot(x, y) || 1;
  return { x: x / m, y: y / m };
}

function sdCircle(x, y, r) {
  return Math.hypot(x, y) - r;
}

function sdEllipse(x, y, rx, ry) {
  const ex = x / Math.max(rx, 1e-4);
  const ey = y / Math.max(ry, 1e-4);
  const m = Math.hypot(ex, ey);
  if (m < 1e-6) return -Math.min(rx, ry);
  return (m - 1) * Math.min(rx, ry);
}

function sdSegment(x, y, ax, ay, bx, by, r) {
  const pax = x - ax;
  const pay = y - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const denom = bax * bax + bay * bay || 1e-8;
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / denom));
  return Math.hypot(pax - bax * h, pay - bay * h) - r;
}

function smoothMin(a, b, k) {
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k));
  return b * (1 - h) + a * h - k * h * (1 - h);
}

function rotate(x, y, ang) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return { x: x * c - y * s, y: x * s + y * c };
}

export function blinkAmount(timeMs) {
  const period = 3800;
  const t = ((Number(timeMs) % period) + period) % period;
  const start = 3180;
  const span = 280;
  if (t < start || t > start + span) return 0;
  return Math.sin(((t - start) / span) * Math.PI);
}

export function gridForViewport(width, height) {
  const w = Math.max(1, Number(width) || 1);
  const h = Math.max(1, Number(height) || 1);
  let cols = Math.round(w / (w < 780 ? 8.2 : 9));
  cols = Math.max(72, Math.min(156, cols));
  let rows = Math.round(h / (w / cols / CELL_ASPECT));
  rows = Math.max(32, Math.min(58, rows));
  while (cols * rows > 7600 && cols > 72) cols -= 2;
  rows = Math.max(32, Math.min(58, Math.round(h / (w / cols / CELL_ASPECT))));
  while (cols * rows > 7600 && rows > 32) rows -= 1;
  return { cols, rows };
}

export function cellToWorld(col, row, cols, rows, aspect = CELL_ASPECT) {
  const xSpan = (cols / Math.max(rows, 1)) * aspect * VIEW_H;
  return {
    x: ((col + 0.5) / cols - 0.5) * xSpan,
    y: (0.5 - (row + 0.5) / rows) * VIEW_H,
  };
}

function worldToCell(x, y, cols, rows, aspect = CELL_ASPECT) {
  const xSpan = (cols / rows) * aspect * VIEW_H;
  return {
    col: Math.round((x / xSpan + 0.5) * cols - 0.5),
    row: Math.round((0.5 - y / VIEW_H) * rows - 0.5),
  };
}

export function poseParams(pose, timeMs = 0, opts = {}) {
  const name = POSES.includes(pose) ? pose : "proud";
  const reduce = Boolean(opts.reduceMotion);
  const time = reduce ? 0 : Number(timeMs) || 0;
  const flourish = reduce ? 0 : clamp01(opts.flourish);
  const phase = PHASE_GROWTH.has(opts.phase) ? opts.phase : "hook";
  const fraction = Number(opts.fraction) > 0 ? opts.fraction : 0.4;
  const scale = (fraction * VIEW_H) / CRAB_SPAN;
  const impact = Number(opts.impact) || 0;
  const base = {
    pose: name,
    phase,
    time,
    x: 0,
    y: 0.18,
    scale,
    squashX: 1 + impact * 0.42,
    squashY: 1 / (1 + impact * 0.42),
    rot: impact * Math.sin(time * 0.011) * 0.4,
    breathe: reduce ? 0 : Math.sin(time * 0.0017) * 0.03,
    lean: 0,
    clawOpen: 0.62,
    clawSpread: 1,
    clawLift: 0,
    legShuffle: reduce ? 0 : 1,
    blink: reduce ? 0 : blinkAmount(time),
    lookX: 0.15,
    lookY: 0.15,
    scar: 0,
    happy: 0,
    flourish,
  };

  switch (name) {
    case "proud":
      break;
    case "inspect":
      base.lookX = 0.7;
      base.clawOpen = 0.28;
      base.clawLift = 0.06;
      break;
    case "uneasy":
      base.rot += -0.12;
      base.y = 0.12;
      base.clawOpen = 0.5;
      base.lookX = -0.45;
      base.lookY = 0.35;
      break;
    case "racer":
      base.lean = 0.22;
      base.x = -0.12;
      base.clawOpen = 0.22;
      base.lookX = 0.85;
      break;
    case "snap":
      base.clawOpen = 0.96;
      base.clawSpread = 1.12;
      base.clawLift = 0.08;
      break;
    case "scar":
      base.scar = 1;
      base.rot += 0.04;
      base.clawOpen = 0.34;
      break;
    case "pray":
      base.clawOpen = 0.08;
      base.clawSpread = 0.55;
      base.clawLift = 0.22;
      base.lookY = 0.55;
      break;
    case "enter":
      base.x = -0.28;
      base.lean = 0.08;
      base.clawOpen = 0.4;
      base.lookX = 0.6;
      break;
    case "bow":
      base.y = 0.02;
      base.rot += 0.32;
      base.clawOpen = 0.45;
      break;
    default: {
      const _never = name;
      return assertNever(_never);
    }
  }

  const chase = reduce ? 0 : Number(opts.chaseX) || 0;
  const bite = reduce ? 0 : Number(opts.bite) || 0;
  const hit = impact + bite;
  const step = reduce ? 0 : Math.sin(time * 0.014);
  const squish = hit * 0.72;
  base.squashX = (1 + squish) * (1 + Math.max(0, step) * 0.06);
  base.squashY = (1 / (1 + squish)) * (1 + Math.max(0, -step) * 0.06);
  base.x += chase;
  if (!reduce) base.y += Math.abs(Math.sin(time * 0.013)) * 0.028;
  if (!reduce && opts.lookAt != null) base.lookX = Number(opts.lookAt) || base.lookX;
  if (!reduce && hit > 0.45) base.rot += Math.sin(time * 0.02) * hit * 0.28;
  if (phase === "moral" || phase === "encore") base.y -= 0.06;
  const clap = clamp01(flourish);
  base.clawOpen = clamp01(base.clawOpen * (1 - clap * 0.82));
  if (clap > 0.15) base.happy = clap;
  return base;
}

const PHASE_GROWTH = new Set([
  "hook",
  "room",
  "itch",
  "turn",
  "craft",
  "moral",
  "encore",
]);

function worldToLocal(wx, wy, pose) {
  const p = rotate(wx - pose.x, wy - pose.y, -pose.rot);
  const sx = pose.scale * pose.squashX;
  const sy = pose.scale * pose.squashY * (1 + pose.breathe);
  return { x: p.x / sx, y: p.y / sy };
}

function localToWorld(lx, ly, pose) {
  const sx = pose.scale * pose.squashX;
  const sy = pose.scale * pose.squashY * (1 + pose.breathe);
  const spun = rotate(lx * sx, ly * sy, pose.rot);
  return { x: spun.x + pose.x, y: spun.y + pose.y };
}

function clawDistance(x, y, side, pose) {
  const mx = x * side;
  const spread = pose.clawSpread;
  const palmX = 0.74 + spread * 0.04;
  const palmY = 0.1 + pose.clawLift;
  const gap = 0.07 + pose.clawOpen * 0.3;
  let d = sdSegment(mx, y, 0.34, 0.02, palmX * 0.86, palmY, 0.09);
  d = smoothMin(d, sdCircle(mx - palmX, y - palmY, 0.15), 0.06);
  const ux = palmX + 0.34;
  const uy = palmY + gap;
  d = Math.min(d, sdSegment(mx, y, palmX - 0.02, palmY, ux, uy, 0.062));
  d = Math.min(d, sdCircle(mx - ux, y - uy, 0.085));
  const lx = palmX + 0.3;
  const ly = palmY - gap * 0.72;
  d = Math.min(d, sdSegment(mx, y, palmX - 0.02, palmY, lx, ly, 0.058));
  d = Math.min(d, sdCircle(mx - lx, y - ly, 0.08));
  return d;
}

function legDistance(x, y, side, pose) {
  const mx = x * side;
  let best = 1e9;
  const amp = pose.legShuffle ? 0.045 : 0;
  for (let i = 0; i < LEGS.length; i++) {
    const leg = LEGS[i];
    const bob = Math.sin(pose.time * 0.004 + leg.ph + (side > 0 ? 0.7 : 0)) * amp;
    const jointX = leg.xm;
    const jointY = leg.ym + bob * 0.4;
    let d = sdSegment(mx, y, leg.x0, leg.y0, jointX, jointY, leg.w);
    d = Math.min(d, sdCircle(mx - jointX, y - jointY, leg.w * 1.35));
    d = Math.min(d, sdSegment(mx, y, jointX, jointY, leg.x1, leg.y1 + bob, leg.w * 0.85));
    d = Math.min(d, sdCircle(mx - leg.x1, y - (leg.y1 + bob), leg.w * 0.7));
    if (d < best) best = d;
  }
  return best;
}

function eyeField(x, y, pose) {
  const blink = clamp01(pose.blink);
  const ry = Math.max(0.028, 0.09 * (1 - 0.88 * blink));
  const rx = 0.09;
  const left = { x: -0.18 + pose.lookX * 0.04, y: 0.56 + pose.lookY * 0.02 };
  const right = { x: 0.2 + pose.lookX * 0.04, y: 0.56 + pose.lookY * 0.02 };
  const stalk = Math.min(
    sdSegment(x, y, -0.08, 0.28, left.x, left.y - 0.07, 0.045),
    sdSegment(x, y, 0.1, 0.28, right.x, right.y - 0.07, 0.045),
  );
  const leftEye = sdEllipse(x - left.x, y - left.y, rx, ry);
  const rightEye = sdEllipse(x - right.x, y - right.y, rx, ry);
  const pr = 0.032 * (1 - 0.9 * blink);
  const leftPupil = sdCircle(x - (left.x + pose.lookX * 0.02), y - (left.y + pose.lookY * 0.012), pr);
  const rightPupil = sdCircle(x - (right.x + pose.lookX * 0.02), y - (right.y + pose.lookY * 0.012), pr);
  return { stalk, leftEye, rightEye, leftPupil, rightPupil, left, right };
}

export function crabSdf(x, y, pose) {
  const sx = x + y * (pose.lean || 0);
  let shell = sdEllipse(sx, y - 0.02, 0.56, 0.32);
  shell = smoothMin(shell, sdCircle(sx * 0.92, y + 0.08, 0.34), 0.16);
  shell = smoothMin(shell, sdEllipse(sx, y + 0.02, 0.32, 0.16), 0.1);
  if (pose.scar) {
    const cut = sdSegment(sx, y, -0.02, 0.14, 0.34, -0.12, 0.02);
    shell = Math.max(shell, -cut);
  }
  let best = shell;
  let mat = "shell";
  function take(d, name) {
    if (d < best) {
      best = d;
      mat = name;
    }
  }
  take(clawDistance(sx, y, -1, pose), "claw");
  take(clawDistance(sx, y, 1, pose), "claw");
  take(legDistance(sx, y, -1, pose), "leg");
  take(legDistance(sx, y, 1, pose), "leg");
  const eyes = eyeField(sx, y, pose);
  take(eyes.stalk, "stalk");
  take(eyes.leftEye, "eye");
  take(eyes.rightEye, "eye");
  if (eyes.leftEye < 0.02 && eyes.leftPupil < 0) {
    best = eyes.leftPupil;
    mat = "pupil";
  } else if (eyes.rightEye < 0.02 && eyes.rightPupil < 0) {
    best = eyes.rightPupil;
    mat = "pupil";
  }
  return { d: best, mat };
}

function crabNormal(x, y, pose) {
  const e = 0.018;
  const dx = crabSdf(x + e, y, pose).d - crabSdf(x - e, y, pose).d;
  const dy = crabSdf(x, y + e, pose).d - crabSdf(x, y - e, pose).d;
  return normalize(dx, dy);
}

function emptyCell() {
  return { ch: " ", fg: null, bg: null, role: "sea" };
}

function put(cells, col, row, ch, fg, bg, role) {
  if (!ch || ch === " ") return;
  const cols = cells[0]?.length ?? 0;
  const rows = cells.length;
  if (row < 0 || col < 0 || row >= rows || col >= cols) return;
  cells[row][col] = { ch, fg, bg: bg || null, role: role || "scene" };
}

function writeString(cells, text, col, row, fg, bg) {
  const value = String(text ?? "");
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (row < 0 || col + i < 0 || row >= cells.length || col + i >= cells[0].length) continue;
    if (ch === " ") cells[row][col + i] = emptyCell();
    else put(cells, col + i, row, ch, fg, bg, "sign");
  }
}

function centerCol(cols, text) {
  return Math.max(0, Math.floor((cols - String(text || "").length) / 2));
}

function sortedDiet(growth, ink) {
  return sortByInk(growth.diet, ink);
}

function darken(rgb, t = 0.32) {
  return [rgb[0] * t, rgb[1] * t, rgb[2] * t + 0.01];
}

function shellColor(local, luma, hues) {
  const n = hues.length;
  let idx = 0;
  if (n > 1) {
    const blot = cellHash(Math.floor(local.x * 4.5 + 3), Math.floor(local.y * 4.5 + 1));
    idx = Math.min(n - 1, Math.floor(blot * n));
    if (local.x > 0.45) idx = n - 1;
    else if (local.x < -0.45 && n > 2) idx = Math.min(n - 1, 1 + (idx % 2));
    if (local.y < -0.25 && n > 3) idx = Math.min(n - 1, Math.max(idx, Math.min(3, n - 1)));
  }
  const hue = hues[idx];
  const lit = 0.42 + clamp01(luma) * 0.46;
  const sat = Math.min(0.92, hue.s * (0.8 + luma * 0.25));
  return hslToRgb(hue.h, sat, lit);
}

function impactAmount(phase, frame, time, reduce) {
  if (phase === "turn" && frame === 1) return reduce ? 0.28 : 0.72;
  if (reduce) return 0;
  if (phase === "itch") return Math.pow(Math.max(0, Math.sin(time * 0.0028)), 2) * 0.85;
  if (phase === "turn") return Math.pow(Math.max(0, Math.sin(time * 0.0042)), 2) * 0.55;
  if (phase === "room") return Math.pow(Math.max(0, Math.sin(time * 0.0019 + 1.2)), 2) * 0.35;
  return 0;
}

function paintWater(cells, state, palette, growth) {
  const cols = cells[0].length;
  const rows = cells.length;
  const reduce = Boolean(state.reduceMotion);
  const t = reduce ? 0 : (Number(state.time) || 0) * 0.001;
  const phase = state.phaseId || "hook";
  const diet = growth.diet;
  const dim = mixRgb(palette.sea, palette.fog, 0.55);
  const sand = hslToRgb(36, phase === "hook" ? 0.05 : 0.28, 0.28);
  const band = Math.floor(rows * 0.8);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const world = cellToWorld(c, r, cols, rows, state.aspect || CELL_ASPECT);
      let ch = " ";
      let fg = dim;
      let bg = null;
      let role = "sea";

      const side = Math.min(c, cols - 1 - c);
      if (phase !== "hook" && side < 3 && r > 7 && r < band - 1) {
        const sway = reduce ? 0 : Math.round(Math.sin(t * 0.8 + r * 0.25) * 0.8);
        if (c === sway || c === cols - 1 + sway) {
          ch = diet.includes("|") ? "|" : diet.includes(":") ? ":" : ".";
          fg = mixRgb(palette.fog, palette.accent, 0.35);
          role = "kelp";
        }
      }

      if (phase !== "hook" && phase !== "room" && r === band) {
        ch = diet.includes(".") ? "." : diet[0];
        fg = sand;
        role = "sand";
      }

      const deepLine = Math.floor(rows * 0.7);
      if ((phase === "craft" || phase === "moral" || phase === "encore") && (r === deepLine || r === deepLine - 2)) {
        if (c % 4 === 0) {
          const tones = sortByInk(diet, state.ink);
          ch = tones[r === deepLine ? Math.min(2, tones.length - 1) : 0] || ".";
          fg = mixRgb(palette.fog, palette.accent, phase === "encore" ? 0.35 : 0.16);
          role = "depth";
        }
      }

      if (phase === "encore" && r === 1 && (c < 8 || c > cols - 9)) {
        ch = diet.includes("=") ? "=" : "o";
        fg = mixRgb(palette.accent, palette.hi, 0.5);
        bg = mixRgb(palette.lo, palette.accent, 0.35);
        role = "curtain";
      }

      if (phase === "turn" && state.frame === 0 && world.y > -0.15 && world.y < 0.45 && world.x < -0.9) {
        if (c % 5 === 0) {
          ch = diet.includes("-") ? "-" : ".";
          fg = mixRgb(palette.fog, palette.accent, 0.4);
          role = "streak";
        }
      }

      cells[r][c] = ch === " " ? { ch: " ", fg: null, bg, role } : { ch, fg, bg, role };
    }
  }
}

function morselGlyphs(growth) {
  const upcoming = SHADE_ORDER.slice(growth.diet.length, growth.diet.length + 5);
  return upcoming.length ? [...upcoming] : ["@", "o", "*", "#"];
}

export function morselPositions(time, reduce, glyphs) {
  const list = glyphs && glyphs.length ? glyphs : ["o"];
  const t = reduce ? 0.42 : ((Number(time) || 0) % 7000) / 7000;
  const sweep = reduce ? 0 : Math.sin((Number(time) || 0) * 0.00145);
  return list.map((ch, i) => {
    const span = 2.5;
    const x = -1.25 + ((i + 0.5) / list.length) * span + sweep * (0.55 + i * 0.06);
    const fall = reduce ? 0.18 + i * 0.12 : (t * (0.9 + i * 0.04) + i * 0.17) % 1;
    return {
      ch,
      x: Math.max(-1.45, Math.min(1.45, x)),
      y: 1.05 - fall * 1.95,
    };
  });
}

export function followFood(morsels, time, reduce) {
  if (reduce || !morsels || !morsels.length) return { x: 0, bite: 0, look: 0.15 };
  let best = morsels[0];
  let score = 1e9;
  for (let i = 0; i < morsels.length; i++) {
    const morsel = morsels[i];
    const s = Math.abs(morsel.y - 0.18) * 1.7 + Math.abs(morsel.x) * 0.02;
    if (s < score) {
      score = s;
      best = morsel;
    }
  }
  const roam = Math.sin((Number(time) || 0) * 0.0015) * 1.2;
  const x = Math.max(-1.35, Math.min(1.35, best.x * 0.8 + roam * 0.38));
  const dx = Math.abs(x - best.x);
  const dy = Math.abs(best.y - 0.18);
  const close = Math.max(0, 1 - dx / 0.2) * Math.max(0, 1 - dy / 0.14);
  return {
    x,
    bite: close > 0.75 ? close * 0.5 : 0,
    look: Math.max(-1, Math.min(1, (best.x - x) * 1.6)),
  };
}

function paintFood(cells, state, palette, pose, morsels) {
  const cols = cells[0].length;
  const rows = cells.length;
  let caught = false;
  const fg = mixRgb(palette.hi, palette.accent, 0.35);
  for (let i = 0; i < morsels.length; i++) {
    const morsel = morsels[i];
    const local = worldToLocal(morsel.x, morsel.y, pose);
    if (crabSdf(local.x, local.y, pose).d < 0.05) {
      caught = true;
      continue;
    }
    const cell = worldToCell(morsel.x, morsel.y, cols, rows, state.aspect || CELL_ASPECT);
    put(cells, cell.col, cell.row, morsel.ch, fg, null, "food");
  }
  return caught;
}

function paintSigns(cells, state, palette, growth) {
  const cols = cells[0].length;
  const rows = cells.length;
  const img = state.imagery || {};
  const fg = palette.sign;
  const hud = mixRgb(palette.fog, palette.hi, 0.35);
  const sideRow = 14;
  const label = `${growth.glyphCount}/${growth.glyphTotal} glyphs  ${growth.hueCount} hues`;
  writeString(cells, label, centerCol(cols, label), 0, hud, null);

  if (state.episodeMark && state.template !== "curtain") {
    writeString(cells, String(state.episodeMark), 2, sideRow, fg, null);
  }
  if (img.wall && state.template !== "curtain") {
    const labelWall = String(img.wall).slice(0, 16);
    writeString(cells, labelWall, Math.max(2, cols - 3 - labelWall.length), sideRow, fg, null);
  }
  if (img.badge) {
    const badge = `[${img.badge}]`;
    writeString(cells, badge, Math.max(2, cols - 3 - badge.length), sideRow + 2, palette.accent, null);
  }
  if (img.burst) {
    const burst = String(img.burst);
    writeString(cells, burst, centerCol(cols, burst), 1, palette.accent, null);
  }
  if (img.title) {
    writeString(cells, String(img.title), Math.max(2, cols - 3 - String(img.title).length), sideRow + 2, fg, null);
  }
  if (img.footer) {
    const foot = String(img.footer);
    writeString(cells, foot, centerCol(cols, foot), 2, fg, null);
  }
  if (state.template === "curtain") {
    const title = "CURTAIN";
    writeString(cells, title, centerCol(cols, title), 1, palette.hi, null);
  }
}

function paintAudience(cells, state, palette, growth) {
  if (state.template !== "curtain") return;
  const cols = cells[0].length;
  const rows = cells.length;
  const row = Math.floor(rows * 0.78);
  const glyph = growth.diet.includes("#") ? "#" : "o";
  const eye = growth.diet.includes("o") ? "o" : glyph;
  const fg = mixRgb(palette.accent, palette.hi, 0.4);
  for (let i = 0; i < 4; i++) {
    const c = 2 + i * 6;
    put(cells, c, row, glyph, fg, null, "audience");
    put(cells, c + 1, row, eye, palette.hi, null, "audience");
    put(cells, c + 2, row, glyph, fg, null, "audience");
  }
}

function shadeCrab(hit, normal, local, growth, palette, col, row, ink) {
  const ndotl = Math.max(0, normal.x * LIGHT.x + normal.y * LIGHT.y);
  const luma = 0.22 + ndotl * 0.78;
  const tones = sortedDiet(growth, ink);
  if (hit.mat === "pupil") {
    const ch = tones.includes("@") ? "@" : tones.includes("*") ? "*" : "o";
    return { ch, fg: [0.04, 0.05, 0.07], bg: [0.92, 0.94, 0.9], luma: 0.1, role: "crab" };
  }
  if (hit.mat === "eye") {
    const ch = tones.includes("O") ? "O" : "o";
    return { ch, fg: [0.06, 0.07, 0.08], bg: [0.9, 0.93, 0.88], luma: 0.92, role: "crab" };
  }
  const tone = shellColor(local, luma, growth.hues);
  const fg = [0.16 + tone[0] * 0.84, 0.16 + tone[1] * 0.84, 0.18 + tone[2] * 0.82];
  const edge = hit.d > -0.016;
  let ch = edge ? edgeFromDiet(normal.x, normal.y, tones) : shadeGlyph(luma, tones, col, row);
  if (!edge) {
    const speck = vocabularyFreckle(growth.diet, ch, col, row);
    if (speck) ch = speck;
    else if (cellHash(col * 3, row * 7) > 0.992) {
      const trophy = trophyLetter(growth.diet, col, row);
      if (trophy) ch = trophy;
    }
  }
  return { ch, fg, bg: null, luma, role: "crab" };
}

function rimBraille(world, pose, cols, rows, aspect) {
  const xSpan = (cols / rows) * aspect * VIEW_H;
  const dx = xSpan / cols;
  const dy = VIEW_H / rows;
  const xs = [-0.27, 0.27];
  const ys = [-0.38, -0.13, 0.13, 0.38];
  let mask = 0;
  let inside = 0;
  let i = 0;
  for (let sx = 0; sx < xs.length; sx++) {
    for (let sy = 0; sy < ys.length; sy++) {
      const local = worldToLocal(world.x + xs[sx] * dx, world.y - ys[sy] * dy, pose);
      if (crabSdf(local.x, local.y, pose).d < 0) {
        mask |= BRAILLE_DOTS[i];
        inside += 1;
      }
      i += 1;
    }
  }
  if (inside === 0 || inside > 3) return "";
  return brailleFromMask(mask);
}

function paintGrain(cells, local, hit, growth, col, row, cols, rows) {
  const phase = growth.phase;
  if (phase === "hook" || phase === "room") return false;
  const gx = 0.1;
  const gy = 0.02;
  const dist = Math.hypot(local.x - gx, local.y - gy);
  if (hit.mat !== "shell" || hit.d > 0) return false;
  if (dist > 0.16) return false;
  const gold = hslToRgb(42, phase === "itch" ? 0.35 : 0.72, phase === "itch" ? 0.72 : 0.78);
  if (dist < 0.045) {
    const ch = phase === "itch" ? "." : growth.diet.includes("@") ? "@" : "o";
    cells[row][col] = { ch, fg: [0.25, 0.16, 0.05], bg: gold, role: "grain" };
    return true;
  }
  if ((phase === "turn" || phase === "craft" || phase === "moral" || phase === "encore") && dist < 0.12) {
    const ch = growth.diet.includes("o") ? "o" : cells[row][col].ch;
    const bg = mixRgb(cells[row][col].bg || gold, gold, 0.65);
    cells[row][col] = { ch, fg: darken(bg, 0.28), bg, role: "pearl" };
    return true;
  }
  return false;
}

function paintCrab(cells, state, palette, growth, pose) {
  const cols = cells[0].length;
  const rows = cells.length;
  const floor = Math.floor(rows * 0.8);
  const hot = state.flash && state.flash.mix > 0 ? hslToRgb(state.flash.hue ?? 40, 0.9, 0.7) : null;
  for (let r = 0; r < floor; r++) {
    for (let c = 0; c < cols; c++) {
      const world = cellToWorld(c, r, cols, rows, state.aspect || CELL_ASPECT);
      const local = worldToLocal(world.x, world.y, pose);
      if (local.x * local.x > 2.8 || local.y * local.y > 1.2) continue;
      const hit = crabSdf(local.x, local.y, pose);
      if (hit.d > 0) continue;
      const morph = state.morphT == null ? 1 : clamp01(state.morphT);
      if (morph < 0.999 && cellHash(c * 3 + 1, r * 5) > morph) continue;
      const aspect = state.aspect || CELL_ASPECT;
      if (hit.d > -0.02 && hit.mat !== "eye" && hit.mat !== "pupil") {
        const braille = rimBraille(world, pose, cols, rows, aspect);
        if (braille && braille !== "⠀") {
          const tone = shellColor(local, 0.72, growth.hues);
          cells[r][c] = {
            ch: braille,
            fg: [0.2 + tone[0] * 0.8, 0.2 + tone[1] * 0.8, 0.22 + tone[2] * 0.78],
            bg: null,
            role: "rim",
          };
          continue;
        }
      }
      const normal = crabNormal(local.x, local.y, pose);
      const shaded = shadeCrab(hit, normal, local, growth, palette, c, r, state.ink);
      let fg = shaded.fg;
      let bg = shaded.bg;
      if (hot) {
        fg = mixRgb(fg, hot, 0.45);
        if (bg) bg = mixRgb(bg, hot, 0.28);
      }
      let ch = shaded.ch;
      if (pose.flourish > 0.2 && hit.mat === "claw" && cellHash(c, r) > 0.72) {
        ch = growth.diet.includes("*") ? "*" : "+";
        if (!growth.diet.includes("*") && !growth.diet.includes("+")) ch = "o";
      }
      cells[r][c] = { ch, fg, bg, role: "crab" };
      paintGrain(cells, local, hit, growth, c, r, cols, rows);
    }
  }
}

function paintSparks(cells, state, palette, growth, pose) {
  if (!(pose.flourish > 0.05) && !(pose.happy > 0.4)) return;
  const cols = cells[0].length;
  const rows = cells.length;
  const marks = growth.diet.includes("*") ? "*+o" : "o:.";
  for (let n = 0; n < 10; n++) {
    const side = n % 2 === 0 ? -1 : 1;
    const local = {
      x: side * (0.95 + (n % 3) * 0.06),
      y: 0.28 + (n % 4) * 0.05,
    };
    const world = localToWorld(local.x, local.y, pose);
    const cell = worldToCell(world.x, world.y, cols, rows, state.aspect || CELL_ASPECT);
    put(cells, cell.col, cell.row, marks[n % marks.length], palette.accent, null, "spark");
  }
}

export function renderGlyphField(state = {}) {
  const cols = Math.max(8, state.cols | 0 || 96);
  const rows = Math.max(8, state.rows | 0 || 36);
  const playing = Boolean(state.playing);
  const phaseId = PHASE_GROWTH.has(state.phaseId) ? state.phaseId : "hook";
  const progress = playing ? clamp01(state.progress) : 0;
  let palette = buildPalette(phaseColorAt(phaseId, progress));
  palette = applyFlash(palette, state.flash);
  const growth = growthState(phaseId, playing ? progress : 0);
  const reduce = Boolean(state.reduceMotion);
  const time = Number(state.time) || 0;
  const frame = Number(state.frame) || 0;
  const impact = playing ? impactAmount(phaseId, frame, time, reduce) : 0;
  const morsels = playing ? morselPositions(time, reduce, morselGlyphs(growth)) : [];
  const follow = followFood(morsels, time, reduce);
  const pose = playing
    ? poseParams(state.pose || "proud", time, {
        reduceMotion: reduce,
        flourish: state.flourish,
        phase: phaseId,
        fraction: growth.fraction,
        impact,
        chaseX: follow.x,
        bite: follow.bite,
        lookAt: follow.look,
      })
    : null;
  const cells = Array.from({ length: rows }, () => Array.from({ length: cols }, emptyCell));
  const scene = {
    ...state,
    phaseId,
    pose,
    cols,
    rows,
  };
  paintWater(cells, scene, palette, growth);
  if (playing && pose) {
    const caught = paintFood(cells, scene, palette, pose, morsels);
    if (caught) {
      pose.happy = Math.max(pose.happy, 0.85);
      pose.clawOpen = clamp01(pose.clawOpen * 0.15);
      pose.lookY = Math.max(pose.lookY, 0.5);
    }
    paintSigns(cells, scene, palette, growth);
    paintAudience(cells, scene, palette, growth);
    paintCrab(cells, scene, palette, growth, pose);
    paintSparks(cells, scene, palette, growth, pose);
  }
  return { cols, rows, cells, palette, pose, growth };
}

export function flowFields(from, to, t, reduceMotion = false) {
  if (!to) return from;
  const morph = clamp01(t);
  if (!from || reduceMotion || morph >= 0.999) return to;
  if (morph <= 0) return from;
  if (from.cols !== to.cols || from.rows !== to.rows || !from.cells || !to.cells) {
    return morph < 0.5 ? from : to;
  }
  const cells = new Array(to.rows);
  for (let r = 0; r < to.rows; r++) {
    const drift = Math.round((1 - morph) * Math.sin(r * 0.37 + 0.4) * 8);
    const row = new Array(to.cols);
    for (let c = 0; c < to.cols; c++) {
      const src = Math.max(0, Math.min(to.cols - 1, c + drift));
      const sample = cellHash(c, r) < morph ? to.cells[r][c] : from.cells[r][src];
      row[c] = sample;
    }
    cells[r] = row;
  }
  return { ...to, cells };
}

export function fieldToText(field) {
  if (!field?.cells) return "";
  return field.cells.map((row) => row.map((cell) => cell.ch || " ").join("")).join("\n");
}

export function countGlyph(field, ch) {
  let n = 0;
  const rows = field?.cells || [];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      if (row[c].ch === ch) n += 1;
    }
  }
  return n;
}

export function centerInkRatio(field) {
  const cols = field?.cols || 0;
  const rows = field?.rows || 0;
  if (!cols || !rows) return 0;
  const r0 = Math.floor(rows * 0.22);
  const r1 = Math.floor(rows * 0.78);
  const c0 = Math.floor(cols * 0.22);
  const c1 = Math.floor(cols * 0.78);
  let total = 0;
  let ink = 0;
  for (let r = r0; r < r1; r++) {
    for (let c = c0; c < c1; c++) {
      total += 1;
      const cell = field.cells[r][c];
      if (cell && cell.ch && cell.ch !== " ") ink += 1;
    }
  }
  return total ? ink / total : 0;
}

export function crabSpanFraction(field) {
  const rows = field?.rows || 0;
  let minR = Infinity;
  let maxR = -1;
  const grid = field?.cells || [];
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    for (let c = 0; c < row.length; c++) {
      if (row[c].role === "crab" || row[c].role === "rim" || row[c].role === "grain" || row[c].role === "pearl") {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
      }
    }
  }
  if (maxR < 0 || !rows) return 0;
  return (maxR - minR + 1) / rows;
}

export { TEMPLATES, POSES };
