# g0p.ai

Aesop ASCII theater. One episode on the field: click once, Geryon the crab morphs through a **fixed Aesop phase map**, captions run, the browser speaks.

Every fable uses the same seven parts — Hook, The Room, The Itch, The Turn, The Craft, The Moral, The Encore. Templates are shared (`spotlight`, `set`, `unease`, `breakthrough`, `scar`, `lesson`, `curtain`); only the imagery is unique. See [PHASES.md](PHASES.md).

## Now playing

Hub-approved public bank only. Episode **0005** is never listed.

- **0006 — The Ratchet That Never Turned** — source: [fuzzywigg.ai/aesop/the-ratchet-that-never-turned](https://www.fuzzywigg.ai/aesop/the-ratchet-that-never-turned). Script: `episodes/0006-the-ratchet-that-never-turned.txt`.

## Watch

1. Open the page. A cool monospace sea drifts (braille specks, kelp, bubbles). A thin episode list (approved public entries only) sits top-left.
2. Click once. Geryon assembles as real ASCII: a shaded crab sampled from a shape (carapace, claws, legs, eye stalks) into a character grid. Edge cells pick line glyphs; the body picks a brightness ramp. He moves through the shared phase templates. The Turn is a race-car smash-through; the Encore is a curtain bow to an audience of crabs.
3. Color matures with the phase. Hook is near-monochrome and cool; room, itch, and turn add warmth, contrast, and a hue; craft hatches the shell; moral deepens the palette; encore is full color with a glow. The ink is on the characters.
4. Captions show the spoken text under the field. The browser speaks each line in sync (free Web Speech API only — no paid TTS). Mute is remembered in `localStorage`; pick a voice when `speechSynthesis.getVoices` reports any (including after `voiceschanged`). If speech is muted or unavailable, captions still play.

Speech beats still schedule the short dream-flash (utterance start, morph peak, Turn smash). On screen that beat is a claw click and glyph sparks, not a burst of dots. `prefers-reduced-motion` freezes the pose and skips the sparks; the palette still matures with the phase. Never photos.

Hold a phase for a still: `?phase=hook&still=1&progress=0.2` (also `room`, `itch`, `turn`, `craft`, `moral`, `encore`).

Apex `https://g0p.ai` already serves this theater (same body as the Vercel aliases). Aliases: `https://g0p-ai.vercel.app` · `https://g0p-aesop.vercel.app`. Formal DNS ownership remains a CoS/HITL note — see [CANON.md](CANON.md).

## Local

```bash
npm test
npx serve .
```
