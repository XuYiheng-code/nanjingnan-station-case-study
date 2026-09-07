const openCrossPageLinksInNewTabs = () => {
  document.querySelectorAll("a[href]").forEach((link) => {
    const rawHref = link.getAttribute("href");
    if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("javascript:") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) return;
    const url = new URL(rawHref, window.location.href);
    const samePage = url.origin === window.location.origin && url.pathname === window.location.pathname;
    if (samePage) return;
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });
};
openCrossPageLinksInNewTabs();

const state = {
  scenario: null,
  currentCard: null,
  confirmedRoles: new Set(),
  role: "operator_supervisor",
  projects: [],
  activeProjectId: "",
  evidence: [],
  evidenceFilter: "all",
  evidenceQuery: "",
  runtimeMode: window.location.protocol === "file:" ? "offline" : "server"
};

const offlineData = window.HUBCOORD_OFFLINE_DATA || null;
const offlineKey = "hubcoord-offline-workspace-v1";
let offlineStore = null;
let presentationTrigger = null;

const labels = {
  verify_evidence: "核验现场线索",
  request_cross_party_confirmation: "提出协同确认",
  escalate_for_human_review: "转人工升级",
  direct_enforcement: "直接行政处置",
  share_restricted_data: "共享未授权数据",
  operator_supervisor: "交控万物现场主管",
  management_office_duty: "综管办值守人员",
  hub_liaison: "铁路／枢纽联络人",
  framing: "问题界定",
  evidence_review: "证据审阅",
  pending_human_confirmation: "待人工确认",
  confirmed: "已确认",
  rejected: "已拒绝",
  escalated: "已升级",
  project_seeded: "建立演示档案",
  project_created: "建立项目",
  coordination_card_drafted: "生成协同卡",
  coordination_card_confirmed: "确认记录",
  coordination_card_rejected: "拒绝记录",
  coordination_card_escalated: "升级记录",
  within_service_scope: "服务范围内",
  coordination_required: "需要协同确认",
  restricted: "不可越权",
  unknown: "资料不足",
  observed_fact: "观察事实",
  interview_view: "受访方陈述",
  policy_text: "制度文本",
  researcher_note: "研究团队判断",
  simulation_assumption: "模拟设定",
  initiator_not_allowed: "角色不可发起",
  event_not_found: "事件不存在",
  scenario_not_found: "情景不存在",
  reject: "文本被拒绝",
  human_gate: "人工闸门",
  approved: "研究团队已审阅，可用于本次展示"
};

const moduleAnchors = {
  case_workspace: "projects",
  knowledge_library: "knowledge",
  coordination_lab: "lab",
  case_report: "projects"
};

function cardStatusText(card) {
  if (card.authority_decision === "restricted" && card.status === "pending_human_confirmation") {
    return "RESTRICTED · 等待人工处置";
  }
  return card.status.replaceAll("_", " ").toUpperCase();
}

function humanCardStatusText(card) {
  if (card.authority_decision === "restricted" && card.status === "pending_human_confirmation") {
    return "受限事项 · 等待人工处置";
  }
  return labels[card.status] || card.status;
}

const presentationSteps = [
  { selector: "#top", title: "南站协同官是什么", note: "它把分散的现场线索整理成有证据、有规则、待确认的协同事项。", button: "看它怎样处理" },
  { selector: "#howItWorks", title: "先整理，再交给人确认", note: "系统收拢线索、查证据与权责、起草议题；跨主体事项仍由规定角色作出判断。", button: "进入应用情景" },
  { selector: "#scenario", title: "把方法放进 SC-01", note: "晚点压力从铁路运行域传到停车运营域和外围道路。旅客路径连续，治理责任分段。", button: "调取已审阅证据" },
  { selector: "#knowledge", title: "证据分层", note: "模拟设定、研究团队判断和四项待核验冲突分别展示；有矛盾就暂停使用。", button: "核对权责" },
  { selector: "#authority", title: "先判权责", note: "同一动作因角色和权限不同得到不同结果；没有匹配规则时只返回资料不足。", button: "生成协同议题卡", action: "draft_coordination" },
  { selector: "#coordinationCard", title: "现场主管先确认", note: "五个任务节点已经给出最小证据集和判断链。点击后记录现场主管的模拟确认理由。", button: "记录现场主管确认", action: "confirm_operator" },
  { selector: "#coordinationCard", title: "综管办再确认", note: "跨主体事项不会因一个角色同意而完成。现在切换综管办值守人员，记录第二次模拟确认。", button: "记录综管办确认", action: "confirm_management" },
  { selector: "#coordinationCard", title: "再试一次越权请求", note: "把动作改成直接行政处置。安全审计节点应当拦截确认，只允许拒绝或升级。", button: "运行越权对照", action: "test_restricted" },
  { selector: "#coordinationCard", title: "边界已被实际拦截", note: "确认按钮已经禁用。演示到这里完成：系统可以整理协同事项，但不能改写法定权责。", button: "回到开头", action: "restart" }
];
let presentationStep = 0;

const activity = (text) => { document.getElementById("activity").textContent = text; };
const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
const formatTime = (value) => new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

const clone = (value) => JSON.parse(JSON.stringify(value));
const offlineId = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

function loadOfflineStore() {
  if (offlineStore) return offlineStore;
  try {
    offlineStore = JSON.parse(localStorage.getItem(offlineKey));
  } catch (_error) {
    offlineStore = null;
  }
  if (!offlineStore || !Array.isArray(offlineStore.projects) || !offlineStore.cards) {
    const seed = clone(offlineData.seed_project);
    offlineStore = { projects: [seed], cards: {} };
  }
  return offlineStore;
}

