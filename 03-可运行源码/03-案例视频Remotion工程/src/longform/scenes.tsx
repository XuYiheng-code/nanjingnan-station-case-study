import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {COLORS, COVER_FRAMES, FONTS, mix, progress, TOTAL_FRAMES} from './data';
import {ChapterHeader, fadeUp, FilmGrain, Grid, Label, Panel, PhotoLayer, SceneShell, ShotTitle, TeamLockup} from './components';
import type {TimelineShot} from './types';

type SceneProps = {shot: TimelineShot};

const Line: React.FC<{x1: number; y1: number; x2: number; y2: number; p: number; color?: string; width?: number; dashed?: boolean}> = ({x1, y1, x2, y2, p, color = COLORS.orange, width = 3, dashed = false}) => <line x1={x1} y1={y1} x2={mix(x1, x2, p)} y2={mix(y1, y2, p)} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? '10 13' : undefined}/>;

const Dot: React.FC<{x: number; y: number; color?: string; size?: number; pulse?: number}> = ({x, y, color = COLORS.orange, size = 18, pulse = 0}) => <g><circle cx={x} cy={y} r={size + pulse * 14} fill="none" stroke={color} strokeWidth={2} opacity={.35 * (1 - pulse)}/><circle cx={x} cy={y} r={size} fill={color}/></g>;

