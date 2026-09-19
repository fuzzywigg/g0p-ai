import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { PHASE_IDS } from "../js/phases.mjs";
import {
  FLASH_MS_MAX,
  FLASH_MS_MIN,
  PHASE_DREAM,
  clampFlashMs,
  dreamBurstPoints,
  flashDurationMs,
  isFlashActive,
  scheduleDreamFlash,
  shouldScheduleFlash,
} from "../js/dream-flash.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("reduced motion never schedules a dream flash", () => {
  for (const phaseId of PHASE_IDS) {
    assert.equal(
      shouldScheduleFlash({
        reduceMotion: true,
        reason: "speak-start",
        phaseId,
        frame: 0,
      }),
      false,
    );
    assert.equal(
      scheduleDreamFlash({
        now: 1000,
        phaseId,
        reason: "speak-start",
        reduceMotion: true,
      }),
      null,
    );
  }
});

test("speak-start flashes stay in the subliminal 8–36ms band", () => {
  const flash = scheduleDreamFlash({
    now: 4000,
    phaseId: "hook",
    frame: 0,
    reason: "speak-start",
    reduceMotion: false,
  });
  assert.ok(flash);
  assert.equal(flash.reason, "speak-start");
  assert.equal(flash.phaseId, "hook");
  assert.equal(flash.at, 4000);
  assert.ok(flash.durationMs >= FLASH_MS_MIN);
  assert.ok(flash.durationMs <= FLASH_MS_MAX);
  assert.equal(clampFlashMs(1), FLASH_MS_MIN);
  assert.equal(clampFlashMs(400), FLASH_MS_MAX);
  assert.equal(clampFlashMs(NaN), FLASH_MS_MIN);
  PHASE_IDS.forEach((phaseId) => {
    const ms = flashDurationMs(phaseId, "speak-start");
    assert.ok(ms >= FLASH_MS_MIN && ms <= FLASH_MS_MAX, phaseId);
  });
});

test("turn breakthrough is denser and only on smash frame 1", () => {
  assert.equal(
    shouldScheduleFlash({
      reduceMotion: false,
      reason: "breakthrough",
      phaseId: "turn",
      frame: 0,
    }),
    false,
  );
  assert.equal(
    shouldScheduleFlash({
      reduceMotion: false,
      reason: "breakthrough",
      phaseId: "hook",
      frame: 1,
    }),
    false,
  );
  const smash = scheduleDreamFlash({
    now: 12,
    phaseId: "turn",
    frame: 1,
    reason: "breakthrough",
    reduceMotion: false,
  });
  const speak = scheduleDreamFlash({
    now: 12,
    phaseId: "moral",
    frame: 0,
    reason: "speak-start",
    reduceMotion: false,
  });
  assert.ok(smash);
  assert.ok(speak);
  assert.equal(smash.durationMs, FLASH_MS_MAX);
  assert.ok(smash.density > speak.density);
  const smashPts = dreamBurstPoints(smash, 1280, 720);
  const speakPts = dreamBurstPoints(speak, 1280, 720);
  assert.ok(smashPts.length > speakPts.length);
});

test("morph-peak sparks only on phases that crest", () => {
  assert.equal(
    shouldScheduleFlash({
      reduceMotion: false,
      reason: "morph-peak",
      phaseId: "turn",
      frame: 1,
    }),
    true,
  );
  assert.equal(
    shouldScheduleFlash({
      reduceMotion: false,
      reason: "morph-peak",
      phaseId: "hook",
      frame: 0,
    }),
    true,
  );
  assert.equal(
    shouldScheduleFlash({
      reduceMotion: false,
      reason: "morph-peak",
      phaseId: "craft",
      frame: 0,
    }),
    false,
  );
  assert.equal(
    scheduleDreamFlash({
      now: 1,
      phaseId: "craft",
      reason: "morph-peak",
    }),
    null,
  );
});

test("flash active window is open-closed and expires", () => {
  const flash = scheduleDreamFlash({
    now: 100,
    phaseId: "itch",
    reason: "speak-start",
  });
  assert.equal(isFlashActive(null, 100), false);
  assert.equal(isFlashActive(flash, 99.9), false);
  assert.equal(isFlashActive(flash, 100), true);
  assert.equal(isFlashActive(flash, 100 + flash.durationMs - 0.01), true);
  assert.equal(isFlashActive(flash, 100 + flash.durationMs), false);
});

test("bursts are vector-mapped glyph points, never bitmaps", () => {
  PHASE_IDS.forEach((phaseId) => {
    const dream = PHASE_DREAM[phaseId];
    assert.ok(dream, phaseId);
    assert.equal(typeof dream.hue, "number");
    assert.equal(typeof dream.glyphs, "string");
    assert.ok(dream.glyphs.length > 0);
    assert.doesNotMatch(dream.glyphs, /https?:|data:|image\//i);
    const flash = scheduleDreamFlash({
      now: 0,
      phaseId,
      frame: phaseId === "turn" ? 1 : 0,
      reason: "speak-start",
    });
    const pts = dreamBurstPoints(flash, 800, 600);
    assert.ok(pts.length >= 24, `${phaseId} too sparse`);
    pts.forEach((p) => {
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
      assert.ok(p.x >= -8 && p.x <= 808);
      assert.ok(p.y >= -8 && p.y <= 608);
      assert.ok(p.r > 0);
      assert.equal(p.src, undefined);
      assert.equal(p.url, undefined);
      assert.equal(p.bitmap, undefined);
      assert.equal(typeof p.h, "number");
    });
  });
  const a = dreamBurstPoints(
    scheduleDreamFlash({ now: 0, phaseId: "hook", reason: "speak-start" }),
    800,
    600,
  );
  const b = dreamBurstPoints(
    scheduleDreamFlash({ now: 0, phaseId: "hook", reason: "speak-start" }),
    800,
    600,
  );
  assert.deepEqual(a, b);
});

test("unknown phase or reason does not invent a flash", () => {
  assert.equal(
    scheduleDreamFlash({ now: 0, phaseId: "credits", reason: "speak-start" }),
    null,
  );
  assert.equal(
    scheduleDreamFlash({ now: 0, phaseId: "hook", reason: "slideshow" }),
    null,
  );
});

test("player inlines glyph-only dream flashes on speak, morph peak, and turn smash", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  assert.match(html, /function scheduleDreamFlash/);
  assert.match(html, /function dreamBurstPoints/);
  assert.match(html, /function isFlashActive/);
  assert.match(html, /function triggerDreamFlash/);
  assert.match(html, /triggerDreamFlash\("speak-start"\)/);
  assert.match(html, /triggerDreamFlash\("morph-peak"\)/);
  assert.match(html, /triggerDreamFlash\("breakthrough"\)/);
  assert.match(html, /dataset\.dream/);
  assert.match(html, /reduceMotion/);
  assert.doesNotMatch(html, /drawImage/);
  assert.doesNotMatch(html, /createImageBitmap/);
  assert.doesNotMatch(html, /new Image\(/);
  assert.doesNotMatch(html, /\.mp4|\.webm|\.png|\.jpg|\.gif|\.webp/i);
  assert.match(html, /keep in sync with js\/dream-flash\.mjs/);
});
