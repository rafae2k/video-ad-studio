#!/usr/bin/env python3
"""Technical-only checks for rendered Remotion variants, not human approval."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
from datetime import datetime, timezone
from fractions import Fraction

ROOT = Path(__file__).resolve().parents[1]


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def inspect(project, variant):
    output = ROOT / f'storage/exports/{project}/v2-{variant}.mp4'
    manifest = ROOT / f'projects/{project}/edits/v2-{variant}.json'
    edit = json.loads(manifest.read_text())
    probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(output)]))
    video = next(s for s in probe['streams'] if s['codec_type'] == 'video')
    audio = next(s for s in probe['streams'] if s['codec_type'] == 'audio')
    checks = {
        'h264': video['codec_name'] == 'h264',
        'aac': audio['codec_name'] == 'aac',
        'dimensions': (video['width'], video['height']) == (edit.get('width',1080), edit.get('height',1920)),
        'fps': float(Fraction(video['avg_frame_rate'])) == edit.get('fps',30),
        'duration': abs(float(probe['format']['duration']) - edit['duration']) <= .05,
        'pixelFormat': video['pix_fmt'] == 'yuv420p',
    }
    decode = subprocess.run(['ffmpeg', '-hide_banner', '-v', 'error', '-threads', '4', '-i', str(output), '-f', 'null', '-'], capture_output=True, text=True)
    checks['fullDecode'] = decode.returncode == 0 and not decode.stderr.strip()
    meter = subprocess.run(['ffmpeg', '-hide_banner', '-threads', '4', '-i', str(output), '-vn', '-af', 'loudnorm=I=-16:LRA=11:TP=-1:print_format=json', '-f', 'null', '-'], capture_output=True, text=True, check=True)
    blocks = re.findall(r'\{\s*"input_i"[\s\S]*?\}', meter.stderr)
    loudness = json.loads(blocks[-1]) if blocks else None
    return dict(variant=variant, file=str(output.relative_to(ROOT)), bytes=output.stat().st_size, sha256=sha(output), manifest=str(manifest.relative_to(ROOT)), manifestSha256=sha(manifest), renderer=edit.get('renderer'), technicalPass=all(checks.values()), checks=checks,
                video={k: video.get(k) for k in ['codec_name', 'width', 'height', 'avg_frame_rate', 'pix_fmt', 'duration', 'nb_frames']},
                audio={k: audio.get(k) for k in ['codec_name', 'sample_rate', 'channels', 'duration', 'bit_rate']},
                duration=float(probe['format']['duration']), decodeErrors=decode.stderr.strip(), loudnessMeasurement=loudness,
                loudnessNote='input_i/input_tp/input_lra measure the delivered file. output_* are hypothetical normalization results from analysis only; exported audio was not altered by this QA.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('project', nargs='?', default='david-pronunciamento-black')
    args = parser.parse_args()
    if not re.fullmatch('[a-z0-9-]+', args.project):
        parser.error('Invalid project identifier')
    records=[]
    for variant in ['split', 'type', 'benefits']:
        records.append(inspect(args.project, variant))
        print(f'{variant}: technicalPass={records[-1]["technicalPass"]}', flush=True)
    source_files=['packages/remotion/AdComposition.tsx', 'packages/remotion/Root.tsx', 'packages/remotion/FontLoader.tsx', 'packages/remotion/package-lock.json']
    report=dict(checkedAt=datetime.now(timezone.utc).isoformat(), scope='technical-only; visual/audio review and human approval separate', codeSha256={f:sha(ROOT/f) for f in source_files}, exports=records)
    report_path=ROOT/f'projects/{args.project}/reviews/v2-technical-qa.json'
    report_path.parent.mkdir(parents=True,exist_ok=True)
    report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(report_path)
    if not all(r['technicalPass'] for r in records):
        raise SystemExit(1)
