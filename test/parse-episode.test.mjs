import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  captionDurationMs,
  parseEpisode,
  sceneIndexForCaption,
} from "../js/parse-episode.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const episodePath = join(root, "episodes", "0006-the-ratchet-that-never-turned.txt");

function loadSource() {
  return readFileSync(episodePath, "utf8");
}

test("parses approved 0006 metadata and Geryon captions", () => {
  const episode = parseEpisode(loadSource());
  assert.equal(episode.episode, "0006");
  assert.equal(episode.title, "The Ratchet That Never Turned");
  assert.equal(
    episode.source,
    "https://www.fuzzywigg.ai/aesop/the-ratchet-that-never-turned",
  );
  assert.ok(episode.captions.length > 10);
  assert.equal(
    episode.captions[0],
    "The numbers looked great. The CI had never been green.",
  );
  assert.equal(
    episode.captions[1],
    "A test that only passes where you wrote it isn't a test — it's a local prayer.",
  );
  assert.equal(episode.captions.at(-1), "— Geryon");
  assert.ok(
    episode.captions.includes(
      "A test that only passes where you wrote it isn't a test — it's a local prayer.",
    ),
  );
  assert.ok(
    episode.captions.some((line) =>
      line.includes("Build the immune system. Let it do its job."),
    ),
  );
  assert.equal(
    episode.captions.filter((line) => line.length > 0).length,
    episode.captions.length,
  );
});

test("scene breaks match --- separators after the header", () => {
  const episode = parseEpisode(loadSource());
  assert.equal(episode.scenes.length, 7);
  assert.equal(episode.scenes[0].captions.length, 2);
  assert.equal(
    episode.scenes.reduce((n, scene) => n + scene.captions.length, 0),
    episode.captions.length,
  );
});

test("embedded player source matches the approved episode file", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const match = html.match(
    /<script type="text\/plain" id="episode-source">\n([\s\S]*?)\n\s*<\/script>/,
  );
  assert.ok(match, "index.html must embed #episode-source");
  const embedded = match[1].replace(/\r\n/g, "\n").replace(/\n$/, "");
  const file = loadSource().replace(/\r\n/g, "\n").replace(/\n$/, "");
  assert.equal(embedded, file);
});

test("caption duration stays in a readable band", () => {
  assert.equal(captionDurationMs("Hi."), 2800);
  assert.ok(captionDurationMs("word ".repeat(200)) <= 12000);
});

test("sceneIndexForCaption follows --- scene boundaries", () => {
  const episode = parseEpisode(loadSource());
  const changes = [];
  let prev = -1;
  episode.captions.forEach((_, i) => {
    const scene = sceneIndexForCaption(episode, i);
    if (scene !== prev) {
      changes.push({ caption: i, scene });
      prev = scene;
    }
  });
  assert.equal(changes.length, episode.scenes.length);
  assert.equal(changes[0].caption, 0);
  assert.equal(sceneIndexForCaption(episode, -3), 0);
  assert.equal(sceneIndexForCaption(episode, 999), episode.scenes.length - 1);
  let offset = 0;
  episode.scenes.forEach((scene, sceneIdx) => {
    assert.equal(sceneIndexForCaption(episode, offset), sceneIdx);
    assert.equal(
      sceneIndexForCaption(episode, offset + scene.captions.length - 1),
      sceneIdx,
    );
    offset += scene.captions.length;
  });
});

test("player morphs through one distinct tableau per episode scene", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const episode = parseEpisode(loadSource());
  assert.doesNotMatch(html, /FIRST_GLYPH/);
  assert.match(html, /function sceneIndexForCaption/);
  assert.match(html, /function beginSceneMorph/);
  assert.match(html, /syncScene\(i\)/);
  const morphMs = html.match(/var morphMs = (\d+)/);
  assert.ok(morphMs);
  const duration = Number(morphMs[1]);
  assert.ok(duration >= 1000 && duration <= 1700, "morph duration should stay in 1–1.7s");
  const block = html.match(/var TABLEAUX = \[([\s\S]*?)\];/);
  assert.ok(block, "index.html must define TABLEAUX");
  const ids = [...block[0].matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, episode.scenes.length);
  assert.ok(ids.length >= 5 && ids.length <= 8);
  assert.equal(new Set(ids).size, ids.length, "tableau ids must be distinct");
  const arts = [...block[0].matchAll(/art:\s*\[([\s\S]*?)\]\.join/g)].map((m) => m[1]);
  assert.equal(arts.length, ids.length);
  const hashes = arts.map((art) => (art.match(/#/g) || []).length);
  hashes.forEach((n, i) => {
    assert.ok(n >= 40, `${ids[i]} should be dense enough to read as a morph (${n} #)`);
  });
  assert.ok(ids.includes("local-green"));
  assert.ok(ids.includes("ratchet-82"));
  assert.ok(ids.includes("runner-81"));
  assert.ok(ids.includes("nvm-pin"));
  assert.ok(ids.includes("gate-catch"));
  assert.ok(ids.includes("restored-82"));
});

test("Geryon is a crab protagonist with pose variants, not CI-icon tableaux", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  assert.match(html, /var HERO = "crab"/);
  assert.match(html, /dataset\.hero = HERO/);
  assert.match(html, /dataset\.pose/);
  assert.match(html, /scuttle/);
  const block = html.match(/var TABLEAUX = \[([\s\S]*?)\];/);
  assert.ok(block, "index.html must define TABLEAUX");
  const poses = [...block[0].matchAll(/pose:\s*"([^"]+)"/g)].map((m) => m[1]);
  const ids = [...block[0].matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(poses.length, ids.length);
  assert.equal(new Set(poses).size, poses.length, "each scene needs a distinct crab pose");
  assert.ok(poses.includes("proud"));
  assert.ok(poses.includes("inspect"));
  assert.ok(poses.includes("uneasy"));
  assert.ok(poses.includes("pray"));
  assert.ok(poses.includes("scar"));
  assert.ok(poses.includes("snap"));
  assert.ok(poses.includes("victory"));
  const arts = [...block[0].matchAll(/art:\s*\[([\s\S]*?)\]\.join/g)].map((m) => m[1]);
  arts.forEach((art, i) => {
    assert.match(art, /O|o/, `${ids[i]} crab should have eyes`);
    const claws = (art.match(/\\\\\/|\/\\\\|##/g) || []).length;
    assert.ok(claws >= 4, `${ids[i]} crab should keep claws/body mass (${claws})`);
  });
  assert.match(arts[0], /LOCAL/);
  assert.match(arts[1], /82/);
  assert.match(arts[2], /81/);
  assert.match(arts[3], /nvm/);
  assert.match(arts[4], /PROMOTE/);
  assert.match(arts[5], /GATE/);
  assert.match(arts[6], /TURNED/);
});
