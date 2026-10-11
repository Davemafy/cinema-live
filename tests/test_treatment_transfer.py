"""CPU correctness checks. Synthetic fixtures are not product/AI evidence."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("transfer",ROOT/"kaggle/experiments/treatment_transfer.py")
t=importlib.util.module_from_spec(spec);spec.loader.exec_module(t)


class TransferTests(unittest.TestCase):
    def test_neutral_field_keeps_all_original_pixel_values(self):
        rng=np.random.default_rng(4)
        source=rng.integers(0,256,(48,64,3),dtype=np.uint8)
        gain=t.derive_gain(source,source)
        output,hot=t.shade(source,gain)
        np.testing.assert_array_equal(output,source)
        self.assertEqual(hot,0)

    def test_confidence_warp_only_modulates_original_detail(self):
        rng=np.random.default_rng(7)
        source=rng.integers(30,210,(64,96,3),dtype=np.uint8)
        gain=np.full(source.shape,-.3,dtype=np.float32)
        field,confidence=t.tracking_step(source,source,gain,gain)
        self.assertGreater(confidence,.95)
        np.testing.assert_allclose(field,gain,atol=1e-4)
        output,_=t.shade(source,field)
        self.assertEqual(output.shape,source.shape)
        self.assertGreater(np.corrcoef(source.ravel(),output.ravel())[0,1],.999)

    def test_valid_export_keeps_frame_count_dimensions_timing_and_aac(self):
        import cv2
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);source=root/"source.mp4";reference=root/"unit-test-reference.png"
            t.run(["ffmpeg","-v","error","-f","lavfi","-i","testsrc2=size=96x64:rate=12",
                "-f","lavfi","-i","sine=frequency=440:sample_rate=48000","-t","1",
                "-c:v","libx264","-threads","2","-pix_fmt","yuv420p","-c:a","aac",source])
            frames,fps,info=t.read_video(source)
            cv2.imwrite(str(reference),cv2.cvtColor(frames[0],cv2.COLOR_RGB2BGR))
            provenance=root/"provenance.json"
            provenance.write_text(json.dumps({"imageAiProvider":"UNIT TEST ONLY — synthetic reference, not AI evidence",
                "imageAiModel":"unit-test","imageAiPrompt":"identity test","sourceSha256":t.digest(source),
                "referenceSha256":t.digest(reference),"anchorFrame":0,"visuallyReviewed":True}))
            report=t.transfer(source,reference,provenance,root/"output")
            self.assertEqual(report["sourceFrames"],12);self.assertEqual(report["outputFrames"],12)
            self.assertEqual(report["fps"],"12");self.assertEqual(report["audio"],"AAC stream copy")
            def audio_bytes(path):
                return t.run(["ffmpeg","-v","error","-i",path,"-map","0:a:0","-c:a","copy","-f","adts","pipe:1"])
            self.assertEqual(audio_bytes(source),audio_bytes(root/"output/treated-source.mp4"))
            for artifact in ["comparison-000.png","comparison-006.png","comparison-011.png","every-frame.jpg"]:
                self.assertTrue((root/"output"/artifact).is_file())
            with self.assertRaisesRegex(RuntimeError,"Keep prior evidence"):
                t.transfer(source,reference,provenance,root/"output")
            with self.assertRaisesRegex(RuntimeError,"hash mismatch"):
                provenance.write_text(provenance.read_text().replace(t.digest(source),"0"*64))
                t.transfer(source,reference,provenance,root/"other-output")


if __name__=="__main__":unittest.main()
