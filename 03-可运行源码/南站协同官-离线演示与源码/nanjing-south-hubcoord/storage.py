"""SQLite persistence for the deployable HubCoord application."""
from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from collections.abc import Iterator
from pathlib import Path


SCHEMA = """
CREATE TABLE IF NOT EXISTS projects (
    project_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    research_question TEXT NOT NULL,
    stage TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
    activity_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    occurred_at TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    message TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cards (
    card_id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(project_id) ON DELETE SET NULL,
    event_id TEXT NOT NULL,
    status TEXT NOT NULL,
    card_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS confirmations (
    card_id TEXT NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
    actor_role TEXT NOT NULL,
    decision TEXT NOT NULL,
    reason TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    PRIMARY KEY (card_id, actor_role)
);

CREATE TABLE IF NOT EXISTS audit_records (
    record_id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
    event_id TEXT NOT NULL,
    action TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    reason TEXT NOT NULL,
    data_status TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_project ON activities(project_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_cards_project ON cards(project_id, created_at DESC);
"""


class DecisionConflict(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


@contextmanager
def connect(db_path: Path) -> Iterator[sqlite3.Connection]:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(db_path, timeout=10)
    try:
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute("PRAGMA busy_timeout = 5000")
        connection.executescript(SCHEMA)
        with connection:
            yield connection
    finally:
        connection.close()


def check(db_path: Path) -> bool:
    with connect(db_path) as connection:
        return connection.execute("SELECT 1").fetchone()[0] == 1


def seed_project(db_path: Path, project: dict) -> None:
    with connect(db_path) as connection:
        cursor = connection.execute(
            "INSERT OR IGNORE INTO projects VALUES (?, ?, ?, ?, ?, ?)",
            (
                project["project_id"], project["title"], project["research_question"],
                project["stage"], project["created_at"], project["updated_at"],
            ),
        )
        if cursor.rowcount:
            for activity in project["activities"]:
                connection.execute(
                    "INSERT INTO activities (project_id, occurred_at, activity_type, message) VALUES (?, ?, ?, ?)",
                    (project["project_id"], activity["occurred_at"], activity["type"], activity["message"]),
                )


def create_project(db_path: Path, project: dict) -> dict:
    with connect(db_path) as connection:
        connection.execute(
            "INSERT INTO projects VALUES (?, ?, ?, ?, ?, ?)",
            (
                project["project_id"], project["title"], project["research_question"],
                project["stage"], project["created_at"], project["updated_at"],
            ),
        )
        for activity in project["activities"]:
            connection.execute(
                "INSERT INTO activities (project_id, occurred_at, activity_type, message) VALUES (?, ?, ?, ?)",
                (project["project_id"], activity["occurred_at"], activity["type"], activity["message"]),
            )
    return get_project(db_path, project["project_id"])


def project_exists(db_path: Path, project_id: str) -> bool:
    with connect(db_path) as connection:
        return connection.execute("SELECT 1 FROM projects WHERE project_id = ?", (project_id,)).fetchone() is not None


def _activities(connection: sqlite3.Connection, project_id: str) -> list[dict]:
    rows = connection.execute(
        "SELECT occurred_at, activity_type, message FROM activities WHERE project_id = ? ORDER BY activity_id DESC",
        (project_id,),
    ).fetchall()
    return [{"occurred_at": row["occurred_at"], "type": row["activity_type"], "message": row["message"]} for row in rows]


def _project_view(connection: sqlite3.Connection, row: sqlite3.Row) -> dict:
    return {
        "project_id": row["project_id"],
        "title": row["title"],
        "research_question": row["research_question"],
        "stage": row["stage"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "activities": _activities(connection, row["project_id"]),
    }


def list_projects(db_path: Path) -> list[dict]:
    with connect(db_path) as connection:
        rows = connection.execute("SELECT * FROM projects ORDER BY updated_at DESC").fetchall()
        return [_project_view(connection, row) for row in rows]


def get_project(db_path: Path, project_id: str) -> dict | None:
    with connect(db_path) as connection:
        row = connection.execute("SELECT * FROM projects WHERE project_id = ?", (project_id,)).fetchone()
        return _project_view(connection, row) if row else None


def add_activity(db_path: Path, project_id: str, occurred_at: str, activity_type: str, message: str) -> None:
    with connect(db_path) as connection:
        connection.execute(
            "INSERT INTO activities (project_id, occurred_at, activity_type, message) VALUES (?, ?, ?, ?)",
            (project_id, occurred_at, activity_type, message),
        )
        connection.execute("UPDATE projects SET updated_at = ? WHERE project_id = ?", (occurred_at, project_id))


def save_card(db_path: Path, card: dict, project_id: str | None) -> None:
    encoded = json.dumps(card, ensure_ascii=False)
    with connect(db_path) as connection:
        connection.execute(
            "INSERT INTO cards VALUES (?, ?, ?, ?, ?, ?, ?)",
            (card["card_id"], project_id, card["event_id"], card["status"], encoded, card["created_at"], card["created_at"]),
        )


def get_card(db_path: Path, card_id: str) -> tuple[dict, str | None] | None:
    with connect(db_path) as connection:
        row = connection.execute("SELECT card_json, project_id FROM cards WHERE card_id = ?", (card_id,)).fetchone()
        return (json.loads(row["card_json"]), row["project_id"]) if row else None


def update_card(db_path: Path, card: dict, updated_at: str) -> None:
    with connect(db_path) as connection:
        connection.execute(
            "UPDATE cards SET status = ?, card_json = ?, updated_at = ? WHERE card_id = ?",
            (card["status"], json.dumps(card, ensure_ascii=False), updated_at, card["card_id"]),
        )


def list_project_cards(db_path: Path, project_id: str) -> list[dict]:
    with connect(db_path) as connection:
        rows = connection.execute(
            "SELECT card_json FROM cards WHERE project_id = ? ORDER BY created_at DESC",
            (project_id,),
        ).fetchall()
        return [json.loads(row["card_json"]) for row in rows]


def record_confirmation(db_path: Path, card_id: str, actor_role: str, decision: str, reason: str, occurred_at: str) -> None:
    with connect(db_path) as connection:
        connection.execute(
            """INSERT INTO confirmations VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(card_id, actor_role) DO UPDATE SET
               decision = excluded.decision, reason = excluded.reason, occurred_at = excluded.occurred_at""",
            (card_id, actor_role, decision, reason, occurred_at),
        )


def confirmed_roles(db_path: Path, card_id: str) -> set[str]:
    with connect(db_path) as connection:
        rows = connection.execute(
            "SELECT actor_role FROM confirmations WHERE card_id = ? AND decision = 'confirmed'",
            (card_id,),
        ).fetchall()
        return {row["actor_role"] for row in rows}


def list_confirmations(db_path: Path, card_id: str) -> list[dict]:
    with connect(db_path) as connection:
        rows = connection.execute(
            """SELECT actor_role, decision, reason, occurred_at
               FROM confirmations WHERE card_id = ? ORDER BY occurred_at, actor_role""",
            (card_id,),
        ).fetchall()
        return [
            {
                "actor_role": row["actor_role"],
                "decision": row["decision"],
                "reason": row["reason"],
                "occurred_at": row["occurred_at"],
            }
            for row in rows
        ]


def apply_decision(
    db_path: Path,
    *,
    card_id: str,
    actor_role: str,
    decision: str,
    reason: str,
    occurred_at: str,
    audit_record: dict,
    activity_type: str,
    activity_message: str,
) -> tuple[dict, set[str]]:
    """在一个写事务中记录决定、卡片终态、项目活动和权威审计。"""
    with connect(db_path) as connection:
        connection.execute("BEGIN IMMEDIATE")
        row = connection.execute(
            "SELECT card_json, project_id FROM cards WHERE card_id = ?", (card_id,)
        ).fetchone()
        if row is None:
            raise DecisionConflict("card_not_found", "协同议题卡不存在。")
        card = json.loads(row["card_json"])
        if card["status"] in {"confirmed", "rejected", "escalated"}:
            raise DecisionConflict("card_terminal", "该议题卡已经形成终态，不能再次修改。")
        if actor_role not in card["required_confirmations"]:
            raise DecisionConflict("confirmation_not_allowed", "当前角色不是该卡片的必要确认者。")
        existing = connection.execute(
            "SELECT decision FROM confirmations WHERE card_id = ? AND actor_role = ?",
            (card_id, actor_role),
        ).fetchone()
        if existing is not None:
            raise DecisionConflict("duplicate_confirmation", "当前角色已经对这张议题卡作出决定。")

        connection.execute(
            "INSERT INTO confirmations VALUES (?, ?, ?, ?, ?)",
            (card_id, actor_role, decision, reason, occurred_at),
        )
        confirmed_rows = connection.execute(
            "SELECT actor_role FROM confirmations WHERE card_id = ? AND decision = 'confirmed'",
            (card_id,),
        ).fetchall()
        confirmed = {item["actor_role"] for item in confirmed_rows}
        if decision == "confirmed":
            if set(card["required_confirmations"]) <= confirmed:
                card["status"] = "confirmed"
        else:
            card["status"] = decision
        connection.execute(
            "UPDATE cards SET status = ?, card_json = ?, updated_at = ? WHERE card_id = ?",
            (card["status"], json.dumps(card, ensure_ascii=False), occurred_at, card_id),
        )
        project_id = row["project_id"]
        if project_id:
            connection.execute(
                "INSERT INTO activities (project_id, occurred_at, activity_type, message) VALUES (?, ?, ?, ?)",
                (project_id, occurred_at, activity_type, activity_message),
            )
            connection.execute(
                "UPDATE projects SET updated_at = ? WHERE project_id = ?", (occurred_at, project_id)
            )
        connection.execute(
            "INSERT INTO audit_records VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                audit_record["record_id"], audit_record["card_id"], audit_record["event_id"],
                audit_record["action"], audit_record["actor_role"], audit_record["occurred_at"],
                audit_record["reason"], audit_record["data_status"],
            ),
        )
        return card, confirmed


def record_audit(db_path: Path, record: dict) -> None:
    with connect(db_path) as connection:
        connection.execute(
            "INSERT INTO audit_records VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                record["record_id"], record["card_id"], record["event_id"], record["action"],
                record["actor_role"], record["occurred_at"], record["reason"], record["data_status"],
            ),
        )


def audit_count(db_path: Path) -> int:
    with connect(db_path) as connection:
        return connection.execute("SELECT COUNT(*) FROM audit_records").fetchone()[0]
