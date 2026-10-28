#!/usr/bin/env python3
"""Independent FFmpeg/Pillow draft renderer. See render-footage.md."""
import argparse
import json
import math
import subprocess
import tempfile
from pathlib import Path
from fractions import Fraction


def number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def validate(m, source_duration=None):
    for key in ('sourcePath', 'outputPath'):
        if not isinstance(m.get(key), str) or not m[key]:
            raise ValueError(f'{key} must be a nonempty path')
    for key, default in [('width', 1080), ('height', 1920), ('fps', 30)]:
        val = m.get(key, default)
        if type(val) is not int or val <= 0 or (key != 'fps' and val % 2):
            raise ValueError(f'{key} must be a positive integer; dimensions must be even')
    cuts = m.get('cuts')
    if not isinstance(cuts, list) or not cuts:
        raise ValueError('cuts must be a nonempty list')
    duration = 0
    for cut in cuts:
        a, b = cut.get('sourceStart'), cut.get('sourceEnd')
        if not number(a) or not number(b) or a < 0 or b <= a:
            raise ValueError('Each cut needs 0 <= sourceStart < sourceEnd')
        if source_duration is not None and b > source_duration + .001:
            raise ValueError('Cut exceeds source duration')
        duration += b - a
    for key in ('captions', 'overlays'):
        previous_end = 0
        for cue in m.get(key, []):
            a, b = cue.get('start'), cue.get('end')
            if not number(a) or not number(b) or not 0 <= a < b <= duration + .001:
                raise ValueError(f'{key} cue outside output timeline')
            if not isinstance(cue.get('text'), str) or not cue['text'].strip():
                raise ValueError('Cue text must be nonempty')
            if key == 'captions' and a < previous_end - .001:
                raise ValueError('Captions must be ordered and non-overlapping')
            if key == 'overlays' and cue.get('type') not in ('headline', 'label', 'cta'):
                raise ValueError('Unknown overlay type')
            for option, low, high in [('y', 0.05, .95), ('maxWidth', .1, .95), ('fontSize', 12, 300)]:
                if option in cue and (not number(cue[option]) or not low <= cue[option] <= high):
                    raise ValueError(f'Invalid cue {option}')
            previous_end = b
    if not number(m.get('captionY', .70)) or not .1 <= m.get('captionY', .70) <= .85:
        raise ValueError('captionY must be between .1 and .85')
    return duration


def probe(path):
    return json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)]))


def font_path(m):
    candidates = [m.get('fontPath', ''), '/System/Library/Fonts/Supplemental/Arial Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf']
    return next((p for p in candidates if p and Path(p).is_file()), None)


def overlay_frames(m, directory, duration):
    from PIL import Image, ImageDraw, ImageFont, ImageColor
    width, height, fps = m.get('width', 1080), m.get('height', 1920), m.get('fps', 30)
    font_file = font_path(m)
    if not font_file:
        raise ValueError('No bold font found: provide fontPath')
    accent = ImageColor.getrgb(m.get('accent', '#D8F36A')) + (255,)
    cues = [dict(c, type='caption') for c in m.get('captions', [])] + m.get('overlays', [])
    # Snap cue boundaries to output frames, ensuring no transient overlay flash.
    boundaries = sorted({0, math.ceil(duration * fps), *[round(c[k] * fps) for c in cues for k in ('start', 'end')]})
    records = []
    for index, (start, end) in enumerate(zip(boundaries, boundaries[1:])):
        if end <= start:
            continue
        image = Image.new('RGBA', (width, height))
        draw = ImageDraw.Draw(image)
        for cue in cues:
            if not round(cue['start'] * fps) <= start < round(cue['end'] * fps):
                continue
            kind = cue['type']
            size = round(width * {'caption': .061, 'headline': .059, 'label': .032, 'cta': .044}[kind])
            size = round(cue.get('fontSize', size))
            max_width = width * cue.get('maxWidth', .80)
            max_lines = 3 if kind == 'headline' else 2
            # Wrap by rendered pixel width, then shrink until at most two lines.
            while True:
                font = ImageFont.truetype(font_file, size)
                lines = []
                for paragraph in cue['text'].split('\n'):
                    line = ''
                    for word in paragraph.split():
                        candidate = (line + ' ' + word).strip()
                        if line and draw.textlength(candidate, font=font) > max_width:
                            lines.append(line)
                            line = word
                        else:
                            line = candidate
                    lines.append(line)
                if len(lines) <= max_lines and all(draw.textlength(line, font=font) <= max_width for line in lines):
                    break
                size -= 1
                if size < width * .025:
                    raise ValueError(f'Text too long for two readable lines: {cue["text"]}')
            text = '\n'.join(lines)
            spacing = round(size * .17)
            box = draw.multiline_textbbox((0, 0), text, font=font, spacing=spacing, align='center', stroke_width=0)
            tw, th = box[2] - box[0], box[3] - box[1]
            center_y = height * cue.get('y', {'caption': m.get('captionY', .70), 'headline': .12, 'label': .24, 'cta': .80}[kind])
            x, y = (width - tw) / 2, center_y - th / 2 - box[1]
            pad = width * .025
            if kind in ('cta', 'headline', 'label'):
                fill = accent if kind == 'cta' else (12, 18, 17, 220)
                draw.rounded_rectangle((x-pad, center_y-th/2-pad, x+tw+pad, center_y+th/2+pad), radius=width*.018, fill=fill)
                if kind == 'headline':
                    draw.rounded_rectangle((x-pad, center_y-th/2-pad, x-pad+width*.006, center_y+th/2+pad), radius=3, fill=accent)
            fill = (18, 24, 20, 255) if kind == 'cta' else (255, 252, 241, 255)
            draw.multiline_text((x, y), text, font=font, fill=fill, spacing=spacing, align='center', stroke_width=max(1, round(width*.003)) if kind == 'caption' else 0, stroke_fill=(10, 12, 10, 240))
        filename = directory / f'overlay-{index:04d}.png'
        image.save(filename)
        records += [f"file '{filename.name}'", f'option framerate {fps}', f'duration {(end-start)/fps:.9f}']
    records += [f"file '{filename.name}'", f'option framerate {fps}']
    concat = directory / 'overlays.ffconcat'
    concat.write_text('ffconcat version 1.0\n' + '\n'.join(records) + '\n')
    return concat


