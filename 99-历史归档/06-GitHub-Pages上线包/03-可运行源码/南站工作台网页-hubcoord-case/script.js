(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const progressBar = document.querySelector("#progressBar");
  const header = document.querySelector(".site-header");
  const navLinks = [...document.querySelectorAll(".site-header nav a[href^='#']")];
  const sections = [...document.querySelectorAll("main section[id]")];

  const updateScrollState = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    if (progressBar) progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;

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

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -7%" });
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  const countObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.target || 0);
      if (reduceMotion) {
        el.textContent = String(target);
      } else {
        const start = performance.now();
        const duration = 1100;
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 4);
          el.textContent = String(Math.round(target * eased));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
      observer.unobserve(el);
    });
  }, { threshold: 0.8 });
  document.querySelectorAll(".count").forEach((el) => countObserver.observe(el));

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
      : "把鼠标移到节点，查看它在南站治理中的位置。";
  });

  document.querySelectorAll(".node").forEach((node) => {
    const showNote = () => { networkNote.textContent = nodeDetails[node.dataset.detail] || ""; };
    node.addEventListener("mouseenter", showNote);
    node.addEventListener("focus", showNote);
    node.addEventListener("click", showNote);
  });

  const taskItems = [...document.querySelectorAll(".task-loop li")];
  const taskObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    taskItems.forEach((item) => item.classList.toggle("active", item === visible.target));
  }, { threshold: [0.35, 0.65, 0.9], rootMargin: "-15% 0px -35%" });
  taskItems.forEach((item) => taskObserver.observe(item));

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
})();
