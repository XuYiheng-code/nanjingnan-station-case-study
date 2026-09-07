import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile} from 'remotion';
import {C, SHOTS, shotById} from './data';
import {Boundary, Brain, Ending, Fragmentation, History, Judgment, Loop, Opening, Parking, People, Platform} from './scenes';

export type CaseFilmProps = {bgm: boolean};

const SCENES: Record<string, React.FC<{shot: (typeof SHOTS)[number]}>> = {
  opening: Opening,
  parking: Parking,
  fragmentation: Fragmentation,
  history: History,
  platform: Platform,
  brain: Brain,
  loop: Loop,
  people: People,
  boundary: Boundary,
  judgment: Judgment,
  ending: Ending,
};

const SFX = [
  ...SHOTS.slice(1).map((s) => ({from: s.from + 2, src: 'transition-soft.mp3', volume: 0.2, duration: 75})),
  {from: shotById('parking').from + 72, src: 'sweep-fast-small.mp3', volume: 0.25, duration: 70},
  {from: shotById('fragmentation').from + 76, src: 'typewriter-hit-soft.mp3', volume: 0.18, duration: 45},
  {from: shotById('history').from + 515, src: 'air-woosh-deep.mp3', volume: 0.25, duration: 80},
  {from: shotById('platform').from + 455, src: 'impact-deep-whoosh.mp3', volume: 0.3, duration: 110},
  {from: shotById('brain').from + 55, src: 'data-scan.mp3', volume: 0.16, duration: 300},
  {from: shotById('loop').from + 70, src: 'switch-click-quick.mp3', volume: 0.22, duration: 50},
  {from: shotById('ending').from + 18, src: 'riser-cine.mp3', volume: 0.28, duration: 175},
  {from: shotById('ending').from + 185, src: 'impact-deep-whoosh.mp3', volume: 0.48, duration: 125},
  {from: shotById('ending').from + 225, src: 'sparkle.mp3', volume: 0.26, duration: 120},
];

export const CaseFilm: React.FC<CaseFilmProps> = ({bgm}) => <AbsoluteFill style={{background: C.ink}}>
  {SHOTS.map((shot) => {
    const Scene = SCENES[shot.id];
    return <Sequence key={shot.id} from={shot.from} durationInFrames={shot.duration}><Scene shot={shot}/></Sequence>;
  })}

  {bgm ? <Audio
    src={staticFile('audio/bgm.mp3')}
    loop
    volume={(frame) => interpolate(
      frame,
      [0, 36, SHOTS[SHOTS.length - 1].from + SHOTS[SHOTS.length - 1].duration - 54, SHOTS[SHOTS.length - 1].from + SHOTS[SHOTS.length - 1].duration],
      [0, 0.105, 0.105, 0],
      {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
    )}
  /> : null}

  {SHOTS.map((shot) => <Sequence key={`vo-${shot.id}`} from={shot.from + 12} durationInFrames={shot.audioFrames}>
    <Audio src={staticFile(`audio/narration/${shot.id}.mp3`)} volume={1}/>
  </Sequence>)}

  {SFX.map((s, i) => <Sequence key={`sfx-${i}`} from={s.from} durationInFrames={s.duration}>
    <Audio src={staticFile(`audio/${s.src}`)} volume={s.volume}/>
  </Sequence>)}
</AbsoluteFill>;
