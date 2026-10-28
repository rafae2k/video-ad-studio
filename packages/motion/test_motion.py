import json, sys, tempfile, unittest
from pathlib import Path
from types import SimpleNamespace
sys.path.insert(0, str(Path(__file__).parent))
import common
import edl as E
from compose import out_mappers

HERE = Path(__file__).parent
EXAMPLE = HERE / 'examples' / 'v5-surf.motion.json'


def fake_cfg(tmp, takes, zooms=(1.0, 1.25), **edl):
    return SimpleNamespace(EDL_SPEC=dict(takes=takes, zooms=list(zooms), **edl), EDL_RAW=Path(tmp) / 'edl.json')


class EdlTest(unittest.TestCase):
    def words(self):
        # duas frases com pausa de 0,5 s entre "dois" e "três"
        return [(1.0, 1.3, 'um'), (1.35, 1.7, 'dois'), (2.2, 2.5, 'três'), (2.55, 2.9, 'quatro.')]

    def test_pause_splits_take_into_contiguous_output_beats(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = E.build_edl(fake_cfg(tmp, [[1.0, 2.9, False]]), self.words())
        self.assertEqual(len(out['beats']), 2)
        b0, b1 = out['beats']
        self.assertEqual(b1['out0'], b0['out0'] + b0['nf'])
        self.assertEqual(out['total'], b1['out0'] + b1['nf'])
        self.assertTrue(b0['punch'] and not b0['whoosh'])
        self.assertLess(b0['src'] + b0['nf'] / common.FPS, b1['src'])  # a pausa saiu

    def test_hold_take_keeps_pauses_and_zoom(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = E.build_edl(fake_cfg(tmp, [[1.0, 2.9, True]]), self.words())
        self.assertEqual(len(out['beats']), 1)
        self.assertEqual(out['beats'][0]['zoom'], 1.0)
        self.assertTrue(out['beats'][0]['hold'])

    def test_captions_are_fixed_uppercased_and_grouped_by_beat(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = E.build_edl(fake_cfg(tmp, [[1.0, 2.9, False]], wordFixes={'quatro': 'QUATRO!'}), self.words())
        self.assertEqual([[c['word'] for c in g] for g in out['caption_groups']], [['UM', 'DOIS'], ['TRÊS', 'QUATRO!']])

    def test_word_override_replaces_misheard_span(self):
        with tempfile.TemporaryDirectory() as tmp:
            cfg = fake_cfg(tmp, [[1.0, 2.9, True]], wordOverrides=[{'from': .98, 'to': 1.5, 'words': [[1.0, 1.6, 'espirulina']]}])
            out = E.build_edl(cfg, self.words())
        self.assertEqual(out['caption_groups'][0][0]['word'], 'ESPIRULINA')
        self.assertNotIn('UM', [c['word'] for g in out['caption_groups'] for c in g])


class PlanTest(unittest.TestCase):
    def test_source_time_maps_to_output_frame_and_gap_snaps_forward(self):
        beats = [dict(src=10.0, nf=30, out0=0), dict(src=20.0, nf=60, out0=30, speed=2.0)]
        out_f, out_end = out_mappers(beats, 90)
        self.assertEqual(out_f(10.5), 15)
        self.assertEqual(out_f(21.0), 45)   # 1 s do bruto a 2x = 15 frames
        self.assertEqual(out_f(15.0), 30)   # trecho cortado → início do próximo beat
        self.assertEqual(out_end(10.5), 15)


class ManifestTest(unittest.TestCase):
    def test_example_manifest_contract(self):
        m = json.loads(EXAMPLE.read_text(encoding='utf-8'))
        self.assertEqual(m['backend'], 'motion-matte-v1')
        self.assertEqual(m['status'], 'draft')
        starts = [t[0] for t in m['edl']['takes']]
        self.assertEqual(starts, sorted(starts))
        for t0, t1, hold in m['edl']['takes']:
            self.assertLess(t0, t1); self.assertIsInstance(hold, bool)
        for p in m['plates']:
            self.assertIn(p['kind'], {'dark', 'orig', 'image', 'video'})
            self.assertLess(p['t0'], p['t1'])
            if p['kind'] in ('image', 'video'): self.assertTrue(p['file'])
        for L in m['letters']:
            self.assertIn(L['anim'], {'rise', 'slam', 'slide'})
            self.assertTrue(1 <= len(L['lines']) <= 3)
            if L.get('hl') is not None: self.assertLess(L['hl'], len(L['lines']))
        for path in (m['source'], m['work'], m['output']):
            self.assertFalse(Path(path).is_absolute(), path)

    def test_load_cfg_rejects_other_backends(self):
        with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as f:
            json.dump({'backend': 'ffmpeg-footage-v1'}, f)
        with self.assertRaises(SystemExit):
            common.load_cfg(f.name)


if __name__ == '__main__':
    unittest.main()
