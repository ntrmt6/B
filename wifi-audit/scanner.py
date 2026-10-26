import csv
import os
import signal
import subprocess
import tempfile
import threading
import time
from pathlib import Path
from typing import Optional


class Scanner:
    """Wraps airodump-ng, polls its CSV output, keeps a live network list."""

    def __init__(self):
        self.proc: Optional[subprocess.Popen] = None
        self.iface: Optional[str] = None
        self.tmpdir: Optional[tempfile.TemporaryDirectory] = None
        self.prefix: Optional[Path] = None
        self.lock = threading.Lock()
        self.networks: dict = {}
        self.clients: dict = {}
        self.thread: Optional[threading.Thread] = None
        self.stop_event = threading.Event()

    def start(self, iface: str, channel: Optional[int] = None, bssid: Optional[str] = None):
        self.stop()
        self.tmpdir = tempfile.TemporaryDirectory(prefix="wifiaudit-")
        self.prefix = Path(self.tmpdir.name) / "scan"
        self.iface = iface
        cmd = [
            "airodump-ng",
            "--output-format", "csv",
            "-w", str(self.prefix),
        ]
        if channel is not None:
            cmd += ["-c", str(channel)]
        if bssid:
            cmd += ["--bssid", bssid]
        cmd.append(iface)
        self.proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.stop_event.clear()
        self.thread = threading.Thread(target=self._poll, daemon=True)
        self.thread.start()

    def _poll(self):
        csv_path = Path(str(self.prefix) + "-01.csv")
        while not self.stop_event.is_set():
            if csv_path.exists():
                try:
                    self._parse(csv_path)
                except Exception:
                    pass
            time.sleep(1)

    def _parse(self, csv_path: Path):
        text = csv_path.read_text(errors="ignore")
        parts = text.split("\r\n\r\n")
        if len(parts) < 2:
            parts = text.split("\n\n")
        nets: dict = {}
        cls: dict = {}
        if parts:
            for row in csv.reader(parts[0].splitlines()[1:]):
                if len(row) < 14:
                    continue
                bssid = row[0].strip()
                if not bssid or bssid == "BSSID":
                    continue
                nets[bssid] = {
                    "bssid": bssid,
                    "channel": row[3].strip(),
                    "privacy": row[5].strip(),
                    "cipher": row[6].strip(),
                    "auth": row[7].strip(),
                    "power": row[8].strip(),
                    "beacons": row[9].strip(),
                    "data": row[10].strip(),
                    "essid": row[13].strip(),
                }
        if len(parts) > 1:
            for row in csv.reader(parts[1].splitlines()[1:]):
                if len(row) < 6:
                    continue
                mac = row[0].strip()
                if not mac or mac == "Station MAC":
                    continue
                cls.setdefault(row[5].strip(), []).append({
                    "mac": mac,
                    "power": row[3].strip(),
                    "packets": row[4].strip(),
                    "probes": row[6].strip() if len(row) > 6 else "",
                })
        with self.lock:
            self.networks = nets
            self.clients = cls

    def stop(self):
        self.stop_event.set()
        if self.proc:
            try:
                self.proc.send_signal(signal.SIGINT)
                self.proc.wait(timeout=3)
            except Exception:
                try:
                    self.proc.kill()
                except Exception:
                    pass
            self.proc = None
        if self.thread:
            self.thread.join(timeout=2)
            self.thread = None
        if self.tmpdir:
            self.tmpdir.cleanup()
            self.tmpdir = None

    def snapshot(self):
        with self.lock:
            nets = list(self.networks.values())
            nets.sort(key=lambda n: int(n.get("power") or 0), reverse=True)
            return {
                "running": self.proc is not None,
                "iface": self.iface,
                "networks": nets,
                "clients": self.clients,
            }
