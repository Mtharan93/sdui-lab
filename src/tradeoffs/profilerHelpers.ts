import type { ProfilerOnRenderCallback } from 'react';

export interface ProfilerStats {
  commits: number;
  mountDurationMs: number | null;
  lastDurationMs: number | null;
  totalDurationMs: number;
}

export function createInitialProfilerStats(): ProfilerStats {
  return {
    commits: 0,
    mountDurationMs: null,
    lastDurationMs: null,
    totalDurationMs: 0,
  };
}

export function applyProfilerSample(
  prev: ProfilerStats,
  phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number,
): ProfilerStats {
  const rounded = Number(actualDuration.toFixed(3));
  return {
    commits: prev.commits + 1,
    mountDurationMs:
      phase === 'mount' && prev.mountDurationMs === null ? rounded : prev.mountDurationMs,
    lastDurationMs: rounded,
    totalDurationMs: Number((prev.totalDurationMs + rounded).toFixed(3)),
  };
}

export function createProfilerCallback(
  onSample: (phase: 'mount' | 'update' | 'nested-update', actualDuration: number) => void,
): ProfilerOnRenderCallback {
  return (_id, phase, actualDuration) => {
    onSample(phase, actualDuration);
  };
}
