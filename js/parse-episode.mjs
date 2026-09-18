/**
 * Parse an approved Aesop episode source.
 * Header keys, --- scene breaks, [Geryon] narration lines.
 */

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
    for (const line of sceneText.split("\n")) {
      const match = line.match(/^\[Geryon\]\s*(.*)$/);
      if (!match) continue;
      const caption = match[1].trimEnd();
      sceneCaptions.push(caption);
      captions.push(caption);
    }
    scenes.push({ captions: sceneCaptions });
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
