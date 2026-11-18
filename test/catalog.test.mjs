import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  EXCLUDED_EPISODE_ID,
  HUB_APPROVED_PUBLIC_BANK,
  UNPUBLISHED_PROVISIONAL_IDS,
  isHardExcludedEpisode,
  isViewerEpisodeId,
  listHubApprovedPublicEpisodes,
  normalizeEpisodeId,
  viewerEpisodeLabel,
} from "../js/catalog.mjs";
import { narrationSource } from "../js/audio.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Integer in the storage id, four-digit before provisional on a tie. */
const SORTED_STORAGE_IDS = [
  "p01",
  "p02",
  "p03",
  "p04",
  "0006",
  "p07",
  "0008",
  "p09",
  "0010",
  "p10",
  "p11",
  "p12",
  "p13",
  "p14",
  "p15",
  "p16",
  "p17",
  "p18",
  "p19",
  "p20",
];

test("hub catalog lists only approved public episodes", () => {
  const listed = listHubApprovedPublicEpisodes();
  assert.deepEqual(
    listed.map((ep) => ep.id),
    SORTED_STORAGE_IDS,
  );
  const ratchet = listed.find((ep) => ep.id === "0006");
  assert.equal(ratchet.title, "The Ratchet That Never Turned");
  assert.match(ratchet.source, /fuzzywigg\.ai\/aesop/);
  assert.equal(HUB_APPROVED_PUBLIC_BANK.length, 20);
  assert.equal(listed.find((ep) => ep.id === "0010").title, "The Night We Tamed the Beast");
  assert.equal(listed.find((ep) => ep.id === "0010").provisional, false);
  for (const ep of listed) {
    assert.equal(ep.hubApproved, true, ep.id);
    assert.equal(ep.public, true, ep.id);
    assert.match(ep.script, new RegExp(`^episodes/${ep.id}-`), ep.id);
    if (!["0006", "0008", "0010"].includes(ep.id)) assert.equal(ep.provisional, true, ep.id);
  }
});

test("viewer list is one two-digit format in deterministic sort order", () => {
  const listed = listHubApprovedPublicEpisodes();
  const displayIds = listed.map((ep) => ep.displayId);
  assert.deepEqual(
    displayIds,
    listed.map((_, index) => String(index + 1).padStart(2, "0")),
  );
  for (const ep of listed) {
    assert.equal(isViewerEpisodeId(ep.displayId), true, ep.id);
    assert.doesNotMatch(ep.displayId, /^p/u, ep.id);
    assert.doesNotMatch(ep.displayId, /^\d{4}$/u, ep.id);
    assert.notEqual(ep.displayId, ep.id, ep.id);
  }
  assert.equal(viewerEpisodeLabel("0006"), "05");
  assert.equal(viewerEpisodeLabel("0010"), "09");
  assert.equal(viewerEpisodeLabel("p10"), "10");
  assert.equal(viewerEpisodeLabel("p05"), "");

  const reversed = listHubApprovedPublicEpisodes([...HUB_APPROVED_PUBLIC_BANK].reverse());
  assert.deepEqual(
    reversed.map((ep) => ep.id),
    listed.map((ep) => ep.id),
  );
  assert.deepEqual(
    reversed.map((ep) => ep.displayId),
    displayIds,
  );

  const tie = listHubApprovedPublicEpisodes([
    { id: "p10", title: "upload", hubApproved: true, public: true },
    { id: "0010", title: "spoken", hubApproved: true, public: true },
    { id: "p01", title: "first", hubApproved: true, public: true },
    { id: "0006", title: "hub", hubApproved: true, public: true },
    { id: "0005", title: "never", hubApproved: true, public: true },
    { id: "p05", title: "absent slot", hubApproved: true, public: true },
  ]);
  assert.deepEqual(
    tie.map((ep) => ep.id),
    ["p01", "p05", "0006", "0010", "p10"],
  );
  assert.deepEqual(
    tie.map((ep) => ep.displayId),
    ["01", "02", "03", "04", "05"],
  );

  const manifest = JSON.parse(readFileSync(join(root, "audio", "manifest.json"), "utf8"));
  assert.deepEqual(Object.keys(manifest), SORTED_STORAGE_IDS);
  for (const ep of listed) {
    assert.equal(manifest[ep.id].src, `audio/${ep.id}.mp3`, ep.id);
    assert.equal(narrationSource(manifest, ep.id), "audio", ep.id);
    assert.equal(UNPUBLISHED_PROVISIONAL_IDS.includes(ep.id), false, ep.id);
  }
  for (const missing of UNPUBLISHED_PROVISIONAL_IDS) {
    assert.equal(manifest[missing], undefined, missing);
    assert.equal(listed.some((ep) => ep.id === missing), false, missing);
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

test("player catalog shell never surfaces 0005 and prints viewer ranks", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const readme = readFileSync(join(root, "README.md"), "utf8");
  assert.match(html, /id="episode-list"/);
  assert.match(html, /from "\.\/js\/catalog\.mjs"/);
  assert.match(html, /listHubApprovedPublicEpisodes/);
  assert.match(html, /isHardExcludedEpisode/);
  assert.match(html, /viewerEpisodeLabel/);
  assert.match(html, /function selectEpisode/);
  assert.match(html, /FABLE_BANK/);
  assert.match(html, /btn\.textContent = ep\.displayId \+ " — " \+ ep\.title/);
  assert.doesNotMatch(html, /btn\.textContent = ep\.id \+ " — "/);
  assert.match(html, /episodeMark: viewerEpisodeLabel\(episode\.episode\)/);
  assert.match(html, new RegExp(`${viewerEpisodeLabel("0006")} — The Ratchet That Never Turned`));
  assert.doesNotMatch(html, /episode: "0005"/);
  assert.doesNotMatch(html, /<li[^>]*>[\s\S]*0005[\s\S]*<\/li>/);
  for (const missing of UNPUBLISHED_PROVISIONAL_IDS) {
    assert.match(readme, new RegExp(missing));
    assert.doesNotMatch(html, new RegExp(`id: "${missing}"`));
  }
  assert.match(readme, /no script, no audio, no manifest entry/);
  assert.match(readme, /do_not_publish/);
});
