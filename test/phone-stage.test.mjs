import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  PHONE_CAPTION_DOCK,
  PHONE_STAGE_MAX_WIDTH,
  heroStageSize,
  isPhoneStageWidth,
} from "../js/phone-stage.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("iPhone SE widths reserve a caption dock under the hero", () => {
  assert.equal(PHONE_STAGE_MAX_WIDTH, 375);
  assert.equal(isPhoneStageWidth(320), true);
  assert.equal(isPhoneStageWidth(375), true);
  assert.equal(isPhoneStageWidth(376), false);
  assert.equal(isPhoneStageWidth(1440), false);

  for (const [width, height] of [
    [320, 568],
    [375, 667],
  ]) {
    const stage = heroStageSize(width, height);
    assert.equal(stage.phone, true);
    assert.equal(stage.width, width);
    assert.equal(stage.captionDock, Math.round(height * PHONE_CAPTION_DOCK));
    assert.equal(stage.height + stage.captionDock, height);
    assert.ok(stage.captionDock > 0);
    assert.ok(stage.height > stage.captionDock, "hero stays the larger stage");
  }
});

test("wider viewports keep the full frame and no dock", () => {
  const desktop = heroStageSize(1440, 900);
  assert.deepEqual(desktop, { phone: false, width: 1440, height: 900, captionDock: 0 });
  const modern = heroStageSize(390, 844);
  assert.equal(modern.phone, false);
  assert.equal(modern.captionDock, 0);
  assert.equal(modern.height, 844);
});

test("the player sizes the hero from the phone stage and docks captions", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  assert.match(html, /js\/phone-stage\.mjs/);
  assert.match(html, /heroStageSize/);
  assert.match(html, /max-width:\s*375px/);
  assert.match(html, /data-phone-stage/);
  assert.match(html, /#caption-wrap/);
  assert.match(html, /prefers-reduced-motion/);
  const resize = html.slice(html.indexOf("function resize"), html.indexOf("function spawnParticles"));
  assert.match(resize, /heroStageSize/);
  assert.match(resize, /captionDock/);
});
