export const VIDEO_TYPES = ['announcement', 'feature', 'tutorial', 'demo'];

export function frameCount(seconds, label = 'duration', allowZero = false) {
  const frames = Math.round(seconds * 30);
  if (!Number.isFinite(seconds) || !Number.isSafeInteger(frames) ||
      frames < (allowZero ? 0 : 1) || Math.abs(seconds - frames / 30) > 1e-6) {
    throw new Error(`${label} must be supplied explicitly in ${allowZero ? 'nonnegative' : 'positive'} seconds aligned to 30 fps.`);
  }
  return frames;
}

export function inspectTimeline({duration, scenes}) {
  const total = frameCount(duration);
  if (!Array.isArray(scenes) || !scenes.length) throw new Error('At least one scene is required.');
  const starts = scenes.map((s, i) => frameCount(s.start, `scenes[${i}].start`, true));
  if (starts[0] !== 0 || starts.some((f, i) => f >= total || (i && f <= starts[i - 1]))) {
    throw new Error('Scenes must start at zero, increase strictly and remain inside the target duration.');
  }
  for (const [i, s] of scenes.entries()) {
    if (s.duration === undefined) continue;
    const end = starts[i] + frameCount(s.duration, `scenes[${i}].duration`);
    if (end !== (starts[i + 1] ?? total)) throw new Error('Scene durations must cover the target exactly, without gaps or overlaps.');
  }
  return {total, cuts: starts.slice(1)};
}
