const fs = require('fs');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  FootnoteReferenceRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  PageNumber,
  PageBreak,
  LevelFormat,
} = require('docx');

const outputPath = '/Users/xuyiheng/Desktop/智能时代的公共管理：南京那站的案例研究/交付稿/文献综述深度重写稿_结合范例结构与分析框架.docx';
const bodyFont = 'Source Han Serif CN';
const headingFont = 'Source Han Sans CN';
const colors = { ink: '20242A', muted: '5E6875', accent: '315F84', pale: 'EFF4F8', line: 'B7C5D1', white: 'FFFFFF' };
const contentWidth = 9026;

function run(text, options = {}) {
  return new TextRun({
    text,
    font: options.font || bodyFont,
    size: options.size || 22,
    bold: options.bold || false,
    italics: options.italics || false,
    color: options.color || colors.ink,
  });
}

function body(parts, options = {}) {
  const children = [];
  for (const part of parts) {
    if (typeof part === 'string') children.push(run(part));
    else if (part.note) children.push(new FootnoteReferenceRun(part.note));
    else if (part.text) children.push(run(part.text, part));
  }
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: options.noIndent ? undefined : { firstLine: 440 },
    spacing: { line: 360, before: options.before || 0, after: options.after ?? 120 },
    keepNext: options.keepNext || false,
    children,
  });
}

function h1(text, options = {}) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: options.pageBreakBefore || false,
    keepNext: true,
    spacing: { before: 280, after: 160 },
    children: [run(text, { font: headingFont, size: 30, bold: true, color: colors.accent })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    keepNext: true,
    spacing: { before: 220, after: 120 },
    children: [run(text, { font: headingFont, size: 26, bold: true })],
  });
}

function noteBox(text) {
  return new Paragraph({
    border: { left: { style: BorderStyle.SINGLE, size: 14, color: colors.accent, space: 10 } },
    shading: { fill: 'F7F9FB', type: ShadingType.CLEAR },
    indent: { left: 260, right: 160 },
    spacing: { line: 330, before: 80, after: 180 },
    children: [run(text, { size: 21, color: colors.muted })],
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { line: 330, after: 80 },
    children: [run(text, { size: 21 })],
  });
}

function footnotePara(text) {
  return new Paragraph({
    spacing: { line: 260, after: 40 },
    children: [run(text, { size: 18 })],
  });
}

function cell(text, width, header = false) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: colors.line };
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: { top: border, bottom: border, left: border, right: border },
    shading: { fill: header ? colors.accent : colors.white, type: ShadingType.CLEAR },
    margins: { top: 110, bottom: 110, left: 120, right: 120 },
    children: [new Paragraph({
      spacing: { line: 300, after: 0 },
      children: [run(text, { size: 20, bold: header, color: header ? colors.white : colors.ink, font: header ? headingFont : bodyFont })],
    })],
  });
}

