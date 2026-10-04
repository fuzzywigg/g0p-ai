/**
 * Geryon as a signed-distance crab, sampled into a monospace cell grid.
 * Carapace, claws, legs, stalks, and eyes are separate shapes. A light
 * direction shades each hit; edges pick a stroke glyph and fills pick a
 * dithered ramp. Tableau copy and phase scenery land in the same grid.
 */

import {
  BLOCK_RAMP,
  DENSITY_RAMP,
  bayerDither,
  brailleFromMask,
  cellHash,
  clamp01,
  densityGlyph,
  edgeGlyphFromNormal,
} from "./glyph-ramp.mjs";
import { applyFlash, buildPalette, mixRgb, phaseColorAt } from "./phase-color.mjs";

export const CELL_ASPECT = 0.52;
export const VIEW_H = 2.2;

const LIGHT = normalize(-0.42, 0.9);

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

const LEGS = Object.freeze([
  Object.freeze({ x0: 0.18, y0: 0.06, x1: 0.55, y1: 0.3, w: 0.026, ph: 0 }),
  Object.freeze({ x0: 0.24, y0: -0.02, x1: 0.7, y1: 0.08, w: 0.024, ph: 1.3 }),
  Object.freeze({ x0: 0.22, y0: -0.1, x1: 0.64, y1: -0.22, w: 0.024, ph: 2.5 }),
  Object.freeze({ x0: 0.14, y0: -0.16, x1: 0.48, y1: -0.42, w: 0.022, ph: 3.7 }),
]);

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
  let cols = Math.round(w / (w < 780 ? 8.4 : 10));
  cols = Math.max(64, Math.min(148, cols));
  let rows = Math.round(h / (w / cols / CELL_ASPECT));
  rows = Math.max(28, Math.min(68, rows));
  while (cols * rows > 6800 && cols > 64) cols -= 2;
  rows = Math.max(28, Math.min(68, Math.round(h / (w / cols / CELL_ASPECT))));
  while (cols * rows > 6800 && rows > 28) rows -= 1;
  return { cols, rows };
}

export function cellToWorld(col, row, cols, rows, aspect = CELL_ASPECT) {
  const xSpan = (cols / Math.max(rows, 1)) * aspect * VIEW_H;
  return {
    x: ((col + 0.5) / cols - 0.5) * xSpan,
    y: (0.5 - (row + 0.5) / rows) * VIEW_H,
  };
}

export function poseParams(pose, timeMs = 0, opts = {}) {
  const name = POSES.includes(pose) ? pose : "proud";
  const reduce = Boolean(opts.reduceMotion);
  const time = reduce ? 0 : Number(timeMs) || 0;
  const flourish = reduce ? 0 : clamp01(opts.flourish);
  const click = Math.sin(flourish * Math.PI);
  const base = {
    pose: name,
    time,
    x: 0,
    y: -0.08,
    scale: 1.05,
    rot: 0,
    breathe: reduce ? 0 : Math.sin(time * 0.0017) * 0.028,
    lean: 0,
    clawOpen: 0.72,
    clawSpread: 1,
    clawLift: 0,
    legShuffle: reduce ? 0 : 1,
    blink: reduce ? 0 : blinkAmount(time),
    lookX: 0.25,
    lookY: 0.1,
    scar: 0,
  };

  switch (name) {
    case "proud":
      break;
    case "inspect":
      base.x = -0.06;
      base.lookX = 0.85;
      base.clawOpen = 0.18;
      base.clawSpread = 1.08;
      base.clawLift = 0.06;
      break;
    case "uneasy":
      base.rot = -0.14;
      base.y = -0.14;
      base.scale = 0.98;
      base.clawOpen = 0.62;
      base.lookX = -0.55;
      base.lookY = 0.25;
      break;
    case "racer":
      base.lean = 0.28;
      base.x = -0.16;
      base.clawOpen = 0.16;
      base.scale = 1.08;
      base.lookX = 0.9;
      break;
    case "snap":
      base.clawOpen = 0.96;
      base.clawSpread = 1.16;
      base.scale = 1.12;
      base.clawLift = 0.04;
      break;
    case "scar":
      base.scar = 1;
      base.rot = 0.05;
      base.clawOpen = 0.22;
      base.clawSpread = 0.92;
      break;
    case "pray":
      base.clawOpen = 0.06;
      base.clawSpread = 0.42;
      base.clawLift = 0.2;
      base.lookY = 0.45;
      base.y = -0.04;
      break;
    case "enter":
      base.x = -0.46;
      base.lean = 0.1;
      base.clawOpen = 0.28;
      base.lookX = 0.7;
      break;
    case "bow":
      base.y = -0.28;
      base.rot = 0.34;
      base.clawOpen = 0.48;
      base.scale = 1;
      break;
    default: {
      const _never = name;
      return assertNever(_never);
    }
  }

  base.clawOpen = clamp01(base.clawOpen + click * 0.58);
  if (!reduce && flourish > 0) base.legShuffle = 1;
  return base;
}

