import type { DecisionStage, Department, DepartmentMap, EraMeta, GovernanceEra, Scenario, ScenarioId } from './types';

export const ERA_META: Record<GovernanceEra, EraMeta> = {
  before: {
    id: 'before',
    label: '进场前',
    years: '2011—2023',
    title: '碎片化治理环境',
    description: '站区位于三区交界地带，日常治理的核心矛盾集中在雨花台、江宁两套平行属地体系，以及铁路、地铁、公安、城管、交管和多家外包企业之间。',
    tags: ['两区分治', '多部门转报', '多企分包'],
  },
  after: {
    id: 'after',
    label: '进场后',
    years: '2024—至今',
    title: '平台化运行环境',
    description: '交控万物承接整体服务，形成“多甲方对一乙方”的统一执行界面；行政执法、属地责任、数据主权和资产权属仍保留各自边界。',
    tags: ['整体发包', '统一调度', '边界内协同'],
  },
};

export const PRE_ENTRY_SCENARIOS: Scenario[] = [
  {
    id: 'pre_boundary', era: 'before', name: '三区交界与两区分治', shortName: '空间连续，属地责任分开', date: '2011—2012', time: '09:00', status: '制度建立期：一站两办',
    evidenceType: 'case-reconstruction', evidenceLabel: '案例背景复原',
    summary: '规划区位处在雨花台、江宁、秦淮交界地带；案例中的日常属地治理冲突，主要发生在雨花台、江宁两套平行体系之间。2011—2012 年，两区分别设置管理机构，形成“一站两办、两套标准”。',
    metric: '空间背景：三区交界；运行矛盾：两区平行属地体系', sourceNote: '依据案例正文对区位、机构设置与“一站两办”的叙述复原；边界仅作教学示意，不是测绘界线。',
    flowIndex: 0.78, particleCount: 380, speed: 0.7,
    dataPoints: [
      { label: '区位背景', value: '三区交界', note: '雨花·江宁·秦淮' },
      { label: '属地体系', value: '两套', note: '雨花台·江宁' },
      { label: '直接后果', value: '一站两办', note: '标准与考核分立' },
    ],
    sources: [{ label: '大赛案例正文：空间区位与管理体制章节' }],
    stages: [
      { id: 'locate', label: '识别空间边界', time: '09:00', owner: '规划与属地管理部门', ownerType: '问题界定主体', trigger: '站房、广场、道路和配套设施跨越不同管理边界。', decision: '先判断问题位于哪个属地、哪个系统和哪类资产范围。', authority: '依据法定区划、规划和资产资料进行归口。', collaborators: ['雨花台区相关部门', '江宁区相关部门', '铁路与地铁运营主体'], boundary: '三区交界是区位背景，不等于三个区对全部站区共同日常管理。', outcome: '同一空间被切分为不同责任单元。', view: 'boundary', focusPoint: [0, 0.2, 0] },
      { id: 'separate', label: '两办分别部署', time: '09:20', owner: '两区站区管理机构', ownerType: '平行属地主体', trigger: '同类问题落入两区不同责任清单。', decision: '各自按本区流程、标准和承包关系组织处置。', authority: '本行政区内的综合协调与服务管理。', collaborators: ['本区城管与住建条线', '本区公安与交管力量', '本区服务企业'], boundary: '一方不能直接指挥另一行政区的机构和人员。', outcome: '出现“一站两办、两套标准”。', view: 'boundary', focusPoint: [-8, 0.2, -7] },
      { id: 'crossing', label: '问题穿越边界', time: '10:05', owner: '现场管理人员', ownerType: '一线发现主体', trigger: '客流、车辆、保洁或设施问题从一个责任区延伸到另一责任区。', decision: '决定就地处理、转报，还是启动跨区协调。', authority: '现场劝导、记录和本辖区服务处置。', collaborators: ['相邻属地值守人员', '运营单位', '外包企业'], boundary: '不能把辖区外事项直接纳入本方考核与指挥链。', outcome: '事项容易停在责任交界处。', view: 'boundary', focusPoint: [0, 0.2, 6] },
      { id: 'joint', label: '启动联席协调', time: '10:40', owner: '南站地区综合管理协调机构', ownerType: '协调主体', trigger: '单一区域无法独立完成处置。', decision: '召集两区和相关条线协商责任、时序与资源。', authority: '组织会议、通报问题、跟踪办理。', collaborators: ['两区有关部门', '铁路与地铁', '公安交管', '服务企业'], boundary: '协调机构缺少对平行属地和垂直系统的完整指挥权。', outcome: '问题得到协商，但协调成本高、速度不稳定。', view: 'overview', focusPoint: [0, 1, 10] },
      { id: 'return', label: '责任再次回流', time: '次日', owner: '各法定责任主体', ownerType: '分散执行主体', trigger: '联席意见需要回到各自系统办理。', decision: '在各自权限和预算内落实协商结果。', authority: '依法或依合同执行本系统事项。', collaborators: ['综管办', '相关专业部门', '外包服务单位'], boundary: '联席结论不能替代法定程序和内部授权。', outcome: '形成阶段性处置，结构性分割仍在。', view: 'overview', focusPoint: [0, 1, -10] },
    ],
  },
  {
    id: 'pre_departments', era: 'before', name: '多部门条线协同', shortName: '14 个单位和部门的历史口径', date: '2013—2023', time: '14:00', status: '常态运行期：多头转报',
    evidenceType: 'case-reconstruction', evidenceLabel: '治理结构复原',
    summary: '铁路、地铁、公安、交管、城管、住建和属地机构各有法定职责与垂直链条。案例引用的历史报道以“14 个单位和部门”概括多头管理，并非固定不变的当前机构清单。',
    metric: '“14 个单位和部门管”', sourceNote: '采用案例引用的历史报道口径；页面以九类治理链条归纳展示，不把教学归类当作机构编制事实。',
    flowIndex: 0.86, particleCount: 450, speed: 0.76,
    dataPoints: [
      { label: '历史口径', value: '14', note: '单位与部门' },
      { label: '教学归类', value: '9 类', note: '非机构编制数' },
      { label: '主要困境', value: '权责分散', note: '协调不等于指挥' },
    ],
    sources: [{ label: '大赛案例正文：传统治理困境与主体关系章节' }],
    stages: [
      { id: 'discover', label: '现场发现问题', time: '14:00', owner: '站区巡查与值守人员', ownerType: '发现主体', trigger: '站内外连续空间出现秩序、设施或服务问题。', decision: '记录位置、类型和涉及系统。', authority: '巡查、劝导、拍照和信息上报。', collaborators: ['属地网格力量', '铁路与地铁值守', '外包服务人员'], boundary: '发现问题不等于拥有处置全部问题的权力。', outcome: '形成问题线索。', view: 'overview', focusPoint: [-8, 0.4, -8] },
      { id: 'classify', label: '判断责任条线', time: '14:12', owner: '综管办协调人员', ownerType: '归口协调主体', trigger: '同一问题可能同时涉及属地、行业、执法和资产。', decision: '识别主责、协同和现场服务主体。', authority: '按清单转办、发起协调和催办。', collaborators: ['公安与交管', '城管与住建', '铁路与地铁', '资产运营单位'], boundary: '不能以综合协调替代部门法定认定。', outcome: '事项进入一条或多条业务链。', view: 'overview', focusPoint: [0, 1, 0] },
      { id: 'forward', label: '多头转报', time: '14:25', owner: '各专业部门值守接口', ownerType: '专业判断主体', trigger: '归口后仍需各系统内部确认。', decision: '分别进入本部门指挥、审批或派工流程。', authority: '在本部门法定职责内研判和调度。', collaborators: ['本系统下级单位', '现场责任人', '其他相关条线'], boundary: '部门之间不存在当然的横向指挥关系。', outcome: '信息重复传递，处置节奏不同步。', view: 'overview', focusPoint: [10, 1, -4] },
      { id: 'command', label: '高位协调', time: '15:10', owner: '市区领导与联席机制', ownerType: '临时统筹主体', trigger: '问题久拖、舆情升温或重大保障任务到来。', decision: '集中调度资源，明确阶段任务和时限。', authority: '督促、协调、检查和责任传导。', collaborators: ['两区政府', '铁路与地铁', '公安城管交管', '运营企业'], boundary: '临时高位推动不能替代稳定的常态接口。', outcome: '短期内快速整治。', view: 'station', focusPoint: [0, 6, 0] },
      { id: 'rebound', label: '整治后回潮', time: '数日后', owner: '原有分散责任体系', ownerType: '常态运行主体', trigger: '专项力量撤出，事项重新回到原有链条。', decision: '继续依靠各自巡查、转报和分段处置。', authority: '各自系统内的常态管理权。', collaborators: ['综管办', '专业部门', '运营与服务单位'], boundary: '没有统一执行界面，跨界问题仍需反复协调。', outcome: '治理效果难以稳定保持。', view: 'overview', focusPoint: [0, 1, 10] },
    ],
  },
  {
    id: 'pre_outsourcing', era: 'before', name: '多企分包与责任接缝', shortName: '多个甲方、多个乙方', date: '2013—2023', time: '16:00', status: '服务供给期：多企治站',
    evidenceType: 'case-reconstruction', evidenceLabel: '外包关系复原',
    summary: '保洁、秩序、设施、停车等服务由不同甲方分别采购，多家企业按合同边界作业。空间连续，合同却按区域和专业切分，交界问题经常需要在甲方、乙方之间反复确认。',
    metric: '多甲方—多乙方', sourceNote: '依据案例对分散采购、分段服务和验收关系的描述进行机制复原；企业节点为类型化展示。',
    flowIndex: 0.72, particleCount: 330, speed: 0.62,
    dataPoints: [
      { label: '采购关系', value: '多对多', note: '甲乙方接口繁多' },
      { label: '服务边界', value: '分区分项', note: '空间接缝明显' },
      { label: '验收方式', value: '分别验收', note: '缺少整体结果' },
    ],
    sources: [{ label: '大赛案例正文：外包碎片化与平台整合章节' }],
    stages: [
      { id: 'contract', label: '分别采购服务', time: '16:00', owner: '各资产与管理甲方', ownerType: '合同决策主体', trigger: '不同区域、设施和服务项目分别提出采购需求。', decision: '按本单位预算和资产范围确定服务包。', authority: '采购、合同管理和本项目验收。', collaborators: ['属地管理机构', '资产单位', '专业服务企业'], boundary: '一个甲方通常不能替其他甲方调整合同。', outcome: '形成多个服务包与多套标准。', view: 'overview', focusPoint: [-12, 0.2, -8] },
      { id: 'enter', label: '多家企业进场', time: '16:15', owner: '分包服务企业', ownerType: '合同执行主体', trigger: '各合同分别进入履约阶段。', decision: '按各自区域、班次和考核项配置人员。', authority: '合同授权范围内的保洁、秩序或设施服务。', collaborators: ['各自甲方', '项目经理', '现场班组'], boundary: '不能占用其他合同资源，也不能处理行政执法事项。', outcome: '同一站区出现多个作业单元。', view: 'overview', focusPoint: [10, 0.2, -8] },
      { id: 'seam', label: '接缝问题出现', time: '16:32', owner: '现场班组长', ownerType: '一线判断主体', trigger: '问题跨越服务区域，或同时涉及两种专业。', decision: '判断自处、上报甲方，还是联系相邻企业。', authority: '组织本班组完成合同内任务。', collaborators: ['相邻企业班组', '双方项目经理', '现场协调人员'], boundary: '合同外作业可能无法计量、验收和追责。', outcome: '小问题容易在接缝处等待。', view: 'boundary', focusPoint: [0, 0.2, -8] },
      { id: 'inspect', label: '甲方分别验收', time: '17:05', owner: '各项目甲方', ownerType: '履约监督主体', trigger: '企业分别提交处置结果。', decision: '按各自合同指标确认是否完成。', authority: '考核、扣款、整改和验收。', collaborators: ['服务企业', '现场管理人员'], boundary: '单项验收合格不等于旅客体验和站区整体结果良好。', outcome: '局部指标完成，整体问题可能仍在。', view: 'overview', focusPoint: [-5, 0.2, 8] },
      { id: 'dispute', label: '责任争议回流', time: '17:30', owner: '综管办与各甲方', ownerType: '协调与合同主体', trigger: '投诉未解决或问题反复出现。', decision: '再次核对空间、专业、合同和法定责任。', authority: '协调企业、约谈项目和督促整改。', collaborators: ['相关行政部门', '资产单位', '各服务企业'], boundary: '协调仍受多份合同和多套考核体系约束。', outcome: '形成“多企治站”的循环协调。', view: 'overview', focusPoint: [0, 1, 11] },
    ],
  },
];