function saveOfflineStore() {
  try { localStorage.setItem(offlineKey, JSON.stringify(offlineStore)); } catch (_error) { /* private mode can block storage */ }
}

function offlineAnswer(question) {
  const text = question.toLocaleLowerCase("zh-CN");
  const evidenceById = Object.fromEntries(offlineData.knowledge.evidence_cards.map((item) => [item.evidence_id, item]));
  const cite = (...ids) => ids.filter((id) => evidenceById[id]).map((id) => ({
    evidence_id: id,
    source_id: evidenceById[id].source_id,
    source_title: evidenceById[id].provenance.source_title,
    locator: evidenceById[id].provenance.locator
  }));
  if (["执法", "处罚", "强制", "交管", "直接处置"].some((term) => text.includes(term))) {
    return { answer: "不可以。平台只能整理线索、说明边界并建议升级，行政执法和处罚仍由法定主体决定。", boundary: "restricted", evidence: cite("EV-SC01-04"), authority_refs: ["AR-SC01-03"], human_gate: true };
  }
  if (["数据", "共享", "轨迹", "车牌"].some((term) => text.includes(term))) {
    return { answer: "当前知识包没有跨主体数据共享授权。平台不能调用或转发未授权数据。", boundary: "manual_review_required", evidence: cite("EV-SC01-04"), authority_refs: [], human_gate: true };
  }
  if (["证据", "来源", "引用", "依据"].some((term) => text.includes(term))) {
    return { answer: "当前运行时只使用研究团队已审阅、可用于本次展示的材料。每条回答保留证据编号、来源标题和定位。", boundary: "evidence_only", evidence: cite("EV-SC01-01", "EV-SC01-04"), authority_refs: [], human_gate: true };
  }
  if (["晚点", "协同", "停车场", "谁负责", "责任"].some((term) => text.includes(term))) {
    return { answer: "SC-01 可由现场主管或枢纽联络人发起模拟协同请求，由现场主管与综管办值守人员确认。停车场的具体权属仍有稿件冲突，不能自动判定。", boundary: "coordination_required", evidence: cite("EV-SC01-01", "EV-SC01-04"), authority_refs: ["AR-SC01-02"], review_refs: ["EVID-004"], human_gate: true };
  }
  return { answer: "当前可展示知识包不足以回答这个问题，需要补充可核验来源或交由研究团队判断。", boundary: "insufficient_evidence", evidence: [], authority_refs: [], human_gate: true };
}

function offlineDraft(payload) {
  const event = offlineData.scenario.events.find((item) => item.event_id === payload.event_id);
  const rule = offlineData.authority.rules.find((item) => item.proposed_action === payload.proposed_action);
  if (!event || !rule) return { status: "manual_review_required", event_id: payload.event_id, reason_code: "authority_unknown", message: "拟议动作没有匹配的展示版权责规则，需人工补充。", human_gate: true, data_status: "simulated" };
  if (!rule.initiator_roles.includes(payload.acting_role)) return { status: "manual_review_required", event_id: payload.event_id, reason_code: "initiator_not_allowed", message: "当前角色不能发起该模拟协同事项。", human_gate: true, data_status: "simulated" };
  const evidenceRefs = offlineData.scenario.action_evidence_refs[payload.proposed_action] || [];
  const restricted = rule.decision === "restricted";
  const card = {
    card_id: offlineId("CC-OFFLINE"), event_id: event.event_id, status: "pending_human_confirmation", data_status: "simulated",
    knowledge_version: offlineData.knowledge.knowledge_version, evidence_refs: evidenceRefs, authority_refs: [rule.rule_id], authority_decision: rule.decision,
    decision_trace: [
      `事件归并 Agent：${event.event_type} / ${event.spatial_scope}`,
      `证据检索 Agent：命中 ${evidenceRefs.length} 张研究团队已审阅的相关证据卡`,
      `权责核验 Agent：${rule.rule_id} → ${rule.decision}`,
      `议题起草 Agent：形成待人工确认的协同议题；建议下一步为 ${rule.decision === "within_service_scope" ? "verify_evidence" : rule.decision === "coordination_required" ? "request_cross_party_confirmation" : "escalate_for_human_review"}`,
      `安全审计 Agent：保留人工闸门，需 ${rule.required_human_roles.length} 个角色确认`
    ],
    summary: restricted ? "该模拟事项涉及展示版之外的行政处置边界。系统不能生成处置指令。" : "模拟事件需要先核验已展示的线索，再由对应角色确认下一步协同事项。",
    recommended_next_step: rule.decision === "within_service_scope" ? "verify_evidence" : rule.decision === "coordination_required" ? "request_cross_party_confirmation" : "escalate_for_human_review",
    required_confirmations: rule.required_human_roles, boundary_notice: rule.boundary_reason, human_gate: true, created_at: new Date().toISOString(),
    confirmed_roles: [], confirmation_records: []
  };
  const store = loadOfflineStore();
  store.cards[card.card_id] = card;
  if (payload.project_id) {
    const project = store.projects.find((item) => item.project_id === payload.project_id);
    if (project) {
      project.cards.unshift(card);
      project.activities.unshift({ occurred_at: card.created_at, type: "coordination_card_drafted", message: `已生成模拟协同议题卡 ${card.card_id}。` });
      project.updated_at = card.created_at;
    }
  }
  saveOfflineStore();
  return clone(card);
}