function worldToLocal(wx, wy, pose) {
  const p = rotate(wx - pose.x, wy - pose.y, -pose.rot);
  const breathe = 1 + pose.breathe;
  return {
    x: p.x / pose.scale,
    y: p.y / (pose.scale * breathe),
  };
}

function clawDistance(x, y, side, pose) {
  const mx = x * side;
  const spread = pose.clawSpread;
  const lift = pose.clawLift;
  const palmX = 0.4 + spread * 0.1;
  const palmY = 0.03 + lift;
  const gap = 0.04 + pose.clawOpen * 0.3;
  const len = 0.38 + spread * 0.06;
  let d = sdSegment(mx, y, 0.22, 0.0, palmX, palmY, 0.04);
  d = Math.min(d, sdCircle(mx - palmX, y - palmY, 0.07));
  d = Math.min(d, sdSegment(mx, y, palmX - 0.02, palmY + 0.02, palmX + len, palmY + gap, 0.038));
  d = Math.min(d, sdSegment(mx, y, palmX - 0.02, palmY - 0.02, palmX + len * 0.92, palmY - gap * 0.8, 0.036));
  return d;
}

function legDistance(x, y, side, pose) {
  const mx = x * side;
  let best = 1e9;
  const amp = pose.legShuffle ? 0.04 : 0;
  for (let i = 0; i < LEGS.length; i++) {
    const leg = LEGS[i];
    const bob = Math.sin(pose.time * 0.005 + leg.ph + (side > 0 ? 0.6 : 0)) * amp;
    const d = sdSegment(mx, y, leg.x0, leg.y0, leg.x1, leg.y1 + bob, leg.w);
    if (d < best) best = d;
  }
  return best;
}

function eyeField(x, y, pose) {
  const blink = clamp01(pose.blink);
  const ry = Math.max(0.012, 0.042 * (1 - 0.86 * blink));
  const rx = 0.04;
  const left = { x: -0.11, y: 0.36 };
  const right = { x: 0.13, y: 0.36 };
  const stalk = Math.min(
    sdSegment(x, y, -0.07, 0.16, left.x, left.y - 0.04, 0.026),
    sdSegment(x, y, 0.07, 0.16, right.x, right.y - 0.04, 0.026),
  );
  const leftEye = sdEllipse(x - left.x, y - left.y, rx, ry);
  const rightEye = sdEllipse(x - right.x, y - right.y, rx, ry);
  const pr = 0.02 * (1 - 0.85 * blink);
  const leftPupil = sdCircle(x - (left.x + pose.lookX * 0.02), y - (left.y + pose.lookY * 0.016), pr);
  const rightPupil = sdCircle(
    x - (right.x + pose.lookX * 0.02),
    y - (right.y + pose.lookY * 0.016),
    pr,
  );
  return { stalk, leftEye, rightEye, leftPupil, rightPupil };
}

