# Footage draft renderer

Independent FFmpeg/Pillow backend for an existing talking-head video with its original audio. This is **not** the Canvas manifest contract and does not claim preview/export parity. Outputs remain drafts requiring full audiovisual and human review; this script never records `finals[]`.

Requires Python with Pillow, FFmpeg/libx264/AAC and FFprobe. The local FFmpeg lacks libass and drawtext, so text is rendered into transparent PNGs with Pillow, assembled as a sparse timed overlay stream. No external service or media generation is used.

```sh
python3 scripts/render-footage.py path/to/edit.json --validate-only
python3 scripts/render-footage.py path/to/edit.json
```

If system Python lacks Pillow, install it (`pip install pillow`) or point to any Python 3 that has it:

```sh
python3 scripts/render-footage.py path/to/edit.json
```

Example schema (paths relative to working directory):

```json
{
  "sourcePath": "storage/source.mp4",
  "outputPath": "storage/exports/example/draft-v1.mp4",
  "width": 1080,
  "height": 1920,
  "fps": 30,
  "fontPath": "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
  "accent": "#D8F36A",
  "captionY": 0.70,
  "cuts": [{"sourceStart": 1, "sourceEnd": 5}, {"sourceStart": 10, "sourceEnd": 12}],
  "captions": [{"start": 0, "end": 2, "text": "Transcrição revisada."}],
  "overlays": [{"start": 0, "end": 2, "type": "headline", "text": "Hook aprovado", "y": 0.12, "fontSize": 64, "maxWidth": 0.8}]
}
```

All cue times are seconds on the **concatenated output**. End times are exclusive, snapped to the nearest output frame. Cuts are source times, can reorder footage, and must fit source duration. Captions must be ordered and cannot overlap. Optional cue `y` is center as height fraction; `fontSize` is pixels; `maxWidth` is width fraction. Text wraps by actual font metrics and shrinks when necessary: maximum two lines for captions, labels and CTA, three for headline. Long copy that cannot fit legibly fails. Inspect all text at mobile size and avoid simultaneous CTA/caption collisions. Lime is a neutral draft accent, not a verified brand token.

The video center-crops to fill the output; inspect framing before use. Original voice is cut with matching source times and loudness-normalized to -16 LUFS, -1.5 dBTP (single-pass FFmpeg loudnorm, not a guarantee of measured integrated output). No narration, music, speed changes, invented claims or fades are added. H.264 yuv420p / AAC 192k, faststart; encoding and filtering use four threads. An existing output is never overwritten. FFprobe checks output duration, codecs and dimensions; these checks do not replace listening and visual QA. `--validate-only` validates timeline structure but does not inspect source bounds or files.

Tests: `python3 -m unittest discover -s scripts -p 'test_render_footage.py'`.