function frameworkTable() {
  const widths = [2350, 3100, 3576];
  const rows = [
    ['文献述评提出的问题', '分析框架中的处理', '案例分析中的可观察机制'],
    ['治理任务如何形成，哪些需求、主体、数据和规则进入场景', '公共价值界定问题及技术介入边界；中枢统筹共同标准，边缘主体提供专业权责与情境知识', '事件通约：把异构信息转为能够指向责任与处置要求的治理事件'],
    ['组织条件与技术要素如何在运行中反复调整', '“中枢—边缘”组织结构与“模型—编排—工具”技术架构相互适配', '资源编排与流程嵌入：把模型判断接入权限、资源、行动程序和责任记录'],
    ['单项应用如何转化为可复用、受公共价值约束的治理能力', '运行反馈进入标准、知识和协作关系；通用能力支撑稳定供给，边缘裁量回应差异与例外', '知识回流：反馈引起分类、规则或流程修正，并在后续任务中再次使用'],
  ];
  return new Table({
    width: { size: contentWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((row, i) => new TableRow({
      tableHeader: i === 0,
      children: row.map((text, j) => cell(text, widths[j], i === 0)),
    })),
  });
}

const cleanReview = [
  h1('二、文献综述'),
  body([
    '人工智能的识别、预测、生成和工具调用等能力，何以进入具体公共治理任务，并进一步成为公共组织可持续、可复用的场景治理能力？围绕这一问题，现有研究大致形成四类解释。技术功能研究说明人工智能可以承担何种行政任务，组织采纳研究解释哪些条件影响应用结果，技术—组织研究追踪技术如何嵌入流程并改变组织，组织学习研究则讨论实践经验如何转化为惯例与能力。这四类研究分别抓住了技术可用、组织采纳、运行调适和经验积累等环节。',
  ]),

  h2('（一）技术功能与采纳条件：从技术可用到组织采用'),
  body([
    '第一类是技术功能解释。此类研究从人工智能的技术属性出发，考察识别、分类、预测、生成和自动化等功能可以进入哪些行政活动。Wirtz 等识别出知识管理、流程自动化、预测分析、虚拟代理和身份识别等 10 类公共部门应用；', { note: 1 },
    'Sousa 等对 59 篇相关研究的系统综述也发现，人工神经网络等技术已经进入一般公共服务、经济事务和环境保护等政府职能。', { note: 2 },
    '技术功能解释建立了公共部门人工智能的应用图谱，使研究者能够比较不同技术的用途及其可能产生的行政效果。不过，这类研究通常先设定行政任务，再讨论人工智能可以在其中发挥什么作用。治理问题如何被识别，连续而混杂的现实事务如何转化为可供技术处理的任务，往往不在其解释范围之内。场景在这里主要是应用领域的标签或技术落地的容器。',
  ]),
  body([
    '第二类是组织采纳解释。随着研究重心从技术潜力转向实施结果，数据条件、信息基础设施、管理支持、人员能力、制度规范和行动者认知被纳入分析。公共部门人工智能实施研究据此讨论管理者在政策要求、组织约束与技术风险之间面对的实际难题；', { note: 3 },
    '基于欧洲 18 国案例的研究进一步说明，人工智能对政策制定与执行、公共服务供给和组织内部管理的影响，取决于多项条件的组合。', { note: 4 },
    '其中，数据质量、代表性、共享方式和审查机制关系到系统能否稳定且可信地运行；', { note: 5 },
    '政策制定者、业务人员和技术企业对技术用途、风险及责任的理解差异，也会改变项目的方向。', { note: 6 },
    '这类研究解释了相近技术为何在不同组织中形成不同结果，并把技术应用放回公共组织的资源与制度环境之中。其不足在于，影响因素通常以变量或条件组合的形式出现，研究重点仍是采纳、成败或绩效结果。数据、人员和制度条件如何围绕具体任务被重新组合，任务边界又如何随着运行反馈而改变，仍缺少连续的过程解释。',
  ]),

  h2('（二）技术—组织互构：从采用结果到运行过程'),
  body([
    '第三类是技术—组织互构解释。技术结构化研究指出，组织结构会影响技术的实际使用，技术投入实践后也可能改变角色关系、互动方式与组织规则。', { note: 7 },
    '技术既是行动者设计和使用的产物，也会成为后续行动的条件。', { note: 8 },
    '邱泽奇据此将技术实施概括为技术提供方与使用方相互建构的过程：技术具有结构刚性，也保留可调整的细节；组织以既有权责、流程和业务惯例约束技术，同时又会因技术而改变。', { note: 9 },
    '黄晓春对基层电子政务的研究进一步表明，技术应用还受到政府组织制度结构与运作逻辑的塑造。', { note: 10 },
    '互构解释把分析重心从“是否采纳”推进到“如何运行”，为观察技术方案、组织结构和行动者在实施中的反复调整提供了过程视角。',
  ]),
  body([
    '政府组织中的权力与合法性研究补充了这一视角。信息技术进入行政组织，需要部门在权力、利益和责任之间形成可执行的运作安排；', { note: 11 },
    '行政权威可以赋予技术应用以任务地位并动员正式资源，技术能否长期使用，还受绩效合法性和价值合法性的影响。', { note: 12 },
    '这说明组织并非技术作用的外部背景。技术进入什么任务，能够调用哪些资源，输出在何种程序中产生效力，都取决于组织如何界定技术的位置及其责任。',
  ]),
  body([
    '人工智能使技术与组织的互动进一步触及行政裁量和官僚角色。Young、Bullock 与 Lecy 提出“人工裁量”，指出人工智能可能提高任务处理的规模和效率，也会带来公平、可管理性与政治可行性问题。', { note: 13 },
    'Giest 与 Klievink 对两个公共部门案例的比较发现，人工智能会改变官僚的任务、协调关系和反馈渠道；正式组织若未同步调整，模型产生的分类和判断仍可能在日常流程中实质性改变专业裁量。', { note: 14 },
    '这些研究表明，人工智能的组织后果不能只从系统是否上线来判断，还要追踪模型输出如何进入人机分工、责任程序与实际行动。',
  ]),
  body([
    '现有互构研究仍有两个边界。经典研究多以边界相对清楚的单一组织和一般信息系统为对象，技术提供方与使用方构成主要关系；公共治理中的数据、算力、业务知识、现场处置权和公共责任却常常分布在政府部门、属地组织与技术企业之间。Mikhaylov、Esteve 与 Campion 因此指出，政府难以独立完成公共部门人工智能的开发与嵌入，跨部门、跨层级和跨行业协作本身就是实施条件。', { note: 15 },
    '另一方面，人工智能常被作为一个整体系统来讨论，模型如何连接任务分解、权限配置、业务工具和行动接口，仍被留在技术黑箱之中。若不同时考察跨组织的统筹结构和人工智能的运行架构，就难以解释技术判断如何转化为组织行动。',
  ]),

  h2('（三）组织学习与能力形成：从单项应用到持续复用'),
  body([
    '第四类是组织学习解释。数字化转型研究认为，技术变迁会持续改变组织流程、文化和主体关系，因此不能用系统建设或服务上线概括转型结果。', { note: 16 },
    '数字治理能力研究也开始把主责部门、专业力量与治理机制的运行过程纳入分析。', { note: 17 },
    '组织学习研究则指出，能力并非实践经验的自然累积，而是经验积累、知识表达和知识编码共同作用的结果；不同任务的频率、同质性和因果模糊程度，还会影响这些学习机制的作用。', { note: 18 },
    '据此，人工智能在一次任务中完成识别、派单或问答，只能说明技术产生了应用效果。运行中的偏差、人工修正和协作经验还要进入数据标准、业务规则或操作程序，组织才可能在后续任务中调用并修正既有做法。',
  ]),
  body([
    '近年的公共部门人工智能研究开始直接讨论这种能力形成。Wilson 与 Broomfield 发现，公共管理者能否跨组织学习人工智能知识，受组织边界和知识类型影响，非正式经验交流与结构化知识转移适用于不同学习任务。', { note: 19 },
    'Van Noordt 与 Tangi 则区分了开发人工智能和实施人工智能的组织能力。公共组织即使能够完成技术开发，也可能因内部专业力量不足、法律障碍和持续维护机制缺失而无法长期运行；外部技术力量与内部实施能力之间需要形成相对稳定的组织配置。', { note: 20 },
    '这些研究将视野从单项项目延伸到知识、人员和制度能力，也说明能力会因资源和组织安排不稳定而保持脆弱。',
  ]),
  body([
    '能力研究仍未充分说明两项问题。其一，资源、技能与知识如何在具体场景中转化为可观察的治理能力，尤其是事件反馈如何引起事项分类、协作关系和行动程序的修正；其二，经验复用可能提高处理规模，也可能把情境差异压缩为统一规则。公共部门人工智能同时承载管理价值和民主价值，效率、敏捷性与服务改进需要和公平、包容、透明及问责共同考察。', { note: 21 },
    '因此，可复用并不是治理能力的充分条件。组织还要在稳定处理共性事项的同时，为具体需求、专业裁量和例外情形保留回应空间。',
  ]),

  h2('（四）文献述评'),
  body([
    '上述四类研究形成了一个逐步推进的解释序列：技术功能研究说明人工智能可以做什么，组织采纳研究说明何种条件影响应用结果，技术—组织研究解释技术如何进入流程并改变组织，组织学习研究讨论实践经验如何转化为惯例与能力。它们已经说明技术是否可用、组织能否吸收、运行如何调适和经验怎样积累，却仍未解释治理场景如何被组织出来，以及场景运行如何把这些环节连接起来。',
  ]),
  body([
    '第一，现有研究通常把治理问题和应用任务视为既定前提，因而较少解释场景的形成。公共组织面对的是连续、混杂并且跨越部门边界的现实事务。哪些需求被识别为公共问题，问题如何分解为可处理的任务，哪些主体、数据和规则被纳入其中，会决定人工智能能够看见什么、处理什么以及忽略什么。这一过程同时包含公共价值取舍：组织不仅要判断技术是否可用，还要决定哪些事项适合交给技术、为谁提供服务以及保留何种人工判断。治理任务的形成因而是技术进入场景之前必须解释的组织过程。',
  ]),
  body([
    '第二，现有研究尚未把跨组织结构与人工智能运行架构放进同一分析过程。采纳研究能够识别数据、人员和制度条件，互构研究能够说明组织与技术会相互调整，但这些条件不会自行组成稳定的应用方式。跨部门场景既需要汇集共用标准、数据资源和协调能力，也要保留业务部门的专业权责与现场知识；模型输出则要经过任务分解、权限配置、工具调用和流程接入，才能成为组织行动。组织如何为技术配置运行条件，技术又如何改变问题表述、资源组合和行动顺序，需要在连续运行中加以追踪。',
  ]),
  body([
    '第三，单项应用转化为场景治理能力的机制仍不清楚。系统上线、流程提速或一次协同处置，只能证明技术在特定任务中产生了作用。治理能力要求组织能够保存运行经验，根据反馈修正分类、规则和协作关系，并在新任务中再次调用。能力还要接受公共价值检验：通用知识与协作程序应当支持稳定、普遍的服务供给，具体任务仍需根据对象、时间与情境调整，例外事项则应保留专业裁量、人工复核和责任追溯。',
  ]),
  body([
    '“场景”视角可以把上述三个问题放在同一分析层次。场景化治理研究把场景理解为围绕特定情境组织环境、主体、活动与治理工具的过程，并强调其跨组织协同和动态调整。', { note: 22 },
    '本文进一步把公共治理场景界定为：公共组织围绕具体问题形成任务，配置数据、权责、知识和行动接口，并在运行反馈中持续修正的治理单元。由此，人工智能塑造治理场景包含三个相互衔接的过程：公共价值参与问题选择和任务界定；组织结构与技术架构相互调整，使模型判断进入资源配置与行动流程；运行经验被记录、表达和编码，形成能够跨任务复用、同时回应共性与差异需求的治理能力。本文将在技术与组织互构论的基础上，沿着“价值界定—组织配置与技术重组—能力形成与场景回应”的思路建立分析框架。',
  ]),
];

const bridge = [
  h1('三、理论基础与分析框架（建议替换开头）', { pageBreakBefore: true }),
  noteBox('下面这一段用于替换现有第三章标题后的第一段，使文献述评与分析框架直接衔接；后续“技术与组织互构论”和三个命题可以继续保留并据此调整。'),
  body([
    '文献综述表明，人工智能进入公共治理并不是技术功能的直接兑现。公共组织先要从连续、混杂的现实事务中识别问题并形成任务，再围绕任务配置权责、数据、知识、资源和行动程序；技术投入运行后，又会改变组织表述问题、组合资源和实施行动的方式。运行反馈能否进入分类、规则与协作关系，决定单项应用能否转化为可持续、可复用的治理能力。现有研究分别解释了技术功能、采纳条件、组织互动与能力积累，却没有把任务形成、组织—技术调整和能力复用置于同一场景过程中。为解释这一过程，本文以技术与组织互构论为理论基础，将公共价值置于场景选择和技术介入边界之中，并把人工智能理解为由模型、编排与工具构成的运行架构，建立“价值—组织—技术”的分析框架。该框架依次考察三个问题：公共价值如何参与治理任务的界定；“中枢—边缘”的组织结构如何与“模型—编排—工具”的技术架构相互调适；二者形成的治理能力如何在稳定处理共性事项的同时回应差异需求，并接受责任与公共性的约束。',
  ]),
];

const appendix = [
  h1('附录：结构设计与框架对应', { pageBreakBefore: true }),
  h2('1. 范例写法转化为本稿的方法'),
  bullet('先提出全文要解释的核心问题，而不是从“国内外研究很多”开始。'),
  bullet('把文献分成四类解释，每类都交代基本主张、已有推进和解释边界。'),
  bullet('述评先归并四类研究的共同贡献，再指出它们之间尚未连接的过程。'),
  bullet('本文视角通过改变分析单位来回应缺口：从技术、项目或部门转向围绕具体问题形成的治理场景。'),
  h2('2. 文献述评与后续分析的对应关系'),
  frameworkTable(),
  h2('3. 写作上的控制'),
  body(['本稿采用学术论文语体，保留“场景治理能力”“技术—组织互构”“公共价值”等核心概念。四类解释没有被写成相互排斥的理论，而是被处理为解释链条中各自有效、又各有边界的研究路径。对既有研究的批评尽量限定其适用范围，避免把条件研究概括为简单罗列，也避免把所有人工智能系统笼统描述为能够持续学习。'], { noIndent: true }),
];

const footnotes = {
  1: { children: [footnotePara('WIRTZ B W, WEYERER J C, GEYER C. Artificial intelligence and the public sector—Applications and challenges[J]. International Journal of Public Administration, 2019, 42(7): 596-615.')] },
  2: { children: [footnotePara('SOUSA W G, MELO E R P, BERMEJO P H D S, et al. How and where is artificial intelligence in the public sector going? A literature review and research agenda[J]. Government Information Quarterly, 2019, 36(4): 101392.')] },
  3: { children: [footnotePara('MERGEL I, DICKINSON H, STENVALL J, GASCO M. Implementing AI in the public sector[J]. Public Management Review, 2023: 1-14. DOI: 10.1080/14719037.2023.2231950.')] },
  4: { children: [footnotePara('雷挺，任宇凡，吴义熔. 人工智能提升政府治理能力的作用机理与组态路径研究——基于欧洲 18 国的多案例分析[J]. 电子政务，2024（2）：65-78.')] },
  5: { children: [footnotePara('JANSSEN M, BROUS P, ESTEVEZ E, et al. Data governance: Organizing data for trustworthy artificial intelligence[J]. Government Information Quarterly, 2020, 37(3): 101493.')] },
  6: { children: [footnotePara('SUN T Q, MEDAGLIA R. Mapping the challenges of artificial intelligence in the public sector: Evidence from public healthcare[J]. Government Information Quarterly, 2019, 36(2): 368-383.')] },
  7: { children: [footnotePara('BARLEY S R. Technology as an occasion for structuring: Evidence from observations of CT scanners and the social order of radiology departments[J]. Administrative Science Quarterly, 1986, 31(1): 78-108.')] },
  8: { children: [footnotePara('ORLIKOWSKI W J. The duality of technology: Rethinking the concept of technology in organizations[J]. Organization Science, 1992, 3(3): 398-427.')] },
  9: { children: [footnotePara('邱泽奇. 技术与组织的互构——以信息技术在制造企业的应用为例[J]. 社会学研究，2005（2）：32-54.')] },
  10: { children: [footnotePara('黄晓春. 技术治理的运作机制研究——以上海市 L 街道一门式电子政务中心为案例[J]. 社会，2010，30（4）：1-31.')] },
  11: { children: [footnotePara('谭海波，孟庆国，张楠. 信息技术应用中的政府运作机制研究——以 J 市政府网上行政服务系统建设为例[J]. 社会学研究，2015，30（6）：73-98.')] },
  12: { children: [footnotePara('任敏. 技术应用何以成功？——一个组织合法性框架的解释[J]. 社会学研究，2017，32（3）：169-192+245.')] },
  13: { children: [footnotePara('YOUNG M M, BULLOCK J B, LECY J D. Artificial discretion as a tool of governance: A framework for understanding the impact of artificial intelligence on public administration[J]. Perspectives on Public Management and Governance, 2019, 2(4): 301-313.')] },
  14: { children: [footnotePara('GIEST S N, KLIEVINK B. More than a digital system: How AI is changing the role of bureaucrats in different organizational contexts[J]. Public Management Review, 2024, 26(2): 379-398.')] },
  15: { children: [footnotePara('MIKHAYLOV S J, ESTEVE M, CAMPION A. Artificial intelligence for the public sector: Opportunities and challenges of cross-sector collaboration[J]. Philosophical Transactions of the Royal Society A, 2018, 376(2128): 20170357.')] },
  16: { children: [footnotePara('MERGEL I, EDELMANN N, HAUG N. Defining digital transformation: Results from expert interviews[J]. Government Information Quarterly, 2019, 36(4): 101385.')] },
  17: { children: [footnotePara('于君博，戴鹏飞. 打开中国地方政府的数字治理能力“黑箱”——一个比较案例分析[J]. 中国行政管理，2021（1）：36-41+78.')] },
  18: { children: [footnotePara('ZOLLO M, WINTER S G. Deliberate learning and the evolution of dynamic capabilities[J]. Organization Science, 2002, 13(3): 339-351.')] },
  19: { children: [footnotePara('WILSON C, BROOMFIELD H. Learning how to do AI: Managing organizational boundaries in an intergovernmental learning forum[J]. Public Management Review, 2023, 25(10): 1938-1957.')] },
  20: { children: [footnotePara('VAN NOORDT C, TANGI L. The dynamics of AI capability and its influence on public value creation of AI within public administration[J]. Government Information Quarterly, 2023, 40(4): 101860.')] },
  21: { children: [footnotePara('HJALTALIN I T, SIGURDARSON H T. The strategic use of AI in the public sector: A public values analysis of national AI strategies[J]. Government Information Quarterly, 2024, 41(1): 101914.')] },
  22: { children: [footnotePara('袁方成，马康. 场景化治理：基层治理的新型态[J]. 治理研究，2026，42（1）：113-126+160.')] },
};

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 480, after: 140 },
    children: [run('文献综述深度重写稿', { font: headingFont, size: 38, bold: true, color: colors.accent })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 420 },
    children: [run('结合范例的论证结构与本文后续分析框架', { size: 24, color: colors.muted })],
  }),
  noteBox('文档由三部分组成：第一部分是可直接替换的完整文献综述，脚注已写入 Word；第二部分是建议替换的第三章开头；附录说明本稿如何借鉴范例的写法，并展示文献缺口与后续分析框架的对应关系。原始论文未被覆盖。'),
  ...cleanReview,
  ...bridge,
  ...appendix,
];

const doc = new Document({
  styles: {
    default: { document: { run: { font: bodyFont, size: 22, color: colors.ink } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: headingFont, size: 30, bold: true, color: colors.accent }, paragraph: { outlineLevel: 0, spacing: { before: 280, after: 160 } } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: headingFont, size: 26, bold: true, color: colors.ink }, paragraph: { outlineLevel: 1, spacing: { before: 220, after: 120 } } },
    ],
  },
  numbering: {
    config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 260 } } } }] }],
  },
  footnotes,
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1240, right: 1440, bottom: 1240, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: colors.line, space: 4 } }, children: [run('人工智能技术塑造公共治理场景', { size: 18, color: colors.muted })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run('— ', { size: 18, color: colors.muted }), new TextRun({ children: [PageNumber.CURRENT], font: bodyFont, size: 18, color: colors.muted }), run(' —', { size: 18, color: colors.muted })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log(outputPath);
});
