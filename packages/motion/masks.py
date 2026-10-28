"""Máscara de pessoa por quadro de saída com RVM (Robust Video Matting, resnet50), na ordem dos beats do EDL apertado.

Saída: masks_rvm.npy (total, 960, 540) uint8. O estado recorrente do RVM é reiniciado a cada beat, porque cada
beat é um trecho contíguo do bruto. Os pesos vêm do torch.hub (PeterL1n/RobustVideoMatting, GPL-3.0) na
primeira execução; o código do modelo não é copiado para este repositório.
"""
import subprocess
import numpy as np, cv2
from common import FPS, _stop, read_json

W, H = 540, 960


def decode_small(cfg, a, nf, sp=1.0):
    cmd = ['ffmpeg', '-v', 'error', '-nostdin', '-ss', f'{a:.3f}', '-i', str(cfg.SRC), '-t', f'{nf * sp / FPS + .2:.3f}',
           '-vf', f'setpts=PTS/{sp},fps={FPS},scale={W}:{H}', '-frames:v', str(nf), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE); n = W * H * 3
    try:
        for _ in range(nf):
            b = p.stdout.read(n)
            if len(b) < n: break
            yield np.frombuffer(b, np.uint8).reshape(H, W, 3)
    finally:
        _stop(p)


def build_masks(cfg):
    import torch
    edl = read_json(cfg.EDL); total = edl['total']
    dev = 'mps' if torch.backends.mps.is_available() else ('cuda' if torch.cuda.is_available() else 'cpu')
    model = torch.hub.load('PeterL1n/RobustVideoMatting', 'resnet50', trust_repo=True).eval().to(dev)
    mm = np.lib.format.open_memmap(cfg.MASKS, mode='w+', dtype=np.uint8, shape=(total, H, W))
    with torch.no_grad():
        for bi, bt in enumerate(edl['beats']):
            rec = [None] * 4
            for i, fr in enumerate(decode_small(cfg, bt['src'], bt['nf'], bt.get('speed', 1.0))):
                t = torch.from_numpy(fr.copy()).permute(2, 0, 1)[None].float().div(255).to(dev)
                _, pha, *rec = model(t, *rec, downsample_ratio=.5)
                a = pha[0, 0].cpu().numpy()
                mm[bt['out0'] + i] = (cv2.GaussianBlur(a, (0, 0), 1.0) * 255).astype(np.uint8)
            print(f'máscaras: beat {bi + 1}/{len(edl["beats"])} ({dev})', flush=True)
    mm.flush()
