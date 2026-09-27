import assert from "node:assert/strict";
import test from "node:test";
import { PHASE_IDS } from "../js/phases.mjs";
import { FABLE_0006 } from "../js/fables/0006.mjs";

test("FABLE_0006 paints every Aesop phase id", () => {
  assert.equal(FABLE_0006.episode, "0006");
  assert.match(FABLE_0006.title, /Ratchet/);
  for (const id of PHASE_IDS) {
    assert.ok(FABLE_0006.imagery[id], `missing imagery for phase ${id}`);
  }
});

test("0006 turn and encore carry multi-frame paint keys", () => {
  const { turn, encore } = FABLE_0006.imagery;
  assert.equal(turn.approach.pose, "racer");
  assert.equal(turn.breakthrough.pose, "snap");
  assert.ok(turn.breakthrough.burst);
  assert.ok(encore.title);
  assert.ok(encore.footer);
});
