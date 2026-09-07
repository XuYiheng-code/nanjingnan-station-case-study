import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {COLORS, FONTS, FPS, mix, progress, TOTAL_FRAMES} from './data';
import type {TimelineShot, Voice} from './types';

export const FilmGrain: React.FC<{opacity?: number; light?: boolean}> = ({opacity = 0.08, light = false}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{
    pointerEvents: 'none', opacity, mixBlendMode: light ? 'screen' : 'multiply',
    transform: `translate(${(frame * 17) % 84 - 42}px, ${(frame * 11) % 68 - 34}px)`,
    width: 2004, height: 1148,
    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 180 180\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.72\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'.26\'/%3E%3C/svg%3E")',
  }}/>
};

export const Grid: React.FC<{light?: boolean; opacity?: number; size?: number}> = ({light = false, opacity = 0.08, size = 112}) =>
  <AbsoluteFill style={{pointerEvents: 'none', opacity, backgroundImage: `linear-gradient(${light ? '#fff' : '#111'}22 1px,transparent 1px),linear-gradient(90deg,${light ? '#fff' : '#111'}22 1px,transparent 1px)`, backgroundSize: `${size}px ${size}px`}}/>;

export const PhotoLayer: React.FC<{src: string; scale?: number; endScale?: number; x?: number; endX?: number; y?: number; endY?: number; filter?: string}> = ({src, scale = 1.08, endScale = 1.02, x = 0, endX = 0, y = 0, endY = 0, filter = 'saturate(.72) contrast(1.08)'}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 480], [0, 1], {extrapolateRight: 'clamp'});
  return <Img src={staticFile(`images/${src}`)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `translate(${mix(x, endX, p)}px,${mix(y, endY, p)}px) scale(${mix(scale, endScale, p)})`, filter}}/>;
};

export const fadeUp = (frame: number, start = 0, duration = 24, distance = 28) => {
  const p = interpolate(frame, [start, start + duration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0, 0, 0.2, 1)});
  return {opacity: p, transform: `translateY(${(1 - p) * distance}px)`};
};

export const ChapterHeader: React.FC<{shot: TimelineShot; dark?: boolean}> = ({shot, dark = false}) => (
  <div style={{position: 'absolute', top: 58, left: 84, right: 84, display: 'flex', alignItems: 'center', gap: 16, color: dark ? COLORS.white : COLORS.ink, fontFamily: FONTS.mono, fontSize: 20, letterSpacing: '.12em'}}>
    <span style={{color: COLORS.orange, fontWeight: 800}}>{String(shot.index).padStart(2, '0')}</span>
    <span style={{width: 52, height: 1, background: dark ? '#ffffff70' : '#11111155'}}/>
    <span>{shot.chapter}</span>
    <span style={{marginLeft: 'auto', opacity: .55}}>NANJING SOUTH · CASE STUDY</span>
  </div>
);

export const ShotTitle: React.FC<{children: React.ReactNode; dark?: boolean; top?: number; size?: number; width?: number}> = ({children, dark = false, top = 112, size = 72, width = 1500}) => (
  <div style={{position: 'absolute', left: 84, top, width, color: dark ? COLORS.white : COLORS.ink, fontFamily: FONTS.serif, fontSize: size, lineHeight: 1.15, letterSpacing: '-.04em', fontWeight: 760, whiteSpace: 'nowrap'}}>{children}</div>
);

const splitSubtitle = (text: string, max = 18) => {
  const clauses = text.match(/[^，。；：？！]+[，。；：？！]?/g) ?? [text];
  const output: string[] = [];
  const protectedTerms = ['南京南站', '雨花台区', '江宁区', '铁路南站', '十四个', '综管办', '人民政府', '绿都大道', '铁投集团', '万物云', '交控万物', '多甲方', '一乙方', '城市小脑', '人工智能', '云城队长', '业务流程', '作业标准', '行政执法', '属地责任', '交易成本', '功能整合'];
  const isProtectedCut = (body: string, index: number) => protectedTerms.some((term) => {
    const start = body.indexOf(term);
    return start >= 0 && index > start && index < start + term.length;
  });
  for (const clause of clauses) {
    if (clause.length <= max) { output.push(clause); continue; }
    const punct = /[，。；：？！]$/.test(clause) ? clause.slice(-1) : '';
    const body = punct ? clause.slice(0, -1) : clause;
    let remaining = body;
    while (remaining.length > max) {
      let cut = max;
      const preferredBefore = '的了着过，与和及把将由在向从对但却而并也仍就或';
      for (let candidate = max; candidate >= Math.max(9, max - 6); candidate--) {
        if (!isProtectedCut(remaining, candidate) && (preferredBefore.includes(remaining[candidate - 1]) || preferredBefore.includes(remaining[candidate]))) {cut = candidate; break;}
      }
      while (cut > 9 && isProtectedCut(remaining, cut)) cut--;
      output.push(remaining.slice(0, cut));
      remaining = remaining.slice(cut);
    }
    if (remaining) output.push(remaining);
    if (punct) output[output.length - 1] += punct;
  }
  return output.filter(Boolean);
};