async function offlineRequest(url, options = {}) {
  if (!offlineData) throw new Error("离线数据包未加载。");
  const path = String(url).split("?", 1)[0];
  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  const store = loadOfflineStore();
  if (path === "/healthz") return { status: "ok", mode: "case_teaching_simulation" };
  if (path === "/api/v1/platform") return clone(offlineData.platform);
  if (path === "/api/v1/knowledge/evidence") return clone(offlineData.knowledge);
  if (path === "/api/v1/knowledge/review-issues") return clone(offlineData.review);
  if (path === "/api/v1/authority") return clone(offlineData.authority);
  if (path === "/api/v1/scenarios/SC-01") return clone(offlineData.scenario);
  if (path === "/api/v1/projects" && method === "GET") return { projects: clone(store.projects) };
  if (path === "/api/v1/projects" && method === "POST") {
    const now = new Date().toISOString();
    const project = { project_id: offlineId("PJ-OFFLINE"), title: body.title, research_question: body.research_question, stage: "framing", created_at: now, updated_at: now, activities: [{ occurred_at: now, type: "project_created", message: "已建立离线演示项目。" }], cards: [] };
    store.projects.unshift(project); saveOfflineStore(); return { project: clone(project) };
  }
  const projectMatch = path.match(/^\/api\/v1\/projects\/([^/]+)$/);
  if (projectMatch) {
    const project = store.projects.find((item) => item.project_id === decodeURIComponent(projectMatch[1]));
    if (!project) throw new Error("案例项目不存在。");
    return { project: clone(project) };
  }
  if (path === "/api/v1/assistant/query" && method === "POST") return offlineAnswer(body.question || "");
  if (path === "/api/v1/cards/draft" && method === "POST") return offlineDraft(body);
  const decisionMatch = path.match(/^\/api\/v1\/cards\/([^/]+)\/decisions$/);
  if (decisionMatch && method === "POST") {
    const card = store.cards[decodeURIComponent(decisionMatch[1])];
    if (!card) throw new Error("协同议题卡不存在。");
    if (card.authority_decision === "restricted" && body.decision === "confirmed") throw new Error("受限事项不能进入“已确认”状态。");
    if (!card.required_confirmations.includes(body.actor_role)) throw new Error("当前角色不是这张卡的必要确认者。");
    if (card.confirmation_records.some((item) => item.actor_role === body.actor_role)) throw new Error("当前角色已经作出决定。");
    const occurredAt = new Date().toISOString();
    card.confirmation_records.push({ actor_role: body.actor_role, decision: body.decision, reason: body.reason, occurred_at: occurredAt });
    if (body.decision === "confirmed") card.confirmed_roles.push(body.actor_role); else card.status = body.decision;
    if (card.required_confirmations.every((role) => card.confirmed_roles.includes(role))) card.status = "confirmed";
    store.projects.forEach((project) => { if (project.cards.some((item) => item.card_id === card.card_id)) project.activities.unshift({ occurred_at: occurredAt, type: `coordination_card_${body.decision}`, message: `${body.actor_role} 已记录模拟决定。` }); });
    saveOfflineStore();
    return { record_id: offlineId("AL-OFFLINE"), card_id: card.card_id, actor_role: body.actor_role, action: body.decision, occurred_at: occurredAt, reason: body.reason, data_status: "simulated", card_status: card.status, confirmed_roles: clone(card.confirmed_roles) };
  }
  throw new Error("离线演示不支持该请求。");
}

async function request(url, options) {
  if (state.runtimeMode === "offline") return offlineRequest(url, options);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let response;
  try {
    response = await fetch(url, { ...(options || {}), signal: controller.signal });
  } catch (error) {
    throw new Error(error.name === "AbortError" ? "连接超时。" : "无法连接本地展示服务。");
  } finally {
    clearTimeout(timeout);
  }
  const type = response.headers.get("content-type") || "";
  if (!type.includes("application/json")) throw new Error("展示服务返回了无法识别的内容。");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || "请求失败");
  return payload;
}

function setDemoStep(step) {
  document.querySelectorAll(".demo-steps li").forEach((item, index) => {
    item.classList.toggle("is-current", index === step - 1);
    item.classList.toggle("is-done", index < step - 1);
  });
}

function resetAgentPipeline() {
  document.querySelectorAll("#agentPipeline li").forEach((item) => {
    item.classList.remove("is-active", "is-done", "is-blocked");
    item.querySelector("em").textContent = "待运行";
  });
}

async function runAgentPipeline() {
  resetAgentPipeline();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const items = [...document.querySelectorAll("#agentPipeline li")];
  for (const item of items) {
    item.classList.add("is-active");
    item.querySelector("em").textContent = "核验中";
    if (!reduced) await new Promise((resolve) => setTimeout(resolve, 280));
    item.classList.remove("is-active");
    item.classList.add("is-done");
    item.querySelector("em").textContent = "已完成";
  }
}

