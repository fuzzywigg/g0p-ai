# g0p.ai

Aesop ASCII theater. One episode on the field: click once, Geryon the crab morphs through the fable, captions run, the browser speaks.

## Now playing

**0006 — The Ratchet That Never Turned**

Approved public fable only. Source: [fuzzywigg.ai/aesop/the-ratchet-that-never-turned](https://www.fuzzywigg.ai/aesop/the-ratchet-that-never-turned). Script: `episodes/0006-the-ratchet-that-never-turned.txt`.

## Watch

1. Open the page. Black field, drifting white dots.
2. Click once. The dots gather into Geryon — a living ASCII crab — who scuttles and morphs through scene poses as the fable beats change.
3. [Geryon] captions scroll underneath; the browser speaks each line in sync (Web Speech API). No audio file. If speech isn’t available, captions still play.

No menus. No DNS cutover. Production alias: `https://g0p-ai.vercel.app` (not apex `g0p.ai`). Live twin while name settles: `https://g0p-aesop.vercel.app`.

## Local

```bash
npm test
npx serve .
```
