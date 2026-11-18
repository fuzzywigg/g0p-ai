import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { keyboardActivatesTheater, playbackStatusText } from "../js/theater-keys.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("only the focused theater controls start or replay from the keyboard", () => {
  assert.equal(keyboardActivatesTheater("field", "Enter"), true);
  assert.equal(keyboardActivatesTheater("field", " "), true);
  assert.equal(keyboardActivatesTheater("replay", "Enter"), true);
  assert.equal(keyboardActivatesTheater("mute-toggle", "Enter"), false);
  assert.equal(keyboardActivatesTheater("voice-picker", " "), false);
  assert.equal(keyboardActivatesTheater("share-episode", "Enter"), false);
  assert.equal(keyboardActivatesTheater("", "Enter"), false);
  assert.equal(keyboardActivatesTheater("field", "Escape"), false);
  assert.equal(keyboardActivatesTheater("field", "Tab"), false);
});

test("playback status names playing and done and stays empty while idle", () => {
  assert.equal(playbackStatusText("idle"), "");
  assert.equal(playbackStatusText("playing"), "playing");
  assert.equal(playbackStatusText("done"), "done");
  assert.equal(playbackStatusText(""), "");
});

test("the player shows a focus ring and a live playback status", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  assert.match(html, /js\/theater-keys\.mjs/);
  assert.match(html, /keyboardActivatesTheater/);
  assert.match(html, /playbackStatusText/);
  assert.match(html, /:focus-visible/);
  assert.match(html, /id="playback-status"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /canvas\.focus\(/);
  assert.match(html, /tabindex", "0"/);
});
