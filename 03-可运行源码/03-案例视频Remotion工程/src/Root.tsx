import React from 'react';
import {Composition} from 'remotion';
import {CaseFilm} from './Main';
import {FPS, H, TOTAL_FRAMES as SHORT_TOTAL_FRAMES, W} from './data';
import {CompetitionCaseFilm} from './longform/Longform';
import {HEIGHT, TOTAL_FRAMES as LONG_TOTAL_FRAMES, WIDTH} from './longform/data';
import type {LongformProps} from './longform/types';

export const Root: React.FC = () => <>
  <Composition
    id="CaseFilm"
    component={CaseFilm as React.FC<Record<string, unknown>>}
    durationInFrames={SHORT_TOTAL_FRAMES}
    fps={FPS}
    width={W}
    height={H}
    defaultProps={{bgm: true}}
  />
  <Composition
    id="CompetitionCaseFilm"
    component={CompetitionCaseFilm}
    durationInFrames={LONG_TOTAL_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    defaultProps={{voice: 'female', bgm: true} satisfies LongformProps}
  />
</>;

