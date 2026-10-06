/**
 * Optional narration audio for the Aesop theater.
 * Browser player inlines the same logic in index.html — keep them aligned.
 *
 * Manifest maps an episode id to a URL. An empty, missing, or malformed
 * manifest authorizes no audio. Listing an episode as `true` (or as an
 * object without a src) uses the convention file audio/<id>.mp3.
 *
 * A recording may speak the title and then the later phases, skipping the
 * hook lines. `leadCaptions` plus `phaseAt` place the title/hook caption on
 * that spoken title and lock every later caption to the narration.
 */

/** Numbered episodes (`0006`) and provisional wave ids (`p01`). */
const EPISODE_ID = /^(?:\d{4}|p\d{2})$/;

export function conventionAudioPath(episodeId) {
  const id = String(episodeId ?? "").trim();
  if (!EPISODE_ID.test(id)) return null;
  return `audio/${id}.mp3`;
}

function isSafeAudioUrl(src) {
  if (typeof src !== "string") return false;
  const trimmed = src.trim();
  if (!trimmed || trimmed.length > 2000) return false;
  if (trimmed.includes("..") || trimmed.includes("\\")) return false;
  if (/[\u0000-\u001f\s]/.test(trimmed)) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }
  if (trimmed.startsWith("/")) return false;
  const path = trimmed.split("#")[0].split("?")[0];
  return /^[A-Za-z0-9_./~%-]+$/.test(path);
}

function normalizeCues(cues) {
  if (!Array.isArray(cues) || cues.length === 0) return null;
  const starts = [];
  for (let i = 0; i < cues.length; i++) {
    const n = Number(cues[i]);
    if (!Number.isFinite(n) || n < 0) return null;
    if (i > 0 && n < starts[i - 1]) return null;
    starts.push(n);
  }
  return starts;
}

function normalizePhaseAt(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out = {};
  for (const key of Object.keys(value)) {
    const id = String(key).trim();
    if (!/^[a-z][a-z0-9-]{0,31}$/.test(id)) continue;
    const n = Number(value[key]);
    if (!Number.isFinite(n) || n < 0) continue;
    out[id] = n;
  }
  return Object.keys(out).length ? out : null;
}

function normalizeLeadCaptions(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 32) return 0;
  return n;
}

function normalizeTitle(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 200) return "";
  return trimmed;
}

function normalizeAudioEntry(id, value) {
  let src = null;
  let cues = null;
  let phaseAt = null;
  let leadCaptions = 0;
  let title = "";
  if (value === true) {
    src = conventionAudioPath(id);
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (isSafeAudioUrl(trimmed)) src = trimmed;
  } else if (value && typeof value === "object" && !Array.isArray(value)) {
    const raw = value.src != null ? value.src : value.url;
    if (raw == null || raw === "") {
      src = conventionAudioPath(id);
    } else if (typeof raw === "string" && isSafeAudioUrl(raw.trim())) {
      src = raw.trim();
    } else {
      return null;
    }
    cues = normalizeCues(value.cues);
    phaseAt = normalizePhaseAt(value.phaseAt);
    leadCaptions = normalizeLeadCaptions(value.leadCaptions);
    title = normalizeTitle(value.title);
  }
  if (!src) return null;
  return { id, src, cues, phaseAt, leadCaptions, title };
}

/** Bad, missing, or empty input yields an empty map (no audio). */
export function parseAudioManifest(input) {
  let data = input;
  if (input == null) return {};
  if (typeof input === "string") {
    const trimmed = input.replace(/^\uFEFF/, "").trim();
    if (!trimmed) return {};
    try {
      data = JSON.parse(trimmed);
    } catch {
      return {};
    }
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const out = {};
  for (const key of Object.keys(data)) {
    const id = String(key).trim();
    if (!EPISODE_ID.test(id)) continue;
    const entry = normalizeAudioEntry(id, data[key]);
    if (entry) out[id] = entry;
  }
  return out;
}

export function audioEntryForEpisode(manifest, episodeId) {
  const parsed = parseAudioManifest(manifest);
  const id = String(episodeId ?? "").trim();
  const entry = parsed[id];
  if (!entry || typeof entry.src !== "string" || !entry.src) return null;
  return entry;
}

/** @returns {"audio" | "speech"} */
export function narrationSource(manifest, episodeId) {
  return audioEntryForEpisode(manifest, episodeId) ? "audio" : "speech";
}

function captionWordWeight(text) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return Math.max(1, words.length);
}

function weightedStarts(captions, from, to) {
  const weights = captions.map((line) => captionWordWeight(line));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const span = Math.max(0, to - from);
  let cursor = from;
  return weights.map((weight) => {
    const start = cursor;
    cursor += (weight / total) * span;
    return start;
  });
}

