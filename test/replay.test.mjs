import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { replayReset } from "../js/replay.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("replay is refused until the episode is done", () => {
  assert.equal(replayReset({ state: "idle" }).allowed, false);
  assert.equal(replayReset({ state: "playing" }).allowed, false);
  assert.equal(replayReset({}).allowed, false);
});

test("replay clears speech, timers, captions, morph, and dream before Hook", () => {
  const plan = replayReset({ state: "done" });
  assert.equal(plan.allowed, true);
  assert.equal(plan.playing, false);
  assert.equal(plan.narrationBegun, false);
  assert.equal(plan.captionIndex, -1);
  assert.equal(plan.scene, -1);
  assert.equal(plan.frame, -1);
  assert.equal(plan.morphing, false);
  assert.equal(plan.morphT, 0);
  assert.equal(plan.morphPeakArmed, false);
  assert.equal(plan.dreamFlash, null);
  assert.equal(plan.flourish, 0);
  assert.equal(plan.cancelSpeech, true);
  assert.equal(plan.cancelTimers, true);
  assert.equal(plan.stopAudio, true);
  assert.equal(plan.phase, "hook");
});

test("the player offers replay only after done and does not add a pause control", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  assert.match(html, /js\/replay\.mjs/);
  assert.match(html, /replayReset/);
  assert.match(html, /id="replay"/);
  assert.match(html, /function markDone/);
  assert.match(html, /function replayEpisode/);
  assert.doesNotMatch(html, /id="pause"/);
  const button = html.slice(html.indexOf('id="replay"'), html.indexOf('id="replay"') + 80);
  assert.match(button, /hidden/);
});
