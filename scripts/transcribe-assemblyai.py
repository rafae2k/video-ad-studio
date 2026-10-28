#!/usr/bin/env python3
"""Transcribe local videos with AssemblyAI without uploading video frames.

Official references (checked 2026-10-18):
https://www.assemblyai.com/docs/coding-agent-prompts
https://www.assemblyai.com/changelog
https://www.assemblyai.com/docs/pre-recorded-audio/export-transcripts-as-srt-vtt-or-text

Examples (from the repo root; transcripts go next to the project intake):
  npm run transcribe -- --input storage/sources/<id>/take.mov --output-dir projects/<id>/intake/transcripts
  npm run transcribe -- --prepare-only --input ... --output-dir ...
  npm run transcribe -- --submit --input ... --output-dir ...

The words[] array of <stem>.json (start/end in ms) is the transcript input of packages/motion.

The default is a no-network dry run. --submit requires a real key in the
workspace-root .env file. Inherited environment variables are ignored.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import subprocess
import sys
import time
from urllib import error, parse, request


BASE_URL = "https://api.assemblyai.com/v2"
PLACEHOLDER = "REPLACE_WITH_YOUR_ASSEMBLYAI_API_KEY"
PROJECT_ROOT = Path(__file__).resolve().parents[1]
POLL_INTERVAL_SECONDS = 5
POLL_TIMEOUT_SECONDS = 30 * 60


def read_key() -> str:
    key = ""
    env_path = PROJECT_ROOT / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            name, sep, value = line.partition("=")
            if sep and name.strip() == "ASSEMBLYAI_API_KEY":
                key = value.strip().strip('"\'')
                break
    if not key or key == PLACEHOLDER or key.startswith(("REPLACE_", "YOUR_")):
        raise RuntimeError(
            "No real AssemblyAI key found. Replace ASSEMBLYAI_API_KEY in the "
            "workspace-root .env before using --submit. No network call was made."
        )
    return key


def probe_audio(video: Path) -> float | None:
    result = subprocess.run(
        [
            "ffprobe", "-v", "error", "-select_streams", "a:0",
            "-show_entries", "stream=codec_type:format=duration", "-of", "json",
            str(video),
        ],
        text=True, capture_output=True, check=True,
    )
    metadata = json.loads(result.stdout)
    if not metadata.get("streams"):
        raise RuntimeError(f"No audio stream found: {video}")
    duration = metadata.get("format", {}).get("duration")
    return float(duration) if duration else None


def extract_audio(video: Path, audio: Path) -> None:
    if audio.exists() and audio.stat().st_mtime_ns >= video.stat().st_mtime_ns:
        return
    audio.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(video), "-map", "0:a:0", "-vn", "-ac", "1", "-ar", "16000",
            "-c:a", "flac", str(audio),
        ],
        check=True,
    )


def api_call(key: str, method: str, path: str, payload: bytes | None = None,
             content_type: str | None = None) -> bytes:
    headers = {"Authorization": key}
    if content_type:
        headers["Content-Type"] = content_type
    req = request.Request(BASE_URL + path, data=payload, headers=headers, method=method)
    try:
        with request.urlopen(req, timeout=120) as response:
            return response.read()
    except error.HTTPError as exc:
        # Never print headers or the API key. API errors may include media details.
        raise RuntimeError(f"AssemblyAI HTTP {exc.code} during {method} {path}") from None


def api_json(key: str, method: str, path: str, payload: object | None = None) -> dict:
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    raw = api_call(key, method, path, body,
                   "application/json" if payload is not None else None)
    return json.loads(raw)


def write_json(path: Path, data: object) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def complete_srt(raw_srt: str, words: list[dict]) -> str:
    """Append any word-timed tail that the provider's SRT export omitted."""
    cues = re.findall(
        r"(?m)^(\d+)\s*\n\d\d:\d\d:\d\d,\d{3} --> "
        r"(\d\d:\d\d:\d\d,\d{3})\s*$", raw_srt
    )
    if not cues or not words:
        return raw_srt

    def milliseconds(stamp: str) -> int:
        h, m, rest = stamp.split(":")
        s, ms = rest.split(",")
        return ((int(h) * 60 + int(m)) * 60 + int(s)) * 1000 + int(ms)

    def stamp(ms: int) -> str:
        h, remainder = divmod(ms, 3_600_000)
        m, remainder = divmod(remainder, 60_000)
        s, frac = divmod(remainder, 1_000)
        return f"{h:02d}:{m:02d}:{s:02d},{frac:03d}"

    last_index, last_end = cues[-1]
    end_ms = milliseconds(last_end)
    tail = [word for word in words if int(word["end"]) > end_ms + 5]
    if not tail:
        return raw_srt
    start_ms = max(end_ms, int(tail[0]["start"]))
    finish_ms = int(tail[-1]["end"])
    text = " ".join(str(word["text"]) for word in tail)
    return raw_srt.rstrip() + f"\n\n{int(last_index) + 1}\n{stamp(start_ms)} --> {stamp(finish_ms)}\n{text}\n"


