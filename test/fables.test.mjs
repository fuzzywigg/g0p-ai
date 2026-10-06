import assert from "node:assert/strict";
import test from "node:test";
import { PHASE_IDS, PHASES } from "../js/phases.mjs";
import { FABLE_0006 } from "../js/fables/0006.mjs";
import { FABLE_BANK } from "../js/fables/bank.mjs";
import { buildTableaux, hashDensity } from "../js/tableaux.mjs";

test("FABLE_0006 paints every Aesop phase id", () => {
  assert.equal(FABLE_0006.episode, "0006");
  assert.match(FABLE_0006.title, /Ratchet/);
  for (const id of PHASE_IDS) {
    assert.ok(FABLE_0006.imagery[id], `missing imagery for phase ${id}`);
  }
});

test("every hub fable paints the Aesop phase map", () => {
  assert.deepEqual(Object.keys(FABLE_BANK), [
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
  ]);
  for (const [id, fable] of Object.entries(FABLE_BANK)) {
    assert.equal(fable.episode, id);
    assert.ok(fable.title);
    for (const phaseId of PHASE_IDS) {
      assert.ok(fable.imagery[phaseId], `${id} missing ${phaseId}`);
    }
    assert.equal(fable.imagery.turn.approach.pose, "racer");
    assert.equal(fable.imagery.turn.breakthrough.pose, "snap");
    assert.ok(fable.imagery.turn.breakthrough.burst);
    assert.equal(fable.imagery.encore.title, id);
    assert.ok(fable.imagery.encore.footer);
    const tableaux = buildTableaux(fable, PHASES);
    assert.equal(tableaux.length, 7);
    for (const tableau of tableaux) {
      tableau.frames.forEach((art, frame) => {
        assert.ok(hashDensity(art) >= 40, `${id} ${tableau.id} frame ${frame} too sparse`);
      });
    }
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
