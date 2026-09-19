import { PHASES } from "../js/phases.mjs";
import { composeTableau, hashDensity } from "../js/tableaux.mjs";
import { FABLE_0006 } from "../js/fables/0006.mjs";

const id = process.argv[2] || "0006";
const fable = id === "0006" ? FABLE_0006 : null;
if (!fable) {
  console.error("unknown fable", id);
  process.exit(1);
}

for (const phase of PHASES) {
  const n = phase.frames || 1;
  for (let f = 0; f < n; f++) {
    const art = composeTableau(phase, fable.imagery[phase.id], f);
    console.log(`===== ${phase.id} / ${phase.template} frame ${f}  (#=${hashDensity(art)}) =====`);
    console.log(art);
    console.log("");
  }
}
