"""
Generate biblically accurate Torah scenes via MuAPI using Flux 2 Pro.

Usage (Windows PowerShell):
    $env:MUAPIAPP_API_KEY = "your-real-key"
    python C:\\Users\\tomer\\gen_scene.py

All scenes are rendered at 16:9. Output:
    photos/background start menue/<NN-slug>-flux-2-pro.jpg

To re-poll an already-submitted request by id:
    python gen_scene.py <request_id> <output_filename.jpg>
"""

import os
import sys
import time
import requests
from pathlib import Path

API_BASE = "https://api.muapi.ai/api/v1"
SLUG = "flux-2-pro"

OUT_DIR = Path(r"C:\Users\tomer\OneDrive\שולחן העבודה\torah website project\photos\background start menue")


# =============================================================================
# SCENES — each entry generates one image. Prompts are grounded in Biblical
# Hebrew text with rabbinic commentary for period-accurate details.
# =============================================================================

REVERENCE = (
    "A sacred, reverent depiction of a holy moment from the Tanakh. Every "
    "figure rendered with dignity and gravitas — never trivial, cartoonish, "
    "or irreverent. Cinematic photorealistic oil painting, Rembrandt / "
    "Caravaggio chiaroscuro crossed with a reverent biblical film still. "
    "16:9 widescreen, 2K resolution. "
)

# Physical/ethnographic constants — the Hebrews as the Tanakh + Bronze/Iron
# Age archaeological record (Beni Hasan tomb paintings, c. 1900 BCE Semitic
# peoples) describe them. Folded into every scene.
HEBREW_APPEARANCE = (
    "Hebrew figures are Semitic — bronze skin, Middle-Eastern features. Men "
    "have LONG UNCUT HAIR past the shoulders, often tied back or covered by "
    "a simple wrapped wool head-cloth, and FULL THICK UNCUT BEARDS reaching "
    "the chest. Women have long uncut hair covered by wool shawls. NO "
    "FIGURE has a shaved head, tonsure, bald crown patch, shaved temples, "
    "or Egyptian-priest haircut. NO Hebrew man has a short-trimmed beard "
    "or a clean-shaven face. Garments are coarse woven wool and linen in "
    "natural earth tones (dun, umber, cream, muted russet) — sometimes "
    "with simple woven patterns — belted with leather, worn over simple "
    "tunics, with rough leather sandals. "
)

