#!/usr/bin/env python3
"""Reproduce the frame-aligned, pitch-preserving hook from hook-pace.json."""
import argparse
import json
from pathlib import Path
import subprocess


def render(spec_path, output_override=None, validate_only=False):
    spec = json.loads(spec_path.read_text())
    source = spec_path.parent / spec['source']
    output = Path(output_override) if output_override else spec_path.parent / spec['output']
    fps, rate, frames = spec['fps'], spec['rate'], spec['outputFrames']
    intervals = spec['sourceFrameIntervals']
    if type(fps) is not int or fps <= 0 or not .5 <= rate <= 2 or type(frames) is not int or frames <= 0:
        raise ValueError('Invalid FPS, tempo or output frame count')
    previous_end = 0
    for interval in intervals:
        a, b = interval['start'], interval['end']
        if type(a) is not int or type(b) is not int or not previous_end <= a < b:
            raise ValueError('Source frame intervals must be ordered, nonoverlapping and nonempty')
        previous_end = b
    kept = sum(i['end']-i['start'] for i in intervals)
    if kept != spec['keptFrames']:
        raise ValueError('keptFrames does not match intervals')
    if abs(kept/rate-frames) > 1:
        raise ValueError('Output length must be within one frame of tempo-adjusted length')
    duration = frames/fps
    graph, inputs = [], []
    for i, interval in enumerate(intervals):
        a, b = interval['start'], interval['end']
        graph += [f'[0:v]trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS[v{i}]', f'[0:a]atrim=start={a/fps:.12f}:end={b/fps:.12f},asetpts=PTS-STARTPTS[a{i}]']
        inputs.append(f'[v{i}][a{i}]')
    graph += [''.join(inputs)+f'concat=n={len(intervals)}:v=1:a=1[v][a]', f'[v]setpts=PTS/{rate},fps={fps},tpad=stop_mode=clone:stop_duration=0.1,trim=end_frame={frames},setpts=PTS-STARTPTS[vo]', f'[a]atempo={rate},apad,atrim=duration={duration:.12f},asetpts=PTS-STARTPTS[ao]']
    if validate_only:
        print(json.dumps({'source': str(source), 'output': str(output), 'keptFrames': kept, 'outputFrames': frames, 'duration': duration, 'rate': rate}))
        return
    if not source.is_file():
        raise ValueError('Source is missing')
    if output.exists():
        raise ValueError('Output exists; use --output to preserve the previous version')
    output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','warning','-nostdin','-n','-threads','4','-i',str(source),'-filter_complex_threads','4','-filter_complex',';'.join(graph),'-map','[vo]','-map','[ao]','-t',f'{duration:.12f}','-c:v','libx264','-threads','4','-preset','fast','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',str(output)],check=True)


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest', type=Path)
    parser.add_argument('--output')
    parser.add_argument('--validate-only', action='store_true')
    args=parser.parse_args()
    try:
        render(args.manifest,args.output,args.validate_only)
    except (ValueError,OSError,subprocess.CalledProcessError) as error:
        parser.exit(1,f'{error}\n')