export function crabSdf(x, y, pose) {
  const sx = x + y * pose.lean;
  let shell = sdEllipse(sx, y - 0.01, 0.5, 0.22);
  shell = smoothMin(shell, sdEllipse(sx, y + 0.12, 0.28, 0.11), 0.06);
  if (pose.scar) {
    const cut = sdSegment(sx, y, -0.04, 0.12, 0.28, -0.16, 0.015);
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
  if (eyes.leftEye < 0.01 && eyes.leftPupil < 0) {
    best = eyes.leftPupil;
    mat = "pupil";
  } else if (eyes.rightEye < 0.01 && eyes.rightPupil < 0) {
    best = eyes.rightPupil;
    mat = "pupil";
  }
  return { d: best, mat };
}

function crabNormal(x, y, pose, hit) {
  if (hit.d < -0.045 && hit.mat !== "eye" && hit.mat !== "pupil") {
    return normalize(x, y - 0.02);
  }
  const e = 0.016;
  const dx = crabSdf(x + e, y, pose).d - hit.d;
  const dy = crabSdf(x, y + e, pose).d - hit.d;
  return normalize(dx, dy);
}

function emptyCell() {
  return { ch: " ", fg: null, bg: null };
}

function put(cells, col, row, ch, fg, bg) {
  if (!ch || ch === " ") return;
  const cols = cells[0]?.length ?? 0;
  const rows = cells.length;
  if (row < 0 || col < 0 || row >= rows || col >= cols) return;
  cells[row][col] = { ch, fg, bg: bg || null };
}

function writeString(cells, text, col, row, fg, bg) {
  const value = String(text ?? "");
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (row < 0 || col + i < 0 || row >= cells.length || col + i >= cells[0].length) continue;
    if (ch === " ") cells[row][col + i] = emptyCell();
    else put(cells, col + i, row, ch, fg, bg);
  }
}

function centerCol(cols, text) {
  return Math.max(0, Math.floor((cols - String(text || "").length) / 2));
}

function inSpotlight(x, y) {
  const half = 0.16 + (1.15 - y) * 0.28;
  return Math.abs(x) <= half;
}

function paintSea(cells, state, palette) {
  const cols = cells[0].length;
  const rows = cells.length;
  const reduce = Boolean(state.reduceMotion);
  const t = reduce ? 0 : (Number(state.time) || 0) * 0.001;
  const template = state.template || "";
  const phase = state.phaseId || "hook";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const world = cellToWorld(c, r, cols, rows, state.aspect || CELL_ASPECT);
      let ch = " ";
      let fg = palette.fog;
      const deep = cellHash(Math.floor(c * 0.45 + t * 2.2), Math.floor(r * 0.55 + t * 0.35));
      if (deep > 0.996) {
        let mask = 0;
        for (let i = 0; i < 8; i++) {
          if (cellHash(Math.floor(c + t) * 3 + i, Math.floor(r) * 5 + i * 2) > 0.55) {
            mask |= 1 << (i % 8);
          }
        }
        ch = mask ? brailleFromMask(mask) : "·";
        fg = mixRgb(palette.fog, palette.accent, 0.2);
      } else if (deep > 0.988) {
        ch = deep > 0.992 ? "·" : ".";
        fg = mixRgb(palette.fog, palette.accent, phase === "hook" ? 0.04 : 0.28);
      }

      const side = Math.min(c, cols - 1 - c);
      if (side < Math.max(3, cols * 0.06)) {
        const sway = reduce ? 0 : Math.sin(t * 0.9 + r * 0.33) * 1.4;
        const stem = side < 2 ? 1 : cols - 2;
        if (Math.abs(c - stem - sway) < 0.8 && r % 6 !== 0) {
          ch = r % 9 === 0 ? "╭" : "│";
          fg = mixRgb(palette.fog, palette.accent, 0.35 + palette.style.warmth * 0.3);
        }
      }

      if (template === "spotlight" || phase === "hook") {
        if (!inSpotlight(world.x, world.y)) {
          fg = mixRgb(fg, palette.sea, 0.78);
          if (ch !== " ") ch = " ";
        } else if (world.y > 0.72 && cellHash(c + 4, r) > 0.86) {
          ch = "/";
          fg = mixRgb(palette.fog, palette.hi, 0.55);
        }
      }

      if (palette.style.glow > 0.45 && cellHash(c, r + 9) > 0.9 && r < rows * 0.7) {
        ch = ch === " " ? (c % 5 === 0 ? "│" : ".") : ch;
        fg = mixRgb(palette.accent, palette.hi, 0.4);
      }

      cells[r][c] = ch === " " ? emptyCell() : { ch, fg, bg: null };
    }
  }

  paintBubbles(cells, state, palette);
  paintArchitecture(cells, state, palette);
}