function updatePresentationGuide(scroll = true) {
  const step = presentationSteps[presentationStep];
  document.getElementById("presentationProgress").textContent = `答辩 ${presentationStep + 1} / ${presentationSteps.length}`;
  document.getElementById("presentationTitle").textContent = step.title;
  document.getElementById("presentationNote").textContent = step.note;
  document.getElementById("presentationNext").textContent = step.button;
  const target = document.querySelector(step.selector);
  const dossier = target?.closest("details");
  if (dossier) dossier.open = true;
  if (scroll) target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function choosePresentationRole(role) {
  const input = document.querySelector(`input[name=role][value="${role}"]`);
  if (!input) return false;
  input.checked = true;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function choosePresentationAction(action) {
  const input = document.querySelector(`input[name=action][value="${action}"]`);
  if (!input) return false;
  input.checked = true;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

async function advancePresentation() {
  const step = presentationSteps[presentationStep];
  const button = document.getElementById("presentationNext");
  button.disabled = true;
  try {
    if (step.action === "draft_coordination") {
      choosePresentationRole("operator_supervisor");
      choosePresentationAction("request_cross_party_confirmation");
      await draft();
      if (state.currentCard?.authority_decision !== "coordination_required") return;
    } else if (step.action === "confirm_operator") {
      choosePresentationRole("operator_supervisor");
      document.getElementById("decisionReason").value = "已核对模拟晚点线索与服务范围，提请确认跨主体协同事项。";
      if (!(await decide("confirmed"))) return;
    } else if (step.action === "confirm_management") {
      choosePresentationRole("management_office_duty");
      document.getElementById("decisionReason").value = "已核对权责边界，同意记录本次模拟协同事项。";
      if (!(await decide("confirmed"))) return;
    } else if (step.action === "test_restricted") {
      choosePresentationRole("management_office_duty");
      choosePresentationAction("direct_enforcement");
      await draft();
      if (state.currentCard?.authority_decision !== "restricted") return;
    } else if (step.action === "restart") {
      presentationStep = 0;
      updatePresentationGuide(true);
      return;
    }
    presentationStep += 1;
    updatePresentationGuide(true);
  } finally {
    button.disabled = false;
  }
}

function activatePresentationMode(updateUrl = true) {
  presentationTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  presentationStep = 0;
  document.body.classList.add("presentation-mode");
  document.getElementById("presentationGuide").classList.remove("hidden");
  if (updateUrl && window.location.protocol !== "file:") {
    const url = new URL(window.location.href);
    url.searchParams.set("demo", "1");
    history.replaceState({}, "", url);
  }
  updatePresentationGuide(true);
  document.getElementById("presentationNext").focus({ preventScroll: true });
}

function exitPresentationMode() {
  document.body.classList.remove("presentation-mode");
  document.getElementById("presentationGuide").classList.add("hidden");
  if (window.location.protocol !== "file:") {
    const url = new URL(window.location.href);
    url.searchParams.delete("demo");
    history.replaceState({}, "", url);
  }
  if (presentationTrigger?.isConnected) presentationTrigger.focus();
  else document.getElementById("presentationModeButton").focus();
  presentationTrigger = null;
}

async function runBoundaryDemo() {
  choosePresentationRole("management_office_duty");
  choosePresentationAction("direct_enforcement");
  document.getElementById("lab").scrollIntoView({ behavior: "smooth", block: "start" });
  await draft();
  document.getElementById("coordinationCard").scrollIntoView({ behavior: "smooth", block: "center" });
}

async function prepareFreshDemo() {
  const button = document.getElementById("freshDemoStart");
  button.disabled = true;
  button.textContent = "正在准备…";
  try {
    const time = new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date());
    const result = await request("/api/v1/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `现场推演空白档案 ${time}`,
        research_question: "在多主体治理边界下，怎样把事件线索转化为可核验、可确认的协同事项？"
      })
    });
    state.activeProjectId = result.project.project_id;
    state.currentCard = null;
    state.confirmedRoles.clear();
    document.getElementById("coordinationCard").classList.add("hidden");
    document.getElementById("manualReview").classList.add("hidden");
    document.getElementById("emptyCard").classList.remove("hidden");
    document.getElementById("decisionReason").value = "";
    resetAgentPipeline();
    setDemoStep(1);
    await loadProjects();
    activity("空白演示档案已准备好；此前的彩排记录仍保留在原档案中。");
  } catch (error) {
    activity(`无法准备空白演示档案：${error.message}`);
  } finally {
    button.disabled = false;
    button.textContent = "彩排前准备一份空白演示档案";
  }
}

function renderModules(modules) {
  document.getElementById("moduleGrid").innerHTML = modules.map((module, index) => `
    <article class="module-card ${module.status === "planned" ? "is-planned" : ""}">
      <span class="module-index">0${index + 1} / ${escapeHtml(module.kind).toUpperCase()}</span>
      <h3>${escapeHtml(module.name)}</h3><p>${escapeHtml(module.description)}</p>
      <a class="module-status" href="#${moduleAnchors[module.module_id] || "top"}">${module.status === "available" ? "打开模块 &rarr;" : "查看规划 &rarr;"}</a>
    </article>`).join("");
}

function renderProjects() {
  const list = document.getElementById("projectList");
  const select = document.getElementById("activeProject");
  list.innerHTML = state.projects.map((project) => `
    <button class="project-card ${project.project_id === state.activeProjectId ? "is-active" : ""}" data-project-id="${escapeHtml(project.project_id)}" aria-pressed="${project.project_id === state.activeProjectId}">
      <span>${escapeHtml(labels[project.stage] || project.stage)}</span><strong>${escapeHtml(project.title)}</strong>
      <p>${escapeHtml(project.research_question)}</p><small>${project.activities.length} 条平台活动</small>
    </button>`).join("") || '<p class="muted-copy">还没有项目。请建立第一个案例项目。</p>';
  select.innerHTML = `<option value="">不归属项目（独立演练）</option>${state.projects.map((project) => `<option value="${escapeHtml(project.project_id)}">${escapeHtml(project.title)}</option>`).join("")}`;
  select.value = state.activeProjectId;
  list.querySelectorAll("[data-project-id]").forEach((item) => item.addEventListener("click", () => {
    state.activeProjectId = item.dataset.projectId;
    renderProjects();
    const project = state.projects.find((candidate) => candidate.project_id === state.activeProjectId);
    activity(`当前推演归属“${project.title}”。`);
    loadProjectDetail();
  }));
  select.onchange = () => { state.activeProjectId = select.value; renderProjects(); loadProjectDetail(); };
}

