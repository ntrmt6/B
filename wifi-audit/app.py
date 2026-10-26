import asyncio
import json
import shutil
import subprocess
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from scanner import Scanner
from state import State
from tasks import TaskManager

BASE = Path(__file__).resolve().parent
STATIC = BASE / "static"
DATA = BASE / "data"
CAPTURES = DATA / "captures"
DATA.mkdir(exist_ok=True)
CAPTURES.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="wifi-audit")
state = State(DATA / "whitelist.json")
scanner = Scanner()
tasks = TaskManager(CAPTURES)

REQUIRED_TOOLS = ["iw", "airmon-ng", "airodump-ng", "aireplay-ng", "aircrack-ng"]
OPTIONAL_TOOLS = ["hcxdumptool", "hcxpcapngtool", "hashcat"]


@app.get("/")
async def root():
    return FileResponse(STATIC / "index.html")


@app.get("/api/health")
async def health():
    tools_status = {}
    for t in REQUIRED_TOOLS + OPTIONAL_TOOLS:
        tools_status[t] = shutil.which(t) is not None
    return {
        "tools": tools_status,
        "required_ok": all(tools_status[t] for t in REQUIRED_TOOLS),
    }


@app.get("/api/interfaces")
async def interfaces():
    if not shutil.which("iw"):
        return []
    try:
        out = subprocess.run(["iw", "dev"], capture_output=True, text=True, timeout=5).stdout
    except Exception:
        return []
    ifaces = []
    cur = None
    for raw in out.splitlines():
        line = raw.strip()
        if line.startswith("Interface"):
            cur = {"name": line.split()[1], "type": None}
            ifaces.append(cur)
        elif cur and line.startswith("type "):
            cur["type"] = line.split()[1]
    return ifaces


class IfaceReq(BaseModel):
    iface: str


@app.post("/api/monitor/start")
async def monitor_start(req: IfaceReq):
    r = subprocess.run(["airmon-ng", "start", req.iface], capture_output=True, text=True)
    return {"ok": r.returncode == 0, "out": r.stdout + r.stderr}


@app.post("/api/monitor/stop")
async def monitor_stop(req: IfaceReq):
    r = subprocess.run(["airmon-ng", "stop", req.iface], capture_output=True, text=True)
    return {"ok": r.returncode == 0, "out": r.stdout + r.stderr}


class ScanReq(BaseModel):
    iface: str
    channel: Optional[int] = None
    bssid: Optional[str] = None


@app.post("/api/scan/start")
async def scan_start(req: ScanReq):
    scanner.start(req.iface, req.channel, req.bssid)
    return {"ok": True}


@app.post("/api/scan/stop")
async def scan_stop():
    scanner.stop()
    return {"ok": True}


@app.get("/api/scan")
async def scan_snapshot():
    return scanner.snapshot()


@app.get("/api/scan/stream")
async def scan_stream():
    async def gen():
        while True:
            yield f"data: {json.dumps(scanner.snapshot())}\n\n"
            await asyncio.sleep(1.5)
    return StreamingResponse(gen(), media_type="text/event-stream")


@app.get("/api/whitelist")
async def whitelist():
    return state.whitelist()


class WLItem(BaseModel):
    bssid: str
    note: str = ""


@app.post("/api/whitelist")
async def whitelist_add(item: WLItem):
    state.add_whitelist(item.bssid, item.note)
    return state.whitelist()


@app.delete("/api/whitelist/{bssid}")
async def whitelist_del(bssid: str):
    state.del_whitelist(bssid)
    return state.whitelist()


class HandshakeReq(BaseModel):
    iface: str
    bssid: str
    channel: int
    essid: str = ""
    client: Optional[str] = None


@app.post("/api/attack/handshake")
async def attack_handshake(req: HandshakeReq):
    if not state.is_whitelisted(req.bssid):
        raise HTTPException(403, "BSSID not whitelisted — add it to 'My networks' first")
    scanner.stop()
    tid = tasks.start_handshake(req.iface, req.bssid, req.channel, req.essid, req.client)
    return {"task_id": tid}


class PMKIDReq(BaseModel):
    iface: str
    bssid: str
    essid: str = ""
    duration: int = 60


@app.post("/api/attack/pmkid")
async def attack_pmkid(req: PMKIDReq):
    if not state.is_whitelisted(req.bssid):
        raise HTTPException(403, "BSSID not whitelisted")
    scanner.stop()
    tid = tasks.start_pmkid(req.iface, req.bssid, req.essid, req.duration)
    return {"task_id": tid}


@app.get("/api/captures")
async def captures_list():
    out = []
    for f in sorted(CAPTURES.iterdir()):
        if f.name.startswith("."):
            continue
        if f.suffix in {".cap", ".pcapng", ".hc22000", ".potfile"}:
            out.append({"name": f.name, "size": f.stat().st_size, "mtime": f.stat().st_mtime})
    return out


@app.get("/api/captures/{name}")
async def capture_download(name: str):
    p = CAPTURES / name
    if not p.exists() or ".." in name or "/" in name:
        raise HTTPException(404)
    return FileResponse(p, filename=name)


class CrackReq(BaseModel):
    hash_file: str
    wordlist: str = "/usr/share/wordlists/rockyou.txt"


@app.post("/api/crack")
async def crack(req: CrackReq):
    h = CAPTURES / req.hash_file
    if not h.exists() or ".." in req.hash_file:
        raise HTTPException(404, "hash file not found")
    if not Path(req.wordlist).exists():
        raise HTTPException(400, f"wordlist not found: {req.wordlist}")
    tid = tasks.start_crack(h, req.wordlist)
    return {"task_id": tid}


@app.get("/api/tasks")
async def tasks_list():
    return tasks.list()


@app.get("/api/tasks/{tid}")
async def task_get(tid: str):
    j = tasks.get(tid)
    if not j:
        raise HTTPException(404)
    return j


@app.post("/api/tasks/{tid}/cancel")
async def task_cancel(tid: str):
    return {"ok": tasks.cancel(tid)}


app.mount("/static", StaticFiles(directory=STATIC), name="static")
