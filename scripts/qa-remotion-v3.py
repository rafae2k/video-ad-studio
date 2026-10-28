#!/usr/bin/env python3
"""Technical-only checks for the shared-body V3 draft exports."""
import hashlib
import json
from pathlib import Path
import re
import subprocess
from datetime import datetime, timezone

ROOT=Path(__file__).resolve().parents[1]

def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda:source.read(1024*1024),b''):h.update(block)
    return h.hexdigest()

rows=[]
for variant in ['depth','split','paper']:
    file=ROOT/f'storage/exports/david-pronunciamento-black/v3-{variant}.mp4'
    data=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(file)]))
    v=next(s for s in data['streams'] if s['codec_type']=='video');a=next(s for s in data['streams'] if s['codec_type']=='audio')
    decoded=subprocess.run(['ffmpeg','-hide_banner','-v','error','-threads','4','-i',str(file),'-f','null','-'],capture_output=True,text=True)
    meter=subprocess.run(['ffmpeg','-hide_banner','-threads','4','-i',str(file),'-vn','-af','loudnorm=I=-16:LRA=11:TP=-1:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
    levels=json.loads(re.findall(r'\{\s*"input_i"[\s\S]*?\}',meter.stderr)[-1])
    checks=dict(videoCodec=v['codec_name']=='h264',audioCodec=a['codec_name']=='aac',dimensions=(v['width'],v['height'])==(1080,1920),fps=v['avg_frame_rate']=='30/1',frames=v.get('nb_frames')=='1833',videoDuration=abs(float(v['duration'])-61.1)<.001,audioDuration=abs(float(a['duration'])-61.1)<.03,decode=decoded.returncode==0 and not decoded.stderr.strip())
    row=dict(variant=variant,path=str(file.relative_to(ROOT)),bytes=file.stat().st_size,sha256=sha(file),checks=checks,technicalPass=all(checks.values()),video={k:v.get(k) for k in ['codec_name','width','height','avg_frame_rate','nb_frames','duration','pix_fmt']},audio={k:a.get(k) for k in ['codec_name','sample_rate','channels','duration']},loudnessInput={k:levels[k] for k in ['input_i','input_tp','input_lra']},decodeErrors=decoded.stderr)
    rows.append(row);print(json.dumps(row),flush=True)
report=dict(checkedAt=datetime.now(timezone.utc).isoformat(),scope='Technical only; human approval and audiovisual review separate',copySource='packages/remotion/public/mastercopy-v3.mp4',copySourceSha256=sha(ROOT/'packages/remotion/public/mastercopy-v3.mp4'),exports=rows)
output=ROOT/'projects/david-pronunciamento-black/reviews/v3-technical-qa.json';output.write_text(json.dumps(report,indent=2)+'\n');print(output)
if not all(r['technicalPass'] for r in rows):raise SystemExit(1)
