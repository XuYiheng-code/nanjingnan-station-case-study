import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, Shot, clamp, mix} from './data';
import {DrawLine, Eyebrow, Grain, Grid, Photo, SceneFade, SceneTitle, Subtitle, enter} from './components';

const Panel: React.FC<React.PropsWithChildren<{style?: React.CSSProperties}>> = ({children, style}) => <div style={{border: '1px solid rgba(17,16,14,.16)', borderRadius: 22, background: 'rgba(255,253,248,.93)', boxShadow: '0 22px 60px rgba(17,16,14,.13)', ...style}}>{children}</div>;

const pageLabel = (n: number, text: string, dark = false) => <div style={{position: 'absolute', left: 92, top: 65, display: 'flex', alignItems: 'center', gap: 18, color: dark ? C.white : C.ink, fontFamily: FONT.mono, fontSize: 20, letterSpacing: '.12em'}}><span style={{color: C.signal}}>0{n}</span><span style={{width: 52, height: 1, background: dark ? '#fff6' : '#1115'}}/><span>{text}</span></div>;

export const Opening: React.FC<{shot: Shot}> = ({shot}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 150], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  const scale = mix(1.26, 1.04, p);
  const coverOpacity = interpolate(frame, [0, 118, 158], [1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const title = enter(frame, 158, 34);
  const statCue = [220, 258, 296, 334];
  const stats = [['大客流', '综合交通枢纽'], ['8万', '案例称站区日车流量可达'], ['2区', '雨花台 × 江宁'], ['10+', '条块部门参与']];
  return <SceneFade duration={shot.duration}>
    <Photo src="nanjing-south-aerial.jpeg" scale={scale} x={mix(-30, 0, p)} />
    <AbsoluteFill style={{background: 'linear-gradient(90deg,rgba(8,8,7,.94) 0%,rgba(8,8,7,.58) 54%,rgba(8,8,7,.12) 82%),linear-gradient(0deg,rgba(8,8,7,.86),transparent 53%)'}}/>
    <Grid dark opacity={0.12}/>
    <div style={{position: 'absolute', left: 108, top: 130, color: C.signal2, fontFamily: FONT.mono, fontSize: 21, fontWeight: 700, letterSpacing: '.16em', opacity: Math.max(coverOpacity, title.opacity)}}>2026 · 中国智能社会治理公共政策案例分析大赛</div>
    <div style={{position: 'absolute', left: 108, right: 108, top: 260, opacity: coverOpacity, color: C.white}}>
      <div style={{fontFamily: FONT.serif, fontSize: 102, lineHeight: 1.03, fontWeight: 760, letterSpacing: '-.055em'}}>从<span style={{color: C.signal2}}>平台化</span>到<span style={{color: C.signal2}}>智能化</span>：</div>
      <div style={{marginTop: 28, maxWidth: 1500, fontFamily: FONT.serif, fontSize: 68, lineHeight: 1.22, fontWeight: 700, letterSpacing: '-.035em'}}>政企共创平台企业何以化解行政分割难题？</div>
      <div style={{marginTop: 34, display: 'flex', alignItems: 'center', gap: 22, fontFamily: FONT.sans, fontSize: 32, color: '#ffffffd8'}}><span style={{width: 78, height: 3, background: C.signal}}/>——以南京南站跨区域公共交通枢纽为例</div>
    </div>
    <div style={{position: 'absolute', left: 105, top: 238, opacity: title.opacity, transform: `translateY(${title.y}px)`, color: C.white, fontFamily: FONT.serif, fontSize: 104, lineHeight: 1.05, fontWeight: 700, letterSpacing: '-.055em'}}>
      同一片<span style={{color: C.signal}}>空间</span><br/>同时存在<span style={{color: C.signal}}>许多边界</span>
    </div>
    <div style={{position: 'absolute', left: 110, right: 110, top: 625, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18}}>
      {stats.map(([num, label], i) => {
        const a = enter(frame, statCue[i], 24);
        return <div key={num} style={{padding: '26px 18px 24px', borderTop: `2px solid ${i === 0 ? C.signal : '#ffffff55'}`, background: 'rgba(8,8,7,.32)', backdropFilter: 'blur(10px)', opacity: a.opacity, transform: `translateY(${a.y}px)`}}><div style={{fontFamily: FONT.serif, fontSize: 58, color: i === 0 ? C.signal2 : C.white, fontWeight: 700}}>{num}</div><div style={{fontFamily: FONT.sans, fontSize: 32, lineHeight: 1.25, letterSpacing: '-.04em', color: '#ffffffd8'}}>{label}</div></div>;
      })}
    </div>
    <Grain opacity={0.11} light/>
    <Subtitle shot={shot}/>
  </SceneFade>;
};

export const Parking: React.FC<{shot: Shot}> = ({shot}) => {
  const frame = useCurrentFrame();
  const move = interpolate(frame, [0, shot.duration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const lineP = interpolate(frame, [72, 120, 170, 330], [0, 1, 1, .58], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const quote = enter(frame, 250, 30);
  return <SceneFade duration={shot.duration}>
    <Photo src="parking-scene.jpeg" scale={1.12 + move * .05} x={-30 + move * 20}/>
    <AbsoluteFill style={{background: 'linear-gradient(90deg,rgba(7,25,38,.76),rgba(7,25,38,.12) 60%),linear-gradient(0deg,rgba(7,25,38,.85),transparent 60%)'}}/>
    {pageLabel(2, '困局 · 红线内外', true)}
    <div style={{position: 'absolute', left: 110, top: 155, width: 730, color: C.white, fontFamily: FONT.serif, fontSize: 78, lineHeight: 1.12, fontWeight: 700}}>同一股车流，<br/><span style={{color: C.signal2}}>两套行动权限。</span></div>
    <div style={{position: 'absolute', left: `${lineP*100}%`, top: 0, bottom: 0, width: 7, background: C.signal, boxShadow: `0 0 26px ${C.signal}`, opacity: .95}}/>
    <div style={{position: 'absolute', left: Math.max(110, lineP*1920-365), top: 420, padding: '18px 22px', borderRadius: 15, color: C.white, background: 'rgba(17,16,14,.72)', fontFamily: FONT.sans, fontSize: 32, fontWeight: 650}}>停车场内 · 企业运营</div>
    <div style={{position: 'absolute', left: Math.min(1510, lineP*1920+24), top: 520, padding: '18px 22px', borderRadius: 15, color: C.ink, background: C.signal, fontFamily: FONT.sans, fontSize: 32, fontWeight: 700}}>公共道路 · 部门执法</div>
    <div style={{position: 'absolute', right: 92, top: 92, width: 620, padding: '28px 32px', borderLeft: `4px solid ${C.signal}`, color: C.white, background: 'rgba(7,25,38,.72)', backdropFilter: 'blur(14px)', fontFamily: FONT.serif, fontSize: 32, lineHeight: 1.55, opacity: quote.opacity, transform: `translateY(${quote.y}px)`}}>“停车场的门开不开，什么时候开……也必须要跟外头联动起来。”<div style={{marginTop: 13, color: C.signal2, fontFamily: FONT.mono, fontSize: 32}}>访谈记录 · 20251022A</div></div>
    <Grain opacity={0.1} light/>
    <Subtitle shot={shot}/>
  </SceneFade>;
};

const actors = [
  {name: '雨花台区', x: 250, y: 350}, {name: '江宁区', x: 650, y: 325}, {name: '铁路系统', x: 1070, y: 325}, {name: '地铁系统', x: 1480, y: 355},
  {name: '公安 / 交管', x: 1700, y: 575}, {name: '城管 / 住建', x: 1390, y: 785}, {name: '资产主体', x: 890, y: 820}, {name: '服务企业', x: 410, y: 780}, {name: '综管办', x: 170, y: 570},
];

export const Fragmentation: React.FC<{shot: Shot}> = ({shot}) => {
  const frame = useCurrentFrame();
  return <SceneFade duration={shot.duration} dark={false}>
    <Grid opacity={0.09}/>{pageLabel(3, '困局 · 有组织的“无序”')}
    <SceneTitle top={112} size={70} width={1050}>每个主体都有职责，<br/>跨过边界就要重新协调。</SceneTitle>
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      {actors.map((a, i) => {
        const p = interpolate(frame, [70+i*20, 112+i*20], [0,1], {extrapolateLeft:'clamp', extrapolateRight:'clamp', easing:Easing.out(Easing.quad)});
        return <DrawLine key={a.name} d={`M 960 540 Q ${(a.x+960)/2 + (i%2?80:-80)} ${(a.y+540)/2} ${a.x} ${a.y}`} progress={p} stroke={i%3===0?C.signal:'#11100e'} width={i%3===0?4:2} opacity={.62}/>;
      })}
      <circle cx="960" cy="540" r={155} fill="none" stroke={C.signal} strokeWidth="4" strokeDasharray="8 14" transform={`rotate(${frame*.08} 960 540)`}/>
    </svg>
    <div style={{position:'absolute', left:780, top:405, width:360, height:270, borderRadius:150, display:'grid', placeItems:'center', color:C.white, background:C.ink, boxShadow:'0 28px 80px rgba(17,16,14,.24)', textAlign:'center'}}><div><div style={{fontFamily:FONT.serif,fontSize:48,fontWeight:700}}>南京南站</div><div style={{fontFamily:FONT.mono,fontSize:17,color:C.signal2,marginTop:8}}>同一片物理空间</div></div></div>
    {actors.map((a,i)=>{const p=spring({frame:frame-(76+i*20),fps:30,config:{damping:18,stiffness:120,mass:.8}}); return <div key={a.name} style={{position:'absolute',left:a.x-110,top:a.y-38,width:220,height:76,borderRadius:38,display:'grid',placeItems:'center',fontFamily:FONT.sans,fontSize:25,fontWeight:650,color:C.ink,background:C.white,border:`2px solid ${i%3===0?C.signal:'#1113'}`,boxShadow:'0 12px 30px rgba(17,16,14,.12)',opacity:clamp(p),transform:`scale(${mix(.7,1,clamp(p))})`}}>{a.name}</div>})}
    <Panel style={{position:'absolute',right:90,top:120,width:485,padding:'22px 28px',fontFamily:FONT.sans,fontSize:24,lineHeight:1.5}}><span style={{color:C.signal,fontFamily:FONT.mono,fontSize:17}}>现场结果</span><br/>同一支运营队伍，仍可能收到两区不同要求。</Panel>
    <Grain opacity={0.08}/><Subtitle shot={shot} dark={false}/>
  </SceneFade>;
};

const milestones = [
  {year:'2011', title:'投入运营', note:'多种交通方式在同一空间换乘'},
  {year:'2013', title:'综管办协调', note:'固定沟通接口，权责结构未改'},
  {year:'专项', title:'高位推动', note:'短期集中资源，日常仍回原分工'},
  {year:'发包', title:'多企治站', note:'单项服务专业化，协同成本仍在'},
  {year:'2024', title:'交控万物成立', note:'逐项整合下游服务接口'},
];

export const History: React.FC<{shot: Shot}> = ({shot}) => {
  const frame = useCurrentFrame();
  const travel = interpolate(frame,[45,540],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.18,.72,.16,1)});
  const worldX = -mix(0,2320,travel);
  const zoom = interpolate(frame,[510,535],[1,1.08],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)});
  return <SceneFade duration={shot.duration} dark={false}>
    <Grid opacity={.08}/>{pageLabel(4,'困局 · 2011—2024 治理结构的尝试')}
    <div style={{position:'absolute',left:0,top:0,width:1920,height:1080,overflow:'hidden',transform:`scale(${zoom})`,transformOrigin:'70% 55%'}}>
      <div style={{position:'absolute',left:330+worldX,top:560,width:3200,height:4,background:C.ink}}/>
      <div style={{position:'absolute',left:330+worldX,top:553,width:3200,display:'flex',gap:94}}>{Array.from({length:30}).map((_,i)=><span key={i} style={{width:8,height:18,borderRadius:5,background:i%5===0?C.signal:C.ink,opacity:i%5===0?1:.28}}/>)}</div>
      {milestones.map((m,i)=>{
        const x=330+i*620+worldX;
        const cue=58+i*105;
        const p=spring({frame:frame-cue,fps:30,config:{damping:16,stiffness:95,mass:1}});
        return <React.Fragment key={m.year}>
          <div style={{position:'absolute',left:x-8,top:542,width:20,height:42,borderRadius:12,background:i===4?C.signal:C.ink}}/>
          <Panel style={{position:'absolute',left:x-165,top:235,width:360,height:255,padding:'28px 30px',transformOrigin:'50% 100%',transform:`translateY(${(1-clamp(p))*50}px) scaleY(${mix(.2,1,clamp(p))})`,opacity:clamp(p)}}><div style={{fontFamily:FONT.mono,color:C.signal,fontSize:25,fontWeight:700}}>{m.year}</div><div style={{fontFamily:FONT.serif,fontSize:42,fontWeight:700,marginTop:15}}>{m.title}</div><div style={{fontFamily:FONT.sans,fontSize:23,lineHeight:1.5,color:C.muted,marginTop:16}}>{m.note}</div></Panel>
        </React.Fragment>})}
    </div>
    <div style={{position:'absolute',left:95,top:120,fontFamily:FONT.serif,fontSize:70,fontWeight:700}}>协调过，整治过，也外包过。</div>
    <Grain opacity={.08}/><Subtitle shot={shot} dark={false}/>
  </SceneFade>;
};

