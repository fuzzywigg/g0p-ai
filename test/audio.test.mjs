import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  audioEntryForEpisode,
  audioEventAction,
  beatIndexAtTime,
  buildCaptionBeats,
  conventionAudioPath,
  dreamBeatsAtTime,
  expandNarrationCues,
  narrationSource,
  parseAudioManifest,
} from "../js/audio.mjs";
import { parseEpisode } from "../js/parse-episode.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, found = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, found);
    else found.push(path);
  }
  return found;
}

test("valid manifest maps an episode id to a url", () => {
  const manifest = parseAudioManifest({
    "0006": "https://cdn.example/aesop/0006.mp3",
    "0007": "audio/0007.mp3",
  });
  assert.equal(manifest["0006"].src, "https://cdn.example/aesop/0006.mp3");
  assert.equal(manifest["0006"].cues, null);
  assert.equal(manifest["0006"].phaseAt, null);
  assert.equal(manifest["0006"].leadCaptions, 0);
  assert.equal(manifest["0006"].title, "");
  assert.equal(manifest["0007"].src, "audio/0007.mp3");
  assert.equal(narrationSource(manifest, "0006"), "audio");
  assert.equal(narrationSource(manifest, "0007"), "audio");
  assert.equal(narrationSource(manifest, "0008"), "speech");
  assert.equal(audioEntryForEpisode(manifest, "0008"), null);
});

test("convention path is used only when the episode is listed", () => {
  assert.equal(conventionAudioPath("0006"), "audio/0006.mp3");
  assert.equal(conventionAudioPath("6"), null);
  assert.equal(conventionAudioPath("../0006"), null);

  const listed = parseAudioManifest('{ "0006": "audio/0006.mp3" }');
  assert.equal(audioEntryForEpisode(listed, "0006").src, "audio/0006.mp3");
  assert.equal(narrationSource(listed, "0006"), "audio");

  const flagged = parseAudioManifest({ "0006": true, "0007": { cues: [0, 4, 9] } });
  assert.equal(flagged["0006"].src, "audio/0006.mp3");
  assert.equal(flagged["0007"].src, "audio/0007.mp3");
  assert.deepEqual(flagged["0007"].cues, [0, 4, 9]);

  assert.equal(narrationSource({}, "0006"), "speech");
  assert.equal(audioEntryForEpisode({}, "0006"), null);
});

test("object entries keep an explicit url and cue starts", () => {
  const manifest = parseAudioManifest({
    "0006": { url: "https://cdn.example/0006.mp3", cues: [0, 2.5, 8] },
  });
  assert.equal(manifest["0006"].src, "https://cdn.example/0006.mp3");
  assert.deepEqual(manifest["0006"].cues, [0, 2.5, 8]);
  assert.equal(narrationSource(manifest, "0006"), "audio");
});

test("empty manifest selects speech", () => {
  assert.deepEqual(parseAudioManifest({}), {});
  assert.deepEqual(parseAudioManifest("{}"), {});
  assert.deepEqual(parseAudioManifest(""), {});
  assert.deepEqual(parseAudioManifest("   "), {});
  assert.equal(narrationSource({}, "0006"), "speech");
  assert.equal(narrationSource("{}", "0006"), "speech");
});

test("missing manifest selects speech", () => {
  assert.deepEqual(parseAudioManifest(undefined), {});
  assert.deepEqual(parseAudioManifest(null), {});
  assert.equal(narrationSource(undefined, "0006"), "speech");
  assert.equal(narrationSource(null, "0006"), "speech");
});

test("malformed manifest selects speech", () => {
  assert.deepEqual(parseAudioManifest("{"), {});
  assert.deepEqual(parseAudioManifest("nope"), {});
  assert.deepEqual(parseAudioManifest([]), {});
  assert.deepEqual(parseAudioManifest(42), {});
  assert.deepEqual(parseAudioManifest("null"), {});
  assert.deepEqual(parseAudioManifest("<!DOCTYPE html>"), {});
  assert.equal(narrationSource("{", "0006"), "speech");
  assert.equal(narrationSource(["audio/0006.mp3"], "0006"), "speech");
});

