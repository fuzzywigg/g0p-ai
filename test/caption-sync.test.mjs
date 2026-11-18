import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parseAudioManifest, renderedCaptionAtTime } from "../js/audio.mjs";
import { listHubApprovedPublicEpisodes } from "../js/catalog.mjs";
import { parseEpisode } from "../js/parse-episode.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const HEADINGS = {
  "0006": ["room", "itch", "craft", "moral", "encore"],
  p01: ["room", "itch", "turn", "craft", "moral", "encore"],
  p02: ["room", "turn", "craft", "moral", "encore"],
  p03: ["room", "itch", "turn", "craft", "moral", "encore"],
  p04: ["room", "itch", "craft", "moral", "encore"],
  p07: ["room", "itch", "turn", "craft", "moral", "encore"],
  "0010": ["itch", "turn", "craft", "moral", "encore"],
  p09: ["room", "itch", "turn", "craft", "moral", "encore"],
  p10: ["room", "itch", "turn", "craft"],
  p14: ["room", "itch", "turn", "craft", "moral", "encore"],
  p16: ["room", "turn", "craft", "moral", "encore"],
  p17: ["room", "itch", "turn", "craft", "moral"],
  p19: ["room", "itch", "turn", "craft", "moral"],
  "0008": ["room", "itch", "turn", "craft", "encore"],
  p11: ["room", "itch", "turn", "craft", "moral", "encore"],
  p12: ["room", "itch", "turn", "craft", "encore"],
  p13: ["room", "itch", "turn", "craft", "moral", "encore"],
  p15: ["room", "itch", "turn", "craft", "moral", "encore"],
  p18: ["room", "itch", "turn", "craft", "moral"],
  p20: ["room", "itch", "turn", "craft", "moral"],
};

const LABEL = {
  room: "The room.",
  itch: "The itch.",
  turn: "The turn.",
  craft: "The craft.",
  moral: "The moral.",
  encore: "The encore.",
};

function load(id) {
  const raw = JSON.parse(readFileSync(join(root, "audio", "manifest.json"), "utf8"));
  const episodeMeta = listHubApprovedPublicEpisodes().find((ep) => ep.id === id);
  const episode = parseEpisode(readFileSync(join(root, episodeMeta.script), "utf8"));
  const entry = parseAudioManifest(raw)[id];
  return { raw, episode, entry };
}

function shown(id, time) {
  const { episode, entry } = load(id);
  return renderedCaptionAtTime(episode.captions, entry, time, { duration: entry.cues.at(-1) });
}

test("spoken section headings are captions in their phase", () => {
  for (const episodeMeta of listHubApprovedPublicEpisodes()) {
    const { episode } = load(episodeMeta.id);
    for (const phase of HEADINGS[episodeMeta.id]) {
      const scene = episode.scenes.find((item) => item.phase === phase);
      assert.equal(scene.captions[0], LABEL[phase], `${episodeMeta.id} ${phase}`);
    }
  }
});

test("hallucinated caption words are gone and verified wording matches the narration", () => {
  const read = (id) => {
    const script = listHubApprovedPublicEpisodes().find((ep) => ep.id === id).script;
    return readFileSync(join(root, script), "utf8");
  };
  assert.equal(read("p02").includes("Thanks for watching"), false);
  assert.equal(read("p02").includes("Noise."), false);
  assert.equal(read("p04").includes("We'll be right back"), false);
  assert.equal(read("p04").includes("The rider lane sorted out"), true);
  assert.equal(read("p19").includes("Thank you."), false);
  assert.equal(read("p19").includes("I changed the path"), true);
  assert.equal(read("p17").includes("weeks."), false);
  assert.equal(read("p03").includes("Just swap the fleet token"), true);
  assert.equal(read("p03").includes("push the commit"), true);
  assert.equal(read("p03").includes("I'm riding now"), true);
  assert.equal(read("p03").includes("Never widen the fleet token"), true);
  assert.equal(read("p03").includes("MetaHarness Manager path"), true);
  assert.equal(read("p09").includes("the gateway security layer"), true);
  assert.equal(read("p10").includes("and watch the next"), true);
  assert.equal(read("p11").includes("*"), false);
  assert.equal(read("p11").includes("asterisk asterisk"), true);
  assert.equal(read("p11").includes("asterisk slash 5"), true);
  assert.equal(read("p11").includes("why the restart seemed"), true);
  assert.equal(read("p11").includes("echoed the parse schedule"), true);
  assert.equal(read("p12").includes("and asked to off"), true);
  assert.equal(read("p13").includes("The memory files stayed"), true);
  assert.equal(read("p14").includes("pic ingest"), true);
  assert.equal(read("p14").includes("examined the script source"), true);
  assert.equal(read("p15").includes("warden"), false);
  assert.equal(read("p15").includes("warder"), true);
  assert.equal(read("p15").includes("hum of drive spinning"), true);
  assert.equal(read("p15").includes("I recalled the comment in"), true);
  assert.equal(read("p15").includes("come back, never fabricated"), true);
  assert.equal(read("p15").includes("the next bring brings"), true);
  assert.equal(read("p16").includes("and tighten the cleanup"), true);
  assert.equal(read("p01").includes("had to be auditable, every push logged"), true);
  assert.equal(read("0010").includes("systemd path. Classic. The connection"), true);
  assert.equal(read("0006").includes("whether you've violated"), true);
  assert.equal(read("p04").includes("structural problem she's solving"), true);
});

test("openings that were title-only are the spoken caption at that audio time", () => {
  assert.equal(shown("0008", 0.4).text, "Sometimes the warmest voice is the one you already hold.");
  assert.equal(shown("0008", 4.2).text, "The room.");
  assert.equal(shown("0010", 0.4).text, "The Night We Tamed the Beast");
  assert.match(shown("0010", 3).text, /failing loud enough to be fixed/);
  assert.match(shown("0010", 137).text, /Classic\./);
  assert.match(shown("0010", 425.2).text, /^The moral\.$/);
  assert.match(shown("0010", 428).text, /failing loud enough to be fixed/);
  assert.equal(shown("0010", 432).text, "The encore.");
  assert.equal(shown("p17", 1).text, "PR Source Failure Signature Changed");
  assert.equal(shown("p17", 4).text, "HTTP 502, not PAT scope error.");
  assert.equal(shown("p17", 8).text, "The room.");
  assert.match(shown("p01", 243).text, /auditable/);
  assert.match(shown("p15", 308).text, /come back/);
});