SCENES = [
    {
        "slug": "02-burning-bush",
        "prompt": (
            REVERENCE + HEBREW_APPEARANCE +
            "Subject: Moses at the burning bush (Exodus 3). "
            "Moses is a towering commanding Hebrew patriarch of about eighty "
            "years — imposing, upright, shoulders broad, weathered bronze "
            "skin deeply lined by forty years in the Midianite wilderness. "
            "His presence fills the frame with the quiet authority of a man "
            "who once stood in the courts of Pharaoh and now walks with God. "
            "Long iron-gray hair past his shoulders, bound by a simple "
            "undyed wool head-cloth; a full thick gray-white beard to his "
            "chest. His eyes — glimpsed in three-quarter from our back "
            "angle — are piercing, intelligent, alive with wisdom. He wears "
            "a coarse woven wool mantle over a plain tunic, rough leather "
            "belt, his free hand gripping a wooden shepherd's staff, his "
            "other hand just beginning to reach down to unfasten a sandal "
            "strap. He stands dignified — not meek, not frail. "
            "Middle-to-right foreground: a low thorny desert bramble (the "
            "s'neh) with gnarled dark branches, engulfed in calm steady "
            "honey-gold and deep-orange flame — yet the thorns and twigs "
            "visible through the fire are not blackening or crumbling. The "
            "flame is unnaturally contained, perfectly still, radiating a "
            "soft inner light rather than raging outward. "
            "CRITICAL COMPOSITION RULE: there is a clear, direct, unbroken "
            "sightline between Moses's eyes and the burning bush. NOTHING "
            "— no sheep, no rock, no branch — stands between them. Moses's "
            "gaze meets the fire. "
            "The flock: three or four sheep positioned well off to the "
            "LEFT, in the middle distance at the foot of a boulder, "
            "grazing on sparse scrub. They are a quiet detail, not a "
            "subject, and NONE of them is between Moses and the bush. "
            "Background: the stark slopes of Har Horeb, ancient granite and "
            "limestone ridges in muted dun and ochre, desolate Midianite "
            "desert extending into heat haze. High cirrus catching "
            "golden-hour sun. "
            "Lighting: (1) warm amber-gold from the bush onto Moses's "
            "mantle, beard, and the rocks between him and the flame; (2) "
            "cool late-afternoon sidelight from the west painting distant "
            "peaks pale gold. Deep Rembrandt shadows in the lee of rocks. "
            "Palette: pale dune ochre, honey-gold fire, weathered stone "
            "gray, muted umber and natural wool cream. "
            "Viewpoint: three-quarter back angle, slightly above Moses — we "
            "see his broad shoulders, the silhouette of his beard against "
            "the firelight, and the sacred bush he turns toward. Reverent "
            "witness, sacred distance. "
            "The divine presence is NOT depicted as a figure. Only the "
            "unnatural steady flame in the bush suggests it. "
            "Texture: subtle oil brushwork in sky and distant peaks; "
            "photorealistic precision on weathered skin, woven wool, beard "
            "hair, the intricate thorns of the bush. "
            "Bottom-right compositionally quiet for UI overlay. "
            "FORBIDDEN (critical): "
            "any figure, sheep, or object between Moses and the bush; "
            "shaved heads, tonsures, bald crown patches, shaved temples; "
            "short-trimmed or clean-shaven Hebrew men; "
            "a meek, feeble, or weak Moses (he must be imposing); "
            "a young handsome Moses or an Egyptian-prince Moses; "
            "winged angels, halos, glowing fantasy robes; "
            "floating Hebrew letters, magical sparkles; "
            "any depiction of God's face, body, or throne; "
            "European / Renaissance / medieval costume or faces; "
            "a tall tree (must be a LOW thorny bush); "
            "blue or rainbow fire, cartoon flames; "
            "any cartoon, illustration, or irreverent treatment."
        ),
    },
    {
        "slug": "03-akedah",
        "prompt": (
            REVERENCE + HEBREW_APPEARANCE +
            "Subject: The Akedah — the binding of Isaac (Genesis 22). Atop "
            "the rocky summit of Har Moriah, the suspended heartbeat before "
            "the blade descends. "
            "Abraham: an aged but towering Hebrew patriarch — upright, "
            "dignified, shoulders broad despite advanced years, a man of "
            "commanding covenant-bearing presence. Deeply weathered bronze "
            "skin. Long snow-white hair past his shoulders, partly covered "
            "by a simple undyed wool head-cloth; a full thick snow-white "
            "beard reaching his chest. A coarse woven wool mantle in "
            "natural cream over a tunic. His arm is raised overhead "
            "gripping an ancient bronze slaughter knife, caught in the "
            "precise instant before descending. His face, seen in three-"
            "quarter from behind, is half-turned toward the sky — not rage, "
            "not horror, but torn grief and trembling faithful obedience. "
            "His other hand rests on his son's bound shoulder, a father's "
            "last touch. "
            "Isaac: a young Hebrew man — the text calls him na'ar, old "
            "enough to have carried the wood up the mountain himself. A "
            "first beard is beginning on an otherwise smooth face; long "
            "dark uncut hair flows behind him on the wood. Torso bare "
            "above a linen loincloth, outer robe laid beneath him on the "
            "stacked wood as a cushion. He lies bound atop the altar with "
            "simple hemp rope at wrist and ankle, eyes closed in peaceful "
            "acceptance and trust — not terror. "
            "The altar: unhewn stones hand-piled by Abraham, wood stacked "
            "in careful order upon them. "
            "The ram: behind Abraham in a thicket of gnarled dry desert "
            "shrubs, a shaggy horned ram caught by its thick curled horns "
            "in the tangled branches, eyes calm — only partly visible "
            "through the brush, a detail the viewer discovers on second "
            "look ('achar' — behind him, per the text). "
            "Background: the barren summit of Moriah, pale limestone and "
            "weathered rock, descending slopes falling to heat-hazed hills. "
            "Far lower-right: the silhouette of the ancient walled town of "
            "Salem on a distant ridge. "
            "Sky: pre-dawn — deep cobalt overhead transitioning through "
            "smoky rose to pale gold at the eastern horizon — with one "
            "dramatic shaft of cold silver light breaking through a high "
            "cloud and striking Abraham's raised hand directly. This "
            "silver shaft IS the moment of divine intervention — no angel "
            "figure, no humanoid in the clouds, only light. "
            "Lighting: (1) the silver heaven-shaft arresting the blade; "
            "(2) warm ember-gold from a small brazier-fire on the altar "
            "casting low light onto Isaac's serene face and Abraham's "
            "beard. Deep Caravaggio blacks in the shadowed rocks. "
            "Palette: pale bone-white stone, deep cobalt sky, cold silver "
            "divine light, warm ember-gold at the altar. "
            "Viewpoint: three-quarter back angle, slightly beside Abraham "
            "— we see the back of his head, his raised arm and knife, the "
            "bound son below, the ram in the thicket. Sacred distance. "
            "Texture: subtle oil brushwork in sky and distance; "
            "photorealistic precision on weathered skin, serene face, stone "
            "altar, stacked wood, bronze knife patina, gnarled branches, "
            "wool and linen fabric. "
            "Bottom-right compositionally quiet for UI overlay. "
            "FORBIDDEN (critical): "
            "shaved heads, tonsures, bald crown patches; "
            "short-trimmed or clean-shaven Hebrew men; "
            "Isaac as a small terrified child (he is a young man, strong); "
            "Abraham looking weak, feeble, or confused (he is dignified "
            "and powerful even in grief); "
            "horror-movie composition, blood emphasis, gore; "
            "a sword or long dagger (must be a short bronze slaughter "
            "knife); "
            "winged angels, halos, glowing fantasy robes, a humanoid "
            "figure in the clouds; "
            "any depiction of God's face or body; "
            "European / Renaissance / medieval costume or faces; "
            "Christian cross composition; "
            "cartoon or illustration style, pastel colors; "
            "any irreverent or trivial treatment."
        ),
    },
    {
        "slug": "04-splitting-sea",
        "prompt": (
            REVERENCE + HEBREW_APPEARANCE +
            "Subject: The splitting of Yam Suph — the Sea of Reeds "
            "(Exodus 14). A breathtaking wide shot from a slightly "
            "elevated three-quarter back angle, looking along the dry "
            "corridor carved through the parted sea. Before us: a vast "
            "procession of the children of Israel — thousands of figures "
            "extending into the distance. "
            "The Hebrews walk in dignified sacred awe, not panic — they "
            "have just been redeemed. Men carry wooden walking staves; "
            "women balance earthenware water-jars on their shoulders and "
            "heads; elders lean on staves; children ride on parents' hips "
            "or walk holding hands; shepherds drive dense flocks of "
            "Palestinian-breed sheep and goats; weary donkeys bear tent-"
            "poles and rolled bundles. EVERY Hebrew man has the full "
            "uncut beard and long uncut hair (often under a head-cloth) "
            "described above. NO figure has a shaved head, tonsure, or "
            "bald crown. They are Hebrews, not Egyptians. "
            "They walk on dark damp sand and exposed seabed strewn with "
            "kelp, shells, startled fish. To the left and right rise two "
            "enormous vertical walls of dark translucent water reaching "
            "hundreds of feet high — suspended fish and sea fronds dimly "
            "visible within, held motionless as if time has stopped. The "
            "tops curl slightly inward, catching moonlight. "
            "At the far rear of the procession, a small but commanding "
            "silhouetted figure at lower-left: Moses — an eighty-year-old "
            "Hebrew prophet, upright and powerful, long iron-gray hair "
            "under a simple wool head-cloth, thick full gray-white beard "
            "to his chest, a coarse wool mantle. His right arm raised "
            "horizontally with his wooden staff held out over the sea — "
            "the commanding gesture of a prophet at the height of his "
            "authority. Seen only from behind, a small figure with immense "
            "purpose. NOT tired, NOT feeble. "
            "Behind Moses, at the entrance of the corridor: the massive "
            "Pillar of Cloud (Ex 14:19-20), a towering column of swirling "
            "dark cumulus from seabed to heaven, its underside glowing "
            "warm orange from an inner fire, its far side (facing Egypt) "
            "deeper black. Faintly visible beyond the pillar: silhouettes "
            "of pursuing Egyptian chariots and horsemen — and the "
            "Egyptians, by contrast, DO have the shaved heads, kohl eye-"
            "paint, and linen kilts of their culture (the visual opposite "
            "of the Hebrews) — reduced to small dark shapes swallowed by "
            "the pillar's shadow. "
            "Sky: pre-dawn 'morning watch' (Ex 14:24) — deep navy overhead "
            "through smoky indigo to pale rose and pale gold on the "
            "eastern horizon ahead. A few stars still high up. First hint "
            "of dawn at the far end of the corridor. "
            "Lighting: (1) cool silver moonlight on the tops of the water "
            "walls; (2) warm amber firelight from the Pillar of Cloud "
            "painting the backs of the Hebrews; (3) pale dawn ahead. "
            "Deep Rembrandt blacks in the pillar's shadow on the Egyptian "
            "side. "
            "Palette: deep navy and indigo sky, silver moonlit water, "
            "warm amber pillar-fire, pale dawn gold, muted earth tones in "
            "wool garments, wet black sand. "
            "Viewpoint: slightly elevated, behind the procession, looking "
            "forward and slightly down. Reverent witness — we walk with "
            "them. "
            "Texture: subtle oil brushwork in sky and atmosphere; "
            "photorealistic precision on water walls, individual figures, "
            "sheep wool, wet sand, fish scales, wood grain, fabric weave. "
            "Bottom-right compositionally quiet for UI overlay. "
            "FORBIDDEN (critical): "
            "shaved heads, tonsures, bald crown patches on ANY Hebrew "
            "figure; "
            "short-trimmed or clean-shaven Hebrew men; "
            "a young handsome Hollywood Moses — he is eighty, imposing "
            "and dignified; "
            "a feeble, tired, weak Moses; "
            "Hollywood blue-green CGI water, cartoon fish, stylized "
            "single waves; "
            "anachronistic Stars of David, Hebrew banners, rabbinic "
            "tallit stripes; "
            "winged angels, halos, glowing white fantasy robes; "
            "the Pillar of Cloud as a humanoid figure or glowing giant; "
            "any depiction of God's face or body; "
            "European / Renaissance / medieval costume or faces; "
            "magical lightning bolts, fantasy-film effects; "
            "any cartoon, illustration, or irreverent treatment."
        ),
    },
]


