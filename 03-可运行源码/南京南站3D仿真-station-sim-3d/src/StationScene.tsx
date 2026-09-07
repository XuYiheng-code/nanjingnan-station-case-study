import { useEffect, useMemo, useRef } from 'react';
import { Html, Line, OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GOVERNANCE_CHAINS } from './governance';
import { CAD_EXIT_NODES, CAD_PARKING_NODES, STATION_CAD } from './stationCad';
import type { DecisionStage, LayerMode, OverlayId, Scenario, SceneView } from './types';

type SceneProps = {
  scenario: Scenario;
  stage: DecisionStage;
  running: boolean;
  hour: number;
  layerMode: LayerMode;
  overlays: OverlayId[];
};

const tempObject = new THREE.Object3D();

function seeded(index: number) {
  const value = Math.sin(index * 91.173 + 17.41) * 43758.5453;
  return value - Math.floor(value);
}

function Flow({
  points,
  count,
  speed,
  color,
  running,
  shape = 'person',
}: {
  points: THREE.Vector3[];
  count: number;
  speed: number;
  color: string;
  running: boolean;
  shape?: 'person' | 'vehicle';
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.18), [points]);
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    if (running) progress.current += delta * speed;
    for (let index = 0; index < count; index += 1) {
      const t = (progress.current + index / count + seeded(index) * 0.08) % 1;
      const position = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      tempObject.position.copy(position);
      tempObject.rotation.set(0, Math.atan2(tangent.x, tangent.z), 0);
      const pulse = 0.8 + seeded(index + 3) * 0.35;
      tempObject.scale.setScalar(pulse);
      tempObject.updateMatrix();
      mesh.current.setMatrixAt(index, tempObject.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      {shape === 'vehicle' ? <boxGeometry args={[0.22, 0.1, 0.42]} /> : <capsuleGeometry args={[0.045, 0.14, 3, 6]} />}
      <meshBasicMaterial color={color} transparent opacity={0.94} toneMapped={false} />
    </instancedMesh>
  );
}

function PersonFigure({ position, color = '#f0a15f', vest, scale = 1 }: { position: [number, number, number]; color?: string; vest?: string; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.53, 0]}><sphereGeometry args={[0.105, 12, 12]} /><meshStandardMaterial color="#d8b08b" /></mesh>
      <mesh position={[0, 0.28, 0]}><capsuleGeometry args={[0.11, 0.24, 4, 8]} /><meshStandardMaterial color={color} /></mesh>
      {vest && <mesh position={[0, 0.32, 0.105]}><boxGeometry args={[0.19, 0.18, 0.018]} /><meshBasicMaterial color={vest} /></mesh>}
      <mesh position={[-0.07, 0.02, 0]} rotation={[0, 0, 0.08]}><capsuleGeometry args={[0.035, 0.2, 3, 6]} /><meshStandardMaterial color="#263238" /></mesh>
      <mesh position={[0.07, 0.02, 0]} rotation={[0, 0, -0.08]}><capsuleGeometry args={[0.035, 0.2, 3, 6]} /><meshStandardMaterial color="#263238" /></mesh>
    </group>
  );
}

function ResponderWalker({ from, to, running, color, vest }: { from: [number, number, number]; to: [number, number, number]; running: boolean; color: string; vest?: string }) {
  const group = useRef<THREE.Group>(null);
  const progress = useRef(0);
  useFrame((_, delta) => {
    if (!group.current) return;
    if (running) progress.current = Math.min(1, progress.current + delta * 0.18);
    const eased = 1 - Math.pow(1 - progress.current, 3);
    group.current.position.set(
      THREE.MathUtils.lerp(from[0], to[0], eased),
      THREE.MathUtils.lerp(from[1], to[1], eased),
      THREE.MathUtils.lerp(from[2], to[2], eased),
    );
    group.current.rotation.y = Math.atan2(to[0] - from[0], to[2] - from[2]);
  });
  return <group ref={group}><PersonFigure position={[0, 0, 0]} color={color} vest={vest} scale={1.28} /></group>;
}

function FacilityLabel({ position, title, tone = 'neutral', detail, compact = false }: { position: [number, number, number]; title: string; tone?: 'neutral' | 'rail' | 'metro' | 'road' | 'boundary'; detail?: string; compact?: boolean }) {
  return (
    <Html position={position} center distanceFactor={24} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div className={`scene-label ${tone}${compact ? ' compact' : ''}`}>
        <b>{title}</b>{detail && <span>{detail}</span>}
      </div>
    </Html>
  );
}

function CadPlanOverlay() {
  const halfEnvelopeX = STATION_CAD.envelope.width / 2;
  const halfEnvelopeZ = STATION_CAD.envelope.depth / 2;
  const halfHallX = STATION_CAD.hall.width / 2;
  const halfHallZ = STATION_CAD.hall.depth / 2;
  const envelope: [number, number, number][] = [
    [-halfEnvelopeX, 0.08, -halfEnvelopeZ], [halfEnvelopeX, 0.08, -halfEnvelopeZ],
    [halfEnvelopeX, 0.08, halfEnvelopeZ], [-halfEnvelopeX, 0.08, halfEnvelopeZ],
    [-halfEnvelopeX, 0.08, -halfEnvelopeZ],
  ];
  const hall: [number, number, number][] = [
    [-halfHallX, 0.1, -halfHallZ], [halfHallX, 0.1, -halfHallZ],
    [halfHallX, 0.1, halfHallZ], [-halfHallX, 0.1, halfHallZ],
    [-halfHallX, 0.1, -halfHallZ],
  ];
  return (
    <group>
      <mesh position={[0, -0.48, 0]} receiveShadow>
        <boxGeometry args={[50, 0.08, 40]} />
        <meshBasicMaterial color="#071318" />
      </mesh>
      <gridHelper args={[50, 50, '#346071', '#18323d']} position={[0, -0.4, 0]} />
      <Line points={envelope} color="#f0d6a1" lineWidth={2.4} />
      <Line points={hall} color="#c7a85e" lineWidth={1.4} dashed dashSize={0.45} gapSize={0.25} />
      {STATION_CAD.tracks.map((z, index) => (
        <Line key={`cad-track-${index}`} points={[[-14.25, 0.02, z], [14.25, 0.02, z]]} color="#66787f" lineWidth={0.65} />
      ))}
      {STATION_CAD.platforms.map((z, index) => (
        <Line key={`cad-platform-${index}`} points={[[-11.9, 0.04, z], [11.9, 0.04, z]]} color="#b8c6c7" lineWidth={2.2} />
      ))}
      {STATION_CAD.roads.map((road) => (
        <group key={road.id}>
          <Line points={[[road.x, 0.08, road.fromZ], [road.x, 0.08, road.toZ]]} color="#f08a4b" lineWidth={5} />
          <Line points={[[road.x, 0.1, road.fromZ], [road.x, 0.1, road.toZ]]} color="#ffd0a4" lineWidth={0.8} dashed dashSize={0.45} gapSize={0.3} />
          <FacilityLabel position={[road.x, 0.25, 7.7]} title={road.label} tone="road" detail={road.x < 0 ? '西侧' : '东侧'} />
        </group>
      ))}
      {STATION_CAD.plazas.map((plaza) => {
        const [x, z] = plaza.center;
        const hx = plaza.width / 2;
        const hz = plaza.depth / 2;
        const outline: [number, number, number][] = [
          [x - hx, 0.06, z - hz], [x + hx, 0.06, z - hz], [x + hx, 0.06, z + hz],
          [x - hx, 0.06, z + hz], [x - hx, 0.06, z - hz],
        ];
        return <Line key={plaza.id} points={outline} color="#75b592" lineWidth={1.35} />;
      })}
      <Line points={STATION_CAD.arrivalSpine.map(([x, z]) => [x, 0.18, z] as [number, number, number])} color="#e35d55" lineWidth={5.4} />
      <Line points={STATION_CAD.arrivalSpine.map(([x, z]) => [x, 0.2, z] as [number, number, number])} color="#ffd1c7" lineWidth={0.75} />
      {CAD_EXIT_NODES.map((node) => {
        const [x, z] = node.point;
        return (
          <group key={node.id} position={[x, 0.24, z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.13, 0.25, 18]} /><meshBasicMaterial color={node.evidence === 'unverified' ? '#718085' : '#f4efe3'} side={THREE.DoubleSide} /></mesh>
            <FacilityLabel position={[0, 0.38, 0]} title={`出口 ${node.label}`} detail={node.evidence === 'unverified' ? '待清晰底图校核' : undefined} />
          </group>
        );
      })}
      {CAD_PARKING_NODES.map((node) => {
        const [x, z] = node.point;
        const tentative = node.id === 'p7' || node.id === 'p8';
        return (
          <group key={node.id} position={[x, 0.16, z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.38, 4]} /><meshBasicMaterial color={tentative ? '#837449' : '#f08a4b'} /></mesh>
            <FacilityLabel position={[0, 0.48, 0]} title={node.label} tone={tentative ? 'boundary' : 'road'} detail={tentative ? '位置待核' : '导示图定位'} />
          </group>
        );
      })}
      <FacilityLabel position={[0, 0.45, -13.3]} title="北广场" detail="北" />
      <FacilityLabel position={[0, 0.45, 13.3]} title="南广场" detail="南" />
      <FacilityLabel position={[0, 0.42, 0]} title="1F 到达主通道" tone="boundary" detail="13 个出口拓扑" />
    </group>
  );
}

