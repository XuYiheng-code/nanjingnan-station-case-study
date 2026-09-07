#!/usr/bin/env python3
"""南站协同官展示版：只处理案例教学与模拟推演，不连接真实业务系统。"""
from __future__ import annotations

import json
import html
import os
import re
import sqlite3
import uuid
from hmac import compare_digest
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

from flask import Flask, Response, jsonify, redirect, request, send_from_directory
from jsonschema import validate

import storage

ROOT = Path(__file__).resolve().parent
CAD_STATIC = ROOT / "static" / "cad"


def locate_starter() -> Path:
    """兼容应用位于启动包根目录或其子目录的布局。"""
    candidates = (ROOT.parent, ROOT, ROOT.parent / "智能体工程启动包")
    for candidate in candidates:
        if all((candidate / name).is_dir() for name in ("data", "contracts", "eval")):
            return candidate
    raise FileNotFoundError("未找到包含 data、contracts 和 eval 的智能体工程启动包。")


STARTER = locate_starter()
DATA = STARTER / "data"
CONTRACTS = STARTER / "contracts"
EVAL = STARTER / "eval"
RUNTIME = Path(os.environ.get("HUBCOORD_DATA_DIR", str(ROOT / "runtime")))

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 64 * 1024


@app.before_request
def require_configured_access():
    """本地默认匿名；设置账号密码后，除健康检查外均需整站认证。"""
    username = os.environ.get("HUBCOORD_AUTH_USER", "")
    password = os.environ.get("HUBCOORD_AUTH_PASSWORD", "")
    if not username and not password:
        return None
    if not username or not password:
        return jsonify({"error_code": "auth_misconfigured", "message": "访问认证配置不完整。"}), 503
    if request.path in {"/healthz", "/readyz"}:
        return None
    authorization = request.authorization
    valid = (
        authorization is not None
        and compare_digest(authorization.username or "", username)
        and compare_digest(authorization.password or "", password)
    )
    if valid:
        return None
    return jsonify({"error_code": "authentication_required", "message": "请输入展示站点账号和密码。"}), 401, {
        "WWW-Authenticate": 'Basic realm="HubCoord Demo", charset="UTF-8"'
    }


@app.after_request
def security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; "
        "form-action 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'"
    )
    if request.path.startswith("/api/") or request.path in {"/healthz", "/readyz"}:
        response.headers["Cache-Control"] = "no-store"
    return response


@app.errorhandler(413)
def payload_too_large(_error):
    return jsonify({"error_code": "payload_too_large", "message": "请求内容超过 64KB 限制。"}), 413


def json_request(
    *, required: set[str], allowed: set[str], limits: dict[str, int]
) -> tuple[dict | None, tuple]:
    if not request.is_json:
        return None, (jsonify({"error_code": "json_required", "message": "请求必须使用 application/json。"}), 415)
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return None, (jsonify({"error_code": "invalid_request", "message": "JSON 请求体必须是对象。"}), 400)
    if not required <= set(payload):
        return None, (jsonify({"error_code": "invalid_request", "message": "缺少必要字段。"}), 400)
    unknown = set(payload) - allowed
    if unknown:
        return None, (jsonify({"error_code": "invalid_request", "message": f"包含不支持的字段：{', '.join(sorted(unknown))}。"}), 400)
    for field, maximum in limits.items():
        if field not in payload:
            continue
        value = payload[field]
        if not isinstance(value, str):
            return None, (jsonify({"error_code": "invalid_request", "message": f"字段 {field} 必须是字符串。"}), 400)
        if not value.strip() or len(value) > maximum:
            return None, (jsonify({"error_code": "invalid_request", "message": f"字段 {field} 不能为空且不能超过 {maximum} 个字符。"}), 400)
    return payload, ()

PLATFORM_MODULES = [
    {
        "module_id": "case_workspace",
        "name": "案例项目工作台",
        "description": "把研究问题、当前阶段和已形成的协同成果放在同一个可回看的项目中。",
        "status": "available",
        "kind": "workspace",
    },
    {
        "module_id": "knowledge_library",
        "name": "证据与边界库",
        "description": "只呈现经研究团队审阅、可用于本次展示的证据卡，并保留来源和使用边界。",
        "status": "available",
        "kind": "knowledge",
    },
    {
        "module_id": "coordination_lab",
        "name": "协同实验室",
        "description": "从模拟事件、证据和权责规则生成待人工确认的协同议题卡。",
        "status": "available",
        "kind": "simulation",
    },
    {
        "module_id": "case_report",
        "name": "案例叙事与复盘",
        "description": "把项目中的证据链、协同卡和确认记录整理成可下载的模拟案例纪要。",
        "status": "available",
        "kind": "output",
    },
]


