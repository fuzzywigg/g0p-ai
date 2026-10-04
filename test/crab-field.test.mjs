import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { PHASES } from "../js/phases.mjs";
import { FABLE_0006 } from "../js/fables/0006.mjs";
import { dietAt } from "../js/growth.mjs";
import {
  blinkAmount,
  centerInkRatio,
  countGlyph,
  crabSdf,
  crabSpanFraction,
  fieldToText,
  flowFields,
  gridForViewport,
  poseParams,
  renderGlyphField,
} from "../js/crab-field.mjs";
import { rgbSaturation } from "../js/phase-color.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function scene(phaseId, extra = {}) {
  const phase = PHASES.find((item) => item.id === phaseId);
  const imagery = FABLE_0006.imagery[phaseId] || {};
  const frame = extra.frame || 0;
  const shot = phaseId === "turn" ? (frame ? imagery.breakthrough : imagery.approach) : imagery;
  const pose =
    extra.pose ||
    (phaseId === "turn" ? shot.pose : phaseId === "encore" ? (frame ? "bow" : "enter") : imagery.pose);
  const grid = gridForViewport(1400, 800);
  return renderGlyphField({
    cols: grid.cols,
    rows: grid.rows,
    playing: true,
    phaseId,
    progress: 0.35,
    template: phase.template,
    frame,
    pose,
    time: 1680,
    flourish: 0,
    reduceMotion: true,
    morphT: 1,
    imagery: shot,
    episodeMark: FABLE_0006.episode,
    aspect: 0.52,
    ...extra,
  });
}

function meanSat(field) {
  let n = 0;
  let sum = 0;
  for (const row of field.cells) {
    for (const cell of row) {
      if (!cell.fg || !cell.ch || cell.ch === " ") continue;
      sum += rgbSaturation(cell.fg);
      n += 1;
    }
  }
  return sum / Math.max(n, 1);
}

function meanCrabLight(field) {
  let n = 0;
  let sum = 0;
  for (const row of field.cells) {
    for (const cell of row) {
      if (cell.role !== "crab" || !cell.bg) continue;
      sum += (cell.bg[0] + cell.bg[1] + cell.bg[2]) / 3;
      n += 1;
    }
  }
  return sum / Math.max(n, 1);
}

function countRole(field, role) {
  let n = 0;
  for (const row of field.cells) {
    for (const cell of row) if (cell.role === role) n += 1;
  }
  return n;
}

function lowestCrabRow(field) {
  let maxR = -1;
  field.cells.forEach((row, r) => {
    for (const cell of row) {
      if (cell.role === "crab" || cell.role === "grain" || cell.role === "pearl") maxR = Math.max(maxR, r);
    }
  });
  return maxR / field.rows;
}

test("the crab is a solid shaded shape and fills the center of the grid", () => {
  const pose = poseParams("proud", 1680, { reduceMotion: true, phase: "room", fraction: 0.46 });
  assert.ok(crabSdf(0, 0, pose).d < 0);
  assert.equal(crabSdf(0, 0, pose).mat, "shell");
  assert.ok(crabSdf(3, 3, pose).d > 0);

  let claws = 0;
  let eyes = 0;
  let legs = 0;
  for (let y = -1; y <= 1.1; y += 0.04) {
    for (let x = -1.6; x <= 1.6; x += 0.04) {
      const hit = crabSdf(x, y, pose);
      if (hit.d >= 0) continue;
      if (hit.mat === "claw") claws += 1;
      if (hit.mat === "eye" || hit.mat === "pupil") eyes += 1;
      if (hit.mat === "leg") legs += 1;
    }
  }
  assert.ok(claws > 20, `claws ${claws}`);
  assert.ok(eyes > 4, `eyes ${eyes}`);
  assert.ok(legs > 8, `legs ${legs}`);

  const hook = scene("hook", { progress: 0.05, reduceMotion: true });
  const room = scene("room", { progress: 0.4, reduceMotion: true });
  const text = fieldToText(hook);
  assert.ok(centerInkRatio(hook) > 0.15, `hook center ink ${centerInkRatio(hook)}`);
  assert.ok(centerInkRatio(room) > 0.15);
  assert.ok(countGlyph(hook, "o") + countGlyph(hook, "O") >= 2);
  assert.match(text, /LOCAL GREEN/);
  assert.match(text, /HERE != CI/);
  assert.match(text, /0006/);
  assert.match(text, /glyphs/);
  const diet = new Set(dietAt("hook", 0.05));
  for (const row of hook.cells) {
    for (const cell of row) {
      assert.equal([...cell.ch].length, 1);
      assert.equal(cell.src, undefined);
      if (cell.role === "crab") assert.ok(diet.has(cell.ch), cell.ch);
    }
  }
  const sea = hook.palette.sea;
  const seaL = (sea[0] + sea[1] + sea[2]) / 3;
  assert.ok(meanCrabLight(hook) > seaL + 0.35, "crab cells should read against the sea");
  assert.ok(lowestCrabRow(hook) < 0.82);
  assert.ok(lowestCrabRow(room) < 0.82);
});

