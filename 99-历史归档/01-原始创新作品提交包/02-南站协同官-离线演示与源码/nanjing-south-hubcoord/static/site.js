(function(){
  "use strict";

  const toggle=document.querySelector(".nav-toggle");
  const nav=document.querySelector(".site-nav");
  if(toggle&&nav){
    toggle.addEventListener("click",()=>{
      const open=toggle.getAttribute("aria-expanded")==="true";
      toggle.setAttribute("aria-expanded",String(!open));
      nav.classList.toggle("is-open",!open);
    });
    nav.addEventListener("click",event=>{
      if(event.target.closest("a")){toggle.setAttribute("aria-expanded","false");nav.classList.remove("is-open")}
    });
  }

  const reveals=[...document.querySelectorAll(".reveal")];
  if("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add("in");observer.unobserve(entry.target)}
    }),{threshold:.08,rootMargin:"0px 0px -30px"});
    reveals.forEach(node=>observer.observe(node));
  }else{reveals.forEach(node=>node.classList.add("in"))}

  const routeDetails=[
    {title:"模拟晚点信息能否直接触发协同？",text:"不能。它只能先作为待确认线索，需有关主体核实。",ref:"EV-SC01-01 · simulated assumption"},
    {title:"运营方在站内可以先做什么？",text:"可以观察并补充服务范围内的现场情况，但不因此获得其他主体的决定权。",ref:"AR-SC01-01 · within_service_scope"},
    {title:"排队延长是否足以判定外围道路受影响？",text:"不足。停车区域的线索仍需人工核对，停车场权属与管理权限在稿件中也尚有冲突。",ref:"EVID-004 · open research check"},
    {title:"当压力跨过场内外红线，系统如何处理？",text:"识别为跨主体事项，可起草协同请求，但不可直接指令外围道路处置。",ref:"AR-SC01-02 / AR-SC01-03"},
    {title:"一张协同请求需要说清哪些内容？",text:"请求的动作、适用证据、权责理由、仍缺的信息以及必须确认的角色。",ref:"SC-01 · request_cross_party_confirmation"},
    {title:"谁决定这个事项是否成立？",text:"规定角色分别说明理由并确认。跨主体请求需现场主管与综管办值守人员确认；涉及执法的事项只能拒绝或升级。",ref:"AR-SC01-02 · human gate"}
  ];
  const route=document.querySelector("[data-route]");
  if(route){
    const detail=route.querySelector(".route-detail");
    const nodes=[...route.querySelectorAll("[data-route-node]")];
    const showRoute=index=>{
      const item=routeDetails[index];
      nodes.forEach((node,i)=>{node.classList.toggle("is-active",i===index);node.setAttribute("aria-pressed",String(i===index))});
      detail.innerHTML=`<small>当前节点·管理问题</small><h3>${item.title}</h3><p>${item.text}</p><code>${item.ref}</code>`;
    };
    nodes.forEach((node,index)=>node.addEventListener("click",()=>showRoute(index)));
  }

  const agentData=[
    {code:"AGENT 01 / EVENT MERGE",title:"判断多条线索是否指向同一个事件",input:"时间、位置、来源和线索摘要",output:"统一的 event_id 与空间范围",check:"保留原始线索编号和核实状态"},
    {code:"AGENT 02 / EVIDENCE RETRIEVAL",title:"只取回与当前动作相关的已审阅证据",input:"事件类型、拟议动作与知识版本",output:"带 evidence_id 和材料位置的证据包",check:"待核实冲突和未授权材料不进入运行时"},
    {code:"AGENT 03 / AUTHORITY CHECK",title:"把角色、空间范围和动作匹配到固定权责规则",input:"发起角色、空间范围和 proposed_action",output:"可核验、需协同、受限或资料不足",check:"显示 rule_id、边界理由和必需人工角色"},
    {code:"AGENT 04 / ISSUE DRAFT",title:"将证据与规则组织成最小必要的协同请求",input:"已核对的证据、权责结果和人工闸门",output:"待确认的协同议题卡",check:"不将“需协调”改写成“可命令”"},
    {code:"AGENT 05 / SAFETY AUDIT",title:"在输出前拦截越权、无来源和缺少人工闸门的内容",input:"议题卡草稿、规则决定和证据引用",output:"放行、拒绝或转人工复核",check:"执法、未授权数据和资料不足均不自动通过"}
  ];
  const tabRoot=document.querySelector("[data-tabs]");
  if(tabRoot){
    const tabs=[...tabRoot.querySelectorAll("[data-agent-tab]")];
    const panel=tabRoot.querySelector("[role='tabpanel']");
    const showAgent=index=>{
      const item=agentData[index];
      tabs.forEach((tab,i)=>{tab.setAttribute("aria-selected",String(i===index));tab.tabIndex=i===index?0:-1});
      panel.setAttribute("aria-labelledby",tabs[index].id);
      panel.innerHTML=`<header><small>${item.code}</small><h3>${item.title}</h3></header><div><article><small>输入</small><p>${item.input}</p></article><article><small>输出</small><p>${item.output}</p></article><article><small>怎样检查</small><p>${item.check}</p></article></div>`;
    };
    tabs.forEach((tab,index)=>{
      tab.addEventListener("click",()=>showAgent(index));
      tab.addEventListener("keydown",event=>{
        if(!["ArrowDown","ArrowRight","ArrowUp","ArrowLeft"].includes(event.key))return;
        event.preventDefault();
        const delta=["ArrowDown","ArrowRight"].includes(event.key)?1:-1;
        const next=(index+delta+tabs.length)%tabs.length;showAgent(next);tabs[next].focus();
      });
    });
  }

  const data=window.HUBCOORD_OFFLINE_DATA;
  const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":["&gt;"],"\"":"&quot;","'":"&#39;"}[char]));
  if(data){
    const evidence=data.knowledge?.evidence_cards||[];
    const rules=data.authority?.rules||[];
    const reviewIssues=data.review?.issues||[];
    const setText=(id,value)=>{const node=document.getElementById(id);if(node)node.textContent=value};
    setText("evidenceCount",evidence.length);setText("ruleCount",rules.length);setText("reviewCount",reviewIssues.length);
    const library=document.getElementById("evidenceLibrary");
    if(library){
      library.innerHTML=evidence.map(card=>{
        const type=card.data_status==="simulated"?"教学模拟":"团队稿件";
        return `<article class="evidence-card" data-evidence-type="${escapeHTML(card.data_status)}"><header><span>${escapeHTML(card.evidence_id)}</span><span>${type}</span></header><blockquote>${escapeHTML(card.excerpt)}</blockquote><footer>${escapeHTML(card.provenance?.source_title)}<br>${escapeHTML(card.provenance?.locator)} · ${escapeHTML(card.knowledge_version)}</footer></article>`;
      }).join("");
      const filters=[...document.querySelectorAll("[data-evidence-filter]")];
      filters.forEach(button=>button.addEventListener("click",()=>{
        const filter=button.dataset.evidenceFilter;
        filters.forEach(item=>{const current=item===button;item.classList.toggle("is-active",current);item.setAttribute("aria-pressed",String(current))});
        library.querySelectorAll(".evidence-card").forEach(card=>{card.hidden=filter!=="all"&&card.dataset.evidenceType!==filter});
      }));
    }
    const review=document.getElementById("reviewLibrary");
    if(review){
      review.innerHTML=reviewIssues.map(issue=>`<article class="review-card"><span>OPEN CHECK</span><div><small>${escapeHTML(issue.issue_id)} · 高风险</small><h3>${escapeHTML(issue.title)}</h3><dl><dt>说法 A</dt><dd>${escapeHTML(issue.claim_a)}</dd><dt>说法 B</dt><dd>${escapeHTML(issue.claim_b)}</dd></dl><p class="action"><b>当前处理：</b>${escapeHTML(issue.required_action)}</p></div></article>`).join("");
    }
    const ruleLibrary=document.getElementById("ruleLibrary");
    if(ruleLibrary){
      const labels={within_service_scope:"服务范围内·可核验",coordination_required:"跨主体·需协同",restricted:"行政权限·不可越权"};
      const actionLabels={verify_evidence:"核验现场线索",request_cross_party_confirmation:"提出跨主体协同确认",direct_enforcement:"直接行政处置"};
      const roleLabels={operator_supervisor:"交控万物现场主管",management_office_duty:"综管办值守人员",hub_liaison:"铁路／枢纽联络人"};
      ruleLibrary.innerHTML=rules.map(rule=>`<article class="rule-card"><header><span>${escapeHTML(rule.rule_id)}</span><span>${escapeHTML(rule.rule_version)}</span></header><span class="decision ${rule.decision==='restricted'?'restricted':''}">${escapeHTML(labels[rule.decision]||rule.decision)}</span><h3>${escapeHTML(actionLabels[rule.proposed_action]||rule.proposed_action)}</h3><p>${escapeHTML(rule.boundary_reason)}</p><footer>必需人工角色：${escapeHTML(rule.required_human_roles.map(role=>roleLabels[role]||role).join(" + "))}</footer></article>`).join("");
    }
  }
})();
