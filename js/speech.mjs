/**
 * Web Speech helpers for the Aesop theater.
 * Free browser SpeechSynthesis only — no paid TTS.
 * Browser player inlines the same logic in index.html — keep them aligned.
 */

export const MUTE_STORAGE_KEY = "g0p-ai-mute";
export const VOICE_STORAGE_KEY = "g0p-ai-voice";

export function readStoredMute(storage) {
  try {
    return storage?.getItem?.(MUTE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeStoredMute(storage, muted) {
  try {
    storage?.setItem?.(MUTE_STORAGE_KEY, muted ? "1" : "0");
  } catch {
    /* private mode / missing storage */
  }
}

export function readStoredVoiceURI(storage) {
  try {
    return String(storage?.getItem?.(VOICE_STORAGE_KEY) || "");
  } catch {
    return "";
  }
}

export function writeStoredVoiceURI(storage, uri) {
  try {
    const value = String(uri || "");
    if (!value) storage?.removeItem?.(VOICE_STORAGE_KEY);
    else storage?.setItem?.(VOICE_STORAGE_KEY, value);
  } catch {
    /* private mode / missing storage */
  }
}

export function listVoices(voices) {
  return Array.isArray(voices) ? voices.filter(Boolean) : [];
}

export function voiceKey(voice) {
  if (!voice) return "";
  return String(voice.voiceURI || voice.name || "");
}

export function pickVoice(voices, preferredURI) {
  const list = listVoices(voices);
  const want = String(preferredURI || "");
  if (want) {
    const found = list.find((v) => voiceKey(v) === want);
    if (found) return found;
  }
  return pickEnglishVoice(list);
}

export function attachVoicesChanged(synth, onChange) {
  if (typeof onChange !== "function") return function detach() {};
  function handler() {
    const voices =
      synth && typeof synth.getVoices === "function" ? synth.getVoices() : [];
    onChange(listVoices(voices));
  }
  if (synth && typeof synth.addEventListener === "function") {
    synth.addEventListener("voiceschanged", handler);
    handler();
    return function detach() {
      if (typeof synth.removeEventListener === "function") {
        synth.removeEventListener("voiceschanged", handler);
      }
    };
  }
  if (synth) synth.onvoiceschanged = handler;
  handler();
  return function detach() {
    if (synth && synth.onvoiceschanged === handler) synth.onvoiceschanged = null;
  };
}

export function shouldSpeak({ muted, synth, Utterance }) {
  if (muted) return false;
  return canSpeak(synth, Utterance);
}

export function pickEnglishVoice(voices) {
  if (!Array.isArray(voices) || voices.length === 0) return null;
  const list = voices.filter(Boolean);
  const english = list.filter((v) => /^en([-_]|$)/i.test(String(v.lang || "")));
  const pool = english.length ? english : list;

  function score(v) {
    const name = String(v.name || "");
    const lang = String(v.lang || "");
    let n = 0;
    if (/google/i.test(name)) n += 8;
    if (/microsoft|natural|neural/i.test(name)) n += 7;
    if (/samantha|daniel|karen|moira|alex|arthur|rishi|sonia|guy/i.test(name)) {
      n += 6;
    }
    if (/en-GB/i.test(lang)) n += 3;
    if (/en-US/i.test(lang)) n += 2;
    if (/en-AU|en-IN|en-IE/i.test(lang)) n += 1;
    if (v.localService) n += 2;
    if (
      /compact|novelty|whisper|zarvox|bad news|bells|boing|cellos|good news|jester|organ|superstar|trinoids|bubbles|bahh|pipes/i.test(
        name,
      )
    ) {
      n -= 10;
    }
    return n;
  }

  return pool.slice().sort((a, b) => score(b) - score(a))[0] || null;
}

export function canSpeak(synth, Utterance) {
  return Boolean(
    synth &&
      typeof synth.speak === "function" &&
      typeof synth.cancel === "function" &&
      typeof Utterance === "function",
  );
}

export function speechFallbackMs(text) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.min(90000, Math.max(4000, words * 520 + 2500));
}

export function speakWithSynthesis(synth, Utterance, text, voice) {
  if (!canSpeak(synth, Utterance)) return null;
  synth.cancel();
  const utterance = new Utterance(String(text || ""));
  utterance.rate = 1;
  utterance.pitch = 1;
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang || "en-US";
  } else {
    utterance.lang = "en-US";
  }
  synth.speak(utterance);
  return utterance;
}

export function cancelSpeech(synth) {
  if (synth && typeof synth.cancel === "function") synth.cancel();
}
