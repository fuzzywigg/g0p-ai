import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { hiddenPlaybackPlan, shownPlaybackPlan } from "../js/visibility.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("hiding during idle stops the frame and does not pause silent playback", () => {
  const plan = hiddenPlaybackPlan({
    audioPlaying: false,
    speechActive: false,
    captionTimer: false,
    morphing: false,
    morphStart: 0,
  }, 1000);
  assert.equal(plan.hidden, true);
  assert.equal(plan.runFrame, false);
  assert.equal(plan.clearFlash, true);
  assert.equal(plan.morphPeakArmed, false);
  assert.equal(plan.pauseAudio, false);
  assert.equal(plan.pauseSpeech, false);
  assert.equal(plan.pauseCaptionTimer, false);
  assert.equal(plan.hiddenAt, 1000);
});

test("hiding during a morph and speech pauses timers and keeps the morph clock", () => {
  const plan = hiddenPlaybackPlan({
    audioPlaying: false,
    speechActive: true,
    captionTimer: true,
    morphing: true,
    morphStart: 400,
  }, 1500);
  assert.equal(plan.pauseSpeech, true);
  assert.equal(plan.pauseCaptionTimer, true);
  assert.equal(plan.morphing, true);
  assert.equal(plan.morphStart, 400);
  assert.equal(plan.clearFlash, true);
});

test("showing shifts the morph and resumes the same playback without a second start", () => {
  const hidden = hiddenPlaybackPlan({
    audioPlaying: true,
    speechActive: true,
    captionTimer: true,
    morphing: true,
    morphStart: 400,
  }, 1500);
  const shown = shownPlaybackPlan({
    hiddenAt: hidden.hiddenAt,
    morphing: hidden.morphing,
    morphStart: hidden.morphStart,
    audioPausedByHide: true,
    speechPausedByHide: true,
    captionTimerPaused: true,
    captionRemaining: 220,
  }, 2000);
  assert.equal(shown.runFrame, true);
  assert.equal(shown.resetFrameDelta, true);
  assert.equal(shown.morphStart, 900);
  assert.equal(shown.resumeAudio, true);
  assert.equal(shown.resumeSpeech, true);
  assert.equal(shown.resumeCaptionTimer, true);
  assert.equal(shown.captionRemaining, 220);
  assert.equal(shown.startNarration, false);
});

test("the player pauses on visibilitychange and still stops on pagehide", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  assert.match(html, /js\/visibility\.mjs/);
  assert.match(html, /hiddenPlaybackPlan/);
  assert.match(html, /shownPlaybackPlan/);
  assert.match(html, /visibilitychange/);
  assert.match(html, /pagehide/);
  assert.match(html, /cancelAnimationFrame/);
  assert.match(html, /synth\.pause/);
  assert.match(html, /synth\.resume/);
});