test("color and glyphs are earned, then the encore spends the full ASCII set", () => {
  const hook = scene("hook", { progress: 0, reduceMotion: true });
  const itch = scene("itch", { progress: 0.4, reduceMotion: true });
  const craft = scene("craft", { progress: 0.4, reduceMotion: true });
  const moral = scene("moral", { progress: 0.4, reduceMotion: true });
  const encore = scene("encore", { progress: 1, frame: 0, pose: "enter", reduceMotion: true });
  assert.ok(hook.growth.glyphCount < itch.growth.glyphCount);
  assert.ok(itch.growth.hueCount < moral.growth.hueCount);
  assert.equal(encore.growth.glyphCount, 95);
  assert.equal(encore.growth.hueCount, 16);
  assert.ok(crabSpanFraction(encore) > crabSpanFraction(hook) + 0.12);
  assert.ok(meanSat(hook) + 0.05 < meanSat(encore));
  assert.ok(countRole(itch, "grain") > 0, "a sand grain lodges during the itch");
  assert.ok(countRole(scene("turn", { frame: 1, progress: 0.45 }), "pearl") > 0);
  const seen = new Set();
  for (const row of encore.cells) {
    for (const cell of row) if (cell.ch && cell.ch !== " ") seen.add(cell.ch);
  }
  assert.ok(seen.size >= 50, `encore unique glyphs ${seen.size}`);
  assert.match(fieldToText(encore), /CURTAIN/);
  assert.match(fieldToText(encore), /THE GATE TURNED/);
  assert.match(fieldToText(scene("turn", { frame: 1, progress: 0.4 })), /BREAK THROUGH/);
  assert.match(fieldToText(itch), /81/);
  assert.ok((fieldToText(craft).match(/[#%$@]/g) || []).length > 8);
});

test("motion, feeding claps, and reduced motion stay deterministic", () => {
  assert.equal(blinkAmount(1000), 0);
  assert.ok(blinkAmount(3320) > 0.9);
  const open = poseParams("proud", 1000, { reduceMotion: false, phase: "room", fraction: 0.45 });
  const shut = poseParams("proud", 3320, { reduceMotion: false, phase: "room", fraction: 0.45 });
  assert.equal(open.blink, 0);
  assert.ok(shut.blink > 0.9);
  assert.equal(poseParams("proud", 0, { reduceMotion: true, phase: "hook", fraction: 0.4 }).breathe, 0);
  assert.notEqual(poseParams("proud", 900, { phase: "hook", fraction: 0.4 }).breathe, 0);

  const stillA = scene("room", { reduceMotion: true, time: 0 });
  const stillB = scene("room", { reduceMotion: true, time: 4200 });
  assert.equal(fieldToText(stillA), fieldToText(stillB));
  const live = scene("room", { reduceMotion: false, time: 900, flourish: 0, progress: 0.45 });
  const clicked = scene("room", { reduceMotion: false, time: 900, flourish: 0.55, progress: 0.45 });
  assert.notEqual(fieldToText(live), fieldToText(clicked));
  assert.ok(
    countGlyph(clicked, "*") + countGlyph(clicked, "+") >
      countGlyph(live, "*") + countGlyph(live, "+"),
  );
});

test("scene changes flow on the point grid instead of cutting", () => {
  const from = scene("hook", { progress: 0.2 });
  const to = scene("room", { progress: 0.2 });
  assert.equal(fieldToText(flowFields(from, to, 0, false)), fieldToText(from));
  assert.equal(fieldToText(flowFields(from, to, 1, false)), fieldToText(to));
  const mid = fieldToText(flowFields(from, to, 0.45, false));
  assert.notEqual(mid, fieldToText(from));
  assert.notEqual(mid, fieldToText(to));
  assert.equal(fieldToText(flowFields(from, to, 0.2, true)), fieldToText(to));
});

test("the grid budget stays inside a laptop frame", () => {
  const desktop = gridForViewport(1440, 900);
  const phone = gridForViewport(390, 700);
  assert.ok(desktop.cols * desktop.rows <= 6800);
  assert.ok(phone.cols >= 64);
  assert.ok(phone.rows >= 28);
  assert.ok(phone.cols <= desktop.cols);
});

test("the player paints with the glyph stage and keeps the speech shell", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  assert.match(html, /createGlyphStage/);
  assert.match(html, /js\/glyph-stage\.mjs/);
  assert.match(html, /flourishAmount/);
  assert.match(html, /audioPhaseProgress/);
  assert.match(html, /narrationSource\(audioManifest, episode\.episode\)/);
  assert.match(html, /prefers-reduced-motion/);
  assert.doesNotMatch(html, /fillText/);
  assert.doesNotMatch(html, /drawImage/);
  assert.doesNotMatch(html, /audio\/0006\.mp3/);
});
