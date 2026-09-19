import { PHASES } from "../js/phases.mjs";
import { composeTableau, crabSprite, hashDensity } from "../js/tableaux.mjs";
import { FABLE_0006 } from "../js/fables/0006.mjs";

const id = process.argv[2] || "0006";
const fable = id === "0006" ? FABLE_0006 : null;
if (!fable) {
  console.error("unknown fable", id);
  process.exit(1);
}

const poses = ["proud", "inspect", "uneasy", "racer", "snap", "scar", "pray", "enter", "bow"];
console.log("===== Geryon sprites =====");
for (const pose of poses) {
  const lines = crabSprite(pose);
  console.log(`--- ${pose}  ${lines.length}x${Math.max(...lines.map((l) => l.length))} ---`);
  console.log(lines.join("\n"));
  console.log("");
}

for (const phase of PHASES) {
  const n = phase.frames || 1;
  const imagery = { mark: fable.episode, ...(fable.imagery[phase.id] || {}) };
  for (let f = 0; f < n; f++) {
    const art = composeTableau(phase, imagery, f);
    console.log(`===== ${phase.id} / ${phase.template} frame ${f}  (#=${hashDensity(art)}) =====`);
    console.log(art);
    console.log("");
  }
}
