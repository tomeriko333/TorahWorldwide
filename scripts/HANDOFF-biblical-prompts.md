# Handoff: Continuing Biblical Text-to-Image Prompts for the Torah Website

Paste this entire document as the first message of a new Claude Code session to continue the work.

---

## Mission

I'm building a Torah reader web app. The homepage has a rotating set of background images the user flips through with arrow buttons (bottom-right of the start page). I'm generating those backgrounds as 16:9 2K cinematic oil-painted biblical scenes via the muapi.ai API using the **Flux 2 Pro** model. Each scene is researched from the Hebrew Tanakh text and rendered with biblical + archaeological accuracy.

## Tech stack / where things live

- **Project root:** `C:\Users\tomer\OneDrive\שולחן העבודה\torah website project`
- **Generation script:** `C:\Users\tomer\gen_scene.py` (mirrored at `torah-reader/scripts/generate_imagen4_scenes.py`)
- **Output folder:** `C:\Users\tomer\OneDrive\שולחן העבודה\torah website project\photos\background start menue\`
- **Filename convention:** `<NN>-<slug>-flux-2-pro.jpg` (e.g. `02-burning-bush-flux-2-pro.jpg`)
- **muapi API base:** `https://api.muapi.ai/api/v1`
- **Model slug (locked in):** `flux-2-pro`

## API key — CRITICAL security note

My muapi API key was accidentally leaked in the previous chat. **I need to rotate it on the muapi.ai dashboard before continuing.** Once rotated:

1. Open PowerShell
2. Run: `$env:MUAPIAPP_API_KEY = "new-key"` (with the real key)
3. Leave that window open; run the generator in it

**Do not ask me to paste the key into chat.** Read it from the env var in PowerShell only.

## How to run

```powershell
# In PowerShell, with $env:MUAPIAPP_API_KEY set:
python C:\Users\tomer\gen_scene.py
```

This iterates `SCENES` and generates all of them. To poll an existing request_id without spending a new credit:

```powershell
python C:\Users\tomer\gen_scene.py <request_id> <filename.jpg>
```

## Scenes completed so far

| # | Slug | Verse | Status |
|---|------|-------|--------|
| 01 | `jacobs-ladder` | Gen 28:10-22 | Done (flux-2-pro + nano-banana-pro variants generated) |
| 02 | `burning-bush` | Ex 3:1-6 | Done (or in progress) |
| 03 | `akedah` | Gen 22:1-14 | Done (or in progress) |
| 04 | `splitting-sea` | Ex 14:19-24 | Done (or in progress) |

Before generating a new scene, check the output folder to confirm which files exist.

## Script structure

Open `C:\Users\tomer\gen_scene.py`. The part to edit is the `SCENES` list — each entry is:

```python
{
    "slug": "NN-some-name",
    "prompt": (REVERENCE + HEBREW_APPEARANCE + "... scene-specific prompt ..."),
}
```

`REVERENCE` and `HEBREW_APPEARANCE` are shared prefix constants. Every new scene reuses them verbatim — **don't** duplicate their content in the per-scene prompt.

## RULES — style

Every prompt is a **cinematic photorealistic oil painting in Rembrandt / Caravaggio chiaroscuro, crossed with a reverent biblical film still.** 16:9 widescreen, 2K. No exceptions.

## RULES — biblical accuracy (PESHAT ONLY)

I want accuracy to the Tanakh text itself. **Do NOT pull from:**

- Rashi, Ramban, or any medieval rabbinic commentary
- Midrash (Bereshit Rabbah, Tanchuma, Pirkei de-Rabbi Eliezer, etc.)
- Talmud
- Seder Olam Rabbah (no "Isaac was 37" type derivations)
- Halacha / Shulchan Aruch / any later legal code
- Christian typology or tradition
- Josephus (historical source but not the text)

**Do use:**

