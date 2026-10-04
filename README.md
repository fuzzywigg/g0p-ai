# g0p.ai

Aesop ASCII theater. One episode on the field: click once, Geryon the crab morphs through a **fixed Aesop phase map**, captions run, the browser speaks.

Every fable uses the same seven parts — Hook, The Room, The Itch, The Turn, The Craft, The Moral, The Encore. Templates are shared (`spotlight`, `set`, `unease`, `breakthrough`, `scar`, `lesson`, `curtain`); only the imagery is unique. See [PHASES.md](PHASES.md).

## Now playing

Hub-approved public bank only. Episode **0005** is never listed.

- **0006 — The Ratchet That Never Turned** — source: [fuzzywigg.ai/aesop/the-ratchet-that-never-turned](https://www.fuzzywigg.ai/aesop/the-ratchet-that-never-turned). Script: `episodes/0006-the-ratchet-that-never-turned.txt`.

## Watch

1. Open the page. Black field, drifting white dots. A thin episode list (approved public entries only) sits top-left.
2. Click once. The dots gather into Geryon — a living ASCII crab — who scuttles through the shared phase templates. The Turn is a race-car smash-through; the Encore is a curtain bow to an audience of crabs.
3. Captions show the spoken text under the field. The browser speaks each line in sync (free Web Speech API only — no paid TTS). Mute is remembered in `localStorage`; pick a voice when `speechSynthesis.getVoices` reports any (including after `voiceschanged`). If speech is muted or unavailable, captions still play.

Occasional dream-flashes — dense colored glyph-particle bursts, 8–36ms — lock to utterance start (caption reveal if speech is off), a late softened morph-peak, and the Turn smash, then dissolve back into the crab. During that window the arcs run hot (HSL sat 92–100, light 68–92) and snap back to the cool white crab. Sparse emoji-space stamps (spark, bolt, smash, scales, florette) ride the same arcs. Never photos. `prefers-reduced-motion` skips them.

Apex `https://g0p.ai` already serves this theater (same body as the Vercel aliases). Aliases: `https://g0p-ai.vercel.app` · `https://g0p-aesop.vercel.app`. Formal DNS ownership remains a CoS/HITL note — see [CANON.md](CANON.md).

## Local

```bash
npm test
npx serve .
```
