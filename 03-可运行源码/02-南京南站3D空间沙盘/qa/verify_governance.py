from pathlib import Path
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parent


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1728, "height": 1000}, device_scale_factor=1)
    errors: list[str] = []
    page.on("console", lambda message: errors.append(f"console:{message.type}:{message.text}") if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(f"pageerror:{error}"))
    page.goto("http://127.0.0.1:4173/app.html", wait_until="networkidle")
    page.wait_for_selector("canvas")
    page.wait_for_selector("text=九类治理链条")
    page.wait_for_selector("text=分散责任界面")

    assert page.locator(".scenario-list > button").count() == 3
    assert page.locator(".decision-chain .chain-node").count() == 6
    assert "两区分治" in page.locator(".era-switch").inner_text()
    page.screenshot(path=str(ROOT / "governance-before.png"), full_page=True)

    viewport_width = page.locator(".viewport").evaluate("node => node.getBoundingClientRect().width")
    page.get_by_role("button", name="折叠左侧案例看板").click()
    page.wait_for_timeout(300)
    after_left = page.locator(".viewport").evaluate("node => node.getBoundingClientRect().width")
    assert after_left > viewport_width + 150, (viewport_width, after_left)

    page.get_by_role("button", name="折叠右侧决策看板").click()
    page.wait_for_timeout(300)
    after_both = page.locator(".viewport").evaluate("node => node.getBoundingClientRect().width")
    assert after_both > after_left + 200, (after_left, after_both)
    page.screenshot(path=str(ROOT / "governance-expanded-canvas.png"), full_page=True)

    page.get_by_role("button", name="展开左侧案例看板").click()
    page.get_by_role("button", name="展开右侧决策看板").click()
    page.locator(".era-switch button").nth(1).click()
    page.wait_for_selector("text=交控万物统一执行界面")
    assert page.locator(".scenario-list > button").count() == 4
    assert "统一执行界面" in page.locator(".environment-banner").inner_text()
    page.screenshot(path=str(ROOT / "governance-after.png"), full_page=True)
    page.get_by_role("button", name="停车场内外权责交接", exact=False).click()
    page.wait_for_timeout(350)
    assert page.locator(".timeline-steps button").count() == 7
    assert page.locator(".timeline-steps").get_by_text("设施优化").count() == 0
    assert "2026-06" in page.locator(".timeline-followup").inner_text()
    page.get_by_role("button", name="现场复核", exact=False).click()
    page.wait_for_selector("text=人员到场校验")
    page.get_by_role("button", name="内外联调", exact=False).click()
    result_text = page.locator(".decision-result").inner_text()
    assert "不越权" in result_text
    page.screenshot(path=str(ROOT / "governance-decision-lab.png"), full_page=True)

    page.get_by_role("button", name="AI 巡查与工单处置", exact=False).click()
    assert page.locator(".timeline-steps button").count() == 7
    page.get_by_role("button", name="到场核验", exact=False).click()
    page.wait_for_selector("text=到场拍照核验")
    assert "intelligent-chain" in (page.locator(".timeline").get_attribute("class") or "")
    page.screenshot(path=str(ROOT / "intelligent-verification.png"), full_page=True)
    page.get_by_role("button", name="执法转交", exact=False).click()
    page.wait_for_selector("text=城管执法接口")
    page.wait_for_selector("text=公安交管接口")
    page.screenshot(path=str(ROOT / "intelligent-handoff.png"), full_page=True)

    page.get_by_role("button", name="铁路—地铁换乘大客流", exact=False).click()
    assert page.locator(".timeline-steps button").count() == 7
    page.get_by_role("button", name="截流与绕行", exact=False).click()
    page.wait_for_selector("text=铁马＋人墙截流")
    assert "crowd-chain" in (page.locator(".timeline").get_attribute("class") or "")
    page.screenshot(path=str(ROOT / "crowd-control.png"), full_page=True)

    mobile = browser.new_page(viewport={"width": 390, "height": 844})
    mobile_errors: list[str] = []
    mobile.on("console", lambda message: mobile_errors.append(f"console:{message.type}:{message.text}") if message.type == "error" else None)
    mobile.on("pageerror", lambda error: mobile_errors.append(f"pageerror:{error}"))
    mobile.goto("http://127.0.0.1:4173/app.html", wait_until="networkidle")
    mobile.wait_for_selector("canvas")
    scroll_width = mobile.evaluate("document.documentElement.scrollWidth")
    client_width = mobile.evaluate("document.documentElement.clientWidth")
    assert scroll_width <= client_width + 1, (scroll_width, client_width)
    mobile.get_by_role("button", name="折叠左侧案例看板").click()
    assert "collapsed" in (mobile.locator(".case-panel").get_attribute("class") or "")

    print({
        "viewport_before": round(viewport_width),
        "viewport_after_left": round(after_left),
        "viewport_after_both": round(after_both),
        "governance_nodes": page.locator(".governance-list article").count(),
        "decision_chain_nodes": page.locator(".decision-chain .chain-node").count(),
        "before_scenarios": 3,
        "after_scenarios": 4,
        "intelligent_stages": page.locator(".timeline-steps button").count(),
        "decision_result": result_text.splitlines()[1],
        "mobile_width": [scroll_width, client_width],
        "errors": errors + mobile_errors,
    })
    assert not errors, errors
    assert not mobile_errors, mobile_errors
    browser.close()
