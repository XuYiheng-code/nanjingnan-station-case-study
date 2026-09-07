import copy
import json
import os
import shutil
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch

import app


class HubCoordApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = Path(tempfile.mkdtemp())
        self.original_runtime = app.RUNTIME
        app.RUNTIME = self.temp_dir
        self.client = app.app.test_client()

    def tearDown(self):
        app.RUNTIME = self.original_runtime
        shutil.rmtree(self.temp_dir)

    def draft(self, action="verify_evidence", role="operator_supervisor"):
        return self.client.post("/api/v1/cards/draft", json={
            "scenario_id": "SC-01",
            "event_id": "NJS-DEMO-SC01-E01",
            "acting_role": role,
            "proposed_action": action,
        })

    def test_starter_path_matches_current_directory_layout(self):
        expected = Path(__file__).resolve().parent.parent
        self.assertEqual(app.STARTER, expected)
        self.assertTrue((app.STARTER / "data").is_dir())
        self.assertTrue((app.STARTER / "contracts").is_dir())
        self.assertTrue((app.STARTER / "eval" / "golden-cases.json").is_file())

    def test_health_and_scenario(self):
        health = self.client.get("/healthz")
        scenario = self.client.get("/api/v1/scenarios/SC-01")
        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.get_json()["mode"], "case_teaching_simulation")
        self.assertEqual(health.get_json()["persistence"], "sqlite")
        self.assertTrue(health.get_json()["database_ready"])
        self.assertEqual(scenario.get_json()["data_status"], "simulated")
        self.assertIn("base-uri 'none'", health.headers["Content-Security-Policy"])
        self.assertIn("frame-ancestors 'none'", health.headers["Content-Security-Policy"])

    def test_root_page_serves_sibling_assets_for_shared_online_offline_markup(self):
        page = self.client.get("/")
        css = self.client.get("/showcase.css")
        javascript = self.client.get("/showcase.js")
        hero = self.client.get("/assets/nanjing-south-aerial.jpeg")
        logo = self.client.get("/assets/nanyong-mark.svg")
        story = self.client.get("/story.html")
        analysis = self.client.get("/analysis.html")
        agent_home = self.client.get("/agent-home.html")
        offline_data = self.client.get("/offline-data.js")
        demo = self.client.get("/demo.html")
        case = self.client.get("/case.html")
        cad_redirect = self.client.get("/cad")
        cad = self.client.get("/cad/")
        cad_data = self.client.get("/cad/data/facts.json")

        self.assertEqual(page.status_code, 200)
        self.assertIn("政企共创平台企业", page.get_data(as_text=True))
        self.assertIn("何以化解行政分割难题", page.get_data(as_text=True))
        self.assertIn("南雍治道", page.get_data(as_text=True))
        self.assertIn('href="./showcase.css"', page.get_data(as_text=True))
        self.assertIn('src="./showcase.js"', page.get_data(as_text=True))
        self.assertIn("text/css", css.content_type)
        self.assertIn("javascript", javascript.content_type)
        self.assertIn("image/jpeg", hero.content_type)
        self.assertIn("image/svg+xml", logo.content_type)
        self.assertIn("一座车站", story.get_data(as_text=True))
        self.assertIn("平台何以有效", analysis.get_data(as_text=True))
        self.assertIn("南站协同官", agent_home.get_data(as_text=True))
        self.assertIn("javascript", offline_data.content_type)
        self.assertEqual(demo.status_code, 200)
        self.assertEqual(case.status_code, 200)
        self.assertIn("操作 Demo", demo.get_data(as_text=True))
        self.assertIn("案例全景", case.get_data(as_text=True))
        self.assertEqual(cad_redirect.status_code, 308)
        self.assertEqual(cad_redirect.headers["Location"], "/cad/")
        self.assertIn("南京南站治理运行沙盘", cad.get_data(as_text=True))
        self.assertEqual(cad_data.status_code, 200)
        self.assertIn("application/json", cad_data.content_type)
        for response in (page, css, javascript, hero, logo, story, analysis, agent_home, offline_data, demo, case, cad_redirect, cad, cad_data):
            response.close()

    def test_optional_basic_auth_protects_application_but_not_health(self):
        with patch.dict(os.environ, {
            "HUBCOORD_AUTH_USER": "demo",
            "HUBCOORD_AUTH_PASSWORD": "private-pass",
        }):
            self.assertEqual(self.client.get("/healthz").status_code, 200)
            denied = self.client.get("/api/v1/projects")
            self.assertEqual(denied.status_code, 401)
            self.assertIn("Basic", denied.headers["WWW-Authenticate"])
            allowed = self.client.get(
                "/api/v1/projects",
                headers={"Authorization": "Basic ZGVtbzpwcml2YXRlLXBhc3M="},
            )
            self.assertEqual(allowed.status_code, 200)

    def test_post_endpoints_reject_non_object_and_extra_fields(self):
        array_body = self.client.post("/api/v1/assistant/query", json=["不是对象"])
        extra_field = self.client.post("/api/v1/projects", json={
            "title": "测试", "research_question": "测试？", "unexpected": True,
        })
        wrong_type = self.client.post("/api/v1/cards/draft", json={
            "scenario_id": "SC-01",
            "event_id": ["NJS-DEMO-SC01-E01"],
            "acting_role": "operator_supervisor",
            "proposed_action": "verify_evidence",
        })
        non_json = self.client.post("/api/v1/assistant/query", data="question=test")
        self.assertEqual(array_body.status_code, 400)
        self.assertEqual(extra_field.status_code, 400)
        self.assertEqual(wrong_type.status_code, 400)
        self.assertEqual(non_json.status_code, 415)

    def test_platform_exposes_modules_and_approved_knowledge_only(self):
        platform = self.client.get("/api/v1/platform")
        knowledge = self.client.get("/api/v1/knowledge/evidence")
        self.assertEqual(platform.status_code, 200)
        self.assertEqual({module["module_id"] for module in platform.get_json()["modules"]}, {
            "case_workspace", "knowledge_library", "coordination_lab", "case_report"
        })
        self.assertEqual(knowledge.status_code, 200)
        self.assertTrue(knowledge.get_json()["evidence_cards"])
        self.assertTrue(all(card["approval_status"] == "approved" for card in knowledge.get_json()["evidence_cards"]))

    def test_runtime_rejects_evidence_from_source_not_allowed_for_demo(self):
        original_load_json = app.load_json

        def altered_load_json(path):
            payload = copy.deepcopy(original_load_json(path))
            if path.name == "source-registry.json":
                next(source for source in payload["sources"] if source["source_id"] == "SIM-SC01-01")["allowed_for_demo"] = False
            return payload

        with patch.object(app, "load_json", side_effect=altered_load_json):
            with self.assertRaisesRegex(ValueError, "不可展示来源"):
                app.load_runtime_data()

    def test_review_issues_are_separate_from_runtime_evidence(self):
        response = self.client.get("/api/v1/knowledge/review-issues")
        payload = response.get_json()
        knowledge = self.client.get("/api/v1/knowledge/evidence").get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["data_status"], "research_review")
        self.assertEqual(len(payload["issues"]), 4)
        self.assertTrue(all(issue["risk"] == "高" for issue in payload["issues"]))
        self.assertFalse({issue["issue_id"] for issue in payload["issues"]} & {
            card["evidence_id"] for card in knowledge["evidence_cards"]
        })

    def test_authority_overview_exposes_fixed_rules_and_roles(self):
        response = self.client.get("/api/v1/authority")
        payload = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(payload["roles"]), 3)
        self.assertEqual({rule["decision"] for rule in payload["rules"]}, {
            "within_service_scope", "coordination_required", "restricted"
        })

    def test_assistant_answers_with_evidence_and_refuses_overreach(self):
        enforcement = self.client.post("/api/v1/assistant/query", json={
            "question": "平台可以直接要求交管处罚吗？"
        }).get_json()
        unknown = self.client.post("/api/v1/assistant/query", json={
            "question": "请判断一个知识包里没有的新问题"
        }).get_json()
        self.assertEqual(enforcement["boundary"], "restricted")
        self.assertEqual(enforcement["authority_refs"], ["AR-SC01-03"])
        self.assertEqual(enforcement["evidence"][0]["evidence_id"], "EV-SC01-04")
        self.assertTrue(enforcement["human_gate"])
        self.assertEqual(unknown["boundary"], "insufficient_evidence")
        self.assertEqual(unknown["evidence"], [])

    def test_project_can_hold_coordination_activity(self):
        created = self.client.post("/api/v1/projects", json={
            "title": "协同边界研究", "research_question": "如何核验跨主体协同线索？"
        })
        self.assertEqual(created.status_code, 201)
        project = created.get_json()["project"]
        card = self.client.post("/api/v1/cards/draft", json={
            "scenario_id": "SC-01", "event_id": "NJS-DEMO-SC01-E01",
            "acting_role": "operator_supervisor", "proposed_action": "verify_evidence",
            "project_id": project["project_id"],
        }).get_json()
        detail = self.client.get(f"/api/v1/projects/{project['project_id']}").get_json()["project"]
        self.assertEqual(card["status"], "pending_human_confirmation")
        self.assertIn("coordination_card_drafted", [activity["type"] for activity in detail["activities"]])
        self.assertEqual(detail["cards"][0]["card_id"], card["card_id"])

    def test_markdown_export_escapes_user_authored_structure(self):
        created = self.client.post("/api/v1/projects", json={
            "title": "<b>案例</b>",
            "research_question": "# 伪标题\n<script>alert(1)</script>",
        }).get_json()["project"]
        exported = self.client.get(f"/api/v1/projects/{created['project_id']}/export.md")
        text = exported.get_data(as_text=True)
        self.assertNotIn("<script>", text)
        self.assertNotIn("\n# 伪标题", text)
        self.assertIn("&lt;script&gt;", text)

    def test_projects_and_cards_survive_new_database_connections(self):
        created = self.client.post("/api/v1/projects", json={
            "title": "持久化验收", "research_question": "服务重启后活动是否仍可读取？"
        }).get_json()["project"]
        card = self.client.post("/api/v1/cards/draft", json={
            "scenario_id": "SC-01", "event_id": "NJS-DEMO-SC01-E01",
            "acting_role": "operator_supervisor", "proposed_action": "verify_evidence",
            "project_id": created["project_id"],
        }).get_json()
        reopened_project = app.storage.get_project(app.db_path(), created["project_id"])
        reopened_card, project_id = app.storage.get_card(app.db_path(), card["card_id"])
        self.assertEqual(reopened_project["title"], "持久化验收")
        self.assertEqual(reopened_card["card_id"], card["card_id"])
        self.assertEqual(project_id, created["project_id"])

    def test_project_report_exports_traceable_markdown(self):
        created = self.client.post("/api/v1/projects", json={
            "title": "导出验收", "research_question": "协同记录能否形成可追溯纪要？"
        }).get_json()["project"]
        card = self.client.post("/api/v1/cards/draft", json={
            "scenario_id": "SC-01", "event_id": "NJS-DEMO-SC01-E01",
            "acting_role": "operator_supervisor", "proposed_action": "verify_evidence",
            "project_id": created["project_id"],
        }).get_json()
        response = self.client.get(f"/api/v1/projects/{created['project_id']}/export.md")
        text = response.get_data(as_text=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/markdown", response.content_type)
        self.assertIn("导出验收｜模拟案例纪要", text)
        self.assertIn(card["card_id"], text)
        self.assertIn("EV-SC01-01", text)
        self.assertIn("使用边界", text)

    def test_draft_card_is_traceable_and_human_gated(self):
        response = self.draft("request_cross_party_confirmation")
        card = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(card["status"], "pending_human_confirmation")
        self.assertTrue(card["human_gate"])
        self.assertEqual(card["authority_refs"], ["AR-SC01-02"])
        self.assertEqual(card["required_confirmations"], ["operator_supervisor", "management_office_duty"])
        self.assertEqual(card["evidence_refs"], [
            "EV-SC01-01", "EV-SC01-04", "EV-CT-01", "EV-CT-03", "EV-CA-01", "EV-CA-02"
        ])
        self.assertEqual(len(card["decision_trace"]), 5)
        self.assertIn("AR-SC01-02", card["decision_trace"][2])
        self.assertIn("议题起草 Agent", card["decision_trace"][3])

    def test_restricted_action_cannot_be_presented_as_execution(self):
        response = self.draft("direct_enforcement")
        card = response.get_json()
        self.assertEqual(card["recommended_next_step"], "escalate_for_human_review")
        self.assertIn("不能", card["summary"])
        self.assertTrue(card["human_gate"])
        response = self.client.post(f"/api/v1/cards/{card['card_id']}/decisions", json={
            "actor_role": "management_office_duty",
            "decision": "confirmed",
            "reason": "尝试确认受限事项。",
        })
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.get_json()["error_code"], "restricted_confirmation_invalid")
        self.assertEqual(app.storage.get_card(app.db_path(), card["card_id"])[0]["status"], "pending_human_confirmation")

    def test_unknown_action_requires_manual_review(self):
        response = self.draft("share_restricted_data")
        result = response.get_json()
        self.assertEqual(result["status"], "manual_review_required")
        self.assertEqual(result["reason_code"], "authority_unknown")

    def test_evaluation_covers_deterministic_boundary_cases(self):
        response = self.client.get("/api/v1/evaluation")
        result = response.get_json()
        cases = {case["case_id"]: case for case in result["cases"]}

        self.assertEqual(response.status_code, 200)
        self.assertEqual(result["summary"], {
            "total": 20, "passed": 20, "failed": 0, "pass_rate": 1.0
        })
        self.assertEqual(cases["GC-06"]["actual"]["error"], "event_not_found")
        self.assertEqual(cases["GC-04"]["actual"]["decision"], "unknown")
        self.assertEqual(cases["GC-04"]["actual"]["next_step"], "escalate_for_human_review")
        self.assertEqual(cases["GC-03"]["actual"]["decision"], "restricted")
        self.assertEqual(cases["GC-03"]["actual"]["next_step"], "escalate_for_human_review")
        self.assertTrue(all(case["actual"]["human_gate"] for case in result["cases"]))
        self.assertTrue(all(case["pass"] for case in result["cases"]))

    def test_evaluation_is_repeatable_and_does_not_write_runtime_state(self):
        database = app.db_path()
        audit_log = self.temp_dir / "audit-log.jsonl"

        first = self.client.get("/api/v1/evaluation")
        second = self.client.get("/api/v1/evaluation")

        self.assertEqual(first.get_json(), second.get_json())
        self.assertFalse(database.exists())
        self.assertFalse(audit_log.exists())

    def test_non_initiator_cannot_start_cross_party_request(self):
        response = self.draft("request_cross_party_confirmation", "management_office_duty")
        result = response.get_json()
        self.assertEqual(result["status"], "manual_review_required")
        self.assertEqual(result["reason_code"], "initiator_not_allowed")

    def test_all_required_roles_must_confirm_before_card_is_confirmed(self):
        card = self.draft("request_cross_party_confirmation").get_json()
        first = self.client.post(f"/api/v1/cards/{card['card_id']}/decisions", json={
            "actor_role": "operator_supervisor", "decision": "confirmed", "reason": "模拟确认。"
        })
        self.assertEqual(first.status_code, 200)
        self.assertEqual(app.storage.get_card(app.db_path(), card["card_id"])[0]["status"], "pending_human_confirmation")
        second = self.client.post(f"/api/v1/cards/{card['card_id']}/decisions", json={
            "actor_role": "management_office_duty", "decision": "confirmed", "reason": "模拟复核。"
        })
        self.assertEqual(second.status_code, 200)
        self.assertEqual(app.storage.get_card(app.db_path(), card["card_id"])[0]["status"], "confirmed")
        records = [json.loads(line) for line in (self.temp_dir / "audit-log.jsonl").read_text().splitlines()]
        self.assertEqual([record["action"] for record in records], ["drafted", "confirmed", "confirmed"])
        self.assertEqual(app.storage.audit_count(app.db_path()), 3)

    def test_partial_confirmation_and_reason_survive_project_reload_and_export(self):
        project = self.client.post("/api/v1/projects", json={
            "title": "进度恢复", "research_question": "部分确认后能否恢复进度？"
        }).get_json()["project"]
        card = self.client.post("/api/v1/cards/draft", json={
            "scenario_id": "SC-01",
            "event_id": "NJS-DEMO-SC01-E01",
            "acting_role": "operator_supervisor",
            "proposed_action": "request_cross_party_confirmation",
            "project_id": project["project_id"],
        }).get_json()
        response = self.client.post(f"/api/v1/cards/{card['card_id']}/decisions", json={
            "actor_role": "operator_supervisor",
            "decision": "confirmed",
            "reason": "已核对模拟列车晚点线索，等待综管办确认协同范围。",
        })
        self.assertEqual(response.status_code, 200)

        detail = self.client.get(f"/api/v1/projects/{project['project_id']}").get_json()["project"]
        saved = detail["cards"][0]
        self.assertEqual(saved["status"], "pending_human_confirmation")
        self.assertEqual(saved["confirmed_roles"], ["operator_supervisor"])
        self.assertEqual(saved["confirmation_records"][0]["decision"], "confirmed")

        markdown = self.client.get(f"/api/v1/projects/{project['project_id']}/export.md").get_data(as_text=True)
        self.assertIn("判断链", markdown)
        self.assertIn("AR-SC01-02", markdown)
        self.assertIn("等待综管办确认协同范围", markdown)

    def test_parallel_required_confirmations_reach_confirmed_without_lost_update(self):
        card = self.draft("request_cross_party_confirmation").get_json()

        def confirm(role: str):
            with app.app.test_client() as client:
                return client.post(f"/api/v1/cards/{card['card_id']}/decisions", json={
                    "actor_role": role,
                    "decision": "confirmed",
                    "reason": f"{role} 并发确认测试。",
                }).status_code

        with ThreadPoolExecutor(max_workers=2) as executor:
            statuses = list(executor.map(confirm, ["operator_supervisor", "management_office_duty"]))

        saved = app.storage.get_card(app.db_path(), card["card_id"])[0]
        self.assertEqual(statuses, [200, 200])
        self.assertEqual(saved["status"], "confirmed")
        self.assertEqual(app.storage.confirmed_roles(app.db_path(), card["card_id"]), {
            "operator_supervisor", "management_office_duty"
        })

    def test_decision_requires_reason_and_terminal_card_is_immutable(self):
        card = self.draft("verify_evidence").get_json()
        missing_reason = self.client.post(f"/api/v1/cards/{card['card_id']}/decisions", json={
            "actor_role": "operator_supervisor", "decision": "confirmed", "reason": "  "
        })
        self.assertEqual(missing_reason.status_code, 400)
        self.assertEqual(missing_reason.get_json()["error_code"], "reason_required")

        confirmed = self.client.post(f"/api/v1/cards/{card['card_id']}/decisions", json={
            "actor_role": "operator_supervisor", "decision": "confirmed", "reason": "已核对模拟证据。"
        })
        self.assertEqual(confirmed.status_code, 200)
        repeated = self.client.post(f"/api/v1/cards/{card['card_id']}/decisions", json={
            "actor_role": "operator_supervisor", "decision": "rejected", "reason": "尝试覆盖终态。"
        })
        self.assertEqual(repeated.status_code, 409)
        self.assertEqual(repeated.get_json()["error_code"], "card_terminal")


if __name__ == "__main__":
    unittest.main()
