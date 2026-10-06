import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  EXCLUDED_EPISODE_ID,
  HUB_APPROVED_PUBLIC_BANK,
  isHardExcludedEpisode,
  listHubApprovedPublicEpisodes,
  normalizeEpisodeId,
} from "../js/catalog.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const WAVE1_IDS = [
  "0006",
  "p01",
  "p02",
  "p03",
  "p04",
  "p07",
  "0010",
  "p09",
  "p10",
  "p14",
  "p16",
  "p17",
  "p19",
];

test("hub catalog lists only approved public episodes", () => {
  const listed = listHubApprovedPublicEpisodes();
  assert.deepEqual(
    listed.map((ep) => ep.id),
    WAVE1_IDS,
  );
  assert.equal(listed[0].title, "The Ratchet That Never Turned");
  assert.match(listed[0].source, /fuzzywigg\.ai\/aesop/);
  assert.equal(HUB_APPROVED_PUBLIC_BANK.length, 13);
  assert.equal(listed.find((ep) => ep.id === "0010").title, "The Night We Tamed the Beast");
  assert.equal(listed.find((ep) => ep.id === "0010").provisional, false);
  for (const ep of listed) {
    assert.equal(ep.hubApproved, true, ep.id);
    assert.equal(ep.public, true, ep.id);
    assert.match(ep.script, new RegExp(`^episodes/${ep.id}-`), ep.id);
    if (ep.id !== "0006" && ep.id !== "0010") assert.equal(ep.provisional, true, ep.id);
  }
});

test("unpublished and unapproved entries stay off the catalog", () => {
  const listed = listHubApprovedPublicEpisodes([
    { id: "0006", title: "ok", hubApproved: true, public: true },
    { id: "0007", title: "draft", hubApproved: false, public: true },
    { id: "0008", title: "private", hubApproved: true, public: false },
    { id: "0009", title: "invented" },
  ]);
  assert.deepEqual(
    listed.map((ep) => ep.id),
    ["0006"],
  );
});

test("episode 0005 is hard-excluded even if marked hub-approved public", () => {
  assert.equal(EXCLUDED_EPISODE_ID, "0005");
  assert.equal(isHardExcludedEpisode("0005"), true);
  assert.equal(isHardExcludedEpisode("#0005"), true);
  assert.equal(isHardExcludedEpisode("5"), false);
  assert.equal(normalizeEpisodeId("0006"), "0006");

  const listed = listHubApprovedPublicEpisodes([
    { id: "0005", title: "never", hubApproved: true, public: true },
    { id: "0006", title: "The Ratchet That Never Turned", hubApproved: true, public: true },
    { id: EXCLUDED_EPISODE_ID, title: "also never", hubApproved: true, public: true },
  ]);
  assert.ok(!listed.some((ep) => ep.id === "0005"));
  assert.ok(!listed.some((ep) => isHardExcludedEpisode(ep.id)));
  assert.deepEqual(
    listed.map((ep) => ep.id),
    ["0006"],
  );
});

test("player catalog shell never surfaces 0005", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  assert.match(html, /id="episode-list"/);
  assert.match(html, /listHubApprovedPublicEpisodes/);
  assert.match(html, /isHardExcludedEpisode/);
  assert.match(html, /EXCLUDED_EPISODE_ID/);
  assert.match(html, /function selectEpisode/);
  assert.match(html, /FABLE_BANK/);
  assert.match(html, /0005/);
  for (const ep of HUB_APPROVED_PUBLIC_BANK) {
    assert.match(html, new RegExp(`id: "${ep.id}"`));
    assert.match(html, new RegExp(ep.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(html, /episode: "0005"/);
  assert.doesNotMatch(
    html,
    /<li[^>]*>[\s\S]*0005[\s\S]*<\/li>/,
  );
});