def transcribe_one(video: Path, output_dir: Path, key: str) -> None:
    stem = video.stem
    audio_path = output_dir / f"{stem}.audio.flac"
    state_path = output_dir / f"{stem}.assemblyai-job.json"
    json_path = output_dir / f"{stem}.json"
    text_path = output_dir / f"{stem}.txt"
    srt_path = output_dir / f"{stem}.srt"
    complete_srt_path = output_dir / f"{stem}.complete.srt"
    fingerprint = {"source": str(video.resolve()),
                   "size": video.stat().st_size,
                   "mtime_ns": video.stat().st_mtime_ns}
    state = json.loads(state_path.read_text(encoding="utf-8")) if state_path.exists() else {}
    if state and state.get("source_fingerprint") != fingerprint:
        raise RuntimeError(f"Source changed since prior AssemblyAI job: {video}")
    if state.get("transcript_id") and all(p.exists() for p in (json_path, text_path, srt_path, complete_srt_path)):
        print(f"Already complete, skipping: {video.name}")
        return

    extract_audio(video, audio_path)
    if not state.get("upload_url"):
        print(f"Uploading audio only: {audio_path.name}")
        uploaded = api_call(key, "POST", "/upload", audio_path.read_bytes(),
                            "application/octet-stream")
        state = {"source_fingerprint": fingerprint,
                 "upload_url": json.loads(uploaded)["upload_url"]}
        write_json(state_path, state)
    if not state.get("transcript_id"):
        print(f"Submitting transcription: {video.name}")
        submitted = api_json(key, "POST", "/transcript", {
            "audio_url": state["upload_url"],
            "speech_models": ["universal-3-5-pro", "universal-2"],
            "language_detection": True,
        })
        state["transcript_id"] = submitted["id"]
        write_json(state_path, state)

    transcript_id = state["transcript_id"]
    deadline = time.monotonic() + POLL_TIMEOUT_SECONDS
    while True:
        result = api_json(key, "GET", f"/transcript/{parse.quote(transcript_id)}")
        status = result.get("status")
        if status == "completed":
            break
        if status == "error":
            raise RuntimeError(f"AssemblyAI transcription failed for {video.name}: {result.get('error')}")
        if time.monotonic() >= deadline:
            raise RuntimeError(f"Polling timed out for {video.name}; rerun --submit to resume job {transcript_id}")
        print(f"{video.name}: {status}; waiting {POLL_INTERVAL_SECONDS}s")
        time.sleep(POLL_INTERVAL_SECONDS)

    # The full API response includes words[] with start/end timestamps in ms.
    write_json(json_path, result)
    text_path.write_text((result.get("text") or "") + "\n", encoding="utf-8")
    srt = api_call(key, "GET", f"/transcript/{parse.quote(transcript_id)}/srt?chars_per_caption=32")
    srt_path.write_bytes(srt)
    complete_srt_path.write_text(
        complete_srt(srt.decode("utf-8"), result.get("words") or []),
        encoding="utf-8",
    )
    print(f"Saved: {json_path.name}, {text_path.name}, {srt_path.name}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", nargs="+", type=Path, required=True,
                        help="Local videos with audio; only the audio track is uploaded")
    parser.add_argument("--output-dir", type=Path, required=True,
                        help="Usually projects/<id>/intake/transcripts")
    action = parser.add_mutually_exclusive_group()
    action.add_argument("--submit", action="store_true", help="Upload audio and submit paid API jobs")
    action.add_argument("--prepare-only", action="store_true", help="Extract FLAC locally; no network")
    args = parser.parse_args()

    videos = [path.expanduser().resolve() for path in args.input]
    for video in videos:
        if not video.is_file():
            parser.error(f"Input video does not exist: {video}")
    if len({path.stem for path in videos}) != len(videos):
        parser.error("Input videos must have distinct filename stems")

    # Fail on a placeholder before extracting anything or contacting the API.
    key = read_key() if args.submit else ""
    output_dir = args.output_dir.expanduser().resolve()
    for video in videos:
        duration = probe_audio(video)
        print(f"{video.name}: audio detected, duration {duration:.1f}s" if duration else
              f"{video.name}: audio detected")
        if args.prepare_only:
            audio = output_dir / f"{video.stem}.audio.flac"
            extract_audio(video, audio)
            print(f"Prepared locally: {audio}")
        elif args.submit:
            output_dir.mkdir(parents=True, exist_ok=True)
            transcribe_one(video, output_dir, key)
        else:
            print(f"Dry run: would extract audio and write transcript files in {output_dir}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, subprocess.CalledProcessError, OSError, ValueError, KeyError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise SystemExit(1)