- The literal Hebrew Tanakh text and what it plainly says
- Archaeological evidence of what Bronze/Iron Age Semitic peoples looked like — the **Beni Hasan tomb paintings (c. 1900 BCE)** are the gold standard reference: Semitic men in patterned wool garments, full beards, long hair, leather sandals.

If the text is silent on a detail (e.g., Isaac's exact age), say so and pick a composition that the text permits. Don't invent a number.

## RULES — physical appearance of Hebrews (always include)

This is baked into the `HEBREW_APPEARANCE` constant in the script. Every prompt gets it.

- **Skin:** bronze / Middle-Eastern, not European
- **Men's hair:** long, uncut, past the shoulders, often tied back or covered by a simple wrapped wool head-cloth
- **Men's beards:** full, thick, uncut, reaching the chest
- **Women's hair:** long, uncut, covered with wool shawls
- **Garments:** coarse woven wool and linen in natural earth tones (dun, umber, cream, muted russet), sometimes simple woven patterns, belted with leather, rough leather sandals

**Forbidden on every Hebrew figure:**

- Shaved heads, tonsures, bald crown patches, shaved temples (that's Egyptian-priest / Canaanite-pagan styling — the Torah in Lev 19:27 sets Hebrews apart from exactly this)
- Short-trimmed beards, goatees, clean-shaven faces on mature men

(Egyptians in a scene *can* have shaved heads + kohl eye-paint + linen kilts — the visual contrast with Hebrews is meaningful. See `04-splitting-sea` prompt for this.)

## RULES — face / viewpoint

Primary: **back-turned composition** (Caspar David Friedrich "looking with" the figure, not "at" the figure). Vary tastefully per image so the set doesn't feel monotone:

- Mostly straight from behind
- Sometimes 3/4 angle from behind-side (partial cheek / beard silhouette visible)
- Sometimes silhouette at distance (small figure in vast landscape, face irrelevant)
- Occasional dim face glimpsed in firelight or divine glow — but never a full straight-on portrait

## RULES — composition & UI

- **16:9 horizontal**, 2K
- **Bottom-right quiet** — no critical detail there, leaves room for the UI arrow button
- Reverent framing — sacred distance, never voyeuristic

## RULES — divine presence

Toned-down, believable, never Harry-Potter mystical.

- **Never depict God's face, body, or throne** — any figure "in the clouds" is forbidden
- **Angels** are restrained human-looking luminous figures — no wings, no halos, no glowing white fantasy robes
- **Divine light** = warm golden radiance at a source (top of a ladder, inside a bush, a shaft from heaven), NOT sparkles or lightning
- A **burning bush** is a real thorny bramble on fire but not consumed — not a glowing magical tree
- A **pillar of cloud/fire** is swirling cumulus with an inner orange fire — not a humanoid giant

## The reverence clause (goes at the top of every prompt)

Every prompt opens with the `REVERENCE` constant:

> "A sacred, reverent depiction of a holy moment from the Tanakh. Every figure rendered with dignity and gravitas — never trivial, cartoonish, or irreverent. Cinematic photorealistic oil painting, Rembrandt / Caravaggio chiaroscuro crossed with a reverent biblical film still. 16:9 widescreen, 2K resolution."

## RULES — forbidden elements (in every prompt's "FORBIDDEN" block)

- Shaved heads / tonsures / bald crown patches on Hebrews
- Short-trimmed or clean-shaven Hebrew men
- Winged angels, halos, glowing white fantasy robes
- Floating Hebrew letters, magical sparkles
- Any depiction of God's face / body / throne
- European / Renaissance / medieval costume or faces
- Young handsome Hollywood Moses / Charlton-Heston styling
- Feeble, meek, weak-looking patriarchs — they must be dignified and commanding even in old age
- Anachronistic symbols — Star of David, rabbinic tallit stripes, etc. (not of the era)
- Christian cross composition
- Cartoon or illustration style, pastel colors
- Horror-movie gore or blood emphasis
- Hollywood blue-green CGI water, cartoon fish

## Scene queue — ideas to work through next

Propose a scene, research it in the Tanakh (verse citations), draft the prompt, show me for approval, then generate. Iconic candidates still unmade:

- `05-creation-light` — Gen 1:1-3 (separation of light and darkness over the deep)
- `06-noah-dove-olive` — Gen 8:8-12 (dove returning with olive leaf)
- `07-tower-of-babel` — Gen 11:1-9 (the half-built ziggurat, the moment of confusion)
- `08-joseph-sold` or `joseph-reunited` — Gen 37 / Gen 45
- `09-moses-sinai` — Ex 19:16-20 (thunder, lightning, cloud, trumpet, Moses ascending)
- `10-david-goliath` — 1 Sam 17 (Valley of Elah, young David with sling)
- `11-elijah-chariot` — 2 Kings 2:11 (whirlwind, chariot of fire, mantle falling to Elisha)
- `12-jonah-fish` — Jonah 1:17 / 2:10 (in the deep, or being cast up on the shore)
- `13-daniel-lions` — Dan 6 (the den, sealed stone)
- `14-isaiah-vision` — Isa 6:1-4 (the seraphim, temple filling with smoke — hard to do toned-down, may need careful prompting)
- `15-exodus-passover` — Ex 12 (night of the plague, blood on the doorposts, families eating in haste)
- `16-manna` — Ex 16 (gathering in the desert morning)
- `17-rebekah-well` — Gen 24 (the servant finds Rebekah at the well in Haran)

## Process per new scene

1. **Pick a scene** (I approve or pick from the list).
2. **Research in the Tanakh** — get the verse citations, note the specific textual details (location, time of day, who's present, what they're doing, what props).
3. **Draft the prompt** using the pattern of the existing `SCENES` in the script: `REVERENCE + HEBREW_APPEARANCE + scene-specific content + FORBIDDEN block`.
4. **Show me the prompt** for approval before running.
5. **Add it to `SCENES`** in the script, push it to `C:\Users\tomer\gen_scene.py`.
6. **I'll run it in PowerShell** with the env var set.
7. **I'll review the image** and tell you what's wrong. You fix and re-run.

## Known issues / notes

- **Google Imagen 4 family** (ultra, regular, fast) is currently broken on muapi — returns "Internal Error". Don't try to use it. Flux 2 Pro is the reliable workhorse.
- **Midjourney v7** slug exists on muapi but returned "Unknown error" when we tried it — skip unless they fix it.
- **Seedream v5.0** returned 404 on my account — may be beta-locked. `bytedance-seedream-v4.5` might work if we need a backup.
- **Nano Banana Pro** (`nano-banana-pro`) does work as a fallback model, good for cross-check variants.
- Flux 2 Pro typically completes in 30-90 seconds. If polling goes >3 min, something's off.
- The generation script has a recovery mode — pass a `request_id` as argv[1] and a filename as argv[2] to poll an existing job without re-submitting.

## Script's current state (for reference)

```python
# top of gen_scene.py
SLUG = "flux-2-pro"
OUT_DIR = Path(r"C:\Users\tomer\OneDrive\שולחן העבודה\torah website project\photos\background start menue")

REVERENCE = "A sacred, reverent depiction..."  # (see script)
HEBREW_APPEARANCE = "Hebrew figures are Semitic..."  # (see script)

SCENES = [
    {"slug": "02-burning-bush",  "prompt": REVERENCE + HEBREW_APPEARANCE + "..."},
    {"slug": "03-akedah",        "prompt": REVERENCE + HEBREW_APPEARANCE + "..."},
    {"slug": "04-splitting-sea", "prompt": REVERENCE + HEBREW_APPEARANCE + "..."},
]
```

Open the file to see the full existing prompts as templates.

---

**When you start**, first: (1) read `C:\Users\tomer\gen_scene.py` so you understand the current SCENES / constants / flow, (2) check the output folder to see what's already generated, (3) ask me which scene to do next and whether I want you to propose one from the queue above.

Stick to peshat. No halacha. Be respectful to God and to our forefathers.