test("unsafe or unknown entries are dropped without disabling valid ones", () => {
  const manifest = parseAudioManifest({
    "0006": "javascript:alert(1)",
    "0007": "../secret.mp3",
    "0012": "https://cdn.example/0012.mp3",
    "12": "audio/0012.mp3",
    nope: "audio/nope.mp3",
    "0008": "",
    "0009": false,
    "0010": { src: "data:audio/mpeg;base64,AAAA" },
    "0011": "http://example.com/episode.mp3",
  });
  assert.deepEqual(Object.keys(manifest).sort(), ["0011", "0012"]);
  assert.equal(narrationSource(manifest, "0006"), "speech");
  assert.equal(narrationSource(manifest, "0012"), "audio");
  assert.equal(narrationSource(manifest, "0011"), "audio");
});

test("beat index follows audio time by word weight and by cues", () => {
  const weighted = buildCaptionBeats(["aa bb", "cc", "dd ee ff"], { duration: 12 });
  assert.equal(weighted.length, 3);
  assert.ok(Math.abs(weighted[0].start - 0) < 1e-9);
  assert.ok(Math.abs(weighted[1].start - 4) < 1e-9);
  assert.ok(Math.abs(weighted[2].start - 6) < 1e-9);
  assert.ok(Math.abs(weighted[2].end - 12) < 1e-9);
  assert.equal(beatIndexAtTime(weighted, 0), 0);
  assert.equal(beatIndexAtTime(weighted, 3.999), 0);
  assert.equal(beatIndexAtTime(weighted, 4), 1);
  assert.equal(beatIndexAtTime(weighted, 6), 2);
  assert.equal(beatIndexAtTime(weighted, 12), 2);
  assert.equal(beatIndexAtTime(weighted, -0.1), -1);
  assert.equal(beatIndexAtTime([], 1), -1);
  assert.equal(beatIndexAtTime(weighted, Number.NaN), -1);

  const cued = buildCaptionBeats(["a", "b", "c"], { cues: [0.5, 2, 4], duration: 9 });
  assert.equal(beatIndexAtTime(cued, 0), -1);
  assert.equal(beatIndexAtTime(cued, 0.5), 0);
  assert.equal(beatIndexAtTime(cued, 2), 1);
  assert.equal(beatIndexAtTime(cued, 8), 2);
  assert.deepEqual(
    cued.map((beat) => beat.end),
    [2, 4, 9],
  );

  const ignoredCues = buildCaptionBeats(["a", "b"], { duration: 4, cues: [0] });
  assert.equal(ignoredCues.length, 2);
  assert.ok(Math.abs(ignoredCues[1].start - 2) < 1e-9);
  assert.deepEqual(buildCaptionBeats(["a"], {}), []);
  assert.deepEqual(buildCaptionBeats([], { duration: 10 }), []);
});

test("reduced motion still advances the caption beat and skips the flash", () => {
  const beats = buildCaptionBeats(["one two", "three four"], { duration: 8 });
  const quiet = dreamBeatsAtTime({
    beats,
    time: 5,
    previousTime: 0,
    reduceMotion: true,
  });
  assert.equal(quiet.captionIndex, 1);
  assert.equal(quiet.previousIndex, 0);
  assert.equal(quiet.flash, false);

  const loud = dreamBeatsAtTime({
    beats,
    time: 5,
    previousTime: 0,
    reduceMotion: false,
  });
  assert.equal(loud.captionIndex, 1);
  assert.equal(loud.flash, true);

  const held = dreamBeatsAtTime({
    beats,
    time: 1,
    previousTime: 0.2,
    reduceMotion: false,
  });
  assert.equal(held.captionIndex, 0);
  assert.equal(held.flash, false);

  const before = dreamBeatsAtTime({ beats, time: -1, previousTime: -1, reduceMotion: false });
  assert.equal(before.captionIndex, -1);
  assert.equal(before.flash, false);
});

