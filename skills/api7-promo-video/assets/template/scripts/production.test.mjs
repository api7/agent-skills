import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { competingProcesses, parseProcesses, parseVmStats } from './preflight.mjs';
import { safeRenderArguments, normalizeCommandArguments, runHyperframes, renderEnvironment } from './hf.mjs';
import { loudnessFailures, parseLoudness, probeFailures, writeReport } from './verify.mjs';
import { frameCount, inspectTimeline } from './story.mjs';
import { contactFrames } from './render.mjs';

test('custom media binaries reach both HyperFrames and file verification', () => {
  const previous=[process.env.FFMPEG_BIN,process.env.FFPROBE_BIN];
  try {
    process.env.FFMPEG_BIN='/test tools/ffmpeg';process.env.FFPROBE_BIN='/test tools/ffprobe';
    const env=renderEnvironment();
    assert.equal(env.HYPERFRAMES_FFMPEG_PATH,process.env.FFMPEG_BIN);
    assert.equal(env.HYPERFRAMES_FFPROBE_PATH,process.env.FFPROBE_BIN);
    assert.equal(env.NODE_OPTIONS,'--max-old-space-size=3072');
  } finally {
    for(const [i,key] of ['FFMPEG_BIN','FFPROBE_BIN'].entries()) {
      if(previous[i]===undefined)delete process.env[key];else process.env[key]=previous[i];
    }
  }
});

test('option-prefixed render cannot reach resource or CLI dispatch', () => {
  for(const args of [
    ['--json','render','--no-low-memory-mode','--workers','8'],
    ['--','render','--workers=8'],
    ['--help','render'],
  ]) assert.throws(()=>runHyperframes(args),/command before its options/);
  assert.deepEqual(normalizeCommandArguments(['--version']),['--version']);
  assert.deepEqual(normalizeCommandArguments(['render','--help']),['render','--help']);
});

test('resource inspection excludes this pipeline but catches another render and build', () => {
  const rows = parseProcesses(`
  1 0 /sbin/launchd
  20 1 npm run render
  21 20 /usr/local/bin/node scripts/render.mjs
  22 21 ps -axo pid=,ppid=,command=
  30 1 /usr/local/bin/node /tools/hyperframes/bin/hyperframes.mjs render --workers 1
  40 1 npm run build:docs
  50 1 /bin/zsh -c echo 'node scripts/render.mjs'
  60 1 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
  `);
  assert.deepEqual(competingProcesses(rows, 21).map((row) => row.pid), [30, 40]);
  assert.throws(() => competingProcesses(rows, 999), /absent/);
  assert.throws(() => parseProcesses('permission denied'), /parse/);
  assert.throws(() => parseProcesses(''), /no rows/);
});

test('macOS vm statistics must contain real page counts and a page size', () => {
  const stats = parseVmStats('Mach Virtual Memory Statistics: (page size of 16384 bytes)\nPages free: 100.\nPages inactive: 200.\nPages speculative: 50.');
  assert.equal(stats.reclaimableEstimateBytes, 350 * 16384);
  assert.throws(() => parseVmStats('Pages free: 100.'), /Cannot parse/);
});

test('delivery arguments cannot disable memory protection or raise concurrency', () => {
  for (const args of [
    ['render', '--workers', '2'], ['render', '--workers=auto'], ['render', '-w', '2'], ['render', '-w2'],
    ['render', '--no-low-memory-mode'], ['render', '--low-memory-mode=false'],
    ['render', '--strict=false'], ['render', '--fps', '60'], ['render', '--docker'],
  ]) assert.throws(() => safeRenderArguments(args));
  const safe = safeRenderArguments(['render', '--output', 'renders/promo.mp4']);
  assert.ok(safe.includes('--low-memory-mode'));
  assert.deepEqual(safe.slice(-2), ['--low-memory-mode', '--strict']);
});

