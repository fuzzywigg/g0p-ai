import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  PHASES,
  PHASE_IDS,
  bindPhases,
  phaseFrameForCaption,
} from "../js/phases.mjs";
import { parseEpisode, sceneIndexForCaption } from "../js/parse-episode.mjs";
import { buildTableaux, composeTableau, crabSprite, hashDensity } from "../js/tableaux.mjs";
import { FABLE_0006 } from "../js/fables/0006.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const episode = parseEpisode(
  readFileSync(join(root, "episodes", "0006-the-ratchet-that-never-turned.txt"), "utf8"),
);

test("Aesop phase map is the seven public fable sections", () => {
  assert.deepEqual(PHASE_IDS, [
    "hook",
    "room",
    "itch",
    "turn",
    "craft",
    "moral",
    "encore",
  ]);
  assert.equal(PHASES[3].template, "breakthrough");
  assert.equal(PHASES[3].frames, 2);
  assert.equal(PHASES[6].template, "curtain");
  assert.equal(PHASES[6].frames, 2);
});

test("0006 episode scenes bind 1:1 onto the phase map", () => {
  const bound = bindPhases(episode);
  assert.equal(bound.length, 7);
  assert.deepEqual(
    episode.scenes.map((s) => s.phase),
    PHASE_IDS,
  );
  assert.equal(bound[0].title, "Hook");
  assert.equal(bound[3].title, "The Turn");
  assert.equal(bound[6].title, "The Encore");
});

test("turn races then breaks through; encore enters then bows", () => {
  const turnStart = episode.scenes
    .slice(0, 3)
    .reduce((n, s) => n + s.captions.length, 0);
  assert.equal(phaseFrameForCaption(episode, turnStart), 0);
  assert.equal(phaseFrameForCaption(episode, turnStart + 1), 1);
  const encoreStart = episode.scenes
    .slice(0, 6)
    .reduce((n, s) => n + s.captions.length, 0);
  assert.equal(phaseFrameForCaption(episode, encoreStart), 0);
  assert.equal(
    phaseFrameForCaption(episode, encoreStart + episode.scenes[6].captions.length - 1),
    1,
  );
  assert.equal(phaseFrameForCaption(episode, 0), 0);
});

test("templates stamp a crab into every phase with dense glyphs", () => {
  const tableaux = buildTableaux(FABLE_0006, PHASES);
  assert.equal(tableaux.length, 7);
  tableaux.forEach((t) => {
    t.frames.forEach((art, f) => {
      assert.ok(hashDensity(art) >= 40, `${t.id} frame ${f} too sparse`);
      assert.match(art, /O|o/, `${t.id} frame ${f} needs crab eyes`);
      assert.match(art, /\\\/|\/\\/, `${t.id} frame ${f} needs crab pincers`);
    });
  });
  const turn0 = composeTableau(PHASES[3], { mark: FABLE_0006.episode, ...FABLE_0006.imagery.turn }, 0);
  const turn1 = composeTableau(PHASES[3], { mark: FABLE_0006.episode, ...FABLE_0006.imagery.turn }, 1);
  assert.match(turn0, /LOCAL GREEN/);
  assert.match(turn0, /O====O>/);
  assert.match(turn1, /81 CAUGHT/);
  assert.match(turn1, /BREAK THROUGH/);
  const encore0 = composeTableau(PHASES[6], { mark: FABLE_0006.episode, ...FABLE_0006.imagery.encore }, 0);
  const encore1 = composeTableau(PHASES[6], { mark: FABLE_0006.episode, ...FABLE_0006.imagery.encore }, 1);
  assert.match(encore0, /CURTAIN/);
  assert.match(encore1, /CURTAIN/);
  assert.match(encore0, /#O##/);
  assert.match(encore1, /\\\/|\/##\\/);
  assert.match(encore1, /THE GATE TURNED/);
  assert.match(crabSprite("racer").join("\n"), /O====O>/);
  assert.match(crabSprite("bow").join("\n"), /\\\/|\/##\\/);
  assert.notEqual(crabSprite("proud").join("\n"), crabSprite("inspect").join("\n"));
  assert.match(crabSprite("proud").join("\n"), /##\\\/##/);
  assert.match(crabSprite("inspect").join("\n"), /##>/);
});

test("episode mark and burst copy come from fable imagery, not template literals", () => {
  const src = readFileSync(join(root, "js", "tableaux.mjs"), "utf8");
  assert.doesNotMatch(src, /stamp\(grid, \["0006"\]/);
  assert.doesNotMatch(src, /"BREAK THROUGH"/);
  const hook = composeTableau(PHASES[0], { mark: FABLE_0006.episode, ...FABLE_0006.imagery.hook }, 0);
  assert.match(hook, /0006/);
  assert.match(hook, /HERE != CI/);
});

test("player inlines the phase map, composer, and frame-aware morph", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  assert.match(html, /var PHASES = \[/);
  assert.match(html, /var FABLE_IMAGERY/);
  assert.match(html, /function composeTableau/);
  assert.match(html, /function buildTableaux/);
  assert.match(html, /function phaseFrameForCaption/);
  assert.match(html, /function tableauForPhase/);
  assert.match(html, /syncScene\(i\)/);
  assert.match(html, /dataset\.phase/);
  assert.match(html, /dataset\.template/);
  assert.match(html, /dataset\.frame/);
  assert.match(html, /breakthrough/);
  assert.match(html, /curtain/);
  assert.match(html, /speakCaption\(lines\[i\]\)/);
  assert.match(html, /episode: "0006"/);
  assert.match(html, /burst: "BREAK THROUGH"/);
  assert.doesNotMatch(html, /shuffle\(particles\)/);
  assert.match(html, /targets\.sort/);
  PHASE_IDS.forEach((id) => {
    assert.match(html, new RegExp(`id: "${id}"`));
    assert.match(html, new RegExp(`phase: ${id}`));
  });
  assert.doesNotMatch(html, /FIRST_GLYPH/);
  const morphMs = html.match(/var morphMs = (\d+)/);
  assert.ok(morphMs);
  const duration = Number(morphMs[1]);
  assert.ok(duration >= 1000 && duration <= 1700);
});

test("bindPhases rejects a fable with the wrong number of scenes", () => {
  assert.throws(() => bindPhases({ episode: "x", scenes: [{ captions: ["a"] }] }), /expects 7/);
});

test("sceneIndexForCaption still follows --- boundaries", () => {
  assert.equal(sceneIndexForCaption(episode, 0), 0);
  assert.equal(sceneIndexForCaption(episode, 999), 6);
});