test("unspoken hook stays on the title until the first spoken phase", () => {
  const segments = [
    { captions: ["hook one", "hook two"] },
    { captions: ["aa bb", "cc"], at: 4 },
    { captions: ["one", "two two"], at: 10 },
  ];
  assert.equal(expandNarrationCues(segments, {}), null);
  assert.equal(expandNarrationCues([{ captions: ["only a hook"] }], { duration: 5 }), null);
  assert.equal(
    expandNarrationCues(
      [
        { captions: ["spoken"], at: 1 },
        { captions: ["late hook"] },
      ],
      { duration: 4 },
    ),
    null,
  );

  const cues = expandNarrationCues(segments, { duration: 16 });
  assert.deepEqual(cues, [0, 4, 4, 8, 10, 12]);
  const beats = buildCaptionBeats(
    ["hook one", "hook two", "aa bb", "cc", "one", "two two"],
    { cues, duration: 16 },
  );
  assert.equal(beatIndexAtTime(beats, 0), 0);
  assert.equal(beatIndexAtTime(beats, 3.9), 0);
  assert.equal(beatIndexAtTime(beats, 4), 2);
  assert.equal(beatIndexAtTime(beats, 8), 3);
  assert.equal(beatIndexAtTime(beats, 10), 4);
  assert.equal(beatIndexAtTime(beats, 12), 5);
});

test("load error before start falls back to speech; pause and ended settle the clock", () => {
  assert.equal(audioEventAction("error", false), "speech");
  assert.equal(audioEventAction("error", true), "end");
  assert.equal(audioEventAction("pause", true), "pause");
  assert.equal(audioEventAction("ended", false), "end");
  assert.equal(audioEventAction("timeupdate", true), "tick");
  assert.equal(audioEventAction("seeked", false), "ignore");
});

test("shipped 0006 narration skips the unspoken hook and locks later phases", () => {
  const raw = JSON.parse(readFileSync(join(root, "audio", "manifest.json"), "utf8"));
  const listed = raw["0006"];
  assert.equal(listed.src, "audio/0006.mp3");
  assert.equal(listed.title, "The Ratchet That Never Turned");
  assert.equal(listed.leadCaptions, 2);
  assert.equal(listed.phaseAt.hook, undefined);
  assert.deepEqual(listed.phaseAt, {
    room: 3.46,
    itch: 89.92,
    turn: 181.08,
    craft: 281.72,
    moral: 386.74,
    encore: 457.84,
  });

  const episode = parseEpisode(
    readFileSync(join(root, "episodes", "0006-the-ratchet-that-never-turned.txt"), "utf8"),
  );
  const entry = parseAudioManifest(raw)["0006"];
  assert.equal(narrationSource(raw, "0006"), "audio");
  assert.equal(entry.cues.length, episode.captions.length);
  assert.equal(entry.leadCaptions, 2);
  assert.equal(entry.title, listed.title);

  const segments = episode.scenes.map((scene) => {
    const at = entry.phaseAt[scene.phase];
    return at == null ? { captions: scene.captions } : { captions: scene.captions, at };
  });
  const expanded = expandNarrationCues(segments, { duration: listed.duration });
  assert.equal(expanded.length, entry.cues.length);
  for (let i = 0; i < expanded.length; i++) {
    assert.ok(Math.abs(expanded[i] - entry.cues[i]) < 0.011, `${i} ${expanded[i]} ${entry.cues[i]}`);
  }

  const beats = buildCaptionBeats(episode.captions, { cues: entry.cues, duration: listed.duration });
  assert.equal(beatIndexAtTime(beats, 1), 0);
  assert.equal(beatIndexAtTime(beats, entry.phaseAt.room - 0.05), 0);
  assert.equal(beatIndexAtTime(beats, entry.phaseAt.room), 2);
  let offset = 0;
  for (const scene of episode.scenes) {
    if (entry.phaseAt[scene.phase] != null) {
      assert.equal(beatIndexAtTime(beats, entry.phaseAt[scene.phase]), offset, scene.phase);
    }
    offset += scene.captions.length;
  }

  const mp3 = join(root, "audio", "0006.mp3");
  assert.ok(statSync(mp3).size > 4_000_000);
  const mp3s = walk(root).filter((path) => path.toLowerCase().endsWith(".mp3"));
  assert.deepEqual(mp3s, [mp3]);
});