const principals = ['南站综管办','雨花台区','江宁区','铁路系统','地铁系统','其他单位'];
const services = ['保洁','绿化','停车','设施巡查','市政养护','综合服务'];

export const Platform: React.FC<{shot: Shot}> = ({shot}) => {
  const frame=useCurrentFrame();
  const draw=interpolate(frame,[55,215],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.quad)});
  const conv=interpolate(frame,[225,470],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)});
  const erase=interpolate(frame,[485,555],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.quad)});
  return <SceneFade duration={shot.duration}>
    <AbsoluteFill style={{background:`radial-gradient(1000px 650px at 58% 48%,${C.blue},${C.blue2} 72%)`}}/><Grid dark opacity={.08}/>{pageLabel(5,'破局 · 2024 组织中枢出现',true)}
    <SceneTitle dark top={115} size={70}>不先改动上游权力，<br/><span style={{color:C.signal2}}>先重组下游服务接口。</span></SceneTitle>
    <svg width={1920} height={1080} style={{position:'absolute',inset:0,overflow:'visible'}}>
      {principals.map((_,i)=>{const y=360+i*82; const d=`M 300 ${y} C 610 ${y} 670 560 930 560`; return <path key={i} d={d} fill="none" stroke={i%2?C.electric:C.signal} strokeWidth={2.5} pathLength={1} strokeDasharray={1} strokeDashoffset={erase>0?-erase:1-draw} opacity={.58}/>})}
      {services.map((_,i)=>{const y=360+i*82; const d=`M 1620 ${y} C 1310 ${y} 1220 560 990 560`; return <path key={i} d={d} fill="none" stroke={i%2?C.electric:C.signal} strokeWidth={2.5} pathLength={1} strokeDasharray={1} strokeDashoffset={erase>0?-erase:1-draw} opacity={.58}/>})}
    </svg>
    {principals.map((name,i)=>{const y=360+i*82;const p=clamp((frame-(220+i*8))/190);const x=mix(190,900,Easing.inOut(Easing.cubic)(p));const s=p<.75?mix(1,.45,p/.75):mix(.45,0,(p-.75)/.25);return <div key={name} style={{position:'absolute',left:x-120,top:y-34,width:240,height:68,borderRadius:34,display:'grid',placeItems:'center',background:C.white,color:C.ink,fontFamily:FONT.sans,fontSize:28,fontWeight:650,boxShadow:'0 10px 24px #0005',opacity:frame<45+i*10?0:1,transform:`scale(${s})`}}>{name}</div>})}
    {services.map((name,i)=>{const y=360+i*82;const p=clamp((frame-(235+i*8))/180);const x=mix(1730,1020,Easing.inOut(Easing.cubic)(p));const s=p<.75?mix(1,.45,p/.75):mix(.45,0,(p-.75)/.25);return <div key={name} style={{position:'absolute',left:x-96,top:y-32,width:192,height:64,borderRadius:32,display:'grid',placeItems:'center',background:'rgba(143,215,255,.13)',border:`1px solid ${C.electric}88`,color:C.white,fontFamily:FONT.sans,fontSize:27,fontWeight:650,opacity:frame<65+i*9?0:1,transform:`scale(${s})`}}>{name}</div>})}
    <div style={{position:'absolute',left:790,top:420,width:340,height:280,borderRadius:32,display:'grid',placeItems:'center',textAlign:'center',background:C.signal,color:C.ink,boxShadow:`0 0 ${60+conv*40}px rgba(242,140,69,.35)`,transform:`scale(${1+Math.sin(conv*Math.PI)*.07})`}}><div><div style={{fontFamily:FONT.mono,fontSize:17,letterSpacing:'.12em'}}>统一运营界面</div><div style={{fontFamily:FONT.serif,fontSize:58,fontWeight:800,marginTop:12}}>交控万物</div><div style={{fontFamily:FONT.sans,fontSize:22,marginTop:10}}>多甲方 → 一乙方</div></div></div>
    <Grain opacity={.09} light/><Subtitle shot={shot}/>
  </SceneFade>;
};

