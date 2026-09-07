import os
from pathlib import Path

from playwright.sync_api import sync_playwright


BASE_URL = os.environ.get("HUBCOORD_TEST_URL", "http://127.0.0.1:8152").rstrip("/")
OUTPUT = Path(os.environ.get("HUBCOORD_QA_DIR", "qa-layout"))
OUTPUT.mkdir(parents=True, exist_ok=True)

VIEWPORTS = (
    (360, 640),
    (320, 800),
    (375, 812),
    (768, 1024),
    (1024, 600),
    (1024, 768),
    (1366, 650),
    (1440, 1000),
    (1920, 1080),
)
PAGES = (
    "/",
    "/story.html",
    "/analysis.html",
    "/film.html",
    "/agent-home.html",
    "/case.html",
    "/mechanism.html",
    "/solution.html",
    "/demo.html",
    "/evidence.html",
)


def assert_layout(page, path: str, width: int) -> None:
    metrics = page.evaluate(
        r"""
        () => {
          const root = document.documentElement;
          const lockedLines = [...document.querySelectorAll('.cover-title-line, .hero-title-line, .heading-line, .cockpit-brief .hero-line, .film-copy h1 span')]
            .map((el) => ({
              text: el.textContent.trim(),
              clientWidth: el.clientWidth,
              scrollWidth: el.scrollWidth,
              whiteSpace: getComputedStyle(el).whiteSpace
            }));
          const shortTails = [];
          for (const el of document.querySelectorAll('h1, h2, h3')) {
            if (el.querySelector('.cover-title-line, .hero-title-line, .heading-line, .cockpit-brief .hero-line, .film-copy h1 span') || el.querySelector('br')) continue;
            const text = el.textContent.trim().replace(/\s+/g, '');
            if (text.length < 4) continue;
            const rows = [];
            [...text].forEach((_, index) => {
              const range = document.createRange();
              const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
              let remaining = index;
              let node;
              while ((node = walker.nextNode())) {
                if (remaining < node.textContent.length) {
                  range.setStart(node, remaining);
                  range.setEnd(node, remaining + 1);
                  const rect = range.getBoundingClientRect();
                  if (rect.width) rows.push({ char: node.textContent[remaining], top: Math.round(rect.top) });
                  break;
                }
                remaining -= node.textContent.length;
              }
            });
            const grouped = new Map();
            rows.forEach(({ char, top }) => grouped.set(top, (grouped.get(top) || '') + char));
            const lines = [...grouped.values()].map((line) => line.trim()).filter(Boolean);
            const tail = lines.at(-1) || '';
            if (lines.length > 1 && [...tail].length <= 2) shortTails.push({ text, lines });
          }
          return {
            overflow: root.scrollWidth - root.clientWidth,
            lockedLines,
            shortTails,
            canvas: document.querySelector('#heroCanvas') ? {
              width: document.querySelector('#heroCanvas').width,
              height: document.querySelector('#heroCanvas').height
            } : null
          };
        }
        """
    )
    assert metrics["overflow"] <= 1, (path, width, "horizontal overflow", metrics["overflow"])
    bad_locked = [line for line in metrics["lockedLines"] if line["scrollWidth"] > line["clientWidth"] + 1 or line["whiteSpace"] != "nowrap"]
    assert not bad_locked, (path, width, "locked heading wrapped or overflowed", bad_locked)
    assert not metrics["shortTails"], (path, width, "heading orphan line", metrics["shortTails"])
    if path == "/":
        assert metrics["canvas"] and metrics["canvas"]["width"] > 0 and metrics["canvas"]["height"] > 0


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    failures = []
    for width, height in VIEWPORTS:
        context = browser.new_context(viewport={"width": width, "height": height}, reduced_motion="no-preference")
        page = context.new_page()
        console_errors = []
        page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
        for path in PAGES:
            response = page.goto(f"{BASE_URL}{path}", wait_until="networkidle")
            assert response is not None and response.ok, (path, width, response.status if response else None)
            page.evaluate("window.scrollTo({top: document.documentElement.scrollHeight, behavior: 'instant'})")
            page.wait_for_timeout(250)
            page.evaluate("window.scrollTo({top: 0, behavior: 'instant'})")
            page.wait_for_timeout(250)
            try:
                assert_layout(page, path, width)
            except AssertionError as error:
                failures.append(str(error))

            logo = page.locator("img[src$='nanyong-mark.svg']")
            assert logo.count() >= 1, (path, width, "brand mark count", logo.count())
            assert logo.evaluate_all("els => els.every(el => el.complete && el.naturalWidth > 0)"), (path, width, "brand mark failed to load")

            if path in {"/story.html", "/analysis.html"}:
                if width > 900:
                    before = page.locator(".page-shell").evaluate("el => getComputedStyle(el).marginLeft")
                    page.locator("#sidebarToggle").click()
                    page.wait_for_timeout(420)
                    after = page.locator(".page-shell").evaluate("el => getComputedStyle(el).marginLeft")
                    assert float(after.removesuffix("px")) < float(before.removesuffix("px")), (path, width, before, after)
                    page.locator("#sidebarToggle").click()
                    page.wait_for_timeout(420)
                else:
                    page.locator("#mobileMenu").click()
                    assert "sidebar-open" in page.locator("body").get_attribute("class")
                    page.keyboard.press("Escape")
                    assert "sidebar-open" not in page.locator("body").get_attribute("class")

            if width in {375, 1440}:
                name = "cover" if path == "/" else path.strip("/").replace(".html", "")
                page.screenshot(path=OUTPUT / f"{name}-{width}.png", full_page=False)
        assert not console_errors, (width, console_errors)
        context.close()
    browser.close()

if failures:
    raise AssertionError("\n".join(failures))
print(f"PASS: {len(PAGES) * len(VIEWPORTS)} page/viewport combinations; no overflow, locked-line wrapping, or heading orphan lines")