def now_iso() -> str:
    display_timezone = ZoneInfo(os.environ.get("HUBCOORD_TIMEZONE", "Asia/Shanghai"))
    return datetime.now(timezone.utc).astimezone(display_timezone).isoformat(timespec="seconds")


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def load_contract(name: str) -> dict:
    return load_json(CONTRACTS / f"{name}.schema.json")


def load_runtime_data() -> dict:
    """加载并校验展示版唯一事实来源；不读取原始访谈文件。"""
    scenario = load_json(DATA / "sc-01-delay-parking-overflow.json")
    evidence = load_json(DATA / "evidence-cards.json")
    rules = load_json(DATA / "authority-rules.json")
    registry = load_json(DATA / "source-registry.json")

    event_schema = load_contract("event")
    evidence_schema = load_contract("evidence-card")
    rule_schema = load_contract("authority-rule")
    for event in scenario["events"]:
        validate(event, event_schema)
    for card in evidence["cards"]:
        validate(card, evidence_schema)
    for rule in rules["rules"]:
        validate(rule, rule_schema)

    evidence_by_id = {card["evidence_id"]: card for card in evidence["cards"]}
    rules_by_id = {rule["rule_id"]: rule for rule in rules["rules"]}
    sources_by_id = {source["source_id"]: source for source in registry["sources"]}
    if not set(scenario["runtime_evidence_refs"]) <= set(evidence_by_id):
        raise ValueError("SC-01 引用了不存在的证据卡")
    if not set(scenario["runtime_authority_rule_refs"]) <= set(rules_by_id):
        raise ValueError("SC-01 引用了不存在的权责规则")
    if not all(card["source_id"] in sources_by_id for card in evidence_by_id.values()):
        raise ValueError("证据卡存在未登记来源")
    runtime_cards = [evidence_by_id[evidence_id] for evidence_id in scenario["runtime_evidence_refs"]]
    disallowed = [
        card["evidence_id"]
        for card in runtime_cards
        if sources_by_id[card["source_id"]].get("allowed_for_demo") is not True
    ]
    if disallowed:
        raise ValueError(f"运行时证据引用了不可展示来源：{', '.join(disallowed)}")
    for action, evidence_ids in scenario.get("action_evidence_refs", {}).items():
        if not set(evidence_ids) <= set(scenario["runtime_evidence_refs"]):
            raise ValueError(f"动作 {action} 引用了运行时之外的证据卡")

    return {
        "scenario": scenario,
        "evidence_by_id": evidence_by_id,
        "rules_by_id": rules_by_id,
        "knowledge_version": evidence["knowledge_version"],
    }


RUNTIME_DATA = load_runtime_data()


def db_path() -> Path:
    return RUNTIME / "hubcoord.sqlite3"


def seed_demo_project() -> None:
    timestamp = now_iso()
    storage.seed_project(db_path(), {
        "project_id": "PJ-DEMO-2026-01",
        "title": "南京南站跨域协同案例（演示档案）",
        "research_question": "在多主体边界下，怎样把线索转化为可核验、可确认的协同事项？",
        "stage": "evidence_review",
        "created_at": timestamp,
        "updated_at": timestamp,
        "activities": [
            {
                "occurred_at": timestamp,
                "type": "project_seeded",
                "message": "已创建平台演示档案；所有材料仍处于案例教学与模拟推演范围。",
            }
        ],
    })


def safe_source(source: dict) -> dict:
    """知识库 API 只返回登记信息，避免把候选材料当作可展示证据。"""
    return {
        key: source[key]
        for key in ("source_id", "title", "source_type", "data_class", "allowed_for_demo", "candidate_topics")
    }


def review_issues() -> dict:
    """读取研究团队整理的冲突清单；这些条目不能作为运行时证据。"""
    return load_json(DATA / "review-issues.json")


def evidence_payload(card: dict) -> dict:
    return {
        "evidence_id": card["evidence_id"],
        "excerpt": card["excerpt"],
        "source_id": card["source_id"],
        "source_title": card["provenance"]["source_title"],
        "locator": card["provenance"]["locator"],
        "data_status": card["data_status"],
    }


