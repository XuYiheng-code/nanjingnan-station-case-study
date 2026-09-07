import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile} from 'remotion';
import {COLORS, COVER_FRAMES, TIMELINE, TOTAL_FRAMES} from './data';
import {Subtitle} from './components';
import {
  CampaignScene,
  CityBrainScene,
  ConclusionScene,
  CoordinationOfficeScene,
  CoverScene,
  DispatchScene,
  FourteenUnitsScene,
  HumanVerificationScene,
  InstitutionalInterfacesScene,
  MultiSourceScene,
  OutsourcingScene,
  ParkingBoundaryScene,
  PlatformBirthScene,
  ScaleScene,
  SingleInterfaceScene,
  SmallProblemsScene,
  StandardsScene,
  ThreeBoundariesScene,
  TransactionCostsScene,
  TwoAdjustmentsScene,
} from './scenes';
import type {LongformProps, TimelineShot} from './types';

const SCENES: Record<string, React.FC<{shot: TimelineShot}>> = {
  scale: ScaleScene,
  small_problems: SmallProblemsScene,
  three_boundaries: ThreeBoundariesScene,
  fourteen_units: FourteenUnitsScene,
  coordination_office: CoordinationOfficeScene,
  campaign: CampaignScene,
  outsourcing: OutsourcingScene,
  platform_birth: PlatformBirthScene,
  single_interface: SingleInterfaceScene,
  city_brain: CityBrainScene,
  multi_source: MultiSourceScene,
  standards: StandardsScene,
  dispatch: DispatchScene,
  human_verification: HumanVerificationScene,
  parking_boundary: ParkingBoundaryScene,
  institutional_interfaces: InstitutionalInterfacesScene,
  transaction_costs: TransactionCostsScene,
  two_adjustments: TwoAdjustmentsScene,
  conclusion: ConclusionScene,
};

const SFX = [
  {from: 54, src: 'riser-cine.mp3', volume: .18, duration: 170},
  {from: 168, src: 'impact-deep-whoosh.mp3', volume: .26, duration: 105},
  ...TIMELINE.slice(0, -1).map((shot) => ({from: shot.from + shot.durationFrames - 6, src: 'transition-soft.mp3', volume: .09, duration: 42})),
  {from: TIMELINE.find((s) => s.id === 'city_brain')!.from + 55, src: 'data-scan.mp3', volume: .12, duration: 260},
  {from: TIMELINE.find((s) => s.id === 'dispatch')!.from + 86, src: 'switch-click-quick.mp3', volume: .15, duration: 45},
  {from: TIMELINE.find((s) => s.id === 'conclusion')!.from + 45, src: 'riser-cine.mp3', volume: .2, duration: 180},
];

export const CompetitionCaseFilm: React.FC<LongformProps> = ({voice, bgm}) => <AbsoluteFill style={{background: COLORS.ink}}>
  <Sequence from={0} durationInFrames={COVER_FRAMES}><CoverScene/></Sequence>
  {TIMELINE.map((shot) => {
    const Scene = SCENES[shot.id];
    if (!Scene) throw new Error(`No longform scene registered for ${shot.id}`);
    return <Sequence key={shot.id} from={shot.from} durationInFrames={shot.durationFrames}><Scene shot={shot}/></Sequence>;
  })}

  {TIMELINE.map((shot) => <Sequence key={`subtitle-${voice}-${shot.id}`} from={shot.from} durationInFrames={shot.durationFrames}>
    <Subtitle shot={shot} voice={voice} dark={['scale', 'three_boundaries', 'coordination_office', 'outsourcing', 'single_interface', 'city_brain', 'dispatch', 'human_verification', 'parking_boundary', 'institutional_interfaces', 'two_adjustments', 'conclusion'].includes(shot.id)}/>
  </Sequence>)}

  {TIMELINE.map((shot) => <Sequence key={`vo-${voice}-${shot.id}`} from={shot.from + shot.narrationFromFrames} durationInFrames={voice === 'female' ? shot.narrationDurationFemaleFrames : shot.narrationDurationMaleFrames}>
    <Audio src={staticFile(`audio/competition/${voice}/${shot.id}.mp3`)} volume={1}/>
  </Sequence>)}

  {bgm ? <Audio src={staticFile('audio/bgm.mp3')} loop volume={(frame) => interpolate(frame, [0, 60, TOTAL_FRAMES - 90, TOTAL_FRAMES], [0, .075, .075, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}/> : null}
  {SFX.map((s, index) => <Sequence key={`${s.src}-${index}`} from={s.from} durationInFrames={s.duration}><Audio src={staticFile(`audio/${s.src}`)} volume={s.volume}/></Sequence>)}
</AbsoluteFill>;

export type {LongformProps} from './types';