const baseDepartments: Department[] = [
  { name: '雨花台区南站综管办', type: '属地协调', role: '日常巡查、联席协调与综合管理。', authority: '组织协调、转办催办与属地资源调度。', boundary: '对平行属地和垂直系统缺少完整指挥权。', state: '协调中' },
  { name: '江宁区相关管理体系', type: '平行属地', role: '承担本行政区范围内的公共服务与治理责任。', authority: '本区法定职责和资源配置。', boundary: '与雨花台区为平行行政关系。', state: '独立运行' },
  { name: '铁路与地铁运营主体', type: '垂直运营', role: '承担站房、站台、地铁和运输组织。', authority: '本运营系统内的专业指挥。', boundary: '数据、设施和调度受垂直体系约束。', state: '专业处置' },
  { name: '公安、交管、城管等部门', type: '行政执法', role: '依法处理治安、交通和市容秩序事项。', authority: '各自法定执法权。', boundary: '执法权不能通过协调或外包合同转移。', state: '依法履职' },
];

const contractorDepartments: Department[] = [
  ...baseDepartments,
  { name: '多家专业服务企业', type: '分散外包', role: '分别承担保洁、秩序、设施和停车等合同任务。', authority: '合同约定的服务与现场管理。', boundary: '跨合同、跨区域事项需要甲方确认。', state: '分段履约' },
];

