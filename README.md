# g0p.ai

Aesop ASCII theater. One episode on the field: click once, Geryon the crab morphs through a **fixed Aesop phase map**, captions run, the browser speaks.

Every fable uses the same seven parts — Hook, The Room, The Itch, The Turn, The Craft, The Moral, The Encore. Templates are shared (spotlight, set, race-through, curtain bow); only the imagery is unique. See [PHASES.md](PHASES.md).

## Now playing

**0006 — The Ratchet That Never Turned**

Approved public fable only. Source: [fuzzywigg.ai/aesop/the-ratchet-that-never-turned](https://www.fuzzywigg.ai/aesop/the-ratchet-that-never-turned). Script: `episodes/0006-the-ratchet-that-never-turned.txt`.

## Watch

1. Open the page. Black field, drifting white dots.
2. Click once. The dots gather into Geryon — a living ASCII crab — who scuttles through the shared phase templates. The Turn is a race-car smash-through; the Encore is a curtain bow to an audience of crabs.
3. [Geryon] captions scroll underneath; the browser speaks each line in sync (Web Speech API). No audio file. If speech isn’t available, captions still play. Occasional dream-flashes — dense colored glyph-particle bursts, 8–36ms — lock to utterance start (caption reveal if speech is off), a late softened morph-peak, and the Turn smash, then dissolve back into the crab. Sparse emoji-space stamps (spark, bolt, smash, scales, florette) ride the same arcs. Never photos. `prefers-reduced-motion` skips them.

No menus. No DNS cutover. Production alias: `https://g0p-ai.vercel.app` (not apex `g0p.ai`). Live twin while name settles: `https://g0p-aesop.vercel.app`.

## Local

```bash
npm test
npx serve .
```
