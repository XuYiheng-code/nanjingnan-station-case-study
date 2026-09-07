import type { DecisionExercise, DecisionRoles, DecisionStage, ScenarioId } from './types';

export type GovernanceChain = {
  id: string;
  name: string;
  shortName: string;
  system: 'territory' | 'rail' | 'metro' | 'law' | 'asset';
  scope: string;
  limit: string;
  point: [number, number, number];
  anchor: [number, number, number];
};

// “九类”是根据案例主体做的教学归类，不表示现实中只有九家单位。
export const GOVERNANCE_CHAINS: GovernanceChain[] = [
  { id: 'yuhuatai', name: '雨花台区—南站综管办', shortName: '雨花台属地', system: 'territory', scope: '日常综合管理、巡查、考核和联席协调', limit: '对平行行政区和垂直系统缺少完整指挥权', point: [-22, 1.1, -13], anchor: [-8, 0.2, -5] },
  { id: 'jiangning', name: '江宁区相关管理体系', shortName: '江宁属地', system: 'territory', scope: '按属地责任组织公共服务、应急与考核', limit: '与雨花台区为平行属地体系', point: [22, 1.1, 13], anchor: [8, 0.2, 5] },
  { id: 'rail', name: '上海局集团南京站', shortName: '铁路运营', system: 'rail', scope: '铁路运输、候车、站台与站房相关区域', limit: '垂直指挥和数据体系不当然纳入地方平台', point: [-14, 9.3, -4], anchor: [-7, 5.2, -2] },
  { id: 'rail-police', name: '高铁南站派出所', shortName: '铁路公安', system: 'law', scope: '铁路系统区域内的治安秩序与案件处理', limit: '职权范围与地方公安、交管分工衔接', point: [14, 9.1, -4], anchor: [7, 4.8, -2] },
  { id: 'metro', name: '南京地铁南京南站', shortName: '地铁运营', system: 'metro', scope: '地铁站厅、站台、设备与客流组织', limit: '地铁门内外与换乘通道存在交接', point: [-14, -1.6, 5], anchor: [-5, -1.3, 2] },
  { id: 'metro-police', name: '地铁公安南京南站派出所', shortName: '地铁公安', system: 'law', scope: '地铁空间内公共安全、秩序维护与警力组织', limit: '设施调整和路径变更需与运营方联动', point: [14, -1.6, 5], anchor: [5, -1.3, 2] },
  { id: 'traffic-police', name: '公安交管部门', shortName: '道路交管', system: 'law', scope: '开放道路指挥、管制、秩序维护和违法查处', limit: '不直接替代停车场内部运营调度', point: [23, 1.1, -2], anchor: [18.4, 0.2, 0] },
  { id: 'city-services', name: '城管、住建等专业条线', shortName: '城市管理', system: 'law', scope: '市容、环卫、市政设施与相关行政执法', limit: '各部门依法定专业权限履职', point: [-23, 1.1, 1], anchor: [-17, 0.2, 0] },
  { id: 'platform', name: '交通集团、铁投与交控万物', shortName: '资产与平台', system: 'asset', scope: '资产管养、停车运营、整体服务与数字调度', limit: '合同与运营权不能替代执法权和数据主权', point: [0, 1.1, 19], anchor: [0, 0.2, 12] },
];