const parkingStages: DecisionStage[] = [
  {
    id: 'prepare', label: '保障预案', time: '保障期前', owner: '雨花台、江宁两区相关协调主体', ownerType: '属地保障组织主体', phase: 'authorize', horizon: 'prevention',
    trigger: '节假日铁路到发、地铁换乘和停车需求预计同步上升。', decision: '分别部署属地保障任务，预先明确企业、综管办和公安交管的联络接口。',
    authority: '各区在属地范围内组织保障、调配资源和开展考核。', collaborators: ['南站地区综管办', '交控万物与停车运营团队', '公安交管与交通运输部门'],
    boundary: '案例访谈反映企业可能需要分别参加两区会议；跨区协调不改变平行属地关系。', outcome: '人员和联络接口前置，但企业仍需面对两套属地部署体系。', view: 'boundary', focusPoint: [0, 0.15, 0],
  },
  {
    id: 'sense', label: '风险感知', time: 'T+00', owner: '交控停车与停车管理平台', ownerType: '停车风险发现主体', phase: 'signal', horizon: 'response',
    trigger: '局部停车场余位快速下降，入口排队长度持续增长。', decision: '调取泊位、道闸和车流数据，形成拥堵风险线索并通知现场值班人员。',
    authority: '在已取得运营权的停车场内部采集运行数据并组织服务。', collaborators: ['停车场值班人员', '交控万物运行中心'],
    boundary: '场内摄像头和泊位数据只能反映企业运营范围，不能替代开放道路现场判断。', outcome: '平台发出风险线索，等待场内外人工核验。', view: 'parking', focusPoint: [14.2, -0.2, -3.8],
  },
  {
    id: 'verify', label: '现场复核', time: 'T+现场', owner: '停车场现场值班人员', ownerType: '事实核验主体', phase: 'verify', horizon: 'response',
    trigger: '平台提示余位紧张或入口队列异常。', decision: '到场核对真实余位、道闸运行、排队尾部位置及是否已外溢到开放道路。',
    authority: '场内巡查、信息记录、服务引导和异常上报。', collaborators: ['场内疏导人员', '停车平台调度员', '开放道路值守力量'],
    boundary: '核验人员可报告道路状况，但企业人员无权据此实施交通管制或违法认定。', outcome: '区分场内周转问题、设施故障与开放道路秩序问题。', view: 'parking', focusPoint: [16.4, 0.05, -1.5],
  },
  {
    id: 'internal', label: '场内调度', time: 'T+处置', owner: '停车场值班负责人', ownerType: '企业运营决策主体', phase: 'authorize', horizon: 'response',
    trigger: '核验确认局部停车场趋于饱和，其他停车场仍有余位。', decision: '调整道闸节奏、引导车辆转向有余位停车场，并增派网约车候车区人员。',
    authority: '停车场红线内的运营管理、人员调度和服务组织。', collaborators: ['宁畅行信息服务', '场内疏导与安保人员'],
    boundary: '不能在六朝路、江南路上设置管制、处罚违停或指挥社会车辆。', outcome: '场内周转得到调整；平台继续监测排队是否向外部道路拖尾。', view: 'parking', focusPoint: [14.2, -0.2, 4],
  },
  {
    id: 'classify', label: '权责判定', time: '条件触发', owner: '南站地区综管办与停车运营接口人员', ownerType: '事项归口与联动发起主体', phase: 'classify', horizon: 'response',
    trigger: '排队尾部越过停车场运营红线，或出现开放道路车辆交织、违停。', decision: '将场内服务任务与道路秩序事项拆分，向公安交管发送位置、队列和现场图像。',
    authority: '综合协调、信息转报、催办与合同范围内的服务调度。', collaborators: ['停车场值班负责人', '公安交管联络岗位', '交通运输部门'],
    boundary: '归口和转报不能替代公安交管对道路风险、违法行为和管制措施的法定判断。', outcome: '平台停止越界指挥，形成可追踪的道路联动请求。', view: 'boundary', focusPoint: [17.5, 0.1, 0],
  },
  {
    id: 'handoff', label: '道路联动', time: '联动处置', owner: '公安交管部门', ownerType: '公共道路法定处置主体', phase: 'execute', horizon: 'response',
    trigger: '公安交管依据现场道路状态确认需要疏导、秩序维护或执法。', decision: '实施开放道路交通指挥，并与停车场同步入口放行和场内分流节奏。',
    authority: '开放道路交通秩序管理、交通管制和行政执法。', collaborators: ['南站地区综管办', '停车场运营企业', '属地保障力量'],
    boundary: '企业只能通报、建议和配合，不能以运营合同替代交警法定职权。', outcome: '道路处置与场内运营建立双向反馈，避免一侧放行抵消另一侧疏导。', view: 'boundary', focusPoint: [18.4, 0.15, 2.5],
  },
  {
    id: 'review', label: '恢复与复盘', time: '事件后', owner: '综管办、停车运营与公安交管相关主体', ownerType: '联合复核主体', phase: 'learn', horizon: 'recovery',
    trigger: '场内余位、入口排队和开放道路车速逐步恢复。', decision: '核对告警、到场、移交和恢复记录，识别联络延迟、权责接缝与设施堵点。',
    authority: '各主体在法定职责或合同范围内复盘、整改和调整预案。', collaborators: ['雨花台区相关部门', '江宁区相关部门', '交通运输与资产单位'],
    boundary: '联合复盘可以改进接口，不能替代各主体内部审批、预算和法定程序。', outcome: '一次现场处置转化为预案、接口或设施改进建议。', view: 'overview', focusPoint: [0, 2.8, 0],
  },
];

