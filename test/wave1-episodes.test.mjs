import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parseAudioManifest, narrationSource } from "../js/audio.mjs";
import { listHubApprovedPublicEpisodes } from "../js/catalog.mjs";
import { parseEpisode } from "../js/parse-episode.mjs";
import { PHASE_IDS, bindPhases } from "../js/phases.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const WAVE1 = [
  ["p01", 3879331],
  ["p02", 4415990],
  ["p03", 4850668],
  ["p04", 5423481],
  ["p07", 5559527],
  ["0010", 4073682],
  ["p09", 4992565],
  ["p10", 5479905],
  ["p14", 4856937],
  ["p16", 5048572],
  ["p17", 4584637],
  ["p19", 6545283],
];

const PHASE_AT = ["room", "itch", "turn", "craft", "moral", "encore"];

test("catalog lists 0006 plus the 12 approved fables", () => {
  const ids = listHubApprovedPublicEpisodes().map((ep) => ep.id);
  assert.equal(ids.length, 13);
  assert.equal(ids[0], "0006");
  assert.deepEqual(ids.slice(1), WAVE1.map(([id]) => id));
});

test("each new episode has monotonic cues within duration matching captions", () => {
  const raw = JSON.parse(readFileSync(join(root, "audio", "manifest.json"), "utf8"));
  const manifest = parseAudioManifest(raw);
  for (const [id, bytes] of WAVE1) {
    const listed = raw[id];
    assert.equal(listed.src, `audio/${id}.mp3`, id);
    assert.equal(listed.leadCaptions, 2, id);
    assert.equal(listed.cueText, undefined, id);
    assert.equal(listed.provisional, undefined, id);
    assert.equal(narrationSource(raw, id), "audio", id);

    const entry = manifest[id];
    assert.ok(entry, id);
    assert.equal(entry.cues.length > 0, true, id);
    assert.equal(entry.cues[0], 0, id);
    for (let i = 0; i < entry.cues.length; i++) {
      assert.ok(entry.cues[i] >= 0, `${id} cue ${i}`);
      assert.ok(entry.cues[i] <= listed.duration, `${id} cue ${i} ${entry.cues[i]} > ${listed.duration}`);
      if (i > 0) {
        assert.ok(entry.cues[i] >= entry.cues[i - 1], `${id} cue ${i} went backwards`);
      }
    }

    let previous = 0;
    for (const phase of PHASE_AT) {
      const at = listed.phaseAt[phase];
      assert.equal(typeof at, "number", `${id} ${phase}`);
      assert.ok(at >= previous, `${id} ${phase}`);
      assert.ok(at <= listed.duration, `${id} ${phase}`);
      previous = at;
    }

    const script = listHubApprovedPublicEpisodes().find((ep) => ep.id === id).script;
    const episode = parseEpisode(readFileSync(join(root, script), "utf8"));
    assert.equal(episode.episode, id);
    assert.equal(episode.title, listed.title, id);
    assert.equal(entry.cues.length, episode.captions.length, id);
    const bound = bindPhases(episode);
    assert.deepEqual(bound.map((scene) => scene.id), PHASE_IDS, id);
    assert.equal(episode.scenes[0].captions.length, listed.leadCaptions, id);

    const mp3 = readFileSync(join(root, "audio", `${id}.mp3`));
    assert.equal(mp3.length, bytes, id);
    assert.equal(mp3.subarray(0, 3).toString(), "ID3", id);
  }
});
