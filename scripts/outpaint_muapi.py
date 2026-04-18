"""
Outpaint home-bg-padded-for-ai.png via MuAPI (Flux Kontext Pro by default).

Usage:
    # 1. Put your key in an env var (never paste in chat / git):
    export MUAPIAPP_API_KEY=your_key_here     # macOS/Linux
    set MUAPIAPP_API_KEY=your_key_here        # Windows cmd
    $env:MUAPIAPP_API_KEY="your_key_here"     # Windows PowerShell

    # 2. Run from the torah-reader/ directory:
    python scripts/outpaint_muapi.py

If the model slug below is wrong (MuAPI returns 404), edit MODEL_ENDPOINT.
Known working patterns: /api/v1/flux-dev-image, /api/v1/flux-kontext-pro-image
"""

import os
import sys
import time
import requests
from pathlib import Path

API_BASE = "https://api.muapi.ai/api/v1"
UPLOAD_URL = f"{API_BASE}/upload_file"
# If this 404s, try: flux-kontext-max-image, nano-banana-edit, flux-2-pro-edit
MODEL_ENDPOINT = f"{API_BASE}/flux-kontext-pro-image"

PADDED_INPUT = Path("public/home-bg-padded-for-ai.png")
FINAL_OUTPUT = Path("public/home-bg.png")

PROMPT = (
    "Fill the entire black rectangle on the left side of this image. "
    "Paint a seamless continuation of the existing oil painting: deep cosmic "
    "starry night sky, swirling golden galactic nebula, ancient moonlit desert "
    "horizon. Match the exact brushwork, color palette, and lighting of the "
    "existing painting. Do not add any figures, people, or new subjects. The "
    "right side of the image (the painting with Abraham) must remain completely "
    "unchanged. Seamless extension only."
)


def die(msg: str) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    key = os.environ.get("MUAPIAPP_API_KEY")
    if not key:
        die("Set MUAPIAPP_API_KEY env var (see header comment).")
    if not PADDED_INPUT.exists():
        die(f"Input missing: {PADDED_INPUT.resolve()}")

    headers = {"x-api-key": key}

    # 1. Upload the padded image to MuAPI's storage
    print(f"[1/3] Uploading {PADDED_INPUT} ...")
    with open(PADDED_INPUT, "rb") as f:
        r = requests.post(UPLOAD_URL, headers=headers, files={"file": f}, timeout=120)
    if r.status_code != 200:
        die(f"upload failed {r.status_code}: {r.text}")
    uploaded_url = r.json().get("url") or r.json().get("data", {}).get("url")
    if not uploaded_url:
        die(f"upload returned no URL: {r.json()}")
    print(f"      uploaded: {uploaded_url}")

    # 2. Submit the Flux Kontext Pro edit job
    print(f"[2/3] Submitting job to {MODEL_ENDPOINT} ...")
    payload = {
        "prompt": PROMPT,
        "image": uploaded_url,
        "aspect_ratio": "21:9",   # ignored by some models
        "seed": -1,
        "num_images": 1,
    }
    r = requests.post(
        MODEL_ENDPOINT,
        headers={**headers, "Content-Type": "application/json"},
        json=payload,
        timeout=60,
    )
    if r.status_code != 200:
        die(f"submit failed {r.status_code}: {r.text}")
    body = r.json()
    req_id = body.get("request_id") or body.get("data", {}).get("request_id") or body.get("requestId")
    if not req_id:
        die(f"no request_id in response: {body}")
    print(f"      request_id: {req_id}")

    # 3. Poll for result
    poll_url = f"{API_BASE}/predictions/{req_id}/result"
    print(f"[3/3] Polling {poll_url}")
    deadline = time.time() + 180
    result_url = None
    while time.time() < deadline:
        r = requests.get(poll_url, headers=headers, timeout=30)
        if r.status_code != 200:
            time.sleep(3)
            continue
        data = r.json()
        status = (
            data.get("status")
            or data.get("data", {}).get("status")
            or ""
        ).lower()
        print(f"      status={status}")
        if status in ("success", "succeeded", "completed", "done"):
            d = data.get("data", data)
            outputs = (
                d.get("outputs")
                or d.get("images")
                or d.get("output")
                or []
            )
            if isinstance(outputs, str):
                result_url = outputs
            elif isinstance(outputs, list) and outputs:
                first = outputs[0]
                result_url = first.get("url") if isinstance(first, dict) else first
            break
        if status in ("failed", "error"):
            die(f"job failed: {data}")
        time.sleep(3)
    if not result_url:
        die("timed out waiting for result")

    # 4. Download and overwrite home-bg.png
    print(f"      downloading {result_url}")
    r = requests.get(result_url, timeout=120)
    if r.status_code != 200:
        die(f"download failed {r.status_code}")
    FINAL_OUTPUT.write_bytes(r.content)
    print(f"DONE. Wrote {FINAL_OUTPUT} ({len(r.content):,} bytes).")


if __name__ == "__main__":
    main()
