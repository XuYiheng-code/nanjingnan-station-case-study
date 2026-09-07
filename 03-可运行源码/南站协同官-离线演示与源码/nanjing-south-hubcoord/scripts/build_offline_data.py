#!/usr/bin/env python3
"""用标准库生成 Finder 直接打开时使用的审阅数据快照。"""
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
STARTER = ROOT.parent
DATA = STARTER / "data"

PLATFORM_MODULES = [
    {"module_id": "case_workspace", "name": "案例项目工作台", "description": "把研究问题、当前阶段和已形成的协同成果放在同一个可回看的项目中。", "status": "available", "kind": "workspace"},
    {"module_id": "knowledge_library", "name": "证据与边界库", "description": "只呈现经研究团队审阅、可用于本次展示的证据卡，并保留来源和使用边界。", "status": "available", "kind": "knowledge"},
    {"module_id": "coordination_lab", "name": "协同实验室", "description": "从模拟事件、证据和权责规则生成待人工确认的协同议题卡。", "status": "available", "kind": "simulation"},
    {"module_id": "case_report", "name": "案例叙事与复盘", "description": "把项目中的证据链、协同卡和确认记录整理成可下载的模拟案例纪要。", "status": "available", "kind": "output"},
]


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def main() -> None:
    scenario = load_json(DATA / "sc-01-delay-parking-overflow.json")
    evidence_set = load_json(DATA / "evidence-cards.json")
    evidence_by_id = {item["evidence_id"]: item for item in evidence_set["cards"]}
    evidence = [
        evidence_by_id[evidence_id]
        for evidence_id in scenario["runtime_evidence_refs"]
        if evidence_by_id[evidence_id]["approval_status"] == "approved"
    ]
    registry = load_json(DATA / "source-registry.json")
    referenced_sources = {card["source_id"] for card in evidence}
    rules_set = load_json(DATA / "authority-rules.json")
    rules_by_id = {item["rule_id"]: item for item in rules_set["rules"]}
    timestamp = "2026-09-06T09:00:00+08:00"
    seed_project = {
        "project_id": "PJ-DEMO-OFFLINE-01",
        "title": "南京南站跨域协同案例（离线演示）",
        "research_question": "平台企业如何在制度边界内降低跨主体协同成本？",
        "stage": "evidence_review",
        "created_at": timestamp,
        "updated_at": timestamp,
        "activities": [{"occurred_at": timestamp, "type": "project_seeded", "message": "已加载离线演示档案；所有内容仅用于案例教学与模拟推演。"}],
        "cards": [],
    }
    payload = {
        "platform": {"platform_name": "南站协同官", "version": "1.1-offline", "mode": "case_teaching_simulation", "modules": PLATFORM_MODULES},
        "knowledge": {
            "knowledge_version": evidence_set["knowledge_version"],
            "evidence_cards": evidence,
            "sources": [
                {key: source[key] for key in ("source_id", "title", "source_type", "data_class", "allowed_for_demo", "candidate_topics")}
                for source in registry["sources"]
                if source["source_id"] in referenced_sources
            ],
        },
        "review": load_json(DATA / "review-issues.json"),
        "authority": {
            "rule_version": rules_set["rule_version"],
            "roles": scenario["roles"],
            "rules": [rules_by_id[rule_id] for rule_id in scenario["runtime_authority_rule_refs"]],
        },
        "scenario": scenario,
        "seed_project": seed_project,
    }
    target = ROOT / "static" / "offline-data.js"
    target.write_text(
        "window.HUBCOORD_OFFLINE_DATA = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"已生成 {target}")


if __name__ == "__main__":
    main()
