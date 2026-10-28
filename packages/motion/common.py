"""Primitivas compartilhadas do backend motion-matte: config, fontes, sprites, decode, áudio e compressão.

Extraído sem mudança de comportamento do compositor que gerou a v5 do exemplo do README. Constantes de
quadro (1080x1920, 30 fps) são fixas neste backend; máscaras são calculadas a 540x960 e ampliadas 2x.
"""
import json, os, subprocess, wave
from pathlib import Path
from types import SimpleNamespace
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W_, H_, FPS = 1080, 1920, 30
ROOT = Path(__file__).resolve().parents[2]

DEFAULTS = dict(
    layout=dict(faceY=.36, destY=.53, defaultPlate='orig'),
    brand=dict(accent=[213, 229, 0], cream=[245, 242, 235], ink=[22, 22, 22],
               fonts=dict(display='~/Library/Fonts/CremeGlaceeInkBleed-Regular.otf', sans='/System/Library/Fonts/SFNS.ttf')),
    captions=dict(properNouns={}),
    plates=[], letters=[], props=[], sfxExtra=[],
)


def read_json(path): return json.loads(Path(path).read_text(encoding='utf-8'))


def write_json(path, obj, indent=None):
    Path(path).write_text(json.dumps(obj, ensure_ascii=False, indent=indent), encoding='utf-8')


def _path(p):
    if p is None: return None
    p = Path(os.path.expanduser(str(p)))
    return p if p.is_absolute() else ROOT / p


def load_cfg(path):
    """Lê o manifest JSON e devolve um namespace com caminhos absolutos e defaults preenchidos."""
    raw = json.loads(Path(path).read_text(encoding='utf-8'))
    if raw.get('backend') != 'motion-matte-v1':
        raise SystemExit(f'{path}: backend precisa ser "motion-matte-v1"')
    for k, v in DEFAULTS.items():
        if isinstance(v, dict):
            merged = {**v, **raw.get(k, {})}
            if k == 'brand': merged['fonts'] = {**v['fonts'], **raw.get('brand', {}).get('fonts', {})}
            raw[k] = merged
        else:
            raw.setdefault(k, v)
    work = _path(raw['work'])
    small = raw.get('outputSmall')
    fonts = raw['brand']['fonts']
    cfg = SimpleNamespace(
        raw=raw, ID=raw['id'],
        SRC=_path(raw['source']), TRANSCRIPT=_path(raw.get('transcript')),
        WORK=work, EDL_RAW=work / 'edl.json', EDL=work / 'edl-tight.json', MASKS=work / 'masks_rvm.npy',
        OUT=_path(raw['output']), OUT_SMALL=_path(small['path']) if small else None,
        OUT_SMALL_MB=(small or {}).get('maxMB', 9.6),
        FACE_Y=raw['layout']['faceY'], DEST_Y=raw['layout']['destY'], DEFAULT_PLATE=raw['layout']['defaultPlate'],
        ACCENT=tuple(raw['brand']['accent']), CREAM=tuple(raw['brand']['cream']), INK=tuple(raw['brand']['ink']),
        DISPLAY_FONT=str(_path(os.environ.get('MOTION_DISPLAY_FONT', fonts['display']))),
        SANS_FONT=str(_path(os.environ.get('MOTION_SANS_FONT', fonts['sans']))),
        PROPER=raw['captions']['properNouns'],
        PLATES=[dict(p, file=str(_path(p['file'])) if p.get('file') else None) for p in raw['plates']],
        LETTERS=raw['letters'],
        PROPS=[dict(p, file=str(_path(p['file']))) for p in raw['props']],
        CTA=raw['cta']['text'], CTA_T=raw['cta']['t'],
        SFX_EXTRA=[(s['name'], s['t'], s['vol']) for s in raw['sfxExtra']],
        EDL_SPEC=raw.get('edl', {}),
    )
    for name in ('DISPLAY_FONT', 'SANS_FONT'):
        if not Path(getattr(cfg, name)).exists():
            raise SystemExit(f'fonte ausente: {getattr(cfg, name)} — ajuste brand.fonts no manifest ou MOTION_{name.split("_")[0]}_FONT')
    work.mkdir(parents=True, exist_ok=True)
    return cfg


# ---------------- fontes / sprites ----------------
_fc = {}
def font(path, size, var=None):
    k = (path, size, var)
    if k not in _fc:
        f = ImageFont.truetype(path, size)
        if var:
            try: f.set_variation_by_name(var)
            except Exception: pass
        _fc[k] = f
    return _fc[k]


def ease(x): x = min(max(x, 0.0), 1.0); return 1 - (1 - x) ** 3
def lerp(a, b, t): return a + (b - a) * t


