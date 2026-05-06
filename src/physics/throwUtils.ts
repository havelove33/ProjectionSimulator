/**
 * 카탈로그가 제공하는 다양한 형태의 throw 정보를 throw ratio (D/W)로 통일하는 유틸.
 * 한국어 카탈로그가 자주 쓰는 표기:
 *   - "100인치 투사거리 2.9m"  → distanceForDiagonal=2.9, diagonalInch=100
 *   - "줌 1.0–1.3"              → throwRatio.min/max
 *   - "최대화면 300인치"        → maxDiagonalInch (정보용)
 */

const INCH_TO_M = 0.0254;

/**
 * 대각선 인치 → 폭(m). aspect는 W/H (e.g. 16/9, 16/10).
 *   diagonal² = W² + H², H = W/aspect
 *   diagonal = W·sqrt(1 + 1/aspect²)
 *   ⇒ W = diagonal / sqrt(1 + 1/aspect²)
 */
export function diagonalInchToWidthMeters(diagonalInch: number, aspect: number): number {
  const diagM = diagonalInch * INCH_TO_M;
  return diagM / Math.sqrt(1 + 1 / (aspect * aspect));
}

/**
 * 대각선 인치 + 거리(m) + aspect → throw ratio.
 */
export function throwRatioFromDistance(
  diagonalInch: number,
  distanceMeters: number,
  aspect: number,
): number {
  const W = diagonalInchToWidthMeters(diagonalInch, aspect);
  if (W <= 0) return NaN;
  return distanceMeters / W;
}

/**
 * throw ratio + 대각선 인치 → 필요한 거리(m).
 */
export function distanceForDiagonal(
  throwRatio: number,
  diagonalInch: number,
  aspect: number,
): number {
  return throwRatio * diagonalInchToWidthMeters(diagonalInch, aspect);
}
