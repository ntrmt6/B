import json
import os
import sqlite3
from datetime import datetime, timezone
from flask import Flask, g, jsonify, request

DB_PATH = os.environ.get("HRID_DB", "/root/B/hrid-tool/drafts.db")
PORT = int(os.environ.get("PORT", "5055"))

app = Flask(__name__)


def db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exc):
    conn = g.pop("db", None)
    if conn is not None:
        conn.close()


def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS drafts (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                title      TEXT    NOT NULL,
                data       TEXT    NOT NULL,
                created_at TEXT    NOT NULL,
                updated_at TEXT    NOT NULL
            )
            """
        )


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def row_to_dict(row, include_data=False):
    out = {
        "id": row["id"],
        "title": row["title"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }
    if include_data:
        out["data"] = json.loads(row["data"])
    return out


@app.get("/hrid/api/health")
def health():
    return {"ok": True}


@app.get("/hrid/api/drafts")
def list_drafts():
    rows = db().execute(
        "SELECT id, title, created_at, updated_at FROM drafts ORDER BY updated_at DESC"
    ).fetchall()
    return jsonify([row_to_dict(r) for r in rows])


@app.get("/hrid/api/drafts/<int:draft_id>")
def get_draft(draft_id):
    row = db().execute(
        "SELECT * FROM drafts WHERE id = ?", (draft_id,)
    ).fetchone()
    if not row:
        return jsonify({"error": "not found"}), 404
    return jsonify(row_to_dict(row, include_data=True))


@app.post("/hrid/api/drafts")
def create_draft():
    payload = request.get_json(silent=True) or {}
    title = (payload.get("title") or "Untitled proposal").strip()[:200]
    data = payload.get("data") or {}
    ts = now_iso()
    conn = db()
    cur = conn.execute(
        "INSERT INTO drafts (title, data, created_at, updated_at) VALUES (?, ?, ?, ?)",
        (title, json.dumps(data), ts, ts),
    )
    conn.commit()
    return jsonify({"id": cur.lastrowid, "title": title, "created_at": ts, "updated_at": ts}), 201


@app.put("/hrid/api/drafts/<int:draft_id>")
def update_draft(draft_id):
    payload = request.get_json(silent=True) or {}
    title = (payload.get("title") or "Untitled proposal").strip()[:200]
    data = payload.get("data") or {}
    ts = now_iso()
    conn = db()
    cur = conn.execute(
        "UPDATE drafts SET title = ?, data = ?, updated_at = ? WHERE id = ?",
        (title, json.dumps(data), ts, draft_id),
    )
    conn.commit()
    if cur.rowcount == 0:
        return jsonify({"error": "not found"}), 404
    return jsonify({"id": draft_id, "title": title, "updated_at": ts})


@app.delete("/hrid/api/drafts/<int:draft_id>")
def delete_draft(draft_id):
    conn = db()
    cur = conn.execute("DELETE FROM drafts WHERE id = ?", (draft_id,))
    conn.commit()
    if cur.rowcount == 0:
        return jsonify({"error": "not found"}), 404
    return "", 204


init_db()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=PORT)
