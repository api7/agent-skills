#!/usr/bin/env node
import { existsSync, mkdirSync, openSync, closeSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PROJECT, run, runHyperframes } from './hf.mjs';
import { assertRenderResources } from './preflight.mjs';
import { loadContent, verify, writeReport } from './verify.mjs';
import { inspectTimeline } from './story.mjs';

export function contactFrames(content) {
  const {total,cuts}=inspectTimeline(content);
  return [...new Set([0, ...cuts.flatMap((frame) => [frame - 1, frame + 1]), Math.round(total * 0.475), total - 1])]
    .filter(frame=>frame>=0&&frame<total).sort((a, b) => a - b);
}

export function exportImages(project, content) {
  const dir = join(project, 'renders');
  const file = join(dir, 'promo.mp4');
  const ffmpeg = process.env.FFMPEG_BIN || 'ffmpeg';
  run(ffmpeg, ['-v', 'error', '-nostdin', '-n', '-threads', '1', '-i', file, '-frames:v', '1', '-threads', '1', '-update', '1', join(dir, 'cover.png')], { timeout: 60_000 });
  const frames = contactFrames(content);
  const select = frames.map((frame) => `eq(n\\,${frame})`).join('+');
  run(ffmpeg, [
    '-v', 'error', '-nostdin', '-n', '-threads', '1', '-i', file,
    '-vf', `select=${select},scale=360:-2,tile=1x${frames.length}:padding=8:color=0xf6f8fb`,
    '-frames:v', '1', '-threads', '1', '-update', '1', join(dir, 'phone-contact-sheet.png'),
  ], { timeout: Math.max(120_000,content.duration*1000) });
  writeFileSync(join(dir, 'phone-contact-sheet.json'), `${JSON.stringify({ width: 360, source: 'Decoded MP4 frames', frames: frames.map((frame) => ({ frame, seconds: frame / 30 })), approval: 'Exported for inspection; not automatically visually approved.' }, null, 2)}\n`, { flag: 'wx' });
}

export function reportRebuildData(project) {
  const report = { checkedAt: new Date().toISOString(), rebuildDirectories: [], docker: 'Not queryable; Docker was not started.' };
  for (const name of ['node_modules', '.cache', '.hyperframes/cache']) {
    if (!existsSync(join(project, name))) continue;
    try {
      const kib = Number(run('du', ['-sk', join(project, name)]).stdout.match(/^\s*(\d+)/)?.[1]);
      report.rebuildDirectories.push({ path: name, bytes: Number.isFinite(kib) ? kib * 1024 : null });
    } catch (error) { report.rebuildDirectories.push({ path: name, error: error.message }); }
  }
  try {
    run('docker', ['info', '--format', '{{json .ServerVersion}}'], { timeout: 3_000 });
    report.docker = run('docker', ['system', 'df', '--format', '{{json .}}'], { timeout: 5_000 }).stdout.trim().split('\n').map((line) => JSON.parse(line));
  } catch { /* Read-only query only; never start Docker or remove data. */ }
  writeReport(join(project, 'renders', 'resource-usage.json'), report);
  console.log(JSON.stringify(report, null, 2));
  return report;
}

export function render(project = PROJECT) {
  if (project !== PROJECT) throw new Error('Run this helper from its generated project.');
  const content = loadContent(project);
  const reviewFile = join(project, 'REVIEW.md');
  if (!existsSync(reviewFile) || !readFileSync(reviewFile, 'utf8').trim()) throw new Error('Record preview and phone-size visual review in REVIEW.md before delivery rendering.');
  assertRenderResources(project);
  const dir = join(project, 'renders');
  mkdirSync(dir, { recursive: true });
  for (const name of ['promo.mp4', 'cover.png', 'phone-contact-sheet.png', 'phone-contact-sheet.json']) {
    if (existsSync(join(dir, name))) throw new Error(`${name} already exists. Preserve/archive previous outputs explicitly before another render.`);
  }
  const lock = join(dir, '.promo-render.lock');
  let fd;
  let started = false;
  try {
    fd = openSync(lock, 'wx');
    writeFileSync(fd, `${process.pid}\n`);
    runHyperframes(['check', '--json']);
    started = true;
    runHyperframes(['render', '--output', join(dir, 'promo.mp4')]);
    exportImages(project, content);
    if (!verify(project).ok) throw new Error('Media verification failed. Inspect renders/verification.json; outputs were preserved.');
    console.log('Rendered and measured. Inspect the decoded cover/contact sheet and complete REVIEW.md before delivery.');
  } finally {
    if (fd !== undefined) { closeSync(fd); unlinkSync(lock); }
    if (started) {
      try { reportRebuildData(project); }
      catch (error) { console.warn(`Could not save resource-usage report: ${error.message}`); }
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { render(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
