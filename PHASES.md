# Aesop phase map

Every g0p.ai fable uses the same seven `---` sections, in this order. Templates (how Geryon the crab moves through the theater) are shared. Only the **imagery** — wall copy, badges, encore title — is unique to that episode.

Source of truth: `js/phases.mjs`. 0006 paint: `js/fables/0006.mjs`. Composer: `js/tableaux.mjs`.

| # | `phase:` | Title | Template | Frames | Motion |
|---|----------|-------|----------|--------|--------|
| 1 | `hook` | Hook | `spotlight` | 1 | Crab steps into the light with the epigraph. |
| 2 | `room` | The Room | `set` | 1 | The world as it seemed — Geryon on the set. |
| 3 | `itch` | The Itch | `unease` | 1 | Something is one off. The crab notices. |
| 4 | `turn` | The Turn | `breakthrough` | 2 | Race-car at the false picture, then smash through into the true one. Split after the first caption of the section. |
| 5 | `craft` | The Craft | `scar` | 1 | The concrete scar — the work, the retract. |
| 6 | `moral` | The Moral | `lesson` | 1 | Geryon holds the portable rule. |
| 7 | `encore` | The Encore | `curtain` | 2 | Side-stage entrance in front of a curtain, then a bow to an audience of crabs. Last two captions are the bow. |

These headings are the ones on the public Aesop pages (Room / Itch / Turn / Craft / Moral / Encore) plus the cold-open Hook.

## Episode file

```
episode: 0007
title: …
---

phase: hook

[Geryon] …

---

phase: room
…
```

`---` order **is** the phase map. The `phase:` key is required in spirit and checked against the enum.

## New fable

1. Add `episodes/<id>-….txt` with seven sections labeled `phase: hook` … `phase: encore`.
2. Add `js/fables/<id>.mjs` exporting `{ episode, title, imagery }` keyed by those phase ids. For `turn`, set `approach` and `breakthrough` walls (and `burst` copy for the smash frame). For `encore`, set `title` and `footer`.
3. Point the player at that imagery (`FABLE_IMAGERY` in `index.html`, keep in sync) and embed the episode source.
4. Geryon stays the crab. Browser `speechSynthesis` still speaks each caption on the same click.

Preview ASCII:

```bash
node scripts/preview-phases.mjs
```
