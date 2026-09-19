/**
 * Symmetric Aesop phase map for every g0p.ai fable.
 * --- scene order in the episode file is this list, in this order.
 * Templates are shared; fable imagery (js/fables/<id>.mjs) is unique.
 */

export const PHASES = Object.freeze([
  {
    id: "hook",
    title: "Hook",
    template: "spotlight",
    frames: 1,
    beat: "Cold open. Geryon steps into the light with the epigraph.",
  },
  {
    id: "room",
    title: "The Room",
    template: "set",
    frames: 1,
    beat: "The world as it seemed — the local green, the set we trusted.",
  },
  {
    id: "itch",
    title: "The Itch",
    template: "unease",
    frames: 1,
    beat: "Something is one off. The crab notices.",
  },
  {
    id: "turn",
    title: "The Turn",
    template: "breakthrough",
    frames: 2,
    splitCaption: 1,
    beat: "Geryon races at the false picture, then breaks through into the true one.",
  },
  {
    id: "craft",
    title: "The Craft",
    template: "scar",
    frames: 1,
    beat: "The concrete scar — the work, the retract, the small cause.",
  },
  {
    id: "moral",
    title: "The Moral",
    template: "lesson",
    frames: 1,
    beat: "The portable rule. Geryon holds the lesson.",
  },
  {
    id: "encore",
    title: "The Encore",
    template: "curtain",
    frames: 2,
    splitCaption: -2,
    beat: "Side-stage, curtain, bow to an audience of crabs.",
  },
]);

export const PHASE_IDS = PHASES.map((p) => p.id);

export function phaseAt(index, phases = PHASES) {
  if (!phases.length) return null;
  const i = Math.max(0, Math.min(Number(index) || 0, phases.length - 1));
  return phases[i];
}

function captionOffset(episode, sceneIndex) {
  let offset = 0;
  const scenes = episode?.scenes ?? [];
  for (let i = 0; i < sceneIndex && i < scenes.length; i++) {
    offset += scenes[i].captions.length;
  }
  return offset;
}

/** Intra-scene frame for multi-frame templates (turn approach→breakthrough, encore enter→bow). */
export function phaseFrameForCaption(episode, captionIndex, phases = PHASES) {
  const scenes = episode?.scenes ?? [];
  if (!scenes.length) return 0;
  let idx = Number(captionIndex);
  if (!Number.isFinite(idx) || idx < 0) idx = 0;
  let sceneIdx = 0;
  let offset = 0;
  for (let i = 0; i < scenes.length; i++) {
    const n = scenes[i].captions.length;
    if (idx < offset + n) {
      sceneIdx = i;
      break;
    }
    offset += n;
    sceneIdx = i;
  }
  const phase = phaseAt(sceneIdx, phases);
  const frames = phase?.frames || 1;
  if (frames < 2) return 0;
  const scene = scenes[sceneIdx];
  const local = idx - captionOffset(episode, sceneIdx);
  let split = phase.splitCaption;
  if (split == null) split = Math.ceil(scene.captions.length / 2);
  if (split < 0) split = Math.max(0, scene.captions.length + split);
  return local >= split ? 1 : 0;
}

export function bindPhases(episode, phases = PHASES) {
  const scenes = episode?.scenes ?? [];
  if (scenes.length !== phases.length) {
    throw new Error(
      `episode ${episode?.episode || "?"} has ${scenes.length} scenes; Aesop phase map expects ${phases.length}`,
    );
  }
  return scenes.map((scene, i) => {
    const expected = phases[i].id;
    if (scene.phase && scene.phase !== expected) {
      throw new Error(`scene ${i} declares phase ${scene.phase}, expected ${expected}`);
    }
    return {
      ...phases[i],
      captions: scene.captions,
    };
  });
}