function paintBubbles(cells, state, palette) {
  const cols = cells[0].length;
  const rows = cells.length;
  const t = state.reduceMotion ? 12 : (Number(state.time) || 0) * 0.001;
  const count = 6;
  for (let i = 0; i < count; i++) {
    const bx = Math.floor(cellHash(i, 2) * (cols - 4)) + 2;
    const speed = 7 + i * 1.4;
    const by = Math.floor(rows - ((t * speed + cellHash(i, 8) * rows) % (rows + 6)));
    const glyph = i % 3 === 0 ? "O" : i % 3 === 1 ? "o" : "°";
    put(cells, bx, by, glyph, mixRgb(palette.fog, palette.hi, 0.45), null);
    put(cells, bx, by + 1, "·", palette.fog, null);
  }
}

function paintArchitecture(cells, state, palette) {
  const cols = cells[0].length;
  const rows = cells.length;
  const template = state.template || "";
  const fg = palette.sign;
  const dim = mixRgb(palette.sign, palette.fog, 0.35);
  const frame = Number(state.frame) || 0;

  function rule(row, ch) {
    if (row < 0 || row >= rows) return;
    for (let c = 2; c < cols - 2; c++) put(cells, c, row, ch, dim, null);
  }

  switch (template) {
    case "":
      break;
    case "spotlight":
      rule(rows - 4, "─");
      break;
    case "set":
      rule(3, "═");
      rule(4, "─");
      rule(rows - 4, "═");
      break;
    case "unease":
      rule(rows - 4, "─");
      break;
    case "breakthrough":
      if (!frame) {
        const t = state.reduceMotion ? 0 : Math.floor((Number(state.time) || 0) / 80);
        for (let r = Math.floor(rows * 0.32); r < Math.floor(rows * 0.62); r++) {
          for (let c = 1; c < cols - 1; c += 4) {
            if ((c + r + t) % 7 === 0) put(cells, c, r, ">", dim, null);
          }
        }
      } else {
        rule(2, "─");
      }
      rule(rows - 4, "═");
      break;
    case "scar":
      rule(rows - 5, "═");
      for (let c = Math.floor(cols * 0.2); c < Math.floor(cols * 0.8); c += 2) {
        if (cellHash(c, 3) > 0.45) put(cells, c, rows - 6, "░", dim, null);
      }
      break;
    case "lesson":
      rule(2, "═");
      rule(rows - 5, "═");
      break;
    case "curtain": {
      for (let c = 0; c < cols; c++) {
        put(cells, c, 0, "▓", mixRgb(palette.accent, palette.lo, 0.4), palette.lo);
        put(cells, c, 1, c % 2 ? "▒" : "▓", mixRgb(palette.accent, palette.shell, 0.5), palette.lo);
      }
      const audience = [" \\/\\/  ", " ####  ", " #O##  ", " /##\\  "];
      const top = rows - audience.length - 1;
      const gap = 8;
      for (let a = 0; a + 6 < cols; a += gap) {
        for (let i = 0; i < audience.length; i++) {
          writeString(cells, audience[i], a, top + i, fg, null);
        }
      }
      break;
    }
    default: {
      const _never = template;
      return assertNever(_never);
    }
  }
  return undefined;
}