test("inlined audio helpers match js/audio.mjs", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const start = html.indexOf("function conventionAudioPath");
  const end = html.indexOf("var currentUtterance");
  assert.ok(start > 0 && end > start);
  const inline = new Function(
    `${html.slice(start, end)}
    return {
      conventionAudioPath,
      parseAudioManifest,
      audioEntryForEpisode,
      narrationSource,
      buildCaptionBeats,
      beatIndexAtTime,
      dreamBeatsAtTime,
      audioEventAction,
      expandNarrationCues,
    };`,
  )();
  const samples = [
    undefined,
    null,
    "",
    "{",
    "{}",
    [],
    { "0006": "audio/0006.mp3" },
    { "0006": true, "0007": { url: "https://cdn.example/a.mp3", cues: [0, 1] } },
    { "0006": "javascript:alert(1)", "0008": "https://cdn.example/x.mp3" },
  ];
  for (const sample of samples) {
    assert.deepEqual(inline.parseAudioManifest(sample), parseAudioManifest(sample));
    assert.equal(inline.narrationSource(sample, "0006"), narrationSource(sample, "0006"));
    assert.deepEqual(
      inline.audioEntryForEpisode(sample, "0006"),
      audioEntryForEpisode(sample, "0006"),
    );
  }
  const lines = ["aa bb", "cc", "dd ee ff"];
  assert.deepEqual(
    inline.buildCaptionBeats(lines, { duration: 12, cues: [0, 3, 7] }),
    buildCaptionBeats(lines, { duration: 12, cues: [0, 3, 7] }),
  );
  assert.deepEqual(
    inline.buildCaptionBeats(lines, { duration: 12 }),
    buildCaptionBeats(lines, { duration: 12 }),
  );
  const beats = buildCaptionBeats(lines, { duration: 12 });
  for (const time of [-1, 0, 2.5, 4, 6, 12]) {
    assert.equal(inline.beatIndexAtTime(beats, time), beatIndexAtTime(beats, time));
    assert.deepEqual(
      inline.dreamBeatsAtTime({ beats, time, previousTime: 0, reduceMotion: true }),
      dreamBeatsAtTime({ beats, time, previousTime: 0, reduceMotion: true }),
    );
    assert.deepEqual(
      inline.dreamBeatsAtTime({ beats, time, previousTime: 0, reduceMotion: false }),
      dreamBeatsAtTime({ beats, time, previousTime: 0, reduceMotion: false }),
    );
  }
  assert.equal(inline.conventionAudioPath("0006"), conventionAudioPath("0006"));
  const leadSegments = [
    { captions: ["hook one", "hook two"] },
    { captions: ["room aa bb", "room cc"], at: 4 },
    { captions: ["encore"], at: 10 },
  ];
  assert.deepEqual(
    inline.expandNarrationCues(leadSegments, { duration: 16 }),
    expandNarrationCues(leadSegments, { duration: 16 }),
  );
  assert.equal(inline.expandNarrationCues([{ captions: ["x"] }], {}), null);
  for (const event of ["pause", "ended", "error", "timeupdate", "nope"]) {
    assert.equal(inline.audioEventAction(event, false), audioEventAction(event, false));
    assert.equal(inline.audioEventAction(event, true), audioEventAction(event, true));
  }
});

test("player inlines audio selection and keeps the speech path for an empty manifest", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const src = readFileSync(join(root, "js", "audio.mjs"), "utf8");
  for (const name of [
    "conventionAudioPath",
    "parseAudioManifest",
    "audioEntryForEpisode",
    "narrationSource",
    "buildCaptionBeats",
    "beatIndexAtTime",
    "dreamBeatsAtTime",
    "audioEventAction",
    "expandNarrationCues",
  ]) {
    assert.match(src, new RegExp(`export function ${name}\\b`));
    assert.match(html, new RegExp(`function ${name}\\b`));
  }
  assert.match(html, /keep in sync with js\/audio\.mjs/);
  assert.match(html, /new Audio\(\)/);
  assert.match(html, /audio\/manifest\.json/);
  assert.match(html, /addEventListener\("timeupdate"/);
  assert.match(html, /addEventListener\("pause"/);
  assert.match(html, /addEventListener\("ended"/);
  assert.match(html, /addEventListener\("error"/);
  assert.match(html, /currentTime/);
  assert.match(html, /narrationSource\(audioManifest, episode\.episode\)/);
  assert.match(html, /function audioCaptionText/);
  assert.match(html, /leadCaptions/);
  assert.match(html, /function expandNarrationCues/);
  assert.match(html, /function playCaptions/);
  assert.match(html, /speakCaption\(lines\[i\]/);
  assert.match(html, /prefers-reduced-motion/);
  assert.doesNotMatch(html, /<audio\b/i);
  assert.doesNotMatch(html, /audio\/0006\.mp3/);
});
