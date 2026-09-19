/**
 * Parse an approved Aesop episode source.
 * Header keys, --- scene breaks in PHASES order, optional phase: key, [Geryon] narration.
 */

import { PHASES } from "./phases.mjs";

export function parseEpisode(raw) {
  const text = String(raw).replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const parts = text.split(/\n---\n/);
  const headerBlock = parts[0] ?? "";
  const meta = {};
  for (const line of headerBlock.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) meta[key] = value;
  }

  const scenes = [];
  const captions = [];
  for (const sceneText of parts.slice(1)) {
    const sceneCaptions = [];
    let phase = "";
    for (const line of sceneText.split("\n")) {
      const phaseMatch = line.match(/^phase:\s*(\S+)\s*$/);
      if (phaseMatch) {
        phase = phaseMatch[1];
        continue;
      }
      const match = line.match(/^\[Geryon\]\s*(.*)$/);
      if (!match) continue;
      const caption = match[1].trimEnd();
      sceneCaptions.push(caption);
      captions.push(caption);
    }
    const index = scenes.length;
    scenes.push({
      captions: sceneCaptions,
      phase: phase || PHASES[index]?.id || "",
    });
  }

  return {
    episode: meta.episode ?? "",
    title: meta.title ?? "",
    source: meta.source ?? "",
    fetched: meta.fetched ?? "",
    scenes,
    captions,
  };
}

export function captionDurationMs(caption) {
  const words = caption.trim().split(/\s+/).filter(Boolean).length;
  const ms = 2200 + words * 160;
  return Math.min(12000, Math.max(2800, ms));
}

/** Map a flat caption index to the --- scene that contains it. */
export function sceneIndexForCaption(episode, captionIndex) {
  const scenes = episode?.scenes ?? [];
  if (!scenes.length) return 0;
  let idx = Number(captionIndex);
  if (!Number.isFinite(idx) || idx < 0) idx = 0;
  let offset = 0;
  for (let i = 0; i < scenes.length; i++) {
    const n = scenes[i].captions.length;
    if (idx < offset + n) return i;
    offset += n;
  }
  return scenes.length - 1;
}
