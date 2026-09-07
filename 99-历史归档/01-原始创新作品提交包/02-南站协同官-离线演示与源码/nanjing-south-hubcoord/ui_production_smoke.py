import os

from playwright.sync_api import expect, sync_playwright


base_url = os.environ.get("HUBCOORD_TEST_URL", "http://127.0.0.1:8152").rstrip("/")
cad_url = os.environ.get("HUBCOORD_CAD_URL", f"{base_url}/cad/")
auth_user = os.environ.get("HUBCOORD_TEST_USER", "")
auth_password = os.environ.get("HUBCOORD_TEST_PASSWORD", "")
context_options = {
    "viewport": {"width": 1440, "height": 1000},
}
if auth_user and auth_password:
    context_options["http_credentials"] = {"username": auth_user, "password": auth_password}


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(**context_options)
    console_errors = []
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)

    response = page.goto(base_url, wait_until="networkidle")
    assert response is not None and response.ok
    assert response.headers["x-content-type-options"] == "nosniff"
    assert "default-src 'self'" in response.headers["content-security-policy"]
    expect(page.locator("h1")).to_contain_text("从平台化到智能化")
    expect(page.locator("h1")).to_contain_text("政企共创平台企业")
    expect(page.locator("h1")).to_contain_text("何以化解行政分割难题")
    expect(page.locator(".cover-team")).to_contain_text("南雍治道")
    expect(page.locator(".cover-actions a")).to_have_count(3)
    cad_entry = page.get_by_role("link", name="进入空间沙盘")
    expect(cad_entry).to_be_visible()
    expect(cad_entry).to_have_attribute("href", "https://cad.hubcoord.cn/")
    page.screenshot(path="hubcoord-home-production.png", full_page=False)
    cad_response = page.goto(cad_url, wait_until="networkidle")
    assert cad_response is not None and cad_response.ok
    expect(page).to_have_title("南京南站治理运行沙盘")
    expect(page.locator("canvas")).to_be_visible()
    expect(page.locator("body")).to_contain_text("空间与治理结构复原")
    page.screenshot(path="hubcoord-cad-production.png", full_page=False)
    page.goto(f"{base_url}/story.html", wait_until="networkidle")
    expect(page.locator(".side-nav a")).to_have_count(7)
    expect(page.locator("#fragmentation")).to_be_attached()
    page.goto(f"{base_url}/analysis.html", wait_until="networkidle")
    expect(page.locator(".side-nav a")).to_have_count(8)
    expect(page.locator("#framework")).to_be_attached()
    page.goto(f"{base_url}/demo.html", wait_until="networkidle")
    expect(page.locator("#moduleGrid")).to_contain_text("案例项目工作台")
    expect(page.locator("#moduleGrid")).to_contain_text("案例叙事与复盘")
    expect(page.locator("#scenarioTitle")).to_have_text("列车晚点与停车场外溢")
    expect(page.locator("#projectInspector")).to_contain_text("PROJECT DOSSIER")
    assert page.locator("#evaluation").count() == 0
    demo_text = page.locator("body").inner_text()
    for engineering_label in ("当前实测", "重新运行测试", "边界断言", "20/20", "GC-01"):
        assert engineering_label not in demo_text
    selected_project = page.locator("#activeProject").input_value()
    assert selected_project

    with page.expect_download() as download_info:
        page.get_by_role("link", name="下载项目纪要").click()
    assert download_info.value.suggested_filename == f"{selected_project}-case-report.md"
    assert not console_errors, console_errors
    page.screenshot(path="hubcoord-production.png", full_page=True)
    browser.close()
