"""CPU checks only. Random tiny modules verify API wiring, never product quality."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("vace_experiment", ROOT / "kaggle/experiments/wan_vace_quality.py")
vace = importlib.util.module_from_spec(spec)
spec.loader.exec_module(vace)


class ExperimentTests(unittest.TestCase):
    def test_hardware_gates(self):
        good = dict(ram=24*vace.GIB, disk=24*vace.GIB, gpu_total=15*vace.GIB, gpu_free=14*vace.GIB)
        vace.resource_gate(**good)
        for key in ("ram", "disk", "gpu_total", "gpu_free"):
            bad = {**good, key: vace.GIB}
            with self.subTest(key=key), self.assertRaisesRegex(RuntimeError, "No weights downloaded"):
                vace.resource_gate(**bad)
        vace.resource_gate(**{**good, "disk": 4*vace.GIB}, uncached_weights=0)

    def test_real_source_all_frames_and_geometry(self):
        frames = vace.read_source(ROOT / "public/demo-performance.mp4")
        self.assertEqual(len(frames), 49)
        self.assertEqual(frames[0].size, (448, 256))
        self.assertNotEqual(frames[0].tobytes(), frames[-1].tobytes())
        gray, masks, refs = vace.conditions(frames)
        self.assertEqual(len(gray), 49)
        self.assertEqual(len(masks), 49)
        self.assertEqual(refs[0].tobytes(), frames[0].tobytes())
        for im in gray:
            r, g, b = im.split()
            self.assertEqual(r.tobytes(), g.tobytes()); self.assertEqual(g.tobytes(), b.tobytes())
        self.assertTrue(all(m.getextrema() == (255, 255) for m in masks))
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / "unit-test-source-only.mp4"
            vace.encode_mp4(frames, target)
            data = json.loads(vace.command(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0",
                "-show_entries", "stream=width,height,nb_read_frames,r_frame_rate:format=duration", "-of", "json", target]))
            stream = data["streams"][0]
            self.assertEqual(stream["nb_read_frames"], "49")
            self.assertEqual(stream["r_frame_rate"], "12/1")
            self.assertAlmostEqual(float(data["format"]["duration"]), 49/12, places=2)
            vace.comparison(frames, frames, Path(tmp), target)
            self.assertTrue((Path(tmp)/"comparison-48.png").is_file())

    def test_pinned_real_pipeline_and_scheduler_apis(self):
        vace.validate_apis()

    def test_cpu_bfloat16_text_encoder_staging(self):
        import torch
        from diffusers import WanVACEPipeline, UniPCMultistepScheduler
        from transformers import UMT5EncoderModel, UMT5Config, PreTrainedTokenizerFast
        from tokenizers import Tokenizer
        from tokenizers.models import WordLevel
        from tokenizers.pre_tokenizers import Whitespace
        backend = Tokenizer(WordLevel({"[UNK]":0, "[PAD]":1, "dance":2}, unk_token="[UNK]"))
        backend.pre_tokenizer = Whitespace()
        tokenizer = PreTrainedTokenizerFast(tokenizer_object=backend, unk_token="[UNK]", pad_token="[PAD]")
        encoder = UMT5EncoderModel(UMT5Config(vocab_size=3, d_model=16, d_ff=32, d_kv=8,
                                             num_layers=1, num_heads=2)).to(torch.bfloat16).eval()
        pipe = WanVACEPipeline(text_encoder=encoder, tokenizer=tokenizer, transformer=None, vae=None,
                              scheduler=UniPCMultistepScheduler())
        with torch.inference_mode():
            positive, negative = pipe.encode_prompt("dance", "blur", device=torch.device("cpu"),
                                                    dtype=torch.float32, max_sequence_length=8)
        self.assertEqual(positive.dtype, torch.float32)
        self.assertEqual(positive.shape, (1, 8, 16))
        self.assertTrue(torch.isfinite(positive).all() and torch.isfinite(negative).all())

    def test_tiny_actual_vace_graph_with_video_mask_reference(self):
        # Zero pretrained weights; no MP4 export. This tests the full conditioning
        # argument shape/graph, not motion preservation or cinematic output.
        import torch
        from PIL import Image
        from diffusers import WanVACEPipeline, AutoencoderKLWan, WanVACETransformer3DModel, UniPCMultistepScheduler
        torch.set_num_threads(2)
        transformer = WanVACETransformer3DModel(num_attention_heads=1, attention_head_dim=32,
            in_channels=16, out_channels=16, text_dim=16, freq_dim=16, ffn_dim=64, num_layers=1,
            vace_layers=[0], vace_in_channels=96)
        vae = AutoencoderKLWan(base_dim=8, dim_mult=[1, 2, 4, 4], num_res_blocks=1, z_dim=16)
        pipe = WanVACEPipeline(text_encoder=None, tokenizer=None, transformer=transformer, vae=vae,
            scheduler=UniPCMultistepScheduler(prediction_type="flow_prediction", use_flow_sigmas=True, flow_shift=3.0))
        frames = [Image.new("RGB", (32, 32), (50+i*5, 50+i*5, 50+i*5)) for i in range(5)]
        with torch.inference_mode():
            output = pipe(video=frames, mask=[Image.new("L", (32,32), 255)]*5,
                reference_images=[frames[0]], prompt_embeds=torch.zeros(1,8,16),
                negative_prompt_embeds=torch.zeros(1,8,16), height=32, width=32,
                num_frames=5, num_inference_steps=2, conditioning_scale=1.0,
                guidance_scale=5.0, generator=torch.Generator().manual_seed(1), output_type="latent")
        self.assertTrue(torch.isfinite(output.frames).all())
        self.assertEqual(output.frames.shape, (1,16,3,4,4))
        # Verify real from_pretrained component overrides used by staged loading,
        # using only these random tiny modules, never downloaded model weights.
        with tempfile.TemporaryDirectory() as tmp:
            pipe.save_pretrained(tmp)
            index = Path(tmp) / "model_index.json"
            data = json.loads(index.read_text())
            data["text_encoder"] = ["transformers", "UMT5EncoderModel"]
            data["tokenizer"] = ["transformers", "T5TokenizerFast"]
            index.write_text(json.dumps(data))
            loaded = WanVACEPipeline.from_pretrained(tmp, text_encoder=None, tokenizer=None,
                vae=vae, torch_dtype=torch.float16, use_safetensors=True, low_cpu_mem_usage=True)
            self.assertIsNone(loaded.text_encoder)
            self.assertIsNone(loaded.tokenizer)
            self.assertEqual(loaded.transformer.dtype, torch.float16)


if __name__ == "__main__":
    unittest.main()