function paintSigns(cells, state, palette) {
  const cols = cells[0].length;
  const rows = cells.length;
  const img = state.imagery || {};
  const fg = palette.sign;
  const bg = mixRgb(palette.sea, palette.lo, 0.65);
  const template = state.template || "";

  if (state.episodeMark && template !== "curtain") {
    writeString(cells, String(state.episodeMark), centerCol(cols, state.episodeMark), 1, fg, null);
  }
  if (img.footer) {
    writeString(cells, String(img.footer), centerCol(cols, img.footer), rows - 2, fg, null);
  }
  if (img.wall && template !== "curtain") {
    const label = String(img.wall).slice(0, 16);
    const boxW = label.length + 4;
    const left = template === "unease" || template === "breakthrough" ? cols - boxW - 2 : centerCol(cols, label) ;
    const top = template === "spotlight" ? rows - 8 : Math.max(3, Math.floor(rows * 0.18));
    const bar = "#".repeat(boxW);
    writeString(cells, bar, left, top, fg, bg);
    writeString(cells, `# ${label} #`, left, top + 1, fg, bg);
    writeString(cells, bar, left, top + 2, fg, bg);
  }
  if (img.badge) {
    const badge = `[${img.badge}]`;
    writeString(cells, badge, cols - badge.length - 3, Math.floor(rows * 0.42), palette.accent, null);
  }
  if (img.burst) {
    const burst = String(img.burst);
    writeString(cells, burst, centerCol(cols, burst), Math.max(2, Math.floor(rows * 0.12)), palette.accent, null);
  }
  if (img.title) {
    writeString(cells, String(img.title), cols - String(img.title).length - 4, 3, fg, null);
  }
  if (template === "curtain") {
    const title = String(img.curtain || "CURTAIN");
    writeString(cells, title, centerCol(cols, title), 1, palette.hi, palette.lo);
  }
}

function shadeCrab(hit, normal, palette, col, row, blink) {
  const ndotl = Math.max(0, normal.x * LIGHT.x + normal.y * LIGHT.y);
  const style = palette.style;
  const luma = 0.4 + ndotl * (0.42 + style.contrast * 0.22);
  const edge = hit.d > -0.02;
  if (hit.mat === "pupil") {
    return { ch: blink > 0.7 ? "─" : "@", fg: palette.pupil, bg: palette.lo, luma: 0.05 };
  }
  if (hit.mat === "eye") {
    return {
      ch: blink > 0.55 ? "─" : "O",
      fg: mixRgb(palette.hi, [0.95, 0.96, 0.94], 0.72),
      bg: palette.shell,
      luma: 0.9,
    };
  }
  if (edge) {
    const strong = ndotl > 0.62;
    return {
      ch: edgeGlyphFromNormal(normal.x, normal.y, strong),
      fg: mixRgb(palette.hi, palette.accent, hit.mat === "claw" ? 0.55 : 0.2),
      bg: palette.lo,
      luma,
    };
  }
  const dithered = bayerDither(luma, col, row, 0.06 + style.texture * 0.2);
  const hatched = style.texture > 0.55 && cellHash(col, row) > 0.38;
  const ch = densityGlyph(dithered, hatched ? BLOCK_RAMP : DENSITY_RAMP);
  let fg = mixRgb(palette.lo, palette.hi, dithered);
  if (hit.mat === "claw") fg = mixRgb(fg, palette.accent, 0.5);
  else if (hit.mat === "leg" || hit.mat === "stalk") fg = mixRgb(fg, palette.shell, 0.35);
  if (ndotl < 0.22) fg = mixRgb(fg, palette.accent, style.glow * 0.35);
  return { ch, fg, bg: mixRgb(palette.sea, palette.lo, 0.8), luma: dithered };
}

