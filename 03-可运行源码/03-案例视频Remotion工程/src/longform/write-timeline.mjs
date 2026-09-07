import {readFile, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const project = resolve(here, '../..');
const fps = 30;
const coverFrames = 12 * fps;
const narrationFromFrames = 12;
const holdFrames = 24;

const narration = JSON.parse(await readFile(resolve(project, 'production/competition-narration.json'), 'utf8'));
const manifest = JSON.parse(await readFile(resolve(project, 'production/competition-tts-manifest.json'), 'utf8'));
const byVoice = Object.fromEntries(['female', 'male'].map((voice) => [voice, new Map(manifest[voice].segments.map((segment) => [segment.id, segment]))]));

let cursor = coverFrames;
const segments = narration.map((record) => {
  const narrationDurationFemaleFrames = Math.ceil((byVoice.female.get(record.id)?.duration ?? 0) * fps);
  const narrationDurationMaleFrames = Math.ceil((byVoice.male.get(record.id)?.duration ?? 0) * fps);
  const durationFrames = Math.max(narrationDurationFemaleFrames, narrationDurationMaleFrames) + holdFrames;
  const result = {id: record.id, from: cursor, durationFrames, narrationFromFrames, narrationDurationFemaleFrames, narrationDurationMaleFrames};
  cursor += durationFrames;
  return result;
});

const output = {fps, totalFrames: cursor, coverFrames, segments};
await writeFile(resolve(project, 'production/competition-timeline.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({totalFrames: cursor, seconds: cursor / fps, minutes: `${Math.floor(cursor / fps / 60)}:${String(Math.round(cursor / fps % 60)).padStart(2, '0')}`}, null, 2));
