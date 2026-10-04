# g0p.ai

Aesop ASCII theater. One episode on the field: click once, Geryon the crab morphs through a **fixed Aesop phase map**, captions run, the browser speaks.

Every fable uses the same seven parts — Hook, The Room, The Itch, The Turn, The Craft, The Moral, The Encore. Templates are shared (`spotlight`, `set`, `unease`, `breakthrough`, `scar`, `lesson`, `curtain`); only the imagery is unique. See [PHASES.md](PHASES.md).

## Now playing

Hub-approved public bank only. Episode **0005** is never listed.

- **0006 — The Ratchet That Never Turned** — source: [fuzzywigg.ai/aesop/the-ratchet-that-never-turned](https://www.fuzzywigg.ai/aesop/the-ratchet-that-never-turned). Script: `episodes/0006-the-ratchet-that-never-turned.txt`.

## Watch

1. Open the page. The stage is one monospace point grid: sea, kelp, sand, and glyph-food share it with the crab. A thin episode list (approved public entries only) sits top-left. A small HUD counts unlocked glyphs and bruise hues.
2. Click once. If `audio/manifest.json` lists this episode, narration plays from that file and captions lock to its cues. Web Speech is the fallback when the manifest has no entry, audio fails, or the listener is muted. Mute is remembered in `localStorage`. The voice picker still applies to the speech fallback.
3. Geryon starts small and nearly gray, built from `.` `:` `o`. He scuttles, eats drifting glyphs (each meal joins his shell), and picks up bruise colors when the world bumps him. The itch lodges a sand grain; he hardens a pearl around it. Craft and the moral are the molt: a larger shell, deeper water, richer feeding. The encore shades him with all 95 printable ASCII characters and the full bruise palette.
4. Scene changes flow on that same grid (cells drift and reform). Captions sit in a short band along the bottom. Speech and narration beats clap his claws. `prefers-reduced-motion` freezes the scuttle and the flow; the diet and the colors still advance with the phase. Never photos.

Hold a phase for a still: `?phase=hook&still=1&progress=0.2` (also `room`, `itch`, `turn`, `craft`, `moral`, `encore`). `?tour=1` walks the growth arc.

Apex `https://g0p.ai` already serves this theater (same body as the Vercel aliases). Aliases: `https://g0p-ai.vercel.app` · `https://g0p-aesop.vercel.app`. Formal DNS ownership remains a CoS/HITL note — see [CANON.md](CANON.md).

## Local

```bash
npm test
npx serve .
```
