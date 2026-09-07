from playwright.sync_api import sync_playwright


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto("http://127.0.0.1:4173/app.html", wait_until="networkidle")
    page.wait_for_selector("canvas")
    print(page.evaluate("""({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
      nodes: [...document.querySelectorAll('*')]
        .filter((node) => node.getBoundingClientRect().right > document.documentElement.clientWidth + 1 || node.getBoundingClientRect().left < -1 || node.scrollWidth > node.clientWidth + 1)
        .slice(0, 20)
        .map((node) => ({tag: node.tagName, cls: String(node.className), left: Math.round(node.getBoundingClientRect().left), right: Math.round(node.getBoundingClientRect().right), width: Math.round(node.getBoundingClientRect().width), scrollWidth: node.scrollWidth, clientWidth: node.clientWidth}))
    })"""))
    browser.close()