function paintCrab(cells, state, palette) {
  const cols = cells[0].length;
  const rows = cells.length;
  const pose = state.pose;
  if (!pose) return;
  const morph = state.morphT == null ? 1 : clamp01(state.morphT);
  const template = state.template || "";
  const floor = template === "curtain" ? rows - 6 : rows;
  for (let r = 0; r < floor; r++) {
    for (let c = 0; c < cols; c++) {
      const world = cellToWorld(c, r, cols, rows, state.aspect || CELL_ASPECT);
      const local = worldToLocal(world.x, world.y, pose);
      if (local.x * local.x * 0.55 + local.y * local.y > 1.15) continue;
      const hit = crabSdf(local.x, local.y, pose);
      const glowReach = 0.045 + palette.style.glow * 0.07;
      if (hit.d > glowReach) continue;
      if (hit.d > 0) {
        if (palette.style.glow > 0.4 && cellHash(c * 2, r) > 0.55) {
          put(cells, c, r, ".", mixRgb(palette.accent, palette.hi, palette.style.glow * 0.6), null);
        }
        continue;
      }
      if (morph < 0.999 && cellHash(c * 3 + 1, r * 5) > morph) continue;
      const normal = crabNormal(local.x, local.y, pose, hit);
      const shaded = shadeCrab(hit, normal, palette, c, r, pose.blink);
      let ch = shaded.ch;
      if (state.flourish > 0.08 && hit.mat === "claw" && hit.d > -0.03) {
        if (cellHash(c + 11, r + 2) < state.flourish * 0.85) ch = cellHash(c, r) > 0.5 ? "*" : "+";
      }
      cells[r][c] = { ch, fg: shaded.fg, bg: shaded.bg };
    }
  }
}

function paintSparks(cells, state, palette) {
  if (!(state.flourish > 0) || !state.pose) return;
  const cols = cells[0].length;
  const rows = cells.length;
  const pose = state.pose;
  const sparks = "*+x%";
  for (let n = 0; n < 18; n++) {
    const side = n % 2 === 0 ? -1 : 1;
    const palmX = (0.56 + pose.clawSpread * 0.2 + 0.22) * side;
    const palmY = 0.04 + pose.clawLift + (n % 3) * 0.04 * side;
    const jx = (cellHash(n, 4) - 0.5) * 0.22 * state.flourish;
    const jy = (cellHash(n, 6) - 0.5) * 0.16 * state.flourish;
    const local = { x: palmX + jx, y: palmY + jy };
    const breathed = {
      x: local.x * pose.scale,
      y: local.y * pose.scale * (1 + pose.breathe),
    };
    const spun = rotate(breathed.x, breathed.y, pose.rot);
    const world = { x: spun.x + pose.x, y: spun.y + pose.y };
    const xSpan = (cols / rows) * (state.aspect || CELL_ASPECT) * VIEW_H;
    const col = Math.round(((world.x / xSpan) + 0.5) * cols - 0.5);
    const row = Math.round((0.5 - world.y / VIEW_H) * rows - 0.5);
    const ch = sparks[n % sparks.length];
    put(cells, col, row, ch, palette.accent, null);
  }
}

export function renderGlyphField(state = {}) {
  const cols = Math.max(8, state.cols | 0 || 96);
  const rows = Math.max(8, state.rows | 0 || 40);
  const playing = Boolean(state.playing);
  const phaseId = state.phaseId || "hook";
  const progress = playing ? clamp01(state.progress) : 0;
  let palette = buildPalette(phaseColorAt(phaseId, progress));
  palette = applyFlash(palette, state.flash);
  const pose = playing
    ? poseParams(state.pose || "proud", state.time, {
        reduceMotion: state.reduceMotion,
        flourish: state.flourish,
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
  paintSea(cells, scene, palette);
  if (playing) {
    paintSigns(cells, scene, palette);
    paintCrab(cells, scene, palette);
    paintSparks(cells, scene, palette);
  }
  return { cols, rows, cells, palette, pose };
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

export { TEMPLATES, POSES };
