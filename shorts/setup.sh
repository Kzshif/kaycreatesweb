#!/usr/bin/env bash
# Idempotent setup for the Shorts pipeline.
# Safe to re-run: every step checks whether its work is already done.
#
#   bash shorts/setup.sh
#
# Installs: Node packages (Remotion), a Python venv (Whisper + fallback voice),
# and the two speech models. Needs network access to npm, PyPI, huggingface.co
# (+ its download host us.aws.cdn.hf.co) and GitHub release downloads.
set -euo pipefail
cd "$(dirname "$0")"

say() { printf '[setup] %s\n' "$*"; }

FAILED=()

fetch() { # fetch <url> <dest> [sha256]   - a failed download is reported at the end, not fatal here
  local url="$1" dest="$2" sum="${3:-}"
  if [ -s "$dest" ]; then return 0; fi
  mkdir -p "$(dirname "$dest")"
  say "downloading $(basename "$dest")"
  if ! curl -fsSL --retry 3 --retry-delay 4 -o "$dest.part" "$url"; then
    rm -f "$dest.part"
    FAILED+=("$(basename "$dest") <- $url")
    return 0
  fi
  if [ -n "$sum" ]; then
    local got
    got="$(sha256sum "$dest.part" | cut -d' ' -f1)"
    if [ "$got" != "$sum" ]; then
      rm -f "$dest.part"
      FAILED+=("$(basename "$dest"): checksum mismatch (got $got)")
      return 0
    fi
  fi
  mv "$dest.part" "$dest"
}

# ---------------------------------------------------------------- Node -----
if [ ! -d node_modules/remotion ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  say "installing Node packages"
  if [ -f package-lock.json ]; then
    npm ci --no-audit --no-fund --loglevel=error
  else
    npm install --no-audit --no-fund --loglevel=error
  fi
else
  say "Node packages present"
fi

# -------------------------------------------------------------- Python -----
if [ ! -x .venv/bin/python ]; then
  say "creating Python venv"
  python3 -m venv .venv
fi
if ! .venv/bin/python -c "import faster_whisper, kokoro_onnx, soundfile, numpy" >/dev/null 2>&1; then
  say "installing Python packages"
  .venv/bin/pip install -q --disable-pip-version-check -r requirements.txt
else
  say "Python packages present"
fi

# ---------------------------------------------------- Whisper (captions) ---
# Systran/faster-whisper-small.en, pinned to one revision. MIT licence.
W_REV="d1d751a5f8271d482d14ca55d9e2deeebbae577f"
W_URL="https://huggingface.co/Systran/faster-whisper-small.en/resolve/$W_REV"
W_DIR=".models/faster-whisper-small.en"
fetch "$W_URL/config.json"    "$W_DIR/config.json"
fetch "$W_URL/tokenizer.json" "$W_DIR/tokenizer.json"
fetch "$W_URL/vocabulary.txt" "$W_DIR/vocabulary.txt"
fetch "$W_URL/model.bin"      "$W_DIR/model.bin" \
  "62b2a45b05ee59acb4a5341b33ee35e041395d378d418a18acfe4c9e768ee37a"

# ------------------------------------------- Kokoro (fallback voice only) --
# Used ONLY when a video has no recorded voice.wav. Apache-2.0 model.
K_URL="https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"
K_DIR=".models/kokoro"
fetch "$K_URL/kokoro-v1.0.onnx" "$K_DIR/kokoro-v1.0.onnx" \
  "7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5"
fetch "$K_URL/voices-v1.0.bin"  "$K_DIR/voices-v1.0.bin" \
  "bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d"

if [ "${#FAILED[@]}" -gt 0 ]; then
  say "NOT READY - these downloads failed:"
  for f in "${FAILED[@]}"; do say "  $f"; done
  say "If the host was refused (403), the network policy has not picked it up yet: run setup again in a few minutes."
  exit 1
fi
say "ready"
