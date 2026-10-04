import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  MUTE_STORAGE_KEY,
  VOICE_STORAGE_KEY,
  attachVoicesChanged,
  canSpeak,
  cancelSpeech,
  listVoices,
  pickEnglishVoice,
  pickVoice,
  readStoredMute,
  readStoredVoiceURI,
  shouldSpeak,
  speakWithSynthesis,
  speechFallbackMs,
  voiceKey,
  writeStoredMute,
  writeStoredVoiceURI,
} from "../js/speech.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("pickEnglishVoice prefers a clear English voice", () => {
  assert.equal(pickEnglishVoice([]), null);
  assert.equal(pickEnglishVoice(undefined), null);

  const voices = [
    { name: "Zarvox", lang: "en-US", localService: true },
    { name: "Google UK English Female", lang: "en-GB", localService: false },
    { name: "Microsoft Aria Online (Natural)", lang: "en-US", localService: false },
    { name: "French Female", lang: "fr-FR", localService: true },
  ];
  const picked = pickEnglishVoice(voices);
  assert.equal(picked.name, "Google UK English Female");

  const localOnly = pickEnglishVoice([
    { name: "Samantha", lang: "en-US", localService: true },
    { name: "Novelty Bubbles", lang: "en-US", localService: true },
  ]);
  assert.equal(localOnly.name, "Samantha");

  const fallback = pickEnglishVoice([{ name: "Nora", lang: "nb-NO", localService: true }]);
  assert.equal(fallback.name, "Nora");
});

test("canSpeak and speakWithSynthesis no-op without a synth", () => {
  assert.equal(canSpeak(null, function Utterance() {}), false);
  assert.equal(canSpeak({ speak() {}, cancel() {} }, null), false);
  assert.equal(speakWithSynthesis(null, function Utterance() {}, "hi"), null);

  const spoken = [];
  const cancelled = [];
  function Utterance(text) {
    this.text = text;
  }
  const synth = {
    speak(u) {
      spoken.push(u);
    },
    cancel() {
      cancelled.push(true);
    },
  };
  const voice = { name: "Samantha", lang: "en-US" };
  const utterance = speakWithSynthesis(synth, Utterance, "The ratchet turned.", voice);
  assert.equal(cancelled.length, 1);
  assert.equal(spoken.length, 1);
  assert.equal(utterance.text, "The ratchet turned.");
  assert.equal(utterance.lang, "en-US");
  assert.equal(utterance.voice, voice);
  assert.equal(utterance.rate, 1);

  cancelSpeech(synth);
  assert.equal(cancelled.length, 2);
  cancelSpeech(null);
});

test("speech fallback covers long captions without hanging forever", () => {
  assert.ok(speechFallbackMs("Hi.") >= 4000);
  assert.ok(speechFallbackMs("word ".repeat(200)) <= 90000);
  assert.ok(speechFallbackMs("word ".repeat(40)) > speechFallbackMs("Hi."));
});

test("mute is remembered in localStorage", () => {
  const store = new Map();
  const storage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
  assert.equal(readStoredMute(storage), false);
  writeStoredMute(storage, true);
  assert.equal(store.get(MUTE_STORAGE_KEY), "1");
  assert.equal(readStoredMute(storage), true);
  writeStoredMute(storage, false);
  assert.equal(readStoredMute(storage), false);
});

