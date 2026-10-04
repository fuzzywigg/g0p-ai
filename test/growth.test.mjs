import assert from "node:assert/strict";
import test from "node:test";
import { PHASE_IDS } from "../js/phases.mjs";
import {
  PRINTABLE_ASCII,
  SHADE_ORDER,
  bruiseHues,
  dietAt,
  glyphCountAt,
  growthState,
  hueCountAt,
  stageFraction,
} from "../js/growth.mjs";

test("the shade order is the printable ASCII set, sparse end first", () => {
  assert.equal(PRINTABLE_ASCII.length, 95);
  assert.equal(PRINTABLE_ASCII[0], " ");
  assert.equal(PRINTABLE_ASCII[94], "~");
  assert.equal(SHADE_ORDER.length, 94);
  assert.equal(new Set(SHADE_ORDER).size, 94);
  assert.equal(SHADE_ORDER.slice(0, 3), ".:o");
  assert.equal(SHADE_ORDER.includes(" "), false);
  for (const ch of PRINTABLE_ASCII) {
    if (ch === " ") continue;
    assert.equal(SHADE_ORDER.includes(ch), true, ch);
  }
});

test("glyphs and bruise hues accumulate across phase boundaries", () => {
  assert.equal(dietAt("hook", 0), ".:o");
  assert.equal(glyphCountAt("hook", 0), 3);
  assert.equal(hueCountAt("hook", 0), 1);
  assert.equal(bruiseHues("hook", 0).length, 1);
  assert.ok(bruiseHues("hook", 0)[0].s < 0.15);

  for (let i = 0; i < PHASE_IDS.length - 1; i++) {
    const endDiet = dietAt(PHASE_IDS[i], 1);
    const nextDiet = dietAt(PHASE_IDS[i + 1], 0);
    assert.equal(endDiet, nextDiet, PHASE_IDS[i]);
    assert.equal(hueCountAt(PHASE_IDS[i], 1), hueCountAt(PHASE_IDS[i + 1], 0));
    assert.ok(stageFraction(PHASE_IDS[i], 1) <= stageFraction(PHASE_IDS[i + 1], 1) + 1e-9);
    assert.ok(dietAt(PHASE_IDS[i], 0).length <= dietAt(PHASE_IDS[i], 1).length);
  }

  const encore = growthState("encore", 1);
  assert.equal(encore.diet.length, 94);
  assert.equal(encore.glyphCount, 95);
  assert.equal(encore.glyphTotal, 95);
  assert.equal(encore.hueCount, 16);
  assert.ok(stageFraction("encore", 1) > stageFraction("hook", 0));
  assert.ok(hueCountAt("itch", 0) > hueCountAt("hook", 0));
  assert.ok(dietAt("room", 0).startsWith(dietAt("hook", 0)));
});
