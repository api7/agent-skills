#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PROJECT, run } from './hf.mjs';
import { frameCount, inspectTimeline } from './story.mjs';

export const ASPECTS = { square: [1080, 1080], landscape: [1920, 1080], portrait: [1080, 1350] };
export const AUDIO_LIMITS = { minIntegratedLUFS: -28, maxIntegratedLUFS: -12, maxTruePeakDBTP: -1 };

export function loadContent(project = PROJECT) {
  const content = JSON.parse(readFileSync(join(project, 'content.json'), 'utf8'));
  const size = ASPECTS[content.aspect];
  if (!size || content.width !== size[0] || content.height !== size[1]) throw new Error('content.json dimensions must match its supported aspect.');
  frameCount(content.duration);
  inspectTimeline(content);
  return content;
}

function rational(value) {
  if (typeof value !== 'string') return NaN;
  const [n, d = '1'] = value.split('/');
  return Number(n) / Number(d);
}

export function probeFailures(probe, content) {
  const failures = [];
  const videos = (probe.streams || []).filter((stream) => stream.codec_type === 'video');
  const audios = (probe.streams || []).filter((stream) => stream.codec_type === 'audio');
  const video = videos[0];
  if (videos.length !== 1 || !video) failures.push('Expected one video stream.');
  if (video) {
    if (video.codec_name !== 'h264') failures.push('Video codec must be H.264.');
    if (video.width !== content.width || video.height !== content.height) failures.push('Video dimensions differ from the brief.');
    if (Math.abs(rational(video.avg_frame_rate) - 30) > 0.001 || !Number.isFinite(rational(video.avg_frame_rate))) failures.push('Average frame rate must be 30 fps.');
    const duration = Number(video.duration);
    if (!Number.isFinite(duration) || Math.abs(duration - content.duration) > 1 / 30 + 0.001) failures.push('Video duration differs by more than one frame.');
    if (video.nb_frames && Math.abs(Number(video.nb_frames) - Math.round(content.duration * 30)) > 1) failures.push('Frame count differs by more than one frame.');
  }
  if (content.audioExpected===false) {
    if(audios.length) failures.push('The brief requests silence but the file contains audio.');
  } else if (audios.length !== 1 || audios[0]?.codec_name !== 'aac') failures.push('Expected one AAC audio stream.');
  const duration = Number(probe.format?.duration);
  if (!Number.isFinite(duration) || Math.abs(duration - content.duration) > 0.1) failures.push('Container duration differs by more than 0.1 seconds.');
  if(content.audioExpected!==false){
    const audioDuration = Number(audios[0]?.duration);
    if (!Number.isFinite(audioDuration) || Math.abs(audioDuration - content.duration) > 0.1) failures.push('Audio duration differs by more than 0.1 seconds.');
  }
  return failures;
}

export function parseLoudness(stderr) {
  const matches = [...stderr.matchAll(/\{\s*"input_i"[\s\S]*?\}/g)];
  if (!matches.length) throw new Error('FFmpeg returned no loudness measurement.');
  const input = JSON.parse(matches.at(-1)[0]);
  const integratedLUFS = Number(input.input_i);
  const truePeakDBTP = Number(input.input_tp);
  if (![integratedLUFS, truePeakDBTP].every(Number.isFinite)) throw new Error('Audio is silent or loudness measurements are invalid.');
  return { integratedLUFS, truePeakDBTP, loudnessRangeLU: Number(input.input_lra) };
}

export function loudnessFailures(audio) {
  const failures = [];
  if (audio.integratedLUFS < AUDIO_LIMITS.minIntegratedLUFS || audio.integratedLUFS > AUDIO_LIMITS.maxIntegratedLUFS) failures.push(`Music loudness must be between ${AUDIO_LIMITS.minIntegratedLUFS} and ${AUDIO_LIMITS.maxIntegratedLUFS} LUFS; measured ${audio.integratedLUFS}.`);
  if (audio.truePeakDBTP > AUDIO_LIMITS.maxTruePeakDBTP) failures.push(`Audio true peak must be ≤${AUDIO_LIMITS.maxTruePeakDBTP} dBTP; measured ${audio.truePeakDBTP}.`);
  return failures;
}

export function writeReport(file, report) {
  if (existsSync(file)) {
    const archived = file.replace(/\.json$/, `.${new Date().toISOString().replace(/[:.]/g, '-')}.${process.pid}.json`);
    renameSync(file, archived);
    console.log(`Preserved previous report: ${archived}`);
  }
  writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
}

export function verify(project = PROJECT) {
  const dir = join(project, 'renders');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'promo.mp4');
  const report = {
    checkedAt: new Date().toISOString(), file: 'renders/promo.mp4', failures: [],
    audioLimits: AUDIO_LIMITS,
    visualReview: 'Pending explicit inspection of decoded frames; this script cannot approve visual quality.',
    listeningReview: 'Audio measured, not heard by this script. Listening remains a separate review.',
  };
  try {
    const content = loadContent(project);
    if (!existsSync(file) || !statSync(file).isFile() || statSync(file).size <= 0) throw new Error('renders/promo.mp4 is missing or empty.');
    report.bytes = statSync(file).size;
    const probe = JSON.parse(run(process.env.FFPROBE_BIN || 'ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]).stdout);
    report.media = probe;
    report.failures.push(...probeFailures(probe, content));
    if(content.audioExpected!==false){
      const measurement = run(process.env.FFMPEG_BIN || 'ffmpeg', [
      '-hide_banner', '-nostdin', '-threads', '1', '-i', file, '-map', '0:a:0',
      '-af', 'loudnorm=I=-18:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-',
      ], { timeout: Math.max(120_000,content.duration*1000) });
      report.audio = parseLoudness(measurement.stderr);
      report.failures.push(...loudnessFailures(report.audio));
    } else report.audio='No audio requested; confirmed by stream inspection.';
  } catch (error) { report.failures.push(error.message); }
  report.ok = report.failures.length === 0;
  writeReport(join(dir, 'verification.json'), report);
  console.log(JSON.stringify(report, null, 2));
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { if (!verify().ok) process.exitCode = 1; }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
