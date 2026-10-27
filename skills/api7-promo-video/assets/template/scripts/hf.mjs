#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { delimiter, dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { assertRenderResources } from './preflight.mjs';

export const PROJECT = fileURLToPath(new URL('..', import.meta.url));
export const HYPERFRAMES_VERSION = '0.8.200';
export const renderEnvironment = () => ({
  ...process.env, NODE_OPTIONS: '--max-old-space-size=3072',
  PRODUCER_LOW_MEMORY_MODE: 'true',
  ...(process.env.FFMPEG_BIN ? {HYPERFRAMES_FFMPEG_PATH:process.env.FFMPEG_BIN} : {}),
  ...(process.env.FFPROBE_BIN ? {HYPERFRAMES_FFPROBE_PATH:process.env.FFPROBE_BIN} : {}),
});

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: PROJECT, env: renderEnvironment(), stdio: 'pipe',
    encoding: 'utf8', timeout: 15_000, maxBuffer: 8 * 1024 * 1024,
    ...options,
  });
  if (result.error) throw new Error(`${command}: ${result.error.message}`);
  if (result.signal || result.status !== 0) {
    throw new Error(`${command} failed (${result.signal || result.status}).${result.stderr ? `\n${result.stderr.trim()}` : ''}`);
  }
  return result;
}

function executablePath(value) {
  if (isAbsolute(value) || value.includes('/')) return realpathSync(resolve(PROJECT, value));
  for (const dir of (process.env.PATH || '').split(delimiter)) {
    const candidate = join(dir, value);
    if (existsSync(candidate)) return realpathSync(candidate);
  }
  throw new Error(`Cannot find ${value} on PATH.`);
}

export function hyperframesCommand() {
  const binary = executablePath(process.env.PROMO_HYPERFRAMES_BIN || join(PROJECT, 'node_modules', 'hyperframes', 'bin', 'hyperframes.mjs'));
  let dir = dirname(binary);
  let version;
  while (true) {
    const manifest = join(dir, 'package.json');
    if (existsSync(manifest)) {
      const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
      if (pkg.name === 'hyperframes') { version = pkg.version; break; }
    }
    if (dirname(dir) === dir) break;
    dir = dirname(dir);
  }
  if (version !== HYPERFRAMES_VERSION) throw new Error(`HyperFrames package must be ${HYPERFRAMES_VERSION}; found ${version || 'no matching package metadata'}. Run npm ci in the project.`);
  const command = /\.[cm]?js$/.test(binary) ? process.execPath : binary;
  const prefix = command === process.execPath ? [binary] : [];
  const banner = run(command, [...prefix, '--version']).stdout.trim();
  if (banner !== HYPERFRAMES_VERSION) throw new Error(`HyperFrames CLI reports ${banner}; expected ${HYPERFRAMES_VERSION}.`);
  return { command, prefix };
}

export function safeRenderArguments(args) {
  // Conflicting flags are refused, including arguments passed through npm run hf.
  const fixed = new Map([['--workers', '1'], ['--fps', '30'], ['--quality', 'delivery'], ['--format', 'mp4']]);
  const aliases = new Map([['-w', '--workers'], ['-f', '--fps'], ['-q', '--quality']]);
  for (let i = 1; i < args.length; i++) {
    const [rawFlag, inline] = args[i].split('=', 2);
    if (/^-[wfq].+/.test(rawFlag)) throw new Error('Use a separate value for render option aliases.');
    const flag = aliases.get(rawFlag) || rawFlag;
    if (['--no-low-memory-mode', '--no-strict', '--docker', '--batch'].includes(flag)) throw new Error(`${flag} is unavailable in the local delivery pipeline.`);
    if (['--low-memory-mode', '--strict'].includes(flag) && inline !== undefined && inline !== 'true') throw new Error(`${flag} cannot be disabled in the local delivery pipeline.`);
    if (fixed.has(flag)) {
      const value = inline ?? args[i + 1];
      if (value !== fixed.get(flag)) throw new Error(`${flag} must be ${fixed.get(flag)} in the local delivery pipeline.`);
      if (inline === undefined) i++;
    }
  }
  return [...args, '--workers', '1', '--fps', '30', '--quality', 'delivery', '--format', 'mp4', '--low-memory-mode', '--strict'];
}

export function normalizeCommandArguments(args) {
  if (args[0]?.startsWith('-') && !(args.length === 1 && ['--help','-h','--version','-v'].includes(args[0]))) {
    throw new Error('Put the HyperFrames command before its options. Leading options cannot bypass the render preflight.');
  }
  return args;
}

export function runHyperframes(input) {
  const args = normalizeCommandArguments(input);
  let forwarded = args;
  if (args[0] === 'render' && !args.includes('--help') && !args.includes('-h')) {
    assertRenderResources(PROJECT);
    forwarded = safeRenderArguments(args);
  }
  const { command, prefix } = hyperframesCommand();
  return run(command, [...prefix, ...forwarded], { stdio: 'inherit', timeout: undefined });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { runHyperframes(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
