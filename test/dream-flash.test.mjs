import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { PHASE_IDS } from "../js/phases.mjs";
import {
  FLASH_MS_MAX,
  FLASH_MS_MIN,
  MORPH_PEAK_DELAY_MS,
  MORPH_PEAK_EASE,
  PHASE_DREAM,
  clampFlashMs,
  clusterCells,
  dreamBurstPoints,
  flashDurationMs,
  glyphUnits,
  isFlashActive,
  isFlashPending,
  morphPeakReady,
  phaseEmojiStamps,
  scheduleDreamFlash,
  shouldFireSpeakStartFlash,
  shouldScheduleFlash,
  speakStartSource,
  stampForGlyph,
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

test("speak-start locks to utterance start when speech can run, else caption reveal", () => {
  assert.equal(speakStartSource({ canSpeak: true }), "utterance-start");
  assert.equal(speakStartSource({ canSpeak: false }), "caption-reveal");
  assert.equal(speakStartSource({}), "caption-reveal");

  assert.equal(
    shouldFireSpeakStartFlash({
      source: "utterance-start",
      event: "caption-reveal",
    }),
    false,
  );
  assert.equal(
    shouldFireSpeakStartFlash({
      source: "utterance-start",
      event: "utterance-error",
      utteranceStarted: false,
    }),
    true,
  );
  assert.equal(
    shouldFireSpeakStartFlash({
      source: "utterance-start",
      event: "utterance-error",
      utteranceStarted: true,
    }),
    false,
  );
  assert.equal(
    shouldFireSpeakStartFlash({
      source: "utterance-start",
      event: "utterance-start",
    }),
    true,
  );
  assert.equal(
    shouldFireSpeakStartFlash({
      source: "caption-reveal",
      event: "caption-reveal",
    }),
    true,
  );
  assert.equal(
    shouldFireSpeakStartFlash({
      source: "caption-reveal",
      event: "utterance-start",
    }),
    false,
  );
  assert.equal(
    shouldFireSpeakStartFlash({
      reduceMotion: true,
      source: "utterance-start",
      event: "utterance-start",
    }),
    false,
  );
  const flash = scheduleDreamFlash({
    now: 900,
    phaseId: "hook",
    reason: "speak-start",
  });
  assert.equal(flash.at, 900);
  assert.equal(isFlashPending(flash, 900), false);
  assert.equal(isFlashActive(flash, 900), true);
});

test("morph-peak waits until the crab silhouette is mostly formed, then a short delay", () => {
  assert.ok(MORPH_PEAK_EASE > 0.7);
  assert.ok(MORPH_PEAK_DELAY_MS >= 12);
  assert.ok(MORPH_PEAK_DELAY_MS <= 24);
  assert.equal(morphPeakReady({ easeT: 0.52 }), false);
  assert.equal(morphPeakReady({ easeT: MORPH_PEAK_EASE - 0.01 }), false);
  assert.equal(morphPeakReady({ easeT: MORPH_PEAK_EASE }), true);
  assert.equal(morphPeakReady({ easeT: 1 }), true);

  const peak = scheduleDreamFlash({
    now: 1000,
    phaseId: "hook",
    reason: "morph-peak",
  });
  const speak = scheduleDreamFlash({
    now: 1000,
    phaseId: "hook",
    reason: "speak-start",
  });
  assert.ok(peak);
  assert.equal(peak.at, 1000 + MORPH_PEAK_DELAY_MS);
  assert.equal(isFlashPending(peak, 1000), true);
  assert.equal(isFlashActive(peak, 1000), false);
  assert.equal(isFlashActive(peak, peak.at), true);
  assert.equal(isFlashPending(peak, peak.at), false);
  assert.ok(peak.density < speak.density);
  assert.ok(peak.durationMs >= 16);
  assert.ok(peak.durationMs <= FLASH_MS_MAX);
  let painted = false;
  for (let t = 1000; t <= 1000 + MORPH_PEAK_DELAY_MS + peak.durationMs + 16; t += 16) {
    if (isFlashActive(peak, t)) painted = true;
  }
  assert.equal(painted, true);
});

test("breakthrough stays immediate, max window, and denser than morph-peak", () => {
  const smash = scheduleDreamFlash({
    now: 40,
    phaseId: "turn",
    frame: 1,
    reason: "breakthrough",
  });
  const peak = scheduleDreamFlash({
    now: 40,
    phaseId: "turn",
    frame: 1,
    reason: "morph-peak",
  });
  assert.equal(smash.at, 40);
  assert.equal(smash.durationMs, FLASH_MS_MAX);
  assert.ok(smash.density > peak.density);
  assert.ok(peak.at > smash.at);
  assert.equal(
    scheduleDreamFlash({
      now: 40,
      phaseId: "itch",
      frame: 1,
      reason: "breakthrough",
    }),
    null,
  );
});

test("phase palettes carry sparse mood emoji as stamp codepoints, not stickers", () => {
  assert.deepEqual(phaseEmojiStamps("hook"), ["✨", "✧"]);
  assert.deepEqual(phaseEmojiStamps("room"), []);
  assert.deepEqual(phaseEmojiStamps("itch"), ["⚡"]);
  assert.deepEqual(phaseEmojiStamps("turn"), ["💥", "✦"]);
  assert.deepEqual(phaseEmojiStamps("craft"), []);
  assert.deepEqual(phaseEmojiStamps("moral"), ["⚖"]);
  assert.deepEqual(phaseEmojiStamps("encore"), ["❀"]);
  assert.deepEqual(phaseEmojiStamps("credits"), []);

  PHASE_IDS.forEach((phaseId) => {
    const stamps = phaseEmojiStamps(phaseId);
    assert.ok(stamps.length <= 2, `${phaseId} dumps too many emoji`);
    const dream = PHASE_DREAM[phaseId];
    assert.equal(typeof dream.emoji, "string");
    assert.doesNotMatch(dream.emoji, /https?:|data:|image\//i);
    stamps.forEach((ch) => {
      assert.equal([...ch].length, 1);
      const stamp = stampForGlyph(ch);
      assert.ok(Array.isArray(stamp) && stamp.length >= 4, `${phaseId} ${ch} stamp`);
      assert.ok(
        stamp.some((row) => row.includes("#")),
        `${phaseId} ${ch} is empty`,
      );
      assert.notDeepEqual(stamp, stampForGlyph("*"), `${ch} should not fall back to star`);
    });
  });
});

test("glyphUnits keeps emoji codepoints intact and strips variation selectors", () => {
  assert.deepEqual(glyphUnits("*+"), ["*", "+"]);
  assert.deepEqual(glyphUnits(">>*"), [">", ">", "*"]);
  assert.deepEqual(glyphUnits("💥✦"), ["💥", "✦"]);
  assert.deepEqual(glyphUnits("✨\uFE0F"), ["✨"]);
  assert.deepEqual(glyphUnits(""), []);
  assert.deepEqual(glyphUnits(undefined), []);
});

test("scheduled flashes carry phase emoji without changing speech or morph-peak timing", () => {
  const speak = scheduleDreamFlash({
    now: 900,
    phaseId: "hook",
    reason: "speak-start",
  });
  const peak = scheduleDreamFlash({
    now: 1000,
    phaseId: "hook",
    reason: "morph-peak",
  });
  const smash = scheduleDreamFlash({
    now: 40,
    phaseId: "turn",
    frame: 1,
    reason: "breakthrough",
  });
  const room = scheduleDreamFlash({
    now: 0,
    phaseId: "room",
    reason: "speak-start",
  });
  assert.equal(speak.at, 900);
  assert.equal(speak.emoji, "✨✧");
  assert.equal(peak.at, 1000 + MORPH_PEAK_DELAY_MS);
  assert.equal(peak.emoji, "✨✧");
  assert.ok(peak.density < speak.density);
  assert.equal(smash.at, 40);
  assert.equal(smash.durationMs, FLASH_MS_MAX);
  assert.equal(smash.emoji, "💥✦");
  assert.equal(room.emoji, "");
  assert.equal(room.at, 0);
});

test("emoji stamps mix sparsely into the same arc burst, never as bitmaps", () => {
  const hook = scheduleDreamFlash({
    now: 0,
    phaseId: "hook",
    reason: "speak-start",
  });
  const smash = scheduleDreamFlash({
    now: 0,
    phaseId: "turn",
    frame: 1,
    reason: "breakthrough",
  });
  const glyphCells = clusterCells(hook.glyphs);
  const emojiCells = clusterCells(hook.emoji);
  assert.ok(glyphCells.length > 0);
  assert.ok(emojiCells.length > 0);
  assert.ok(
    emojiCells.length < glyphCells.length,
    "emoji cluster must stay smaller than the ASCII field",
  );

  const pts = dreamBurstPoints(hook, 800, 600);
  const glyphPts = pts.filter((p) => p.kind !== "emoji");
  const emojiPts = pts.filter((p) => p.kind === "emoji");
  assert.ok(glyphPts.length >= 24);
  assert.ok(emojiPts.length >= 4, "hook wonder should spark at all");
  assert.ok(
    emojiPts.length < glyphPts.length * 0.45,
    `emoji ${emojiPts.length} vs glyph ${glyphPts.length} is a sticker dump`,
  );

  const smashPts = dreamBurstPoints(smash, 1280, 720);
  const smashEmoji = smashPts.filter((p) => p.kind === "emoji");
  assert.ok(smashEmoji.length > emojiPts.length);

  [...pts, ...smashPts].forEach((p) => {
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    assert.ok(p.r > 0);
    assert.equal(typeof p.h, "number");
    assert.equal(p.src, undefined);
    assert.equal(p.url, undefined);
    assert.equal(p.bitmap, undefined);
    assert.equal(p.glyph, undefined);
  });
  assert.deepEqual(
    dreamBurstPoints(hook, 800, 600),
    dreamBurstPoints(hook, 800, 600),
  );
});

test("player inlines glyph-only dream flashes on speak, morph peak, and turn smash", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  assert.match(html, /function scheduleDreamFlash/);
  assert.match(html, /function dreamBurstPoints/);
  assert.match(html, /function isFlashActive/);
  assert.match(html, /function isFlashPending/);
  assert.match(html, /function speakStartSource/);
  assert.match(html, /function shouldFireSpeakStartFlash/);
  assert.match(html, /function morphPeakReady/);
  assert.match(html, /function triggerDreamFlash/);
  assert.match(html, /triggerDreamFlash\("speak-start"\)/);
  assert.match(html, /triggerDreamFlash\("morph-peak"\)/);
  assert.match(html, /triggerDreamFlash\("breakthrough"\)/);
  assert.match(html, /u\.onstart/);
  assert.match(html, /utterance-error/);
  assert.match(html, /caption-reveal/);
  assert.match(html, /MORPH_PEAK_EASE/);
  assert.doesNotMatch(html, /morphT >= 0\.52/);
  assert.match(html, /dataset\.dream/);
  assert.match(html, /reduceMotion/);
  assert.match(html, /emoji: "✨✧"/);
  assert.match(html, /emoji: "💥✦"/);
  assert.match(html, /function glyphUnits/);
  assert.match(html, /kind: "emoji"/);
  assert.doesNotMatch(html, /drawImage/);
  assert.doesNotMatch(html, /createImageBitmap/);
  assert.doesNotMatch(html, /new Image\(/);
  assert.doesNotMatch(html, /fillText/);
  assert.doesNotMatch(html, /\.mp4|\.webm|\.png|\.jpg|\.gif|\.webp/i);
  assert.match(html, /keep in sync with js\/dream-flash\.mjs/);
});