def answer_question(question: str) -> dict:
    """基于本次展示可用证据和固定规则回答；资料不足时明确转人工。"""
    text = question.casefold()
    approved = {card["evidence_id"]: card for card in approved_evidence()}

    def cited(*ids: str) -> list[dict]:
        return [evidence_payload(approved[item]) for item in ids if item in approved]

    if any(term in text for term in ("执法", "处罚", "强制", "交管", "直接处置")):
        return {
            "answer": "不可以。平台只能整理线索、说明边界并建议升级，行政执法和处罚仍由法定主体决定。",
            "boundary": "restricted",
            "evidence": cited("EV-SC01-04"),
            "authority_refs": ["AR-SC01-03"],
            "human_gate": True,
        }
    if any(term in text for term in ("数据", "共享", "轨迹", "车牌")):
        return {
            "answer": "当前知识包没有跨主体数据共享授权。平台不能调用或转发未授权数据，只能记录需要核对的数据项。",
            "boundary": "manual_review_required",
            "evidence": cited("EV-SC01-04"),
            "authority_refs": [],
            "human_gate": True,
        }
    if any(term in text for term in ("证据", "来源", "引用", "依据")):
        return {
            "answer": "当前运行时只使用研究团队已审阅、可用于本次展示的材料。每条回答都返回证据编号、来源标题和定位；两份案例稿中的冲突项仍留在核验台。",
            "boundary": "evidence_only",
            "evidence": cited("EV-SC01-01", "EV-SC01-04"),
            "authority_refs": [],
            "human_gate": True,
        }
    if any(term in text for term in ("晚点", "协同", "停车场", "谁负责", "责任")):
        return {
            "answer": "SC-01 可以由现场主管或枢纽联络人发起模拟协同请求，并由现场主管与综管办值守人员确认。停车场的具体权属和管理权限仍有稿件冲突，不能自动判定责任主体。",
            "boundary": "coordination_required",
            "evidence": cited("EV-SC01-01", "EV-SC01-04"),
            "authority_refs": ["AR-SC01-02"],
            "review_refs": ["EVID-004"],
            "human_gate": True,
        }
    return {
        "answer": "当前可展示知识包不足以回答这个问题。请补充可核验来源，或交由研究团队人工判断。",
        "boundary": "insufficient_evidence",
        "evidence": [],
        "authority_refs": [],
        "human_gate": True,
    }


def build_project_report(project_id: str) -> dict | None:
    project = storage.get_project(db_path(), project_id)
    if project is None:
        return None
    cards = storage.list_project_cards(db_path(), project_id)
    for card in cards:
        card["confirmation_records"] = storage.list_confirmations(db_path(), card["card_id"])
    return {
        "report_version": "v1.0",
        "generated_at": now_iso(),
        "data_status": "simulated",
        "project": project,
        "coordination_cards": cards,
        "evidence_index": [
            {
                "evidence_id": card["evidence_id"],
                "excerpt": card["excerpt"],
                "source_title": card["provenance"]["source_title"],
                "locator": card["provenance"]["locator"],
            }
            for card in approved_evidence()
        ],
        "limitations": [
            "本纪要只汇总案例教学与模拟推演数据。",
            "协同议题卡不等于真实处置决定，未连接任何业务系统。",
            "原始访谈和未经审阅的研究材料没有进入运行时。",
        ],
    }


def markdown_plain(value: object) -> str:
    """将用户输入收敛为单行 Markdown 纯文本，避免在下游阅读器中改变文档结构。"""
    text = " ".join(str(value).splitlines())
    text = html.escape(text, quote=False)
    return re.sub(r"([\\`*_{\}\[\]()#+.!|>\-])", r"\\\1", text)


