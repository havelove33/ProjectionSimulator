import { describe, it, expect } from 'vitest';
import { averageIlluminance, illuminanceToLuminance } from '../illuminance';

describe('averageIlluminance (PRD §9.1)', () => {
  it('Φ=1000 lm을 1 m²에 투사하면 1000 lux', () => {
    expect(averageIlluminance(1000, 1)).toBe(1000);
  });

  it('면적 0이면 0 (방어 분기)', () => {
    expect(averageIlluminance(7000, 0)).toBe(0);
  });

  it('7000 ANSI lm을 7 m²에 투사하면 1000 lux', () => {
    expect(averageIlluminance(7000, 7)).toBeCloseTo(1000);
  });
});

describe('illuminanceToLuminance (PRD §9.3)', () => {
  it('gain=1, E=π lux → L = 1 nit', () => {
    expect(illuminanceToLuminance(Math.PI, 1)).toBeCloseTo(1);
  });

  it('gain=2.0이면 휘도가 2배', () => {
    const l1 = illuminanceToLuminance(1000, 1.0);
    const l2 = illuminanceToLuminance(1000, 2.0);
    expect(l2).toBeCloseTo(2 * l1);
  });
});
