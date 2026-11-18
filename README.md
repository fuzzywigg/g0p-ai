# g0p.ai

Aesop ASCII theater. Pick a hub-approved fable: click once, Geryon the crab morphs through a **fixed Aesop phase map**, captions run, narration plays.

Every fable uses the same seven parts — Hook, The Room, The Itch, The Turn, The Craft, The Moral, The Encore. Templates are shared (`spotlight`, `set`, `unease`, `breakthrough`, `scar`, `lesson`, `curtain`); only the imagery is unique. See [PHASES.md](PHASES.md).

## Now playing

Hub-approved public bank only. The menu shows viewer numbers `01`–`20`. Storage ids stay on the episode files, the fable paint, and `audio/manifest.json`, so existing audio paths keep working. `audio/manifest.json` is keyed in the same order as the menu.

Viewer order sorts the storage id's integer ascending. A four-digit id sorts before a provisional `pNN` when that integer matches (`0010` before `p10`). The viewer number is the rank in that list, not a new fable number.

`0006` is the original hub episode. [PR #25](https://github.com/fuzzywigg/g0p-ai/pull/25) and [PR #26](https://github.com/fuzzywigg/g0p-ai/pull/26) added the rest. Those waves used provisional `pNN` ids, assigned by upload order, when the narration did not speak a number. `0008` and `0010` kept four-digit ids because the narration spoke them.

Episode **0005** is never listed. The Aesop content bank marks that number private and `do_not_publish` (a family piece). That is a different id from `p05`.

`p05`, `p06`, and `p08` have no script, no audio, no manifest entry. Neither wave included them, and neither PR says why those upload slots were left out. Nothing is shown for them.

- **01 — The Key That Fits the Lock** — storage `p01` — `episodes/p01-the-key-that-fits-the-lock.txt`
- **02 — The Call That Couldn't Write Yet** — storage `p02` — `episodes/p02-the-call-that-couldn-t-write-yet.txt`
- **03 — The Key That Wasn't Supposed to Write** — storage `p03` — `episodes/p03-the-key-that-wasn-t-supposed-to-write.txt`
- **04 — The Bandit That Learned Their Names** — storage `p04` — `episodes/p04-the-bandit-that-learned-their-names.txt`
- **05 — The Ratchet That Never Turned** — storage `0006` — source: [fuzzywigg.ai/aesop/the-ratchet-that-never-turned](https://www.fuzzywigg.ai/aesop/the-ratchet-that-never-turned). Script: `episodes/0006-the-ratchet-that-never-turned.txt`.
- **06 — The GPU Whisper in the WSL Walls** — storage `p07` — `episodes/p07-the-gpu-whisper-in-the-wsl-walls.txt`
- **07 — The Mouth Measurement** — storage `0008` — `episodes/0008-the-mouth-measurement.txt`
- **08 — The Doctor's Order** — storage `p09` — `episodes/p09-the-doctor-s-order.txt`
- **09 — The Night We Tamed the Beast** — storage `0010` — `episodes/0010-the-night-we-tamed-the-beast.txt`
- **10 — The Backup That Came Back** — storage `p10` — `episodes/p10-the-backup-that-came-back.txt`
- **11 — The Porsche Deal Hunter Trigger** — storage `p11` — `episodes/p11-the-porsche-deal-hunter-trigger.txt`
- **12 — The Loom That Faltered at Dawn** — storage `p12` — `episodes/p12-the-loom-that-faltered-at-dawn.txt`
- **13 — The Tidal Keeper's Vigil** — storage `p13` — `episodes/p13-the-tidal-keeper-s-vigil.txt`
- **14 — The Image Tides Echo** — storage `p14` — `episodes/p14-the-image-tides-echo.txt`
- **15 — The Steward's First Stumble** — storage `p15` — `episodes/p15-the-stewards-first-stumble.txt`
- **16 — The Report That Didn't Come** — storage `p16` — `episodes/p16-the-report-that-didn-t-come.txt`
- **17 — PR Source Failure Signature Changed** — storage `p17` — `episodes/p17-pr-source-failure-signature-changed.txt`
- **18 — The Three Silent Watchers** — storage `p18` — `episodes/p18-the-three-silent-watchers.txt`
- **19 — The Three Quiet Alarms** — storage `p19` — `episodes/p19-the-three-quiet-alarms.txt`
- **20 — The Farm's Silent Review** — storage `p20` — `episodes/p20-the-farm-s-silent-review.txt`

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
