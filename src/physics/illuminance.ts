/**
 * PRD §9.1 — 손실 없는 가정에서의 평균 조도(lux).
 *   E_avg = Φ / A
 *
 * Φ: 광속(lumen, lm)
 * A: 투영 면적(m²)
 * 반환: 평균 조도(lux = lm/m²)
 *
 * M2에서 점별 lux/nit 계산, 다중 프로젝터 합산, 차폐가 추가된다.
 */
export function averageIlluminance(luminousFluxLm: number, areaM2: number): number {
  if (areaM2 <= 0) return 0;
  return luminousFluxLm / areaM2;
}

/**
 * PRD §9.3 — Lambertian 가정에서 조도(lux) → 휘도(nit, cd/m²) 환산.
 *   L = g · E / π
 */
export function illuminanceToLuminance(illuminanceLux: number, gain: number): number {
  return (gain * illuminanceLux) / Math.PI;
}