function RailYard({ emphasized }: { emphasized: boolean }) {
  const tracks = STATION_CAD.tracks;
  const platforms = STATION_CAD.platforms;
  return (
    <group position={[0, 2.42, 0]}>
      <mesh position={[0, -0.18, 0]} receiveShadow>
        <boxGeometry args={[29, 0.22, 18.2]} />
        <meshStandardMaterial color="#2d3335" roughness={0.94} />
      </mesh>
      {tracks.map((z, index) => (
        <group key={`track-${index}`} position={[0, 0, z]}>
          <mesh><boxGeometry args={[28.5, 0.045, 0.028]} /><meshStandardMaterial color={emphasized ? '#a8b1b1' : '#5f686b'} metalness={0.55} roughness={0.46} /></mesh>
          <mesh position={[0, 0, 0.11]}><boxGeometry args={[28.5, 0.045, 0.028]} /><meshStandardMaterial color={emphasized ? '#a8b1b1' : '#5f686b'} metalness={0.55} roughness={0.46} /></mesh>
        </group>
      ))}
      {platforms.map((z, index) => (
        <group key={`platform-${index}`} position={[0, 0.13, z]}>
          <mesh receiveShadow><boxGeometry args={[23.8, 0.2, 0.38]} /><meshStandardMaterial color={index % 2 ? '#b9b29c' : '#d2c9ae'} roughness={0.88} /></mesh>
          <mesh position={[0, 0.68, 0]}><boxGeometry args={[20.8, 0.07, 0.78]} /><meshStandardMaterial color="#8e897c" metalness={0.18} roughness={0.62} /></mesh>
          {[-9, -3, 3, 9].map((x) => <mesh key={x} position={[x, 0.38, 0]}><boxGeometry args={[0.055, 0.58, 0.055]} /><meshStandardMaterial color="#918b7c" /></mesh>)}
        </group>
      ))}
      {Array.from({ length: 12 }, (_, index) => (
        <mesh key={`canopy-${index}`} position={[-10.8 + index * 1.96, 0.65, 0]}>
          <boxGeometry args={[0.06, 1.1, 17]} />
          <meshStandardMaterial color="#77766e" roughness={0.8} />
        </mesh>
      ))}
      {[-5.1, 0.35, 5.75].map((z, index) => (
        <group key={`train-${z}`} position={[index === 1 ? -1.6 : 1.2, 0.3, z]}>
          <mesh><boxGeometry args={[14.2, 0.46, 0.34]} /><meshStandardMaterial color={index === 1 ? '#e6dfcd' : '#d9e1df'} metalness={0.25} roughness={0.34} /></mesh>
          <mesh position={[0, 0.08, 0.18]}><boxGeometry args={[11.5, 0.12, 0.025]} /><meshBasicMaterial color={index === 1 ? '#cf5d4f' : '#4e84a0'} /></mesh>
          {[-5.2, -3.1, -1, 1.1, 3.2, 5.3].map((x) => <mesh key={x} position={[x, 0.11, -0.18]}><boxGeometry args={[0.7, 0.14, 0.025]} /><meshBasicMaterial color="#183541" /></mesh>)}
        </group>
      ))}
    </group>
  );
}

