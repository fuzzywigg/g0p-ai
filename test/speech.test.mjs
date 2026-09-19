import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  canSpeak,
  cancelSpeech,
  pickEnglishVoice,
  speakWithSynthesis,
  speechFallbackMs,
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

test("player speaks each caption on the advance path and cancels on end", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  assert.match(html, /function pickEnglishVoice/);
  assert.match(html, /function speakCaption/);
  assert.match(html, /function cancelSpeech/);
  assert.match(html, /SpeechSynthesisUtterance/);
  assert.match(html, /speechSynthesis/);
  assert.match(html, /synth\.cancel/);
  assert.match(html, /synth\.speak/);
  assert.match(html, /speakCaption\(lines\[i\]\)/);
  assert.match(html, /Promise\.all/);
  assert.match(html, /cancelSpeech\(\)/);
  assert.match(html, /pagehide/);
  assert.match(html, /google/i);
  assert.match(html, /en-GB/);
  assert.doesNotMatch(html, /\.mp3/);
});
