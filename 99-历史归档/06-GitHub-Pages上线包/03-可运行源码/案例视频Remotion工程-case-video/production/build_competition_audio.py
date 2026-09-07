#!/usr/bin/env python3
"""Build gender-specific narration/SFX/BGM masters from the locked visual timeline."""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import subprocess
import tempfile


PROJECT = pathlib.Path(__file__).resolve().parents[1]
FPS = 30


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def seconds(frames: int) -> float:
    return frames / FPS


def sfx_events(timeline: dict) -> list[dict]:
    by_id = {item["id"]: item for item in timeline["segments"]}
    events = [
        {"frame": 54, "file": "riser-cine.mp3", "volume": 0.18, "frames": 170},
        {"frame": 168, "file": "impact-deep-whoosh.mp3", "volume": 0.26, "frames": 105},
    ]
    events.extend({
        "frame": item["from"] + item["durationFrames"] - 6,
        "file": "transition-soft.mp3", "volume": 0.09, "frames": 42,
    } for item in timeline["segments"][:-1])
    events.extend([
        {"frame": by_id["city_brain"]["from"] + 55, "file": "data-scan.mp3", "volume": 0.12, "frames": 260},
        {"frame": by_id["dispatch"]["from"] + 86, "file": "switch-click-quick.mp3", "volume": 0.15, "frames": 45},
        {"frame": by_id["conclusion"]["from"] + 45, "file": "riser-cine.mp3", "volume": 0.20, "frames": 180},
    ])
    return events


def build_master(gender: str, timeline: dict, output: pathlib.Path) -> None:
    inputs: list[pathlib.Path] = []
    filters: list[str] = []
    labels: list[str] = []

    for item in timeline["segments"]:
        inputs.append(PROJECT / "public" / "audio" / "competition" / gender / f"{item['id']}.mp3")
        index = len(inputs) - 1
        delay_ms = round(seconds(item["from"] + item["narrationFromFrames"]) * 1000)
        label = f"v{index}"
        filters.append(f"[{index}:a]aresample=48000,adelay={delay_ms}:all=1[{label}]")
        labels.append(f"[{label}]")

    for event in sfx_events(timeline):
        inputs.append(PROJECT / "public" / "audio" / event["file"])
        index = len(inputs) - 1
        delay_ms = round(seconds(event["frame"]) * 1000)
        label = f"s{index}"
        filters.append(
            f"[{index}:a]aresample=48000,atrim=duration={seconds(event['frames']):.6f},"
            f"volume={event['volume']},adelay={delay_ms}:all=1[{label}]"
        )
        labels.append(f"[{label}]")

    total_seconds = seconds(timeline["totalFrames"])
    filters.append(
        "".join(labels)
        + f"amix=inputs={len(labels)}:duration=longest:normalize=0,"
          f"apad=whole_dur={total_seconds:.6f},atrim=duration={total_seconds:.6f},"
          "aformat=sample_rates=48000:channel_layouts=stereo,alimiter=limit=0.891[master]"
    )
    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
    for source in inputs:
        command.extend(["-i", str(source)])
    command.extend([
        "-filter_complex", ";".join(filters), "-map", "[master]",
        "-c:a", "pcm_s16le", str(output),
    ])
    run(command)


def encode_mix(master: pathlib.Path, timeline: dict, output: pathlib.Path, with_bgm: bool) -> None:
    total_seconds = seconds(timeline["totalFrames"])
    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(master)]
    if with_bgm:
        command.extend(["-stream_loop", "-1", "-i", str(PROJECT / "public" / "audio" / "bgm.mp3")])
        filters = (
            f"[1:a]aresample=48000,volume=0.075,afade=t=in:st=0:d=2,"
            f"afade=t=out:st={max(0, total_seconds - 4):.3f}:d=4,atrim=duration={total_seconds:.6f}[bgm];"
            "[0:a][bgm]amix=inputs=2:duration=first:normalize=0,"
            "loudnorm=I=-18:TP=-1.5:LRA=8[out]"
        )
        command.extend(["-filter_complex", filters, "-map", "[out]"])
    else:
        command.extend(["-af", "loudnorm=I=-18:TP=-1.5:LRA=8"])
    command.extend(["-ar", "48000", "-ac", "2", "-c:a", "aac", "-b:a", "256k", str(output)])
    run(command)


def split_caption(text: str, max_chars: int = 18) -> list[str]:
    clauses = re.findall(r"[^，。；：？！]+[，。；：？！]?", text) or [text]
    output: list[str] = []
    for clause in clauses:
        while len(clause) > max_chars:
            output.append(clause[:max_chars])
            clause = clause[max_chars:]
        if clause:
            output.append(clause)
    merged: list[str] = []
    for item in output:
        if re.fullmatch(r"[，。；：？！、…]+", item) and merged:
            merged[-1] += item
        else:
            merged.append(item)
    return merged


def stamp(value: float) -> str:
    millis = max(0, round(value * 1000))
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def write_vtt(gender: str, timeline: dict, manifest: dict, output: pathlib.Path) -> None:
    source = {item["id"]: item for item in manifest[gender]["segments"]}
    cues: list[str] = ["WEBVTT", "", f"NOTE Alibaba Cloud {manifest[gender]['model']} / {manifest[gender]['voice']}", ""]
    counter = 1
    for item in timeline["segments"]:
        record = source[item["id"]]
        parts = split_caption(record["text"])
        weights = [len(part) for part in parts]
        total_weight = max(1, sum(weights))
        cursor = seconds(item["from"] + item["narrationFromFrames"])
        audio_seconds = record["duration"]
        consumed = 0
        for part, weight in zip(parts, weights):
            start = cursor + audio_seconds * consumed / total_weight
            consumed += weight
            end = cursor + audio_seconds * consumed / total_weight
            cues.extend([str(counter), f"{stamp(start)} --> {stamp(end)}", part, ""])
            counter += 1
    output.write_text("\n".join(cues), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--gender", choices=["female", "male", "all"], default="all")
    parser.add_argument("--vtt-only", action="store_true", help="regenerate caption files without rebuilding audio")
    args = parser.parse_args()
    timeline = json.loads((PROJECT / "production" / "competition-timeline.json").read_text(encoding="utf-8"))
    manifest = json.loads((PROJECT / "production" / "competition-tts-manifest.json").read_text(encoding="utf-8"))
    output_dir = PROJECT / "out" / "competition-audio"
    output_dir.mkdir(parents=True, exist_ok=True)
    genders = ["female", "male"] if args.gender == "all" else [args.gender]
    for gender in genders:
        if not args.vtt_only:
            with tempfile.TemporaryDirectory(prefix=f"competition-{gender}-") as temp_dir:
                master = pathlib.Path(temp_dir) / "master.wav"
                build_master(gender, timeline, master)
                encode_mix(master, timeline, output_dir / f"{gender}-bgm.m4a", with_bgm=True)
                encode_mix(master, timeline, output_dir / f"{gender}-nobgm.m4a", with_bgm=False)
        write_vtt(gender, timeline, manifest, output_dir / f"{gender}.zh-CN.vtt")
        print(f"built {gender}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
