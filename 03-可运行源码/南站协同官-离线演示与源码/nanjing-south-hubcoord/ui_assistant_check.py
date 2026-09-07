"""小南问答工作台的独立浏览器冒烟测试。

运行示例：
python ui_assistant_check.py
HUBCOORD_TEST_URL=http://127.0.0.1:4179 python ui_assistant_check.py
"""

import json
import os

from playwright.sync_api import expect, sync_playwright


BASE_URL = os.environ.get("HUBCOORD_TEST_URL", "http://127.0.0.1:8152").rstrip("/")
CHAT_PATH = "**/api/v1/assistant/chat"


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    page.set_viewport_size({"width": 1440, "height": 960})
    page_errors = []
    requests = []
    page.on("pageerror", lambda error: page_errors.append(str(error)))
    page.add_init_script(
        """
        class MockSpeechRecognition {
          constructor() { window.__speechRecognitionInstances = (window.__speechRecognitionInstances || 0) + 1; }
          start() {
            window.__speechRecognitionStarts = (window.__speechRecognitionStarts || 0) + 1;
            if (this.onstart) this.onstart();
            window.setTimeout(() => {
              const result = [{ transcript: "南京南站的协同机制" }];
              result.isFinal = true;
              if (this.onresult) this.onresult({ resultIndex: 0, results: [result] });
              if (this.onend) this.onend();
            }, 10);
          }
          stop() { if (this.onend) this.onend(); }
        }
        window.SpeechRecognition = MockSpeechRecognition;
        """
    )

    def mock_chat(route, request):
        requests.append(request.post_data_json)
        greeting = request.post_data_json["messages"][-1]["content"] == "你好"
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps(
                {
                    "answer": "你好，我是小南。你可以问我案例事实、治理机制或相关方立场。" if greeting else "平台化先把分散的运营接口收拢，再为智能化提供统一底座。",
                    "citations": [] if greeting else ["EV-CT-03"],
                    "boundary": "conversation" if greeting else "evidence_only",
                    "model": "小南" if greeting else "qwen-plus",
                    "mode": "stakeholder",
                    "knowledge_version": "2026-09",
                    "sources": [] if greeting else [
                        {
                            "id": "EV-CT-03",
                            "title": "案例文本（提交版）",
                            "locator": "第三部分，第 12 页",
                            "excerpt": "统一运营界面",
                        }
                    ],
                },
                ensure_ascii=False,
            ),
        )

    page.route(CHAT_PATH, mock_chat)
    page.goto(f"{BASE_URL}/assistant.html", wait_until="networkidle")
    expect(page.locator(".site-header")).to_have_count(0)
    expect(page.locator("h1")).to_have_text("小南")
    expect(page.get_by_role("radio")).to_have_count(3)
    expect(page.locator(".welcome-state h3")).to_have_text("从案例里，找答案。")
    expect(page.locator(".knowledge-line, .scope-note")).to_have_count(0)
    expect(page.locator("#chatForm")).to_be_visible()
    composer_box = page.locator("#chatForm").bounding_box()
    assert composer_box and composer_box["y"] + composer_box["height"] <= 960
    assert page.evaluate(
        "document.documentElement.scrollWidth <= document.documentElement.clientWidth"
    )

    # Mode accents must be distinct, and speech recognition must fill the editor.
    mode_colors = page.locator(".mode-button").evaluate_all(
        "buttons => buttons.map((button) => getComputedStyle(button).getPropertyValue('--mode-color'))"
    )
    assert len(set(mode_colors)) == 3
    page.get_by_role("button", name="开始语音输入").click()
    expect(page.locator("#questionInput")).to_have_value("南京南站的协同机制")
    expect(page.locator("#voiceStatus")).to_contain_text("已转为文字")
    assert page.evaluate("window.__speechRecognitionInstances") == 1
    assert page.evaluate("window.__speechRecognitionStarts") == 1

    # 切换为相关方模拟，选择明确角色；推荐问题只填入，不自动发送。
    page.get_by_role("radio", name="03 相关方模拟 理解立场分歧").click()
    expect(page.locator("#stakeholderControls")).to_be_visible()
    page.locator("#stakeholderSelect").select_option("passenger")
    page.locator("#promptRow .prompt-chip").first.click()
    expect(page.locator("#questionInput")).not_to_be_empty()

    # 键盘 Enter 发送；Mock 接口返回回答、来源与边界。
    page.locator("#questionInput").fill("请从旅客视角解释晚点时的协调难点。")
    page.locator("#questionInput").press("Enter")
    expect(page.locator(".assistant-message .message-text").first).to_contain_text(
        "平台化先把分散的运营接口收拢"
    )
    assert requests[-1]["mode"] == "stakeholder"
    assert requests[-1]["stakeholder"] == "passenger"
    assert requests[-1]["messages"][-1] == {
        "role": "user",
        "content": "请从旅客视角解释晚点时的协调难点。",
    }
    expect(page.get_by_text("仅依据现有材料")).to_be_visible()
    page.get_by_role("button", name="查看 1 条来源").click()
    expect(page.locator(".message-sources")).to_contain_text("第三部分，第 12 页")
    expect(page.locator("#latestSources")).to_contain_text("案例文本（提交版）")
    expect(page.locator(".privacy-notice")).to_contain_text("会发送给阿里千问")
    expect(page.locator(".privacy-notice")).to_contain_text("请勿输入未公开访谈")

    # 长对话使用页面级纵向滚动；每轮结束后最新回答和输入框都在当前视口。
    for index in range(2, 7):
        page.locator("#questionInput").fill("你好" if index == 6 else f"第 {index} 轮：请继续解释协同机制。")
        page.locator("#questionInput").press("Enter")
        expect(page.locator(".assistant-message")).to_have_count(index)
    expect(page.get_by_text("对话引导", exact=True)).to_be_visible()
    expect(page.locator("#connectionStatus")).to_contain_text("小南 · 等待提问")
    expect(page.locator("#connectionStatus")).not_to_contain_text("知识库已检索")
    page.wait_for_timeout(100)
    assert page.evaluate(
        "document.documentElement.scrollHeight > document.documentElement.clientHeight"
    )
    assert page.evaluate("window.scrollY > 0")
    desktop_end_metrics = page.evaluate(
        """
        () => {
          const composer = document.querySelector('#composerWrap').getBoundingClientRect();
          const latest = document.querySelector('.assistant-message:last-of-type').getBoundingClientRect();
          return { composer: { top: composer.top, bottom: composer.bottom },
            latest: { top: latest.top, bottom: latest.bottom }, innerHeight,
            scrollY, scrollHeight: document.documentElement.scrollHeight,
            bodyHeight: document.body.scrollHeight };
        }
        """
    )
    assert (
        desktop_end_metrics["composer"]["top"] >= 0
        and desktop_end_metrics["composer"]["bottom"] <= desktop_end_metrics["innerHeight"] + 1
        and desktop_end_metrics["latest"]["bottom"] > 0
        and desktop_end_metrics["latest"]["top"] < desktop_end_metrics["composer"]["top"]
    ), desktop_end_metrics

    # 当前会话刷新后仍保存在浏览器。
    page.reload(wait_until="networkidle")
    expect(page.locator(".assistant-message .message-text").first).to_contain_text(
        "平台化先把分散的运营接口收拢"
    )
    expect(page.locator(".assistant-message")).to_have_count(6)
    page.wait_for_timeout(100)
    assert page.evaluate("window.scrollY > 0")
    assert page.evaluate(
        "document.querySelector('#composerWrap').getBoundingClientRect().bottom <= innerHeight + 1"
    )

    # 375px 下不产生页面级横向滚动，历史记录可从抽屉访问。
    page.set_viewport_size({"width": 375, "height": 812})
    page.reload(wait_until="networkidle")
    assert page.evaluate(
        "document.documentElement.scrollWidth <= document.documentElement.clientWidth"
    )
    expect(page.locator("#chatForm")).to_be_visible()
    mobile_composer_box = page.locator("#chatForm").bounding_box()
    assert (
        mobile_composer_box
        and mobile_composer_box["y"] + mobile_composer_box["height"] <= 812
    )
    page.get_by_role("button", name="打开对话记录").click()
    expect(page.locator("#historyPanel")).to_have_class("history-panel is-open")
    expect(page.locator("#sessionList li")).to_have_count(1)
    page.keyboard.press("Escape")
    expect(page.get_by_role("button", name="打开对话记录")).to_have_attribute(
        "aria-expanded", "false"
    )

    assert page_errors == [], page_errors
    context.close()
    browser.close()

print("ASSISTANT_UI_CHECK_OK")
