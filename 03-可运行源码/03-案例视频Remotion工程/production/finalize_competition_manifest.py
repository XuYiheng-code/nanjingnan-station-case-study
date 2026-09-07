#!/usr/bin/env python3
"""Add reproducibility hashes to a previously generated TTS manifest."""

from __future__ import annotations

import hashlib
import json
import pathlib
from datetime import datetime, timezone


project = pathlib.Path(__file__).resolve().parents[1]
path = project / "production" / "competition-tts-manifest.json"
manifest = json.loads(path.read_text(encoding="utf-8"))
for gender, voice in manifest.items():
    voice.setdefault("generated_at", datetime.now(timezone.utc).isoformat())
    for segment in voice["segments"]:
        audio = project / "public" / "audio" / "competition" / gender / f"{segment['id']}.mp3"
        segment["text_sha256"] = hashlib.sha256(segment["text"].encode("utf-8")).hexdigest()
        segment["file_sha256"] = hashlib.sha256(audio.read_bytes()).hexdigest()
path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(path)
