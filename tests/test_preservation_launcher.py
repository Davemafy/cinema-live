"""Manifest/baseline selection tests; no GPU or fabricated quality evidence."""
import ast
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
PATH=ROOT/"kaggle/experiments/run_preservation_cell.py"
spec=importlib.util.spec_from_file_location("launcher",PATH)
launcher=importlib.util.module_from_spec(spec);spec.loader.exec_module(launcher)


class LauncherTests(unittest.TestCase):
    def test_every_download_matches_the_exact_pinned_commit(self):
        for path,sha in launcher.FILES.items():
            with self.subTest(path=path):
                data=subprocess.check_output(["git","show",launcher.COMMIT+":"+path],cwd=ROOT)
                self.assertEqual(hashlib.sha256(data).hexdigest(),sha)
                if path.endswith(".py"):compile(data,path,"exec")

    def test_only_completed_matching_baseline_is_selected(self):
        # Byte strings are metadata-selection fixtures, not playable video claims.
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);folder=root/"cinema-vace-unit-test";folder.mkdir()
            video=folder/"vace-output.mp4";video.write_bytes(b"unit selection fixture")
            report={"gpuVerified":True,"sourceSha256":launcher.FILES["public/demo-performance.mp4"],
                    "width":448,"height":256,"frames":49,"fps":12,"steps":30,"seed":20261011,
                    "conditioningScale":1.,"guidanceScale":5.,
                    "outputSha256":hashlib.sha256(video.read_bytes()).hexdigest()}
            p=folder/"run.json";p.write_text(json.dumps(report))
            self.assertEqual(launcher.find_wan_baseline(root),video)
            report["seed"]=99;p.write_text(json.dumps(report))
            self.assertIsNone(launcher.find_wan_baseline(root))
            report["seed"]=20261011;report["appearanceReferenceSha256"]="restyled";p.write_text(json.dumps(report))
            self.assertIsNone(launcher.find_wan_baseline(root))
            del report["appearanceReferenceSha256"];report["gpuVerified"]=False;p.write_text(json.dumps(report))
            self.assertIsNone(launcher.find_wan_baseline(root))


if __name__=="__main__":unittest.main()
