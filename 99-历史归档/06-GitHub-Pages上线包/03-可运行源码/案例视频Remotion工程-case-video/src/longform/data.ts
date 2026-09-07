import narrationJson from '../../production/competition-narration.json';
import manifestJson from '../../production/competition-tts-manifest.json';
import type {CompetitionManifest, NarrationRecord, TimelineShot} from './types';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const COVER_FRAMES = 12 * FPS;
export const NARRATION_LEAD_FRAMES = 12;
export const HOLD_FRAMES = 24;

export const COLORS = {
  ink: '#11100e',
  inkSoft: '#201e1a',
  paper: '#f3efe6',
  paperDeep: '#e8e1d4',
  orange: '#f28c45',
  orangeLight: '#ffb16e',
  blue: '#8fd7ff',
  navy: '#071926',
  navySoft: '#142f49',
  white: '#fffdf8',
  muted: '#777166',
  red: '#d95544',
  green: '#61b899',
};

export const FONTS = {
  serif: '"Songti SC","STSong","Noto Serif CJK SC",serif',
  sans: '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif',
  mono: '"SFMono-Regular","Roboto Mono",monospace',
};

export const NARRATION = narrationJson as NarrationRecord[];
export const TTS_MANIFEST = manifestJson as CompetitionManifest;

const voiceMap = (voice: 'female' | 'male') =>
  new Map(TTS_MANIFEST[voice].segments.map((segment) => [segment.id, segment]));

export const buildTimeline = (): TimelineShot[] => {
  const female = voiceMap('female');
  const male = voiceMap('male');
  let cursor = COVER_FRAMES;

  return NARRATION.map((record, index) => {
    const femaleDuration = female.get(record.id)?.duration ?? 0;
    const maleDuration = male.get(record.id)?.duration ?? 0;
    const narrationDurationFemaleFrames = Math.ceil(femaleDuration * FPS);
    const narrationDurationMaleFrames = Math.ceil(maleDuration * FPS);
    // The 24-frame hold budget contains a 12-frame narration lead and a 12-frame tail.
    // Both voices therefore share one locked visual timeline without dead-air inflation.
    const durationFrames = Math.max(narrationDurationFemaleFrames, narrationDurationMaleFrames) + HOLD_FRAMES;
    const shot: TimelineShot = {
      ...record,
      index: index + 2,
      from: cursor,
      durationFrames,
      narrationFromFrames: NARRATION_LEAD_FRAMES,
      narrationDurationFemaleFrames,
      narrationDurationMaleFrames,
    };
    cursor += durationFrames;
    return shot;
  });
};

export const TIMELINE = buildTimeline();
export const TOTAL_FRAMES = COVER_FRAMES + TIMELINE.reduce((sum, shot) => sum + shot.durationFrames, 0);

export const progress = (frame: number, from: number, duration: number) =>
  Math.max(0, Math.min(1, (frame - from) / duration));

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
