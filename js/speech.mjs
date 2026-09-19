/**
 * Web Speech helpers for the Aesop theater.
 * Browser player inlines the same logic in index.html — keep them aligned.
 */

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
