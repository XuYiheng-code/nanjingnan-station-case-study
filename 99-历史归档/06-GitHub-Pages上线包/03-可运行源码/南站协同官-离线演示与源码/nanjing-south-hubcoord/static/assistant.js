(() => {
  "use strict";

  const API_URL = "/api/v1/assistant/chat";
  const STORAGE_KEY = "xiaonan-conversations-v1";
  const REQUEST_TIMEOUT = 45000;
  const modeConfig = {
    facts: {
      title: "案例事实",
      description: "优先回答材料中明确记录的人、事、时间、数据和来源。没有依据时会说明材料不足。",
      tips: ["问一个可核对的具体事实", "要求列出证据来源", "追问材料之间是否存在冲突"],
      prompts: ["南京南站为什么会出现“九龙治水”？", "案例中有哪些主体参与南站治理？", "交控万物承担了哪些具体工作？"]
    },
    analysis: {
      title: "分析梳理",
      description: "把案例事实整理成机制、因果链和理论解释，并区分材料结论与分析判断。",
      tips: ["指定需要解释的因果关系", "要求比较平台化前后", "让小南指出论证边界"],
      prompts: ["平台化如何降低跨主体协调成本？", "为什么说组织整合先于技术应用？", "用交易成本理论梳理本案例的机制链条。"]
    },
    stakeholder: {
      title: "利益相关方视角模拟",
      description: "基于案例中的职责与处境模拟一种立场。模拟内容会与已核验事实分开表达。",
      tips: ["说明希望代入的角色", "给出需要回应的具体争议", "比较两个角色的关注点"],
      prompts: ["请从南站综管办的视角解释协调难点。", "模拟停车运营方如何看待红线内外的责任。", "比较属地政府与平台企业对数据共享的不同顾虑。"]
    }
  };

  const elements = {
    form: document.querySelector("#chatForm"), input: document.querySelector("#questionInput"), send: document.querySelector("#sendButton"),
    voice: document.querySelector("#voiceInputButton"), voiceStatus: document.querySelector("#voiceStatus"),
    list: document.querySelector("#messageList"), scroll: document.querySelector("#messageScroll"), welcome: document.querySelector("#welcomeState"), composerWrap: document.querySelector("#composerWrap"),
    prompts: document.querySelector("#promptRow"), modes: [...document.querySelectorAll(".mode-button")], explanation: document.querySelector("#modeExplanation"),
    sessions: document.querySelector("#sessionList"), sessionCount: document.querySelector("#sessionCount"), historyEmpty: document.querySelector("#historyEmpty"),
    newChat: document.querySelector("#newChat"), clear: document.querySelector("#clearChat"), count: document.querySelector("#characterCount"),
    error: document.querySelector("#errorBanner"), errorMessage: document.querySelector("#errorMessage"), retry: document.querySelector("#retryButton"),
    connection: document.querySelector("#connectionStatus"), sourceShelf: document.querySelector("#sourceShelf"), sourceCount: document.querySelector("#sourceCount"),
    historyPanel: document.querySelector(".history-panel"), mobileHistory: document.querySelector("#mobileHistory"), historyClose: document.querySelector("#historyClose"), historyScrim: document.querySelector("#historyScrim"),
    stakeholderControls: document.querySelector("#stakeholderControls"), stakeholderSelect: document.querySelector("#stakeholderSelect"),
    loadingTemplate: document.querySelector("#loadingTemplate")
  };

  let sessions = loadSessions();
  let activeSessionId = sessions[0]?.id || "";
  let pending = false;
  let lastFailedQuestion = "";
  let voiceRecognition = null;
  let voiceListening = false;
  let voiceBaseValue = "";

  function uid() {
    return `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function loadSessions() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item) => item && Array.isArray(item.messages) && modeConfig[item.mode]).slice(0, 20);
    } catch (_error) {
      return [];
    }
  }

  function saveSessions() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 20))); } catch (_error) { /* 浏览器可能禁用本地存储 */ }
  }

  function activeSession() {
    return sessions.find((item) => item.id === activeSessionId) || null;
  }

  function currentMode() {
    return activeSession()?.mode || document.querySelector(".mode-button.is-active")?.dataset.mode || "facts";
  }

  function formatTime(value) {
    try { return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); } catch (_error) { return ""; }
  }

  function normalizeSource(source, index) {
    if (typeof source === "string") return { title: source, locator: "案例知识库", excerpt: "" };
    return {
      title: source?.title || source?.source_title || source?.name || source?.source_id || `来源 ${index + 1}`,
      locator: source?.locator || source?.location || source?.page || source?.evidence_id || source?.id || "案例知识库",
      excerpt: source?.excerpt || source?.quote || source?.snippet || ""
    };
  }

  function normalizeResponse(payload) {
    const answer = payload?.answer || payload?.message?.content || payload?.choices?.[0]?.message?.content;
    if (!answer || typeof answer !== "string") throw new Error("服务返回的回答格式无法识别。");
    const rawSources = Array.isArray(payload.sources) && payload.sources.length
      ? payload.sources
      : Array.isArray(payload.citations) ? payload.citations
        : Array.isArray(payload.evidence) ? payload.evidence : [];
    return { answer: answer.trim(), sources: rawSources.map(normalizeSource), model: payload.model || "Qwen", knowledgeVersion: payload.knowledge_version || "", boundary: payload.boundary || "", provider: payload.provider || "" };
  }

  function setConnection(state, text) {
    elements.connection.classList.toggle("is-ready", state === "ready");
    elements.connection.classList.toggle("is-error", state === "error");
    elements.connection.querySelector("span").textContent = text;
  }

  function updateModeUI(mode) {
    const config = modeConfig[mode] || modeConfig.facts;
    elements.modes.forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-checked", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    elements.explanation.replaceChildren();
    const strong = document.createElement("strong");
    strong.textContent = config.title;
    const paragraph = document.createElement("p");
    paragraph.textContent = config.description;
    const list = document.createElement("ul");
    config.tips.forEach((tip) => { const item = document.createElement("li"); item.textContent = tip; list.append(item); });
    elements.explanation.append(strong, paragraph, list);
    elements.prompts.replaceChildren();
    config.prompts.forEach((prompt) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "prompt-chip";
      button.textContent = prompt;
      button.title = prompt;
      button.addEventListener("click", () => { elements.input.value = prompt; updateInput(); elements.input.focus(); });
      elements.prompts.append(button);
    });
    const stakeholderMode = mode === "stakeholder";
    elements.stakeholderControls.hidden = !stakeholderMode;
    elements.stakeholderSelect.required = stakeholderMode;
    elements.stakeholderSelect.value = activeSession()?.stakeholder || "management_office_duty";
  }

  function setMode(mode) {
    if (!modeConfig[mode] || pending) return;
    const session = activeSession();
    if (session) { session.mode = mode; session.updatedAt = Date.now(); saveSessions(); }
    updateModeUI(mode);
  }

  function renderSourceShelf(sources) {
    elements.sourceShelf.replaceChildren();
    elements.sourceCount.textContent = `${sources.length} 条`;
    if (!sources.length) {
      const placeholder = document.createElement("p");
      placeholder.className = "source-placeholder";
      placeholder.textContent = "本次回答未返回可展示来源。遇到关键事实，请继续要求小南给出依据。";
      elements.sourceShelf.append(placeholder);
      return;
    }
    sources.slice(0, 6).forEach((source) => {
      const article = document.createElement("article");
      article.className = "shelf-source";
      const title = document.createElement("b"); title.textContent = source.title;
      const locator = document.createElement("span"); locator.textContent = source.locator;
      article.append(title, locator);
      elements.sourceShelf.append(article);
    });
  }

  function createMessageElement(message) {
    const article = document.createElement("article");
    article.className = `message ${message.role === "user" ? "user-message" : "assistant-message"}`;
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.setAttribute("aria-hidden", "true");
    if (message.role === "user") {
      avatar.textContent = "问";
    } else {
      const mark = document.createElement("img");
      mark.src = "assets/nanyong-mark.svg";
      mark.alt = "";
      avatar.append(mark);
    }
    const content = document.createElement("div"); content.className = "message-content";
    const author = document.createElement("div"); author.className = "message-author";
    const name = document.createElement("b"); name.textContent = message.role === "user" ? "你" : "小南";
    const meta = document.createElement("span");
    meta.textContent = message.role === "user" ? formatTime(message.createdAt) : [message.model, message.knowledgeVersion].filter(Boolean).join(" · ") || "案例知识库增强";
    author.append(name, meta);
    const text = document.createElement("div"); text.className = "message-text";
    const paragraph = document.createElement("p"); paragraph.textContent = message.content; text.append(paragraph);
    content.append(author, text);
    if (message.role === "assistant" && message.boundary) {
      const labels = {
        evidence_only: "仅依据现有材料",
        evidence_grounded: "案例证据已检索",
        insufficient_evidence: "案例材料不足",
        manual_review_required: "需要人工判断",
        human_review_required: "分析结论需人工复核",
        restricted: "超出助手权限",
        simulated: "模拟视角",
        conversation: "对话引导"
      };
      const boundary = document.createElement("span"); boundary.className = "answer-boundary"; boundary.textContent = labels[message.boundary] || `回答边界：${message.boundary}`;
      content.append(boundary);
    }
    if (message.role === "assistant" && message.sources?.length) {
      const sourceId = `sources-${message.id}`;
      const toggle = document.createElement("button");
      toggle.type = "button"; toggle.className = "source-toggle"; toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-controls", sourceId);
      toggle.textContent = `查看 ${message.sources.length} 条来源`;
      const sourceList = document.createElement("div"); sourceList.className = "message-sources"; sourceList.id = sourceId; sourceList.hidden = true;
      message.sources.forEach((source) => {
        const item = document.createElement("div"); item.className = "inline-source";
        const title = document.createElement("b"); title.textContent = source.title;
        const detail = document.createElement("span"); detail.textContent = [source.locator, source.excerpt].filter(Boolean).join(" · ");
        item.append(title, detail); sourceList.append(item);
      });
      toggle.addEventListener("click", () => { const open = toggle.getAttribute("aria-expanded") === "true"; toggle.setAttribute("aria-expanded", String(!open)); sourceList.hidden = open; toggle.textContent = open ? `查看 ${message.sources.length} 条来源` : "收起来源"; });
      content.append(toggle, sourceList);
    }
    article.append(avatar, content);
    return article;
  }

  function renderMessages(scrollToEnd = false) {
    elements.list.querySelectorAll(".message").forEach((node) => node.remove());
    const session = activeSession();
    const messages = session?.messages || [];
    elements.welcome.hidden = messages.length > 0;
    messages.forEach((message) => elements.list.append(createMessageElement(message)));
    const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant");
    renderSourceShelf(lastAssistant?.sources || []);
    if (scrollToEnd) scrollConversationToEnd();
  }

  function scrollConversationToEnd() {
    requestAnimationFrame(() => {
      elements.scroll.scrollTop = elements.scroll.scrollHeight;
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "auto" });
    });
  }

  function renderSessions() {
    elements.sessions.replaceChildren();
    elements.sessionCount.textContent = String(sessions.length);
    elements.historyEmpty.hidden = sessions.length > 0;
    sessions.forEach((session) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button"; button.className = "session-button"; button.classList.toggle("is-active", session.id === activeSessionId);
      if (session.id === activeSessionId) button.setAttribute("aria-current", "true");
      const title = document.createElement("b"); title.textContent = session.title || "新对话";
      const meta = document.createElement("small"); meta.textContent = `${modeConfig[session.mode]?.title || "案例事实"} · ${formatTime(session.updatedAt)}`;
      button.append(title, meta);
      button.addEventListener("click", () => { if (pending) return; activeSessionId = session.id; renderSessions(); updateModeUI(session.mode); renderMessages(true); hideError(); closeHistoryDrawer(); });
      item.append(button); elements.sessions.append(item);
    });
  }

  function createSession(mode = currentMode()) {
    const session = { id: uid(), title: "新对话", mode, stakeholder: "management_office_duty", messages: [], updatedAt: Date.now() };
    sessions.unshift(session); activeSessionId = session.id; saveSessions(); renderSessions(); updateModeUI(mode); renderMessages(); hideError(); elements.input.focus();
    return session;
  }

  function ensureSession() {
    return activeSession() || createSession(currentMode());
  }

  function hideError() { elements.error.hidden = true; }

  function showError(message, question) {
    lastFailedQuestion = question;
    elements.errorMessage.textContent = message;
    elements.error.hidden = false;
    setConnection("error", "连接失败");
  }

  function updateInput() {
    elements.input.style.height = "auto";
    elements.input.style.height = `${Math.min(elements.input.scrollHeight, 150)}px`;
    elements.count.textContent = `${elements.input.value.length} / 1200`;
  }

  function setVoiceListening(value) {
    voiceListening = value;
    elements.voice.classList.toggle("is-listening", value);
    elements.voice.setAttribute("aria-pressed", String(value));
    elements.voice.setAttribute("aria-label", value ? "停止语音输入" : "开始语音输入");
    elements.voice.title = value ? "停止语音输入" : "开始语音输入";
  }

  function initializeVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      elements.voice.disabled = true;
      elements.voice.title = "当前浏览器不支持语音输入";
      elements.voiceStatus.textContent = "当前浏览器不支持语音输入";
      return false;
    }

    voiceRecognition = new SpeechRecognition();
    voiceRecognition.lang = "zh-CN";
    voiceRecognition.continuous = false;
    voiceRecognition.interimResults = true;

    voiceRecognition.onstart = () => {
      setVoiceListening(true);
      elements.voiceStatus.textContent = "正在听，请说话…";
      setConnection("ready", "正在听");
    };
    voiceRecognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript || "";
      }
      const separator = voiceBaseValue && transcript ? " " : "";
      elements.input.value = `${voiceBaseValue}${separator}${transcript}`.slice(0, 1200);
      updateInput();
      elements.voiceStatus.textContent = "已转为文字，可继续编辑";
    };
    voiceRecognition.onerror = (event) => {
      const messages = {
        "not-allowed": "麦克风权限未开启，请在浏览器设置中允许后重试。",
        "service-not-allowed": "麦克风权限未开启，请在浏览器设置中允许后重试。",
        "no-speech": "没有听到内容，请再试一次。",
        "audio-capture": "未找到可用麦克风。"
      };
      elements.voiceStatus.textContent = messages[event.error] || "语音输入暂时不可用，请改用键盘输入。";
      setConnection("error", "语音输入失败");
      setVoiceListening(false);
    };
    voiceRecognition.onend = () => {
      setVoiceListening(false);
      if (elements.voiceStatus.textContent === "正在听，请说话…") elements.voiceStatus.textContent = "没有听到内容，请再试一次。";
      if (!elements.connection.classList.contains("is-error")) setConnection("", "等待提问");
      elements.input.focus();
    };
    return true;
  }

  function toggleVoiceInput() {
    if (!voiceRecognition || pending) return;
    if (voiceListening) {
      elements.voiceStatus.textContent = "已停止语音输入";
      voiceRecognition.stop();
      return;
    }
    voiceBaseValue = elements.input.value.trim();
    try {
      voiceRecognition.start();
    } catch (_error) {
      elements.voiceStatus.textContent = "语音输入正在启动，请稍候。";
    }
  }

  function setPending(value) {
    pending = value;
    elements.send.disabled = value;
    elements.input.disabled = value;
    elements.voice.disabled = value || !voiceRecognition;
    elements.modes.forEach((button) => { button.disabled = value; });
    elements.send.querySelector("span").textContent = value ? "等待" : "发送";
  }

  async function requestAnswer(messages, mode, stakeholder) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    try {
      const body = { messages: messages.map(({ role, content }) => ({ role, content })), mode };
      if (mode === "stakeholder") body.stakeholder = stakeholder;
      const response = await fetch(API_URL, {
        method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(body), signal: controller.signal
      });
      let payload;
      try { payload = await response.json(); } catch (_error) { throw new Error("服务返回了无法识别的内容。"); }
      if (!response.ok) throw new Error(payload.message || payload.error || `请求失败（${response.status}）`);
      return normalizeResponse(payload);
    } catch (error) {
      if (error.name === "AbortError") throw new Error("等待回答超时，请稍后重试。");
      if (error instanceof TypeError) throw new Error("暂时无法连接问答服务，请检查网络后重试。");
      throw error;
    } finally { window.clearTimeout(timeout); }
  }

  async function sendQuestion(rawQuestion) {
    const question = rawQuestion.trim();
    if (!question || pending) return;
    if (voiceListening) voiceRecognition.stop();
    const session = ensureSession();
    hideError();
    const userMessage = { id: uid(), role: "user", content: question, createdAt: Date.now() };
    session.messages.push(userMessage);
    if (session.messages.filter((message) => message.role === "user").length === 1) session.title = question.slice(0, 24);
    session.updatedAt = Date.now();
    elements.input.value = ""; updateInput(); renderMessages(true); renderSessions(); saveSessions(); setPending(true); setConnection("", "正在检索");
    const loading = elements.loadingTemplate.content.firstElementChild.cloneNode(true);
    elements.list.append(loading); scrollConversationToEnd();
    try {
      const result = await requestAnswer(session.messages, session.mode, session.stakeholder || "management_office_duty");
      session.messages.push({ id: uid(), role: "assistant", content: result.answer, sources: result.sources, model: result.model, knowledgeVersion: result.knowledgeVersion, boundary: result.boundary, createdAt: Date.now() });
      session.updatedAt = Date.now(); lastFailedQuestion = ""; saveSessions();
      setConnection("ready", result.boundary === "conversation" ? "小南 · 等待提问" : `${result.model} · 知识库已检索`);
      renderMessages(true); renderSessions();
    } catch (error) {
      session.messages = session.messages.filter((message) => message.id !== userMessage.id);
      if (!session.messages.length) { session.title = "新对话"; }
      saveSessions(); renderMessages(true); renderSessions(); showError(error.message || "请求失败，请稍后重试。", question);
    } finally { loading.remove(); setPending(false); elements.input.focus(); }
  }

  initializeVoiceInput();
  elements.form.addEventListener("submit", (event) => { event.preventDefault(); sendQuestion(elements.input.value); });
  elements.voice.addEventListener("click", toggleVoiceInput);
  elements.input.addEventListener("input", updateInput);
  elements.input.addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); elements.form.requestSubmit(); } });
  elements.newChat.addEventListener("click", () => { if (!pending) createSession(currentMode()); });
  elements.clear.addEventListener("click", () => {
    if (pending) return;
    const session = activeSession();
    if (!session?.messages.length) return;
    if (!window.confirm("清空当前对话？这项操作无法撤销。")) return;
    session.messages = []; session.title = "新对话"; session.updatedAt = Date.now(); saveSessions(); renderMessages(); renderSessions(); setConnection("", "等待提问");
  });
  elements.retry.addEventListener("click", () => { if (lastFailedQuestion) sendQuestion(lastFailedQuestion); });
  elements.stakeholderSelect.addEventListener("change", () => {
    const selectedStakeholder = elements.stakeholderSelect.value;
    const session = ensureSession();
    session.stakeholder = selectedStakeholder;
    elements.stakeholderSelect.value = selectedStakeholder;
    session.updatedAt = Date.now();
    saveSessions();
  });
  elements.modes.forEach((button, index) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = (index + (event.key === "ArrowRight" ? 1 : -1) + elements.modes.length) % elements.modes.length;
      elements.modes[nextIndex].focus(); setMode(elements.modes[nextIndex].dataset.mode);
    });
  });

  function openHistoryDrawer() {
    elements.historyPanel.classList.add("is-open");
    elements.mobileHistory.setAttribute("aria-expanded", "true");
    elements.historyScrim.hidden = false;
    elements.historyClose.focus();
  }

  function closeHistoryDrawer() {
    if (!elements.historyPanel.classList.contains("is-open")) return;
    elements.historyPanel.classList.remove("is-open");
    elements.mobileHistory.setAttribute("aria-expanded", "false");
    elements.historyScrim.hidden = true;
    elements.mobileHistory.focus();
  }

  elements.mobileHistory.addEventListener("click", openHistoryDrawer);
  elements.historyClose.addEventListener("click", closeHistoryDrawer);
  elements.historyScrim.addEventListener("click", closeHistoryDrawer);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeHistoryDrawer(); });

  renderSessions();
  updateModeUI(activeSession()?.mode || "facts");
  renderMessages(Boolean(activeSession()?.messages?.length));
  updateInput();
})();