const scanTargets=[
  {x:290,y:280,w:300,h:120,label:'事件识别'}, {x:640,y:275,w:430,h:120,label:'位置与图像'}, {x:1120,y:270,w:390,h:130,label:'任务状态'},
  {x:350,y:520,w:460,h:140,label:'设施点位'}, {x:890,y:510,w:500,h:145,label:'工单调度'}, {x:1370,y:520,w:250,h:140,label:'结果复核'},
];

export const Brain: React.FC<{shot: Shot}> = ({shot}) => {
  const frame=useCurrentFrame();
  const y=interpolate(frame,[55,350],[-30,830],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <SceneFade duration={shot.duration}>
    <AbsoluteFill style={{background:C.blue2}}/><Grid dark opacity={.07}/>{pageLabel(6,'新局 · 城市小脑',true)}
    <div style={{position:'absolute',left:130,right:130,top:150,bottom:190,borderRadius:28,overflow:'hidden',border:`1px solid ${C.electric}55`,boxShadow:`0 0 90px ${C.electric}18`}}>
      <Img src={staticFile('images/city-brain-dashboard.jpeg')} style={{width:'100%',height:'100%',objectFit:'cover',filter:'saturate(.85) contrast(1.08)',transform:'scale(1.04)'}}/>
      <AbsoluteFill style={{background:'rgba(7,25,38,.16)'}}/>
      {frame>=48&&frame<=378?<div style={{position:'absolute',left:0,right:0,top:y,height:3,background:C.electric,boxShadow:`0 0 28px ${C.electric}`}}/>:null}
      {scanTargets.map((t,i)=>{const trigger=95+i*43;const p=spring({frame:frame-trigger,fps:30,config:{damping:16,stiffness:150,mass:.7}});return <div key={t.label} style={{position:'absolute',left:t.x,top:t.y,width:t.w,height:t.h,opacity:clamp(p),transform:`scale(${mix(1.75,1,clamp(p))})`,transformOrigin:'center',border:`3px solid ${i%2?C.electric:C.signal}`,borderRadius:8,boxShadow:`0 0 22px ${i%2?C.electric:C.signal}44`}}><span style={{position:'absolute',left:t.w+16,top:10,whiteSpace:'nowrap',fontFamily:FONT.mono,fontSize:18,fontWeight:700,color:i%2?C.electric:C.signal2,background:'rgba(7,25,38,.82)',padding:'7px 11px',borderRadius:6}}>{t.label}</span></div>})}
      <div style={{position:'absolute',left:24,top:22,fontFamily:FONT.mono,fontSize:17,color:C.electric,letterSpacing:'.12em'}}>SCAN · {String(scanTargets.filter((_,i)=>frame>=95+i*43).length).padStart(2,'0')}/06</div>
    </div>
    <div style={{position:'absolute',left:140,top:715,padding:'16px 22px',borderRadius:14,color:C.white,background:'rgba(7,25,38,.76)',fontFamily:FONT.serif,fontSize:46,lineHeight:1.28,fontWeight:700}}><span style={{color:C.signal2}}>访谈材料提到：</span>大量流程与标准进入系统<br/>算法辅助识别日常问题</div>
    <Grain opacity={.07} light/><Subtitle shot={shot}/>
  </SceneFade>;
};

const loopNodes=[['多源感知','巡逻车 / 物联 / 人员 / 市民'],['事件工单','位置 / 图像 / 时限'],['任务编排','就近人员 / 专业队伍'],['现场处置','人到现场判断行动'],['后台复核','照片与结果校验'],['知识回流','修正规则与配置']];

export const Loop: React.FC<{shot: Shot}> = ({shot}) => {
  const frame=useCurrentFrame();
  const active=Math.min(5,Math.max(0,Math.floor((frame-60)/90)));
  const positions=loopNodes.map((_,i)=>{const a=-Math.PI/2+i*Math.PI/3;return{x:960+Math.cos(a)*600,y:590+Math.sin(a)*230}});
  return <SceneFade duration={shot.duration} dark={false}>
    <Grid opacity={.08}/>{pageLabel(7,'新局 · 任务流转')}
    <SceneTitle top={112} size={70}>一条工单，连接机器判断和现场行动。</SceneTitle>
    <svg width={1920} height={1080} style={{position:'absolute',inset:0}}>
      {positions.map((p,i)=>{const q=positions[(i+1)%positions.length];const prog=interpolate(frame,[75+i*80,125+i*80],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.quad)});return <g key={i}><DrawLine d={`M ${p.x} ${p.y} Q 960 590 ${q.x} ${q.y}`} progress={prog} stroke={i<=active?C.signal:'#111'} width={i<=active?5:2} opacity={i<=active?.85:.18}/></g>})}
    </svg>
    <div style={{position:'absolute',left:770,top:420,width:380,height:340,borderRadius:190,display:'grid',placeItems:'center',textAlign:'center',color:C.white,background:C.blue2,boxShadow:'0 28px 80px rgba(7,25,38,.24)'}}><div><div style={{fontFamily:FONT.serif,fontSize:57,fontWeight:700}}>城市小脑</div><div style={{fontFamily:FONT.mono,fontSize:19,color:C.electric,marginTop:10}}>识别 · 编排 · 留痕</div></div></div>
    {positions.map((p,i)=>{const e=enter(frame,55+i*70,28);const on=i===active;return <Panel key={i} style={{position:'absolute',left:p.x-185,top:p.y-74,width:370,height:148,padding:'23px 25px',opacity:e.opacity,transform:`translateY(${e.y}px) scale(${on?1.04:1})`,border:`2px solid ${on?C.signal:'rgba(17,16,14,.14)'}`,boxShadow:on?`0 18px 55px ${C.signal}33`:'0 16px 42px rgba(17,16,14,.1)'}}><div style={{display:'flex',gap:15,alignItems:'baseline'}}><span style={{fontFamily:FONT.mono,fontSize:17,color:C.signal}}>0{i+1}</span><strong style={{fontFamily:FONT.serif,fontSize:34}}>{loopNodes[i][0]}</strong></div><div style={{fontFamily:FONT.sans,fontSize:20,color:C.muted,marginTop:10}}>{loopNodes[i][1]}</div></Panel>})}
    <Grain opacity={.07}/><Subtitle shot={shot} dark={false}/>
  </SceneFade>;
};