function WaitingHall({ transparent }: { transparent: boolean }) {
  const columns = Array.from({ length: 12 }, (_, index) => -12.1 + index * 2.2);
  return (
    <group>
      <mesh position={[0, 5.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[STATION_CAD.hall.width, 3.55, STATION_CAD.hall.depth]} />
        <meshStandardMaterial color="#846f52" transparent opacity={transparent ? 0.18 : 0.72} roughness={0.54} depthWrite={!transparent} />
      </mesh>
      <mesh position={[0, 5.08, 7.48]}>
        <boxGeometry args={[22.8, 2.75, 0.11]} />
        <meshPhysicalMaterial color="#152b35" transparent opacity={transparent ? 0.16 : 0.62} roughness={0.18} transmission={transparent ? 0 : 0.18} />
      </mesh>
      <mesh position={[0, 7.05, 0]} castShadow>
        <boxGeometry args={[30.5, 0.34, 18.4]} />
        <meshStandardMaterial color="#c8aa65" metalness={0.08} roughness={0.68} transparent opacity={transparent ? 0.2 : 0.96} />
      </mesh>
      {[-8.4, -5.6, -2.8, 0, 2.8, 5.6, 8.4].map((z) => {
        const height = 7.13 + (1 - Math.abs(z) / 10) * 0.32;
        return <mesh key={`roof-rib-${z}`} position={[0, height, z]}><boxGeometry args={[31.2, 0.09, 0.34]} /><meshStandardMaterial color="#d1b66f" metalness={0.12} roughness={0.58} transparent opacity={transparent ? 0.16 : 0.96} /></mesh>;
      })}
      <mesh position={[0, 7.34, 0]}>
        <boxGeometry args={[5.2, 0.28, 16.3]} />
        <meshStandardMaterial color="#d8d0ba" roughness={0.52} transparent opacity={transparent ? 0.18 : 0.9} />
      </mesh>
      {[-1.65, -0.55, 0.55, 1.65].map((x) => (
        <mesh key={x} position={[x, 7.53, 0]}>
          <boxGeometry args={[0.22, 0.12, 15.4]} />
          <meshBasicMaterial color="#8ca7ad" transparent opacity={transparent ? 0.1 : 0.62} />
        </mesh>
      ))}
      {columns.map((x) => (
        <group key={x}>
          <mesh position={[x, 3.88, 7.8]}><boxGeometry args={[0.18, 2.3, 0.18]} /><meshStandardMaterial color="#ad9b75" /></mesh>
          <mesh position={[x, 3.88, -7.8]}><boxGeometry args={[0.18, 2.3, 0.18]} /><meshStandardMaterial color="#ad9b75" /></mesh>
        </group>
      ))}
      {Array.from({ length: 17 }, (_, index) => -11.2 + index * 1.4).map((x) => (
        <mesh key={`facade-${x}`} position={[x, 5.05, 7.57]}>
          <boxGeometry args={[0.055, 2.62, 0.08]} />
          <meshStandardMaterial color="#b39c70" transparent opacity={transparent ? 0.12 : 0.74} />
        </mesh>
      ))}
      {[-7.6, 0, 7.6].map((x) => (
        <group key={`door-${x}`} position={[x, 3.45, 7.72]}>
          <mesh><boxGeometry args={[2.2, 0.13, 0.16]} /><meshBasicMaterial color="#e2bd72" /></mesh>
          <mesh position={[0, 0.45, 0]}><boxGeometry args={[1.8, 0.7, 0.12]} /><meshPhysicalMaterial color="#5e8998" transparent opacity={0.54} /></mesh>
        </group>
      ))}
      {!transparent && <FacilityLabel position={[0, 8.15, 7.7]} title="南京南站" tone="rail" detail="线上高架候车" />}
    </group>
  );
}

function TransferLevel() {
  return (
    <group>
      <mesh position={[0, 0.85, 0]} receiveShadow>
        <boxGeometry args={[27.5, 1.35, 17.2]} />
        <meshStandardMaterial color="#7d7565" roughness={0.82} transparent opacity={0.88} />
      </mesh>
      <mesh position={[0, 0.84, 8.66]}><boxGeometry args={[24, 1.05, 0.1]} /><meshStandardMaterial color="#203640" transparent opacity={0.74} /></mesh>
      <mesh position={[0, 0.84, -8.66]}><boxGeometry args={[24, 1.05, 0.1]} /><meshStandardMaterial color="#203640" transparent opacity={0.74} /></mesh>
      {[-7, 0, 7].map((x) => <mesh key={x} position={[x, 0.12, 0]}><boxGeometry args={[2.5, 0.12, 4]} /><meshBasicMaterial color="#c7c1ae" /></mesh>)}
      {[-7, 0, 7].map((x) => (
        <group key={`core-${x}`} position={[x, 1.55, 0]}>
          <mesh><boxGeometry args={[1.45, 2.25, 2.2]} /><meshStandardMaterial color="#344850" transparent opacity={0.72} /></mesh>
          <mesh position={[0, 0.1, 1.13]}><boxGeometry args={[0.9, 1.45, 0.05]} /><meshBasicMaterial color="#8bc7d4" transparent opacity={0.55} /></mesh>
        </group>
      ))}
      <FacilityLabel position={[-7, 2.9, 0]} title="到达换乘核" detail="出站·换乘·垂向交通" compact />
    </group>
  );
}

function StationContext() {
  const blocks = [
    [-24, 1.4, -14, 5.4, 3, 7], [-25, 2.1, 11, 5.8, 4.4, 6],
    [25, 1.7, -13, 6, 3.6, 7], [25, 2.7, 11, 6.4, 5.6, 6.5],
    [-13, 1.1, -21, 8, 2.4, 3.8], [13, 1.5, -21, 8, 3.2, 3.8],
    [-13, 1.2, 21, 8, 2.7, 3.8], [13, 1.8, 21, 8, 3.9, 3.8],
  ];
  const metroEntrances: [number, number, number, string][] = [
    [-7.8, 0.42, -12.7, '北广场地铁入口'], [7.8, 0.42, -12.7, '北广场地铁入口'],
    [-7.8, 0.42, 12.7, '南广场地铁入口'], [7.8, 0.42, 12.7, '南广场地铁入口'],
  ];
  return (
    <group>
      {blocks.map(([x, y, z, w, h, d], index) => (
        <mesh key={`context-${index}`} position={[x, y - 0.7, z]} receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={index % 2 ? '#263239' : '#202c32'} roughness={0.92} />
        </mesh>
      ))}
      <Line points={[[-17.6, 0.3, -16], [-15, 2.2, -11], [-12, 5.95, -8.9], [0, 6, -8.9], [12, 5.95, -8.9], [15, 2.2, -11], [17.6, 0.3, -16]]} color="#4f5c60" lineWidth={9} />
      <Line points={[[17.6, 0.3, 16], [15, 2.2, 11], [12, 5.95, 8.9], [0, 6, 8.9], [-12, 5.95, 8.9], [-15, 2.2, 11], [-17.6, 0.3, 16]]} color="#4f5c60" lineWidth={9} />
      <Line points={[[-17.6, 0.34, -16], [-15, 2.24, -11], [-12, 5.99, -8.9], [12, 5.99, -8.9], [15, 2.24, -11], [17.6, 0.34, -16]]} color="#d6bd72" lineWidth={0.8} dashed dashSize={0.65} gapSize={0.45} />
      {metroEntrances.map(([x, y, z, label]) => (
        <group key={`${x}-${z}`} position={[x, y, z]}>
          <mesh><boxGeometry args={[1.8, 0.72, 1.25]} /><meshPhysicalMaterial color="#3c6878" transparent opacity={0.72} roughness={0.25} /></mesh>
          <mesh position={[0, 0.48, 0]}><boxGeometry args={[2.05, 0.12, 1.45]} /><meshBasicMaterial color="#65c7e5" /></mesh>
          <FacilityLabel position={[0, 1.05, 0]} title={label} tone="metro" compact />
        </group>
      ))}
      <group position={[-12.2, 0.38, -5.5]}>
        <mesh><boxGeometry args={[4.8, 1.1, 3.6]} /><meshStandardMaterial color="#4c5555" /></mesh>
        <FacilityLabel position={[0, 1.2, 0]} title="客运南站" detail="公路客运换乘" compact />
      </group>
      <group position={[-12.2, 0.12, 7.2]}>
        {[-1.4, 0, 1.4].map((z) => <mesh key={z} position={[0, 0, z]}><boxGeometry args={[6.2, 0.1, 0.62]} /><meshBasicMaterial color="#547a67" /></mesh>)}
        <FacilityLabel position={[0, 0.8, 0]} title="公交枢纽" detail="站台与上客区" compact />
      </group>
      <group position={[12.8, 0.18, 7.1]}>
        {[-1.2, 0, 1.2].map((z) => <Line key={z} points={[[-3.1, 0, z], [3.1, 0, z]]} color="#e8e0cc" lineWidth={1.1} dashed dashSize={0.32} gapSize={0.22} />)}
        <FacilityLabel position={[0, 0.72, 0]} title="出租车·网约车候车区" tone="road" compact />
      </group>
    </group>
  );
}

function MetroLayer({ emphasized, peak }: { emphasized: boolean; peak: boolean }) {
  const opacity = emphasized ? 1 : 0.58;
  return (
    <group>
      <mesh position={[0, -0.72, 0]}>
        <boxGeometry args={[20, 0.62, 13]} />
        <meshStandardMaterial color="#233d49" transparent opacity={0.74 * opacity} roughness={0.72} />
      </mesh>
      <mesh position={[0, -1.55, 0]}><boxGeometry args={[0.42, 0.15, 35]} /><meshBasicMaterial color="#4fa7d9" transparent opacity={opacity} /></mesh>
      <mesh position={[0.7, -1.55, 0]}><boxGeometry args={[0.42, 0.15, 35]} /><meshBasicMaterial color="#69b78c" transparent opacity={opacity} /></mesh>
      <mesh position={[0, -2.18, 0]}><boxGeometry args={[38, 0.15, 0.42]} /><meshBasicMaterial color="#65c7c9" transparent opacity={opacity} /></mesh>
      <mesh position={[0, -2.18, 0.7]}><boxGeometry args={[38, 0.15, 0.42]} /><meshBasicMaterial color="#b47ac5" transparent opacity={opacity} /></mesh>
      <mesh position={[0.35, -1.55, 0]}><boxGeometry args={[3.1, 0.2, 9]} /><meshStandardMaterial color="#a6a291" roughness={0.8} /></mesh>
      <mesh position={[0, -2.18, 0.35]}><boxGeometry args={[10, 0.2, 3.1]} /><meshStandardMaterial color="#a6a291" roughness={0.8} /></mesh>
      {peak && (
        <group position={[0, -0.34, 1.05]}>
          {[-1.2, -0.4, 0.4, 1.2].map((x) => (
            <mesh key={x} position={[x, 0, 0]}><boxGeometry args={[0.55, 0.42, 0.08]} /><meshBasicMaterial color="#f08a4b" /></mesh>
          ))}
          <FacilityLabel position={[0, 0.9, 0]} title="截流点" tone="boundary" detail="铁马 + 人墙" />
        </group>
      )}
      <FacilityLabel position={[0, -0.05, -4.4]} title="B1 地铁站厅／商业" tone="metro" />
      <FacilityLabel position={[5.4, -1.65, 0]} title="B2 地铁站台" tone="metro" detail="1 · 3 · S1 · S3" />
    </group>
  );
}

function RoadAndPlazas({ showParkingLabels }: { showParkingLabels: boolean }) {
  return (
    <group>
      <mesh position={[0, -0.06, -12]} receiveShadow><boxGeometry args={[31, 0.12, 6.4]} /><meshStandardMaterial color="#827e70" roughness={0.98} /></mesh>
      <mesh position={[0, -0.06, 12]} receiveShadow><boxGeometry args={[31, 0.12, 6.4]} /><meshStandardMaterial color="#827e70" roughness={0.98} /></mesh>
      <mesh position={[18.4, -0.04, 0]} receiveShadow><boxGeometry args={[4.3, 0.11, 34]} /><meshStandardMaterial color="#30383b" roughness={0.94} /></mesh>
      <mesh position={[-18.4, -0.04, 0]} receiveShadow><boxGeometry args={[4.3, 0.11, 34]} /><meshStandardMaterial color="#30383b" roughness={0.94} /></mesh>
      {[18.4, -18.4].map((x) => <Line key={x} points={[[x, 0.04, -17], [x, 0.04, 17]]} color="#c7b66e" lineWidth={1.2} dashed dashSize={0.6} gapSize={0.5} />)}
      <Line points={[[-16, 0.05, -12], [-10, 0.05, -16], [0, 0.05, -17], [10, 0.05, -16], [16, 0.05, -12]]} color="#536063" lineWidth={11} />
      <Line points={[[-16, 0.05, 12], [-10, 0.05, 16], [0, 0.05, 17], [10, 0.05, 16], [16, 0.05, 12]]} color="#536063" lineWidth={11} />
      <mesh position={[-7.8, 0.08, -11.8]}><boxGeometry args={[8, 0.12, 2.3]} /><meshStandardMaterial color="#35536a" /></mesh>
      <mesh position={[7.8, 0.08, -11.8]}><boxGeometry args={[8, 0.12, 2.3]} /><meshStandardMaterial color="#35536a" /></mesh>
      <mesh position={[-7.8, 0.08, 11.8]}><boxGeometry args={[8, 0.12, 2.3]} /><meshStandardMaterial color="#35536a" /></mesh>
      <mesh position={[7.8, 0.08, 11.8]}><boxGeometry args={[8, 0.12, 2.3]} /><meshStandardMaterial color="#35536a" /></mesh>
      <mesh position={[0, 0.16, 15.1]}><boxGeometry args={[7.5, 0.3, 2.4]} /><meshStandardMaterial color="#504d46" /></mesh>
      <FacilityLabel position={[18.4, 0.45, 8.8]} title="六朝路" tone="road" detail="东侧单向道路" />
      <FacilityLabel position={[-18.4, 0.45, 8.8]} title="江南路" tone="road" detail="西侧道路" />
      <FacilityLabel position={[0, 0.35, -13.4]} title="北广场" detail="公交上客 · 地铁入口" />
      <FacilityLabel position={[0, 0.35, 13.4]} title="南广场" detail="公交 · 公路客运" />
      {CAD_PARKING_NODES.filter((node) => node.id !== 'p8').map((node, index) => {
        const [x, z] = node.point;
        const tentative = node.id === 'p7';
        const tones = ['#8b7342', '#d79a50', '#d47b55', '#4b8fa6', '#409a78', '#409a78'];
        return (
        <group key={node.id} position={[x, -0.32, z]}>
          <mesh><boxGeometry args={[3.5, 0.24, 2.25]} /><meshStandardMaterial color={tones[index % tones.length]} transparent opacity={0.8} /></mesh>
          {showParkingLabels && <FacilityLabel position={[0, 0.52, 0]} title={node.label} tone={tentative ? 'boundary' : 'road'} detail={tentative ? '位置待核' : '导示图定位'} />}
        </group>
        );
      })}
      <group position={[CAD_PARKING_NODES.find((node) => node.id === 'p8')!.point[0], 0.1, CAD_PARKING_NODES.find((node) => node.id === 'p8')!.point[1]]}>
        <mesh><boxGeometry args={[4.2, 0.16, 2.5]} /><meshStandardMaterial color="#8b7342" /></mesh>
        {showParkingLabels && <FacilityLabel position={[0, 0.55, 0]} title="P8" tone="boundary" detail="2026 新增地面停车场" />}
      </group>
    </group>
  );
}

function JurisdictionOverlay() {
  return (
    <group>
      <mesh position={[0, -0.74, -10]}><boxGeometry args={[43, 0.06, 19]} /><meshBasicMaterial color="#c74d48" transparent opacity={0.13} depthWrite={false} /></mesh>
      <mesh position={[0, -0.74, 10]}><boxGeometry args={[43, 0.06, 19]} /><meshBasicMaterial color="#d39f45" transparent opacity={0.13} depthWrite={false} /></mesh>
      <mesh position={[-17, -0.72, -17]}><boxGeometry args={[9, 0.05, 7]} /><meshBasicMaterial color="#557a91" transparent opacity={0.12} depthWrite={false} /></mesh>
      <Line points={[[-21.5, -0.68, 0], [21.5, -0.68, 0]]} color="#f0aa55" lineWidth={2.2} dashed dashSize={0.75} gapSize={0.35} />
      <FacilityLabel position={[-12, 0.28, -9.7]} title="雨花台区" tone="boundary" detail="属地范围示意" />
      <FacilityLabel position={[10.5, 0.28, 10]} title="江宁区" tone="boundary" detail="属地范围示意" />
      <FacilityLabel position={[-17, 0.25, -17]} title="秦淮区" tone="metro" detail="三区交界的区位背景" compact />
      <FacilityLabel position={[0, 0.46, 0]} title="行政区边界示意" tone="boundary" detail="非测绘界线" />
    </group>
  );
}

function GovernanceEnvironment({ era, scenarioId }: { era: Scenario['era']; scenarioId: Scenario['id'] }) {
  const contractorNodes: { label: string; point: [number, number, number] }[] = [
    { label: '保洁分包 A', point: [-15, 0.28, -11] }, { label: '保洁分包 B', point: [13, 0.28, 11] },
    { label: '秩序服务', point: [14.5, 0.28, -10] }, { label: '停车运营', point: [19, 0.28, 7] },
    { label: '设施维保', point: [-11, 0.28, 9] }, { label: '商业服务', point: [7, 0.28, -12] },
  ];
  if (era === 'before') {
    return (
      <group>
        {contractorNodes.map((node, index) => (
          <group key={node.label}>
            <Line points={[[index % 2 ? 15 : -15, 1.35, index % 2 ? 15 : -15], node.point]} color={index % 2 ? '#d39f45' : '#c8665f'} lineWidth={1} dashed dashSize={0.38} gapSize={0.3} transparent opacity={0.72} />
            <mesh position={node.point}><boxGeometry args={[0.65, 0.42, 0.65]} /><meshBasicMaterial color={index % 2 ? '#d39f45' : '#c8665f'} /></mesh>
            {scenarioId === 'pre_outsourcing' && <FacilityLabel position={[node.point[0], 0.9, node.point[2]]} title={node.label} tone="boundary" compact />}
          </group>
        ))}
        <FacilityLabel position={[-15, 2.05, -15]} title="雨花台责任链" tone="boundary" detail="本区标准·本区调度" />
        <FacilityLabel position={[15, 2.05, 15]} title="江宁责任链" tone="boundary" detail="平行属地·独立运行" />
        <FacilityLabel position={[0, 9.4, 0]} title="分散责任界面" tone="boundary" detail="两区分治·多部门·多企分包" />
      </group>
    );
  }
  const platform: [number, number, number] = [0, 1.35, 12];
  const servicePoints: [number, number, number][] = [[-13, 0.25, -10], [13, 0.25, -10], [-13, 0.25, 9], [13, 0.25, 9], [0, 0.25, 0]];
  return (
    <group>
      <mesh position={platform}><cylinderGeometry args={[0.75, 0.75, 0.25, 28]} /><meshBasicMaterial color="#65c7e5" transparent opacity={0.9} /></mesh>
      {servicePoints.map((point, index) => <group key={index}><Line points={[platform, point]} color="#65c7e5" lineWidth={1.7} transparent opacity={0.78} /><mesh position={point}><sphereGeometry args={[0.17, 12, 12]} /><meshBasicMaterial color="#75b592" /></mesh></group>)}
      <FacilityLabel position={[0, 2.2, 12]} title="交控万物统一执行界面" tone="metro" detail="多甲方对一乙方" />
      <FacilityLabel position={[0, 9.4, 0]} title="平台化运行环境" tone="metro" detail="统一受理·分类派单·现场核验·结果回流" />
      <FacilityLabel position={[17, 1.0, 2]} title="法定权力边界保留" tone="boundary" detail="执法·数据·产权·属地" compact />
    </group>
  );
}

function GovernanceOverlay({ owner, era, scenarioId }: { owner: string; era: Scenario['era']; scenarioId: Scenario['id'] }) {
  const toneColor = { territory: '#f0aa55', rail: '#d9c17c', metro: '#65c7e5', law: '#d86f63', asset: '#75b592' } as const;
  const ownerTokens = owner.split(/[与、或及]/).filter((token) => token.length >= 2);
  const visibleChains = GOVERNANCE_CHAINS.filter((chain) => {
    if (era === 'after') return true;
    if (scenarioId === 'pre_boundary') return ['yuhuatai', 'jiangning', 'rail', 'metro'].includes(chain.id);
    if (scenarioId === 'pre_outsourcing') return false;
    return chain.id !== 'platform';
  });
  return (
    <group>
      {visibleChains.map((chain) => {
        const active = ownerTokens.some((token) => chain.name.includes(token) || chain.shortName.includes(token));
        const color = toneColor[chain.system];
        return (
          <group key={chain.id}>
            <Line points={[chain.point, chain.anchor]} color={color} lineWidth={active ? 2.8 : 1.05} transparent opacity={active ? 0.95 : 0.46} dashed={!active} dashSize={0.45} gapSize={0.28} />
            <mesh position={chain.point}>
              <sphereGeometry args={[active ? 0.3 : 0.18, 16, 16]} />
              <meshBasicMaterial color={active ? '#fff2d2' : color} transparent opacity={active ? 1 : 0.8} />
            </mesh>
            <FacilityLabel position={[chain.point[0], chain.point[1] + 0.62, chain.point[2]]} title={chain.shortName} tone={chain.system === 'metro' ? 'metro' : chain.system === 'law' || chain.system === 'territory' ? 'boundary' : chain.system === 'rail' ? 'rail' : 'road'} detail={active ? '当前主体所在链条' : chain.scope} compact />
          </group>
        );
      })}
      {scenarioId !== 'pre_outsourcing' && <FacilityLabel position={[0, 10.1, 0]} title={era === 'before' ? (scenarioId === 'pre_boundary' ? '属地与垂直系统' : '八类分散治理链条') : '九类治理链条（教学归类）'} tone="boundary" detail={era === 'before' ? '进场前主体关系' : '属地·条线·运营·执法·资产平台'} compact />}
    </group>
  );
}

function AssetOverlay() {
  return (
    <group>
      <mesh position={[0, 4.2, 0]}><boxGeometry args={[27, 7.2, 16]} /><meshBasicMaterial color="#c7a85e" transparent opacity={0.08} depthWrite={false} /></mesh>
      <mesh position={[0, -1.45, 0]}><boxGeometry args={[22, 2.1, 14]} /><meshBasicMaterial color="#50a8c9" transparent opacity={0.11} depthWrite={false} /></mesh>
      <mesh position={[0, 0, 0]}><boxGeometry args={[43, 0.08, 31]} /><meshBasicMaterial color="#dc7850" transparent opacity={0.05} depthWrite={false} /></mesh>
      <FacilityLabel position={[8.5, 5.8, 0]} title="铁路运营区域" tone="rail" />
      <FacilityLabel position={[8.5, -1.2, 0]} title="地铁运营区域" tone="metro" />
      <FacilityLabel position={[14, 0.42, 9]} title="停车与市政资产" tone="road" />
    </group>
  );
}

function WorkOrderOverlay({ stageId, running }: { stageId: string; running: boolean }) {
  const points: [number, number, number][] = [[-11, 0.18, -8], [-8, 0.2, -5.5], [-5, 0.2, -3], [-2, 0.2, 0], [2.5, 0.2, 1], [7, 0.2, -1], [10, 0.2, 0]];
  const active = Math.max(0, ['detect', 'classify', 'dispatch', 'verify', 'service', 'handoff', 'review'].indexOf(stageId));
  const reached = (index: number) => index <= active;
  return (
    <group>
      <Line points={points} color="#385964" lineWidth={4.2} transparent opacity={0.42} />
      {active > 0 && <Line points={points.slice(0, active + 1)} color="#70c4df" lineWidth={2.2} dashed dashSize={0.45} gapSize={0.22} />}
      {points.map((point, index) => (
        <mesh key={index} position={point}>
          <sphereGeometry args={[index === active ? 0.25 : 0.13, 14, 14]} />
          <meshBasicMaterial color={reached(index) ? '#f08a4b' : '#63808a'} />
        </mesh>
      ))}
      <group position={[-11, 0.35, -8]}>
        <mesh position={[0, 1.15, 0]}><boxGeometry args={[0.3, 0.22, 0.28]} /><meshStandardMaterial color="#172f39" /></mesh>
        <mesh position={[0, 0.68, 0]}><cylinderGeometry args={[0.045, 0.075, 0.9, 10]} /><meshStandardMaterial color="#71868c" /></mesh>
        {stageId === 'detect' && <mesh position={[0, 0.36, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[1.3, 0.2, 28]} /><meshBasicMaterial color="#65c7e5" transparent opacity={0.2} depthWrite={false} /></mesh>}
      </group>
      {stageId === 'detect' && <group position={[-9.5, 0.1, -7.2]}><mesh><boxGeometry args={[0.55, 0.24, 0.82]} /><meshStandardMaterial color="#446c78" /></mesh><mesh position={[0, 0.22, -0.2]}><boxGeometry args={[0.34, 0.18, 0.28]} /><meshStandardMaterial color="#6fa9b8" /></mesh></group>}
      {stageId === 'classify' && <>
        {[-8.8, -8.1, -7.4].map((x, index) => <mesh key={x} position={[x, 0.5 + index * 0.1, -5.5 + index * 0.25]} rotation={[-Math.PI / 2, 0, 0.05]}><planeGeometry args={[1.15, 0.72]} /><meshBasicMaterial color={index === 1 ? '#f08a4b' : '#65c7e5'} transparent opacity={0.82} side={THREE.DoubleSide} /></mesh>)}
        <FacilityLabel position={[-8, 1.35, -5.5]} title="规则引擎研判" tone="metro" detail="位置＋事项＋资产＋责任＋时限" />
      </>}
      {stageId === 'dispatch' && <>
        <Line points={[[ -5, 0.25, -3], [-3.8, 0.25, -1.8], [-2, 0.25, 0]]} color="#65c7e5" lineWidth={1.7} dashed dashSize={0.28} gapSize={0.2} />
        <FacilityLabel position={[-5, 1.05, -3]} title="人工确认派单" tone="metro" detail="对象＋任务＋时限＋升级条件" />
      </>}
      {(stageId === 'verify' || stageId === 'service' || stageId === 'handoff') && <>
        <Line points={[[ -5, 0.25, -3], [-3.6, 0.25, -1.5], [-2, 0.25, 0]]} color="#f0a15f" lineWidth={1.7} dashed dashSize={0.28} gapSize={0.2} />
        <ResponderWalker key={stageId} from={[-5, 0.02, -3]} to={[-2.5, 0.02, -0.4]} running={running} color="#2d6574" vest="#f0a15f" />
        <PersonFigure position={[-1.7, 0.02, 0.3]} color="#596568" scale={1.08} />
        <mesh position={[-2, 0.16, 0]}><boxGeometry args={[0.7, 0.24, 0.45]} /><meshStandardMaterial color="#826f53" /></mesh>
        <FacilityLabel position={[-2, 1.05, 0]} title="到场拍照核验" tone="road" detail="人到场·位置校验·问题复核" />
      </>}
      {stageId === 'service' && <>
        <ResponderWalker from={[-1.5, 0.02, 0]} to={[2.2, 0.02, 0.8]} running={running} color="#496d5b" vest="#75b592" />
        <mesh position={[2.5, 0.16, 1]}><boxGeometry args={[0.72, 0.22, 0.48]} /><meshStandardMaterial color="#58755f" /></mesh>
        <FacilityLabel position={[2.5, 1.1, 1]} title="合同内服务处置" tone="road" detail="清理·维护·劝导·记录" />
      </>}
      {stageId === 'handoff' && <>
        <Line points={[[2.5, 0.05, -4], [2.5, 1.25, -4]]} color="#d86f63" lineWidth={2.2} dashed dashSize={0.2} gapSize={0.16} />
        <FacilityLabel position={[2.5, 1.7, -4]} title="服务／执法权限门" tone="boundary" detail="平台在此停止决定" />
        <ResponderWalker from={[7.5, 0.02, -4]} to={[3.2, 0.02, -3.7]} running={running} color="#243d62" vest="#a7d4e2" />
        <ResponderWalker from={[7.5, 0.02, 4]} to={[3.2, 0.02, 2.2]} running={running} color="#344754" vest="#d86f63" />
        <FacilityLabel position={[7.5, 1.12, -4]} title="城管执法接口" tone="boundary" detail="占道经营·市容秩序" />
        <FacilityLabel position={[7.5, 1.12, 4]} title="公安交管接口" tone="boundary" detail="开放道路·车辆违法" />
        <Line points={[[-1.6, 0.32, 0], [2.5, 0.32, -0.8], [6.9, 0.32, -4]]} color="#d86f63" lineWidth={2.3} />
      </>}
      {stageId === 'review' && <>
        <mesh position={[-1.0, 0.8, -0.4]} rotation={[0, 0.18, 0]}><planeGeometry args={[1.55, 1]} /><meshBasicMaterial color="#844e42" side={THREE.DoubleSide} /></mesh>
        <mesh position={[1.0, 0.8, 0.4]} rotation={[0, 0.18, 0]}><planeGeometry args={[1.55, 1]} /><meshBasicMaterial color="#527e68" side={THREE.DoubleSide} /></mesh>
        <Line points={[[1.8, 0.8, 0.5], [5.2, 1.2, 2], [9, 1.5, 0]]} color="#75b592" lineWidth={2} dashed dashSize={0.35} gapSize={0.2} />
        <FacilityLabel position={[0, 1.75, 0]} title="处置前／处置后" tone="metro" detail="人工复核后结果回流" />
      </>}
      <FacilityLabel position={[-11, 0.9, -8]} title="AI 发现" tone="metro" detail={stageId === 'detect' ? '摄像头＋巡检车生成线索' : undefined} compact />
      <FacilityLabel position={[-8, 0.85, -5.5]} title="规则研判" tone="metro" compact />
      <FacilityLabel position={[-5, 0.85, -3]} title="确认派单" tone="metro" compact />
      <FacilityLabel position={[-2, 0.85, 0]} title="现场核验" tone="road" compact />
      <FacilityLabel position={[2.5, 0.85, 1]} title="服务处置" tone="road" compact />
      <FacilityLabel position={[7, 0.85, -1]} title="执法转交" tone="boundary" compact />
      <FacilityLabel position={[10, 0.85, 0]} title="复核学习" tone="metro" compact />
    </group>
  );
}

function ParkingDecisionOverlay({ stageId, running }: { stageId: string; running: boolean }) {
  const responseStages = ['sense', 'verify', 'internal', 'classify', 'handoff'];
  return (
    <group>
      <Line points={[[16.8, 0.08, -12], [16.8, 0.08, 12]]} color="#d86f63" lineWidth={2.2} dashed dashSize={0.48} gapSize={0.28} />
      <FacilityLabel position={[16.8, 1.0, 7.5]} title="停车场运营红线" tone="boundary" detail="内侧企业运营／外侧道路交管" compact />
      {stageId === 'prepare' && <>
        <FacilityLabel position={[-10, 1.2, 12]} title="雨花台属地保障部署" tone="boundary" detail="企业接收属地任务与联络接口" />
        <FacilityLabel position={[10, 1.2, 12]} title="江宁属地保障部署" tone="boundary" detail="平行体系分别组织" />
        <Line points={[[-10, 0.3, 11], [0, 0.3, 6], [13, 0.3, 4]]} color="#c7a85e" lineWidth={1.6} dashed dashSize={0.35} gapSize={0.22} />
        <Line points={[[10, 0.3, 11], [4, 0.3, 7], [13, 0.3, 4]]} color="#c7a85e" lineWidth={1.6} dashed dashSize={0.35} gapSize={0.22} />
      </>}
      {stageId === 'sense' && <>
        {[0.7, 1.25, 1.85].map((radius, index) => <mesh key={radius} position={[14.2, 0.08 + index * 0.01, -3.8]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[radius - 0.14, radius, 36]} /><meshBasicMaterial color={index === 0 ? '#d9594f' : '#f08a4b'} transparent opacity={0.66 - index * 0.14} side={THREE.DoubleSide} depthWrite={false} /></mesh>)}
        <FacilityLabel position={[14.2, 1.15, -3.8]} title="余位下降＋入口排队" tone="road" detail="平台只生成场内风险线索" />
      </>}
      {stageId === 'verify' && <>
        <ResponderWalker from={[10.5, 0.02, 4]} to={[16.1, 0.02, -1.2]} running={running} color="#405b63" vest="#f0a15f" />
        <PersonFigure position={[16.2, 0.02, -1.5]} color="#405b63" vest="#f0a15f" scale={1.06} />
        <FacilityLabel position={[16.1, 1.05, -1.5]} title="人员到场校验" tone="road" detail="余位·道闸·队尾·道路外溢" />
      </>}
      {stageId === 'internal' && <>
        <Line points={[[13.8, 0.2, -5], [11.5, 0.2, 0], [14.2, 0.2, 5.5]]} color="#75b592" lineWidth={3} />
        <Line points={[[14.5, 0.2, -5], [16.0, 0.2, 0], [14.8, 0.2, 5.5]]} color="#f08a4b" lineWidth={2} dashed dashSize={0.35} gapSize={0.2} />
        <FacilityLabel position={[13.8, 1.05, 2.5]} title="场内道闸联调" tone="road" detail="调节放行＋引导至有余位车场" />
      </>}
      {stageId === 'classify' && <>
        <Line points={[[14.5, 0.3, 0], [16.8, 0.3, 0], [20.5, 0.3, 0]]} color="#d86f63" lineWidth={2.8} />
        <mesh position={[16.8, 0.38, 0]}><boxGeometry args={[0.24, 0.75, 1.3]} /><meshBasicMaterial color="#d86f63" /></mesh>
        <FacilityLabel position={[17.6, 1.25, 0]} title="权责判定门" tone="boundary" detail="场内服务／开放道路法定处置" />
      </>}
      {stageId === 'handoff' && <>
        <ResponderWalker from={[22.5, 0.02, -4]} to={[18.2, 0.02, -0.8]} running={running} color="#233d62" vest="#79cce2" />
        <PersonFigure position={[18.6, 0.02, 1]} color="#233d62" vest="#79cce2" scale={1.08} />
        <Line points={[[18.4, 0.24, -8], [18.4, 0.24, 0], [18.4, 0.24, 8]]} color="#65c7e5" lineWidth={3} />
        <FacilityLabel position={[19.2, 1.15, 2.5]} title="公安交管道路联动" tone="metro" detail="道路疏导与场内放行双向反馈" />
      </>}
      {stageId === 'review' && <>
        <Line points={[[19, 0.22, -7], [17, 0.22, 0], [14, 0.22, 6]]} color="#75b592" lineWidth={2.6} dashed dashSize={0.42} gapSize={0.22} />
        <FacilityLabel position={[16, 1.1, 2]} title="恢复确认与联合复盘" tone="metro" detail="告警·到场·移交·恢复记录回看" />
      </>}
      {responseStages.includes(stageId) && <FacilityLabel position={[13.2, 0.95, -8.5]} title="企业运营区" tone="road" compact />}
    </group>
  );
}

function CrowdEventOverlay({ stageId, running }: { stageId: string; running: boolean }) {
  const controlActive = ['decide', 'control'].includes(stageId);
  const density = stageId === 'review' ? 0.46 : stageId === 'recover' ? 0.62 : stageId === 'detect' ? 0.9 : 1;
  return (
    <group>
      {[0.75, 1.45, 2.25].map((radius, index) => <mesh key={radius} position={[0, -0.3 + index * 0.012, 0.7]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[radius - 0.17, radius, 42]} /><meshBasicMaterial color={index === 0 ? '#d9594f' : index === 1 ? '#f08a4b' : '#d7b450'} transparent opacity={(0.62 - index * 0.13) * density} side={THREE.DoubleSide} depthWrite={false} /></mesh>)}
      {stageId === 'detect' && <FacilityLabel position={[0, 1.05, 0.7]} title="换乘密度持续上升" tone="boundary" detail="算法预警不是现场处置结论" />}
      {['verify', 'report'].includes(stageId) && <>
        <Line points={[[7, 0.05, -4], [3.2, -0.08, -1.5], [0.8, -0.25, 0.4]]} color="#6ec8e2" lineWidth={1.8} dashed dashSize={0.3} gapSize={0.18} />
        <ResponderWalker from={[7, -0.35, -4]} to={[0.8, -0.35, 0.4]} running={running} color="#223d62" vest="#75cde5" />
        <ResponderWalker from={[8, -0.35, -3]} to={[1.4, -0.35, -0.2]} running={running} color="#223d62" vest="#75cde5" />
        <FacilityLabel position={[5.6, 0.75, -3.4]} title={stageId === 'verify' ? '民警赶赴现场' : '现场证据上报'} tone="metro" detail={stageId === 'verify' ? '核对热力、对冲方向与站台承载' : '请求增援警力与分流物资'} />
      </>}
      {controlActive && <>
        {Array.from({ length: 10 }, (_, index) => -2.7 + index * 0.6).map((x, index) => <group key={x} position={[x, -0.33, -0.5]}><mesh><boxGeometry args={[0.46, 0.22, 0.06]} /><meshBasicMaterial color={index % 2 ? '#f4efe3' : '#d86f63'} /></mesh></group>)}
        {Array.from({ length: 7 }, (_, index) => -2.4 + index * 0.8).map((x) => <PersonFigure key={x} position={[x, -0.36, -0.9]} color="#243d62" vest="#79cce2" scale={0.95} />)}
        <FacilityLabel position={[0, 0.85, -0.8]} title={stageId === 'decide' ? '截流方案已授权' : '铁马＋人墙截流'} tone="boundary" detail={stageId === 'decide' ? '明确岗位、设施与旅客告知口径' : '公开报道：38 个铁马，图中符号化展示'} />
      </>}
      {stageId === 'control' && <>
        <Line points={[[0, -0.25, 0], [-5, 0.1, -5], [-8, 0.25, -12]]} color="#75b592" lineWidth={3} />
        <Line points={[[0, -0.25, 0], [5, 0.1, 5], [8, 0.25, 12]]} color="#75b592" lineWidth={3} />
        <FacilityLabel position={[-7.4, 1.0, -10.5]} title="引导至北广场入口" tone="metro" />
        <FacilityLabel position={[7.4, 1.0, 10.5]} title="引导至南广场入口" tone="metro" />
      </>}
      {stageId === 'recover' && <FacilityLabel position={[0, 1.0, 0.7]} title="动态复核，逐步解除" tone="metro" detail="热力值与现场通行状态共同校验" />}
      {stageId === 'review' && <FacilityLabel position={[0, 1.0, 0.7]} title="事件记录进入复盘" tone="metro" detail="阈值·警力·物资·绕行方案回看" />}
    </group>
  );
}

function FocusBeacon({ point, label }: { point: [number, number, number]; label: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.16;
    group.current.scale.setScalar(pulse);
  });
  return (
    <group ref={group} position={point}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.32, 0.48, 28]} /><meshBasicMaterial color="#ffb35e" transparent opacity={0.95} side={THREE.DoubleSide} /></mesh>
      <Line points={[[0, 0.08, 0], [0, 1.4, 0]]} color="#ffb35e" lineWidth={1.4} />
      <FacilityLabel position={[0, 1.75, 0]} title={label} tone="boundary" detail="当前决策点" />
    </group>
  );
}

