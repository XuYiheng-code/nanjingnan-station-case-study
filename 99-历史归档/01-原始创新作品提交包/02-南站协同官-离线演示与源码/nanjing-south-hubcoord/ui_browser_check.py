import os
import uuid

from playwright.sync_api import expect, sync_playwright


base_url = os.environ.get("HUBCOORD_TEST_URL", "http://127.0.0.1:8152").rstrip("/")


with sync_playwright() as playwright:
    project_title = f"浏览器验收项目-{uuid.uuid4().hex[:6]}"
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1060})
    console_errors = []
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
    page.goto(base_url, wait_until="networkidle")
    expect(page.locator("h1")).to_contain_text("从平台化到智能化")
    expect(page.locator("h1")).to_contain_text("政企共创平台企业")
    expect(page.locator("h1")).to_contain_text("何以化解行政分割难题")
    expect(page.locator(".cover-team")).to_contain_text("南雍治道")
    expect(page.locator(".cover-actions a")).to_have_count(3)

    page.goto(f"{base_url}/story.html", wait_until="networkidle")
    expect(page.locator(".side-nav a")).to_have_count(7)
    expect(page.locator("h1")).to_contain_text("一座车站")
    story_text = page.locator("body").inner_text()
    assert "国有控股" not in story_text
    assert "铁路日发送量超过 30 万人次" not in story_text
    expect(page.locator(".hero-stats")).to_contain_text("大客流")
    page.locator("#sidebarToggle").click()
    expect(page.locator("body")).to_have_class("with-sidebar story-page sidebar-collapsed")

    page.goto(f"{base_url}/analysis.html", wait_until="networkidle")
    expect(page.locator(".side-nav a")).to_have_count(8)
    expect(page.locator("h1")).to_contain_text("平台何以有效")
    for path, title in (("case.html", "案例全景"), ("mechanism.html", "南站破局"), ("solution.html", "智能体系统"), ("evidence.html", "证据与验证")):
        response = page.goto(f"{base_url}/{path}", wait_until="networkidle")
        assert response is not None and response.ok, title
        expect(page.locator("h1").first).to_be_visible()
    expect(page.locator("#ruleLibrary")).to_contain_text("提出跨主体协同确认")
    expect(page.locator("#ruleLibrary")).not_to_contain_text("request_cross_party_confirmation")
    page.goto(f"{base_url}/demo.html", wait_until="networkidle")
    assert "案例教学与模拟推演" in page.locator("body").inner_text()
    assert "案例项目工作台" in page.locator("#moduleGrid").inner_text()
    assert "证据与边界库" in page.locator("#moduleGrid").inner_text()
    assert page.locator("#scenarioTitle").inner_text() == "列车晚点与停车场外溢"
    assert page.locator("#reviewIssueGrid .review-issue").count() == 4
    assert "停车场权属与管理权限混写" in page.locator("#reviewIssueGrid").inner_text()
    assert "资料不足" in page.locator("#authorityMatrix").inner_text()
    assert page.locator("#evaluation").count() == 0
    assert "边界断言" not in page.locator("body").inner_text()
    assert page.locator("#timelineNodes button").count() == 6
    page.locator("#timelineNodes button").nth(3).click()
    expect(page.locator("#timelineDetail")).to_contain_text("场内外边界")
    page.get_by_role("button", name="三分钟答辩模式").click()
    expect(page.locator("#presentationGuide")).to_be_visible()
    expect(page.locator("#presentationProgress")).to_have_text("答辩 1 / 8")
    page.screenshot(path="hubcoord-presentation-final.png")
    page.locator("#presentationNext").click()
    expect(page.locator("#presentationProgress")).to_have_text("答辩 2 / 8")
    page.get_by_role("button", name="退出").click()
    expect(page.locator("#presentationGuide")).to_be_hidden()

    page.locator("#evidenceSearch").fill("晚点")
    assert page.locator("#evidenceGrid .evidence-card").count() == 1
    page.locator("#evidenceSearch").fill("")

    page.get_by_role("button", name="能否直接处置").click()
    expect(page.locator("#assistantAnswer")).to_contain_text("不可以")
    expect(page.locator("#assistantAnswer")).to_contain_text("AR-SC01-03")

    page.locator("#projectTitleInput").fill(project_title)
    page.locator("#projectQuestionInput").fill("如何让协同推演回到可核验的证据链？")
    page.get_by_role("button", name="新建案例项目").click()
    page.locator("#projectList").get_by_text(project_title, exact=True).wait_for()
    assert project_title in page.locator("#activeProject").inner_text()
    assert project_title in page.locator("#projectInspector").inner_text()

    page.get_by_role("button", name="生成模拟议题卡").click()
    page.locator("#coordinationCard").wait_for(state="visible")
    assert "PENDING HUMAN CONFIRMATION" in page.locator("#coordinationCard").inner_text()
    assert page.locator("#decisionTrace li").count() == 5
    expect(page.locator("#evidenceRefs")).to_have_text("EV-SC01-01 · EV-CT-04 · EV-CA-03")
    card_id = page.locator("#cardId").inner_text()
    page.locator(f"#projectInspector [data-card-id='{card_id}']").wait_for()
    page.locator("#decisionReason").fill("已核对模拟线索与当前服务范围。")
    page.get_by_role("button", name="确认", exact=True).click()
    expect(page.locator("#cardStatus")).to_have_text("CONFIRMED")
    expect(page.locator("#projectInspector")).to_contain_text("已确认")
    with page.expect_download() as download_info:
        page.get_by_role("link", name="下载项目纪要").click()
    assert download_info.value.suggested_filename.endswith("-case-report.md")

    page.locator("input[value='request_cross_party_confirmation']").check()
    page.get_by_role("button", name="生成模拟议题卡").click()
    expect(page.locator("#evidenceRefs")).to_contain_text("EV-CT-03")
    expect(page.locator("#evidenceRefs")).not_to_contain_text("EV-CT-02")
    expect(page.locator("#cardId")).not_to_have_text(card_id)
    cross_card_id = page.locator("#cardId").inner_text()
    page.locator("#decisionReason").fill("已核对线索，提请第二角色确认协同范围。")
    page.get_by_role("button", name="确认", exact=True).click()
    expect(page.locator("#cardStatus")).to_have_text("PENDING HUMAN CONFIRMATION")
    page.reload(wait_until="networkidle")
    page.locator(f"#projectInspector [data-card-id='{cross_card_id}']").click()
    expect(page.locator("#confirmationProgress")).to_contain_text("已确认 · 交控万物现场主管")
    page.locator("input[value='management_office_duty']").check()
    assert page.locator("#decisionReason").is_enabled(), page.locator("#decisionHint").inner_text()
    page.locator("#decisionReason").fill("已核对权责边界，同意记录模拟协同事项。")
    page.get_by_role("button", name="确认", exact=True).click()
    expect(page.locator("#cardStatus")).to_have_text("CONFIRMED")
    expect(page.locator("#confirmationProgress")).to_contain_text("已确认 · 交控万物现场主管")
    expect(page.locator("#confirmationProgress")).to_contain_text("已确认 · 综管办值守人员")
    page.locator("#top").screenshot(path="hubcoord-hero-final.png")
    page.locator("#knowledge").screenshot(path="hubcoord-evidence-final.png")
    page.locator("#lab").screenshot(path="hubcoord-lab-final.png")
    page.screenshot(path="hubcoord-desktop-final.png", full_page=True)

    page.locator("input[value='direct_enforcement']").check()
    page.get_by_role("button", name="生成模拟议题卡").click()
    expect(page.locator("#cardSummary")).to_contain_text("不能生成处置指令")
    assert "不能生成处置指令" in page.locator("#coordinationCard").inner_text()
    expect(page.get_by_role("button", name="确认", exact=True)).to_be_disabled()
    expect(page.locator("#decisionHint")).to_contain_text("只能拒绝或升级")

    page.locator("input[value='share_restricted_data']").check()
    page.get_by_role("button", name="生成模拟议题卡").click()
    page.locator("#manualReview").wait_for(state="visible")
    assert "没有匹配的展示版权责规则" in page.locator("#manualReview").inner_text()

    for width, height in ((1024, 900), (768, 900)):
        page.set_viewport_size({"width": width, "height": height})
        page.reload(wait_until="networkidle")
        assert page.locator(".top-nav").is_visible()
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")

    page.emulate_media(reduced_motion="reduce")
    page.set_viewport_size({"width": 375, "height": 812})
    page.reload(wait_until="networkidle")
    assert page.locator(".top-nav").is_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    assert page.locator("#reviewIssueGrid .review-issue").count() == 4
    assert page.locator("#evaluation").count() == 0
    page.evaluate("document.activeElement.blur()")
    page.keyboard.press("Tab")
    expect(page.locator(".skip-link")).to_be_focused()
    assert not console_errors, console_errors
    page.locator("#top").screenshot(path="hubcoord-mobile-hero-final.png")
    page.screenshot(path="hubcoord-mobile-final.png", full_page=True)
    browser.close()
