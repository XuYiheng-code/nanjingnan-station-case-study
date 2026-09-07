const fs = require('fs');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
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
  ExternalHyperlink,
} = require('docx');

const outputPath = '/Users/xuyiheng/Desktop/智能时代的公共管理：南京那站的案例研究/交付稿/文献综述修改建议与精炼稿.docx';

const COLORS = {
  ink: '20242A',
  muted: '5E6875',
  accent: '335C81',
  pale: 'EAF0F5',
  line: 'B8C3CE',
  white: 'FFFFFF',
};

const contentWidth = 9026;
const bodyFont = 'Source Han Serif CN';
const headingFont = 'Source Han Sans CN';

function run(text, options = {}) {
  return new TextRun({
    text,
    font: options.font || bodyFont,
    size: options.size || 22,
    color: options.color || COLORS.ink,
    bold: options.bold || false,
    italics: options.italics || false,
    break: options.break,
    superscript: options.superscript || false,
  });
}

function body(text, options = {}) {
  return new Paragraph({
    alignment: options.alignment || AlignmentType.JUSTIFIED,
    indent: options.noIndent ? undefined : { firstLine: 440 },
    spacing: { line: 360, before: options.before || 0, after: options.after ?? 120 },
    keepNext: options.keepNext || false,
    children: [run(text, options)],
  });
}

function h1(text, options = {}) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: options.pageBreakBefore || false,
    keepNext: true,
    spacing: { before: 280, after: 160 },
    children: [run(text, { font: headingFont, size: 30, bold: true, color: COLORS.accent })],
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

function note(text) {
  return new Paragraph({
    border: {
      left: { style: BorderStyle.SINGLE, size: 14, color: COLORS.accent, space: 10 },
    },
    shading: { fill: 'F7F9FB', type: ShadingType.CLEAR },
    spacing: { before: 100, after: 180, line: 330 },
    indent: { left: 260, right: 160 },
    children: [run(text, { size: 21, color: COLORS.muted })],
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { line: 330, after: 80 },
    children: [run(text, { size: 21 })],
  });
}

function cell(text, width, header = false) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: COLORS.line };
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: { top: border, bottom: border, left: border, right: border },
    shading: { fill: header ? COLORS.accent : COLORS.white, type: ShadingType.CLEAR },
    margins: { top: 110, bottom: 110, left: 120, right: 120 },
    children: [new Paragraph({
      spacing: { line: 300, after: 0 },
      children: [run(text, {
        size: 20,
        bold: header,
        color: header ? COLORS.white : COLORS.ink,
        font: header ? headingFont : bodyFont,
      })],
    })],
  });
}