function renderProjectInspector(project) {
  const inspector = document.getElementById("projectInspector");
  if (!project) {
    inspector.innerHTML = '<div class="inspector-empty"><p class="label">PROJECT DOSSIER</p><h3>选择一个案例项目</h3><p>这里显示项目活动、协同议题卡及其确认状态。</p></div>';
    return;
  }
  const cards = project.cards.length ? project.cards.map((card) => `
    <button class="archive-card" data-card-id="${escapeHtml(card.card_id)}">
      <span>${escapeHtml(humanCardStatusText(card))}</span><strong>${escapeHtml(card.summary)}</strong>
      <small>${escapeHtml(card.card_id)} · ${formatTime(card.created_at)}</small>
    </button>`).join("") : '<p class="muted-copy">这个项目还没有协同议题卡。</p>';
  const timeline = project.activities.length ? project.activities.map((item) => `
    <li><time>${formatTime(item.occurred_at)}</time><div><strong>${escapeHtml(labels[item.type] || item.type)}</strong><p>${escapeHtml(item.message)}</p></div></li>`).join("") : '<li><div><p>暂无活动。</p></div></li>';
  inspector.innerHTML = `
    <header><div><p class="label">PROJECT DOSSIER / ${escapeHtml(project.project_id)}</p><h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.research_question)}</p></div><div class="inspector-actions"><span>${escapeHtml(labels[project.stage] || project.stage)}</span><a href="${state.runtimeMode === "offline" ? "#offline-export" : `/api/v1/projects/${encodeURIComponent(project.project_id)}/export.md`}" data-offline-export="${escapeHtml(project.project_id)}">下载项目纪要</a></div></header>
    <div class="inspector-grid"><section><p class="rail-title">协同议题卡 / ${project.cards.length}</p><div class="archive-list">${cards}</div></section><section><p class="rail-title">项目活动 / ${project.activities.length}</p><ol class="activity-timeline">${timeline}</ol></section></div>`;
  inspector.querySelectorAll("[data-card-id]").forEach((item) => item.addEventListener("click", () => {
    const card = project.cards.find((candidate) => candidate.card_id === item.dataset.cardId);
    showCard(card, card.confirmed_roles || (card.status === "confirmed" ? card.required_confirmations : []));
    document.getElementById("lab").scrollIntoView({ behavior: "smooth", block: "start" });
    activity(`已从项目档案打开协同议题卡 ${card.card_id}。`);
  }));
  if (state.runtimeMode === "offline") {
    inspector.querySelector("[data-offline-export]")?.addEventListener("click", (event) => {
      event.preventDefault();
      downloadOfflineReport(project);
    });
  }
}

