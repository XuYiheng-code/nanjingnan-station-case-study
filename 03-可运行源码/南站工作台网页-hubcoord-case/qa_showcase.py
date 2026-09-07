import os
from pathlib import Path
from playwright.sync_api import sync_playwright


BASE_URL = os.environ.get("HUBCOORD_TEST_URL", "http://127.0.0.1:4179").rstrip("/")
OUT = Path(__file__).resolve().parent / "qa"
OUT.mkdir(exist_ok=True)


def audit_page(page, label: str) -> list[str]:
    errors: list[str] = []
    page.on("console", lambda message: errors.append(f"console:{message.type}:{message.text}") if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(f"pageerror:{error}"))
    response = page.goto(BASE_URL, wait_until="networkidle")
    assert response and response.ok, f"{label}: homepage returned {response.status if response else 'no response'}"
    assert page.locator("h1").is_visible(), f"{label}: h1 missing"
    assert page.locator("main section").count() >= 7, f"{label}: narrative sections missing"
    assert page.locator("img").count() >= 5, f"{label}: source imagery missing"
    assert page.locator("#fragmentation").is_visible(), f"{label}: fragmentation section missing"
    assert page.locator("#analysis").is_visible(), f"{label}: analysis section missing"
    return errors


def reveal_full_page(page) -> None:
    for section in page.locator("main section").all():
        section.scroll_into_view_if_needed()
        page.wait_for_timeout(140)
    page.wait_for_timeout(300)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    desktop = browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
    desktop_errors = audit_page(desktop, "desktop")
    reveal_full_page(desktop)
    desktop.screenshot(path=OUT / "showcase-desktop.png", full_page=True)
    for section_id in ("fragmentation", "platform", "intelligence", "boundary", "analysis"):
        desktop.locator(f"#{section_id}").screenshot(path=OUT / f"section-{section_id}.png")

    desktop.locator("#networkToggle").scroll_into_view_if_needed()
    desktop.locator("#networkToggle").click()
    assert desktop.locator(".fragment-stage").get_attribute("data-network") == "after"
    assert desktop.locator("#networkToggle").get_attribute("aria-pressed") == "true"

    desktop.locator("#overviewButton").click()
    assert desktop.locator("#overviewDialog").get_attribute("open") is not None
    desktop.locator("#overviewDialog .dialog-close").click()
    assert desktop.locator("#overviewDialog").get_attribute("open") is None

    desktop.reload(wait_until="networkidle")
    desktop.keyboard.press("Tab")
    assert desktop.locator(":focus").get_attribute("class") == "skip-link"

    mobile = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    mobile_errors = audit_page(mobile, "mobile")
    assert mobile.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "mobile: horizontal overflow"
    reveal_full_page(mobile)
    mobile.screenshot(path=OUT / "showcase-mobile.png", full_page=True)

    browser.close()
    all_errors = desktop_errors + mobile_errors
    if all_errors:
        raise AssertionError("Browser errors:\n" + "\n".join(all_errors))

print("PASS: desktop + mobile layout, interactions, keyboard focus, and console audit")
