import re
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parent
OVERVIEW_ENTRY = ROOT / "南站协同官-直接打开.html"
DEMO_ENTRY = ROOT / "南站协同官-工作台Demo.html"
STATIC = ROOT / "static"
PAGES = (
    "index.html",
    "story.html",
    "analysis.html",
    "case.html",
    "mechanism.html",
    "solution.html",
    "demo.html",
    "evidence.html",
)


def collect_errors(page):
    errors = []
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on(
        "requestfailed",
        lambda request: None
        if request.failure == "net::ERR_ABORTED" and request.url.lower().endswith(".mp4")
        else errors.append(f"REQUEST FAILED: {request.url} ({request.failure})"),
    )
    return errors


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)

    # 八个页面在 Finder/file:// 下均能直接打开，且不对外发起网络请求。
    for filename in PAGES:
        page = browser.new_page(viewport={"width": 1366, "height": 768})
        errors = collect_errors(page)
        external = []
        page.on("request", lambda request: external.append(request.url) if request.url.startswith(("http://", "https://")) else None)
        page.goto((STATIC / filename).as_uri(), wait_until="networkidle")
        assert page.evaluate("getComputedStyle(document.body).fontFamily") != "Times"
        assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        expect(page.locator("h1").first).to_be_visible()
        if filename == "index.html":
            expect(page.locator(".cover-actions a")).to_have_count(3)
        elif filename == "story.html":
            expect(page.locator(".side-nav a")).to_have_count(8)
        elif filename == "analysis.html":
            expect(page.locator(".side-nav a")).to_have_count(8)
        elif filename == "demo.html":
            expect(page.locator("#agentExplainerVideo")).to_be_visible()
            assert page.locator("#agentExplainerVideo").evaluate(
                "video => video.error === null && video.readyState >= 1 && video.duration > 59"
            )
        elif filename != "demo.html":
            expect(page.locator(".site-nav a")).to_have_count(7)
        assert external == [], (filename, external)
        assert errors == [], (filename, errors)
        page.close()

    # 第二轮故事与分析模块：交互、移动目录、减弱动效和无脚本回退。
    story = browser.new_page(viewport={"width": 1440, "height": 960})
    story_errors = collect_errors(story)
    story.goto((STATIC / "story.html").as_uri(), wait_until="networkidle")
    story.locator(".chronicle-list button").nth(2).click()
    expect(story.locator("#chronicleYear")).to_have_text("2011—2012")
    expect(story.locator("#chroniclePhase")).to_have_text("制度设计期")
    expect(story.locator("[data-task-button]")).to_have_count(5)
    story.locator("[data-task-button]").nth(4).click()
    expect(story.locator("#taskConsoleTitle")).to_have_text("处置结果返回平台")
    expect(story.locator("#taskConsoleProof")).to_have_text("全过程记录")
    expect(story.locator(".boundary-handoff")).to_be_attached()
    story.locator("#taskConsole").screenshot(path="/tmp/hubcoord-round3-task-console.png", animations="disabled")
    story.locator(".boundary-handoff").scroll_into_view_if_needed()
    expect(story.locator(".boundary-handoff")).to_have_class(re.compile(r"\bis-visible\b"))
    story.locator(".boundary-handoff").screenshot(path="/tmp/hubcoord-round3-boundary-handoff.png", animations="disabled")
    story.locator(".co-creation-map").scroll_into_view_if_needed()
    expect(story.locator(".co-creation-map")).to_have_class(re.compile(r"\bis-visible\b"))
    story.locator(".co-creation-map").screenshot(path="/tmp/hubcoord-round2-story.png", animations="disabled")
    assert story_errors == [], story_errors
    story.close()

    analysis = browser.new_page(viewport={"width": 1440, "height": 960})
    analysis_errors = collect_errors(analysis)
    analysis.goto((STATIC / "analysis.html").as_uri(), wait_until="networkidle")
    analysis.locator("#mechanism-tab-boundary").click()
    expect(analysis.locator("#mechanism-tab-boundary")).to_have_attribute("aria-selected", "true")
    expect(analysis.locator("#mechanism-panel-boundary")).to_be_visible()
    analysis.locator("#mechanism-tab-boundary").press("Home")
    expect(analysis.locator("#mechanism-tab-cost")).to_have_attribute("aria-selected", "true")
    expect(analysis.locator(".proposition-entry")).to_have_count(5)
    expect(analysis.locator(".proposition-entry").nth(4)).to_contain_text("可行的替代方案")
    analysis.locator(".framework-sequence [data-framework-target='4']").click()
    expect(analysis.locator("#frameworkBuild")).to_have_attribute("data-framework-step", "4")
    expect(analysis.locator(".fp3")).to_have_class(re.compile(r"\bis-built\b"))
    expect(analysis.locator(".fp4")).not_to_have_class(re.compile(r"\bis-built\b"))
    analysis.locator(".framework-sequence [data-framework-target='6']").click()
    expect(analysis.locator(".framework-institution")).to_have_class(re.compile(r"\bis-built\b"))
    analysis.locator("#frameworkBuild").screenshot(path="/tmp/hubcoord-round3-framework.png", animations="disabled")
    analysis.locator(".mechanism-explorer").scroll_into_view_if_needed()
    expect(analysis.locator(".mechanism-explorer")).to_have_class(re.compile(r"\bis-visible\b"))
    analysis.locator(".mechanism-explorer").screenshot(path="/tmp/hubcoord-round2-analysis.png", animations="disabled")
    assert analysis_errors == [], analysis_errors
    analysis.close()

    story_mobile = browser.new_page(viewport={"width": 375, "height": 812})
    story_mobile_errors = collect_errors(story_mobile)
    story_mobile.goto((STATIC / "story.html").as_uri(), wait_until="networkidle")
    expect(story_mobile.locator("#caseSidebar")).to_have_attribute("aria-hidden", "true")
    story_mobile.locator("#mobileMenu").click()
    expect(story_mobile.locator("#caseSidebar")).to_have_attribute("aria-hidden", "false")
    assert story_mobile.locator("body").evaluate("el => el.classList.contains('sidebar-open')")
    story_mobile.keyboard.press("Escape")
    expect(story_mobile.locator("#mobileMenu")).to_be_focused()
    expect(story_mobile.locator("#caseSidebar")).to_have_attribute("aria-hidden", "true")
    story_mobile.screenshot(path="/tmp/hubcoord-round2-story-mobile.png", full_page=False)
    assert story_mobile_errors == [], story_mobile_errors
    story_mobile.goto((STATIC / "analysis.html").as_uri(), wait_until="networkidle")
    story_mobile.locator(".framework-sequence [data-framework-target='6']").click()
    story_mobile.locator("#frameworkBuild").screenshot(path="/tmp/hubcoord-round3-framework-mobile.png", animations="disabled")
    story_mobile.close()

    reduced_context = browser.new_context(
        viewport={"width": 1366, "height": 768},
        reduced_motion="reduce",
    )
    reduced = reduced_context.new_page()
    reduced.goto((STATIC / "analysis.html").as_uri(), wait_until="networkidle")
    assert reduced.locator(".reveal").evaluate_all(
        "els => els.every(el => getComputedStyle(el).opacity !== '0')"
    )
    reduced_context.close()

    no_script_context = browser.new_context(
        viewport={"width": 1366, "height": 768},
        java_script_enabled=False,
    )
    no_script = no_script_context.new_page()
    no_script.goto((STATIC / "story.html").as_uri(), wait_until="load")
    expect(no_script.locator("#origins h2")).to_be_visible()
    assert no_script.locator(".reveal").evaluate_all(
        "els => els.every(el => getComputedStyle(el).opacity !== '0')"
    )
    no_script.goto((STATIC / "analysis.html").as_uri(), wait_until="load")
    expect(no_script.locator("#frameworkBuild")).to_be_visible()
    expect(no_script.locator(".proposition-entry")).to_have_count(5)
    assert no_script.locator(".framework-map > :not(.framework-wires)").evaluate_all(
        "els => els.every(el => getComputedStyle(el).opacity === '1')"
    )
    no_script_context.close()

    overview = browser.new_page(viewport={"width": 1440, "height": 900})
    overview_errors = collect_errors(overview)
    overview.goto(OVERVIEW_ENTRY.as_uri(), wait_until="networkidle")
    expect(overview.locator("h1")).to_have_text("南站协同官")
    expect(overview.locator(".hero-definition")).to_contain_text("协同智能体")
    expect(overview.get_by_role("link", name="直接操作 Demo")).to_be_visible()
    expect(overview.locator(".route-grid > a")).to_have_count(6)
    overview.screenshot(path="hubcoord-judge-home.png", full_page=False)
    assert overview_errors == [], overview_errors
    overview.close()

    page = browser.new_page(viewport={"width": 1440, "height": 960})
    console_errors = collect_errors(page)
    page.goto(DEMO_ENTRY.as_uri(), wait_until="networkidle")
    expect(page.locator("#heroTitle")).to_have_text("南站协同官")
    expect(page.locator(".story-thesis")).to_contain_text("看懂、核对和确认")
    expect(page.locator("#agentExplainerTitle")).to_contain_text("四步把问题说清楚")
    expect(page.locator("#applicationScenarioTitle")).to_contain_text("谁来接手")
    expect(page.locator("#agentFilmTitle")).to_have_text("60 秒看懂南站协同官")
    expect(page.locator("#agentExplainerVideo source")).to_have_attribute("src", "static/assets/films/hubcoord-agent-60s.mp4")
    expect(page.locator("#agentExplainerVideo track")).to_have_attribute("src", "static/assets/films/hubcoord-agent-60s.zh-CN.vtt")
    expect(page.locator("#agentFaq details")).to_have_count(8)
    expect(page.locator(".demo-readout")).to_contain_text("一张协同议题卡")
    expect(page.locator(".topbar-note")).to_contain_text("OFFLINE READY")
    expect(page.locator("#knowledgeStatus")).to_have_text("12 张本次展示可用证据卡")
    assert page.locator("#evaluation").count() == 0
    assert "边界断言" not in page.locator("body").inner_text()
    expect(page.locator("#moduleGrid .module-card")).to_have_count(4)
    expect(page.locator("#timelineNodes button")).to_have_count(6)
    expect(page.locator("#agentPipeline li")).to_have_count(5)

    # 彩排前可一键切换到无历史卡片的空白档案，不删除原有记录。
    page.get_by_role("button", name="彩排前准备一份空白演示档案").click()
    expect(page.locator("#activity")).to_contain_text("空白演示档案已准备好")
    expect(page.locator("#projectInspector")).to_contain_text("协同议题卡 / 0")

    # 正常协同：两个角色分别确认后才能完成。
    page.locator("input[value='operator_supervisor']").check()
    page.locator("input[value='request_cross_party_confirmation']").check()
    page.get_by_role("button", name="生成模拟议题卡").click()
    expect(page.locator("#coordinationCard")).to_be_visible()
    expect(page.locator("#agentPipeline li.is-done")).to_have_count(5)
    expect(page.locator("#decisionTrace li")).to_have_count(5)
    page.locator("#decisionReason").fill("已核对模拟线索，申请确认跨主体协同范围。")
    page.get_by_role("button", name="确认", exact=True).click()
    expect(page.locator("#cardStatus")).to_have_text("PENDING HUMAN CONFIRMATION")
    page.locator("input[value='management_office_duty']").check()
    page.locator("#decisionReason").fill("已核对权责边界，同意记录模拟协同事项。")
    page.get_by_role("button", name="确认", exact=True).click()
    expect(page.locator("#cardStatus")).to_have_text("CONFIRMED")

    # 越权对照：直接行政处置不得被确认。
    page.get_by_role("button", name="运行越权对照").click()
    expect(page.locator("#boundaryNotice")).to_contain_text("行政执法")
    expect(page.get_by_role("button", name="确认", exact=True)).to_be_disabled()

    page.locator("#technicalDossier").evaluate("dossier => dossier.open = true")
    with page.expect_download() as download_info:
        page.get_by_role("link", name="下载项目纪要").click()
    assert download_info.value.suggested_filename.endswith("-case-report.md")
    page.screenshot(path="hubcoord-judge-demo.png", full_page=False)
    assert console_errors == [], console_errors
    page.close()

    mobile = browser.new_page(viewport={"width": 375, "height": 812})
    mobile_errors = collect_errors(mobile)
    mobile.goto(OVERVIEW_ENTRY.as_uri(), wait_until="networkidle")
    assert mobile.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
    expect(mobile.locator("h1")).to_be_visible()
    expect(mobile.locator(".site-nav")).to_be_visible()
    expect(mobile.locator(".site-nav a")).to_have_count(7)
    mobile.screenshot(path="hubcoord-judge-home-mobile.png", full_page=False)
    assert mobile_errors == [], mobile_errors

    mobile.goto(DEMO_ENTRY.as_uri(), wait_until="networkidle")
    expect(mobile.locator(".top-nav a")).to_have_count(7)
    assert mobile.evaluate("document.querySelector('.top-nav').scrollWidth <= document.querySelector('.top-nav').clientWidth")
    expect(mobile.get_by_role("link", name="证据与验证")).to_be_visible()
    assert mobile.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")

    browser.close()
