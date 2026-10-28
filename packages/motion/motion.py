#!/usr/bin/env python3
"""Backend motion-matte-v1: talking head → anúncio com lettering atrás da pessoa.

uso (da raiz do repo):
  npm run motion -- <manifest.motion.json> edl|tighten|masks|plan|render|all [--preview A-B] [--force]

Etapas: edl (takes → beats/legendas) → tighten (corta respiro) → masks (RVM) → plan (tempos do bruto → frames)
→ render (quadros + áudio + loudnorm). `all` roda tudo em sequência. `--preview A-B` renderiza só os frames
de saída A até B em storage/work/; `--force` permite sobrescrever o `output` do manifest.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from common import load_cfg
import edl as E
import compose as C

STEPS = ['edl', 'tighten', 'masks', 'plan', 'render']


def main(argv):
    if len(argv) < 2 or argv[1] not in STEPS + ['all']:
        raise SystemExit(__doc__)
    cfg = load_cfg(argv[0])
    preview = None
    if '--preview' in argv:
        a, b = argv[argv.index('--preview') + 1].split('-'); preview = (int(a), int(b))
    force = '--force' in argv
    for step in (STEPS if argv[1] == 'all' else [argv[1]]):
        print(f'== {step}', flush=True)
        if step == 'edl': E.build_edl(cfg)
        elif step == 'tighten': E.tighten(cfg)
        elif step == 'masks':
            from masks import build_masks
            build_masks(cfg)
        elif step == 'plan': C.build_plan(cfg)
        elif step == 'render': C.render(cfg, preview, force)


if __name__ == '__main__':
    main(sys.argv[1:])
