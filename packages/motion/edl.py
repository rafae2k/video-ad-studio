"""EDL a partir da transcrição: takes escolhidos → beats (jump cuts nas pausas) → grupos de legenda; e o aperto
de silêncio por envelope RMS. Saída em frames a 30 fps; `src` em segundos do bruto."""
import re, subprocess
import numpy as np
from common import FPS, read_json, write_json


def words(cfg):
    d = read_json(cfg.TRANSCRIPT)['words']
    return [(w['start'] / 1000, w['end'] / 1000, w['text']) for w in d]


def build_edl(cfg, W=None):
    """Cada take [início, fim, hold] vira beats: corte em pausa > 0,2 s e corte extra no meio de trechos > 2,6 s
    (sem remover tempo). `hold` mantém o take inteiro, sem cortes nem zoom, e o protege do aperto."""
    spec = cfg.EDL_SPEC
    takes, zooms, fix = spec['takes'], spec['zooms'], spec.get('wordFixes', {})
    overrides = spec.get('wordOverrides', [])
    W = words(cfg) if W is None else W
    beats, caps, t_out = [], [], 0
    zi, last_zoom_t = -1, -9
    for ti, (a, b, hold) in enumerate(takes):
        ws = [w for w in W if w[0] >= a - .02 and w[1] <= b + .02]
        for o in overrides:  # palavra que o ASR errou/omitiu dentro do take: troca [from, to) pela lista dada
            if a - .02 <= o['from'] <= b + .02:
                ws = sorted([tuple(x) for x in o['words']] + [w for w in ws if not (o['from'] <= w[0] < o['to'])])
        segs, cur = [], [ws[0]]
        for w in ws[1:]:
            if w[0] - cur[-1][1] > (9 if hold else .2) and cur[-1][1] - cur[0][0] >= .45:
                segs.append(cur); cur = []
            cur.append(w)
        segs.append(cur)
        cont, out_segs = set(), []
        for s in segs:
            while not hold and s[-1][1] - s[0][0] > 2.6:
                mid = (s[0][0] + s[-1][1]) / 2
                cand = [i for i in range(1, len(s)) if abs(s[i][0] - mid) < (s[-1][1] - s[0][0]) * .22]
                k = max(cand, key=lambda i: s[i][0] - s[i - 1][1]) if cand else len(s) // 2
                out_segs.append(s[:k]); cont.add(len(out_segs) - 1); s = s[k:]
            out_segs.append(s)
        segs = out_segs
        for si, s in enumerate(segs):
            sa, sb = s[0][0], s[-1][1]
            prev = max([e for _, e, _ in W if e <= sa + .001 and (_, e, _) not in s] or [0])
            nxt = min([st for st, _, _ in W if st >= sb - .001 and st > s[-1][0]] or [1e9])
            ss = max(sa - .05, min(prev + .01, sa)); se = min(sb + .09, max(nxt - .01, sb))
            if si > 0 and (si - 1) in cont: ss = (segs[si - 1][-1][1] + sa) / 2
            if si in cont: se = (sb + segs[si + 1][0][0]) / 2
            nf = max(6, round((se - ss) * FPS))
            new_take = si == 0
            if hold:
                zoom = 1.0
            else:
                if new_take or t_out / FPS - last_zoom_t >= 1.5 or not beats or (si - 1) in cont:
                    zi += 1; last_zoom_t = t_out / FPS
                    zoom = 1.15 if not beats else zooms[zi % len(zooms)]
                else:
                    zoom = beats[-1]['zoom']
            change = (not beats) or new_take or abs(zoom - beats[-1]['zoom']) >= .1
            beats.append(dict(src=round(ss, 3), nf=nf, out0=t_out, zoom=zoom, hold=hold, take=ti,
                              punch=change, whoosh=bool(beats) and change))
            for w in s:
                txt = re.sub(r'[.,:;!]+$', '', w[2]); k = re.sub(r'[^\wÀ-ú]', '', txt).lower()
                txt = fix.get(k, txt).upper()
                caps.append(dict(f=t_out + round((w[0] - ss) * FPS), word=txt, beat=len(beats) - 1))
            t_out += nf
    # grupos de legenda: até 3 palavras, quebra em troca de beat ou pausa > 14 frames
    groups, cur = [], []
    for c in caps:
        if cur and (len(cur) >= 3 or c['beat'] != cur[-1]['beat'] or c['f'] - cur[-1]['f'] > 14):
            groups.append(cur); cur = []
        cur.append(c)
    groups.append(cur)
    for i in range(len(groups) - 1, 0, -1):
        if len(groups[i]) == 1 and groups[i][0]['beat'] == groups[i - 1][-1]['beat'] and len(groups[i - 1]) < 3:
            groups[i - 1] += groups.pop(i)
    edl = dict(total=t_out, beats=beats, caption_groups=[[dict(f=c['f'], word=c['word']) for c in g] for g in groups],
               note='src em segundos do bruto; saída em frames a 30 fps')
    write_json(cfg.EDL_RAW, edl, indent=1)
    print(f'EDL: {t_out / FPS:.1f}s, {len(beats)} beats, {len(groups)} legendas')
    return edl