export const People: React.FC<{shot: Shot}> = ({shot}) => {
  const frame=useCurrentFrame();
  const p=interpolate(frame,[0,shot.duration],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <SceneFade duration={shot.duration}>
    <AbsoluteFill style={{background:C.ink}}/>{pageLabel(8,'新局 · 现场仍是治理的最后一米',true)}
    <div style={{position:'absolute',left:70,top:145,width:1120,height:680,borderRadius:28,overflow:'hidden'}}><Photo src="city-team.jpeg" scale={1.22+p*.05} x={-110+p*22}/><AbsoluteFill style={{background:'linear-gradient(0deg,rgba(17,16,14,.62),transparent 55%)'}}/><div style={{position:'absolute',left:38,bottom:34,color:C.white,fontFamily:FONT.serif,fontSize:43,fontWeight:700}}>云城队长连接平台与现场</div></div>
    <div style={{position:'absolute',right:70,top:225,width:700,height:450,borderRadius:24,overflow:'hidden',border:'8px solid #11100e',boxShadow:'0 25px 70px #0008'}}><Img src={staticFile('images/service-station.jpeg')} style={{width:'100%',height:'100%',objectFit:'cover',transform:`scale(${1.05+p*.04})`}}/></div>
    <div style={{position:'absolute',right:85,top:700,width:650,color:C.white}}><div style={{fontFamily:FONT.serif,fontSize:100,fontWeight:800,color:C.signal}}>4万</div><div style={{fontFamily:FONT.sans,fontSize:32,lineHeight:1.5}}>节假日单日最高服务旅客<br/>具体问题仍由一线人员回答</div></div>
    <Grain opacity={.1} light/><Subtitle shot={shot}/>
  </SceneFade>;
};

const limits=[['执法权','能巡查、劝导、上报；处罚由法定主体作出'],['数据权','能否开放仍取决于职责、安全与授权'],['资产权','不同设施仍由多个产权主体掌握'],['属地责任','两区的考核与指令没有合成一套']];

export const Boundary: React.FC<{shot: Shot}> = ({shot}) => {
  const frame=useCurrentFrame();
  return <SceneFade duration={shot.duration}>
    <Photo src="parking-scene.jpeg" scale={1.18} filter="saturate(.25) contrast(1.05) brightness(.52)"/>
    <AbsoluteFill style={{background:'linear-gradient(90deg,rgba(7,25,38,.93),rgba(7,25,38,.72))'}}/>{pageLabel(9,'问局 · 技术的边界',true)}
    <SceneTitle dark top={118} size={72}>平台越向外走，<br/><span style={{color:C.signal2}}>制度边界越清楚。</span></SceneTitle>
    <div style={{position:'absolute',left:105,right:105,top:390,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:22}}>
      {limits.map((l,i)=>{const e=enter(frame,95+i*58,32);return <div key={l[0]} style={{height:345,padding:'34px 30px',borderRadius:24,background:i===0?C.signal:'rgba(255,253,248,.93)',color:C.ink,border:'1px solid rgba(255,255,255,.28)',boxShadow:'0 24px 60px rgba(0,0,0,.22)',opacity:e.opacity,transform:`translateY(${e.y}px)`}}><div style={{fontFamily:FONT.mono,fontSize:20,letterSpacing:'.14em',opacity:.6}}>0{i+1}</div><div style={{fontFamily:FONT.serif,fontSize:48,fontWeight:750,marginTop:22}}>{l[0]}</div><div style={{fontFamily:FONT.sans,fontSize:29,lineHeight:1.48,marginTop:20,color:i===0?C.ink:C.muted}}>{l[1]}</div></div>})}
    </div>
    <div style={{position:'absolute',left:105,top:815,fontFamily:FONT.mono,fontSize:18,color:C.electric,letterSpacing:'.1em'}}>TECHNOLOGY OPERATES INSIDE AUTHORIZED RELATIONSHIPS</div>
    <Grain opacity={.09} light/><Subtitle shot={shot}/>
  </SceneFade>;
};

export const Judgment: React.FC<{shot: Shot}> = ({shot}) => {
  const frame=useCurrentFrame();
  const steps=[['碎片化任务','高频跨界协作'],['平台化','统一责任界面'],['智能化','降低调度成本']];
  return <SceneFade duration={shot.duration} dark={false}>
    <Grid opacity={.08}/>{pageLabel(10,'终章 · 案例判断')}
    <div style={{position:'absolute',left:95,top:125,width:1500,fontFamily:FONT.serif,fontSize:78,fontWeight:750,lineHeight:1.12}}>行政边界没有重画，<br/><span style={{color:C.signal}}>功能接口被重新组织。</span></div>
    <div style={{position:'absolute',left:120,right:120,top:420,display:'flex',alignItems:'center',gap:28}}>
      {steps.map((s,i)=>{const e=enter(frame,80+i*100,30);return <React.Fragment key={s[0]}><Panel style={{width:430,height:235,padding:'34px 38px',opacity:e.opacity,transform:`translateY(${e.y}px)`,background:i===1?C.ink:C.white,color:i===1?C.white:C.ink}}><div style={{fontFamily:FONT.mono,fontSize:18,color:C.signal}}>0{i+1}</div><div style={{fontFamily:FONT.serif,fontSize:47,fontWeight:750,marginTop:18}}>{s[0]}</div><div style={{fontFamily:FONT.sans,fontSize:24,color:i===1?'#fff9':C.muted,marginTop:14}}>{s[1]}</div></Panel>{i<2?<div style={{fontFamily:FONT.serif,fontSize:68,color:C.signal,opacity:enter(frame,150+i*100,20).opacity}}>→</div>:null}</React.Fragment>})}
    </div>
    <div style={{position:'absolute',left:120,right:120,top:715,height:5,background:C.signal,transformOrigin:'left',transform:`scaleX(${interpolate(frame,[350,460],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.quad)})})`}}/>
    <div style={{position:'absolute',left:120,top:745,fontFamily:FONT.serif,fontSize:48,fontWeight:700}}>制度边界：执法、数据授权、资产与属地责任仍由法定主体掌握</div>
    <Grain opacity={.08}/><Subtitle shot={shot} dark={false}/>
  </SceneFade>;
};

const collage=[
  {src:'nanjing-south-aerial.jpeg',x:180,y:170,w:520,h:280,dx:-650,dy:-250,r:-5},
  {src:'parking-scene.jpeg',x:1400,y:190,w:430,h:250,dx:620,dy:-260,r:5},
  {src:'city-brain-dashboard.jpeg',x:150,y:710,w:540,h:250,dx:-650,dy:320,r:4},
  {src:'city-team.jpeg',x:1470,y:745,w:440,h:250,dx:620,dy:330,r:-4},
  {src:'service-station.jpeg',x:960,y:865,w:530,h:235,dx:0,dy:420,r:2},
];

export const Ending: React.FC<{shot: Shot}> = ({shot}) => {
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const titleP=interpolate(frame,[185,225],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.2,.75,.3,1)});
  const stage=interpolate(frame,[0,50],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.3,0,.2,1)});
  const dust=Array.from({length:20},(_,i)=>({x:(i*439+137)%1920,y:(i*613+271)%1080,size:2+(i%3),op:.14+(i%5)*.04}));
  return <SceneFade duration={shot.duration}>
    <AbsoluteFill style={{background:`radial-gradient(900px 500px at 50% 47%,${C.paper},${C.paper2} 65%,#cfc5b3)`}}/>
    <AbsoluteFill style={{transform:`perspective(1400px) rotateX(${4*(1-stage)}deg) scale(${1.06-.06*stage})`,transformOrigin:'50% 45%'}}>
      {collage.map((c,i)=>{const p=interpolate(frame,[-8+i*14,12+i*14],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.34,1.4,.44,1)});return <div key={c.src} style={{position:'absolute',left:c.x-c.w/2,top:c.y-c.h/2,width:c.w,height:c.h,borderRadius:18,overflow:'hidden',border:'8px solid rgba(255,253,248,.92)',boxShadow:'0 22px 65px rgba(17,16,14,.24)',opacity:p*.86,transform:`translate(${c.dx*(1-p)}px,${c.dy*(1-p)}px) rotate(${c.r*(2-p)}deg) scale(${1.12-.12*p})`}}><Img src={staticFile(`images/${c.src}`)} style={{width:'100%',height:'100%',objectFit:'cover',filter:'saturate(.66)'}}/></div>})}
    </AbsoluteFill>
    {dust.map((d,i)=><div key={i} style={{position:'absolute',left:d.x+Math.sin(frame*.025+i)*12,top:((d.y-frame*(.2+(i%4)*.08))%1080+1080)%1080,width:d.size,height:d.size,borderRadius:'50%',background:C.signal,opacity:d.op}}/>)}
    <div style={{position:'absolute',left:330,right:330,top:285,padding:'66px 70px 60px',borderRadius:34,textAlign:'center',background:'rgba(17,16,14,.91)',boxShadow:'0 30px 90px rgba(17,16,14,.3)',opacity:titleP,transform:`scale(${mix(.92,1,titleP)})`}}>
      <div style={{fontFamily:FONT.mono,fontSize:19,color:C.signal2,letterSpacing:'.16em'}}>南京南站案例留下的问题</div>
      <div style={{fontFamily:FONT.serif,fontSize:78,lineHeight:1.16,fontWeight:750,color:C.white,marginTop:26}}>平台企业能把碎片化治理，<br/><span style={{color:C.signal2}}>修补到哪一层？</span></div>
      <div style={{width:interpolate(frame,[225,260],[0,650],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.quad)}),height:3,background:C.signal,margin:'34px auto 0'}}/>
      <div style={{fontFamily:FONT.sans,fontSize:32,lineHeight:1.48,color:'#ffffffd1',marginTop:25}}>从平台化到智能化：政企共创平台企业何以化解行政分割难题？<br/>——以南京南站跨区域公共交通枢纽为例</div>
    </div>
    <Grain opacity={.11}/><Subtitle shot={shot}/>
  </SceneFade>;
};
