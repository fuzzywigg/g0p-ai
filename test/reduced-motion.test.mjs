import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { reducedMotionTransition } from "../js/reduced-motion.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("both initial preferences are stable until the query changes", () => {
  for (const enabled of [true, false]) {
    const same = reducedMotionTransition({
      reduceMotion: enabled,
      morphing: false,
      morphT: 0,
      morphPeakArmed: false,
      dreamFlash: null,
      captionIndex: -1,
    }, enabled);
    assert.equal(same.changed, false);
    assert.equal(same.reduceMotion, enabled);
    assert.equal(same.settleMorph, false);
    assert.equal(same.clearFlash, false);
  }
});

test("turning reduce on during idle clears flashes and does not invent a morph", () => {
  const next = reducedMotionTransition({
    reduceMotion: false,
    morphing: false,
    morphT: 0,
    morphPeakArmed: false,
    dreamFlash: { at: 40, reason: "speak-start" },
    captionIndex: -1,
  }, true);
  assert.equal(next.changed, true);
  assert.equal(next.reduceMotion, true);
  assert.equal(next.settleMorph, false);
  assert.equal(next.clearFlash, true);
  assert.equal(next.morphing, false);
  assert.equal(next.morphT, 0);
  assert.equal(next.dreamFlash, null);
  assert.equal(next.morphPeakArmed, false);
  assert.equal(next.captionIndex, -1);
});

test("turning reduce on during a morph settles it and drops the peak flash", () => {
  const next = reducedMotionTransition({
    reduceMotion: false,
    morphing: true,
    morphT: 0.42,
    morphPeakArmed: true,
    dreamFlash: { at: 80, reason: "morph-peak" },
    captionIndex: 4,
  }, true);
  assert.equal(next.settleMorph, true);
  assert.equal(next.clearFlash, true);
  assert.equal(next.morphing, false);
  assert.equal(next.morphT, 1);
  assert.equal(next.morphPeakArmed, false);
  assert.equal(next.dreamFlash, null);
  assert.equal(next.captionIndex, 4);
});

test("turning reduce off does not resurrect the settled morph or the cleared flash", () => {
  const on = reducedMotionTransition({
    reduceMotion: false,
    morphing: true,
    morphT: 0.2,
    morphPeakArmed: true,
    dreamFlash: { at: 12, reason: "breakthrough" },
    captionIndex: 2,
  }, true);
  const off = reducedMotionTransition(on, false);
  assert.equal(off.changed, true);
  assert.equal(off.reduceMotion, false);
  assert.equal(off.settleMorph, false);
  assert.equal(off.clearFlash, false);
  assert.equal(off.morphing, false);
  assert.equal(off.morphT, 1);
  assert.equal(off.morphPeakArmed, false);
  assert.equal(off.dreamFlash, null);
  assert.equal(off.captionIndex, 2);
});

test("the player listens for prefers-reduced-motion changes", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  assert.match(html, /js\/reduced-motion\.mjs/);
  assert.match(html, /reducedMotionTransition/);
  assert.match(html, /prefers-reduced-motion: reduce/);
  assert.match(html, /addEventListener\("change"/);
  assert.match(html, /dataset\.motion/);
});