export const Subtitle: React.FC<{shot: TimelineShot; voice: Voice; dark?: boolean}> = ({shot, voice, dark = true}) => {
  const frame = useCurrentFrame();
  const local = frame - shot.narrationFromFrames;
  const parts = splitSubtitle(shot.text);
  const total = Math.max(1, parts.reduce((sum, item) => sum + item.length, 0));
  const usable = Math.max(1, voice === 'female' ? shot.narrationDurationFemaleFrames : shot.narrationDurationMaleFrames);
  let chars = 0;
  let active = parts[0];
  let start = 0;
  let end = usable;
  for (const item of parts) {
    const next = chars + item.length;
    const a = Math.round(chars / total * usable);
    const b = Math.round(next / total * usable);
    if (local >= a && local < b) {active = item; start = a; end = b; break;}
    chars = next;
  }
  if (local < 0 || local >= usable || !active) return null;
  const opacity = Math.min(
    interpolate(local, [start, start + 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    interpolate(local, [Math.max(start, end - 5), end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );
  return <div style={{position: 'absolute', left: 96, right: 96, bottom: 45, height: 102, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity, transform: `translateY(${(1 - opacity) * 8}px)`}}>
    <div style={{maxWidth: 1640, padding: '13px 30px 15px', borderRadius: 14, color: dark ? COLORS.white : COLORS.ink, background: dark ? 'rgba(4,8,10,.72)' : 'rgba(243,239,230,.91)', boxShadow: dark ? '0 10px 30px rgba(0,0,0,.25)' : '0 10px 30px rgba(17,16,14,.12)', fontFamily: FONTS.sans, fontSize: 60, lineHeight: 1.15, fontWeight: 650, letterSpacing: '-.025em', whiteSpace: 'nowrap'}}>{active}</div>
  </div>;
};

export const SceneShell: React.FC<React.PropsWithChildren<{shot: TimelineShot; dark?: boolean; grain?: boolean}>> = ({shot, dark = false, grain = true, children}) => {
  const frame = useCurrentFrame();
  const fade = Math.min(interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'}), interpolate(frame, [shot.durationFrames - 10, shot.durationFrames], [1, 0], {extrapolateLeft: 'clamp'}));
  return <AbsoluteFill style={{background: dark ? COLORS.navy : COLORS.paper, color: dark ? COLORS.white : COLORS.ink, opacity: fade}}>
    {children}
    {grain ? <FilmGrain opacity={dark ? .07 : .06} light={dark}/> : null}
    <div style={{position: 'absolute', left: 0, bottom: 0, width: `${100 * progress(frame, 0, shot.durationFrames)}%`, height: 4, background: COLORS.orange}}/>
  </AbsoluteFill>;
};

export const Panel: React.FC<React.PropsWithChildren<{style?: React.CSSProperties; dark?: boolean}>> = ({children, style, dark = false}) => <div style={{borderRadius: 22, border: `1px solid ${dark ? '#ffffff28' : '#11111122'}`, background: dark ? 'rgba(12,30,44,.9)' : 'rgba(255,253,248,.94)', boxShadow: dark ? '0 24px 70px rgba(0,0,0,.28)' : '0 24px 70px rgba(17,16,14,.12)', ...style}}>{children}</div>;

export const TeamMark: React.FC<{size?: number}> = ({size = 86}) => (
  <div style={{width: size, height: size, borderRadius: size * .16, display: 'grid', placeItems: 'center', background: '#f5f0e6', boxShadow: '0 14px 46px rgba(0,0,0,.2)', flex: '0 0 auto'}}>
    <svg width={size * .72} height={size * .72} viewBox="0 0 256 256" aria-label="南雍治道标志">
      <g fill="#102f4b">
        <path d="M121.5 58c-.9 22.8-8.6 39-23.1 48.6-14 9.3-36.7 14.5-68.1 15.6 1.8-8.2 7-14.1 15.5-17.7 8.8-3.7 20.7-5.9 35.8-6.7 10.3-.6 18.3-4.3 24.1-11.2 5.3-6.3 8.4-15.8 9.2-28.6h6.6Z"/>
        <path d="M134.5 58c.9 22.8 8.6 39 23.1 48.6 14 9.3 36.7 14.5 68.1 15.6-1.8-8.2-7-14.1-15.5-17.7-8.8-3.7-20.7-5.9-35.8-6.7-10.3-.6-18.3-4.3-24.1-11.2-5.3-6.3-8.4-15.8-9.2-28.6h-6.6Z"/>
        <path d="M121.5 130.5v18.3c0 11.3-3.9 19.7-11.6 25.1-7.6 5.3-19.6 8-36 8H22.6c1.8-8.5 6.4-14.6 13.8-18.4 7.7-3.9 19.2-6.5 34.4-7.7 18.4-1.5 31.3-4.7 38.6-9.5 6.1-4 10.1-9.3 12.1-15.8Z"/>
        <path d="M134.5 130.5v18.3c0 11.3 3.9 19.7 11.6 25.1 7.6 5.3 19.6 8 36 8h51.3c-1.8-8.5-6.4-14.6-13.8-18.4-7.7-3.9-19.2-6.5-34.4-7.7-18.4-1.5-31.3-4.7-38.6-9.5-6.1-4-10.1-9.3-12.1-15.8Z"/>
        <path d="M121.5 188.5v18.3c0 10.7-3.5 18.5-10.4 23.3-7 4.9-17.8 7.3-32.5 7.3H14c1.8-8.4 6.3-14.4 13.5-18.1 7.4-3.8 18.4-6.2 33-7.4 18.7-1.4 32.5-4.7 41.5-9.7 8.2-4.6 14.7-9.1 19.5-13.7Z"/>
        <path d="M134.5 188.5v18.3c0 10.7 3.5 18.5 10.4 23.3 7 4.9 17.8 7.3 32.5 7.3H242c-1.8-8.4-6.3-14.4-13.5-18.1-7.4-3.8-18.4-6.2-33-7.4-18.7-1.4-32.5-4.7-41.5-9.7-8.2-4.6-14.7-9.1-19.5-13.7Z"/>
      </g>
      <circle cx="128" cy="38" r="15" fill="#b14a3d"/>
    </svg>
  </div>
);

export const TeamLockup: React.FC<{size?: number}> = ({size = 86}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
    <TeamMark size={size}/>
    <div>
      <div style={{fontFamily: FONTS.serif, fontSize: size * .49, color: COLORS.white, fontWeight: 750, letterSpacing: '-.035em', whiteSpace: 'nowrap'}}>南雍治道</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 7, color: COLORS.orangeLight, fontFamily: FONTS.mono, fontSize: size * .18, letterSpacing: '.18em', whiteSpace: 'nowrap'}}>
        <span style={{width: size * .34, height: 2, background: '#b14a3d'}}/>
        从平台化到智能化
        <span style={{width: size * .34, height: 2, background: '#b14a3d'}}/>
      </div>
    </div>
  </div>
);

export const Label: React.FC<{children: React.ReactNode; accent?: boolean; style?: React.CSSProperties}> = ({children, accent = false, style}) => <div style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', borderRadius: 999, background: accent ? COLORS.orange : 'rgba(255,253,248,.92)', color: COLORS.ink, border: '1px solid rgba(17,16,14,.14)', fontFamily: FONTS.sans, fontSize: 32, fontWeight: 650, whiteSpace: 'nowrap', ...style}}>{children}</div>;

export const GlobalTimecode: React.FC = () => {
  const frame = useCurrentFrame();
  const seconds = Math.floor(frame / FPS);
  return <div style={{position: 'absolute', right: 35, bottom: 20, zIndex: 80, color: '#ffffff72', fontFamily: FONTS.mono, fontSize: 15, letterSpacing: '.08em'}}>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')} · {Math.round(frame / TOTAL_FRAMES * 100)}%</div>;
};
