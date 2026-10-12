"""CPU/static checks for JarvisLabs deployment entry points."""
import pathlib
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class JarvisLabsSetupTests(unittest.TestCase):
    def test_shell_syntax(self):
        for name in ("jarvislabs-bootstrap.sh", "jarvislabs-serve.sh"):
            subprocess.run(["bash", "-n", str(ROOT / "scripts" / name)], check=True)

    def test_existing_worker_allows_nonlocal_bind(self):
        text = (ROOT / "kaggle" / "cinematography_worker.py").read_text()
        self.assertIn('os.environ.get("CINEMA_BIND_HOST","127.0.0.1")', text)
        self.assertIn('os.environ.get("CINEMA_BACKEND_TOKEN"', text)
        self.assertIn('os.environ.get("CINEMA_BACKEND_URL"', text)

    def test_no_hardcoded_token(self):
        text = (ROOT / "scripts" / "jarvislabs-serve.sh").read_text()
        self.assertIn("cat /home/cinema-worker.token", text)
        self.assertIn("CINEMA_SUBJECT_PORT=6006", text)


if __name__ == "__main__":
    unittest.main()
