# outpaint_muapi.py

Extends `public/home-bg.png` to the left using MuAPI's Flux Kontext Pro.

## Run it

```bash
# From torah-reader/
cd torah-reader

# 1. Set your MuAPI key as an env var (do NOT commit / share).
export MUAPIAPP_API_KEY=your_real_key_here          # macOS/Linux
# set MUAPIAPP_API_KEY=your_real_key_here           # Windows cmd
# $env:MUAPIAPP_API_KEY="your_real_key_here"        # Windows PowerShell

# 2. Go.
python scripts/outpaint_muapi.py
```

## What it does

1. Uploads `public/home-bg-padded-for-ai.png` (2560×1088, black left, painting right)
   to MuAPI storage.
2. Calls the model endpoint (default: `flux-kontext-pro-image`) with a prompt
   telling it to fill only the black area.
3. Polls `/predictions/{id}/result` every 3s (timeout 3 min).
4. Overwrites `public/home-bg.png` with the returned image.

## If it fails

- **404 on submit**: model slug is wrong. Edit `MODEL_ENDPOINT` in the script.
  Try `flux-kontext-max-image`, `nano-banana-edit`, `flux-2-pro-edit`.
- **Upload 401/403**: key is wrong or expired.
- **Bad result**: tweak the `PROMPT` constant and rerun. ~$0.05 per run.

## Don't commit

The backup / padded intermediate files are already in `public/` but shouldn't be
pushed to the repo. Add if you set up git:

```
# .gitignore
public/home-bg-original.png
public/home-bg-padded-for-ai.png
scripts/.env
```
