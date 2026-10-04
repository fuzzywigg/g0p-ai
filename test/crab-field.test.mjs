import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { PHASES } from "../js/phases.mjs";
import { FABLE_0006 } from "../js/fables/0006.mjs";
import {
  blinkAmount,
  countGlyph,
  crabSdf,
  fieldToText,
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
    phaseId === "turn" ? shot.pose : phaseId === "encore" ? (frame ? "bow" : "enter") : imagery.pose;
  return renderGlyphField({
    cols: 96,
    rows: 34,
    playing: true,
    phaseId,
    progress: 0.2,
    template: phase.template,
    frame,
    pose,
    time: 1680,
    flourish: 0,
    reduceMotion: false,
    morphT: 1,
    imagery: shot,
    episodeMark: FABLE_0006.episode,
    aspect: 0.5,
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

test("the crab is a shaded shape with eyes, claws, and an edge outline", () => {
  const pose = poseParams("proud", 1680, { reduceMotion: true });
  assert.ok(crabSdf(0, 0, pose).d < 0);
  assert.equal(crabSdf(0, 0, pose).mat, "shell");
  assert.equal(crabSdf(0.95, 0.32, pose).mat, "claw");
  assert.ok(crabSdf(0.95, 0.32, pose).d < 0);
  assert.ok(crabSdf(2.4, 1.6, pose).d > 0);
  const eye = crabSdf(-0.11, 0.36, pose);
  assert.ok(eye.mat === "eye" || eye.mat === "pupil");

  const field = scene("hook", { reduceMotion: true, time: 1680 });
  const text = fieldToText(field);
  assert.ok(countGlyph(field, "O") >= 2, "eyes should read as O");
  assert.match(text, /[─│╱╲═║/\\]/);
  assert.match(text, /[#%@*+=]/);
  assert.match(text, /LOCAL GREEN/);
  assert.match(text, /HERE != CI/);
  assert.match(text, /0006/);
  assert.equal((text.match(/[░▒▓]/g) || []).length, 0);
  for (const row of field.cells) {
    for (const cell of row) {
      assert.equal([...cell.ch].length, 1);
      assert.equal(cell.src, undefined);
    }
  }
});

test("color lives on the glyphs and matures from hook to encore", () => {
  const hook = scene("hook", { progress: 0.05, reduceMotion: true });
  const craft = scene("craft", { progress: 0.25, reduceMotion: true });
  const encore = scene("encore", { progress: 0.9, frame: 1, pose: "bow", reduceMotion: true });
  assert.ok(meanSat(hook) + 0.2 < meanSat(encore));
  assert.ok(hook.palette.style.glow < encore.palette.style.glow);
  assert.ok((fieldToText(craft).match(/[░▒▓█]/g) || []).length > 12);
  assert.match(fieldToText(encore), /CURTAIN/);
  assert.match(fieldToText(encore), /THE GATE TURNED/);
  assert.match(fieldToText(scene("turn", { frame: 1, progress: 0.4 })), /BREAK THROUGH/);
  assert.match(fieldToText(scene("itch")), /81/);
});

test("motion, blinks, and speech flourishes change the pose; reduced motion does not", () => {
  assert.equal(blinkAmount(1000), 0);
  assert.ok(blinkAmount(3320) > 0.9);
  const open = poseParams("proud", 1000, { reduceMotion: false });
  const shut = poseParams("proud", 3320, { reduceMotion: false });
  assert.equal(open.blink, 0);
  assert.ok(shut.blink > 0.9);
  assert.ok(poseParams("snap", 0, { reduceMotion: true }).clawOpen > poseParams("pray", 0, {}).clawOpen);
  assert.equal(poseParams("proud", 0, { reduceMotion: true }).breathe, 0);
  assert.equal(poseParams("proud", 4000, { reduceMotion: true }).breathe, 0);
  assert.notEqual(poseParams("proud", 900, {}).breathe, 0);

  const stillA = scene("room", { reduceMotion: true, time: 0 });
  const stillB = scene("room", { reduceMotion: true, time: 4200 });
  assert.equal(fieldToText(stillA), fieldToText(stillB));
  const live = scene("room", { reduceMotion: false, time: 900, flourish: 0 });
  const clicked = scene("room", { reduceMotion: false, time: 900, flourish: 0.55 });
  assert.notEqual(fieldToText(live), fieldToText(clicked));
  assert.ok(countGlyph(clicked, "*") + countGlyph(clicked, "+") > countGlyph(live, "*") + countGlyph(live, "+"));
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
  assert.match(html, /prefers-reduced-motion/);
  assert.doesNotMatch(html, /fillText/);
  assert.doesNotMatch(html, /drawImage/);
});