const crowdStages: DecisionStage[] = [
  {
    id: 'detect', label: '大客流预警', time: '14:00', owner: '地铁公安南京南站派出所综合指挥室', ownerType: '事件发现与首轮研判主体', phase: 'signal', horizon: 'response',
    trigger: '高铁到达客流持续进入换乘层，热力系统触发橙色预警。', decision: '把热力变化作为风险线索，通知当班民警前往通道核查。', authority: '公共安全巡查、现场秩序维护和警力组织。', collaborators: ['南京地铁南京南站', '站内执勤警力'], boundary: '橙色预警表示大客流风险，不是事故结论，也不能自动触发封控。', outcome: '数字系统缩短发现时间，现场处置尚未启动。', view: 'metro', focusPoint: [0, -0.5, 1.2],
  },
  {
    id: 'verify', label: '到场核验', time: '14:05', owner: '现场处置民警', ownerType: '现场事实核验主体', phase: 'verify', horizon: 'response',
    trigger: '系统提示换乘通道密度和双向流量持续上升。', decision: '观察对冲方向、通行速度、站台承载和旅客滞留位置。', authority: '现场巡查、秩序研判和应急信息上报。', collaborators: ['南京地铁现场人员', '通道值守力量'], boundary: '必须把热力数值与站台、楼梯和扶梯的真实承载情况相互校验。', outcome: '确认双向客流对冲，现有通行组织难以自行消散。', view: 'metro', focusPoint: [0.5, -0.4, 0.2],
  },
  {
    id: 'report', label: '请求增援', time: '核验后', owner: '现场处置民警', ownerType: '处置建议提出主体', phase: 'classify', horizon: 'response',
    trigger: '通道对冲持续，既有警力和现场物资不足。', decision: '上报现场证据，请求增调警力、平安合伙人及铁马等分流物资。', authority: '在公安指挥体系内报告并请求支援。', collaborators: ['派出所综合指挥室', '南京地铁现场人员'], boundary: '现场人员提出建议，增援规模和截流措施仍需由有权指挥主体决定。', outcome: '指挥室获得可用于决策的现场信息。', view: 'metro', focusPoint: [1.2, -0.35, -0.2],
  },
  {
    id: 'decide', label: '授权截流', time: '条件触发', owner: '地铁公安现场指挥', ownerType: '公共安全决策主体', phase: 'authorize', horizon: 'response',
    trigger: '站台候车压力与通道对冲风险达到预案处置条件。', decision: '决定实施铁马和人墙截流，暂闭两处楼梯并保留一部扶梯运行。', authority: '为保障公共安全采取现场秩序控制措施。', collaborators: ['增援警力', '南京地铁运营指挥', '平安合伙人'], boundary: '措施会改变旅客路径，必须同步解释、广播并根据站台承载动态调整。', outcome: '截流方案、岗位与旅客信息发布口径被明确。', view: 'metro', focusPoint: [0, -0.7, -0.6],
  },
  {
    id: 'control', label: '截流与绕行', time: '处置期间', owner: '地铁公安与南京地铁现场力量', ownerType: '联合执行主体', phase: 'execute', horizon: 'response',
    trigger: '增援和分流物资到位。', decision: '在关键通道控速，引导不同线路旅客改走南北广场其他入口。', authority: '现场秩序控制、旅客引导和车站运营组织。', collaborators: ['增援警力', '平安合伙人', '站区服务人员'], boundary: '绕行跨越站内外责任区域，广播、标识和人员口径必须一致。', outcome: '进入站台的速度下降，对冲客流被拆分至多个入口。', view: 'station', focusPoint: [0, 0.2, -11],
  },
  {
    id: 'recover', label: '动态复核', time: '持续监测', owner: '地铁公安综合指挥室与南京地铁', ownerType: '措施调整主体', phase: 'assure', horizon: 'response',
    trigger: '热力图和现场通行速度开始回落。', decision: '持续比较站台、通道和出入口负荷，决定维持、收缩或解除截流。', authority: '各自在公共安全和运营系统内调整现场措施。', collaborators: ['现场民警', '地铁运营岗位', '站区服务力量'], boundary: '不能只凭单一热力值解除措施，需确认各层客流均已稳定。', outcome: '对冲逐步消退，通道和入口按现场条件恢复。', view: 'metro', focusPoint: [0, -0.4, 0.8],
  },
  {
    id: 'review', label: '事后复盘', time: '事件结束后', owner: '地铁公安与南京地铁相关单位', ownerType: '运行复盘主体', phase: 'learn', horizon: 'recovery',
    trigger: '大客流处置完成。', decision: '依据客流统计和现场记录复核预警阈值、警力、物资与绕行安排。', authority: '各主体在本系统内开展复盘和预案优化。', collaborators: ['南京地铁', '站区协同单位'], boundary: '公开材料未给出完整跨部门复盘会议过程，沙盘仅呈现应有机制。', outcome: '当日经验转化为下次保障的阈值和资源配置依据。', view: 'overview', focusPoint: [0, 3.5, 0],
  },
];