const CAMERA_VIEWS: Record<SceneView, { position: [number, number, number]; target: [number, number, number] }> = {
  cad: { position: [0, 49, 0.01], target: [0, 0, 0] },
  overview: { position: [31, 25, 35], target: [0, 1.1, 0] },
  station: { position: [0, 12, 37], target: [0, 3.2, 0] },
  metro: { position: [21, 8, 23], target: [0, -0.8, 0] },
  parking: { position: [34, 13, 23], target: [12, 0, 0] },
  boundary: { position: [29, 23, 32], target: [0, 0, 0] },
  workorder: { position: [-27, 14, 25], target: [-3, 0, -2] },
};

function CameraRig({ view }: { view: SceneView }) {
  const { camera } = useThree();
  const controls = useRef<any>(null);
  useEffect(() => {
    const preset = CAMERA_VIEWS[view];
    camera.position.set(...preset.position);
    if (controls.current) {
      controls.current.target.set(...preset.target);
      controls.current.update();
    }
  }, [camera, view]);
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.07} minDistance={11} maxDistance={72} maxPolarAngle={Math.PI / 2.04} />;
}

export function StationScene({ scenario, stage, running, hour, layerMode, overlays }: SceneProps) {
  const night = hour < 6 || hour >= 19;
  const showFlow = overlays.includes('flow');
  const showJurisdiction = overlays.includes('jurisdiction');
  const showGovernance = overlays.includes('governance');
  const showAssets = overlays.includes('assets');
  const showTasks = overlays.includes('tasks');
  const cadMode = layerMode === 'cad';
  const showHall = layerMode === 'all' || layerMode === 'hall';
  const showPlatforms = layerMode === 'all' || layerMode === 'platform';
  const showTransfer = layerMode === 'all' || layerMode === 'transfer';
  const showMetro = layerMode === 'all' || layerMode === 'metro';
  const transparentHall = layerMode === 'platform' || layerMode === 'transfer' || layerMode === 'metro';
  const particleScale = Math.max(0.62, Math.min(1.42, scenario.particleCount / 520));

  const northRoute = useMemo(() => [
    new THREE.Vector3(-3, 0.3, -16), new THREE.Vector3(-2, 0.7, -10), new THREE.Vector3(0, 1.1, -7), new THREE.Vector3(2.5, 2.7, -4), new THREE.Vector3(8.5, 2.7, 4.8),
  ], []);
  const southRoute = useMemo(() => [
    new THREE.Vector3(4, 0.3, 16), new THREE.Vector3(2.5, 0.7, 10), new THREE.Vector3(0, 1.1, 7), new THREE.Vector3(-3.8, 2.7, 2), new THREE.Vector3(-9.5, 2.7, -5),
  ], []);
  const metroRoute = useMemo(() => [
    new THREE.Vector3(-12, 0.35, -10), new THREE.Vector3(-5.5, 0.45, -6), new THREE.Vector3(-1.2, -0.6, -2), new THREE.Vector3(0, -1.35, 0), new THREE.Vector3(8.5, -1.7, 0),
  ], []);
  const roadRoute = useMemo(() => [
    new THREE.Vector3(18.4, 0.2, -17), new THREE.Vector3(18.4, 0.2, -7), new THREE.Vector3(18.4, 0.2, 1), new THREE.Vector3(18.4, 0.2, 10), new THREE.Vector3(18.4, 0.2, 17),
  ], []);
  const westRoadRoute = useMemo(() => [
    new THREE.Vector3(-18.4, 0.2, 17), new THREE.Vector3(-18.4, 0.2, 8), new THREE.Vector3(-18.4, 0.2, 0), new THREE.Vector3(-18.4, 0.2, -9), new THREE.Vector3(-18.4, 0.2, -17),
  ], []);
  const railArrivalRoute = useMemo(() => [
    new THREE.Vector3(-10, 2.8, -5.2), new THREE.Vector3(-5, 2.8, -2.8), new THREE.Vector3(-2, 1.1, -1), new THREE.Vector3(0, -0.45, 0.3),
  ], []);
  const metroOpposingRoute = useMemo(() => [...metroRoute].reverse(), [metroRoute]);
  const crowdSpeed = stage.id === 'decide' ? 0.56 : stage.id === 'control' ? 0.42 : stage.id === 'recover' ? 0.72 : stage.id === 'review' ? 0.5 : 1;

  return (
    <>
      <color attach="background" args={[night ? '#071016' : '#11191d']} />
      <fog attach="fog" args={[night ? '#071016' : '#11191d', 42, 88]} />
      <ambientLight intensity={night ? 0.6 : 1.0} color={night ? '#88a9ba' : '#e8dec2'} />
      <directionalLight position={[16, 28, 18]} intensity={night ? 1.2 : 2.4} color={night ? '#a6cbe8' : '#fff0cb'} castShadow />
      <pointLight position={[0, 10, 4]} intensity={night ? 20 : 6} color="#f2be77" distance={38} />
      <group>
        <mesh position={[0, -0.92, 0]} receiveShadow>
          <boxGeometry args={[52, 0.38, 42]} />
          <meshStandardMaterial color={night ? '#10191d' : '#293337'} roughness={0.98} />
        </mesh>
        <gridHelper args={[52, 52, '#48545a', '#273238']} position={[0, -0.71, 0]} />
        {cadMode ? <CadPlanOverlay /> : <><StationContext /><RoadAndPlazas showParkingLabels={stage.view === 'parking' || showAssets} /></>}
        {showMetro && <MetroLayer emphasized={layerMode === 'metro'} peak={scenario.id === 'metro_peak' && ['decide', 'control'].includes(stage.id)} />}
        {showTransfer && <TransferLevel />}
        {showPlatforms && <RailYard emphasized={layerMode === 'platform'} />}
        {(showHall || transparentHall) && <WaitingHall transparent={transparentHall && !showHall} />}
        {showJurisdiction && <JurisdictionOverlay />}
        {showGovernance && <><GovernanceEnvironment era={scenario.era} scenarioId={scenario.id} /><GovernanceOverlay owner={stage.owner} era={scenario.era} scenarioId={scenario.id} /></>}
        {showAssets && !cadMode && <AssetOverlay />}
        {showTasks && !cadMode && scenario.id === 'ai_workorder' && <WorkOrderOverlay stageId={stage.id} running={running} />}
        {!cadMode && scenario.id === 'parking_boundary' && <ParkingDecisionOverlay stageId={stage.id} running={running} />}
        {!cadMode && scenario.id === 'metro_peak' && <CrowdEventOverlay stageId={stage.id} running={running} />}
        {showFlow && !cadMode && (
          scenario.id === 'metro_peak' ? <>
            <Flow points={railArrivalRoute} count={Math.floor(150 * particleScale)} speed={scenario.speed * 0.78 * crowdSpeed} color="#f4ead5" running={running} />
            <Flow points={metroRoute} count={Math.floor(240 * particleScale)} speed={scenario.speed * 1.08 * crowdSpeed} color="#65c7e5" running={running} />
            <Flow points={metroOpposingRoute} count={Math.floor(190 * particleScale)} speed={scenario.speed * 0.92 * crowdSpeed} color="#d6a564" running={running} />
            <Flow points={northRoute} count={Math.floor(95 * particleScale)} speed={scenario.speed * crowdSpeed} color="#e8e2d4" running={running} />
            <Flow points={southRoute} count={Math.floor(95 * particleScale)} speed={scenario.speed * 0.9 * crowdSpeed} color="#e8e2d4" running={running} />
            <Flow points={roadRoute} count={Math.floor(58 * particleScale)} speed={scenario.speed * 0.7} color="#f08a4b" running={running} shape="vehicle" />
            <Flow points={westRoadRoute} count={Math.floor(46 * particleScale)} speed={scenario.speed * 0.66} color="#d7b450" running={running} shape="vehicle" />
          </> : <>
            <Flow points={northRoute} count={Math.floor(105 * particleScale)} speed={scenario.speed} color="#f4ead5" running={running} />
            <Flow points={southRoute} count={Math.floor(100 * particleScale)} speed={scenario.speed * 0.92} color="#f4ead5" running={running} />
            <Flow points={metroRoute} count={Math.floor(125 * particleScale)} speed={scenario.speed * 1.08} color="#65c7e5" running={running} />
            <Flow points={roadRoute} count={Math.floor((scenario.id === 'parking_boundary' ? 72 : 34) * particleScale)} speed={scenario.speed * 0.76} color="#f08a4b" running={running} shape="vehicle" />
          </>
        )}
        {!cadMode && <FocusBeacon point={stage.focusPoint} label={stage.label} />}
      </group>
      <CameraRig view={cadMode ? 'cad' : stage.view} />
    </>
  );
}
