import { describe, it, expect } from 'vitest';
import {
  diagonalInchToWidthMeters,
  throwRatioFromDistance,
  distanceForDiagonal,
} from '../throwUtils';

const closeTo = (a: number, b: number, eps = 1e-3) => Math.abs(a - b) < eps;

describe('diagonalInchToWidthMeters', () => {
  it('16:9, 100인치 → 폭 ≈ 2.214m', () => {
    expect(closeTo(diagonalInchToWidthMeters(100, 16 / 9), 2.2136, 1e-3)).toBe(true);
  });
  it('16:10 (WUXGA), 100인치 → 폭 ≈ 2.154m', () => {
    expect(closeTo(diagonalInchToWidthMeters(100, 16 / 10), 2.154, 1e-3)).toBe(true);
  });
  it('4:3, 100인치 → 폭 ≈ 2.032m', () => {
    expect(closeTo(diagonalInchToWidthMeters(100, 4 / 3), 2.032, 1e-3)).toBe(true);
  });
});

describe('throwRatioFromDistance', () => {
  it('카탈로그 케이스: WUXGA 100인치, 거리 2.9m → throw ≈ 1.347', () => {
    const t = throwRatioFromDistance(100, 2.9, 16 / 10);
    expect(closeTo(t, 1.347, 1e-2)).toBe(true);
  });
  it('FHD(16:9) 100인치, 거리 2.5m → throw ≈ 1.13', () => {
    const t = throwRatioFromDistance(100, 2.5, 16 / 9);
    expect(closeTo(t, 1.13, 1e-2)).toBe(true);
  });
});

describe('distanceForDiagonal (역연산)', () => {
  it('throw 1.0, 100인치 16:10 → 거리 = 폭 = 2.154m', () => {
    const d = distanceForDiagonal(1.0, 100, 16 / 10);
    expect(closeTo(d, 2.154, 1e-3)).toBe(true);
  });
  it('throwRatioFromDistance와 distanceForDiagonal는 역함수', () => {
    const t = 1.6;
    const d = distanceForDiagonal(t, 120, 16 / 9);
    const back = throwRatioFromDistance(120, d, 16 / 9);
    expect(closeTo(back, t, 1e-6)).toBe(true);
  });
});
