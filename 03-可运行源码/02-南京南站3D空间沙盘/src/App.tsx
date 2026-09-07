import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { StationScene } from './StationScene';
import { getDecisionExercise, getDecisionRoles, GOVERNANCE_CHAINS } from './governance';
import { assembleDepartments, assembleScenarios, ERA_META, FIRST_SCENARIO_BY_ERA } from './governanceScenarios';
import type { DepartmentMap, GovernanceEra, LayerMode, OverlayId, Scenario, ScenarioId, StationFact } from './types';

declare global {
  interface Window {
    __STATION_DATA__?: {
      scenarios: Scenario[];
      departments: DepartmentMap;
      facts: StationFact[];
    };
  }
}

const evidenceLabels: Record<Scenario['evidenceType'], string> = {
  'actual-event': '真实事件',
  'case-reconstruction': '案例复原',
  'mechanism-simulation': '机制推演',
};

const phaseLabels = {
  signal: '信号', verify: '核验', classify: '归口', authorize: '授权', execute: '执行', assure: '复核', learn: '学习',
} as const;

const horizonLabels = {
  prevention: '保障准备', response: '现场处置', recovery: '恢复改进',
} as const;

const layerOptions: { id: LayerMode; label: string; level: string }[] = [
  { id: 'cad', label: 'CAD', level: '底图' },
  { id: 'all', label: '全层', level: '立体' },
  { id: 'hall', label: '候车', level: '高架' },
  { id: 'platform', label: '站台', level: '铁路' },
  { id: 'transfer', label: '换乘', level: '地面' },
  { id: 'metro', label: '地铁', level: 'B1/B2' },
];

const overlayOptions: { id: OverlayId; label: string }[] = [
  { id: 'flow', label: '客流与车流' },
  { id: 'jurisdiction', label: '行政区边界' },
  { id: 'governance', label: '九类治理链条' },
  { id: 'assets', label: '资产与运营权' },
  { id: 'tasks', label: '工单流转' },
];

function PlayIcon({ running }: { running: boolean }) {
  return running ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z" /></svg>
  );
}

function FoldIcon({ side, collapsed }: { side: 'left' | 'right'; collapsed: boolean }) {
  const points = side === 'left'
    ? (collapsed ? '9 5 16 12 9 19' : '15 5 8 12 15 19')
    : (collapsed ? '15 5 8 12 15 19' : '9 5 16 12 9 19');
  return <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points={points} /></svg>;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const width = Math.max(0, Math.min(100, (value + 3) / 6 * 100));
  return <div className="score-bar"><span>{label}</span><i><b style={{ width: `${width}%` }} /></i><strong>{value > 0 ? `+${value}` : value}</strong></div>;
}