const decisionVariants: Record<ScenarioId, Omit<DecisionExercise, 'prompt'>> = {
  pre_boundary: {
    tension: '问题跨越空间边界，但两区机构仍是平行关系，协调意见还要回到各自体系执行。',
    options: [
      { id: 'bounded', label: '按区分别转办', action: '先把问题切分，再由两区各自处置。', consequence: '权责界限清楚，但连续问题可能在交界处停顿。', tone: 'steady', scores: { speed: -1, coordination: -1, legitimacy: 2 } },
      { id: 'coordinated', label: '建立联合处置单', action: '保留两区法定责任，同时统一记录交接、时限与结果。', consequence: '不改变行政区划，却能把跨区事项变成可追踪的共同任务。', tone: 'recommended', scores: { speed: 1, coordination: 3, legitimacy: 2 } },
      { id: 'overreach', label: '由一方越区指挥', action: '让一个区直接命令另一行政区人员。', consequence: '表面环节更少，但缺少法定隶属关系，指令可能失效并模糊责任。', tone: 'risk', scores: { speed: 2, coordination: -2, legitimacy: -3 } },
    ],
  },
  pre_departments: {
    tension: '综合协调能召集各方，却不能替代铁路、地铁、公安、交管、城管等专业条线作出法定判断。',
    options: [
      { id: 'bounded', label: '逐条线分别转报', action: '问题拆分后进入各部门原有流程。', consequence: '程序稳妥，但重复报送和等待会拉长处置时间。', tone: 'steady', scores: { speed: -2, coordination: -1, legitimacy: 2 } },
      { id: 'coordinated', label: '主责牵引、并行会商', action: '明确一个主责接口，其他条线同步研判并留痕。', consequence: '保留专业决定权，同时减少串行等待；仍需清晰的升级规则。', tone: 'recommended', scores: { speed: 2, coordination: 3, legitimacy: 2 } },
      { id: 'overreach', label: '以协调代替执法决定', action: '由综合协调机构直接作出专业或执法结论。', consequence: '短期集中，但越过法定职权，结果难以持续执行。', tone: 'risk', scores: { speed: 2, coordination: -1, legitimacy: -3 } },
    ],
  },
  pre_outsourcing: {
    tension: '同一旅客问题可能同时落入多份合同，但企业只能在各自服务包和验收边界内行动。',
    options: [
      { id: 'bounded', label: '退回各自合同', action: '由不同甲方分别确认、派工和验收。', consequence: '合同风险最低，但小问题会在甲乙方之间反复流转。', tone: 'steady', scores: { speed: -2, coordination: -2, legitimacy: 2 } },
      { id: 'coordinated', label: '设置联合现场接口', action: '不改变合同主体，先统一受理，再按责任清单分派。', consequence: '接缝处有了明确入口，但根本上仍受多份合同约束。', tone: 'recommended', scores: { speed: 1, coordination: 2, legitimacy: 2 } },
      { id: 'overreach', label: '要求一家企业包办', action: '未调整合同就让单一企业承担全部问题。', consequence: '可能暂时止住投诉，却造成费用、验收和安全责任不清。', tone: 'risk', scores: { speed: 2, coordination: 0, legitimacy: -3 } },
    ],
  },
  overview: {
    tension: '统一执行界面可以减少服务接缝，但不能把企业合同变成行政授权。',
    options: [
      { id: 'bounded', label: '仅归并合同内服务', action: '平台只受理明确列入整体服务合同的事项。', consequence: '边界稳妥，但跨服务与行政的问题仍可能退回原有多头协调。', tone: 'steady', scores: { speed: 0, coordination: 0, legitimacy: 3 } },
      { id: 'coordinated', label: '统一受理、分类交接', action: '服务事项直接派工，行政事项由平台留痕后移交法定主体。', consequence: '一个入口对应多种合法出口，兼顾效率与权力边界。', tone: 'recommended', scores: { speed: 2, coordination: 3, legitimacy: 3 } },
      { id: 'overreach', label: '让平台统一作最终决定', action: '由企业平台直接处置属地、执法和数据授权事项。', consequence: '指挥看似集中，却越过行政授权和数据边界，责任链反而失真。', tone: 'risk', scores: { speed: 2, coordination: -2, legitimacy: -3 } },
    ],
  },
  metro_peak: {
    tension: '热力预警能提醒风险，但封闭楼梯、截流和调整扶梯都会改变旅客动线。',
    options: [
      { id: 'bounded', label: '只发布绕行提醒', action: '不调整通道和设施，仅通过广播分流。', consequence: '干预较小，但在双向客流对冲时可能不足以降低风险。', tone: 'steady', scores: { speed: -1, coordination: 0, legitimacy: 2 } },
      { id: 'coordinated', label: '现场核验后联动截流', action: '公安现场研判，与地铁运营方共同调整楼梯、扶梯和进站节奏。', consequence: '与公开事件的处置逻辑一致：现场判断与专业运营联动，需持续解释并动态调整。', tone: 'recommended', scores: { speed: 2, coordination: 2, legitimacy: 2 } },
      { id: 'overreach', label: '仅凭算法自动封控', action: '热力值超阈后直接关闭通道，不等待现场核验。', consequence: '反应最快，但可能误判现场承载状态，也会制造新的拥堵点。', tone: 'risk', scores: { speed: 3, coordination: -1, legitimacy: -2 } },
    ],
  },
  parking_boundary: {
    tension: '停车场内的运营权与开放道路上的交通管理权在出入口相遇。',
    options: [
      { id: 'bounded', label: '各管一段', action: '企业调度场内道闸和车位，交管部门单独处理外围道路。', consequence: '权责分明，但排队跨越红线时，信息需逐级传递，出入口仍可能拥堵。', tone: 'steady', scores: { speed: -1, coordination: -1, legitimacy: 2 } },
      { id: 'coordinated', label: '内外联调', action: '建立场内平台与道路指挥的通报、确认和交接程序。', consequence: '企业不越权，交管部门保留法定决定；效率取决于信息共享和现场响应。', tone: 'recommended', scores: { speed: 1, coordination: 3, legitimacy: 2 } },
      { id: 'overreach', label: '企业直接指挥公共道路', action: '由停车平台直接对六朝路、江南路进行管制和违停处置。', consequence: '可能减少指令环节，但运营合同不能替代道路交通管理和执法权。', tone: 'risk', scores: { speed: 3, coordination: -2, legitimacy: -3 } },
    ],
  },
  ai_workorder: {
    tension: '平台可以发现、派单和留痕，但不能把算法判断变成执法结论。',
    options: [
      { id: 'bounded', label: '只做信息转报', action: '平台不组织现场服务，所有线索都直接转给部门。', consequence: '最小化企业责任风险，但大量可由服务人员解决的事项会重新涌入行政链条。', tone: 'steady', scores: { speed: -2, coordination: -1, legitimacy: 2 } },
      { id: 'coordinated', label: '人工核验、分类交接', action: '先由现场人员确认事实；服务事项就地处理，执法事项转交法定部门。', consequence: '将平台效率限定在合同与服务边界内，同时保留现场判断和执法程序。', tone: 'recommended', scores: { speed: 2, coordination: 2, legitimacy: 3 } },
      { id: 'overreach', label: '算法识别后直接处罚', action: '把图像识别结果直接作为违法认定和强制处置依据。', consequence: '省去核验环节，但算法无法取得行政执法权，误报也可能直接转化为程序和权利风险。', tone: 'risk', scores: { speed: 3, coordination: -2, legitimacy: -3 } },
    ],
  },
};

