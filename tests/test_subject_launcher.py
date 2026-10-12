"""CPU-only safety/integrity checks, not a GPU-fit or visual-quality claim."""
import importlib.util
from pathlib import Path
import hashlib
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('subject_launcher',ROOT/'kaggle/experiments/run_subject_cell.py')
launcher=importlib.util.module_from_spec(spec);spec.loader.exec_module(launcher)


class SubjectLauncherTests(unittest.TestCase):
    def test_manifest_matches_exact_pinned_source_commit(self):
        for path,expected in launcher.FILES.items():
            content=subprocess.check_output(['git','show',launcher.COMMIT+':'+path],cwd=ROOT)
            self.assertEqual(hashlib.sha256(content).hexdigest(),expected,path)
            if path.endswith('.py'):compile(content,path,'exec')
    def test_insufficient_single_gpu_stops_before_asset_download(self):
        with tempfile.TemporaryDirectory() as folder,patch.object(launcher.shutil,'which',return_value='/test/tool'),patch.object(launcher.subprocess,'check_output',return_value='0, 1024, Tesla T4\n1, 1024, Tesla T4\n'):
            with self.assertRaisesRegex(RuntimeError,'ONE GPU'):
                launcher.hardware(Path(folder),Path(folder))
    def test_valid_cached_assets_do_not_require_network(self):
        with tempfile.TemporaryDirectory() as folder,patch.object(launcher.urllib.request,'urlopen',side_effect=AssertionError('Unexpected network')):
            root=Path(folder)
            for relative in launcher.FILES:
                data=subprocess.check_output(['git','show',launcher.COMMIT+':'+relative],cwd=ROOT)
                (root/Path(relative).name).write_bytes(data)
            self.assertEqual(launcher.assets(root),root)


if __name__=='__main__':unittest.main()