def report_markdown(report: dict) -> str:
    project = report["project"]
    card_lines = []
    for card in report["coordination_cards"]:
        card_lines.extend([
            f"### {card['card_id']}｜{card['status']}",
            "",
            card.get("summary", ""),
            "",
            f"- 事件：`{card['event_id']}`",
            f"- 证据：{', '.join(card['evidence_refs'])}",
            f"- 权责规则：{', '.join(card['authority_refs'])}",
            f"- 下一步：`{card['recommended_next_step']}`",
            f"- 人工确认：{', '.join(card['required_confirmations'])}",
            "- 判断链：",
            *[f"  {index}. {item}" for index, item in enumerate(card.get("decision_trace", []), start=1)],
            "- 决定记录：",
            *(
                [
                    f"  - {item['occurred_at']}｜{item['actor_role']}｜{item['decision']}｜{markdown_plain(item['reason'])}"
                    for item in card.get("confirmation_records", [])
                ]
                or ["  - 尚无人工决定记录。"]
            ),
            "",
        ])
    evidence_lines = [
        f"- `{item['evidence_id']}` {item['excerpt']}（{item['source_title']}，{item['locator']}）"
        for item in report["evidence_index"]
    ]
    activity_lines = [
        f"- {item['occurred_at']}｜{item['type']}｜{item['message']}"
        for item in reversed(project["activities"])
    ]
    return "\n".join([
        f"# {markdown_plain(project['title'])}｜模拟案例纪要",
        "",
        f"> 生成时间：{report['generated_at']}　数据状态：SIMULATED",
        "",
        "## 当前研究问题",
        "",
        markdown_plain(project["research_question"]),
        "",
        "## 协同议题卡",
        "",
        *(card_lines or ["尚未生成协同议题卡。", ""]),
        "## 证据索引",
        "",
        *evidence_lines,
        "",
        "## 项目活动",
        "",
        *activity_lines,
        "",
        "## 使用边界",
        "",
        *[f"- {item}" for item in report["limitations"]],
        "",
    ])


def add_project_activity(project_id: str | None, activity_type: str, message: str) -> None:
    if not project_id or not storage.project_exists(db_path(), project_id):
        return
    timestamp = now_iso()
    storage.add_activity(db_path(), project_id, timestamp, activity_type, message)


def manual_review(event_id: str, reason_code: str, message: str) -> dict:
    result = {
        "status": "manual_review_required",
        "event_id": event_id,
        "reason_code": reason_code,
        "message": message,
        "human_gate": True,
        "data_status": "simulated",
    }
    validate(result, load_contract("manual-review-required"))
    return result


def find_event(event_id: str) -> dict | None:
    return next((event for event in RUNTIME_DATA["scenario"]["events"] if event["event_id"] == event_id), None)


def find_rule(event: dict, action: str) -> dict | None:
    candidates = [
        rule
        for rule_id, rule in RUNTIME_DATA["rules_by_id"].items()
        if rule_id in RUNTIME_DATA["scenario"]["runtime_authority_rule_refs"]
        and rule["event_type"] == event["event_type"]
        and rule["spatial_scope"] == event["spatial_scope"]
        and rule["proposed_action"] == action
        and rule["data_class"] == event["data_status"]
    ]
    return candidates[0] if len(candidates) == 1 else None


def approved_evidence() -> list[dict]:
    return [
        RUNTIME_DATA["evidence_by_id"][evidence_id]
        for evidence_id in RUNTIME_DATA["scenario"]["runtime_evidence_refs"]
        if RUNTIME_DATA["evidence_by_id"][evidence_id]["approval_status"] == "approved"
    ]


def evidence_for_action(action: str) -> list[dict]:
    """按拟议动作选取最小证据集，避免把无关材料挂到议题卡上。"""
    approved = {card["evidence_id"]: card for card in approved_evidence()}
    evidence_ids = RUNTIME_DATA["scenario"].get("action_evidence_refs", {}).get(action, [])
    return [approved[evidence_id] for evidence_id in evidence_ids if evidence_id in approved]


def next_step_for(decision: str) -> str:
    if decision == "within_service_scope":
        return "verify_evidence"
    if decision == "coordination_required":
        return "request_cross_party_confirmation"
    return "escalate_for_human_review"


EXPECTATION_FIELDS = {
    "expect_error": "error",
    "expect_decision": "decision",
    "expect_next_step": "next_step",
    "expect_template_fallback": "template_fallback",
    "expect_validator_result": "validator_result",
    "must_human_gate": "human_gate",
}