def die(msg: str) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def submit(prompt: str, headers: dict) -> tuple[str, dict]:
    """Submit a generation job to flux-2-pro. Returns (request_id, submit_body)."""
    payload = {
        "prompt": prompt,
        "aspect_ratio": "16:9",
        "num_images": 1,
        "seed": -1,
    }
    url = f"{API_BASE}/{SLUG}"
    r = requests.post(
        url,
        headers={**headers, "Content-Type": "application/json"},
        json=payload,
        timeout=60,
    )
    if r.status_code != 200:
        die(f"submit failed {r.status_code}: {r.text[:300]}")
    body = r.json()
    req_id = (
        body.get("request_id")
        or body.get("requestId")
        or body.get("data", {}).get("request_id")
    )
    if not req_id:
        die(f"no request_id in submit response: {body}")
    return req_id, body


def poll_and_download(req_id: str, headers: dict, out_file: Path) -> None:
    """Poll muapi until the job completes, then download the result image."""
    poll_url = f"{API_BASE}/predictions/{req_id}/result"
    print(f"[*] polling {poll_url}", flush=True)
    deadline = time.time() + 900
    poll_count = 0
    result_url = None
    while time.time() < deadline:
        poll_count += 1
        try:
            r = requests.get(poll_url, headers=headers, timeout=30)
        except requests.RequestException:
            time.sleep(3)
            continue

        if r.status_code not in (200, 400):
            time.sleep(3)
            continue

        try:
            parsed = r.json()
        except Exception:
            time.sleep(3)
            continue

        if isinstance(parsed.get("detail"), dict):
            parsed = parsed["detail"]

        status = (parsed.get("status") or "").lower()
        err = parsed.get("error")
        outputs = parsed.get("outputs") or []

        if poll_count % 10 == 1:
            print(f"    status={status!r}", flush=True)
        else:
            print(f"    status={status}", flush=True)

        if status in ("success", "succeeded", "completed", "done") and outputs:
            first = outputs[0]
            result_url = first.get("url") if isinstance(first, dict) else first
            break
        if status in ("failed", "error") or err:
            die(f"job failed: {err or status}")
        time.sleep(3)

    if not result_url:
        die("timed out waiting for result (15 min)")

    print(f"[*] downloading {result_url}", flush=True)
    r = requests.get(result_url, timeout=180)
    if r.status_code != 200:
        die(f"download failed {r.status_code}")
    out_file.write_bytes(r.content)
    print(f"DONE. Saved {out_file} ({len(r.content):,} bytes)", flush=True)


