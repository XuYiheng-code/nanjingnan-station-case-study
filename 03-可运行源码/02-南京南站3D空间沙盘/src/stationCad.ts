export type CadPoint = [number, number];

export type CadNode = {
  id: string;
  label: string;
  kind: 'exit' | 'parking' | 'transport';
  point: CadPoint;
  evidence: 'station-guide' | 'official-publication' | 'case-material' | 'unverified';
  note?: string;
};

/**
 * 教学模型坐标：X 向东为正，Z 向南为正，1 单位约等于 10 米。
 * 这是一套从公开导向图描摹的拓扑底图，不是测绘或施工 CAD。
 */
export const STATION_CAD = {
  coordinateSystem: {
    xAxis: '西 → 东',
    zAxis: '北 → 南',
    north: [0, -1] as CadPoint,
    approximateMetersPerUnit: 10,
  },
  sourceNotes: [
    '案例正文内嵌“空间层次”图：校核五层空间与治理主体关系。',
    '南京南站站内“平面示意图”：校核 1F 到达层、2F 站台层、3F 出发层。',
    '南京南站一层导示图实拍：校核南北广场、13 个出口、江南路与六朝路。',
    '精确轴网、柱距、坡道曲线和停车场内部边界尚无公开施工图，均不得解释为测绘值。',
  ],
  envelope: { width: 30.5, depth: 18.4 },
  hall: { width: 25.8, depth: 14.8 },
  tracks: Array.from({ length: 28 }, (_, index) => -7.9 + index * (15.8 / 27)),
  platforms: Array.from({ length: 15 }, (_, index) => -7.6 + index * (15.2 / 14)),
  roads: [
    { id: 'jiangnan-road', label: '江南路', x: -18.4, fromZ: -17, toZ: 17 },
    { id: 'liuchao-road', label: '六朝路', x: 18.4, fromZ: -17, toZ: 17 },
  ],
  plazas: [
    { id: 'north-plaza', label: '北广场', center: [0, -13.2] as CadPoint, width: 31, depth: 6.4 },
    { id: 'south-plaza', label: '南广场', center: [0, 13.2] as CadPoint, width: 31, depth: 6.4 },
  ],
  arrivalSpine: [
    [0, -11.2], [0, -8.2], [-2.8, -8.2], [-2.8, -6.3], [0, -6.3],
    [0, -3.9], [2.6, -3.9], [2.6, -1.0], [0.8, -1.0], [0.8, 3.2],
    [2.4, 3.2], [2.4, 7.9], [0, 7.9], [0, 11.8],
  ] as CadPoint[],
  nodes: [
    { id: 'exit-1', label: '1', kind: 'exit', point: [-3.9, -4.2], evidence: 'station-guide' },
    { id: 'exit-2', label: '2', kind: 'exit', point: [3.6, -1.0], evidence: 'station-guide' },
    { id: 'exit-3', label: '3', kind: 'exit', point: [3.6, 3.0], evidence: 'station-guide' },
    { id: 'exit-4', label: '4', kind: 'exit', point: [3.6, 7.9], evidence: 'station-guide' },
    { id: 'exit-5', label: '5', kind: 'exit', point: [-4.0, 10.4], evidence: 'station-guide' },
    { id: 'exit-6', label: '6', kind: 'exit', point: [4.0, 10.4], evidence: 'station-guide' },
    { id: 'exit-7', label: '7', kind: 'exit', point: [4.0, -4.2], evidence: 'station-guide' },
    { id: 'exit-8', label: '8', kind: 'exit', point: [-4.0, -7.6], evidence: 'station-guide' },
    { id: 'exit-9', label: '9', kind: 'exit', point: [-4.0, -9.5], evidence: 'station-guide' },
    { id: 'exit-10', label: '10', kind: 'exit', point: [4.0, -9.5], evidence: 'station-guide' },
    { id: 'exit-11', label: '11', kind: 'exit', point: [4.0, -7.6], evidence: 'station-guide' },
    { id: 'exit-12', label: '12', kind: 'exit', point: [-0.8, -11.1], evidence: 'unverified', note: '公开导示照片中未清晰辨认，保留待核。' },
    { id: 'exit-13', label: '13', kind: 'exit', point: [0, 11.8], evidence: 'station-guide' },
    { id: 'p1', label: 'P1', kind: 'parking', point: [15.4, -2.8], evidence: 'station-guide', note: '导示图标为大型车辆地面停车，设施功能可能随改造变化。' },
    { id: 'p2', label: 'P2', kind: 'parking', point: [11.9, -0.2], evidence: 'station-guide', note: '地下停车。' },
    { id: 'p3', label: 'P3', kind: 'parking', point: [12.2, 3.0], evidence: 'station-guide', note: '导示图标为地面停车，后续口径待核。' },
    { id: 'p4', label: 'P4', kind: 'parking', point: [-12.4, 2.7], evidence: 'station-guide', note: '地下停车。' },
    { id: 'p5', label: 'P5', kind: 'parking', point: [0, -14.3], evidence: 'station-guide', note: '北广场地下停车。' },
    { id: 'p6', label: 'P6', kind: 'parking', point: [0, 14.4], evidence: 'station-guide', note: '南广场地下停车。' },
    { id: 'p7', label: 'P7', kind: 'parking', point: [-12.6, 8.8], evidence: 'official-publication', note: '2024 年官方口径包含 P7，精确入口位置待更清晰底图校核。' },
    { id: 'p8', label: 'P8', kind: 'parking', point: [-15.1, 12.2], evidence: 'official-publication', note: '2026 年新增地面停车场，位置为公开信息基础上的示意。' },
    { id: 'coach', label: '客运南站', kind: 'transport', point: [-11.8, -1.4], evidence: 'station-guide' },
    { id: 'bus', label: '公交枢纽', kind: 'transport', point: [-11.8, 7.2], evidence: 'station-guide' },
  ] as CadNode[],
} as const;

export const CAD_EXIT_NODES = STATION_CAD.nodes.filter((node) => node.kind === 'exit');
export const CAD_PARKING_NODES = STATION_CAD.nodes.filter((node) => node.kind === 'parking');