def evaluate_golden_case(case: dict) -> dict:
    """不调用制卡流程，只读运行确定性边界判定。"""
    payload = case["input"]
    expected = {
        result_key: case[source_key]
        for source_key, result_key in EXPECTATION_FIELDS.items()
        if source_key in case
    }
    actual = {"human_gate": True}

    if payload.get("scenario_id") != RUNTIME_DATA["scenario"]["scenario_id"]:
        actual["error"] = "scenario_not_found"
    else:
        event = find_event(payload.get("event_id", ""))
        if event is None:
            actual["error"] = "event_not_found"
        else:
            rule = find_rule(event, payload.get("proposed_action", ""))
            if rule is None:
                actual.update({"decision": "unknown", "next_step": "escalate_for_human_review"})
            elif payload.get("acting_role") not in rule["initiator_roles"]:
                actual["error"] = "initiator_not_allowed"
            else:
                actual.update({
                    "decision": rule["decision"],
                    "next_step": next_step_for(rule["decision"]),
                })

            if payload.get("disable_model"):
                actual["template_fallback"] = True
            if "model_text" in payload:
                actual["validator_result"] = (
                    "reject" if actual.get("decision") in {"restricted", "unknown"} else "accept"
                )

    passed = all(actual.get(key) == value for key, value in expected.items())
    return {
        "case_id": case["case_id"],
        "expected": expected,
        "actual": actual,
        "pass": passed,
    }


def card_summary(event: dict, rule: dict) -> tuple[str, str]:
    if rule["decision"] == "restricted":
        return (
            "该模拟事项涉及展示版之外的行政处置边界。系统不能生成处置指令。",
            rule["boundary_reason"],
        )
    return (
        "模拟事件需要先核验已展示的线索，再由对应角色确认下一步协同事项。",
        rule["boundary_reason"],
    )


def draft_card(payload: dict) -> dict:
    event = find_event(payload["event_id"])
    if event is None:
        return manual_review(payload["event_id"], "authority_unknown", "未找到对应事件，无法生成模拟协同议题。")
    rule = find_rule(event, payload["proposed_action"])
    if rule is None:
        return manual_review(event["event_id"], "authority_unknown", "拟议动作没有匹配的展示版权责规则，需人工补充。")
    if payload["acting_role"] not in rule["initiator_roles"]:
        return manual_review(event["event_id"], "initiator_not_allowed", "当前角色不能发起该模拟协同事项。")

    evidence = evidence_for_action(rule["proposed_action"])
    evidence_sources = {card["source_id"] for card in evidence}
    if not evidence or not set(rule["source_ids"]) <= evidence_sources:
        return manual_review(event["event_id"], "evidence_insufficient", "可用证据不足，不能生成可确认的协同议题卡。")

    summary, boundary_notice = card_summary(event, rule)
    card = {
        "card_id": f"CC-DEMO-{uuid.uuid4().hex[:16].upper()}",
        "event_id": event["event_id"],
        "status": "pending_human_confirmation",
        "data_status": event["data_status"],
        "knowledge_version": RUNTIME_DATA["knowledge_version"],
        "evidence_refs": [card["evidence_id"] for card in evidence],
        "authority_refs": [rule["rule_id"]],
        "authority_decision": rule["decision"],
        "decision_trace": [
            f"事件归并 Agent：{event['event_type']} / {event['spatial_scope']} / {event['data_status']}",
            f"证据检索 Agent：命中 {len(evidence)} 张研究团队已审阅且与“{rule['proposed_action']}”有关的证据卡",
            f"权责核验 Agent：{rule['rule_id']} → {rule['decision']}",
            f"议题起草 Agent：形成待人工确认的协同议题；建议下一步为 {next_step_for(rule['decision'])}",
            f"安全审计 Agent：保留人工闸门，需要 {len(rule['required_human_roles'])} 个规定角色作出模拟决定",
        ],
        "summary": summary,
        "recommended_next_step": next_step_for(rule["decision"]),
        "required_confirmations": rule["required_human_roles"],
        "boundary_notice": boundary_notice,
        "human_gate": True,
        "created_at": now_iso(),
    }
    validate(card, load_contract("coordination-card"))
    project_id = payload.get("project_id")
    storage.save_card(db_path(), card, project_id)
    if project_id:
        add_project_activity(project_id, "coordination_card_drafted", f"已从 {event['event_id']} 生成模拟协同议题卡 {card['card_id']}。")
    append_audit(card, "drafted", payload["acting_role"], "生成模拟协同议题卡。")
    return card


def make_audit_record(card: dict, action: str, actor_role: str, reason: str) -> dict:
    record = {
        "record_id": f"AL-DEMO-{uuid.uuid4().hex[:16].upper()}",
        "card_id": card["card_id"],
        "event_id": card["event_id"],
        "action": action,
        "actor_role": actor_role,
        "occurred_at": now_iso(),
        "reason": reason,
        "data_status": "simulated",
    }
    validate(record, load_contract("audit-record"))
    return record


