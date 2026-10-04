/**
 * Canvas monospace stage. One cell, one glyph, its own foreground and
 * background. fillText lives here so the player can keep scheduling the
 * short dream-flash while the picture itself is characters.
 */

import { CELL_ASPECT, gridForViewport, renderGlyphField } from "./crab-field.mjs";
import { clamp01 } from "./glyph-ramp.mjs";
import { rgbCss } from "./phase-color.mjs";

const FONT =
  '"DejaVu Sans Mono", "Cascadia Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

function quantize(rgb) {
  const q = (v) => Math.max(0, Math.min(31, Math.round(clamp01(v) * 31)));
  return `${q(rgb[0])},${q(rgb[1])},${q(rgb[2])}`;
}

function cssFromKey(key) {
  const parts = key.split(",");
  const ch = (v) => Math.round((Number(v) * 255) / 31);
  return `rgb(${ch(parts[0])},${ch(parts[1])},${ch(parts[2])})`;
}

export function paintGlyphField(ctx, field, width, height) {
  const cols = field.cols;
  const rows = field.rows;
  const cw = width / cols;
  const ch = height / rows;
  ctx.fillStyle = rgbCss(field.palette.sea);
  ctx.fillRect(0, 0, width, height);
  ctx.font = `${Math.max(8, Math.floor(ch * 0.92))}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const backgrounds = new Map();
  const inks = new Map();
  for (let r = 0; r < rows; r++) {
    const row = field.cells[r];
    for (let c = 0; c < cols; c++) {
      const cell = row[c];
      if (cell.bg) {
        const key = quantize(cell.bg);
        let list = backgrounds.get(key);
        if (!list) backgrounds.set(key, (list = []));
        list.push(c, r);
      }
      if (cell.ch && cell.ch !== " ") {
        const key = quantize(cell.fg || field.palette.fog);
        let list = inks.get(key);
        if (!list) inks.set(key, (list = []));
        list.push(c, r, cell.ch);
      }
    }
  }

  for (const [key, list] of backgrounds) {
    ctx.fillStyle = cssFromKey(key);
    for (let i = 0; i < list.length; i += 2) {
      ctx.fillRect(list[i] * cw, list[i + 1] * ch, cw + 0.8, ch + 0.8);
    }
  }
  for (const [key, list] of inks) {
    ctx.fillStyle = cssFromKey(key);
    for (let i = 0; i < list.length; i += 3) {
      ctx.fillText(list[i + 2], (list[i] + 0.5) * cw, (list[i + 1] + 0.5) * ch);
    }
  }
}

export function createGlyphStage(canvas, ctx) {
  let cols = 96;
  let rows = 40;
  let aspect = CELL_ASPECT;
  return {
    grid() {
      return { cols, rows, aspect };
    },
    resize(width, height) {
      const grid = gridForViewport(width, height);
      cols = grid.cols;
      rows = grid.rows;
      const cw = width / Math.max(cols, 1);
      const ch = height / Math.max(rows, 1);
      aspect = ch > 0 ? cw / ch : CELL_ASPECT;
    },
    render(state) {
      const field = renderGlyphField({
        ...state,
        cols,
        rows,
        aspect,
      });
      paintGlyphField(ctx, field, state.width, state.height);
      return field;
    },
  };
}