def blit(frame, spr, cx, cy, scale=1.0, alpha=1.0, blur=0.0, hide=None):
    if alpha <= 0.002: return
    h, w = spr.shape[:2]
    nw, nh = max(2, int(w * scale)), max(2, int(h * scale))
    s = cv2.resize(spr, (nw, nh), interpolation=cv2.INTER_LINEAR) if scale != 1 else spr
    if blur > .3:
        k = int(blur * 3) | 1
        s = cv2.GaussianBlur(s, (k, k), blur)
    x0, y0 = int(cx - nw / 2), int(cy - nh / 2)
    X0, Y0, X1, Y1 = max(x0, 0), max(y0, 0), min(x0 + nw, W_), min(y0 + nh, H_)
    if X1 <= X0 or Y1 <= Y0: return
    s = s[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0]
    a = (s[..., 3:4].astype(np.float32) / 255) * alpha
    if hide is not None: a = a * (1 - hide[Y0:Y1, X0:X1, None])
    reg = frame[Y0:Y1, X0:X1].astype(np.float32)
    frame[Y0:Y1, X0:X1] = (reg * (1 - a) + s[..., :3].astype(np.float32) * a).astype(np.uint8)


def cap_sprite(cfg, words, upto):
    """legenda: palavra-chave (maior) na fonte display; apoio em sans."""
    key = max(range(len(words)), key=lambda i: (len(words[i]), i))
    if len(words[key]) < 5: key = len(words) - 1
    fs = [font(cfg.DISPLAY_FONT, 92) if i == key else font(cfg.SANS_FONT, 56, 'Semibold') for i in range(len(words))]
    d = ImageDraw.Draw(Image.new('RGBA', (4, 4)))
    txt = [w.upper() if i == key else cfg.PROPER.get(w.lower(), w.lower()) for i, w in enumerate(words)]
    ws = [d.textlength(t + ' ', font=fs[i]) for i, t in enumerate(txt)]
    tw = int(sum(ws)); base = 120
    img = Image.new('RGBA', (tw + 70, base + 50), (0, 0, 0, 0)); dd = ImageDraw.Draw(img)
    x = 35
    for i, t in enumerate(txt):
        if i <= upto:
            col = (252, 232, 220) if i == key else (246, 246, 250)
            dd.text((x + 3, base + 3), t, font=fs[i], fill=(0, 0, 0, 120), anchor='ls')
            dd.text((x, base), t, font=fs[i], fill=col + (255,), anchor='ls')
        x += ws[i]
    return np.array(img.filter(ImageFilter.GaussianBlur(.4)))


# ---------------- decode ----------------
def _stop(p):
    """Encerra o ffmpeg de leitura antes de fechar o pipe, para ele não escrever num pipe fechado."""
    if p.poll() is None: p.kill()
    p.stdout.close(); p.wait()