test("voice picker uses getVoices and follows voiceschanged", () => {
  const voicesA = [
    { name: "Zarvox", lang: "en-US", voiceURI: "zarvox", localService: true },
    { name: "Google UK English Female", lang: "en-GB", voiceURI: "google-uk", localService: false },
  ];
  const voicesB = [
    { name: "Samantha", lang: "en-US", voiceURI: "samantha", localService: true },
    { name: "Google UK English Female", lang: "en-GB", voiceURI: "google-uk", localService: false },
  ];
  assert.deepEqual(
    listVoices(voicesA).map((v) => v.name),
    ["Zarvox", "Google UK English Female"],
  );
  const store = new Map();
  const storage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
  writeStoredVoiceURI(storage, "samantha");
  assert.equal(readStoredVoiceURI(storage), "samantha");
  assert.equal(VOICE_STORAGE_KEY, "g0p-ai-voice");
  assert.equal(pickVoice(voicesA, "samantha").name, "Google UK English Female");
  assert.equal(pickVoice(voicesB, "samantha").name, "Samantha");
  assert.equal(voiceKey(voicesB[0]), "samantha");

  let latest = [];
  const listeners = [];
  const synth = {
    getVoices() {
      return latest;
    },
    addEventListener(type, fn) {
      listeners.push({ type, fn });
    },
    removeEventListener(type, fn) {
      const i = listeners.findIndex((l) => l.type === type && l.fn === fn);
      if (i >= 0) listeners.splice(i, 1);
    },
  };
  const seen = [];
  const detach = attachVoicesChanged(synth, (voices) => {
    seen.push(voices.map((v) => v.name));
  });
  assert.equal(listeners[0].type, "voiceschanged");
  assert.deepEqual(seen, [[]]);
  latest = voicesB;
  listeners[0].fn();
  assert.deepEqual(seen[1], ["Samantha", "Google UK English Female"]);
  detach();
  assert.equal(listeners.length, 0);
});

test("muted or missing synthesis skips speak and leaves captions as fallback", () => {
  function Utterance() {}
  const synth = { speak() {}, cancel() {} };
  assert.equal(shouldSpeak({ muted: true, synth, Utterance }), false);
  assert.equal(shouldSpeak({ muted: false, synth, Utterance }), true);
  assert.equal(shouldSpeak({ muted: false, synth: null, Utterance }), false);
});

test("player speaks each caption on the advance path and cancels on end", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  assert.match(html, /function pickEnglishVoice/);
  assert.match(html, /function speakCaption/);
  assert.match(html, /function cancelSpeech/);
  assert.match(html, /SpeechSynthesisUtterance/);
  assert.match(html, /speechSynthesis/);
  assert.match(html, /synth\.cancel/);
  assert.match(html, /synth\.speak/);
  assert.match(html, /speakCaption\(lines\[i\]/);
  assert.match(html, /u\.onstart/);
  assert.match(html, /Promise\.all/);
  assert.match(html, /cancelSpeech\(\)/);
  assert.match(html, /pagehide/);
  assert.match(html, /google/i);
  assert.match(html, /en-GB/);
  assert.match(html, /function playCaptions/);
  assert.match(html, /narrationSource\(audioManifest, episode\.episode\)/);
  assert.match(html, /localStorage/);
  assert.match(html, /g0p-ai-mute/);
  assert.match(html, /id="mute-toggle"/);
  assert.match(html, /id="voice-picker"/);
  assert.match(html, /getVoices/);
  assert.match(html, /voiceschanged/);
  assert.match(html, /captionsEl\.textContent = lines\[i\]/);
  assert.match(html, /captions only/);
  assert.match(html, /audio\.muted = muted/);
  assert.match(html, /activeAudio\.muted = muted/);
  assert.doesNotMatch(html, /audio\/0006\.mp3/);
  assert.doesNotMatch(html, /elevenlabs/i);
  assert.doesNotMatch(html, /openai.*tts/i);
  const voiceHandler = html.slice(
    html.indexOf("voicePicker.addEventListener"),
    html.indexOf("attachVoicesChanged(window.speechSynthesis"),
  );
  assert.match(voiceHandler, /selectedVoiceURI/);
  assert.doesNotMatch(voiceHandler, /activeAudio/);
  assert.doesNotMatch(voiceHandler, /\.muted/);
  const speak = html.slice(html.indexOf("function speakCaption"), html.indexOf("function stopAudio"));
  assert.match(speak, /pickVoice\(/);
});