/**
 * Per-caption starts for a narration that speaks a title, then named phases.
 * Segments without `at` are the unspoken hook and must be a prefix. The first
 * of those stays on screen until the first spoken phase; the rest are stacked
 * on that boundary so the clock does not pretend they were read aloud.
 * Later segments split [at, nextAt] by word weight. The final segment needs
 * `duration` when it has more than one caption.
 */
export function expandNarrationCues(segments, options = {}) {
  const groups = Array.isArray(segments) ? segments : [];
  if (!groups.length) return null;
  const lead = [];
  const spoken = [];
  let seenSpoken = false;
  for (const group of groups) {
    const captions = Array.isArray(group?.captions) ? group.captions : null;
    if (!captions) return null;
    const at = group.at;
    const hasAt = at != null && Number.isFinite(Number(at)) && Number(at) >= 0;
    if (!hasAt) {
      if (seenSpoken) return null;
      lead.push(...captions);
      continue;
    }
    seenSpoken = true;
    spoken.push({ captions, at: Number(at) });
  }
  if (!spoken.length) return null;
  for (let i = 1; i < spoken.length; i++) {
    if (spoken[i].at < spoken[i - 1].at) return null;
  }
  const duration = Number(options.duration);
  const hasDuration = Number.isFinite(duration) && duration > 0;
  const cues = [];
  const leadUntil = spoken[0].at;
  if (lead.length) {
    cues.push(0);
    for (let i = 1; i < lead.length; i++) cues.push(leadUntil);
  }
  for (let i = 0; i < spoken.length; i++) {
    const from = spoken[i].at;
    const nextAt =
      i + 1 < spoken.length ? spoken[i + 1].at : hasDuration ? Math.max(duration, from) : null;
    const caps = spoken[i].captions;
    if (!caps.length) continue;
    if (nextAt == null) {
      if (caps.length > 1) return null;
      cues.push(from);
      continue;
    }
    cues.push(...weightedStarts(caps, from, nextAt));
  }
  return cues.length ? cues : null;
}

/**
 * Caption windows on the narration clock.
 * Explicit cue starts win when one is given per caption; otherwise time is
 * split by word weight across `duration`. Missing duration and cues → [].
 */
export function buildCaptionBeats(captions, options = {}) {
  const lines = Array.isArray(captions) ? captions : [];
  const n = lines.length;
  if (!n) return [];
  const duration = Number(options.duration);
  const hasDuration = Number.isFinite(duration) && duration > 0;
  let cues = normalizeCues(options.cues);
  if (cues && cues.length !== n) cues = null;
  if (cues) {
    const beats = [];
    for (let i = 0; i < n; i++) {
      const start = cues[i];
      const next = i + 1 < n ? cues[i + 1] : hasDuration ? Math.max(duration, start) : start;
      beats.push({ index: i, start, end: Math.max(start, next) });
    }
    return beats;
  }
  if (!hasDuration) return [];
  const weights = lines.map((line) => captionWordWeight(line));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = 0;
  return weights.map((weight, index) => {
    const span = (weight / total) * duration;
    const beat = { index, start: cursor, end: cursor + span };
    cursor += span;
    return beat;
  });
}

/** Caption index whose window contains currentTime, or -1 before the first beat. */
export function beatIndexAtTime(beats, currentTime) {
  if (!Array.isArray(beats) || beats.length === 0) return -1;
  const t = Number(currentTime);
  if (!Number.isFinite(t)) return -1;
  if (t < beats[0].start) return -1;
  let found = beats[0].index;
  for (let i = 0; i < beats.length; i++) {
    if (t >= beats[i].start) found = beats[i].index;
    else break;
  }
  return found;
}

/**
 * Map an audio clock edge to the caption that should be on screen and whether
 * a speak-start dream flash is due. Reduced motion still advances the caption.
 */
export function dreamBeatsAtTime({
  beats,
  time,
  previousTime = -1,
  reduceMotion = false,
} = {}) {
  const captionIndex = beatIndexAtTime(beats, time);
  const previousIndex = beatIndexAtTime(beats, previousTime);
  const crossed = captionIndex >= 0 && captionIndex !== previousIndex;
  return {
    captionIndex,
    previousIndex,
    flash: Boolean(crossed && !reduceMotion),
  };
}

/**
 * Playback policy for an HTMLAudioElement.
 * A load error before the element has started falls back to speech.
 * Pause holds the clock. Ended, or an error after start, finishes without
 * starting a second narration.
 */
export function audioEventAction(event, hasStarted) {
  switch (event) {
    case "pause":
      return "pause";
    case "ended":
      return "end";
    case "error":
      return hasStarted ? "end" : "speech";
    case "timeupdate":
      return "tick";
    default: {
      const _exhaustive = event;
      void _exhaustive;
      return "ignore";
    }
  }
}