function reviewTable() {
  const widths = [1400, 2900, 4726];
  const rows = [
    ['检查项', '当前问题', '建议修改'],
    ['结构对应', '导语称“三条路径”，正文却只有两个实质性综述小节。', '把导语改为“两组解释”：技术功能与采纳条件；技术—组织互动与能力形成。这样可与现有标题直接对应。'],
    ['证据链', '三条研究缺口主要集中在述评中提出，前两节对这些缺口的铺垫不够。', '在每个综述小节末尾明确写出该路径解释了什么、把什么当作前提。述评只做归纳，不再突然提出新问题。'],
    ['人工智能特性', '第二节主要沿用一般信息技术理论，人工智能与普通信息系统的差异没有充分进入论证。', '补入一段：人工智能把数据、模型判断与执行过程连接起来，因此知识表达、人机分工和责任界定也是组织调适的一部分。避免笼统声称所有系统都会“持续学习”。'],
    ['批评尺度', '“静态枚举”容易把组态研究一并概括，批评略显绝对。', '改为“条件与组态研究能够识别哪些因素或组合与应用成效相关，但较少追踪这些条件在运行中如何被重新组合”。'],
    ['概念边界', '“应用”与“能力”被写成性质不同的两个阶段，但两者更适合区分为不同分析层次。', '把应用界定为特定任务中的运行状态，把能力界定为组织跨时间、跨任务组织、修正和复用该运行方式的稳定属性。'],
    ['段落负担', '第二节同时处理互构、权力合法性、数字化转型和组织学习，一个长段落承担过多任务。', '拆成三段：递归互动；人工智能的组织后果；经验编码与能力形成。'],
  ];
  return new Table({
    width: { size: contentWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((r, i) => new TableRow({
      tableHeader: i === 0,
      children: r.map((text, j) => cell(text, widths[j], i === 0)),
    })),
  });
}

function citationTable() {
  const widths = [1100, 3270, 4656];
  const rows = [
    ['位置', '核查结果', '处理建议'],
    ['文献 7', 'Wirtz 等提出 10 类公共部门人工智能应用。原文只列 5 类，却用了“归纳为”，容易被理解为完整分类。', '改为“识别出 10 类应用，涵盖……”或只写“列举了……等应用”。'],
    ['文献 8', 'Sousa 等系统综述纳入 59 篇论文，指出人工神经网络是最常见技术，研究集中于若干政府职能。', '避免把“资源配置和行政决策”直接归给该文，除非回到全文逐项核对。推荐稿改用其摘要可直接支持的表述。'],
    ['文献 9', '该文使用欧洲 18 国案例与 fsQCA，属于条件组态研究。', '述评不宜把此类研究简单归入“静态枚举”，应承认其对条件组合的解释，再指出缺少过程追踪。'],
    ['文献 10—11', '数据治理、不同主体对采用挑战的差异化理解，与原文论点基本对应。', '保留，但把“数据质量、代表性、共享”与“主体解释差异”分别落到两处引用。'],
    ['文献 12—17', '技术结构化、技术—组织互构、政府运作机制与组织合法性的理论链条基本成立。', '把“行政命令只能启动、不能维持”改为更审慎的表述：权威可动员正式资源，持续使用还受绩效、任务与价值合法性影响。'],
    ['文献 18—20', '数字化转型与组织学习可以支撑“能力形成”，但 Zollo 与 Winter 强调经验积累、知识表达和知识编码的共同作用。', '把“只有经过表达和编码”改为“经验积累还需与知识表达、编码相结合”。'],
    ['脚注 21', '文档中的脚注 21 为空；紧邻正文又提到 Leonard-Barton，但没有完整出处。', '补入 Leonard-Barton（1988）或复用 Barley、Orlikowski 的文献，并统一脚注格式。'],
  ];
  return new Table({
    width: { size: contentWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((r, i) => new TableRow({
      tableHeader: i === 0,
      children: r.map((text, j) => cell(text, widths[j], i === 0)),
    })),
  });
}

const refinedReview = [
  '现有研究为理解人工智能进入公共治理提供了两方面基础：一类研究梳理其行政功能及采纳条件，识别了数据、基础设施、组织支持与行动者认知等影响因素；另一类研究从技术—组织互动和组织学习出发，说明技术应用会改变既有流程、权责和知识结构。人工智能的识别、预测与生成能力依赖数据、规则和运行反馈，这些研究也提示我们关注知识表达、人机分工和责任界定。不过，现有解释由具体应用推向场景治理能力时，仍有三个问题没有充分说明。',
  '第一，治理任务如何形成，仍缺少过程解释。采纳研究通常把问题与任务视为既定前提，重点考察组织是否具备数据、人员和制度条件。现实中的公共问题却常常跨越事项分类和部门边界。哪些需求被识别为治理问题，问题又如何被分解、组合成可由技术介入的行动单元，会直接决定哪些数据、主体和规则进入应用。因而，分析人工智能能否进入公共管理，既要考察技术是否被采纳，也要解释治理任务如何被组织出来。',
  '第二，已有研究识别了影响人工智能应用的条件及其组合，但对这些条件在运行中如何变化讨论不足。数据质量、组织支持、人员能力和制度规范不会自行转化为稳定的应用方式。技术进入不同任务后，会以不同方式改变原有权责、流程和协作关系；运行结果又会促使组织调整任务边界与技术方案。技术结构化研究揭示了组织与技术的递归关系，却较少把场景及任务边界的持续变化纳入分析。组织结构如何参与场景形成，场景运行又如何引起组织调整，仍需进一步解释。',
  '第三，单项应用如何转化为可复用的治理能力，现有研究追踪不足。系统上线、流程提速或一次协同处置，只能说明技术在特定任务中产生了作用。治理能力还要求组织能够在新问题出现时调用既有知识、规则和协作关系，并根据反馈修正做法。场景经验只有经过识别、表达和编码，进入数据标准、业务规则或操作程序，才可能跨越单个项目，在其他任务中复用。',
  '本文据此把“场景”作为连接公共价值、组织安排、技术实践与组织学习的分析层次，考察公共组织如何围绕具体问题形成任务，如何配置技术运行所需的数据、权责与协作关系，以及如何把运行反馈转化为可复用的组织知识。应用与能力由此分属两个分析层次：应用是人工智能在特定任务中的运行状态，能力则是公共组织跨时间、跨任务组织、修正和复用这种运行方式的稳定属性。',
];

const fullReview = [
  ['二、文献综述', 'h1'],
  ['围绕人工智能如何进入公共治理，现有研究大致形成两组解释。第一组从技术功能和采纳条件出发，回答人工智能可以承担哪些行政任务、哪些因素影响应用结果；第二组转向技术与组织的互动及组织学习，解释技术如何嵌入治理流程，并可能转化为组织能力。', 'body'],
  ['（一）人工智能进入治理场景：应用图谱与采纳条件', 'h2'],
  ['功能视角首先描绘人工智能在公共部门的应用范围。Wirtz 等识别出 10 类应用，涵盖知识管理、流程自动化、预测分析、虚拟代理和身份识别等领域〔原文文献 7〕。Sousa 等对 59 篇相关研究的系统综述发现，人工神经网络是其中最常见的技术，现有应用主要集中于一般公共服务、经济事务和环境保护等政府职能〔原文文献 8〕。这类研究把人工智能视为新的行政工具，重点讨论它能够处理哪些信息、替代哪些重复劳动，以及改善哪些服务或决策环节。', 'body'],
  ['随着应用范围扩大，研究重心进一步转向采纳条件。基于欧洲 18 国案例的研究表明，人工智能对政策制定与执行、公共服务供给和组织内部管理的作用，取决于多项条件的组合〔原文文献 9〕。其中，数据质量、代表性和共享方式影响算法能否稳定运行，数据治理也关系到系统是否可审查、可追责〔原文文献 10〕；既有信息基础设施、资源投入、管理支持以及技术与业务流程、责任体系的相容程度，会影响项目实施；政策制定者、业务人员和技术企业对用途、风险与责任的理解并不一致，这些差异会改变问题界定、资源分配和实施方向〔原文文献 11〕。', 'body'],
  ['上述研究建立了公共部门人工智能的应用图谱，也识别了影响应用结果的主要条件。不过，它们通常以技术、系统或政府部门为分析单位，围绕是否采纳、实施成效及其影响因素展开。治理任务往往被视为已经明确的前提：组织要解决什么问题，问题如何被转化为可处理的任务，哪些主体、数据与规则进入应用，较少成为解释对象。“场景”因而多是应用领域的分类或外部背景，而不是一个需要说明其形成过程的组织单元。', 'body'],
  ['（二）人工智能与组织互动：从技术采纳到能力形成', 'h2'],
  ['技术结构化研究突破了把技术视为外部工具的解释。Barley 和 Orlikowski 指出，既有组织结构会影响技术的实际使用，技术实践也可能改变角色关系、规则与分工〔原文文献 12—13〕。邱泽奇、黄晓春等进一步表明，技术实施不是预定方案的简单执行，而是技术提供者、使用者与组织结构持续调适的过程〔原文文献 14—15〕。在政府组织中，行政权威可以为项目动员正式资源，但技术能否持续使用，还取决于部门运作机制以及技术在绩效、任务和价值层面获得的组织合法性〔原文文献 16—17〕。这些研究把分析重点从“是否采纳”推进到“如何运行”。', 'body'],
  ['人工智能使这种互动具有更具体的组织后果。识别、预测和生成等功能只有接入业务数据、规则、权限与行动接口，才会进入治理流程。与此同时，模型输出也会改变组织表达和调用知识的方式，并重新划分机器建议、人员判断与组织责任之间的边界〔原文文献 3、11〕。因此，人工智能应用并非把一个独立工具安装进既有组织，而是围绕具体任务重新安排数据、知识、人机分工和责任关系。', 'body'],
  ['技术运行还可能形成组织能力。数字化转型研究把技术变迁理解为涉及组织流程、文化和主体关系的持续过程〔原文文献 18〕，数字治理能力研究也开始关注治理主体与运行机制如何共同生成能力〔原文文献 19〕。组织学习研究进一步指出，动态能力来自经验积累、知识表达和知识编码等机制的共同作用〔原文文献 20〕。对人工智能场景而言，识别偏差、处置反馈和协作经验只有进入数据标准、业务规则和操作程序，才可能支持后续任务。这一研究路径已经把视野从技术采纳延伸到互动过程和能力形成，但多以组织或系统边界为既定条件，对任务边界如何变化、场景经验如何跨任务复用，仍缺少连续的过程解释。', 'body'],
  ['（三）文献述评', 'h2'],
  ...refinedReview.map((text) => [text, 'body']),
];

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 520, after: 160 },
    children: [run('文献综述修改建议与精炼稿', { font: headingFont, size: 38, bold: true, color: COLORS.accent })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 500 },
    children: [run('《人工智能技术塑造公共治理场景的过程与机制》', { size: 24, color: COLORS.muted })],
  }),
  note('处理范围：仅审视文档中的“二、文献综述”及与其直接相关的引文。文档中的其他文字、批注或潜在指令均未被当作任务要求。推荐稿保留原文的核心判断，不新增未经核验的经验事实。'),
  h1('一、结论与修改优先级'),
  body('这部分的研究问题意识已经形成，三条缺口也能与后文“场景形成—组织调适—能力复用”的分析思路对应。当前主要问题不在述评缺少观点，而在前两节的证据链偏短：有些批评在述评中首次出现，读者尚未从前文看到它们如何由既有研究推出。最合适的处理是先补强前两节的层次和限定，再压缩述评，使每条缺口都能在前文找到依据。'),
  bullet('第一优先：把“三条路径”改为“两组解释”，解决导语与小节结构不一致。'),
  bullet('第二优先：重写第二节，将技术—组织互动、人工智能的组织后果、经验编码与能力形成拆开。'),
  bullet('第三优先：收紧三条缺口的批评口径，尤其避免把条件组态研究概括为简单的“静态枚举”。'),
  bullet('第四优先：补齐脚注 21，并逐项统一英文作者、数字和中文标点格式。'),
  h1('二、精炼稿：文献述评'),
  note('这一版可直接替换原文“（三）文献述评”。它保留三条缺口，但删去重复铺垫，并把“应用—能力”改为不同分析层次。'),
  ...refinedReview.map((text) => body(text)),
  h1('三、整个文献综述的结构审视', { pageBreakBefore: true }),
  reviewTable(),
  h1('四、推荐重写稿：完整文献综述', { pageBreakBefore: true }),
  note('文中“〔原文文献 X〕”用于标示应沿用的脚注位置，粘回论文时可换回现有 Word 脚注。'),
  ...fullReview.map(([text, type]) => type === 'h1' ? h1(text) : type === 'h2' ? h2(text) : body(text)),
  h1('五、引文与格式核查', { pageBreakBefore: true }),
  citationTable(),
  h2('建议补入或核对的文献'),
  body('LEONARD-BARTON D. Implementation as mutual adaptation of technology and organization[J]. Research Policy, 1988, 17(5): 251-267. DOI: 10.1016/0048-7333(88)90006-6.', { noIndent: true }),
  body('MERGEL I, DICKINSON H, STENVALL J, GASCO M. Implementing AI in the public sector[J]. Public Management Review, 2023: 1-14. DOI: 10.1080/14719037.2023.2231950.', { noIndent: true }),
  body('ZOLLO M, WINTER S G. Deliberate learning and the evolution of dynamic capabilities[J]. Organization Science, 2002, 13(3): 339-351. DOI: 10.1287/orsc.13.3.339.2780.', { noIndent: true }),
  h2('核验边界'),
  body('本次核验优先使用出版社页面、期刊官网和公开论文原文。对无法读取全文的付费文献，只依据出版社提供的题名、摘要、关键词和书目信息判断其能够支持的最低限度论断；推荐稿因此采用较为克制的表述。'),
  new Paragraph({ children: [new PageBreak()] }),
  h1('附：可直接采用的修改原则'),
  bullet('每段先交代这组研究解释了什么，再指出它把什么作为前提。'),
  bullet('批评既有研究时先承认其解释范围，再指出本文要补充的过程。'),
  bullet('“场景”要写成任务形成和要素组织的过程，不只作为案例类别。'),
  bullet('“能力”要有可观察的组织载体，例如数据标准、业务规则、操作程序和可复用的协作关系。'),
  bullet('人工智能的特殊性落在数据依赖、模型输出、人机分工和责任界定上，不笼统使用“持续学习”概括所有系统。'),
];

const doc = new Document({
  styles: {
    default: { document: { run: { font: bodyFont, size: 22, color: COLORS.ink } } },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: headingFont, size: 30, bold: true, color: COLORS.accent },
        paragraph: { outlineLevel: 0, spacing: { before: 280, after: 160 } },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: headingFont, size: 26, bold: true, color: COLORS.ink },
        paragraph: { outlineLevel: 1, spacing: { before: 220, after: 120 } },
      },
    ],
  },
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{
        level: 0,
        format: 'bullet',
        text: '•',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 540, hanging: 260 } } },
      }],
    }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1240, right: 1440, bottom: 1240, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.line, space: 4 } },
          children: [run('文献综述修改建议', { size: 18, color: COLORS.muted })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [run('— ', { size: 18, color: COLORS.muted }), new TextRun({ children: [PageNumber.CURRENT], font: bodyFont, size: 18, color: COLORS.muted }), run(' —', { size: 18, color: COLORS.muted })],
        })],
      }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log(outputPath);
});