def tighten(cfg):
    """Cada beat começa/termina rente à fala: corta respiro > 0,10 s no início e silêncio > 0,25 s no fim
    (limiar = p95 do envelope − 24 dB). `edl.speeds` = {índice do beat: velocidade} acelera beats específicos."""
    speeds = {int(k): float(v) for k, v in cfg.EDL_SPEC.get('speeds', {}).items()}
    SR = 16000
    edl = read_json(cfg.EDL_RAW)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(cfg.SRC), '-vn', '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
    a = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    H = int(.02 * SR)
    def env(t0, t1):
        seg = a[int(t0 * SR):int(t1 * SR)]
        n = len(seg) // H
        return 20 * np.log10(np.sqrt((seg[:n * H].reshape(n, H) ** 2).mean(1)) + 1e-7)
    new, delta_map, out0 = [], [], 0
    for i, bt in enumerate(edl['beats']):
        sp = speeds.get(i, 1.0)
        s0, dur = bt['src'], bt['nf'] / FPS
        d = env(s0, s0 + dur)
        trim_l = trim_r = 0.0
        if len(d) > 6 and not bt.get('hold'):
            thr = max(np.percentile(d, 95) - 24, -48)
            on = np.where((d[:-2] > thr) & (d[1:-1] > thr - 3) & (d[2:] > thr - 3))[0]
            if len(on):
                lead = on[0] * .02 - .07
                tail = dur - (on[-1] + 3) * .02 - .20
                if lead > .10: trim_l = lead
                if tail > .25: trim_r = tail
        src2 = s0 + trim_l; dur2 = dur - trim_l - trim_r
        nf2 = max(8, round(dur2 * FPS / sp))
        nb = dict(bt, src=round(src2, 3), nf=nf2, out0=out0)
        if sp != 1: nb['speed'] = sp
        delta_map.append((bt['out0'], bt['nf'], out0, nf2, trim_l, sp))
        new.append(nb); out0 += nf2
        if trim_l or trim_r or sp != 1:
            print(f'beat {i}: src {s0:.2f}->{src2:.2f} nf {bt["nf"]}->{nf2} (corte ini {trim_l:.2f}s fim {trim_r:.2f}s speed {sp})')
    def remap(f):
        for o0, nf, n0, nf2, tl, sp in delta_map:
            if o0 <= f < o0 + nf:
                return n0 + min(nf2 - 1, max(0, int(round(((f - o0) / FPS - tl) * FPS / sp))))
        return out0
    edl['beats'] = new; edl['total'] = out0
    edl['caption_groups'] = [[dict(c, f=remap(c['f'])) for c in g] for g in edl['caption_groups']]
    write_json(cfg.EDL, edl)
    print('total', edl['total'] / FPS, 's')
    return edl
