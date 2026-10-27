#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { statfsSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const MIN_FREE_BYTES = 45_000_000_000;
export const HEALTHY_FREE_BYTES = 60_000_000_000;

function inspect(command, args) {
  const out = spawnSync(command, args, { encoding: 'utf8', timeout: 5_000, maxBuffer: 8 * 1024 * 1024 });
  if (out.error || out.signal || out.status !== 0) throw new Error(`Cannot inspect ${command}: ${out.error?.message || out.stderr?.trim() || out.signal || out.status}`);
  return out.stdout;
}

export function parseProcesses(text) {
  const lines = text.split('\n').filter((line) => line.trim());
  if (!lines.length) throw new Error('Process inspection returned no rows.');
  return lines.map((line) => {
    const m = line.match(/^\s*(\d+)\s+(\d+)\s+(.+)$/);
    if (!m) throw new Error('Cannot parse the process table.');
    return { pid: Number(m[1]), ppid: Number(m[2]), command: m[3].trim() };
  });
}

export function isHeavyProcess(command) {
  const first = basename(command.split(/\s+/)[0]);
  if (/^(ffmpeg|webpack|rollup|vite|docusaurus|next|nuxt)(?:$|\.)/.test(first)) return true;
  // Do not mistake quoted shell source, an editor, or a normal browser for a build.
  if (!/^(node(?:js)?|bun|npm|npx|pnpm|yarn|hyperframes)(?:$|\.)/.test(first)) return false;
  if (/\b(?:hyperframes(?:\.mjs)?|hf\.mjs)\s+render(?:\s|$)/.test(command)) return true;
  if (/(?:^|[\s/])(?:render|build|bundle)\.[cm]?js(?:\s|$)/.test(command)) return true;
  if (/\b(?:run(?:-script)?\s+)?(?:build|bundle|render)(?::[\w-]+)?(?:\s|$)/.test(command)) return true;
  return /(?:^|[\s/])(?:webpack|rollup|vite|docusaurus|next|nuxt)(?:[./\s]|$)/.test(command);
}

export function competingProcesses(rows, ownPid) {
  const byPid = new Map(rows.map((row) => [row.pid, row]));
  if (!byPid.has(ownPid)) throw new Error('The current process is absent from the process table.');
  const ancestors = new Set();
  let pid = ownPid;
  while (pid && !ancestors.has(pid)) {
    ancestors.add(pid);
    const row = byPid.get(pid);
    if (!row) break;
    pid = row.ppid;
  }
  return rows.filter((row) => !ancestors.has(row.pid) && isHeavyProcess(row.command));
}

export function parseVmStats(text) {
  const pageSize = Number(text.match(/page size of\s+(\d+)\s+bytes/)?.[1]);
  const counts = {};
  for (const key of ['free', 'inactive', 'speculative']) {
    counts[key] = Number(text.match(new RegExp(`^Pages ${key}:\\s+(\\d+)\\.`, 'm'))?.[1]);
  }
  if (!pageSize || Object.values(counts).some((value) => !Number.isFinite(value))) throw new Error('Cannot parse macOS vm_stat.');
  return { pageSize, pages: counts, reclaimableEstimateBytes: Object.values(counts).reduce((a, b) => a + b, 0) * pageSize };
}

export function resourceReport(project) {
  const report = { checkedAt: new Date().toISOString(), platform: process.platform, heapLimitMB: 3072, workers: 1, failures: [], warnings: [] };
  try {
    const fs = statfsSync(project, { bigint: true });
    report.diskFreeBytes = Number(fs.bavail * fs.bsize);
    if (report.diskFreeBytes < MIN_FREE_BYTES) report.failures.push('Rendering requires at least 45 GB free disk. Request cleanup approval; do not delete automatically.');
    else if (report.diskFreeBytes < HEALTHY_FREE_BYTES) report.warnings.push('Free disk is between 45 and 60 GB.');
  } catch (error) { report.failures.push(`Disk inspection failed: ${error.message}`); }
  try {
    const rows = parseProcesses(inspect('ps', ['-axo', 'pid=,ppid=,command=']));
    report.competingProcesses = competingProcesses(rows, process.pid);
    if (report.competingProcesses.length) report.failures.push(`Other heavy builds/renders are running (PIDs ${report.competingProcesses.map((row) => row.pid).join(', ')}).`);
  } catch (error) { report.failures.push(`Process inspection failed: ${error.message}`); }
  if (process.platform !== 'darwin') report.failures.push('Automatic memory-pressure validation supports macOS only. Perform a separate host resource check; there is no bypass flag.');
  else {
    try {
      const level = inspect('sysctl', ['-n', 'kern.memorystatus_vm_pressure_level']).trim();
      if (!/^[124]$/.test(level)) throw new Error('Unknown kernel memory-pressure level.');
      report.memory = { pressureLevel: Number(level), ...parseVmStats(inspect('vm_stat', [])) };
      if (level !== '1') report.failures.push(`macOS memory pressure is ${level === '2' ? 'warning' : 'critical'}; stop before rendering.`);
    } catch (error) { report.failures.push(`Memory inspection failed: ${error.message}`); }
  }
  report.ok = report.failures.length === 0;
  return report;
}

export function assertRenderResources(project) {
  const report = resourceReport(project);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) throw new Error('Resource preflight failed. No render was started.');
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { assertRenderResources(fileURLToPath(new URL('..', import.meta.url))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
