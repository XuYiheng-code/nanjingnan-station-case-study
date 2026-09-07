from pathlib import Path
from playwright.sync_api import sync_playwright


PROJECT = Path(__file__).resolve().parents[1]
TARGET = (PROJECT / "index.html").as_uri()
DESKTOP_SCREENSHOT = PROJECT / "qa" / "standalone-desktop.png"
CAD_SCREENSHOT = PROJECT / "qa" / "standalone-cad.png"
MOBILE_SCREENSHOT = PROJECT / "qa" / "standalone-mobile.png"


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    errors: list[str] = []
    page.on("console", lambda message: errors.append(f"console:{message.type}:{message.text}") if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(f"pageerror:{error}"))

    page.goto(TARGET, wait_until="load")
    page.wait_for_selector("canvas", timeout=30000)
    page.locator(".era-switch button").nth(1).click()
    page.get_by_role("button", name="停车场内外权责交接", exact=False).click()
    page.get_by_role("button", name="道路联动", exact=False).click()
    page.wait_for_timeout(500)
    decision_owner = page.locator(".owner-card h3").inner_text()
    assert "公安交管" in decision_owner, decision_owner
    page.screenshot(path=str(DESKTOP_SCREENSHOT), full_page=True)
    cad_button = page.locator(".layer-switch button").filter(has_text="CAD")
    cad_button.click()
    page.wait_for_timeout(500)
    assert cad_button.get_attribute("aria-pressed") == "true"
    page.screenshot(path=str(CAD_SCREENSHOT), full_page=True)

    print({
        "url": page.url,
        "title": page.title(),
        "canvas": page.locator("canvas").count(),
        "scenario_buttons": page.locator(".scenario-list button").count(),
        "active_scenario": page.locator(".scenario-list button.active strong").inner_text(),
        "decision_owner": decision_owner,
        "layer_buttons": page.locator(".layer-switch button").count(),
        "errors": errors,
    })

    mobile = browser.new_page(viewport={"width": 390, "height": 844})
    mobile_errors: list[str] = []
    mobile.on("console", lambda message: mobile_errors.append(f"console:{message.type}:{message.text}") if message.type == "error" else None)
    mobile.on("pageerror", lambda error: mobile_errors.append(f"pageerror:{error}"))
    mobile.goto(TARGET, wait_until="load")
    mobile.wait_for_selector("canvas", timeout=30000)
    mobile.locator(".era-switch button").nth(1).click()
    mobile.get_by_role("button", name="铁路—地铁换乘大客流", exact=False).click()
    mobile.get_by_role("button", name="截流与绕行", exact=False).click()
    mobile.wait_for_timeout(500)
    mobile.screenshot(path=str(MOBILE_SCREENSHOT), full_page=True)
    print({
        "mobile_active_scenario": mobile.locator(".scenario-list button.active strong").inner_text(),
        "mobile_canvas": mobile.locator("canvas").count(),
        "mobile_errors": mobile_errors,
    })
    assert not errors, errors
    assert not mobile_errors, mobile_errors
    browser.close()
