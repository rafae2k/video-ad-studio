"""Compositor por quadro: sujeito recortado e descido no quadro, lettering gigante ATRÁS da cabeça no terço de cima,
plates de fundo (escuro, bruto desfocado, imagem ou vídeo — de marca ou gerados por IA), props, transição por blur,
grade + vinheta + grão, legenda palavra a palavra e CTA. Tempos do manifest em segundos do bruto; o plano os
converte para frames de saída pelo EDL apertado."""
import math, shutil, subprocess
from pathlib import Path
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
from common import W_, H_, FPS, font, blit, ease, decode, decode_file, build_audio, compress, cap_sprite, read_json, write_json


def eback(x):  # ease-out-back (overshoot)
    x = min(max(x, 0.0), 1.0); c1 = 1.70158; c3 = c1 + 1
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2


def ease_in_out(x): x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)


# ---------------- plano ----------------
def out_mappers(beats, total):
    def out_f(t):
        for bt in beats:
            sp = bt.get('speed', 1.0)
            if bt['src'] - .05 <= t <= bt['src'] + bt['nf'] * sp / FPS + .05:
                return bt['out0'] + max(0, round((t - bt['src']) * FPS / sp))
        later = [bt for bt in beats if bt['src'] > t]
        return later[0]['out0'] if later else total
    def out_end(t):
        prev = [bt for bt in beats if bt['src'] <= t + .05]
        bt = max(prev, key=lambda b: b['src']) if prev else beats[0]
        return bt['out0'] + min(bt['nf'], max(0, round((t - bt['src']) * FPS / bt.get('speed', 1.0))))
    return out_f, out_end


def build_plan(cfg):
    edl = read_json(cfg.EDL); beats, total = edl['beats'], edl['total']
    out_f, out_end = out_mappers(beats, total)
    plan = dict(total=total, beats=beats, caption_groups=edl['caption_groups'])
    plan['plates'] = [dict(p, f0=out_f(p['t0']), f1=out_end(p['t1'])) for p in cfg.PLATES]
    plan['letters'] = [dict(L, f0=out_f(L['t0']), f1=out_end(L['t1'])) for L in cfg.LETTERS]
    plan['props'] = [dict(P, f0=out_f(P['t0']), f1=out_end(P['t1'])) for P in cfg.PROPS]
    plan['cta_f'] = out_f(cfg.CTA_T)
    sfx = []
    for bt in beats:
        if bt['whoosh']: sfx.append(dict(name='whoosh', f=bt['out0'] - 2, vol=.18))
    for p in plan['plates']: sfx.append(dict(name='whoosh', f=p['f0'] - 2, vol=.32))
    for L in plan['letters']: sfx.append(dict(name='pop', f=L['f0'], vol=.3))
    for P in plan['props']: sfx.append(dict(name='pop', f=P['f0'], vol=.35))
    for name, t, vol in cfg.SFX_EXTRA: sfx.append(dict(name=name, f=max(out_f(t), 0), vol=vol))
    sfx.append(dict(name='chime', f=plan['cta_f'], vol=.35))
    plan['sfx'] = sfx
    write_json(cfg.WORK / 'motion_plan.json', plan, indent=1)
    print(f"plano: {total / FPS:.1f}s, {len(plan['plates'])} plates, {len(plan['letters'])} letterings, {len(plan['props'])} props, {len(sfx)} sfx")
    return plan