function downloadOfflineReport(project) {
  const lines = [
    `# ${project.title}｜离线模拟案例纪要`, "",
    `> 生成时间：${new Date().toLocaleString("zh-CN")}　数据状态：SIMULATED`, "",
    "## 当前研究问题", "", project.research_question, "", "## 协同议题卡", ""
  ];
  (project.cards || []).forEach((card) => {
    lines.push(`### ${card.card_id}｜${humanCardStatusText(card)}`, "", card.summary, "", `- 证据：${card.evidence_refs.join("、")}`, `- 权责规则：${card.authority_refs.join("、")}`, `- 状态：${humanCardStatusText(card)}`, "");
  });
  if (!(project.cards || []).length) lines.push("尚未生成协同议题卡。", "");
  lines.push("## 使用边界", "", "- 本纪要只汇总案例教学与模拟推演数据。", "- 系统没有发送任何真实业务指令。", "");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" }));
  link.download = `${project.project_id}-case-report.md`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function renderEvidenceCards() {
  const query = state.evidenceQuery.trim().toLocaleLowerCase("zh-CN");
  const matches = state.evidence.filter((card) => {
    const filterMatch = state.evidenceFilter === "all" || card.data_status === state.evidenceFilter || card.approval_status === state.evidenceFilter;
    const haystack = [card.evidence_id, card.excerpt, card.source_id, card.provenance.source_title, card.provenance.locator, ...card.tags].join(" ").toLocaleLowerCase("zh-CN");
    return filterMatch && (!query || haystack.includes(query));
  });
  const grid = document.getElementById("evidenceGrid");
  const empty = document.getElementById("evidenceEmpty");
  grid.innerHTML = matches.map((card) => `
    <article class="evidence-card"><span>${escapeHtml(card.evidence_id)} · ${escapeHtml(labels[card.content_type] || card.content_type)} · ${escapeHtml(card.data_status).toUpperCase()}</span>
      <p>${escapeHtml(card.excerpt)}</p>
      <details><summary>查看来源与使用边界</summary><dl><div><dt>来源</dt><dd>${escapeHtml(card.provenance.source_title)}</dd></div><div><dt>位置</dt><dd>${escapeHtml(card.provenance.locator)}</dd></div><div><dt>来源编号</dt><dd>${escapeHtml(card.source_id)}</dd></div><div><dt>资料状态</dt><dd>${escapeHtml(labels[card.approval_status] || card.approval_status)}</dd></div></dl></details>
      <div>${card.tags.map((tag) => `<i>${escapeHtml(tag)}</i>`).join("")}</div></article>`).join("");
  empty.classList.toggle("hidden", matches.length > 0);
}

function renderEvidence(data) {
  state.evidence = data.evidence_cards;
  document.getElementById("knowledgeStatus").textContent = `${data.evidence_cards.length} 张本次展示可用证据卡`;
  renderEvidenceCards();
}

function renderReviewIssues(data) {
  document.getElementById("reviewIssueGrid").innerHTML = data.issues.map((issue) => `
    <details class="review-issue"><summary><span>${escapeHtml(issue.issue_id)} · ${escapeHtml(issue.risk)}风险</span><strong>${escapeHtml(issue.title)}</strong><em>待核验</em></summary>
      <div class="issue-claims"><section><small>说法 A</small><p>${escapeHtml(issue.claim_a)}</p><code>${escapeHtml(issue.source_locator_a)}</code></section><section><small>说法 B</small><p>${escapeHtml(issue.claim_b)}</p><code>${escapeHtml(issue.source_locator_b)}</code></section></div>
      <p class="issue-action"><b>进入知识库前：</b>${escapeHtml(issue.required_action)}</p>
    </details>`).join("");
}

function decisionCell(rule, role) {
  if (!rule) return { text: "资料不足", className: "unknown" };
  if (!rule.initiator_roles.includes(role.role_id)) return { text: "不可发起", className: "stop" };
  const map = {
    within_service_scope: { text: "可核验", className: "ok" },
    coordination_required: { text: "需协同", className: "warn" },
    restricted: { text: "不可越权", className: "stop" }
  };
  return map[rule.decision] || { text: "资料不足", className: "unknown" };
}

function renderAuthority(data) {
  const actions = ["verify_evidence", "request_cross_party_confirmation", "direct_enforcement", "share_restricted_data"];
  const head = data.roles.map((role) => `<th scope="col">${escapeHtml(role.label)}</th>`).join("");
  const rows = actions.map((action) => {
    const rule = data.rules.find((candidate) => candidate.proposed_action === action);
    return `<tr><th scope="row"><span>${escapeHtml(labels[action])}</span><small>${rule ? escapeHtml(rule.rule_id) : "NO MATCHING RULE"}</small></th>${data.roles.map((role) => { const cell = decisionCell(rule, role); return `<td data-label="${escapeHtml(role.label)}"><span class="matrix-state ${cell.className}">${cell.text}</span></td>`; }).join("")}</tr>`;
  }).join("");
  document.getElementById("authorityMatrix").innerHTML = `<div class="table-scroll" tabindex="0" role="region" aria-label="权责规则表，可横向滚动"><table><thead><tr><th scope="col">拟议动作</th>${head}</tr></thead><tbody>${rows}</tbody></table></div><p class="matrix-note">规则版本 ${escapeHtml(data.rule_version)}。没有匹配规则时，系统只能返回“资料不足”，不能猜测责任主体。</p>`;
}

function renderRoleBoundary() {
  if (!state.scenario) return;
  const role = state.scenario.roles.find((item) => item.role_id === state.role);
  document.getElementById("roleBoundary").innerHTML = `<p><b>可以：</b>${role.can.map(escapeHtml).join("、")}</p><p><b>不可：</b>${role.cannot.map(escapeHtml).join("、")}</p>`;
  renderConfirmationProgress();
}

function renderRoles(roles) {
  const list = document.getElementById("roleList");
  list.innerHTML = roles.map((role, index) => `<label class="role-option"><input type="radio" name="role" value="${escapeHtml(role.role_id)}" ${index === 0 ? "checked" : ""}><span>${escapeHtml(role.label)}</span></label>`).join("");
  list.querySelectorAll("input").forEach((input) => input.addEventListener("change", () => {
    state.role = input.value;
    renderRoleBoundary();
    activity(`已切换为“${labels[state.role]}”。`);
  }));
  renderRoleBoundary();
}

function renderEvent(event) {
  document.getElementById("eventTitle").textContent = "模拟事件：列车晚点与停车场外溢";
  document.getElementById("eventSummary").textContent = "三条来源状态不同的模拟线索只用于研判，不能直接推出责任归属或处置结论。";
  document.getElementById("eventBadge").textContent = event.data_status.toUpperCase();
  document.getElementById("signals").innerHTML = event.signals.map((signal, index) => `<article class="signal" data-index="SIG / 0${index + 1}"><b>${escapeHtml(signal.summary)}</b><small>${escapeHtml(signal.source_kind)} · ${escapeHtml(signal.verification_status)}</small></article>`).join("");
}

function renderTimeline(timeline) {
  const nodes = document.getElementById("timelineNodes");
  const detail = document.getElementById("timelineDetail");
  const selectNode = (index) => {
    const item = timeline[index];
    nodes.querySelectorAll("button").forEach((button, buttonIndex) => {
      const active = buttonIndex === index;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active);
    });
    detail.innerHTML = `<span>${escapeHtml(item.time)} · ${escapeHtml(item.space)}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.summary)}</p>`;
  };
  nodes.innerHTML = timeline.map((item, index) => `
    <button type="button" data-timeline-index="${index}" aria-pressed="${index === 0}">
      <span>${escapeHtml(item.time)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.space)}</small>
    </button>`).join("");
  nodes.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => selectNode(Number(button.dataset.timelineIndex))));
  selectNode(0);
}

