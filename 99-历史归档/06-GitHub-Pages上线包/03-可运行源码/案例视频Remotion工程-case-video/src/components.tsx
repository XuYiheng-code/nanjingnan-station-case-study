import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing} from 'remotion';
import {C, FONT, Shot, clamp} from './data';

export const Grain: React.FC<{opacity?: number; light?: boolean}> = ({opacity = 0.12, light = false}) => {
  const frame = useCurrentFrame();
  const x = ((frame * 17) % 90) - 45;
  const y = ((frame * 11) % 70) - 35;
  return <AbsoluteFill style={{pointerEvents: 'none', opacity, mixBlendMode: light ? 'screen' : 'multiply', transform: `translate(${x}px,${y}px)`, width: 2010, height: 1150, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 180 180\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.72\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'.26\'/%3E%3C/svg%3E")'}}/>;
};

export const Grid: React.FC<{dark?: boolean; opacity?: number}> = ({dark = false, opacity = 0.11}) => <AbsoluteFill style={{pointerEvents: 'none', opacity, backgroundImage: `linear-gradient(${dark ? '#fff' : '#111'}22 1px,transparent 1px),linear-gradient(90deg,${dark ? '#fff' : '#111'}22 1px,transparent 1px)`, backgroundSize: '120px 120px'}}/>;

export const Photo: React.FC<{src: string; scale?: number; x?: number; y?: number; filter?: string; opacity?: number}> = ({src, scale = 1, x = 0, y = 0, filter = 'saturate(.76) contrast(1.08)', opacity = 1}) => <Img src={staticFile(`images/${src}`)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `translate(${x}px,${y}px) scale(${scale})`, filter, opacity}}/>;

export const Eyebrow: React.FC<{children: React.ReactNode; color?: string; top?: number; left?: number}> = ({children, color = C.signal, top = 72, left = 92}) => <div style={{position: 'absolute', top, left, color, fontFamily: FONT.mono, fontSize: 22, fontWeight: 700, letterSpacing: '0.15em'}}>{children}</div>;

export const SceneTitle: React.FC<{children: React.ReactNode; dark?: boolean; size?: number; top?: number; left?: number; width?: number}> = ({children, dark = false, size = 74, top = 112, left = 92, width = 1200}) => <div style={{position: 'absolute', top, left, width, color: dark ? C.white : C.ink, fontFamily: FONT.serif, fontSize: size, lineHeight: 1.13, fontWeight: 700, letterSpacing: '-0.045em'}}>{children}</div>;

const chunks = (text: string) => {
  const raw = text.match(/[^，。；：？！]+[，。；：？！]?/g) ?? [text];
  const out: string[] = [];
  const maxChars = 20;
  for (const piece of raw) {
    if (piece.length <= maxChars) {
      out.push(piece);
      continue;
    }

    const hasTrailingPunctuation = /[，。；：？！]$/.test(piece);
    const punctuation = hasTrailingPunctuation ? piece.slice(-1) : '';
    const body = hasTrailingPunctuation ? piece.slice(0, -1) : piece;
    const count = Math.ceil(piece.length / maxChars);
    const baseLength = Math.floor(body.length / count);
    const remainder = body.length % count;
    const split: string[] = [];
    let offset = 0;
    for (let i = 0; i < count; i++) {
      const length = baseLength + (i < remainder ? 1 : 0);
      split.push(body.slice(offset, offset + length));
      offset += length;
    }
    if (punctuation) split[split.length - 1] += punctuation;
    for (let i = 1; i < split.length; i++) {
      while (/^[，。；：？！、”’）】》]/.test(split[i])) {
        split[i - 1] += split[i][0];
        split[i] = split[i].slice(1);
      }
      while (/[“‘（【《]$/.test(split[i - 1])) {
        split[i] = split[i - 1].slice(-1) + split[i];
        split[i - 1] = split[i - 1].slice(0, -1);
      }
      const protectedTerms = ['城管', '协调'];
      if (protectedTerms.includes(split[i - 1].slice(-1) + split[i].slice(0, 1))) {
        split[i] = split[i - 1].slice(-1) + split[i];
        split[i - 1] = split[i - 1].slice(0, -1);
      }
    }
    out.push(...split.filter(Boolean));
  }
  return out;
};

export const Subtitle: React.FC<{shot: Shot; dark?: boolean}> = ({shot, dark = true}) => {
  const frame = useCurrentFrame();
  const local = frame - 12;
  const parts = chunks(shot.text);
  const total = parts.reduce((n, p) => n + p.length, 0);
  let acc = 0;
  let active = parts[0];
  let start = 0;
  let end = shot.audioFrames;
  for (const p of parts) {
    const a = Math.round((acc / total) * shot.audioFrames);
    const b = Math.round(((acc + p.length) / total) * shot.audioFrames);
    if (local >= a && local < b) {active = p; start = a; end = b; break;}
    acc += p.length;
  }
  const fadeIn = interpolate(local, [start, start + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = interpolate(local, [end - 6, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const opacity = Math.min(fadeIn, fadeOut);
  const fontSize = active.length >= 19 ? 56 : 58;
  if (local < 0 || local > shot.audioFrames) return null;
  return <div style={{position: 'absolute', left: 120, right: 120, bottom: 58, minHeight: 112, display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: dark ? C.white : C.ink, fontFamily: FONT.sans, fontSize, lineHeight: 1.22, fontWeight: 650, letterSpacing: '-0.025em', textShadow: dark ? '0 3px 18px rgba(0,0,0,.8)' : '0 2px 12px rgba(243,239,230,.9)', opacity, transform: `translateY(${(1-opacity)*10}px)`}}><span style={{whiteSpace: 'nowrap', maxWidth: '100%', padding: '8px 24px', borderRadius: 12, background: dark ? 'rgba(8,8,8,.46)' : 'rgba(243,239,230,.84)', WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)'}}>{active}</span></div>;
};

export const SceneFade: React.FC<{duration: number; children: React.ReactNode; dark?: boolean}> = ({duration, children, dark = true}) => {
  return <AbsoluteFill style={{background: dark ? C.ink : C.paper}}>{children}</AbsoluteFill>;
};

export const enter = (frame: number, start: number, duration = 24) => {
  const p = interpolate(frame, [start, start + duration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0, 0, 0.2, 1)});
  return {p, opacity: p, y: (1-p)*32};
};

export const DrawLine: React.FC<{d: string; progress: number; stroke?: string; width?: number; opacity?: number}> = ({d, progress, stroke = C.signal, width = 3, opacity = 1}) => <path d={d} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1-clamp(progress)} opacity={opacity}/>;