def decode(cfg, a, nf, speed=1.0):
    cmd = ['ffmpeg', '-v', 'error', '-nostdin', '-ss', f'{a:.3f}', '-i', str(cfg.SRC), '-t', f'{nf * speed / FPS + .2:.3f}',
           '-vf', f'setpts=PTS/{speed},fps={FPS},scale={W_}:{H_}', '-frames:v', str(nf), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    n = W_ * H_ * 3
    try:
        for _ in range(nf):
            buf = p.stdout.read(n)
            if len(buf) < n: break
            yield np.frombuffer(buf, np.uint8).reshape(H_, W_, 3)
    finally:
        _stop(p)


def decode_file(path, nf, ss=.4):
    cmd = ['ffmpeg', '-v', 'error', '-nostdin', '-ss', str(ss), '-i', str(path), '-vf',
           f'fps={FPS},scale={W_}:{H_}:force_original_aspect_ratio=increase,crop={W_}:{H_}', '-frames:v', str(nf), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    n = W_ * H_ * 3
    try:
        for _ in range(nf):
            buf = p.stdout.read(n)
            if len(buf) < n: break
            yield np.frombuffer(buf, np.uint8).reshape(H_, W_, 3).copy()
    finally:
        _stop(p)


# ---------------- áudio ----------------
def load_sfx(root=ROOT):
    out = {}
    for n in ['whoosh', 'pop', 'click', 'impact', 'riser', 'chime']:
        w = wave.open(str(root / f'assets/sfx/{n}.wav'))
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
        out[n] = x / max(np.abs(x).max(), 1e-6)
    return out


def clean_voice(x, sr):
    """Filtro de sopro (plosivas/vento no mic) + expansor para respiração. x: float32 mono."""
    from scipy.signal import butter, sosfilt
    hp = sosfilt(butter(4, 90, 'hp', fs=sr, output='sos'), x)
    hp2 = sosfilt(butter(4, 280, 'hp', fs=sr, output='sos'), hp)
    h = int(.01 * sr); n = len(x) // h
    def envdb(y): return 20 * np.log10(np.sqrt((y[:n * h].reshape(n, h) ** 2).mean(1)) + 1e-7)
    low = envdb(sosfilt(butter(2, [40, 180], 'bp', fs=sr, output='sos'), x))
    mid = envdb(sosfilt(butter(2, [400, 3500], 'bp', fs=sr, output='sos'), x))
    pl = ((low - mid > 10) & (low > -32)).astype(np.float32)
    pl = np.convolve(pl, np.ones(5), 'same').clip(0, 1)            # +-20ms
    pl = np.convolve(pl, np.hanning(5) / np.hanning(5).sum(), 'same')
    pl = np.repeat(pl, h)[:len(x)]; pl = np.pad(pl, (0, len(x) - len(pl)))
    y = hp * (1 - pl) + hp2 * pl * .7
    # expansor descendente: respiração/ruído de sala abaixo de -38 dB cai até -24 dB
    lv = envdb(y); thr, ratio, floor = -38., 3., -24.
    g = np.clip((lv - thr) * (ratio - 1), floor, 0)
    g = np.concatenate([g[2:], [0, 0]])                              # lookahead 20ms
    for i in range(1, len(g)):                                       # ataque rápido, release lento
        g[i] = g[i - 1] + (g[i] - g[i - 1]) * (.6 if g[i] > g[i - 1] else .12)
    gs = np.repeat(10 ** (g / 20), h)[:len(y)]; gs = np.pad(gs, (0, len(y) - len(gs)), constant_values=1)
    print(f'áudio: {pl.mean() * 100:.1f}% do tempo com sopro filtrado', flush=True)
    return (y * gs).astype(np.float32)


def stretch(c, sp, sr):
    if sp == 1: return c
    r = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(sr), '-ac', '1', '-i', '-', '-af', f'atempo={sp}', '-f', 'f32le', '-'],
                       input=c.astype(np.float32).tobytes(), capture_output=True).stdout
    return np.frombuffer(r, np.float32).copy()


def build_audio(cfg, plan, path):
    """Voz original limpa, cortada por beat (fade de 6 ms em cada junção) + SFX do plano."""
    sr = 44100
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(cfg.SRC), '-vn', '-ac', '1', '-ar', str(sr), '-f', 's16le', '-'], capture_output=True).stdout
    src = clean_voice(np.frombuffer(raw, np.int16).astype(np.float32) / 32768, sr)
    fade = int(.006 * sr); chunks = []
    for bt in plan['beats']:
        sp = bt.get('speed', 1.0)
        a = int(bt['src'] * sr); n = int(round(bt['nf'] / FPS * sr))
        c = stretch(src[a:a + int(n * sp) + 2048].copy(), sp, sr)[:n]
        if len(c) < n: c = np.pad(c, (0, n - len(c)))
        c[:fade] *= np.linspace(0, 1, fade); c[-fade:] *= np.linspace(1, 0, fade)
        chunks.append(c)
    mix = np.concatenate(chunks)
    sfx = load_sfx()
    for s in plan['sfx']:
        x = sfx[s['name']] * s['vol'] * .55
        st = int(max(s['f'], 0) / FPS * sr); end = min(st + len(x), len(mix))
        if st < len(mix): mix[st:end] += x[:end - st]
    mix = np.clip(mix, -1, 1)
    w = wave.open(str(path), 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
    w.writeframes((mix * 32767).astype(np.int16).tobytes()); w.close()


def compress(src, dst, max_mb=9.6):
    """Cópia 720x1280 em dois passes, para caber no limite de upload (ex.: 10 MB)."""
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(src)]))
    abr = 96
    vbr = int((max_mb * 8 * 1024 * 1024 / dur) / 1000 - abr - 8)
    Path(dst).parent.mkdir(parents=True, exist_ok=True)
    tmp = Path(dst).parent / '.ffpass'
    base = ['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-vf', 'scale=720:1280:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow',
            '-b:v', f'{vbr}k', '-maxrate', f'{int(vbr * 1.35)}k', '-bufsize', f'{vbr * 2}k', '-pix_fmt', 'yuv420p']
    subprocess.run(base + ['-pass', '1', '-passlogfile', str(tmp), '-an', '-f', 'null', '/dev/null'], check=True)
    subprocess.run(base + ['-pass', '2', '-passlogfile', str(tmp), '-c:a', 'aac', '-b:a', f'{abr}k', '-ac', '1', '-movflags', '+faststart', str(dst)], check=True)
    for p in Path(dst).parent.glob('.ffpass*'): p.unlink()
    mb = Path(dst).stat().st_size / 1024 / 1024
    print(f'compress: {vbr}k video → {mb:.2f} MB')
