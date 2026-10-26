import json
import threading
from pathlib import Path


class State:
    def __init__(self, path: Path):
        self.path = path
        self.lock = threading.Lock()
        self.data = {"whitelist": {}}
        if path.exists():
            try:
                self.data = json.loads(path.read_text())
            except Exception:
                pass

    def _save(self):
        self.path.write_text(json.dumps(self.data, indent=2))

    def whitelist(self):
        with self.lock:
            return [{"bssid": k, "note": v} for k, v in self.data["whitelist"].items()]

    def is_whitelisted(self, bssid: str) -> bool:
        with self.lock:
            return bssid.upper() in self.data["whitelist"]

    def add_whitelist(self, bssid: str, note: str = ""):
        with self.lock:
            self.data["whitelist"][bssid.upper()] = note
            self._save()

    def del_whitelist(self, bssid: str):
        with self.lock:
            self.data["whitelist"].pop(bssid.upper(), None)
            self._save()