# ---------------- sprites ----------------
def line_sprite(cfg, text, size, hl=False, color=None):
    color = color or cfg.CREAM
    f = font(cfg.DISPLAY_FONT, size)
    d = ImageDraw.Draw(Image.new('RGBA', (4, 4)))
    w = int(d.textlength(text, font=f)); asc, desc = f.getmetrics()
    pad = 34
    img = Image.new('RGBA', (w + 2 * pad + (30 if hl else 0), asc + desc + 2 * pad), (0, 0, 0, 0))
    dd = ImageDraw.Draw(img)
    if hl:  # marca-texto: barra na cor de destaque cobrindo a altura das letras, texto escuro por cima
        bb = dd.textbbox((pad + 10, pad), text, font=f)
        dd.rectangle((bb[0] - 20, bb[1] - 6, bb[2] + 20, bb[3] + 8), fill=cfg.ACCENT + (255,))
        dd.text((pad + 10, pad), text, font=f, fill=cfg.INK + (255,))
    else:
        dd.text((pad, pad), text, font=f, fill=color + (255,))
    a = np.array(img)
    sh = Image.fromarray((a[..., 3]).astype(np.uint8)).filter(ImageFilter.GaussianBlur(10))
    sh = (np.array(sh).astype(np.float32) * .55).astype(np.uint8)
    out = np.zeros_like(a)
    al = a[..., 3:4].astype(np.float32) / 255
    out[..., :3] = (a[..., :3] * al).astype(np.uint8)
    out[..., 3] = np.maximum(sh * (1 - a[..., 3] // 255), a[..., 3])
    return out


def stack_sprites(cfg, L):
    """Linhas empilhadas: tamanho = min(cap, 660 / nº de linhas), reduzido até caber em 980 px de largura."""
    lines = [l.upper() for l in L['lines']]
    d = ImageDraw.Draw(Image.new('RGBA', (4, 4)))
    cap = L.get('cap', 340); n = len(lines)
    size = min(cap, int(660 / n))
    while size > 60 and max(d.textlength(l, font=font(cfg.DISPLAY_FONT, size)) for l in lines) > 980: size -= 6
    return [line_sprite(cfg, l, size, hl=(L.get('hl') == i), color=cfg.ACCENT if L.get('color') == 'lime' else cfg.CREAM)
            for i, l in enumerate(lines)]


def load_plate_image(path):
    im = Image.open(path).convert('RGB')
    s = max(W_ / im.width, H_ / im.height) * 1.0
    im = im.resize((int(im.width * s) + 1, int(im.height * s) + 1), Image.LANCZOS)
    x0, y0 = (im.width - W_) // 2, (im.height - H_) // 2
    return np.array(im.crop((x0, y0, x0 + W_, y0 + H_)))


def load_prop(path, width):
    im = Image.open(path).convert('RGBA')
    bb = im.getbbox(); im = im.crop(bb) if bb else im  # corta margem transparente
    s = width / im.width
    return np.array(im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS))


def cta_button(cfg, text):
    f = font(cfg.SANS_FONT, 52, 'Bold')
    d = ImageDraw.Draw(Image.new('RGBA', (4, 4)))
    tw = int(d.textlength(text, font=f)); h = 128; w = tw + 56 + 110 + 40
    img = Image.new('RGBA', (w + 40, h + 40), (0, 0, 0, 0)); dd = ImageDraw.Draw(img)
    dd.rounded_rectangle((20, 20, 20 + w, 20 + h), radius=30, fill=cfg.ACCENT + (255,))
    dd.text((20 + 44, 20 + h / 2), text, font=f, fill=cfg.INK + (255,), anchor='lm')
    cx = 20 + w - 20 - 44
    dd.ellipse((cx - 44, 20 + h / 2 - 44, cx + 44, 20 + h / 2 + 44), fill=(40, 44, 0, 255))
    dd.line((cx - 16, 20 + h / 2 + 16, cx + 16, 20 + h / 2 - 16), fill=cfg.ACCENT + (255,), width=8)
    dd.line((cx - 2, 20 + h / 2 - 16, cx + 16, 20 + h / 2 - 16, cx + 16, 20 + h / 2 + 2), fill=cfg.ACCENT + (255,), width=8)
    a = np.array(img); sh = np.array(Image.fromarray(a[..., 3]).filter(ImageFilter.GaussianBlur(14))).astype(np.float32) * .5
    out = a.copy(); out[..., 3] = np.maximum(a[..., 3], sh.astype(np.uint8))
    m = a[..., 3:4].astype(np.float32) / 255; out[..., :3] = (a[..., :3] * m).astype(np.uint8)
    return out


# ---------------- render ----------------
def render(cfg, preview=None, force=False):
    if not preview and cfg.OUT.exists() and not force:
        raise SystemExit(f'saída já existe: {cfg.OUT} — use outro "output" no manifest ou --force')
    plan = read_json(cfg.WORK / 'motion_plan.json'); total = plan['total']
    masks = np.load(cfg.MASKS, mmap_mode='r')
    f_lo, f_hi = (0, total) if not preview else preview
    vid = cfg.WORK / ('m_preview.mp4' if preview else 'm_video.mp4')
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W_}x{H_}', '-r', str(FPS), '-i', '-',
                            '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', str(vid)], stdin=subprocess.PIPE)
    yy, xx = np.mgrid[0:H_, 0:W_].astype(np.float32)
    vign = (1 - .26 * (((xx - W_ / 2) / (W_ * .72)) ** 2 + ((yy - H_ * .5) / (H_ * .68)) ** 2)).clip(.5, 1)[..., None]
    topgrad = (1 - .50 * np.clip(1 - yy / (H_ * .46), 0, 1) ** 1.2)[..., None]
    dark_plate = np.zeros((H_, W_, 3), np.float32) + np.float32(cfg.INK)
    r2 = ((xx - W_ / 2) / (W_ * .65)) ** 2 + ((yy - H_ * .62) / (H_ * .38)) ** 2
    dark_plate += (np.exp(-r2)[..., None] * 0.13 * np.float32(cfg.ACCENT))
    dark_plate = dark_plate.astype(np.float32)
    rng = np.random.default_rng(11)
    FY, DY = cfg.FACE_Y, cfg.DEST_Y
    cache = {}
    def get(key, fn):
        if key not in cache: cache[key] = fn()
        return cache[key]
    vit = {}  # iteradores de vídeo por plate
    beat_of = np.zeros(total, int)
    for i, bt in enumerate(plan['beats']): beat_of[bt['out0']:bt['out0'] + bt['nf']] = i
    cap_by_f = {}
    for g in plan['caption_groups']:
        words = [c['word'] for c in g]
        for j, c in enumerate(g):
            nxt = g[j + 1]['f'] if j + 1 < len(g) else None
            for f in range(c['f'], (nxt if nxt else c['f'] + 12)):
                cap_by_f[f] = (words, j, f - c['f'])
    first = beat_of[f_lo]
    for bi in range(first, len(plan['beats'])):
        bt = plan['beats'][bi]
        if bt['out0'] >= f_hi: break
        for i, fr in enumerate(decode(cfg, bt['src'], bt['nf'], bt.get('speed', 1.0))):
            of = bt['out0'] + i
            if of < f_lo or of >= f_hi: continue
            # ---- transform do sujeito (desce no quadro, escala por beat) ----
            ez = ease(i / 5)
            s = (1 + (bt['zoom'] - 1) * .55) * (1 + .03 * i / bt['nf'])
            if bt['punch']: s *= 1 + .07 * (1 - ez)
            ty = DY * H_ - s * FY * H_
            M = np.float32([[s, 0, W_ * (1 - s) / 2], [0, s, ty]])
            Mm = np.float32([[2 * s, 0, W_ * (1 - s) / 2], [0, 2 * s, ty]])
            subj = cv2.warpAffine(fr, M, (W_, H_), flags=cv2.INTER_LINEAR)
            m = cv2.warpAffine(np.ascontiguousarray(masks[of]).astype(np.float32) / 255, Mm, (W_, H_), flags=cv2.INTER_LINEAR)
            # ---- plate ----
            pl = next((p for p in plan['plates'] if p['f0'] <= of < p['f1']), None)
            full = bool(pl and pl.get('full'))
            kind = pl['kind'] if pl else cfg.DEFAULT_PLATE
            k_in = (of - pl['f0']) if pl else 999
            dur = (pl['f1'] - pl['f0']) if pl else 1
            if kind == 'dark':
                bg = dark_plate.copy()
            elif kind == 'orig':
                small = cv2.resize(fr, (270, 480), interpolation=cv2.INTER_AREA)
                small = cv2.GaussianBlur(small, (0, 0), 4)
                Ms = np.float32([[s, 0, 135 * (1 - s)], [0, s, DY * 480 - s * FY * 480]])
                bg = cv2.warpAffine(small, Ms, (270, 480), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
                bg = cv2.resize(bg, (W_, H_), interpolation=cv2.INTER_LINEAR).astype(np.float32) * .62
            else:
                if kind == 'image':
                    arr = get(('img', pl['file']), lambda: load_plate_image(pl['file']))
                    kz = 1 + pl.get('zoom', .12) * (k_in / max(1, dur))
                    Mk = np.float32([[kz, 0, W_ * (1 - kz) / 2 + pl.get('pan', 0) * k_in], [0, kz, H_ * (1 - kz) / 2]])
                    bg = cv2.warpAffine(arr, Mk, (W_, H_), flags=cv2.INTER_LINEAR).astype(np.float32)
                else:  # video
                    key = (pl['file'], pl['f0'])
                    if key not in vit:
                        vit[key] = [decode_file(Path(pl['file']), pl['f1'] - pl['f0'] + 2, pl.get('ss', .4)), None]
                    nf_ = next(vit[key][0], None)
                    if nf_ is not None: vit[key][1] = nf_
                    arr = vit[key][1] if vit[key][1] is not None else np.zeros((H_, W_, 3), np.uint8)
                    kz = 1 + pl.get('zoom', .06) * (k_in / max(1, dur))
                    Mk = np.float32([[kz, 0, W_ * (1 - kz) / 2], [0, kz, H_ * (1 - kz) / 2]])
                    bg = cv2.warpAffine(arr, Mk, (W_, H_), flags=cv2.INTER_LINEAR).astype(np.float32)
                bg = bg * pl.get('dim', .78)
            if not full: bg = bg * topgrad
            img = np.clip(bg, 0, 255).astype(np.uint8)
            # ---- lettering atrás do sujeito ----
            for L in plan['letters']:
                if not (L['f0'] <= of < L['f1']): continue
                sp = get(('L', tuple(L['lines']), L.get('hl'), L.get('color')), lambda L=L: stack_sprites(cfg, L))
                lh = [x.shape[0] - 40 for x in sp]
                tot = sum(lh); yc = L.get('y', .26) * H_
                y_ = yc - tot / 2
                for li, sprt in enumerate(sp):
                    age = of - L['f0'] - 3 * li; left = L['f1'] - of
                    pin = eback(age / 9); alpha_in = min(1, max(0, age / 4)); pout = ease(left / 7)
                    anim = L.get('anim', 'rise')
                    if anim == 'slam': sc = 1 + (1.25 - 1) * (1 - ease(age / 7)); tx = 0; ty_ = 0; blur = max(0, 1 - age / 7) * 10
                    elif anim == 'slide': sc = 1; tx = (1 - ease(age / 9)) * (-420 if li % 2 == 0 else 420); ty_ = 0; blur = (1 - ease(age / 9)) * 16
                    else: sc = 1 + .45 * (1 - pin); tx = 0; ty_ = (1 - pin) * 80; blur = (1 - ease(age / 9)) * 14
                    sc *= 1 + .004 * max(0, age) / 3
                    ty_ -= (1 - pout) * 46; blur += (1 - pout) * 14
                    cy_ = y_ + lh[li] / 2 + ty_
                    blit(img, sprt, W_ / 2 + tx, cy_, sc, alpha_in * pout, blur=blur)
                    y_ += lh[li]
            # ---- props ----
            def draw_props(layer):
                for P in plan['props']:
                    if P.get('layer', 'front') != layer or not (P['f0'] <= of < P['f1']): continue
                    spr = get(('P', P['file'], P['w']), lambda P=P: load_prop(P['file'], int(P['w'] * W_)))
                    age = of - P['f0']; left = P['f1'] - of
                    pin = eback(age / 10); pout = ease(left / 6)
                    sc = max(.05, pin) * (1 + .02 * math.sin(age / 6))
                    rot = (1 - ease(age / 12)) * P.get('rot0', 14) + P.get('rot', 0)
                    S = spr
                    if abs(rot) > .3:
                        h_, w_ = spr.shape[:2]
                        Mr = cv2.getRotationMatrix2D((w_ / 2, h_ / 2), rot, 1.0)
                        S = cv2.warpAffine(spr, Mr, (w_, h_), flags=cv2.INTER_LINEAR, borderValue=(0, 0, 0, 0))
                    cx_, cy_ = P['x'] * W_, P['y'] * H_ + (1 - pin) * 160 - (1 - pout) * 90
                    blit(img, S, cx_ + 10, cy_ + 18, sc, .35 * pout, blur=18)  # sombra
                    blit(img, S, cx_, cy_, sc, pout)
            draw_props('back')
            # ---- sujeito por cima (máscara) ----
            if not full:
                sh = cv2.GaussianBlur(m, (0, 0), 22) * .30
                img = (img.astype(np.float32) * (1 - sh[..., None])).astype(np.uint8)
                mm = m[..., None]
                img = (img.astype(np.float32) * (1 - mm) + subj.astype(np.float32) * mm).astype(np.uint8)
            draw_props('front')
            # ---- transição por blur na troca de plate ----
            kk = k_in
            if pl and kk < 3 and dur > 24:
                img = cv2.GaussianBlur(img, (0, 0), 9 * (1 - kk / 3) + .1)
            elif pl and (pl['f1'] - of) <= 3 and dur > 24:
                img = cv2.GaussianBlur(img, (0, 0), 4 * (4 - (pl['f1'] - of)) + .1)
            # ---- grade + vinheta + grão ----
            im = img.astype(np.float32)
            im = ((im - 128) * 1.07 + 129) * vign + rng.normal(0, 2.4, (H_, W_, 1)).astype(np.float32)
            img = np.clip(im, 0, 255).astype(np.uint8)
            # ---- legenda pequena embaixo ----
            c = cap_by_f.get(of)
            if c:
                words, j, age = c
                cyc = .80 * H_
                prev = get(('cap', tuple(words), j - 1), lambda: cap_sprite(cfg, words, j - 1)) if j > 0 else None
                now = get(('cap', tuple(words), j), lambda: cap_sprite(cfg, words, j))
                pin = ease(age / 5)
                if prev is not None: blit(img, prev, W_ / 2, cyc, .82, 1)
                sc = min(1, 1000 / now.shape[1]) * .82
                blit(img, now, W_ / 2, cyc + (1 - pin) * 10, sc, pin, blur=(1 - pin) * 7)
            # ---- CTA ----
            if of >= plan['cta_f']:
                age = of - plan['cta_f']
                btn = get(('cta',), lambda: cta_button(cfg, cfg.CTA))
                blit(img, btn, W_ / 2, .865 * H_, ease(age / 8) * (1 + .02 * math.sin(age / 5)), ease(age / 6))
            enc.stdin.write(img.tobytes())
        print(f'render: beat {bi + 1}/{len(plan["beats"])}', flush=True)
    enc.stdin.close(); enc.wait()
    audio = cfg.WORK / 'm_audio.wav'
    build_audio(cfg, plan, audio)
    final = cfg.WORK / ('m_preview_final.mp4' if preview else 'm_final.mp4')
    af = ['-ss', f'{f_lo / FPS}', '-t', f'{(f_hi - f_lo) / FPS}'] if preview else []
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(vid), *af, '-i', str(audio),
                    '-af', 'loudnorm=I=-15:LRA=9:TP=-1.5,aresample=48000', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
                    '-movflags', '+faststart', '-shortest', str(final)], check=True)
    if preview:
        print('preview', final); return
    cfg.OUT.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(final, cfg.OUT)
    if cfg.OUT_SMALL: compress(final, cfg.OUT_SMALL, cfg.OUT_SMALL_MB)
    print('saved', cfg.OUT, cfg.OUT_SMALL or '')
