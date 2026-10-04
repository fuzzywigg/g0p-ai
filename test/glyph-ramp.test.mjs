import assert from "node:assert/strict";
import test from "node:test";
import {
  BLOCK_RAMP,
  DENSITY_RAMP,
  bayerDither,
  brailleFromMask,
  densityGlyph,
  edgeGlyph,
  edgeGlyphFromNormal,
  glyphCoverage,
  perceivedRgb,
  rampIndex,
} from "../js/glyph-ramp.mjs";

test("density ramp maps black to blank and white to the heaviest glyph", () => {
  assert.equal(DENSITY_RAMP[0], " ");
  assert.equal(DENSITY_RAMP.at(-1), "@");
  assert.equal(densityGlyph(0), " ");
  assert.equal(densityGlyph(1), "@");
  assert.equal(densityGlyph(-2), " ");
  assert.equal(densityGlyph(4), "@");
  assert.equal(densityGlyph(Number.NaN), " ");
  let prev = -1;
  for (let i = 0; i <= 20; i++) {
    const index = rampIndex(i / 20);
    assert.ok(index >= prev, `ramp stepped backward at ${i / 20}`);
    prev = index;
  }
});

test("block ramp is the craft texture set and coverage tracks the ramp", () => {
  assert.equal(densityGlyph(0, BLOCK_RAMP), " ");
  assert.equal(densityGlyph(1, BLOCK_RAMP), "█");
  assert.equal(glyphCoverage(" ", DENSITY_RAMP), 0);
  assert.equal(glyphCoverage("@", DENSITY_RAMP), 1);
  assert.ok(glyphCoverage("*", DENSITY_RAMP) > glyphCoverage(":", DENSITY_RAMP));
  const paper = [0, 0, 0];
  const ink = [1, 1, 1];
  const dark = perceivedRgb(ink, paper, glyphCoverage("."));
  const light = perceivedRgb(ink, paper, glyphCoverage("%"));
  assert.ok(light[0] > dark[0]);
  assert.deepEqual(perceivedRgb(ink, paper, 0), paper);
  assert.deepEqual(perceivedRgb(ink, paper, 1), ink);
});

test("edge glyphs follow the stroke perpendicular to the surface normal", () => {
  assert.equal(edgeGlyphFromNormal(0, 1, false), "─");
  assert.equal(edgeGlyphFromNormal(0, -1, true), "═");
  assert.equal(edgeGlyphFromNormal(1, 0, false), "│");
  assert.equal(edgeGlyphFromNormal(-1, 0, true), "║");
  assert.equal(edgeGlyph(Math.PI / 4, false), "/");
  assert.equal(edgeGlyph((3 * Math.PI) / 4, true), "╲");
  assert.equal(edgeGlyphFromNormal(0, 0, false), "─");
});

test("braille masks pack into one Unicode cell and dither stays bounded", () => {
  assert.equal(brailleFromMask(0).codePointAt(0), 0x2800);
  assert.equal(brailleFromMask(0x01).codePointAt(0), 0x2801);
  assert.equal(brailleFromMask(0x1ff).codePointAt(0), 0x28ff);
  assert.equal([...brailleFromMask(0xff)].length, 1);
  assert.equal(bayerDither(0.4, 2, 3, 0), 0.4);
  assert.ok(bayerDither(0, 0, 0, 1) >= 0);
  assert.ok(bayerDither(1, 1, 1, 1) <= 1);
  assert.equal(bayerDither(0.5, 4, 8, 0.2), bayerDither(0.5, 4, 8, 0.2));
});