def write_audit_copy(record: dict) -> None:
    """JSONL 是人工查看用副本；写入失败不回滚 SQLite 中的权威记录。"""
    try:
        RUNTIME.mkdir(exist_ok=True)
        with (RUNTIME / "audit-log.jsonl").open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")
    except OSError:
        app.logger.exception("无法写入附加审计日志副本")


def append_audit(card: dict, action: str, actor_role: str, reason: str) -> dict:
    record = make_audit_record(card, action, actor_role, reason)
    storage.record_audit(db_path(), record)
    write_audit_copy(record)
    return record


@app.get("/")
def index():
    return send_from_directory(ROOT / "static", "index.html")


@app.get("/cad")
def cad_redirect():
    """统一补上末尾斜杠，保证 CAD 的相对资源路径始终落在 /cad/ 下。"""
    return redirect("/cad/", code=308)


@app.get("/cad/")
def cad_index():
    return send_from_directory(CAD_STATIC, "app.html")


@app.get("/cad/<path:asset_name>")
def cad_static_asset(asset_name: str):
    """提供经过本地构建的 CAD 页面、数据与哈希静态资源。"""
    asset_path = CAD_STATIC / asset_name
    allowed_suffixes = {
        ".css", ".html", ".jpeg", ".jpg", ".js", ".json", ".map",
        ".png", ".svg", ".wasm", ".webp",
    }
    if asset_path.suffix.lower() not in allowed_suffixes or not asset_path.is_file():
        return jsonify({"error_code": "not_found", "message": "资源不存在。"}), 404
    return send_from_directory(CAD_STATIC, asset_name)


@app.get("/<path:asset_name>")
def root_static_asset(asset_name: str):
    """从根路径提供评委展示站的多页面和本地资源。"""
    allowed_assets = {
        "agent-home.html",
        "analysis.html",
        "app.js",
        "assets/city-brain-dashboard.jpeg",
        "assets/city-team.jpeg",
        "assets/coordination-meeting.jpeg",
        "assets/favicon.svg",
        "assets/nanyong-mark.svg",
        "assets/nanjing-south-aerial.jpeg",
        "assets/parking-scene.jpeg",
        "assets/patrol-team.jpeg",
        "assets/service-station.jpeg",
        "case.html",
        "demo.html",
        "evidence.html",
        "index.html",
        "mechanism.html",
        "offline-data.js",
        "site.css",
        "site.js",
        "solution.html",
        "story.html",
        "showcase.css",
        "showcase.js",
        "styles.css",
    }
    if asset_name not in allowed_assets:
        return jsonify({"error_code": "not_found", "message": "资源不存在。"}), 404
    return send_from_directory(ROOT / "static", asset_name)


@app.get("/healthz")
def healthz():
    seed_demo_project()
    return jsonify({
        "status": "ok",
        "knowledge_version": RUNTIME_DATA["knowledge_version"],
        "mode": "case_teaching_simulation",
        "persistence": "sqlite",
        "database_ready": storage.check(db_path()),
    })


@app.get("/readyz")
def readyz():
    try:
        seed_demo_project()
        ready = storage.check(db_path())
    except (OSError, sqlite3.Error):
        ready = False
    return jsonify({"status": "ready" if ready else "not_ready"}), 200 if ready else 503


@app.get("/api/v1/platform")
def platform_overview():
    """平台壳层的模块清单与共同约束。"""
    return jsonify({
        "platform_name": "南站协同官",
        "version": "1.0-local-release-candidate",
        "mode": "case_teaching_simulation",
        "modules": PLATFORM_MODULES,
        "guardrails": [
            "只使用研究团队已审阅、可用于本次展示的证据卡；原始研究材料不会进入展示运行时。",
            "系统生成的是待人工确认的协同议题，不发送指令、不执法、不连接真实业务系统。",
            "每次生成与人工决定都记录为可回看的模拟活动。",
        ],
    })


@app.get("/api/v1/knowledge/evidence")
def knowledge_evidence():
    registry = load_json(DATA / "source-registry.json")
    approved = approved_evidence()
    referenced_sources = {card["source_id"] for card in approved}
    return jsonify({
        "knowledge_version": RUNTIME_DATA["knowledge_version"],
        "usage_rule": "仅返回研究团队已审阅、可用于本次展示的证据卡；候选研究材料仍需审阅与脱敏。",
        "evidence_cards": approved,
        "sources": [safe_source(source) for source in registry["sources"] if source["source_id"] in referenced_sources],
    })