const content = { width: 1080, height: 1080, duration: 20 };
const goodProbe = () => ({ streams: [
  { codec_type: 'video', codec_name: 'h264', width: 1080, height: 1080, avg_frame_rate: '30/1', duration: '20', nb_frames: '600' },
  { codec_type: 'audio', codec_name: 'aac', duration: '20' },
], format: { duration: '20.02' } });

test('verification rejects plausible but wrong delivery media', () => {
  assert.deepEqual(probeFailures(goodProbe(), content), []);
  const wrong = goodProbe();
  Object.assign(wrong.streams[0], { codec_name: 'hevc', width: 1920, avg_frame_rate: '24/1', duration: '20.05' });
  wrong.streams[1].codec_name = 'mp3';
  wrong.format.duration = '20.11';
  const failures = probeFailures(wrong, content);
  for (const expected of ['H.264', 'dimensions', '30 fps', 'one frame', 'AAC', 'Container duration']) assert.ok(failures.some((failure) => failure.includes(expected)), expected);
});

test('silence, inaudible music, and clipping cannot pass numeric audio acceptance', () => {
  const audio = parseLoudness('log\n{"input_i":"-21.2","input_tp":"-3.5","input_lra":"1.1"}\n');
  assert.deepEqual(loudnessFailures(audio), []);
  assert.throws(() => parseLoudness('{"input_i":"-inf","input_tp":"-inf"}'), /silent/);
  assert.ok(loudnessFailures({ integratedLUFS: -38, truePeakDBTP: -9 }).length);
  assert.ok(loudnessFailures({ integratedLUFS: -18, truePeakDBTP: 0 }).length);
});

test('rerunning verification preserves its previous evidence', () => {
  const dir = mkdtempSync(join(tmpdir(), 'promo-report-test-'));
  try {
    const path = join(dir, 'verification.json');
    writeReport(path, { revision: 1 });
    writeReport(path, { revision: 2 });
    assert.equal(JSON.parse(readFileSync(path, 'utf8')).revision, 2);
    const previous = readdirSync(dir).filter((file) => file !== 'verification.json');
    assert.equal(previous.length, 1);
    assert.equal(JSON.parse(readFileSync(join(dir, previous[0]), 'utf8')).revision, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('decoded samples cover both sides of every cut and remain inside the film', () => {
  for (const content of [
    {duration:20,scenes:[0,3,6,13,17].map(start=>({start}))},
    {duration:15,scenes:[0,68/30,136/30,9.4,12.4].map(start=>({start}))},
    {duration:8,scenes:[0,2,5].map(start=>({start}))},
    {duration:180,scenes:[0,12,30,70,110,145,175].map(start=>({start}))},
  ]) {
    const {duration}=content;
    const frames = contactFrames(content);
    assert.equal(frames[0], 0);
    assert.equal(frames.at(-1), duration * 30 - 1);
    assert.equal(new Set(frames).size, frames.length);
    for (const scene of content.scenes.slice(1)) {
      const cut = Math.round(scene.start * 30);
      assert.ok(frames.includes(cut - 1) && frames.includes(cut + 1));
    }
  }
});

test('timeline validation accepts requested lengths without a short-video ceiling and rejects gaps/overlaps',()=>{
  assert.equal(frameCount(180),5400);
  assert.equal(frameCount(1/30),1);
  assert.throws(()=>frameCount(undefined),/explicitly/);
  assert.throws(()=>frameCount(1.01),/30 fps/);
  for(const scenes of [[],[{start:1}],[{start:0,duration:9},{start:8,duration:2}]]){
    assert.throws(()=>inspectTimeline({duration:10,scenes}));
  }
});

test('an explicitly silent film must have no audio, while narration still requires AAC',()=>{
  const silent=goodProbe();silent.streams.pop();
  assert.deepEqual(probeFailures(silent,{...content,audioExpected:false}),[]);
  assert.ok(probeFailures(goodProbe(),{...content,audioExpected:false}).some(s=>s.includes('requests silence')));
  assert.ok(probeFailures(silent,{...content,audioExpected:true}).some(s=>s.includes('AAC')));
});
