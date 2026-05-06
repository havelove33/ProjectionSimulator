import type { ProjectorSpec } from '../types/scenario';

/**
 * 시드 프로젝터 라이브러리 (PRD O-2 — 사용자 확정 전 임시 2종).
 * 모든 사양은 카탈로그 공칭치 기반이며, 사용자가 라이브러리에서 수정/오버라이드 가능.
 * v1 라이브러리는 10–20종으로 확장 예정.
 */
export const PROJECTOR_LIBRARY: ProjectorSpec[] = [
  {
    id: 'generic-7000lm-st',
    model: 'Generic 7,000 ANSI lm Short-throw',
    ansiLumen: 7000,
    resolution: [1920, 1200],
    aspect: 16 / 10,
    throwRatio: { min: 0.8, max: 1.0 },
    lensShift: { hPct: [-20, 20], vPct: [-50, 50] },
    contrast: 100000,
    source: 'laser',
  },
  {
    id: 'generic-5000lm-std',
    model: 'Generic 5,000 ANSI lm Standard',
    ansiLumen: 5000,
    resolution: [1920, 1080],
    aspect: 16 / 9,
    throwRatio: { min: 1.4, max: 2.2 },
    lensShift: { hPct: [-15, 15], vPct: [-30, 30] },
    contrast: 50000,
    source: 'lamp',
  },
];
