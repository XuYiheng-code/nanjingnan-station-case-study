export type Voice = 'female' | 'male';

export type LongformProps = {
  voice: Voice;
  bgm: boolean;
};

export type NarrationRecord = {
  id: string;
  chapter: string;
  title: string;
  text: string;
};

export type VoiceSegment = NarrationRecord & {
  duration: number;
};

export type VoiceManifest = {
  provider: string;
  model: string;
  voice: string;
  voice_gender: Voice;
  instructions: string;
  sample_rate_hz: number;
  channels: number;
  segments: VoiceSegment[];
  total_narration_seconds: number;
};

export type CompetitionManifest = Record<Voice, VoiceManifest>;

export type TimelineShot = NarrationRecord & {
  index: number;
  from: number;
  durationFrames: number;
  narrationFromFrames: number;
  narrationDurationFemaleFrames: number;
  narrationDurationMaleFrames: number;
};