def render(m):
    source, output = Path(m['sourcePath']).resolve(), Path(m['outputPath']).resolve()
    if output.exists():
        raise ValueError('Output already exists; choose a new version path')
    info = probe(source)
    duration = validate(m, float(info['format']['duration']))
    if not any(s['codec_type'] == 'audio' for s in info['streams']):
        raise ValueError('Source has no audio stream to preserve')
    width, height, fps = m.get('width', 1080), m.get('height', 1920), m.get('fps', 30)
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='footage-render-') as tmp:
        directory = Path(tmp)
        overlays = overlay_frames(m, directory, duration)
        filters, clips = [], []
        for i, cut in enumerate(m['cuts']):
            a, b = cut['sourceStart'], cut['sourceEnd']
            filters += [f'[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS[v{i}]', f'[0:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS[a{i}]']
            clips += [f'[v{i}][a{i}]']
        filters += [''.join(clips) + f'concat=n={len(clips)}:v=1:a=1[video][audio]', f'[video]scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height},setsar=1,fps={fps}[base]', f'[1:v]fps={fps},format=rgba[graphics]', '[base][graphics]overlay=shortest=1:format=auto,format=yuv420p[outv]', '[audio]loudnorm=I=-16:LRA=11:TP=-1.5,aresample=48000[outa]']
        graph = directory / 'filter.txt'
        graph.write_text(';\n'.join(filters))
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'warning', '-nostdin', '-n', '-threads', '4', '-i', str(source), '-safe', '0', '-f', 'concat', '-i', str(overlays), '-filter_complex_threads', '4', '-filter_complex', graph.read_text(), '-map', '[outv]', '-map', '[outa]', '-t', str(duration), '-c:v', 'libx264', '-threads', '4', '-preset', 'fast', '-crf', '19', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', str(output)], check=True)
    result = probe(output)
    video = next(s for s in result['streams'] if s['codec_type'] == 'video')
    audio = next(s for s in result['streams'] if s['codec_type'] == 'audio')
    if video['codec_name'] != 'h264' or audio['codec_name'] != 'aac' or (video['width'], video['height']) != (width, height):
        raise RuntimeError('Unexpected output codecs/dimensions')
    if abs(float(Fraction(video['avg_frame_rate'])) - fps) > .01:
        raise RuntimeError('Unexpected output frame rate')
    if abs(float(result['format']['duration']) - duration) > max(.15, 2/fps):
        raise RuntimeError('Unexpected output duration')
    print(json.dumps({'outputPath': str(output), 'duration': result['format']['duration'], 'status': 'draft', 'backend': 'ffmpeg-pillow-v1'}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest', type=Path)
    parser.add_argument('--validate-only', action='store_true')
    args = parser.parse_args()
    try:
        manifest = json.loads(args.manifest.read_text())
        duration = validate(manifest)
        if args.validate_only:
            print(f'Valid timeline: {duration:.3f}s (source bounds unchecked)')
        else:
            render(manifest)
    except (ValueError, OSError, subprocess.CalledProcessError) as exc:
        parser.exit(1, f'{exc}\n')
