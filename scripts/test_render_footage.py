import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('render_footage', Path(__file__).with_name('render-footage.py'))
renderer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(renderer)

class TimelineTests(unittest.TestCase):
    def base(self):
        return dict(sourcePath='source.mp4', outputPath='draft.mp4', cuts=[dict(sourceStart=2, sourceEnd=5), dict(sourceStart=10, sourceEnd=12)])

    def test_output_time_is_concatenated_duration(self):
        manifest = self.base()
        manifest['captions'] = [dict(start=4, end=5, text='End')]
        self.assertEqual(renderer.validate(manifest, 12), 5)
        manifest['captions'][0]['end'] = 6
        with self.assertRaises(ValueError): renderer.validate(manifest)

    def test_reversed_or_out_of_bounds_cuts_fail(self):
        for a, b in [(4, 2), (-1, 2), (2, 14), (2, float('nan'))]:
            manifest = self.base()
            manifest['cuts'] = [dict(sourceStart=a, sourceEnd=b)]
            with self.assertRaises(ValueError): renderer.validate(manifest, 12)

    def test_overlapping_captions_fail(self):
        manifest = self.base()
        manifest['captions'] = [dict(start=0, end=2, text='First'), dict(start=1, end=3, text='Second')]
        with self.assertRaises(ValueError): renderer.validate(manifest)