export function getDecisionExercise(scenarioId: ScenarioId, stage: DecisionStage): DecisionExercise {
  const variant = decisionVariants[scenarioId];
  return {
    ...variant,
    prompt: `在“${stage.label}”节点，${stage.owner}应如何处理当前问题？`,
  };
}

const roleVariants: Record<ScenarioId, Omit<DecisionRoles, 'decider'>> = {
  pre_boundary: { proposer: '属地巡查／综管办', executor: '两区各自责任部门与服务单位', supervisor: '两区政府／联席协调机制' },
  pre_departments: { proposer: '现场值守／综管办', executor: '归口后的专业部门或运营单位', supervisor: '联席机制／上级主管部门' },
  pre_outsourcing: { proposer: '现场班组／项目经理', executor: '对应合同服务企业', supervisor: '各项目甲方／综管办' },
  overview: { proposer: '综管办／平台运行中心', executor: '交控万物现场团队与专业单位', supervisor: '多甲方／法定责任部门' },
  metro_peak: { proposer: '地铁公安／运营值守', executor: '地铁运营与现场警力', supervisor: '地铁运营指挥与公安指挥链' },
  parking_boundary: { proposer: '停车运营／现场交警', executor: '场内运营团队与道路交管力量', supervisor: '资产甲方／公安交管部门' },
  ai_workorder: { proposer: '城市小脑／云城队长', executor: '现场服务班组或法定部门', supervisor: '平台质检／行政主管部门' },
};

export function getDecisionRoles(scenarioId: ScenarioId, stage: DecisionStage): DecisionRoles {
  return { ...roleVariants[scenarioId], decider: stage.owner };
}