def main() -> None:
    key = os.environ.get("MUAPIAPP_API_KEY")
    if not key:
        die("MUAPIAPP_API_KEY env var not set. In PowerShell: $env:MUAPIAPP_API_KEY = \"your-key\"")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    headers = {"x-api-key": key}

    # Mode: recover an existing request_id (no new submission, no new credit).
    if len(sys.argv) >= 3:
        req_id = sys.argv[1].strip()
        out_file = OUT_DIR / sys.argv[2]
        print(f"[*] Polling existing request_id={req_id} -> {out_file}", flush=True)
        poll_and_download(req_id, headers, out_file)
        return

    # Mode: run all SCENES against flux-2-pro.
    summary = []
    for scene in SCENES:
        name = scene["slug"]
        print(f"\n========== {name} ==========", flush=True)
        out_file = OUT_DIR / f"{name}-flux-2-pro.jpg"
        try:
            req_id, _ = submit(scene["prompt"], headers)
            print(f"[+] submitted. request_id={req_id}", flush=True)
            poll_and_download(req_id, headers, out_file)
            summary.append((name, "ok", str(out_file)))
        except SystemExit as e:
            print(f"[x] {name}: {e}", flush=True)
            summary.append((name, "failed", None))

    print("\n========== SUMMARY ==========", flush=True)
    for name, status, path in summary:
        print(f"  {name:25s} -> {status}" + (f"  [{path}]" if path else ""), flush=True)


if __name__ == "__main__":
    main()