function renderConfirmationProgress() {
  const container = document.getElementById("confirmationProgress");
  const hint = document.getElementById("decisionHint");
  const panel = document.getElementById("decisionPanel");
  if (!state.currentCard || !container || !panel) return;
  const terminal = ["confirmed", "rejected", "escalated"].includes(state.currentCard.status);
  container.innerHTML = state.currentCard.required_confirmations.map((role) => `<span class="confirmation-role ${state.confirmedRoles.has(role) ? "is-confirmed" : ""}">${state.confirmedRoles.has(role) ? "已确认" : "待确认"} · ${escapeHtml(labels[role] || role)}</span>`).join("");
  const allowed = state.currentCard.required_confirmations.includes(state.role);
  panel.querySelectorAll("button").forEach((button) => {
    const restrictedConfirmation = state.currentCard.authority_decision === "restricted" && button.dataset.decision === "confirmed";
    button.disabled = terminal || !allowed || restrictedConfirmation;
  });
  panel.querySelector("textarea").disabled = terminal || !allowed;
  hint.textContent = terminal
    ? `卡片状态为“${labels[state.currentCard.status]}”，不能再修改。`
    : state.currentCard.authority_decision === "restricted"
      ? "该事项已被规则判为不可越权，只能拒绝或升级人工处理。"
      : allowed
        ? `当前以“${labels[state.role]}”记录模拟决定。`
        : `“${labels[state.role]}”不是这张卡的必要确认者，请切换角色。`;
}

function showCard(card, confirmedRoles = []) {
  state.currentCard = card;
  state.confirmedRoles = new Set(confirmedRoles);
  document.getElementById("manualReview").classList.add("hidden");
  document.getElementById("emptyCard").classList.add("hidden");
  const element = document.getElementById("coordinationCard");
  element.classList.remove("hidden");
  element.setAttribute("tabindex", "-1");
  document.getElementById("cardId").textContent = card.card_id;
  document.getElementById("cardStatus").textContent = cardStatusText(card);
  document.getElementById("cardSummary").textContent = card.summary;
  document.getElementById("boundaryNotice").textContent = card.boundary_notice;
  document.getElementById("nextStep").textContent = labels[card.recommended_next_step] || card.recommended_next_step;
  document.getElementById("confirmations").textContent = card.required_confirmations.map((role) => labels[role] || role).join("、");
  document.getElementById("evidenceRefs").textContent = card.evidence_refs.join(" · ");
  document.getElementById("authorityRefs").textContent = card.authority_refs.join(" · ");
  const trace = card.decision_trace || ["旧版议题卡未保存判断链，请重新生成后查看。"];
  document.getElementById("decisionTrace").innerHTML = trace.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  renderConfirmationProgress();
  setDemoStep(card.status === "pending_human_confirmation" ? 5 : 4);
  element.focus({ preventScroll: true });
  activity(state.activeProjectId ? "议题卡已写入当前项目，系统没有发出外部指令。" : "已生成待人工确认的模拟议题卡。系统没有发出外部指令。");
}

function showManual(result) {
  state.currentCard = null;
  document.getElementById("coordinationCard").classList.add("hidden");
  document.getElementById("emptyCard").classList.add("hidden");
  const element = document.getElementById("manualReview");
  element.classList.remove("hidden");
  element.setAttribute("tabindex", "-1");
  document.getElementById("manualTitle").textContent = "需要人工补充";
  document.getElementById("manualMessage").textContent = result.message;
  setDemoStep(3);
  element.focus({ preventScroll: true });
  activity(`未生成卡片：${result.reason_code}。`);
}

async function loadProjects() {
  const payload = await request("/api/v1/projects");
  state.projects = payload.projects;
  if (!state.activeProjectId && state.projects.length) state.activeProjectId = state.projects[0].project_id;
  renderProjects();
  await loadProjectDetail();
}

async function loadProjectDetail() {
  if (!state.activeProjectId) { renderProjectInspector(null); return; }
  try {
    const payload = await request(`/api/v1/projects/${encodeURIComponent(state.activeProjectId)}`);
    renderProjectInspector(payload.project);
  } catch (error) {
    renderProjectInspector(null);
    activity(`无法读取项目档案：${error.message}`);
  }
}