export const CoverScene: React.FC = () => {
  const frame = useCurrentFrame();
  const photo = interpolate(frame, [0, 180], [1.14, 1.03], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const reveal = interpolate(frame, [24, 84], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const title = fadeUp(frame, 70, 34, 36);
  const subtitle = fadeUp(frame, 116, 28, 24);
  const team = fadeUp(frame, 158, 24, 18);
  return <AbsoluteFill style={{background: COLORS.navy, overflow: 'hidden'}}>
    <Img src={staticFile('images/nanjing-south-aerial.jpeg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${photo})`, filter: 'saturate(.55) contrast(1.15) brightness(.62)'}}/>
    <AbsoluteFill style={{background: 'linear-gradient(90deg,rgba(4,12,18,.95),rgba(4,12,18,.58) 66%,rgba(4,12,18,.2)),linear-gradient(0deg,rgba(4,12,18,.82),transparent 56%)'}}/>
    <Grid light opacity={.1}/>
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: reveal}}>
      <path d="M110 710 C430 575 710 660 1010 510 S1510 430 1810 250" fill="none" stroke={COLORS.blue} strokeWidth={2} opacity={.32} strokeDasharray="14 18"/>
      <path d="M110 710 C430 575 710 660 1010 510" fill="none" stroke={COLORS.orange} strokeWidth={3} strokeDasharray={1} pathLength={1} strokeDashoffset={1 - reveal}/>
      <Dot x={1010} y={510} pulse={(frame % 70) / 70}/>
    </svg>
    <div style={{position: 'absolute', left: 108, top: 86, display: 'flex', alignItems: 'center', gap: 18, color: COLORS.orangeLight, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 700, letterSpacing: '.16em'}}><span style={{width: 56, height: 3, background: COLORS.orange}}/>2026 · 中国智能社会治理公共政策案例分析大赛</div>
    <div style={{position: 'absolute', left: 108, top: 228, width: 1610, ...title}}>
      <div style={{fontFamily: FONTS.serif, fontSize: 94, color: COLORS.white, fontWeight: 780, lineHeight: 1.05, letterSpacing: '-.055em', whiteSpace: 'nowrap'}}>从<span style={{color: COLORS.orangeLight}}>平台化</span>到<span style={{color: COLORS.orangeLight}}>智能化</span>：</div>
      <div style={{marginTop: 26, fontFamily: FONTS.serif, fontSize: 68, color: COLORS.white, fontWeight: 740, letterSpacing: '-.04em', whiteSpace: 'nowrap'}}>政企共创平台企业何以化解行政分割难题？</div>
    </div>
    <div style={{position: 'absolute', left: 110, top: 565, display: 'flex', gap: 22, alignItems: 'center', ...subtitle}}><span style={{width: 78, height: 3, background: COLORS.orange}}/><span style={{color: '#ffffffdc', fontFamily: FONTS.sans, fontSize: 34, whiteSpace: 'nowrap'}}>——以南京南站跨区域公共交通枢纽为例</span></div>
    <div style={{position: 'absolute', left: 110, top: 734, ...team}}><TeamLockup size={92}/></div>
    <div style={{position: 'absolute', left: 110, bottom: 58, color: '#ffffff80', fontFamily: FONTS.mono, fontSize: 18, letterSpacing: '.12em'}}>CASE FILM · {String(Math.floor(TOTAL_FRAMES / 30 / 60)).padStart(2, '0')}'{String(Math.round(TOTAL_FRAMES / 30 % 60)).padStart(2, '0')}'' · NANJING</div>
    <FilmGrain opacity={.08} light/>
    <div style={{position: 'absolute', bottom: 0, left: 0, height: 4, width: `${frame / COVER_FRAMES * 100}%`, background: COLORS.orange}}/>
  </AbsoluteFill>;
};

export const ScaleScene: React.FC<SceneProps> = ({shot}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, 0, shot.durationFrames);
  const modes = ['列车', '地铁', '公交', '出租车', '社会车辆'];
  return <SceneShell shot={shot} dark>
    <PhotoLayer src="nanjing-south-aerial.jpeg" scale={1.17} endScale={1.04} x={-70} endX={20}/>
    <AbsoluteFill style={{background: 'linear-gradient(90deg,rgba(5,14,20,.9),rgba(5,14,20,.2) 78%),linear-gradient(0deg,rgba(5,14,20,.75),transparent 55%)'}}/>
    <ChapterHeader shot={shot} dark/><ShotTitle dark>人流、车流、换乘流</ShotTitle>
    <div style={{position: 'absolute', left: 84, top: 310, display: 'flex', alignItems: 'baseline', gap: 28}}>
      {[['＞30万', '铁路日发送量'], ['可达8万', '站区日车流量']].map(([n, l], i) => <div key={n} style={{width: 530, ...fadeUp(frame, 70 + i * 38, 28)}}><div style={{fontFamily: FONTS.serif, fontSize: 112, fontWeight: 800, color: i ? COLORS.blue : COLORS.orangeLight, letterSpacing: '-.06em'}}>{n}</div><div style={{fontFamily: FONTS.sans, fontSize: 30, color: '#ffffffd0'}}>人次／辆次 · {l}<span style={{fontSize: 20, color: '#ffffff80'}}>（案例材料口径）</span></div></div>)}
    </div>
    <div style={{position: 'absolute', left: 88, top: 650, display: 'flex', gap: 14}}>{modes.map((m, i) => <Label key={m} accent={i === Math.floor(p * 5) % 5} style={{opacity: interpolate(frame, [120 + i * 16, 140 + i * 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), transform: `translateY(${Math.sin(p * Math.PI * 2 + i) * 5}px)`}}>{m}</Label>)}</div>
  </SceneShell>;
};

export const SmallProblemsScene: React.FC<SceneProps> = ({shot}) => {
  const frame = useCurrentFrame();
  const problems = [['积水', '水'], ['垃圾桶满溢', '满'], ['非机动车倒伏', '倒'], ['车辆违停', '停']];
  return <SceneShell shot={shot}>
    <Grid opacity={.08}/><ChapterHeader shot={shot}/><ShotTitle>小问题，为什么会跨过许多边界？</ShotTitle>
    <div style={{position: 'absolute', left: 86, right: 86, top: 315, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20}}>{problems.map(([name, glyph], i) => {
      const a = fadeUp(frame, 55 + i * 35, 26, 44);
      const active = frame > 75 + i * 80;
      return <Panel key={name} style={{height: 350, padding: '32px', ...a, borderTop: `4px solid ${active ? COLORS.orange : '#1112'}`, transform: `${a.transform} scale(${active ? 1.015 : 1})`}}><div style={{width: 88, height: 88, borderRadius: 24, display: 'grid', placeItems: 'center', background: active ? COLORS.orange : COLORS.paperDeep, color: COLORS.ink, fontFamily: FONTS.serif, fontSize: 42, fontWeight: 800}}>{glyph}</div><div style={{fontFamily: FONTS.serif, fontSize: 46, fontWeight: 750, marginTop: 38, whiteSpace: 'nowrap'}}>{name}</div><div style={{fontFamily: FONTS.sans, fontSize: 25, color: COLORS.muted, marginTop: 20}}>现场线索 → 跨界任务</div></Panel>;
    })}</div>
    <div style={{position: 'absolute', left: 88, top: 770, fontFamily: FONTS.mono, fontSize: 22, color: COLORS.red, letterSpacing: '.08em'}}>ADMINISTRATION · DEPARTMENT · ASSET</div>
  </SceneShell>;
};

export const ThreeBoundariesScene: React.FC<SceneProps> = ({shot}) => {
  const frame = useCurrentFrame();
  const layers = [
    {title: '行政区划', detail: '雨花台区／江宁区', color: COLORS.orange},
    {title: '部门职能', detail: '铁路／地铁／公安／交管／城管', color: COLORS.blue},
    {title: '资产与运营权', detail: '站房／地下空间／停车场／市政设施', color: COLORS.green},
  ];
  return <SceneShell shot={shot} dark>
    <PhotoLayer src="nanjing-south-aerial.jpeg" scale={1.18} endScale={1.08} filter="saturate(.25) contrast(1.18) brightness(.5)"/>
    <AbsoluteFill style={{background: 'rgba(4,12,18,.62)'}}/><Grid light opacity={.08}/><ChapterHeader shot={shot} dark/><ShotTitle dark>同一座站，被切成三层治理空间。</ShotTitle>
    <div style={{position: 'absolute', left: 165, right: 165, top: 330, height: 430, perspective: 1200}}>{layers.map((layer, i) => {
      const p = interpolate(frame, [55 + i * 60, 105 + i * 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
      return <div key={layer.title} style={{position: 'absolute', left: i * 74, right: (2 - i) * 74, top: i * 92, height: 190, padding: '30px 38px', borderRadius: 24, border: `2px solid ${layer.color}`, background: 'rgba(7,25,38,.88)', boxShadow: `0 24px 65px ${layer.color}1f`, opacity: p, transform: `translateY(${(1 - p) * 90}px) rotateX(55deg)`}}><div style={{fontFamily: FONTS.mono, fontSize: 18, color: layer.color, letterSpacing: '.13em'}}>LAYER 0{i + 1}</div><div style={{display: 'flex', alignItems: 'baseline', gap: 26, marginTop: 18}}><strong style={{fontFamily: FONTS.serif, fontSize: 46}}>{layer.title}</strong><span style={{fontFamily: FONTS.sans, fontSize: 27, color: '#ffffffb8', whiteSpace: 'nowrap'}}>{layer.detail}</span></div></div>;
    })}</div>
  </SceneShell>;
};

export const FourteenUnitsScene: React.FC<SceneProps> = ({shot}) => {
  const frame = useCurrentFrame();
  const units = ['雨花台', '江宁', '铁路', '地铁', '公安', '交管', '城管', '交通', '市政', '综管办', '资产方', '运营方', '保洁', '停车'];
  const center = {x: 960, y: 565};
  return <SceneShell shot={shot}>
    <Grid opacity={.07}/><ChapterHeader shot={shot}/><ShotTitle>十四个单位，责任仍会滑走。</ShotTitle>
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>{units.map((_, i) => {
      const angle = -Math.PI / 2 + i / units.length * Math.PI * 2;
      const radiusX = i % 2 ? 690 : 610;
      const radiusY = i % 2 ? 260 : 220;
      const x = center.x + Math.cos(angle) * radiusX;
      const y = center.y + Math.sin(angle) * radiusY;
      const p = interpolate(frame, [40 + i * 10, 70 + i * 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      return <Line key={i} x1={x} y1={y} x2={center.x} y2={center.y} p={p} color={i % 3 === 0 ? COLORS.orange : COLORS.navySoft} width={i % 3 === 0 ? 3 : 2} dashed={i % 4 === 0}/>;
    })}</svg>
    <div style={{position: 'absolute', left: 760, top: 420, width: 400, height: 290, borderRadius: 200, display: 'grid', placeItems: 'center', textAlign: 'center', color: COLORS.white, background: COLORS.navy, boxShadow: '0 30px 90px rgba(7,25,38,.28)'}}><div><div style={{fontFamily: FONTS.serif, fontSize: 72, fontWeight: 800, color: COLORS.orange}}>责任主体</div><div style={{fontFamily: FONTS.serif, fontSize: 46, marginTop: 8}}>不明确</div></div></div>
    {units.map((unit, i) => {const a = -Math.PI / 2 + i / units.length * Math.PI * 2; const x = center.x + Math.cos(a) * (i % 2 ? 690 : 610); const y = center.y + Math.sin(a) * (i % 2 ? 260 : 220); return <Label key={unit} accent={i === Math.floor(frame / 45) % units.length} style={{position: 'absolute', left: x - 66, top: y - 29, width: 132, opacity: interpolate(frame, [36 + i * 10, 60 + i * 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>{unit}</Label>;})}
    <div style={{position: 'absolute', left: 1250, top: 720, color: COLORS.red, fontFamily: FONTS.serif, fontSize: 48, fontWeight: 760, transform: `translateX(${Math.sin(frame * .035) * 16}px)`}}>“板子打下去打得都不疼”</div>
  </SceneShell>;
};

export const CoordinationOfficeScene: React.FC<SceneProps> = ({shot}) => {
  const frame = useCurrentFrame();
  const targets = [['雨花台', 360, 380], ['江宁', 360, 670], ['垂直部门', 1510, 380], ['平行部门', 1510, 670]] as const;
  return <SceneShell shot={shot} dark>
    <Grid light opacity={.07}/><ChapterHeader shot={shot} dark/><ShotTitle dark>综管办：有协调之名，缺整合之权。</ShotTitle>
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>{targets.map(([name, x, y], i) => {const reach = i === 0 ? 1 : .72; const p = Math.min(reach, progress(frame, 75 + i * 24, 70) * reach); return <Line key={name} x1={960} y1={560} x2={x} y2={y} p={p} color={i === 0 ? COLORS.orange : COLORS.blue} width={4} dashed={i > 0}/>;})}</svg>
    <div style={{position: 'absolute', left: 790, top: 410, width: 340, height: 300, borderRadius: 34, display: 'grid', placeItems: 'center', textAlign: 'center', background: COLORS.orange, color: COLORS.ink, boxShadow: '0 0 80px rgba(242,140,69,.25)'}}><div><div style={{fontFamily: FONTS.mono, fontSize: 18, letterSpacing: '.12em'}}>2013</div><div style={{fontFamily: FONTS.serif, fontSize: 62, fontWeight: 800, marginTop: 8}}>综管办</div><div style={{fontFamily: FONTS.sans, fontSize: 25, marginTop: 12}}>组织协调</div></div></div>
    {targets.map(([name, x, y], i) => <Panel key={name} dark style={{position: 'absolute', left: x - 145, top: y - 64, width: 290, height: 128, display: 'grid', placeItems: 'center', fontFamily: FONTS.serif, fontSize: 38, opacity: fadeUp(frame, 55 + i * 28, 24).opacity}}>{name}</Panel>)}
    {['人员', '预算', '执法权'].map((item, i) => <div key={item} style={{position: 'absolute', left: 780 + i * 150, top: 785 + Math.min(120, Math.max(0, frame - 190 - i * 15)), color: '#ffffff80', fontFamily: FONTS.sans, fontSize: 30, opacity: interpolate(frame, [185 + i * 15, 240 + i * 15], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>{item}</div>)}
  </SceneShell>;
};

export const CampaignScene: React.FC<SceneProps> = ({shot}) => {
  const frame = useCurrentFrame();
  const sweep = progress(frame, 60, 45);
  const outward = progress(frame, 150, 120);
  return <SceneShell shot={shot}>
    <Grid opacity={.07}/><ChapterHeader shot={shot}/><ShotTitle>高位推动：一夜见效，问题向外移动。</ShotTitle>
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      <path d="M140 700 C420 570 580 720 820 580 S1220 410 1780 510" fill="none" stroke="#1113" strokeWidth={22}/>
      <path d="M140 700 C420 570 580 720 820 580 S1220 410 1780 510" fill="none" stroke="#fff" strokeWidth={4} strokeDasharray="28 24"/>
      <Line x1={760} y1={340} x2={1120} y2={740} p={sweep} color={COLORS.red} width={12}/>
      {[{x:740,y:590},{x:890,y:520},{x:1020,y:500}].map((d, i) => <g key={i} opacity={1 - progress(frame, 70 + i * 10, 35)}><Dot x={d.x} y={d.y} color={COLORS.red} pulse={(frame % 45) / 45}/></g>)}
      <g transform={`translate(${mix(1000, 1510, outward)},${mix(500, 610, outward)})`} opacity={progress(frame, 145, 35)}><Dot x={0} y={0} color={COLORS.red} pulse={(frame % 55) / 55}/></g>
    </svg>
    <Panel style={{position: 'absolute', left: 165, top: 340, width: 430, padding: '34px 38px'}}><div style={{fontFamily: FONTS.mono, fontSize: 18, color: COLORS.green}}>DAY + 1</div><div style={{fontFamily: FONTS.serif, fontSize: 55, fontWeight: 800, marginTop: 14}}>站区“一夜变样”</div><div style={{fontFamily: FONTS.sans, fontSize: 28, color: COLORS.muted, marginTop: 18}}>黑车、违停、黄牛暂时消失</div></Panel>
    <Panel style={{position: 'absolute', right: 145, top: 660, width: 490, padding: '30px 38px', opacity: outward}}><div style={{fontFamily: FONTS.mono, fontSize: 18, color: COLORS.red}}>几分钟路程外</div><div style={{fontFamily: FONTS.serif, fontSize: 48, fontWeight: 800, marginTop: 10}}>绿都大道</div><div style={{fontFamily: FONTS.sans, fontSize: 27, color: COLORS.muted, marginTop: 12}}>问题外移，常态机制未形成</div></Panel>
  </SceneShell>;
};

export const OutsourcingScene: React.FC<SceneProps> = ({shot}) => {
  const frame = useCurrentFrame();
  const services = ['保洁', '绿化', '交通秩序', '设施维护'];
  const vendors = ['企业 A', '企业 B', '企业 C', '企业 D', '企业 E'];
  return <SceneShell shot={shot} dark>
    <Grid light opacity={.07}/><ChapterHeader shot={shot} dark/><ShotTitle dark>专业化增加，接口也在增加。</ShotTitle>
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>{services.flatMap((_, i) => vendors.map((__, j) => {const p = progress(frame, 80 + (i * vendors.length + j) * 6, 38); return <Line key={`${i}-${j}`} x1={360} y1={360 + i * 120} x2={1560} y2={315 + j * 105} p={p} color={(i + j) % 3 === 0 ? COLORS.orange : COLORS.blue} width={2} dashed={(i + j) % 2 === 0}/>;}))}</svg>
    {services.map((s, i) => <Label key={s} accent={i === 2} style={{position: 'absolute', left: 170, top: 325 + i * 120, width: 250, opacity: fadeUp(frame, 40 + i * 20, 20).opacity}}>{s}</Label>)}
    {vendors.map((v, i) => <Panel key={v} dark style={{position: 'absolute', left: 1430, top: 280 + i * 105, width: 260, height: 78, display: 'grid', placeItems: 'center', fontFamily: FONTS.sans, fontSize: 28, opacity: fadeUp(frame, 65 + i * 18, 22).opacity}}>{v}</Panel>)}
    <div style={{position: 'absolute', left: 690, top: 390, width: 540, textAlign: 'center'}}><div style={{fontFamily: FONTS.serif, fontSize: 128, fontWeight: 800, color: COLORS.orange}}>3—4</div><div style={{fontFamily: FONTS.sans, fontSize: 28}}>市政绿化保洁主体</div><div style={{height: 1, background: '#ffffff38', margin: '34px 0'}}/><div style={{fontFamily: FONTS.serif, fontSize: 128, fontWeight: 800, color: COLORS.blue}}>7—8</div><div style={{fontFamily: FONTS.sans, fontSize: 28}}>交通秩序管理主体</div></div>
  </SceneShell>;
};

export const PlatformBirthScene: React.FC<SceneProps> = ({shot}) => {
  const frame = useCurrentFrame();
  const join = progress(frame, 95, 95);
  const services = ['保洁', '绿化', '市容秩序', '设施巡查', '停车管理'];
  return <SceneShell shot={shot}>
    <Grid opacity={.08}/><ChapterHeader shot={shot}/><ShotTitle>二〇二四年，平台企业进入南站。</ShotTitle>
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}><Line x1={390} y1={470} x2={850} y2={570} p={join} width={5}/><Line x1={1530} y1={470} x2={1070} y2={570} p={join} color={COLORS.blue} width={5}/>{services.map((_, i) => {const x = 450 + i * 255; return <Line key={i} x1={960} y1={655} x2={x} y2={810} p={progress(frame, 190 + i * 15, 50)} color={i % 2 ? COLORS.blue : COLORS.orange} width={3}/>;})}</svg>
    {[['铁投集团', '国资背景／长期承诺', 225, COLORS.orange], ['万物云', '市场运营／数字技术', 1320, COLORS.blue]].map(([title, detail, left, color]) => <Panel key={String(title)} style={{position: 'absolute', left: Number(left), top: 375, width: 380, height: 185, padding: '32px 36px', borderTop: `5px solid ${color}`}}><div style={{fontFamily: FONTS.serif, fontSize: 48, fontWeight: 800}}>{title}</div><div style={{fontFamily: FONTS.sans, fontSize: 26, color: COLORS.muted, marginTop: 18}}>{detail}</div></Panel>)}
    <div style={{position: 'absolute', left: 775, top: 460, width: 370, height: 260, borderRadius: 42, display: 'grid', placeItems: 'center', textAlign: 'center', background: COLORS.navy, color: COLORS.white, boxShadow: `0 25px 80px rgba(7,25,38,.25)`, transform: `scale(${mix(.84, 1, join)})`, opacity: join}}><div><div style={{fontFamily: FONTS.mono, fontSize: 18, color: COLORS.orangeLight, letterSpacing: '.13em'}}>2024 · JOINT VENTURE</div><div style={{fontFamily: FONTS.serif, fontSize: 62, fontWeight: 800, marginTop: 14}}>交控万物</div><div style={{fontFamily: FONTS.sans, fontSize: 25, marginTop: 8, color: '#ffffffaa'}}>国有控股 · 市场运作</div></div></div>
    {services.map((s, i) => <Label key={s} accent={i === Math.floor(frame / 50) % services.length} style={{position: 'absolute', left: 335 + i * 255, top: 800, width: 230, opacity: fadeUp(frame, 205 + i * 15, 22).opacity}}>{s}</Label>)}
  </SceneShell>;
};

export const SingleInterfaceScene: React.FC<SceneProps> = ({shot}) => {
  const frame = useCurrentFrame();
  const principals = ['雨花台', '江宁', '铁路', '地铁', '综管办'];
  const teams = ['保洁班组', '巡查班组', '停车班组', '设施班组'];
  return <SceneShell shot={shot} dark>
    <Grid light opacity={.07}/><ChapterHeader shot={shot} dark/><ShotTitle dark>多甲方，面对一个相对统一的执行界面。</ShotTitle>
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>{principals.map((_, i) => <Line key={`p${i}`} x1={300} y1={325 + i * 120} x2={825} y2={570} p={progress(frame, 60 + i * 18, 80)} color={COLORS.orange} width={3}/>)}{teams.map((_, i) => <Line key={`t${i}`} x1={1095} y1={570} x2={1620} y2={390 + i * 120} p={progress(frame, 175 + i * 18, 70)} color={COLORS.blue} width={3}/>)}</svg>
    {principals.map((p, i) => <Label key={p} style={{position: 'absolute', left: 165, top: 292 + i * 120, width: 270, opacity: fadeUp(frame, 35 + i * 17, 20).opacity}}>{p}</Label>)}
    {teams.map((t, i) => <Label key={t} style={{position: 'absolute', left: 1490, top: 357 + i * 120, width: 270, opacity: fadeUp(frame, 190 + i * 16, 20).opacity}}>{t}</Label>)}
    <div style={{position: 'absolute', left: 785, top: 395, width: 350, height: 350, borderRadius: 175, display: 'grid', placeItems: 'center', textAlign: 'center', background: COLORS.orange, color: COLORS.ink, boxShadow: `0 0 ${50 + Math.sin(frame * .025) * 10}px rgba(242,140,69,.3)`}}><div><div style={{fontFamily: FONTS.mono, fontSize: 17, letterSpacing: '.12em'}}>29 类公共服务</div><div style={{fontFamily: FONTS.serif, fontSize: 59, fontWeight: 800, marginTop: 13}}>交控万物</div><div style={{fontFamily: FONTS.sans, fontSize: 24, marginTop: 12}}>统一可契约化服务界面</div></div></div>
    <div style={{position: 'absolute', left: 600, top: 790, right: 600, textAlign: 'center', fontFamily: FONTS.serif, fontSize: 40, color: COLORS.orangeLight, opacity: fadeUp(frame, 275, 30).opacity}}>行政执法与属地责任并未交给企业</div>
  </SceneShell>;
};

export const CityBrainScene: React.FC<SceneProps> = ({shot}) => {
  const frame = useCurrentFrame();
  const scanY = mix(20, 650, progress(frame, 55, 230));
  const markers = [{x:310,y:230,l:'位置'},{x:730,y:300,l:'状态'},{x:1080,y:210,l:'养护记录'},{x:1330,y:430,l:'工单'}];
  return <SceneShell shot={shot} dark>
    <AbsoluteFill style={{background: COLORS.navy}}/><Grid light opacity={.06}/><ChapterHeader shot={shot} dark/><ShotTitle dark>城市小脑，看见同一张图上的现场。</ShotTitle>
    <div style={{position: 'absolute', left: 120, right: 120, top: 270, height: 560, borderRadius: 28, overflow: 'hidden', border: `1px solid ${COLORS.blue}66`, boxShadow: `0 0 90px ${COLORS.blue}18`}}><Img src={staticFile('images/city-brain-dashboard.jpeg')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${mix(1.06, 1.02, progress(frame, 0, shot.durationFrames))})`, filter: 'saturate(.8) contrast(1.1)'}}/><AbsoluteFill style={{background: 'rgba(7,25,38,.16)'}}/><div style={{position: 'absolute', left: 0, right: 0, top: scanY, height: 3, background: COLORS.blue, boxShadow: `0 0 26px ${COLORS.blue}`}}/>{markers.map((m, i) => {const p = spring({fps: 30, frame: frame - 95 - i * 45, config: {damping: 18, stiffness: 130}}); return <div key={m.l} style={{position: 'absolute', left: m.x, top: m.y, width: 220, height: 105, border: `3px solid ${i % 2 ? COLORS.orange : COLORS.blue}`, borderRadius: 10, opacity: Math.max(0, Math.min(1, p)), transform: `scale(${mix(1.35, 1, Math.max(0, Math.min(1, p)))})`}}><span style={{position: 'absolute', left: 12, top: -42, padding: '6px 10px', borderRadius: 6, background: 'rgba(7,25,38,.9)', color: i % 2 ? COLORS.orangeLight : COLORS.blue, fontFamily: FONTS.mono, fontSize: 18}}>{m.l}</span></div>;})}</div>
  </SceneShell>;
};

export const MultiSourceScene: React.FC<SceneProps> = ({shot}) => {
  const frame = useCurrentFrame();
  const sources = [['物联设备', '设备状态'], ['工作人员', '移动端上报'], ['市民报事', '位置与现场'], ['AI 巡查', '疑似问题']];
  return <SceneShell shot={shot}>
    <Grid opacity={.08}/><ChapterHeader shot={shot}/><ShotTitle>四路信息，落到同一张图。</ShotTitle>
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>{sources.map((_, i) => {const x = 260 + i * 465; return <Line key={i} x1={x} y1={450} x2={960} y2={730} p={progress(frame, 95 + i * 35, 100)} color={i % 2 ? COLORS.blue : COLORS.orange} width={4}/>;})}</svg>
    <div style={{position: 'absolute', left: 98, right: 98, top: 315, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20}}>{sources.map(([name, detail], i) => <Panel key={name} style={{height: 235, padding: '32px 34px', ...fadeUp(frame, 45 + i * 30, 25)}}><div style={{fontFamily: FONTS.mono, fontSize: 17, color: i % 2 ? COLORS.blue : COLORS.orange}}>SOURCE 0{i + 1}</div><div style={{fontFamily: FONTS.serif, fontSize: 43, fontWeight: 800, marginTop: 20}}>{name}</div><div style={{fontFamily: FONTS.sans, fontSize: 25, color: COLORS.muted, marginTop: 14}}>{detail}</div></Panel>)}</div>
    <div style={{position: 'absolute', left: 710, top: 665, width: 500, height: 165, borderRadius: 82, display: 'grid', placeItems: 'center', textAlign: 'center', color: COLORS.white, background: COLORS.navy, boxShadow: '0 28px 80px rgba(7,25,38,.23)', transform: `scale(${mix(.85, 1, progress(frame, 205, 40))})`, opacity: progress(frame, 185, 40)}}><div><div style={{fontFamily: FONTS.serif, fontSize: 47, fontWeight: 800}}>一条待处理线索</div><div style={{fontFamily: FONTS.mono, fontSize: 18, color: COLORS.blue, marginTop: 9}}>LOCATION · STATUS · EVIDENCE</div></div></div>
  </SceneShell>;
};

export const StandardsScene: React.FC<SceneProps> = ({shot}) => {
  const frame = useCurrentFrame();
  const fields = ['问题类别', '位置', '责任人', '处置时限'];
  const flip = progress(frame, 80, 160);
  return <SceneShell shot={shot}>
    <Grid opacity={.08}/><ChapterHeader shot={shot}/><ShotTitle>规则不会凭空出现：五百余项标准进入工单。</ShotTitle>
    <div style={{position: 'absolute', left: 155, top: 310, width: 600, height: 490, perspective: 1000}}>{[2,1,0].map((n) => <div key={n} style={{position: 'absolute', inset: `${n * 18}px ${n * 14}px ${-n * 18}px ${-n * 14}px`, padding: '42px', borderRadius: 18, background: n ? COLORS.paperDeep : COLORS.white, border: '1px solid #1112', boxShadow: '0 22px 65px rgba(17,16,14,.12)', transform: n === 0 ? `rotateY(${flip * -8}deg)` : undefined}}><div style={{fontFamily: FONTS.mono, fontSize: 17, color: COLORS.orange}}>OPERATING STANDARD · {500 + n}</div><div style={{fontFamily: FONTS.serif, fontSize: 46, fontWeight: 800, marginTop: 22}}>现场作业规范</div>{[0,1,2,3].map((r) => <div key={r} style={{height: 13, width: `${92 - r * 10}%`, borderRadius: 7, background: '#1112', marginTop: 25}}/>)}</div>)}</div>
    <div style={{position: 'absolute', left: 860, top: 345, fontFamily: FONTS.serif, fontSize: 118, color: COLORS.orange, fontWeight: 800, letterSpacing: '-.06em'}}>500<span style={{fontSize: 60}}>+</span></div>
    <div style={{position: 'absolute', left: 860, top: 515, right: 120, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>{fields.map((f, i) => <Panel key={f} style={{height: 116, display: 'flex', alignItems: 'center', padding: '0 28px', fontFamily: FONTS.serif, fontSize: 38, fontWeight: 750, ...fadeUp(frame, 165 + i * 35, 24)}}><span style={{fontFamily: FONTS.mono, fontSize: 17, color: COLORS.orange, marginRight: 20}}>0{i + 1}</span>{f}</Panel>)}</div>
  </SceneShell>;
};

export const DispatchScene: React.FC<SceneProps> = ({shot}) => {
  const frame = useCurrentFrame();
  const route = progress(frame, 85, 220);
  const targets = [['云城队长', 1420, 350], ['专业队伍', 1510, 560], ['无人设备', 1370, 760]] as const;
  const x = route < .45 ? mix(510, 980, route / .45) : mix(980, 1420, (route - .45) / .55);
  const y = route < .45 ? mix(650, 535, route / .45) : mix(535, 350, (route - .45) / .55);
  return <SceneShell shot={shot} dark>
    <Grid light opacity={.07}/><ChapterHeader shot={shot} dark/><ShotTitle dark>派给最近，也派给最合适的人。</ShotTitle>
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}><path d="M510 650 Q760 410 980 535 Q1190 650 1420 350" fill="none" stroke="#ffffff20" strokeWidth={12}/><path d="M510 650 Q760 410 980 535 Q1190 650 1420 350" fill="none" stroke={COLORS.orange} strokeWidth={4} strokeDasharray="12 16"/>{targets.map(([,tx,ty], i) => <Line key={i} x1={980} y1={535} x2={tx} y2={ty} p={progress(frame, 155 + i * 30, 100)} color={i ? COLORS.blue : COLORS.orange} width={3}/>) }<Dot x={x} y={y} pulse={(frame % 45) / 45}/></svg>
    <Panel dark style={{position: 'absolute', left: 200, top: 525, width: 430, height: 250, padding: '34px'}}><div style={{fontFamily: FONTS.mono, fontSize: 18, color: COLORS.blue}}>WORK ORDER · #NS-0248</div><div style={{fontFamily: FONTS.serif, fontSize: 45, fontWeight: 800, marginTop: 20}}>设施异常</div><div style={{fontFamily: FONTS.sans, fontSize: 25, color: '#ffffffa5', marginTop: 18}}>类型 + 位置 + 时限 + 权限</div></Panel>
    {targets.map(([name, tx, ty], i) => <Label key={name} accent={i === 0} style={{position: 'absolute', left: tx - 140, top: ty - 42, width: 280, opacity: fadeUp(frame, 175 + i * 30, 24).opacity}}>{name}</Label>)}
    <div style={{position: 'absolute', left: 745, top: 690, fontFamily: FONTS.serif, fontSize: 43, color: COLORS.orangeLight, opacity: fadeUp(frame, 245, 30).opacity}}>“就跟美团派接单一样”</div>
  </SceneShell>;
};

export const HumanVerificationScene: React.FC<SceneProps> = ({shot}) => {
  const frame = useCurrentFrame();
  const steps = ['接单', '到场', '判断', '处置', '回传', '复核'];
  const active = Math.min(5, Math.floor(Math.max(0, frame - 70) / 55));
  return <SceneShell shot={shot} dark>
    <div style={{position: 'absolute', left: 0, top: 0, width: '64%', height: '100%', overflow: 'hidden'}}><PhotoLayer src="city-team.jpeg" scale={1.27} endScale={1.17} x={-70} endX={-15}/><AbsoluteFill style={{background: 'linear-gradient(90deg,rgba(7,25,38,.12),rgba(7,25,38,.88))'}}/></div>
    <AbsoluteFill style={{background: 'linear-gradient(90deg,transparent 42%,rgba(7,25,38,.8) 62%,#071926 78%)'}}/><ChapterHeader shot={shot} dark/><ShotTitle dark>工单最后，仍要由人到现场。</ShotTitle>
    <div style={{position: 'absolute', right: 82, top: 285, width: 760}}><div style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>{steps.map((s, i) => <Label key={s} accent={i === active} style={{width: 222, opacity: fadeUp(frame, 55 + i * 22, 20).opacity}}>{String(i + 1).padStart(2, '0')} · {s}</Label>)}</div>
      <div style={{marginTop: 42, display: 'flex', alignItems: 'flex-end', gap: 28}}><div style={{fontFamily: FONTS.serif, fontSize: 120, fontWeight: 800, color: COLORS.orange}}>2</div><div style={{fontFamily: FONTS.sans, fontSize: 30, paddingBottom: 14}}>处云城驿站</div><div style={{fontFamily: FONTS.serif, fontSize: 120, fontWeight: 800, color: COLORS.blue}}>6</div><div style={{fontFamily: FONTS.sans, fontSize: 30, paddingBottom: 14}}>处服务点</div></div>
      <Panel dark style={{marginTop: 24, padding: '28px 32px', borderLeft: `5px solid ${COLORS.orange}`}}><div style={{fontFamily: FONTS.serif, fontSize: 48, fontWeight: 800}}>单日最高服务旅客 4 万人次</div><div style={{fontFamily: FONTS.sans, fontSize: 26, color: '#ffffffa8', marginTop: 12}}>节假日口径 · 人工判断与责任不交给算法</div></Panel>
    </div>
  </SceneShell>;
};

export const ParkingBoundaryScene: React.FC<SceneProps> = ({shot}) => {
  const frame = useCurrentFrame();
  const line = progress(frame, 70, 85);
  const car = progress(frame, 105, 180);
  return <SceneShell shot={shot} dark>
    <div style={{position: 'absolute', inset: 0, right: '50%', overflow: 'hidden'}}><Img src={staticFile('images/parking-dashboard.png')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(.72) brightness(.65)', transform: `scale(${mix(1.09, 1.02, progress(frame, 0, shot.durationFrames))})`}}/></div>
    <div style={{position: 'absolute', inset: 0, left: '50%', overflow: 'hidden'}}><Img src={staticFile('images/parking-scene.jpeg')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(.55) brightness(.62)', transform: `scale(${mix(1.08, 1.02, progress(frame, 0, shot.durationFrames))})`}}/></div>
    <AbsoluteFill style={{background: 'linear-gradient(90deg,rgba(7,25,38,.5),rgba(7,25,38,.08) 48%,rgba(7,25,38,.4))'}}/><ChapterHeader shot={shot} dark/><ShotTitle dark>同一股车流，在出口跨过两套行动权限。</ShotTitle>
    <div style={{position: 'absolute', left: 958, top: 255, bottom: 160, width: 5, background: COLORS.red, transformOrigin: 'top', transform: `scaleY(${line})`, boxShadow: `0 0 28px ${COLORS.red}`}}/>
    <Label accent style={{position: 'absolute', left: 250, top: 360, width: 390}}>红线内 · 停车场运营管理</Label><Label style={{position: 'absolute', right: 235, top: 360, width: 440}}>红线外 · 法定交通指挥</Label>
    <div style={{position: 'absolute', left: mix(350, 1000, car), top: 655 + Math.sin(car * Math.PI) * -45, width: 170, height: 76, borderRadius: 18, background: COLORS.orange, boxShadow: '0 18px 50px rgba(0,0,0,.35)', transform: `translateX(-50%) scale(${car > .92 ? 0 : 1})`, opacity: car > .92 ? 0 : 1}}><div style={{position: 'absolute', left: 24, right: 24, top: 20, height: 20, borderRadius: 10, background: COLORS.ink}}/><div style={{position: 'absolute', left: 22, bottom: -12, width: 28, height: 28, borderRadius: '50%', background: COLORS.ink}}/><div style={{position: 'absolute', right: 22, bottom: -12, width: 28, height: 28, borderRadius: '50%', background: COLORS.ink}}/></div>
    <div style={{position: 'absolute', left: 112, top: 785, fontFamily: FONTS.mono, fontSize: 20, color: COLORS.orangeLight}}>2025.05 · AI 改造</div><div style={{position: 'absolute', right: 110, top: 785, fontFamily: FONTS.serif, fontSize: 48, fontWeight: 800}}>P1—P8 · 8 个地下停车场<span style={{fontSize: 23, color: '#ffffff88'}}>（截至调研时）</span></div>
  </SceneShell>;
};

export const InstitutionalInterfacesScene: React.FC<SceneProps> = ({shot}) => {
  const frame = useCurrentFrame();
  const boundaries = ['执法权', '数据权', '产权', '属地责任'];
  return <SceneShell shot={shot} dark>
    <PhotoLayer src="coordination-meeting.jpeg" scale={1.18} endScale={1.09} filter="saturate(.35) contrast(1.1) brightness(.48)"/>
    <AbsoluteFill style={{background: 'rgba(7,25,38,.62)'}}/><Grid light opacity={.06}/><ChapterHeader shot={shot} dark/><ShotTitle dark>平台仍要回到制度接口。</ShotTitle>
    <div style={{position: 'absolute', left: 112, right: 112, top: 310, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26}}>{[['雨花台', '节假日会议'], ['江宁', '节假日会议']].map(([a, b], i) => <Panel key={a} dark style={{height: 210, padding: '36px 42px', borderTop: `5px solid ${i ? COLORS.blue : COLORS.orange}`, ...fadeUp(frame, 50 + i * 36, 26)}}><div style={{fontFamily: FONTS.mono, fontSize: 18, color: i ? COLORS.blue : COLORS.orangeLight}}>MEETING 0{i + 1}</div><div style={{fontFamily: FONTS.serif, fontSize: 56, fontWeight: 800, marginTop: 16}}>{a}</div><div style={{fontFamily: FONTS.sans, fontSize: 25, color: '#ffffffa8', marginTop: 8}}>{b}</div></Panel>)}</div>
    <div style={{position: 'absolute', left: 115, right: 115, top: 585, display: 'flex', gap: 20}}>{boundaries.map((b, i) => <div key={b} style={{flex: 1, height: 170, display: 'grid', placeItems: 'center', borderRadius: 22, background: i === Math.floor(frame / 65) % 4 ? COLORS.orange : 'rgba(7,25,38,.9)', border: `1px solid ${i === Math.floor(frame / 65) % 4 ? COLORS.orange : '#ffffff25'}`, color: i === Math.floor(frame / 65) % 4 ? COLORS.ink : COLORS.white, fontFamily: FONTS.serif, fontSize: 46, fontWeight: 800, ...fadeUp(frame, 125 + i * 36, 24)}}>{b}</div>)}</div>
    <div style={{position: 'absolute', left: 115, top: 805, fontFamily: FONTS.sans, fontSize: 30, color: '#ffffffb5'}}>巡查、劝导、上报、调度服务</div><div style={{position: 'absolute', right: 115, top: 805, fontFamily: FONTS.sans, fontSize: 30, color: COLORS.orangeLight}}>处罚、授权、责任认定 → 法定主体</div>
  </SceneShell>;
};

export const TransactionCostsScene: React.FC<SceneProps> = ({shot}) => {
  const frame = useCurrentFrame();
  const causes = ['任务高度互依', '主体与信息分散', '规则难以写清'];
  const costs = [['谈判', .62], ['协调', .9], ['监督', .74]] as const;
  return <SceneShell shot={shot}>
    <Grid opacity={.08}/><ChapterHeader shot={shot}/><ShotTitle>碎片化为何转化为高交易成本？</ShotTitle>
    <div style={{position: 'absolute', left: 110, top: 335, display: 'flex', alignItems: 'center', gap: 20}}>{causes.map((c, i) => <React.Fragment key={c}><Panel style={{width: 390, height: 180, padding: '35px', display: 'grid', alignContent: 'center', ...fadeUp(frame, 45 + i * 45, 25)}}><div style={{fontFamily: FONTS.mono, fontSize: 17, color: COLORS.orange}}>CAUSE 0{i + 1}</div><div style={{fontFamily: FONTS.serif, fontSize: 42, fontWeight: 800, marginTop: 15, whiteSpace: 'nowrap'}}>{c}</div></Panel>{i < 2 ? <div style={{fontFamily: FONTS.serif, fontSize: 62, color: COLORS.orange, opacity: fadeUp(frame, 90 + i * 45, 20).opacity}}>×</div> : null}</React.Fragment>)}</div>
    <div style={{position: 'absolute', left: 110, top: 590, width: 1200, height: 250, display: 'flex', alignItems: 'flex-end', gap: 35}}>{costs.map(([label, h], i) => {const p = progress(frame, 185 + i * 30, 90); return <div key={label} style={{width: 350}}><div style={{height: 210 * h * p, borderRadius: '18px 18px 0 0', background: i === 1 ? COLORS.orange : COLORS.navy, transition: 'none'}}/><div style={{marginTop: 14, fontFamily: FONTS.serif, fontSize: 34, fontWeight: 800, textAlign: 'center'}}>{label}成本</div></div>;})}</div>
    <div style={{position: 'absolute', right: 125, top: 555, width: 390, padding: '36px', borderLeft: `6px solid ${COLORS.red}`, background: 'rgba(255,253,248,.84)'}}><div style={{fontFamily: FONTS.serif, fontSize: 48, fontWeight: 800, lineHeight: 1.25}}>三次尝试都没有改变<br/><span style={{color: COLORS.red}}>多主体、多界面</span></div></div>
  </SceneShell>;
};

export const TwoAdjustmentsScene: React.FC<SceneProps> = ({shot}) => {
  const frame = useCurrentFrame();
  const collapse = progress(frame, 45, 120);
  const expand = progress(frame, 175, 150);
  const left = ['区属', '铁路', '地铁', '交管', '城管'];
  const right = ['感知', '派单', '处置', '核验', '反馈'];
  return <SceneShell shot={shot} dark>
    <Grid light opacity={.08}/><ChapterHeader shot={shot} dark/><ShotTitle dark>平台化改结构，智能化扩能力。</ShotTitle>
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>{left.map((_, i) => <Line key={`l${i}`} x1={260} y1={330 + i * 115} x2={820} y2={560} p={collapse} color={COLORS.orange} width={3}/>)}{right.slice(0, -1).map((_, i) => <Line key={`r${i}`} x1={1120 + i * 130} y1={560 + (i % 2 ? 90 : -90)} x2={1250 + i * 130} y2={560 + ((i + 1) % 2 ? 90 : -90)} p={expand} color={COLORS.blue} width={4}/>)}</svg>
    {left.map((l, i) => <Label key={l} style={{position: 'absolute', left: mix(145, 705, collapse), top: mix(300 + i * 115, 525, collapse), width: mix(230, 115, collapse), opacity: 1 - collapse * .25, fontSize: 24}}>{l}</Label>)}
    <div style={{position: 'absolute', left: 765, top: 420, width: 390, height: 300, borderRadius: 38, display: 'grid', placeItems: 'center', textAlign: 'center', background: COLORS.orange, color: COLORS.ink, boxShadow: '0 0 70px rgba(242,140,69,.28)', transform: `scale(${mix(.85, 1, collapse)})`}}><div><div style={{fontFamily: FONTS.mono, fontSize: 17}}>STRUCTURAL ADJUSTMENT</div><div style={{fontFamily: FONTS.serif, fontSize: 62, fontWeight: 800, marginTop: 12}}>平台化</div><div style={{fontFamily: FONTS.sans, fontSize: 25, marginTop: 8}}>统一执行界面</div></div></div>
    <div style={{position: 'absolute', left: 1170, top: 340, right: 85, display: 'flex', flexDirection: 'column', gap: 20}}>{right.map((r, i) => <Label key={r} style={{width: 290, alignSelf: i % 2 ? 'flex-end' : 'flex-start', opacity: progress(frame, 165 + i * 28, 24), transform: `translateX(${(1 - expand) * 30}px)`}}>{String(i + 1).padStart(2, '0')} · {r}</Label>)}</div>
    <div style={{position: 'absolute', left: 120, top: 820, fontFamily: FONTS.serif, fontSize: 38, color: COLORS.orangeLight}}>外部交易 → 内部协调</div><div style={{position: 'absolute', right: 100, top: 820, fontFamily: FONTS.serif, fontSize: 38, color: COLORS.blue}}>信息处理 → 任务调度 → 结果校验</div>
  </SceneShell>;
};

export const ConclusionScene: React.FC<SceneProps> = ({shot}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, 0, shot.durationFrames);
  const text = fadeUp(frame, 45, 35, 34);
  const team = fadeUp(frame, 115, 28, 22);
  return <SceneShell shot={shot} dark>
    <PhotoLayer src="nanjing-south-aerial.jpeg" scale={1.07} endScale={1.01} filter="saturate(.56) contrast(1.1) brightness(.56)"/>
    <AbsoluteFill style={{background: 'linear-gradient(90deg,rgba(4,12,18,.94),rgba(4,12,18,.45) 75%,rgba(4,12,18,.2)),linear-gradient(0deg,rgba(4,12,18,.82),transparent 55%)'}}/>
    <Grid light opacity={.08}/>
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}><path d="M120 720 C450 620 680 690 940 530 S1410 470 1780 290" fill="none" stroke="#ffffff3d" strokeWidth={2} strokeDasharray="12 17"/><path d="M120 720 C450 620 680 690 940 530 S1410 470 1780 290" fill="none" stroke={COLORS.orange} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p}/><Dot x={mix(120, 1780, p)} y={mix(720, 290, p)} pulse={(frame % 60) / 60}/></svg>
    <div style={{position: 'absolute', left: 108, top: 135, color: COLORS.orangeLight, fontFamily: FONTS.mono, fontSize: 20, letterSpacing: '.15em'}}>CASE ANSWER · FUNCTIONAL INTEGRATION</div>
    <div style={{position: 'absolute', left: 108, top: 255, ...text}}><div style={{fontFamily: FONTS.serif, fontSize: 86, lineHeight: 1.17, color: COLORS.white, fontWeight: 780, letterSpacing: '-.05em'}}>行政边界不变，<br/><span style={{color: COLORS.orangeLight}}>功能得以整合。</span></div><div style={{marginTop: 30, fontFamily: FONTS.sans, fontSize: 34, color: '#ffffffca', whiteSpace: 'nowrap'}}>平台负责运营整合；政府保留制度制定、行政执法和责任监督。</div></div>
    <div style={{position: 'absolute', left: 108, top: 688, ...team}}><TeamLockup size={88}/></div>
  </SceneShell>;
};