export default function App() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [departments, setDepartments] = useState<DepartmentMap | null>(null);
  const [facts, setFacts] = useState<StationFact[]>([]);
  const [activeId, setActiveId] = useState<ScenarioId>('pre_boundary');
  const [stageIndex, setStageIndex] = useState(0);
  const [running, setRunning] = useState(true);
  const [hour, setHour] = useState(14);
  const [layerMode, setLayerMode] = useState<LayerMode>('all');
  const [overlays, setOverlays] = useState<OverlayId[]>(['flow', 'jurisdiction', 'governance']);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [decisionSelections, setDecisionSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    if (window.__STATION_DATA__) {
      setScenarios(assembleScenarios(window.__STATION_DATA__.scenarios));
      setDepartments(assembleDepartments(window.__STATION_DATA__.departments));
      setFacts(window.__STATION_DATA__.facts);
      return;
    }
    Promise.all([
      fetch('./data/scenarios.json').then((response) => response.json()),
      fetch('./data/departments.json').then((response) => response.json()),
      fetch('./data/facts.json').then((response) => response.json()),
    ]).then(([scenarioData, departmentData, factData]) => {
      setScenarios(assembleScenarios(scenarioData as Scenario[]));
      setDepartments(assembleDepartments(departmentData as DepartmentMap));
      setFacts(factData as StationFact[]);
    });
  }, []);

  const active = useMemo(() => scenarios.find((scenario) => scenario.id === activeId), [activeId, scenarios]);
  const activeDepartments = departments?.[activeId] ?? [];
  const stage = active?.stages[Math.min(stageIndex, Math.max(0, active.stages.length - 1))];

  if (!active || !stage) return <main className="loading">正在载入案例沙盘…</main>;

  const exercise = getDecisionExercise(active.id, stage);
  const roles = getDecisionRoles(active.id, stage);
  const era = ERA_META[active.era];
  const visibleScenarios = scenarios.filter((scenario) => scenario.era === active.era);
  const decisionKey = `${active.id}:${stage.id}`;
  const selectedDecision = exercise.options.find((option) => option.id === decisionSelections[decisionKey]);

  const chooseScenario = (scenario: Scenario) => {
    setActiveId(scenario.id);
    setStageIndex(0);
    setHour(Number(scenario.time.split(':')[0]));
    setLayerMode(scenario.id === 'metro_peak' ? 'metro' : 'all');
    if (scenario.id === 'parking_boundary') setOverlays(['flow', 'jurisdiction', 'governance', 'assets']);
    else if (scenario.id === 'ai_workorder') setOverlays(['flow', 'tasks']);
    else setOverlays(['flow', 'jurisdiction', 'governance']);
  };

  const toggleOverlay = (id: OverlayId) => {
    setOverlays((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const chooseEra = (nextEra: GovernanceEra) => {
    const scenario = scenarios.find((item) => item.id === FIRST_SCENARIO_BY_ERA[nextEra]);
    if (scenario) chooseScenario(scenario);
  };

  return (
    <main className={`app-shell${leftCollapsed ? ' left-collapsed' : ''}${rightCollapsed ? ' right-collapsed' : ''}`}>
      <header className="topbar">
        <div className="brand-block">
          <span className="institution-mark" aria-hidden="true"><img src="./sppm-seal.webp" alt="" /></span>
          <p>清华大学 · 2026 中国智能社会治理公共政策案例分析大赛</p>
        </div>
        <div className="topbar-title"><h1>南京南站治理运行沙盘</h1></div>
        <div className="top-actions">
          <div className="team-lockup" aria-label="南雍治道团队">
            <span className="team-mark" aria-hidden="true"><img src="./nanyong-mark.svg" alt="" /></span>
            <strong>南雍治道</strong>
          </div>
        </div>
      </header>

      <aside className={`case-panel${leftCollapsed ? ' collapsed' : ''}`} id="controls" aria-label="案例与场景控制">
        <button className="collapse-button" onClick={() => setLeftCollapsed((value) => !value)} aria-expanded={!leftCollapsed} aria-controls="case-panel-content" aria-label={leftCollapsed ? '展开左侧案例看板' : '折叠左侧案例看板'} title={leftCollapsed ? '展开案例看板' : '折叠案例看板'}><FoldIcon side="left" collapsed={leftCollapsed} /></button>
        {leftCollapsed && <span className="collapsed-rail" aria-hidden="true">案例与图层</span>}
        <div className="panel-scroll" id="case-panel-content">
        <div className="panel-heading">
          <div><small>CASE RECONSTRUCTION</small><h2>案例情景</h2></div>
          <button className="icon-button" onClick={() => setRunning((value) => !value)} aria-label={running ? '暂停动态模拟' : '继续动态模拟'}><PlayIcon running={running} /></button>
        </div>

        <section className={`era-switch ${active.era}`} aria-label="治理环境切换">
          <div className="section-label"><b>两大治理环境</b><span>前后对照</span></div>
          <div role="group" aria-label="选择交控万物进场前后环境">
            {(Object.keys(ERA_META) as GovernanceEra[]).map((eraId) => {
              const item = ERA_META[eraId];
              return <button key={eraId} className={active.era === eraId ? 'active' : ''} onClick={() => chooseEra(eraId)} aria-pressed={active.era === eraId}><small>{item.years}</small><strong>{item.label}</strong><span>{item.title}</span></button>;
            })}
          </div>
          <p>{era.description}</p>
          <ul>{era.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
        </section>

        <div className="scenario-list">
          <div className="scenario-list-label"><span>{era.label} · 决策情景</span><b>{visibleScenarios.length} 个</b></div>
          {visibleScenarios.map((scenario, index) => (
            <button key={scenario.id} className={scenario.id === activeId ? 'active' : ''} onClick={() => chooseScenario(scenario)} aria-pressed={scenario.id === activeId}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div><strong>{scenario.name}</strong><small>{scenario.shortName}</small></div>
              <i className={scenario.evidenceType}>{evidenceLabels[scenario.evidenceType]}</i>
            </button>
          ))}
        </div>

        <section className="case-abstract">
          <div className="eyebrow"><span>{active.evidenceLabel}</span><b>{active.time}</b></div>
          <p>{active.summary}</p>
        </section>

        <section className="data-strip" aria-label="场景关键数据">
          {active.dataPoints.map((point) => <div key={point.label}><span>{point.label}</span><strong>{point.value}</strong><small>{point.note}</small></div>)}
        </section>

        <section className={`governance-summary ${active.era}`} aria-label="当前治理环境摘要">
          {active.era === 'before' ? <>
            <div><strong>2</strong><span>平行属地</span><small>雨花台·江宁</small></div>
            <div><strong>14</strong><span>单位与部门</span><small>历史报道口径</small></div>
            <div><strong>多对多</strong><span>外包关系</span><small>多个甲乙方</small></div>
          </> : <>
            <div><strong>1</strong><span>统一执行界面</span><small>交控万物</small></div>
            <div><strong>7 环节</strong><span>智能工单</span><small>感知至学习</small></div>
            <div><strong>4</strong><span>刚性边界</span><small>执法·数据·产权·属地</small></div>
          </>}
        </section>

        <section className="control-section">
          <div className="section-label"><b>空间分层</b><span>五层运行逻辑</span></div>
          <div className="layer-switch" role="group" aria-label="空间层次">
            {layerOptions.map((option) => <button key={option.id} className={layerMode === option.id ? 'active' : ''} onClick={() => setLayerMode(option.id)} aria-pressed={layerMode === option.id}><strong>{option.label}</strong><small>{option.level}</small></button>)}
          </div>
        </section>

        <section className="control-section">
          <div className="section-label"><b>治理图层</b><span>可叠加</span></div>
          <div className="overlay-list">
            {overlayOptions.map((option) => <button key={option.id} className={overlays.includes(option.id) ? 'active' : ''} onClick={() => toggleOverlay(option.id)} aria-pressed={overlays.includes(option.id)}><i></i>{option.label}</button>)}
          </div>
        </section>

        <label className="range-control" htmlFor="time-control"><span><b>演示时刻</b><output>{String(hour).padStart(2, '0')}:00</output></span><input id="time-control" type="range" min="0" max="23" value={hour} onChange={(event) => setHour(Number(event.target.value))} /></label>
        </div>
      </aside>

      <section className="viewport" aria-label="南京南站三维案例复原模型">
        <Canvas dpr={[1, 1.65]} camera={{ position: [31, 25, 35], fov: 40, near: 0.1, far: 260 }} gl={{ antialias: true, powerPreference: 'high-performance' }} shadows>
          <Suspense fallback={null}><StationScene scenario={active} stage={stage} running={running} hour={hour} layerMode={layerMode} overlays={overlays} /></Suspense>
        </Canvas>
        <div className="scene-title"><small>NOW FOCUSING</small><strong>{stage.label}</strong><span>{stage.owner}</span></div>
        <div className={`environment-banner ${active.era}`} aria-live="polite"><small>{era.years}</small><strong>{era.label} · {era.title}</strong><span>{active.era === 'before' ? '分散责任界面' : '统一执行界面，法定边界保留'}</span></div>
        <div className="orientation" aria-hidden="true"><i></i><span>北</span></div>
        <div className="scene-legend" aria-label="场景图例">
          <span><i className="rail"></i>铁路客流</span><span><i className="metro"></i>地铁换乘</span><span><i className="road"></i>地面车流</span><span><i className="boundary-key"></i>权限交接</span>
        </div>
        <div className="model-note">{layerMode === 'cad' ? '公开导向图描摹的拓扑矢量底图 · 北向已校准 · 非施工或测绘 CAD' : '三维几何由同一套矢量底图坐标生成 · 非 BIM 或测绘模型 · 不含内部安全点位'}</div>
      </section>

      <aside className={`decision-panel${rightCollapsed ? ' collapsed' : ''}`} aria-label="决策主体与权限边界">
        <button className="collapse-button" onClick={() => setRightCollapsed((value) => !value)} aria-expanded={!rightCollapsed} aria-controls="decision-panel-content" aria-label={rightCollapsed ? '展开右侧决策看板' : '折叠右侧决策看板'} title={rightCollapsed ? '展开决策看板' : '折叠决策看板'}><FoldIcon side="right" collapsed={rightCollapsed} /></button>
        {rightCollapsed && <span className="collapsed-rail" aria-hidden="true">主体与决策</span>}
        <div className="panel-scroll" id="decision-panel-content">
        <div className="decision-header">
          <div><small>DECISION SUBJECT</small><h2>谁在此刻决定</h2></div>
          <span>{stage.time}</span>
        </div>

        <section className={`decision-environment ${active.era}`}>
          <small>{era.years}</small><strong>{era.label} · {era.title}</strong><span>{active.name}</span>
        </section>

        <section className="owner-card">
          <small>{stage.horizon ? `${horizonLabels[stage.horizon]} · ` : ''}{stage.phase ? `${phaseLabels[stage.phase]} · ` : ''}{stage.ownerType}</small><h3>{stage.owner}</h3><p>{stage.decision}</p>
        </section>

        <section className="decision-chain" aria-label="行政决策互动链">
          <div className="chain-node signal"><small>01 触发</small><strong>{stage.trigger}</strong></div>
          <div className="chain-node"><small>02 提出</small><strong>{roles.proposer}</strong></div>
          <div className="chain-node primary"><small>03 拍板</small><strong>{roles.decider}</strong></div>
          <div className="chain-node"><small>04 执行</small><strong>{roles.executor}</strong></div>
          <div className="chain-node"><small>05 监督</small><strong>{roles.supervisor}</strong></div>
          <div className="chain-node boundary"><small>06 边界</small><strong>{stage.boundary}</strong></div>
        </section>

        <dl className="decision-facts compact-facts">
          <div><dt>可用权限</dt><dd>{stage.authority}</dd></div>
          <div><dt>阶段结果</dt><dd>{stage.outcome}</dd></div>
        </dl>

        <section className="collaborators">
          <div className="section-title"><small>COORDINATION</small><h2>配合主体</h2></div>
          <ul>{stage.collaborators.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="decision-lab" aria-labelledby="decision-lab-title">
          <div className="section-title"><small>DECISION LAB</small><h2 id="decision-lab-title">本轮决策推演</h2></div>
          <p className="decision-prompt">{exercise.prompt}</p>
          <p className="decision-tension">{exercise.tension}</p>
          <div className="decision-options" role="group" aria-label="决策备选方案">
            {exercise.options.map((option, index) => (
              <button key={option.id} className={`${option.tone}${selectedDecision?.id === option.id ? ' selected' : ''}`} onClick={() => setDecisionSelections((current) => ({ ...current, [decisionKey]: option.id }))} aria-pressed={selectedDecision?.id === option.id}>
                <span>{String.fromCharCode(65 + index)}</span><div><strong>{option.label}</strong><small>{option.action}</small></div>
              </button>
            ))}
          </div>
          {selectedDecision ? (
            <div className={`decision-result ${selectedDecision.tone}`} aria-live="polite">
              <small>模拟后果</small><p>{selectedDecision.consequence}</p>
              <div className="score-grid"><ScoreBar label="速度" value={selectedDecision.scores.speed} /><ScoreBar label="协同" value={selectedDecision.scores.coordination} /><ScoreBar label="合法性" value={selectedDecision.scores.legitimacy} /></div>
            </div>
          ) : <p className="decision-empty">选择一项后查看效率、协同与合法性的变化。</p>}
          <small className="simulation-disclaimer">教学推演：结果用于对比权责与协同逻辑，不是现实应急指令。</small>
        </section>

        <details className="governance-drawer">
          <summary><span><small>MULTI-ACTOR MAP</small><b>九类治理链条</b></span><i aria-hidden="true">+</i></summary>
          <div className="governance-list">
            <p>“九类”是为展示“九龙治水”而作的教学归类；案例涉及的实际单位超过此数。</p>
            {GOVERNANCE_CHAINS.map((chain, index) => <article key={chain.id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{chain.name}</strong><small>{chain.scope}</small><em>{chain.limit}</em></div></article>)}
          </div>
        </details>

        <details className="department-drawer">
          <summary><span><small>RESPONSIBILITY MAP</small><b>查看本情景全部主体</b></span><i aria-hidden="true">+</i></summary>
          <div>{activeDepartments.map((department) => <article key={department.name}><header><strong>{department.name}</strong><span>{department.state}</span></header><p>{department.role}</p><dl><div><dt>权限</dt><dd>{department.authority}</dd></div><div><dt>边界</dt><dd>{department.boundary}</dd></div></dl></article>)}</div>
        </details>

        <details className="source-drawer">
          <summary><span><small>EVIDENCE</small><b>数据口径与证据</b></span><i aria-hidden="true">+</i></summary>
          <div className="source-content"><p><strong>{active.metric}</strong>{active.sourceNote}</p><ul>{active.sources.map((source) => <li key={source.label}>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.label}</a> : source.label}</li>)}</ul><p>事实库共收录 {facts.length} 项已核口径。</p></div>
        </details>
        </div>
      </aside>

      <footer className={`timeline${active.id === 'ai_workorder' ? ' intelligent-chain' : ''}${active.id === 'metro_peak' ? ' crowd-chain' : ''}`} aria-label="决策过程" aria-live="polite">
        <div className="timeline-title"><small>{active.id === 'ai_workorder' ? 'INTELLIGENT CHAIN' : active.id === 'metro_peak' ? 'CROWD RESPONSE' : 'EVENT CHAIN'}</small><b>{active.id === 'ai_workorder' ? '智能处置过程' : active.id === 'metro_peak' ? '大客流处置过程' : '决策过程'}</b><span>{active.stages.length} 个环节 · 跨时段追踪</span></div>
        <div className="timeline-steps" style={{ gridTemplateColumns: `repeat(${active.stages.length}, minmax(90px, 1fr))` }}>
          {active.stages.map((item, index) => {
            const processLabel = [item.horizon ? horizonLabels[item.horizon] : '', item.phase ? phaseLabels[item.phase] : item.ownerType].filter(Boolean).join(' · ');
            return <button key={item.id} data-horizon={item.horizon} className={index === stageIndex ? 'active' : index < stageIndex ? 'passed' : ''} onClick={() => setStageIndex(index)} aria-current={index === stageIndex ? 'step' : undefined} aria-label={`${item.time} ${item.label}：${item.ownerType}`}><i><b>{String(index + 1).padStart(2, '0')}</b></i><span>{item.time}</span><strong>{item.label}</strong><em>{processLabel}</em></button>;
          })}
        </div>
        <div className="timeline-insight"><small>{stage.horizon ? horizonLabels[stage.horizon] : '当前现场'} · {stage.phase ? phaseLabels[stage.phase] : '决策'}</small><strong>{stage.outcome}</strong>{active.followUps?.[0] ? <span className="timeline-followup"><b>{active.followUps[0].evidenceLabel} · {active.followUps[0].time}</b>{active.followUps[0].label}</span> : <span>点击节点追踪人员、客流与决策权移动</span>}</div>
      </footer>
    </main>
  );
}
