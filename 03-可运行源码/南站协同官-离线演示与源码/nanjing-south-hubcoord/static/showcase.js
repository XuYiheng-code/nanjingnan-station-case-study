(() => {
  "use strict";

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

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const supportsIO = "IntersectionObserver" in window;
  if (!reduceMotion && supportsIO) document.documentElement.classList.add("motion-ready");
  const progressBar = document.querySelector("#progressBar");
  const header = document.querySelector(".site-header");
  const navLinks = [...document.querySelectorAll(".site-header nav a[href^='#'], .side-nav a[href^='#']")];
  const sections = [...document.querySelectorAll("main section[id]")];

  const sidebarToggle = document.querySelector("#sidebarToggle");
  const caseSidebar = document.querySelector("#caseSidebar");
  const mobileMenu = document.querySelector("#mobileMenu");
  const sidebarBackdrop = document.querySelector("#sidebarBackdrop");
  const sidebarMedia = window.matchMedia("(max-width: 900px)");
  const syncSidebarA11y = () => {
    if (!caseSidebar) return;
    if (!sidebarMedia.matches) {
      caseSidebar.removeAttribute("aria-hidden");
      caseSidebar.inert = false;
      return;
    }
    const open = document.body.classList.contains("sidebar-open");
    caseSidebar.setAttribute("aria-hidden", String(!open));
    caseSidebar.inert = !open;
  };
  const closeMobileSidebar = (restoreFocus = false) => {
    const wasOpen = document.body.classList.contains("sidebar-open");
    document.body.classList.remove("sidebar-open");
    mobileMenu?.setAttribute("aria-expanded", "false");
    syncSidebarA11y();
    if (restoreFocus && wasOpen) mobileMenu?.focus();
  };
  sidebarToggle?.addEventListener("click", () => {
    const collapsed = document.body.classList.toggle("sidebar-collapsed");
    sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
    sidebarToggle.setAttribute("aria-label", collapsed ? "展开案例目录" : "收起案例目录");
  });
  mobileMenu?.addEventListener("click", () => {
    const open = document.body.classList.toggle("sidebar-open");
    mobileMenu.setAttribute("aria-expanded", String(open));
    syncSidebarA11y();
    if (open) caseSidebar?.querySelector(".view-switch a, .side-nav a")?.focus();
  });
  sidebarBackdrop?.addEventListener("click", () => closeMobileSidebar(true));
  document.querySelectorAll(".side-nav a").forEach((link) => link.addEventListener("click", () => closeMobileSidebar()));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileSidebar(true);
      return;
    }
    if (event.key !== "Tab" || !sidebarMedia.matches || !document.body.classList.contains("sidebar-open") || !caseSidebar) return;
    const focusable = [...caseSidebar.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])")]
      .filter((element) => !element.closest("[hidden]") && !element.inert);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  sidebarMedia.addEventListener?.("change", syncSidebarA11y);
  syncSidebarA11y();

  const updateScrollState = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    if (progressBar) progressBar.value = Math.round(Math.min(1, Math.max(0, progress)) * 1000);

    const sampleY = Math.min(window.innerHeight * 0.18, 150);
    const sampled = document.elementFromPoint(4, sampleY)?.closest("section");
    header?.classList.toggle("light", sampled?.classList.contains("ivory") || sampled?.classList.contains("field") || sampled?.classList.contains("analysis"));

    let activeId = "";
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= window.innerHeight * 0.42) activeId = section.id;
    }
    navLinks.forEach((link) => {
      const active = link.getAttribute("href") === `#${activeId}`;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });
  window.addEventListener("resize", updateScrollState, { passive: true });

  const revealElements = [...document.querySelectorAll(".reveal")];
  if (supportsIO) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -7%" });
    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add("is-visible"));
  }

  const animateCount = (el) => {
    const target = Number(el.dataset.target || 0);
    if (reduceMotion || !supportsIO) {
      el.textContent = String(target);
      return;
    }
    const start = performance.now();
    const duration = 1100;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const countElements = [...document.querySelectorAll(".count")];
  if (supportsIO) {
    const countObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.8 });
    countElements.forEach((el) => countObserver.observe(el));
  } else {
    countElements.forEach(animateCount);
  }

  const heroCanvas = document.querySelector("#heroCanvas");
  if (heroCanvas) {
    const context = heroCanvas.getContext("2d");
    const coverPage = document.querySelector(".cover-page");
    const coverProgress = document.querySelector(".cover-progress progress");
    let width = 0;
    let height = 0;
    let frame = 0;
    let canvasVisible = true;
    let currentStage = "";
    const nodeCount = 34;
    const nodes = Array.from({ length: nodeCount }, (_, index) => ({
      x: ((index * 47) % 97) / 100,
      y: ((index * 71 + 13) % 89) / 100,
      phase: index * 0.71,
      radius: 1.1 + (index % 4) * 0.45,
      route: index % 4,
      routePosition: 0.05 + ((Math.floor(index / 4) * 0.113 + (index % 4) * 0.047) % 0.9)
    }));
    const routes = [
      [[0.04, 0.82], [0.33, 0.62], [0.58, 0.48], [0.92, 0.2]],
      [[0.08, 0.22], [0.37, 0.35], [0.63, 0.53], [0.96, 0.72]],
      [[0.2, 0.95], [0.42, 0.7], [0.7, 0.66], [0.88, 0.38]],
      [[0.13, 0.5], [0.4, 0.47], [0.68, 0.31], [0.95, 0.32]]
    ];

    const resizeCanvas = () => {
      const rect = heroCanvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      heroCanvas.width = Math.round(width * dpr);
      heroCanvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const clamp = (value) => Math.min(1, Math.max(0, value));
    const smooth = (value) => {
      const normalized = clamp(value);
      return normalized * normalized * (3 - 2 * normalized);
    };
    const mix = (start, end, amount) => start + (end - start) * amount;

    const pointOnRoute = (route, position) => {
      const scaled = Math.min(0.999, Math.max(0, position)) * (route.length - 1);
      const index = Math.floor(scaled);
      const local = scaled - index;
      const start = route[index];
      const end = route[index + 1];
      return [
        (start[0] + (end[0] - start[0]) * local) * width,
        (start[1] + (end[1] - start[1]) * local) * height
      ];
    };

    const getPhase = (time) => {
      if (reduceMotion) return { cycle: 0.66, stage: "intelligentization", convergence: 1, network: 1 };
      const cycle = (time % 16000) / 16000;
      if (cycle < 0.22) return { cycle, stage: "fragmentation", convergence: 0, network: 0 };
      if (cycle < 0.48) return { cycle, stage: "platformization", convergence: smooth((cycle - 0.22) / 0.26), network: 0 };
      if (cycle < 0.84) return { cycle, stage: "intelligentization", convergence: 1, network: smooth((cycle - 0.48) / 0.16) };
      const release = smooth((cycle - 0.84) / 0.16);
      return { cycle, stage: "fragmentation", convergence: 1 - release, network: 1 - release };
    };

    const setStage = (stage, cycle) => {
      if (stage !== currentStage) {
        currentStage = stage;
        coverPage?.setAttribute("data-cover-stage", stage);
      }
      if (coverProgress) coverProgress.value = Math.round(cycle * 1000);
    };

    const drawCanvas = (time = 0) => {
      const phase = getPhase(time);
      setStage(phase.stage, phase.cycle);
      context.clearRect(0, 0, width, height);

      const hubX = width * 0.63;
      const hubY = height * 0.49;
      if (phase.convergence > 0.12) {
        const ringAlpha = 0.08 + phase.network * 0.18;
        const ringRadius = 25 + phase.network * 22;
        context.save();
        context.translate(hubX, hubY);
        context.rotate(time * 0.000035);
        context.setLineDash([4, 8]);
        context.strokeStyle = `rgba(143,215,255,${ringAlpha})`;
        context.lineWidth = 1;
        context.beginPath();
        context.arc(0, 0, ringRadius, 0, Math.PI * 2);
        context.stroke();
        context.setLineDash([]);
        context.strokeStyle = `rgba(242,140,69,${0.1 + phase.network * 0.24})`;
        context.beginPath();
        context.arc(0, 0, Math.max(8, ringRadius - 13), 0, Math.PI * 2);
        context.stroke();
        context.restore();
      }

      context.lineWidth = 0.85;
      routes.forEach((route, routeIndex) => {
        context.beginPath();
        route.forEach((point, index) => {
          const x = point[0] * width;
          const y = point[1] * height;
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        const routeAlpha = 0.07 + phase.convergence * 0.12 + phase.network * 0.12;
        context.strokeStyle = routeIndex % 2 ? `rgba(143,215,255,${routeAlpha})` : `rgba(242,140,69,${routeAlpha})`;
        context.stroke();
        const position = reduceMotion ? 0.62 : ((time * 0.000055 + routeIndex * 0.23) % 1);
        const [pulseX, pulseY] = pointOnRoute(route, position);
        const pulseRadius = 12 + phase.network * 9;
        const glow = context.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, pulseRadius);
        glow.addColorStop(0, routeIndex % 2 ? "rgba(143,215,255,.95)" : "rgba(255,177,110,.95)");
        glow.addColorStop(1, "rgba(255,255,255,0)");
        context.globalAlpha = 0.32 + phase.convergence * 0.34;
        context.fillStyle = glow;
        context.beginPath();
        context.arc(pulseX, pulseY, pulseRadius, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = 1;
      });

      const positions = nodes.map((node) => {
        const [targetX, targetY] = pointOnRoute(routes[node.route], node.routePosition);
        const drift = reduceMotion ? 0 : Math.sin(time * 0.00035 + node.phase) * (7 - phase.convergence * 5);
        return {
          x: mix(node.x * width + drift, targetX, phase.convergence),
          y: mix(node.y * height + Math.cos(time * 0.00028 + node.phase) * 5, targetY, phase.convergence)
        };
      });

      nodes.forEach((node, index) => {
        const { x, y } = positions[index];
        const nextIndex = index + 4;
        if (nextIndex < positions.length) {
          const next = positions[nextIndex];
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(next.x, next.y);
          context.strokeStyle = `rgba(143,215,255,${0.025 + phase.network * 0.18})`;
          context.stroke();
        }
        if (phase.network > 0.05 && index % 6 === 0) {
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(hubX, hubY);
          context.strokeStyle = `rgba(242,140,69,${phase.network * 0.14})`;
          context.stroke();
        }
        context.fillStyle = index % 6 === 0 ? "rgba(255,177,110,.82)" : "rgba(143,215,255,.54)";
        context.beginPath();
        context.arc(x, y, node.radius + phase.network * 0.35, 0, Math.PI * 2);
        context.fill();
      });

      if (phase.network > 0.05) {
        const glow = context.createRadialGradient(hubX, hubY, 0, hubX, hubY, 34);
        glow.addColorStop(0, `rgba(255,177,110,${0.5 * phase.network})`);
        glow.addColorStop(1, "rgba(255,177,110,0)");
        context.fillStyle = glow;
        context.beginPath();
        context.arc(hubX, hubY, 34, 0, Math.PI * 2);
        context.fill();
      }

      frame = !reduceMotion && canvasVisible && !document.hidden ? requestAnimationFrame(drawCanvas) : 0;
    };

    resizeCanvas();
    drawCanvas();
    window.addEventListener("resize", () => {
      resizeCanvas();
      if (reduceMotion) drawCanvas();
    }, { passive: true });
    if (supportsIO) {
      const canvasObserver = new IntersectionObserver(([entry]) => {
        canvasVisible = entry.isIntersecting;
        if (!canvasVisible && frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        } else if (canvasVisible && !reduceMotion && !document.hidden && !frame) {
          frame = requestAnimationFrame(drawCanvas);
        }
      }, { threshold: 0.01 });
      canvasObserver.observe(heroCanvas);
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else if (!document.hidden && canvasVisible && !reduceMotion && !frame) {
        frame = requestAnimationFrame(drawCanvas);
      }
    });
  }

  const networkStage = document.querySelector(".fragment-stage");
  const networkToggle = document.querySelector("#networkToggle");
  const networkLabel = document.querySelector("#networkLabel");
  const networkNote = document.querySelector("#networkNote span");
  const nodeDetails = {
    station: "旅客面对的是一座连续运行的车站，管理者面对的却是多个责任界面。",
    yuhuatai: "南站综管办在业务上受雨花台区政府领导，跨区统筹能力因此受到限制。",
    jiangning: "江宁区有独立属地责任、管理细则与考核标准，与雨花台区并行。",
    railway: "铁路运输、站区管理与实时运行数据处在垂直管理体系内。",
    metro: "地铁运营与站区设施由自身专业体系负责，形成另一套管理边界。",
    police: "公共道路指挥和行政处罚必须由具有法定职权的部门作出。",
    urban: "城管、住建等部门按专业管辖权履职，条线规则和考核体系相对独立。",
    asset: "地面、地下、停车场和商业设施分属不同产权主体，运营权需要逐项取得。",
    vendors: "分散外包带来专业服务，也增加合同、标准和问责接口。",
    platform: "交控万物把可市场化的运营服务纳入相对统一的责任界面。"
  };

  networkToggle?.addEventListener("click", () => {
    const after = networkStage.dataset.network !== "after";
    networkStage.dataset.network = after ? "after" : "before";
    networkToggle.setAttribute("aria-pressed", String(after));
    networkToggle.querySelector("span").textContent = after ? "切回碎片化" : "切换到平台化";
    networkLabel.textContent = after ? "平台化后的运营网络" : "碎片化治理网络";
    networkNote.textContent = after
      ? "多个行政主体仍然存在，但可市场化的运营事项开始通过单一平台承接。"
      : "选择节点，查看它在南站治理中的位置。";
  });

  document.querySelectorAll(".node").forEach((node) => {
    const showNote = () => { networkNote.textContent = nodeDetails[node.dataset.detail] || ""; };
    node.addEventListener("mouseenter", showNote);
    node.addEventListener("focus", showNote);
    node.addEventListener("click", showNote);
  });

  const taskItems = [...document.querySelectorAll(".task-loop li")];
  const taskButtons = [...document.querySelectorAll("[data-task-button]")];
  const taskConsole = document.querySelector("#taskConsole");
  const taskConsoleCard = taskConsole?.querySelector(".task-console-card");
  const taskConsoleFields = {
    step: document.querySelector("#taskConsoleStep"),
    state: document.querySelector("#taskConsoleState"),
    title: document.querySelector("#taskConsoleTitle"),
    source: document.querySelector("#taskConsoleSource"),
    rule: document.querySelector("#taskConsoleRule"),
    owner: document.querySelector("#taskConsoleOwner"),
    proof: document.querySelector("#taskConsoleProof")
  };
  const taskStates = ["线索进入", "标准转译", "任务分流", "现场校验", "结果回流"];
  let taskConsoleTimer = 0;
  let taskManualSelection = false;
  const activateTask = (button) => {
    if (!button) return;
    const stage = Math.max(1, Number(button.dataset.taskStage || 1));
    taskItems.forEach((item) => item.classList.toggle("active", item.contains(button)));
    taskButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    if (!taskConsole) return;
    taskConsole.dataset.taskStage = String(stage);
    if (taskConsoleFields.step) taskConsoleFields.step.textContent = `STEP ${String(stage).padStart(2, "0")}`;
    if (taskConsoleFields.state) taskConsoleFields.state.textContent = taskStates[stage - 1] || "任务处理";
    if (taskConsoleFields.title) taskConsoleFields.title.textContent = button.dataset.ticketTitle || "";
    if (taskConsoleFields.source) taskConsoleFields.source.textContent = button.dataset.ticketSource || "";
    if (taskConsoleFields.rule) taskConsoleFields.rule.textContent = button.dataset.ticketRule || "";
    if (taskConsoleFields.owner) taskConsoleFields.owner.textContent = button.dataset.ticketOwner || "";
    if (taskConsoleFields.proof) taskConsoleFields.proof.textContent = button.dataset.ticketProof || "";
    taskConsole.querySelectorAll(".task-console-route i").forEach((dot, index) => dot.classList.toggle("is-complete", index < stage));
    if (!reduceMotion && taskConsoleCard) {
      taskConsoleCard.classList.remove("is-updating");
      requestAnimationFrame(() => taskConsoleCard.classList.add("is-updating"));
      window.clearTimeout(taskConsoleTimer);
      taskConsoleTimer = window.setTimeout(() => taskConsoleCard.classList.remove("is-updating"), 380);
    }
  };
  taskButtons.forEach((button) => button.addEventListener("click", () => {
    taskManualSelection = true;
    activateTask(button);
  }));
  if (taskButtons.length) activateTask(taskButtons[0]);
  if (supportsIO) {
    const taskObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible && !taskManualSelection) activateTask(visible.target.querySelector("[data-task-button]"));
    }, { threshold: [0.35, 0.65, 0.9], rootMargin: "-15% 0px -35%" });
    taskItems.forEach((item) => taskObserver.observe(item));
  }

  const chronicleStage = document.querySelector(".chronicle-stage");
  const chronicleButtons = [...document.querySelectorAll(".chronicle-list button")];
  const chronicleYear = document.querySelector("#chronicleYear");
  const chroniclePhase = document.querySelector("#chroniclePhase");
  const chronicleFinding = document.querySelector("#chronicleFinding");
  const chronicleCounter = document.querySelector("#chronicleCounter");
  let chronicleTimer = 0;
  const activateChronicle = (button) => {
    if (!button || !chronicleStage) return;
    const index = chronicleButtons.indexOf(button);
    chronicleButtons.forEach((item) => {
      const active = item === button;
      item.setAttribute("aria-pressed", String(active));
      item.closest("li")?.classList.toggle("is-active", active);
    });
    chronicleYear.textContent = button.dataset.year || "";
    chroniclePhase.textContent = button.dataset.phase || "";
    chronicleFinding.textContent = button.dataset.finding || "";
    chronicleCounter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(chronicleButtons.length).padStart(2, "0")}`;
    chronicleStage.dataset.step = String(index + 1);
    if (!reduceMotion) {
      chronicleStage.classList.remove("is-updating");
      requestAnimationFrame(() => chronicleStage.classList.add("is-updating"));
      window.clearTimeout(chronicleTimer);
      chronicleTimer = window.setTimeout(() => chronicleStage.classList.remove("is-updating"), 460);
    }
  };
  chronicleButtons.forEach((button) => button.addEventListener("click", () => activateChronicle(button)));
  if (chronicleButtons.length && !reduceMotion && supportsIO) {
    const chronicleObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) activateChronicle(visible.target);
    }, { threshold: [0.45, 0.7], rootMargin: "-20% 0px -34%" });
    chronicleButtons.forEach((button) => chronicleObserver.observe(button));
  }

  const mechanismExplorer = document.querySelector(".mechanism-explorer");
  const mechanismTabs = [...document.querySelectorAll("[data-mechanism-tab]")];
  const mechanismPanels = [...document.querySelectorAll("[data-mechanism-panel]")];
  const activateMechanism = (tab, moveFocus = false) => {
    if (!tab || !mechanismExplorer) return;
    const key = tab.dataset.mechanismTab;
    mechanismExplorer.dataset.mechanism = key;
    mechanismTabs.forEach((item) => {
      const active = item === tab;
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
    });
    mechanismPanels.forEach((panel) => { panel.hidden = panel.dataset.mechanismPanel !== key; });
    if (moveFocus) tab.focus();
  };
  mechanismTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateMechanism(tab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + mechanismTabs.length) % mechanismTabs.length;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % mechanismTabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = mechanismTabs.length - 1;
      activateMechanism(mechanismTabs[nextIndex], true);
    });
  });

  const frameworkBuild = document.querySelector("#frameworkBuild");
  const frameworkReplay = document.querySelector("#frameworkReplay");
  const frameworkCounter = document.querySelector("#frameworkCounter");
  const frameworkStatus = document.querySelector("#frameworkStatus");
  const frameworkTargets = [...document.querySelectorAll("[data-framework-target]")];
  const frameworkItems = [...document.querySelectorAll("#frameworkBuild [data-build-stage]")];
  const frameworkStatuses = [
    "准备展开：先识别任务环境与权责结构之间的错位。",
    "第一步：连续服务遇上分散权责，形成多边协作环境。",
    "第二步：P1 从描述难度、主体依赖和绩效验证解释交易成本的来源。",
    "第三步：P2 表明传统协调和分散外包没有改变多边交易结构。",
    "第四步：P3 解释平台化如何统一交易界面、降低外部交易成本。",
    "第五步：P4 解释智能化如何重组信息与任务、降低内部组织成本。",
    "第六步：结构与能力共同支撑执行层一体化，P5 与制度环境划定有效范围。"
  ];
  let frameworkTimers = [];
  let frameworkPlayed = false;
  const clearFrameworkTimers = () => {
    frameworkTimers.forEach((timer) => window.clearTimeout(timer));
    frameworkTimers = [];
  };
  const setFrameworkStep = (step) => {
    if (!frameworkBuild) return;
    const nextStep = Math.min(6, Math.max(0, Number(step) || 0));
    frameworkBuild.dataset.frameworkStep = String(nextStep);
    frameworkItems.forEach((item) => {
      const itemStage = Number(item.dataset.buildStage || 0);
      item.classList.toggle("is-built", itemStage <= nextStep);
      item.classList.toggle("is-current", itemStage === nextStep);
    });
    frameworkTargets.forEach((button) => {
      const active = Number(button.dataset.frameworkTarget) === nextStep;
      if (button.closest(".framework-sequence")) {
        if (active) button.setAttribute("aria-current", "step");
        else button.removeAttribute("aria-current");
      }
      if (button.classList.contains("framework-proposition")) button.setAttribute("aria-pressed", String(active));
    });
    if (frameworkCounter) frameworkCounter.value = `${String(nextStep).padStart(2, "0")} / 06`;
    if (frameworkStatus) frameworkStatus.textContent = frameworkStatuses[nextStep];
  };
  const playFramework = () => {
    if (!frameworkBuild) return;
    clearFrameworkTimers();
    frameworkPlayed = true;
    if (reduceMotion) {
      setFrameworkStep(6);
      return;
    }
    setFrameworkStep(0);
    for (let step = 1; step <= 6; step += 1) {
      frameworkTimers.push(window.setTimeout(() => {
        setFrameworkStep(step);
        if (step === 6 && frameworkReplay) frameworkReplay.querySelector("span").textContent = "重新播放框架";
      }, 240 + (step - 1) * 1050));
    }
  };
  frameworkTargets.forEach((button) => button.addEventListener("click", () => {
    frameworkPlayed = true;
    clearFrameworkTimers();
    setFrameworkStep(Number(button.dataset.frameworkTarget));
  }));
  frameworkReplay?.addEventListener("click", playFramework);
  if (frameworkBuild) {
    if (reduceMotion || !supportsIO) {
      setFrameworkStep(6);
    } else {
      setFrameworkStep(0);
      const frameworkObserver = new IntersectionObserver(([entry], observer) => {
        if (!entry.isIntersecting || frameworkPlayed) return;
        playFramework();
        observer.unobserve(entry.target);
      }, { threshold: 0.28 });
      frameworkObserver.observe(frameworkBuild);
    }
  }

  const setupDialog = (dialog, openButton) => {
    if (!dialog || !openButton) return;
    const closeButton = dialog.querySelector(".dialog-close");
    openButton.addEventListener("click", () => dialog.showModal());
    closeButton?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.querySelectorAll("[data-close-dialog]").forEach((link) => link.addEventListener("click", () => dialog.close()));
  };

  setupDialog(document.querySelector("#overviewDialog"), document.querySelector("#overviewButton"));
  setupDialog(document.querySelector("#evidenceDialog"), document.querySelector("#openEvidence"));

  const caseFilm = document.querySelector("#caseFilm");
  const filmFrame = document.querySelector("#filmFrame");
  const filmPlay = document.querySelector("#filmPlay");
  const filmError = document.querySelector("#filmError");
  const filmDownload = document.querySelector("#filmDownload");
  const voiceButtons = Array.from(document.querySelectorAll("[data-film-voice]"));
  if (caseFilm && filmFrame && filmPlay) {
    filmPlay.addEventListener("click", async () => {
      try {
        await caseFilm.play();
      } catch (_error) {
        filmError?.removeAttribute("hidden");
      }
    });
    caseFilm.addEventListener("play", () => filmFrame.classList.add("is-playing"));
    caseFilm.addEventListener("ended", () => {
      filmFrame.classList.remove("is-playing");
      filmPlay.querySelector("span").textContent = "重新播放";
      filmPlay.setAttribute("aria-label", "重新播放南京南站案例视频");
    });
    caseFilm.addEventListener("error", () => filmError?.removeAttribute("hidden"));

    const voiceFiles = {
      female: {
        src: caseFilm.dataset.femaleSrc,
        label: "女声版旁白",
        href: "./assets/films/nanjing-south-competition-female.mp4?v=20260907-5",
        download: "南京南站正式参赛案例片_女声版_含BGM.mp4"
      },
      male: {
        src: caseFilm.dataset.maleSrc,
        label: "男声版旁白",
        href: "./assets/films/nanjing-south-competition-male.mp4?v=20260907-5",
        download: "南京南站正式参赛案例片_男声版_含BGM.mp4"
      }
    };

    voiceButtons.forEach((button) => button.addEventListener("click", () => {
      const voice = button.dataset.filmVoice;
      const next = voiceFiles[voice];
      if (!next || button.classList.contains("is-active")) return;
      const resumeAt = Number.isFinite(caseFilm.currentTime) ? caseFilm.currentTime : 0;
      const shouldResume = !caseFilm.paused;
      voiceButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      caseFilm.pause();
      caseFilm.src = next.src;
      caseFilm.setAttribute("aria-label", `南京南站正式参赛案例片，当前为${next.label}`);
      if (filmDownload) {
        filmDownload.href = next.href;
        filmDownload.download = next.download;
      }
      caseFilm.addEventListener("loadedmetadata", async () => {
        caseFilm.currentTime = Math.min(resumeAt, Math.max(0, caseFilm.duration - 0.25));
        if (shouldResume) {
          try { await caseFilm.play(); } catch (_error) { filmError?.removeAttribute("hidden"); }
        }
      }, {once: true});
      caseFilm.load();
    }));
  }
})();
