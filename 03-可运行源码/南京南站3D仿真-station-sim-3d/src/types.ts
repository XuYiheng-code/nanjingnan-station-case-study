export type ScenarioId =
  | 'pre_boundary'
  | 'pre_departments'
  | 'pre_outsourcing'
  | 'overview'
  | 'metro_peak'
  | 'parking_boundary'
  | 'ai_workorder';

export type GovernanceEra = 'before' | 'after';

export type EvidenceType = 'actual-event' | 'case-reconstruction' | 'mechanism-simulation';
export type LayerMode = 'cad' | 'all' | 'hall' | 'platform' | 'transfer' | 'metro';
export type OverlayId = 'flow' | 'jurisdiction' | 'governance' | 'assets' | 'tasks';
export type SceneView = 'cad' | 'overview' | 'station' | 'metro' | 'parking' | 'boundary' | 'workorder';

export type EvidenceSource = { label: string; url?: string };
export type DataPoint = { label: string; value: string; note: string };
export type DecisionPhase = 'signal' | 'verify' | 'classify' | 'authorize' | 'execute' | 'assure' | 'learn';
export type DecisionHorizon = 'prevention' | 'response' | 'recovery';

export type ScenarioFollowUp = {
  label: string;
  time: string;
  description: string;
  owner: string;
  evidenceLabel: string;
};

export type DecisionStage = {
  id: string;
  label: string;
  time: string;
  owner: string;
  ownerType: string;
  trigger: string;
  decision: string;
  authority: string;
  collaborators: string[];
  boundary: string;
  outcome: string;
  view: SceneView;
  focusPoint: [number, number, number];
  phase?: DecisionPhase;
  horizon?: DecisionHorizon;
};

export type Scenario = {
  id: ScenarioId;
  era: GovernanceEra;
  name: string;
  shortName: string;
  date: string;
  time: string;
  status: string;
  evidenceType: EvidenceType;
  evidenceLabel: string;
  summary: string;
  metric: string;
  sourceNote: string;
  flowIndex: number;
  particleCount: number;
  speed: number;
  dataPoints: DataPoint[];
  sources: EvidenceSource[];
  stages: DecisionStage[];
  followUps?: ScenarioFollowUp[];
};

export type EraMeta = {
  id: GovernanceEra;
  label: string;
  years: string;
  title: string;
  description: string;
  tags: string[];
};

export type DecisionRoles = {
  proposer: string;
  decider: string;
  executor: string;
  supervisor: string;
};

export type Department = {
  name: string;
  type: string;
  role: string;
  authority: string;
  boundary: string;
  state: string;
};

export type DecisionOption = {
  id: 'bounded' | 'coordinated' | 'overreach';
  label: string;
  action: string;
  consequence: string;
  tone: 'steady' | 'recommended' | 'risk';
  scores: { speed: number; coordination: number; legitimacy: number };
};

export type DecisionExercise = {
  prompt: string;
  tension: string;
  options: DecisionOption[];
};

export type DepartmentMap = Record<ScenarioId, Department[]>;

export type StationFact = {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  metricDefinition: string;
  timeRange: string;
  sourceType: string;
  source: string;
  url?: string;
  status: string;
};
