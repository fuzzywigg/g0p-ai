/**
 * Terminal proof of the glyph field. Usage:
 *   node scripts/preview-glyph.mjs [phase] [progress]
 */
import { PHASES } from "../js/phases.mjs";
import { FABLE_0006 } from "../js/fables/0006.mjs";
import { fieldToText, renderGlyphField } from "../js/crab-field.mjs";

const phaseId = process.argv[2] || "hook";
const progress = Number(process.argv[3] ?? 0.2);
const frame = Number(process.argv[4] ?? (phaseId === "turn" && progress > 0.5 ? 1 : 0));
const phase = PHASES.find((item) => item.id === phaseId) || PHASES[0];
const imagery = {
  mark: FABLE_0006.episode,
  ...(FABLE_0006.imagery[phase.id] || {}),
};
const shot =
  phase.id === "turn" ? (frame ? imagery.breakthrough : imagery.approach) : imagery;
const pose =
  phase.id === "turn"
    ? shot?.pose
    : phase.id === "encore"
      ? frame
        ? "bow"
        : "enter"
      : imagery.pose;

const field = renderGlyphField({
  cols: 104,
  rows: 36,
  playing: true,
  phaseId: phase.id,
  progress,
  template: phase.template,
  frame,
  pose: pose || "proud",
  time: 1680,
  flourish: Number(process.argv[5] || 0),
  reduceMotion: false,
  morphT: 1,
  imagery: shot || imagery,
  episodeMark: FABLE_0006.episode,
  aspect: 0.5,
});

function ansi(rgb, ch) {
  if (!rgb) return ch;
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  return `\x1b[38;2;${c(rgb[0])};${c(rgb[1])};${c(rgb[2])}m${ch}\x1b[0m`;
}

console.log(`# ${phase.id} ${phase.template} frame ${frame} progress ${progress} pose ${pose}`);
for (const row of field.cells) {
  console.log(row.map((cell) => ansi(cell.fg, cell.ch)).join(""));
}
console.log("--- plain ---");
console.log(fieldToText(field));
