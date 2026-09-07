#!/usr/bin/env python3
import base64
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request


ENDPOINT = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
MODEL = "qwen3-tts-instruct-flash"
VOICE = "Maia"
INSTRUCTIONS = "温柔知性的成年女性，标准普通话，吐字清晰，语气克制而有温度，适合公共管理纪录片解说。语速中等，句间停顿自然，不要广告腔。"


def request_audio(key: str, text: str) -> bytes:
    payload = {
        "model": MODEL,
        "input": {
            "text": text,
            "voice": VOICE,
            "language_type": "Chinese",
            "instructions": INSTRUCTIONS,
            "optimize_instructions": True,
        },
    }
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        ENDPOINT,
        data=data,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=240) as response:
        result = json.loads(response.read().decode("utf-8"))
    if result.get("code"):
        raise RuntimeError(f"{result.get('code')}: {result.get('message', '')}")
    audio = result.get("output", {}).get("audio", {})
    if audio.get("url"):
        with urllib.request.urlopen(audio["url"], timeout=240) as response:
            return response.read()
    if audio.get("data"):
        return base64.b64decode(audio["data"])
    raise RuntimeError("API response did not contain audio data")


def main() -> int:
    key = os.environ.get("QWEN_API_KEY", "")
    if not key:
        print("QWEN_API_KEY is missing", file=sys.stderr)
        return 2

    project = pathlib.Path(__file__).resolve().parents[1]
    scripts = json.loads((project / "production" / "narration.json").read_text(encoding="utf-8"))
    output_dir = project / "public" / "audio" / "narration-qwen"
    output_dir.mkdir(parents=True, exist_ok=True)
    manifest = {"model": MODEL, "voice": VOICE, "segments": []}

    for index, segment in enumerate(scripts, start=1):
        segment_id = segment["id"]
        print(f"[{index:02d}/{len(scripts):02d}] generating {segment_id}", flush=True)
        last_error = None
        for attempt in range(1, 4):
            try:
                raw = request_audio(key, segment["text"])
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp:
                    temp.write(raw)
                    temp_path = pathlib.Path(temp.name)
                output_path = output_dir / f"{segment_id}.mp3"
                subprocess.run(
                    [
                        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                        "-i", str(temp_path),
                        "-af", "loudnorm=I=-18:TP=-2:LRA=7",
                        "-ar", "48000", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "192k",
                        str(output_path),
                    ],
                    check=True,
                )
                temp_path.unlink(missing_ok=True)
                duration = float(subprocess.check_output([
                    "ffprobe", "-v", "error", "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1", str(output_path),
                ], text=True).strip())
                manifest["segments"].append({"id": segment_id, "duration": round(duration, 3)})
                print(f"[{index:02d}/{len(scripts):02d}] {segment_id}: {duration:.2f}s", flush=True)
                break
            except (urllib.error.HTTPError, urllib.error.URLError, RuntimeError, subprocess.CalledProcessError) as exc:
                last_error = exc
                if attempt == 3:
                    raise
                time.sleep(2 * attempt)
        if last_error and not (output_dir / f"{segment_id}.mp3").exists():
            raise last_error

    (project / "production" / "qwen-tts-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print("Qwen narration generation complete", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
