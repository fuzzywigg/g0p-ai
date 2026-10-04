import assert from "node:assert/strict";
import test from "node:test";
import { PHASE_IDS } from "../js/phases.mjs";
import {
  ENCORE_CREST,
  PHASE_KEYS,
  buildPalette,
  lerpHue,
  phaseColorAt,
  rgbSaturation,
} from "../js/phase-color.mjs";

test("phase color is continuous and the story depth only climbs", () => {
  for (let i = 0; i < PHASE_IDS.length - 1; i++) {
    const end = phaseColorAt(PHASE_IDS[i], 1);
    const next = phaseColorAt(PHASE_IDS[i + 1], 0);
    assert.equal(end.story, next.story, PHASE_IDS[i]);
    assert.equal(end.sat, next.sat);
    assert.ok(Math.abs(end.accentHue - next.accentHue) < 1e-9);
    assert.ok(end.story >= phaseColorAt(PHASE_IDS[i], 0).story);
  }
  const hook = phaseColorAt("hook", 0);
  const encore = phaseColorAt("encore", 1);
  assert.equal(hook.sat, PHASE_KEYS.hook.sat);
  assert.equal(encore.glow, ENCORE_CREST.glow);
  assert.ok(hook.sat < phaseColorAt("room", 0).sat);
  assert.ok(hook.warmth < phaseColorAt("itch", 0).warmth);
  assert.ok(phaseColorAt("craft", 0).texture > phaseColorAt("turn", 0).texture);
  assert.ok(encore.story > phaseColorAt("moral", 0).story);
  assert.ok(encore.glow > phaseColorAt("encore", 0).glow);
  assert.ok(encore.sat > hook.sat);
});

test("mid-phase color sits between the neighboring keys", () => {
  const hook = phaseColorAt("hook", 0);
  const room = phaseColorAt("room", 0);
  const mid = phaseColorAt("hook", 0.5);
  assert.ok(Math.abs(mid.story - (hook.story + room.story) / 2) < 1e-9);
  assert.ok(Math.abs(mid.sat - (hook.sat + room.sat) / 2) < 1e-9);
  assert.equal(phaseColorAt("nope", 0.4).sat, PHASE_KEYS.hook.sat);
  assert.equal(lerpHue(22, 312, 0), 22);
  assert.equal(lerpHue(22, 312, 1), 312);
  const short = lerpHue(22, 312, 0.5);
  assert.ok(short > 300 || short < 22, `expected the short warm arc, got ${short}`);
});

test("hook ink stays cool and encore ink is the richest", () => {
  const hook = buildPalette(phaseColorAt("hook", 0));
  const moral = buildPalette(phaseColorAt("moral", 0.4));
  const encore = buildPalette(phaseColorAt("encore", 1));
  assert.ok(rgbSaturation(hook.hi) < rgbSaturation(moral.hi));
  assert.ok(rgbSaturation(moral.hi) < rgbSaturation(encore.accent));
  assert.ok(hook.hi[2] >= hook.hi[0], "hook highlight should not run warm");
  assert.ok(encore.accent[0] > encore.accent[2], "encore accent should run warm");
});
