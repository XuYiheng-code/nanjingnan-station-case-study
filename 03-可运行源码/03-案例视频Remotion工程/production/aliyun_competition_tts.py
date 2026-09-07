#!/usr/bin/env python3
"""Generate the competition narration with Alibaba Cloud Qwen-TTS.

The API key is read from DASHSCOPE_API_KEY or an explicitly supplied key file.
It is never persisted in this project or written to the manifest.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import pathlib
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone


ENDPOINT = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
MODEL = "qwen3-tts-instruct-flash-2026-01-26"
VOICES = {
    "female": {
        "voice": "Maia",
        "instructions": "30岁左右温柔知性女声，普通话标准；语调平和克制，语速中等偏慢，具有公共治理纪录片的叙事质感；数字、机构名和概念清楚准确；避免广告腔、甜腻和过度煽情。",
    },
    "male": {
        "voice": "Neil",
        "instructions": "沉稳中年男声，普通话标准；音色低沉但不压迫，语速中等偏慢，具有调查纪录片的克制与可信度；数字、机构名和概念清楚准确；避免新闻联播腔和过度煽情。",
    },
}


def load_key(key_file: str | None) -> str:
    if os.environ.get("DASHSCOPE_API_KEY"):
        return os.environ["DASHSCOPE_API_KEY"].strip()
    if key_file:
        return pathlib.Path(key_file).expanduser().read_text(encoding="utf-8").strip()
    raise RuntimeError("缺少 DASHSCOPE_API_KEY 或 --key-file")


def request_audio(key: str, text: str, voice: str, instructions: str) -> bytes:
    if len(text) > 600:
        raise ValueError(f"单段文本超过阿里云 600 字符限制：{len(text)}")
    payload = {
        "model": MODEL,
        "input": {
            "text": text,
            "voice": voice,
            "language_type": "Chinese",
            "instructions": instructions,
            "optimize_instructions": True,
        },
    }
    request = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=300) as response:
        result = json.loads(response.read().decode("utf-8"))
    if result.get("code"):
        raise RuntimeError(f"{result.get('code')}: {result.get('message', '')}")
    audio = result.get("output", {}).get("audio", {})
    if audio.get("url"):
        with urllib.request.urlopen(audio["url"], timeout=300) as response:
            return response.read()
    if audio.get("data"):
        return base64.b64decode(audio["data"])
    raise RuntimeError("阿里云响应未包含音频")


def duration(path: pathlib.Path) -> float:
    return float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path),
    ], text=True).strip())


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def normalize(raw: bytes, output: pathlib.Path) -> float:
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp:
        temp.write(raw)
        raw_path = pathlib.Path(temp.name)
    try:
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(raw_path),
            "-af", "loudnorm=I=-18:TP=-2:LRA=7,apad=pad_dur=0.35",
            "-ar", "48000", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "192k",
            str(output),
        ], check=True)
    finally:
        raw_path.unlink(missing_ok=True)
    return duration(output)


def generate(voice_key: str, key: str, project: pathlib.Path) -> dict:
    config = VOICES[voice_key]
    narration = json.loads((project / "production" / "competition-narration.json").read_text(encoding="utf-8"))
    output_dir = project / "public" / "audio" / "competition" / voice_key
    manifest_segments = []
    for index, segment in enumerate(narration, start=1):
        output = output_dir / f"{segment['id']}.mp3"
        print(f"[{voice_key} {index:02d}/{len(narration):02d}] {segment['id']}", flush=True)
        last_error: Exception | None = None
        for attempt in range(1, 4):
            try:
                audio = request_audio(key, segment["text"], config["voice"], config["instructions"])
                seconds = normalize(audio, output)
                manifest_segments.append({
                    "id": segment["id"],
                    "chapter": segment["chapter"],
                    "title": segment["title"],
                    "text": segment["text"],
                    "text_sha256": sha256_bytes(segment["text"].encode("utf-8")),
                    "file_sha256": sha256_bytes(output.read_bytes()),
                    "duration": round(seconds, 3),
                })
                print(f"  {seconds:.3f}s", flush=True)
                break
            except (urllib.error.HTTPError, urllib.error.URLError, RuntimeError, subprocess.CalledProcessError) as exc:
                last_error = exc
                if attempt == 3:
                    raise
                time.sleep(attempt * 2)
        if last_error and not output.exists():
            raise last_error
    return {
        "provider": "Alibaba Cloud Model Studio",
        "model": MODEL,
        "voice": config["voice"],
        "voice_gender": voice_key,
        "instructions": config["instructions"],
        "sample_rate_hz": 48000,
        "channels": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "segments": manifest_segments,
        "total_narration_seconds": round(sum(item["duration"] for item in manifest_segments), 3),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", choices=["female", "male", "all"], default="all")
    parser.add_argument("--key-file")
    args = parser.parse_args()
    project = pathlib.Path(__file__).resolve().parents[1]
    key = load_key(args.key_file)
    choices = list(VOICES) if args.voice == "all" else [args.voice]
    results = {choice: generate(choice, key, project) for choice in choices}
    manifest_path = project / "production" / "competition-tts-manifest.json"
    existing = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    existing.update(results)
    manifest_path.write_text(json.dumps(existing, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for choice in choices:
        print(f"{choice}: {results[choice]['total_narration_seconds']:.3f}s")
    print(manifest_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