@app.get("/api/v1/knowledge/review-issues")
def knowledge_review_issues():
    return jsonify(review_issues())


@app.get("/api/v1/authority")
def authority_overview():
    scenario = RUNTIME_DATA["scenario"]
    return jsonify({
        "rule_version": load_json(DATA / "authority-rules.json")["rule_version"],
        "usage_rule": "权责结论来自研究团队维护的结构化规则；模型不能新增或修改权限。",
        "roles": scenario["roles"],
        "rules": [
            RUNTIME_DATA["rules_by_id"][rule_id]
            for rule_id in scenario["runtime_authority_rule_refs"]
        ],
    })


@app.post("/api/v1/assistant/query")
def assistant_query():
    payload, error = json_request(
        required={"question"}, allowed={"question"}, limits={"question": 300}
    )
    if error:
        return error
    question = str(payload.get("question", "")).strip()
    return jsonify({
        "mode": "deterministic_evidence_query",
        "question": question[:300],
        **answer_question(question[:300]),
    })


@app.get("/api/v1/projects")
def list_projects():
    seed_demo_project()
    return jsonify({"projects": storage.list_projects(db_path())})


@app.post("/api/v1/projects")
def create_project():
    payload, error = json_request(
        required={"title", "research_question"},
        allowed={"title", "research_question"},
        limits={"title": 80, "research_question": 400},
    )
    if error:
        return error
    title = str(payload.get("title", "")).strip()
    research_question = str(payload.get("research_question", "")).strip()
    if any(character in title for character in "\r\n\x00"):
        return jsonify({"error_code": "invalid_request", "message": "项目名称不能包含换行或控制字符。"}), 400
    timestamp = now_iso()
    project = {
        "project_id": f"PJ-DEMO-{uuid.uuid4().hex[:16].upper()}",
        "title": title[:80],
        "research_question": research_question[:400],
        "stage": "framing",
        "created_at": timestamp,
        "updated_at": timestamp,
        "activities": [{
            "occurred_at": timestamp,
            "type": "project_created",
            "message": "已创建本地演示项目；尚未导入任何真实研究材料。",
        }],
    }
    return jsonify({"project": storage.create_project(db_path(), project)}), 201


@app.get("/api/v1/projects/<project_id>")
def project_detail(project_id: str):
    project = storage.get_project(db_path(), project_id)
    if project is None:
        return jsonify({"error_code": "project_not_found", "message": "案例项目不存在。"}), 404
    project["cards"] = storage.list_project_cards(db_path(), project_id)
    for card in project["cards"]:
        card["confirmed_roles"] = sorted(storage.confirmed_roles(db_path(), card["card_id"]))
        card["confirmation_records"] = storage.list_confirmations(db_path(), card["card_id"])
    return jsonify({"project": project})


@app.get("/api/v1/projects/<project_id>/report")
def project_report(project_id: str):
    report = build_project_report(project_id)
    if report is None:
        return jsonify({"error_code": "project_not_found", "message": "案例项目不存在。"}), 404
    return jsonify({"report": report})