const aiStages: DecisionStage[] = [
  {
    id: 'detect', label: '算法发现', time: 'T+00', owner: '城市小脑与算法系统', ownerType: '问题线索生成工具', phase: 'signal', horizon: 'response',
    trigger: '摄像头、巡检设备、人员或市民报事产生异常线索。', decision: '记录位置、图像与疑似问题类型。', authority: '算法没有行政或管理决定权，只能提供线索和分类建议。', collaborators: ['物联设备', 'AI 巡逻车', '人员上报', '市民报事'], boundary: '识别结果可能误报，不能直接作为违法认定或完工证明。', outcome: '疑似问题进入平台待研判队列。', view: 'workorder', focusPoint: [-11, 0.15, -8],
  },
  {
    id: 'classify', label: '规则研判', time: 'T+规则', owner: '平台规则引擎与后台调度员', ownerType: '事项分类主体', phase: 'classify', horizon: 'response',
    trigger: '新线索进入待研判队列。', decision: '匹配位置、事项、资产、合同标准、责任主体和处置时限。', authority: '按既有规则提出归口建议，由后台人员确认。', collaborators: ['交控万物运行中心', '业务规则维护人员'], boundary: '规则引擎可以转译既有责任清单，不能自行创设行政权限。', outcome: '线索被标记为服务事项、需人工确认事项或行政转交事项。', view: 'workorder', focusPoint: [-7, 0.2, -4],
  },
  {
    id: 'dispatch', label: '确认派单', time: 'T+派单', owner: '交控万物后台调度员', ownerType: '任务编排与派发主体', phase: 'authorize', horizon: 'response',
    trigger: '事项分类和责任范围完成初步匹配。', decision: '确认工单内容，派给附近云城队长、专业队伍或无人设备。', authority: '在合同和服务范围内组织任务、设定时限和升级条件。', collaborators: ['云城队长', '专业服务队伍', '项目值班负责人'], boundary: '超出合同、资产或行政权限的事项必须转派或上报。', outcome: '人员、位置、事项、标准和时限形成可追踪任务。', view: 'workorder', focusPoint: [-5, 0.2, -3],
  },
  {
    id: 'verify', label: '到场核验', time: 'T+现场', owner: '云城队长或专业人员', ownerType: '现场事实核验主体', phase: 'verify', horizon: 'response',
    trigger: '移动端接单并导航至现场。', decision: '确认问题是否存在、位置是否准确、事项分类与现场条件是否相符。', authority: '巡查、拍照、定位、服务判断和信息上报。', collaborators: ['专业维修人员', '服务点人员'], boundary: '现场人员不能把平台标签直接当作违法认定。', outcome: '误报被退回；真实事项进入服务处置或权限转交。', view: 'workorder', focusPoint: [-2, 0.2, 0],
  },
  {
    id: 'service', label: '服务处置', time: '核验后', owner: '云城队长或专业服务班组', ownerType: '合同服务执行主体', phase: 'execute', horizon: 'response',
    trigger: '事项属于合同授权范围，可通过清理、维护、劝导或信息服务解决。', decision: '按作业标准完成处置，记录过程并上传处置后照片。', authority: '合同范围内的保洁、维修、秩序服务、劝导与信息传递。', collaborators: ['交控万物运行中心', '相关专业班组'], boundary: '不能处罚车辆、扣押物品或实施行政强制。', outcome: '可服务事项在统一执行界面内完成。', view: 'workorder', focusPoint: [2.5, 0.2, 1],
  },
  {
    id: 'handoff', label: '执法转交', time: '条件触发', owner: '具有法定职权的城管或公安交管部门', ownerType: '行政执法决定主体', phase: 'authorize', horizon: 'response',
    trigger: '劝导无效，且事项涉及违法认定、处罚或强制措施。', decision: '接收现场证据，依法调查并决定是否采取行政执法措施。', authority: '法律授权范围内的行政检查、处罚或交通管理。', collaborators: ['交控万物现场人员', '南站地区综管办'], boundary: '平台企业不能借助 AI 或总包合同越过执法权边界。', outcome: '服务事项与执法事项在权限门完成责任交接。', view: 'boundary', focusPoint: [7, 0.2, 0],
  },
  {
    id: 'review', label: '复核与学习', time: '处置后', owner: '后台复核人员与规则维护人员', ownerType: '履约复核与规则修正主体', phase: 'learn', horizon: 'recovery',
    trigger: '现场上传处置结果或法定部门返回办理状态。', decision: '比对前后记录，确认完成、退回补处，并汇总误报和转交数据。', authority: '服务合同范围内的质量复核、规则建议和资源调整。', collaborators: ['现场人员', '项目管理人员', '相关法定部门'], boundary: '平台数据可辅助改进，但不能替代执法文书、部门数据和法定监督。', outcome: '处置结果回到规则、人员和作业计划，形成中枢与边缘的迭代。', view: 'workorder', focusPoint: [10, 0.2, 0],
  },
];

