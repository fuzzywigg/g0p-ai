/**
 * Optional narration audio for the Aesop theater.
 * Browser player inlines the same logic in index.html — keep them aligned.
 *
 * Manifest maps an episode id to a URL. An empty, missing, or malformed
 * manifest authorizes no audio. Listing an episode as `true` (or as an
 * object without a src) uses the convention file audio/<id>.mp3.
 * No MP3 ships in the repo; files are matched separately.
 */

const EPISODE_ID = /^\d{4}$/;

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

function normalizeAudioEntry(id, value) {
  let src = null;
  let cues = null;
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
  }
  if (!src) return null;
  return { id, src, cues };
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