@app.get("/api/v1/projects/<project_id>/export.md")
def export_project_report(project_id: str):
    report = build_project_report(project_id)
    if report is None:
        return jsonify({"error_code": "project_not_found", "message": "案例项目不存在。"}), 404
    filename = f"{project_id}-case-report.md"
    return Response(
        report_markdown(report),
        content_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/api/v1/scenarios")
def scenarios():
    scenario = RUNTIME_DATA["scenario"]
    return jsonify({"scenarios": [{"scenario_id": scenario["scenario_id"], "title": scenario["title"], "data_status": scenario["data_status"]}]})


@app.get("/api/v1/scenarios/<scenario_id>")
def scenario_detail(scenario_id: str):
    scenario = RUNTIME_DATA["scenario"]
    if scenario_id != scenario["scenario_id"]:
        return jsonify({"error_code": "scenario_not_found", "message": "情景不存在。"}), 404
    return jsonify(scenario)


@app.get("/api/v1/evaluation")
def evaluation():
    golden_set = load_json(EVAL / "golden-cases.json")
    results = [evaluate_golden_case(case) for case in golden_set["cases"]]
    passed = sum(result["pass"] for result in results)
    total = len(results)
    return jsonify({
        "set_version": golden_set["set_version"],
        "purpose": golden_set["purpose"],
        "cases": results,
        "summary": {
            "total": total,
            "passed": passed,
            "failed": total - passed,
            "pass_rate": passed / total if total else 0,
        },
    })


@app.post("/api/v1/cards/draft")
def create_draft():
    required = {"scenario_id", "event_id", "acting_role", "proposed_action"}
    payload, error = json_request(
        required=required,
        allowed=required | {"project_id"},
        limits={
            "scenario_id": 40,
            "event_id": 80,
            "acting_role": 80,
            "proposed_action": 100,
            "project_id": 80,
        },
    )
    if error:
        return error
    if payload["scenario_id"] != RUNTIME_DATA["scenario"]["scenario_id"]:
        return jsonify({"error_code": "invalid_request", "message": "缺少必要字段或情景编号不正确。"}), 400
    if payload.get("project_id") and not storage.project_exists(db_path(), payload["project_id"]):
        return jsonify({"error_code": "project_not_found", "message": "所选案例项目不存在。"}), 404
    return jsonify(draft_card(payload))


@app.post("/api/v1/cards/<card_id>/decisions")
def decide(card_id: str):
    stored = storage.get_card(db_path(), card_id)
    if stored is None:
        return jsonify({"error_code": "card_not_found", "message": "协同议题卡不存在。"}), 404
    card, project_id = stored
    payload, error = json_request(
        required={"actor_role", "decision", "reason"},
        allowed={"actor_role", "decision", "reason"},
        limits={"actor_role": 80, "decision": 40},
    )
    if error:
        return error
    if card["status"] in {"confirmed", "rejected", "escalated"}:
        return jsonify({"error_code": "card_terminal", "message": "该议题卡已经形成终态，不能再次修改。"}), 409
    if payload["decision"] not in {"confirmed", "rejected", "escalated"}:
        return jsonify({"error_code": "invalid_decision", "message": "不支持该决定。"}), 400
    if payload["actor_role"] not in card["required_confirmations"]:
        return jsonify({"error_code": "confirmation_not_allowed", "message": "当前角色不是该卡片的必要确认者。"}), 400
    authority_rule = RUNTIME_DATA["rules_by_id"].get(card["authority_refs"][0])
    if authority_rule and authority_rule["decision"] == "restricted" and payload["decision"] == "confirmed":
        return jsonify({
            "error_code": "restricted_confirmation_invalid",
            "message": "受限事项不能进入“已确认”状态，请拒绝或升级人工处理。",
        }), 409
    if not isinstance(payload["reason"], str) or len(payload["reason"]) > 500:
        return jsonify({"error_code": "invalid_request", "message": "决定理由必须是字符串且不能超过 500 个字符。"}), 400
    reason = payload["reason"].strip()
    if not reason:
        return jsonify({"error_code": "reason_required", "message": "请填写本次决定的依据。"}), 400
    if payload["decision"] == "confirmed" and payload["actor_role"] in storage.confirmed_roles(db_path(), card_id):
        return jsonify({"error_code": "duplicate_confirmation", "message": "当前角色已经确认过这张议题卡。"}), 409

    decision_time = now_iso()
    record = make_audit_record(card, payload["decision"], payload["actor_role"], reason[:500])
    try:
        card, confirmed_roles = storage.apply_decision(
            db_path(),
            card_id=card_id,
            actor_role=payload["actor_role"],
            decision=payload["decision"],
            reason=reason[:500],
            occurred_at=decision_time,
            audit_record=record,
            activity_type=f"coordination_card_{payload['decision']}",
            activity_message=f"{payload['actor_role']} 对模拟议题卡 {card_id} 作出“{payload['decision']}”记录。",
        )
    except storage.DecisionConflict as error:
        status = 404 if error.code == "card_not_found" else 409
        return jsonify({"error_code": error.code, "message": error.message}), status
    write_audit_copy(record)
    return jsonify({
        **record,
        "card_status": card["status"],
        "confirmed_roles": sorted(confirmed_roles),
    })


if __name__ == "__main__":
    app.run(host=os.environ.get("HUBCOORD_HOST", "127.0.0.1"), port=int(os.environ.get("HUBCOORD_PORT", "8152")), debug=False)
