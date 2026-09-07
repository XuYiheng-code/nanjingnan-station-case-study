const fs = require('fs');

const base = '/Users/xuyiheng/Desktop/智能时代的公共管理：南京那站的案例研究/交付稿';
const v1Path = `${base}/版本一.fragment.html`;
const v2Path = `${base}/版本二.fragment.html`;
const outPath = `${base}/文献综述两个版本_完整优化稿.html`;

function prefixAnchors(html, prefix) {
  return html
    .replace(/\bid="([^"]+)"/g, (_, id) => `id="${prefix}-${id}"`)
    .replace(/\bhref="#([^"]+)"/g, (_, id) => `href="#${prefix}-${id}"`)
    .replace(/↩︎?/g, '返回');
}

const versionA = prefixAnchors(fs.readFileSync(v1Path, 'utf8'), 'a');
const versionB = prefixAnchors(fs.readFileSync(v2Path, 'utf8'), 'b');

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="《人工智能技术塑造公共治理场景的过程与机制》文献综述双版本完整优化稿">
<title>文献综述双版本完整优化稿</title>
<style>
  :root{
    --paper:#f2ede2;
    --surface:#fbf8f1;
    --ink:#1c1815;
    --ink-soft:#5a5147;
    --rule:#d6cbb8;
    --accent:#a94022;
    --accent-deep:#7d2f1a;
    --green:#315e54;
    --shadow:0 1px 0 rgba(28,24,21,.05),0 24px 60px -42px rgba(28,24,21,.55);
    --font-display:"Songti SC","STSong","Noto Serif SC","Source Han Serif SC",Georgia,serif;
    --font-body:-apple-system,BlinkMacSystemFont,"PingFang SC","HarmonyOS Sans SC","Microsoft YaHei","Noto Sans SC","Source Han Sans SC",sans-serif;
    --font-mono:"SF Mono",Menlo,Consolas,monospace;
    --s1:.5rem;
    --s2:1rem;
    --s3:1.5rem;
    --s4:2.5rem;
    --s5:4rem;
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth;line-break:strict}
  body{
    margin:0;
    color:var(--ink);
    background:
      linear-gradient(rgba(169,64,34,.025) 1px,transparent 1px),
      linear-gradient(90deg,rgba(169,64,34,.018) 1px,transparent 1px),
      var(--paper);
    background-size:32px 32px;
    font-family:var(--font-body);
    font-size:clamp(16px,.35vw + 15px,18px);
    line-height:1.78;
  }
  a{color:var(--accent-deep);text-underline-offset:.18em}
  button{font:inherit}
  button:focus-visible,a:focus-visible{outline:3px solid rgba(169,64,34,.35);outline-offset:3px}
  .progress{position:fixed;inset:0 auto auto 0;height:3px;width:0;background:var(--accent);z-index:50}
  .masthead{max-width:1280px;margin:0 auto;padding:clamp(2.5rem,7vw,6.5rem) clamp(1.25rem,5vw,4.5rem) var(--s4)}
  .kicker{display:flex;gap:.8rem;align-items:center;color:var(--accent-deep);font-size:.78rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase}
  .kicker::before{content:"";width:3.2rem;height:3px;background:var(--ink)}
  .masthead h1{max-width:15ch;margin:1.1rem 0 .9rem;font-family:var(--font-display);font-size:clamp(2.5rem,7vw,5.6rem);font-weight:800;line-height:1.04;letter-spacing:-.045em}
  .deck{max-width:38em;margin:0;color:var(--ink-soft);font-size:clamp(1rem,1vw + .75rem,1.3rem)}
  .decision{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;max-width:900px;margin-top:var(--s4);background:var(--rule);border:1px solid var(--rule);box-shadow:var(--shadow)}
  .decision section{background:var(--surface);padding:1.25rem 1.4rem}
  .decision h2{margin:0 0 .35rem;font-family:var(--font-display);font-size:1.08rem}
  .decision p{margin:0;color:var(--ink-soft);font-size:.92rem;line-height:1.65}
  .decision .recommended{border-top:4px solid var(--accent)}
  .toolbar-wrap{position:sticky;top:0;z-index:30;border-block:1px solid var(--rule);background:rgba(242,237,226,.94);backdrop-filter:blur(12px)}
  .toolbar{max-width:1280px;margin:0 auto;padding:.7rem clamp(1rem,5vw,4.5rem);display:flex;gap:.65rem;align-items:center;justify-content:space-between}
  .switcher,.actions{display:flex;gap:.4rem;align-items:center;flex-wrap:wrap}
  .switcher button,.actions button{border:1px solid var(--rule);background:var(--surface);color:var(--ink);padding:.55rem .82rem;cursor:pointer;transition:transform .2s,background-color .2s,color .2s,border-color .2s}
  .switcher button:hover,.actions button:hover{transform:translateY(-1px);border-color:var(--accent)}
  .switcher button[aria-selected="true"]{background:var(--ink);color:var(--surface);border-color:var(--ink)}
  .actions button{background:transparent;font-size:.86rem}
  .layout{display:grid;grid-template-columns:minmax(0,1fr) 17rem;gap:clamp(2rem,5vw,5rem);max-width:1280px;margin:0 auto;padding:var(--s4) clamp(1rem,5vw,4.5rem) var(--s5)}
  main{min-width:0}
  .version-panel{background:var(--surface);border:1px solid var(--rule);box-shadow:var(--shadow);padding:clamp(1.3rem,4vw,4rem);margin-bottom:var(--s4)}
  body[data-mode="a"] #version-b,body[data-mode="b"] #version-a{display:none}
  body[data-mode="all"] .version-panel{display:block}
  .version-ribbon{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin:-.1rem 0 2.2rem;padding-bottom:1rem;border-bottom:3px solid var(--ink);font-size:.78rem;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-soft)}
  .version-ribbon strong{color:var(--accent-deep)}
  .prose h1,.prose h2,.prose h3,.prose h4{font-family:var(--font-display);color:var(--ink);scroll-margin-top:6rem}
  .prose h1{margin:0 0 .45rem;font-size:clamp(2rem,4.3vw,3.6rem);line-height:1.12;letter-spacing:-.035em}
  .prose h2{margin:3.8rem 0 1rem;padding-top:.65rem;border-top:1px solid var(--rule);font-size:clamp(1.45rem,2.3vw,2rem);line-height:1.3}
  .prose h3{margin:2.6rem 0 .8rem;font-size:clamp(1.2rem,1.5vw,1.5rem);line-height:1.4}
  .prose h4{margin:2rem 0 .6rem;font-size:1.05rem}
  .prose p,.prose li,.prose blockquote{max-width:40em}
  .prose p{margin:.15rem 0 1.15rem;color:var(--ink-soft);text-align:justify;text-justify:inter-ideograph}
  .prose strong{color:var(--ink);font-weight:650}
  .prose blockquote{margin:1.5rem 0;padding:.9rem 1.1rem;border-left:4px solid var(--accent);background:#f4ecdf;color:var(--ink-soft)}
  .prose blockquote p{margin:0;text-align:left}
  .prose ul,.prose ol{padding-left:1.35rem;color:var(--ink-soft)}
  .prose li{margin:.4rem 0}
  .prose table{display:table;width:100%;border-collapse:collapse;margin:1.4rem 0 2rem;font-size:.88rem;line-height:1.58}
  .prose th,.prose td{padding:.72rem .8rem;text-align:left;vertical-align:top;border:1px solid var(--rule)}
  .prose th{background:var(--ink);color:var(--surface);font-weight:600}
  .prose tr:nth-child(even) td{background:#f6f0e6}
  .prose sup{font-size:.7em;line-height:0}
  .prose .footnotes{margin-top:4rem;padding-top:1.2rem;border-top:3px double var(--rule);font-size:.82rem;line-height:1.65}
  .prose .footnotes::before{content:"注释与参考文献";display:block;margin-bottom:1rem;font-family:var(--font-display);font-size:1.35rem;font-weight:700;color:var(--ink)}
  .prose .footnotes p{max-width:none;text-align:left;margin:.2rem 0 .8rem}
  .prose code{font-family:var(--font-mono);font-size:.88em;background:#eee5d7;padding:.1em .3em}
  aside{position:relative}
  .toc{position:sticky;top:5rem;max-height:calc(100vh - 7rem);overflow:auto;padding-left:1.05rem;border-left:2px solid var(--rule)}
  .toc-title{margin:0 0 .7rem;font-family:var(--font-display);font-size:1.05rem}
  .toc a{display:block;padding:.3rem 0;color:var(--ink-soft);font-size:.78rem;line-height:1.45;text-decoration:none}
  .toc a[data-level="2"]{font-weight:650;color:var(--ink)}
  .toc a[data-level="3"]{padding-left:.75rem}
  .toc a[data-level="4"]{padding-left:1.35rem;color:var(--ink-soft)}
  .toc a:hover{color:var(--accent-deep)}
  .status{min-height:1.4em;color:var(--green);font-size:.78rem;text-align:right}
  .footer{max-width:1280px;margin:0 auto;padding:0 clamp(1rem,5vw,4.5rem) var(--s5);color:var(--ink-soft);font-size:.82rem}
  .footer::before{content:"";display:block;width:5rem;height:3px;margin-bottom:1rem;background:var(--accent)}
  @media (prefers-reduced-motion:no-preference){
    .masthead>*{opacity:0;transform:translateY(12px);animation:rise .58s forwards}
    .masthead>*:nth-child(2){animation-delay:.08s}.masthead>*:nth-child(3){animation-delay:.16s}.masthead>*:nth-child(4){animation-delay:.24s}
    @keyframes rise{to{opacity:1;transform:none}}
  }
  @media (max-width:1024px){.layout{grid-template-columns:minmax(0,1fr) 14rem}.prose p,.prose li,.prose blockquote{max-width:38em}}
  @media (max-width:768px){
    .decision{grid-template-columns:1fr}
    .toolbar{align-items:flex-start;gap:.7rem}.actions{justify-content:flex-end}
    .layout{grid-template-columns:1fr;padding-top:1.5rem}.layout aside{display:none}
    .version-panel{padding:1.25rem}.version-ribbon{align-items:flex-start;flex-direction:column}
    .prose table{display:block;overflow-x:auto;white-space:normal}
  }
  @media (max-width:480px){
    .masthead{padding-top:2rem}.masthead h1{font-size:2.45rem}.kicker{letter-spacing:.1em}
    .toolbar{display:block}.switcher{display:grid;grid-template-columns:repeat(3,1fr)}.switcher button{padding:.52rem .35rem;font-size:.8rem}
    .actions{margin-top:.55rem;justify-content:flex-start}.status{text-align:left}
    .prose p{text-align:left}.prose h2{margin-top:3rem}
  }
  @page{size:A4;margin:18mm 17mm 20mm}
  @media print{
    body{background:#fff;font-size:10.5pt;line-height:1.65}
    .progress,.toolbar-wrap,.layout aside,.actions,.footer{display:none!important}
    .masthead{max-width:none;padding:0 0 12mm}.masthead h1{font-size:28pt;max-width:none}.deck{font-size:12pt}.decision{box-shadow:none}
    .layout{display:block;max-width:none;padding:0}.version-panel{display:block!important;border:0;box-shadow:none;padding:0;margin:0 0 16mm}
    .version-panel+ .version-panel{break-before:page}.version-ribbon{margin-top:0}
    .prose h1{font-size:24pt}.prose h2{font-size:16pt;break-after:avoid}.prose h3{font-size:13pt;break-after:avoid}
    .prose p,.prose li,.prose blockquote{max-width:none}.prose table{font-size:8.5pt}.prose tr,.prose blockquote,.prose .footnotes li{break-inside:avoid}
    a{color:inherit;text-decoration:none}.prose a[href^="#"]::after{content:""}
  }
</style>
</head>
<body data-mode="b">
<div class="progress" id="progress" aria-hidden="true"></div>
<header class="masthead">
  <div class="kicker">Literature Review · Full Text</div>
  <h1>文献综述<br>双版本完整优化稿</h1>
  <p class="deck">《人工智能技术塑造公共治理场景的过程与机制》</p>
  <div class="decision" aria-label="版本选择说明">
    <section>
      <h2>版本一｜精炼修改</h2>
      <p>保留原有“两组解释—三项缺口”的总体骨架，改动较克制，适合在现稿基础上快速替换。</p>
    </section>
    <section class="recommended">
      <h2>版本二｜深度重写（推荐）</h2>
      <p>采用“四类解释—贡献与边界—场景视角”的论证结构，并直接衔接“价值—组织—技术”分析框架。</p>
    </section>
  </div>
</header>

<div class="toolbar-wrap">
  <div class="toolbar">
    <div class="switcher" role="tablist" aria-label="选择显示版本">
      <button type="button" role="tab" data-mode="a" aria-selected="false">版本一</button>
      <button type="button" role="tab" data-mode="b" aria-selected="true">版本二</button>
      <button type="button" role="tab" data-mode="all" aria-selected="false">全部内容</button>
    </div>
    <div>
      <div class="actions">
        <button type="button" id="copyButton">复制当前内容</button>
        <button type="button" id="printButton">打印 / 导出 PDF</button>
      </div>
      <div class="status" id="status" aria-live="polite"></div>
    </div>
  </div>
</div>

<div class="layout">
  <main id="content">
    <article id="version-a" class="version-panel prose" aria-label="版本一：精炼修改稿">
      <div class="version-ribbon"><strong>Version 01</strong><span>保留原结构 · 脚注已补齐 · 可直接替换</span></div>
      ${versionA}
    </article>
    <article id="version-b" class="version-panel prose" aria-label="版本二：深度重写定稿">
      <div class="version-ribbon"><strong>Version 02 · Recommended</strong><span>范例式论证 · 框架直接衔接 · 完整脚注</span></div>
      ${versionB}
    </article>
  </main>
  <aside aria-label="当前版本目录">
    <nav class="toc" id="toc">
      <h2 class="toc-title">当前目录</h2>
      <div id="tocLinks"></div>
    </nav>
  </aside>
</div>

<footer class="footer">
  <p>两个版本均保留完整正文、结构说明、核查意见和参考文献。页面不依赖网络，可离线打开；打印时将自动输出两个完整版本。</p>
</footer>

<script>
  (function(){
    var body=document.body;
    var buttons=Array.from(document.querySelectorAll('.switcher button'));
    var tocLinks=document.getElementById('tocLinks');
    var status=document.getElementById('status');
    var progress=document.getElementById('progress');

    function visiblePanels(){
      var mode=body.dataset.mode;
      if(mode==='a') return [document.getElementById('version-a')];
      if(mode==='b') return [document.getElementById('version-b')];
      return [document.getElementById('version-a'),document.getElementById('version-b')];
    }

    function updateToc(){
      tocLinks.innerHTML='';
      visiblePanels().forEach(function(panel){
        panel.querySelectorAll('h1,h2,h3,h4').forEach(function(heading){
          if(!heading.id) return;
          var link=document.createElement('a');
          link.href='#'+heading.id;
          link.textContent=heading.textContent;
          link.dataset.level=heading.tagName.substring(1);
          tocLinks.appendChild(link);
        });
      });
    }

    function setMode(mode){
      body.dataset.mode=mode;
      buttons.forEach(function(button){
        button.setAttribute('aria-selected',String(button.dataset.mode===mode));
      });
      updateToc();
      window.scrollTo({top:document.querySelector('.toolbar-wrap').offsetTop,behavior:'smooth'});
    }

    buttons.forEach(function(button){
      button.addEventListener('click',function(){setMode(button.dataset.mode);});
    });

    document.getElementById('copyButton').addEventListener('click',function(){
      var text=visiblePanels().map(function(panel){return panel.innerText;}).join('\\n\\n');
      if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(function(){status.textContent='已复制当前内容';},function(){fallbackCopy(text);});
      }else{fallbackCopy(text);}
    });

    function fallbackCopy(text){
      var area=document.createElement('textarea');
      area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';
      document.body.appendChild(area);area.select();
      try{document.execCommand('copy');status.textContent='已复制当前内容';}catch(e){status.textContent='复制失败，请手动选择正文';}
      document.body.removeChild(area);
    }

    document.getElementById('printButton').addEventListener('click',function(){window.print();});

    window.addEventListener('scroll',function(){
      var root=document.documentElement;
      var max=root.scrollHeight-root.clientHeight;
      progress.style.width=(max>0?(root.scrollTop/max*100):0)+'%';
    },{passive:true});

    updateToc();
  })();
</script>
</body>
</html>`;

fs.writeFileSync(outPath, html, 'utf8');
console.log(outPath);