async function createProject(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const feedback = document.getElementById("projectFeedback");
  const button = form.querySelector("button");
  button.disabled = true;
  feedback.textContent = "正在建立演示项目…";
  try {
    const project = await request("/api/v1/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.elements.title.value, research_question: form.elements.research_question.value }) });
    state.activeProjectId = project.project.project_id;
    form.reset();
    await loadProjects();
    feedback.textContent = "项目已创建。协同实验室会把后续推演记入这份档案。";
  } catch (error) {
    feedback.textContent = `未能创建：${error.message}`;
  } finally {
    button.disabled = false;
  }
}

async function draft() {
  const action = document.querySelector("input[name=action]:checked").value;
  const event = state.scenario.events[0];
  const button = document.getElementById("draftButton");
  button.disabled = true;
  button.textContent = "正在核验…";
  setDemoStep(3);
  try {
    await runAgentPipeline();
    const result = await request("/api/v1/cards/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenario_id: state.scenario.scenario_id, event_id: event.event_id, acting_role: state.role, proposed_action: action, project_id: state.activeProjectId || undefined }) });
    if (result.status === "manual_review_required") {
      const last = document.querySelector("#agentPipeline li:last-child");
      last.classList.remove("is-done");
      last.classList.add("is-blocked");
      last.querySelector("em").textContent = "转人工";
      showManual(result);
      return null;
    }
    else {
      showCard(result);
      if (state.activeProjectId) await loadProjects();
      return result;
    }
  } catch (error) {
    showManual({ reason_code: "request_failed", message: error.message });
    return null;
  } finally {
    button.disabled = false;
    button.innerHTML = '生成模拟议题卡 <span aria-hidden="true">&rarr;</span>';
  }
}

async function decide(decision) {
  if (!state.currentCard) return false;
  const reason = document.getElementById("decisionReason").value.trim();
  if (!reason) {
    document.getElementById("decisionHint").textContent = "请先写明本次决定的依据。";
    document.getElementById("decisionReason").focus();
    return false;
  }
  try {
    const record = await request(`/api/v1/cards/${encodeURIComponent(state.currentCard.card_id)}/decisions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actor_role: state.role, decision, reason }) });
    state.currentCard.status = record.card_status;
    state.confirmedRoles = new Set(record.confirmed_roles);
    document.getElementById("cardStatus").textContent = cardStatusText(state.currentCard);
    renderConfirmationProgress();
    setDemoStep(5);
    activity(`已记录“${labels[record.actor_role]}”的模拟${decision === "confirmed" ? "确认" : labels[decision]}。`);
    if (state.activeProjectId) await loadProjects();
    return true;
  } catch (error) {
    activity(`无法记录决定：${error.message}`);
    return false;
  }
}

async function askAssistant(event) {
  event.preventDefault();
  const question = document.getElementById("assistantQuestion").value.trim();
  const answer = document.getElementById("assistantAnswer");
  answer.textContent = "正在核验证据与规则…";
  try {
    const result = await request("/api/v1/assistant/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
    const refs = [...result.evidence.map((item) => item.evidence_id), ...(result.authority_refs || []), ...(result.review_refs || [])];
    answer.innerHTML = `<strong>${escapeHtml(result.answer)}</strong><span>边界：${escapeHtml(result.boundary)} · 引用：${refs.length ? refs.map(escapeHtml).join(" / ") : "无可用来源"}</span>`;
  } catch (error) {
    answer.textContent = `无法回答：${error.message}`;
  }
}

function setupInteractions() {
  document.getElementById("projectForm").addEventListener("submit", createProject);
  document.getElementById("draftButton").addEventListener("click", draft);
  document.getElementById("assistantForm").addEventListener("submit", askAssistant);
  document.getElementById("presentationModeButton").addEventListener("click", () => activatePresentationMode());
  document.getElementById("normalDemoStart").addEventListener("click", () => activatePresentationMode());
  document.getElementById("boundaryDemoStart").addEventListener("click", runBoundaryDemo);
  document.getElementById("freshDemoStart").addEventListener("click", prepareFreshDemo);
  document.getElementById("presentationExit").addEventListener("click", exitPresentationMode);
  document.getElementById("presentationNext").addEventListener("click", advancePresentation);
  document.querySelectorAll("[data-decision]").forEach((button) => button.addEventListener("click", () => decide(button.dataset.decision)));
  document.querySelectorAll("[data-question]").forEach((button) => button.addEventListener("click", () => {
    document.getElementById("assistantQuestion").value = button.dataset.question;
    document.getElementById("assistantForm").requestSubmit();
  }));
  document.getElementById("evidenceSearch").addEventListener("input", (event) => { state.evidenceQuery = event.target.value; renderEvidenceCards(); });
  document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => {
    state.evidenceFilter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => { const active = item === button; item.classList.toggle("is-active", active); item.setAttribute("aria-pressed", active); });
    renderEvidenceCards();
  }));
  document.querySelectorAll("input[name=action]").forEach((input) => input.addEventListener("change", () => setDemoStep(3)));
  document.getElementById("runtimeRetry").addEventListener("click", async () => {
    if (window.location.protocol === "file:") return;
    state.runtimeMode = "server";
    await hydratePlatform(true);
  });
}

function setRuntimeNotice(message, allowRetry = false) {
  const notice = document.getElementById("runtimeNotice");
  document.getElementById("runtimeNoticeText").textContent = message;
  document.getElementById("runtimeRetry").classList.toggle("hidden", !allowRetry);
  notice.classList.remove("hidden");
}

async function hydratePlatform(isRetry = false) {
  try {
    await request("/healthz");
    const [platform, knowledge, review, authority] = await Promise.all([
      request("/api/v1/platform"),
      request("/api/v1/knowledge/evidence"),
      request("/api/v1/knowledge/review-issues"),
      request("/api/v1/authority")
    ]);
    renderModules(platform.modules);
    renderEvidence(knowledge);
    renderReviewIssues(review);
    renderAuthority(authority);
    await loadProjects();
    state.scenario = await request("/api/v1/scenarios/SC-01");
    document.getElementById("scenarioTitle").textContent = state.scenario.title;
    document.getElementById("scenarioStatus").textContent = state.scenario.data_status.toUpperCase();
    renderRoles(state.scenario.roles);
    renderEvent(state.scenario.events[0]);
    renderTimeline(state.scenario.timeline || []);
    const modeText = state.runtimeMode === "offline" ? "离线快照模式" : "网页服务模式";
    activity(`知识包、项目档案和 SC-01 已加载。当前为${modeText}，未调用外部模型。`);
    document.querySelector(".topbar-note").innerHTML = state.runtimeMode === "offline"
      ? '<span class="pulse" aria-hidden="true"></span> CASE TEACHING · OFFLINE READY'
      : '<span class="pulse" aria-hidden="true"></span> CASE TEACHING · WEB SERVICE';
    document.getElementById("runtimeNotice").classList.add("hidden");
    if (!isRetry && new URLSearchParams(window.location.search).get("demo") === "1") activatePresentationMode(false);
  } catch (error) {
    if (state.runtimeMode === "server" && offlineData) {
      state.runtimeMode = "offline";
      setRuntimeNotice("展示服务未连接，已自动切换到可操作的离线演示快照。", true);
      return hydratePlatform(false);
    }
    setRuntimeNotice(`平台数据未能加载：${error.message}`, window.location.protocol !== "file:");
    activity(`无法加载平台数据：${error.message}`);
  }
}

async function boot() {
  setupInteractions();
  if (state.runtimeMode === "offline") {
    setRuntimeNotice("当前为双击可用的离线演示；数据保存在本浏览器，不连接任何外部系统。");
  }
  await hydratePlatform();
}

boot();
