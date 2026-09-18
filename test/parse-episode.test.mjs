import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { captionDurationMs, parseEpisode } from "../js/parse-episode.mjs";

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