export function assembleScenarios(base: Scenario[]): Scenario[] {
  const after = base.map<Scenario>((scenario) => {
    if (scenario.id === 'metro_peak') {
      return { ...scenario, era: 'after' as const, stages: crowdStages };
    }
    if (scenario.id === 'parking_boundary') {
      return {
        ...scenario,
        era: 'after' as const,
        sourceNote: `${scenario.sourceNote} 主流程中的 T+ 标记为教学推演，不是历史处置时长。`,
        stages: parkingStages,
        followUps: [{
          label: 'P1、P2 共用入口与内部流线调整',
          time: '2026-06',
          description: '后续公开更新：P1 原出口调整为 P1、P2 共用入口，并重排内部流线。该项属于设施治理，不与单次现场处置混列。',
          owner: '市交通运输局牵头的多部门协同',
          evidenceLabel: '公开事实更新',
        }],
      };
    }
    if (scenario.id === 'ai_workorder') {
      return { ...scenario, era: 'after' as const, stages: aiStages };
    }
    if (scenario.id !== 'overview') return { ...scenario, era: 'after' as const };
    return {
      ...scenario,
      era: 'after' as const,
      name: '整体发包与统一执行界面',
      shortName: '多甲方对一乙方',
      date: '2024—至今',
      status: '平台化运行：权力边界不变、执行界面归并',
      evidenceLabel: '平台化机制复原',
      summary: '铁投与万物云共同组建交控万物，将分散服务归并为整体服务包。平台统一受理、调度和验收，但不接管行政执法、属地责任、数据主权和资产权属。',
      metric: '多甲方对一乙方',
      sourceNote: '依据案例对交控万物成立、整体服务采购和平台化运行的描述复原；不将企业执行权等同于行政权。',
      dataPoints: [
        { label: '组织载体', value: '交控万物', note: '铁投×万物云' },
        { label: '合同界面', value: '多对一', note: '多甲方对一乙方' },
        { label: '权力原则', value: '边界保留', note: '平台不替代执法' },
      ],
      stages: [
        { id: 'package', label: '归并服务需求', time: '常态', owner: '站区各资产与管理甲方', ownerType: '采购与治理需求主体', trigger: '分散采购造成服务接缝和重复协调。', decision: '把可市场化的保洁、秩序、设施等服务归并为整体需求。', authority: '在各自预算、资产和管理职责内提出采购要求。', collaborators: ['交通集团与铁投', '属地管理机构', '相关资产和运营单位'], boundary: '法定行政职责和执法权不能作为服务项目外包。', outcome: '形成多甲方共同面对一个服务总接口的条件。', view: 'overview', focusPoint: [0, 1.2, 12] },
        { id: 'contract', label: '确定整体服务合同', time: '启动期', owner: '铁投与相关甲方', ownerType: '合同决策主体', trigger: '服务范围、标准、费用和责任需要统一。', decision: '明确交控万物的总服务范围、接口和考核办法。', authority: '采购、合同管理、资产运营与履约监督。', collaborators: ['交控万物', '原服务单位', '法务与财务部门'], boundary: '合同只能配置运营和服务责任，不能创设行政权力。', outcome: '形成“多甲方对一乙方”的合同界面。', view: 'overview', focusPoint: [0, 1.3, 12] },
        { id: 'standard', label: '归集规则与清单', time: '上线前', owner: '交控万物平台运行中心', ownerType: '规则转译主体', trigger: '不同甲方仍保留各自专业标准和责任边界。', decision: '把规则转成可分类、可派单、可验收的责任清单。', authority: '合同内流程设计、班组配置和服务标准执行。', collaborators: ['各甲方业务部门', '综管办', '专业运营单位'], boundary: '平台可以转译规则，不能自行改变规则制定权。', outcome: '分散要求进入同一个执行界面。', view: 'workorder', focusPoint: [-3, 0.4, 2] },
        { id: 'dispatch', label: '统一调度现场服务', time: '运行期', owner: '交控万物运行中心', ownerType: '现场执行调度主体', trigger: '平台收到巡查、设备或旅客服务线索。', decision: '分类派给现场团队，跨专业事项由统一接口协调。', authority: '合同范围内派工、人员调度、过程留痕和升级转报。', collaborators: ['云城队长与专业班组', '属地管理机构', '铁路与地铁运营主体'], boundary: '遇到执法、应急指挥或数据授权事项，必须移交法定主体。', outcome: '小问题减少在服务合同接缝处停留。', view: 'workorder', focusPoint: [0, 0.5, 4] },
        { id: 'review', label: '联合验收与复盘', time: '周期性', owner: '多甲方与法定责任部门', ownerType: '监督与责任确认主体', trigger: '工单完成、投诉回访或治理指标出现变化。', decision: '共同核对服务结果、合同履约和法定责任。', authority: '验收、考核、整改、监督和依法追责。', collaborators: ['交控万物', '综管办', '专业部门与运营单位'], boundary: '统一执行结果不能掩盖各甲方和行政主体的最终责任。', outcome: '运行数据回到治理与合同调整环节。', view: 'overview', focusPoint: [0, 1.1, -10] },
      ],
    };
  });
  return [...PRE_ENTRY_SCENARIOS, ...after];
}

export function assembleDepartments(base: DepartmentMap): DepartmentMap {
  return {
    ...base,
    pre_boundary: baseDepartments,
    pre_departments: baseDepartments,
    pre_outsourcing: contractorDepartments,
  } as DepartmentMap;
}

export const FIRST_SCENARIO_BY_ERA: Record<GovernanceEra, ScenarioId> = {
  before: 'pre_boundary',
  after: 'overview',
};
