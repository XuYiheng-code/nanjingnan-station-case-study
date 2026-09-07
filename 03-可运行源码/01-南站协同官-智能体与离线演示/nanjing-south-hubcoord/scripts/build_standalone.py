#!/usr/bin/env python3
"""生成可直接双击的评委总览和工作台 Demo。"""
from __future__ import annotations

import base64
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"
OVERVIEW_TARGET = ROOT / "南站协同官-直接打开.html"
DEMO_TARGET = ROOT / "南站协同官-工作台Demo.html"


def inline_asset(html: str, tag: str, content: str, wrapper: str) -> str:
    if tag not in html:
        raise RuntimeError(f"找不到需要内联的资源标签：{tag}")
    return html.replace(tag, f"<{wrapper}>\n{content}\n</{wrapper}>")


def inline_brand_assets(html: str) -> str:
    """让根目录单文件不依赖 static/assets 下的品牌 SVG。"""
    for filename in ("favicon.svg", "nanyong-mark.svg"):
        payload = base64.b64encode((STATIC / "assets" / filename).read_bytes()).decode("ascii")
        html = html.replace(f"assets/{filename}", f"data:image/svg+xml;base64,{payload}")
    return html


def build_overview() -> None:
    # The public root is now the case showcase.  Keep the legacy standalone
    # deliverable tied to the preserved agent overview instead of assuming
    # that static/index.html still loads site.css and site.js.
    html = (STATIC / "agent-home.html").read_text(encoding="utf-8")
    css = (STATIC / "site.css").read_text(encoding="utf-8")
    javascript = (STATIC / "site.js").read_text(encoding="utf-8")
    html = inline_asset(html, '<link rel="stylesheet" href="site.css">', css, "style")
    html = inline_asset(html, '<script src="site.js"></script>', javascript, "script")
    html = inline_brand_assets(html)
    for page in ("case.html", "mechanism.html", "solution.html", "evidence.html"):
        html = html.replace(f'href="{page}"', f'href="static/{page}"')
        html = html.replace(f'href="{page}#', f'href="static/{page}#')
    html = html.replace('href="demo.html"', f'href="{DEMO_TARGET.name}"')
    html = html.replace('href="index.html"', f'href="{OVERVIEW_TARGET.name}"')
    OVERVIEW_TARGET.write_text(html, encoding="utf-8")


def build_demo() -> None:
    html = (STATIC / "demo.html").read_text(encoding="utf-8")
    css = (STATIC / "styles.css").read_text(encoding="utf-8")
    offline = (STATIC / "offline-data.js").read_text(encoding="utf-8")
    javascript = (STATIC / "app.js").read_text(encoding="utf-8")
    html = inline_asset(html, '<link rel="stylesheet" href="styles.css">', css, "style")
    html = inline_asset(html, '<script src="offline-data.js"></script>', offline, "script")
    html = inline_asset(html, '<script src="app.js"></script>', javascript, "script")
    html = inline_brand_assets(html)
    for film in (
        "hubcoord-agent-60s-poster.webp",
        "hubcoord-agent-60s.mp4",
        "hubcoord-agent-60s-nobgm.mp4",
        "hubcoord-agent-60s.zh-CN.vtt",
    ):
        html = html.replace(f'assets/films/{film}', f'static/assets/films/{film}')
    html = html.replace('href="index.html"', f'href="{OVERVIEW_TARGET.name}"')
    for page in ("case.html", "mechanism.html", "solution.html", "evidence.html"):
        html = html.replace(f'href="{page}"', f'href="static/{page}"')
    html = html.replace('href="demo.html"', f'href="{DEMO_TARGET.name}"')
    DEMO_TARGET.write_text(html, encoding="utf-8")


def main() -> None:
    build_overview()
    build_demo()
    print(f"已生成 {OVERVIEW_TARGET}")
    print(f"已生成 {DEMO_TARGET}")


if __name__ == "__main__":
    main()
