from pathlib import Path
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parent
ROOT.mkdir(parents=True, exist_ok=True)


def check_page(page, label: str) -> list[str]:
    errors: list[str] = []
    page.on("console", lambda message: errors.append(f"console:{message.type}:{message.text}") if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(f"pageerror:{error}"))
    page.goto("http://127.0.0.1:4173", wait_until="networkidle")
    page.wait_for_selector("canvas")
    page.wait_for_selector("text=运行情景")
    page.screenshot(path=str(ROOT / f"{label}.png"), full_page=True)
    return errors


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)

    desktop = browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
    desktop_errors = check_page(desktop, "desktop")
    for scenario in ["大客流接驳", "停车场外溢", "设施异常", "常态运行"]:
        desktop.get_by_role("button", name=scenario, exact=False).click()
        desktop.wait_for_timeout(180)
    desktop.get_by_role("button", name="暂停推演").click()
    desktop.locator('input[type="checkbox"]').uncheck(force=True)
    desktop.screenshot(path=str(ROOT / "desktop-cutaway.png"), full_page=True)

    mobile = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    mobile_errors = check_page(mobile, "mobile")

    print({
        "desktop_title": desktop.title(),
        "desktop_canvas": desktop.locator("canvas").count(),
        "scenario_buttons": desktop.locator(".scenario-list button").count(),
        "mobile_scroll_width": mobile.evaluate("document.documentElement.scrollWidth"),
        "mobile_viewport_width": mobile.evaluate("document.documentElement.clientWidth"),
        "mobile_overflowing": mobile.evaluate("""[...document.querySelectorAll('*')]
          .filter((node) => node.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
          .slice(0, 10)
          .map((node) => ({tag: node.tagName, cls: node.className, right: Math.round(node.getBoundingClientRect().right)}))"""),
        "errors": desktop_errors + mobile_errors,
    })

    browser.close()
