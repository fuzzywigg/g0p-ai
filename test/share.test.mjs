import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  APPROVED_EPISODE_ID,
  APPROVED_EPISODE_TITLE,
  APPROVED_SHARE_URL,
  shareAction,
  sharePayload,
} from "../js/share.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("the approved share link is 0006 on a Vercel alias", () => {
  const payload = sharePayload();
  assert.equal(APPROVED_EPISODE_ID, "0006");
  assert.equal(payload.title, APPROVED_EPISODE_TITLE);
  assert.equal(payload.text, APPROVED_EPISODE_TITLE);
  assert.equal(payload.url, APPROVED_SHARE_URL);
  assert.equal(new URL(payload.url).host, "g0p-ai.vercel.app");
  assert.equal(payload.url.includes("g0p.ai"), false);
  assert.equal(payload.title.includes("0005"), false);
  assert.equal(shareAction({ canShare: true }), "share");
  assert.equal(shareAction({ canShare: false }), "copy");
  assert.equal(shareAction({}), "copy");
});

test("the page previews 0006 and shares the alias, not the apex", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const head = html.slice(0, html.indexOf("</head>"));
  assert.match(head, /property="og:title" content="The Ratchet That Never Turned"/);
  assert.match(head, /name="twitter:title" content="The Ratchet That Never Turned"/);
  assert.match(head, /rel="canonical" href="https:\/\/g0p-ai\.vercel\.app\/"/);
  assert.match(head, /property="og:url" content="https:\/\/g0p-ai\.vercel\.app\/"/);
  assert.doesNotMatch(head, /href="https:\/\/g0p\.ai/);
  assert.doesNotMatch(head, /content="https:\/\/g0p\.ai/);
  assert.doesNotMatch(head, /0005/);
  assert.match(html, /id="share-episode"/);
  assert.match(html, /navigator\.share/);
  assert.match(html, /clipboard\.writeText/);
  assert.match(html, /https:\/\/g0p-ai\.vercel\.app\//);
  assert.match(html, /js\/share\.mjs/);
  assert.match(html, /sharePayload/);
});
