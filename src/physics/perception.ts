/**
 * PRD §9.9 인체공학 시감 평가 — M1++ 단순 버전.
 * 휘도 L (nit) → 한 줄 코멘트 + 등급(A/B/C/D) 매핑.
 * 미디어아트 갤러리 권장 대역 30–100 nit 기준.
 */

export type PerceptualGrade = 'A' | 'B' | 'C' | 'D';

export interface PerceptualVerdict {
  grade: PerceptualGrade;
  region: 'photopic' | 'mesopic' | 'scotopic';
  message: string;
  band: 'under' | 'in-band' | 'over';
}

const TARGET_LOW_NIT = 30;
const TARGET_HIGH_NIT = 100;

export function classifyLuminance(L: number): PerceptualVerdict {
  let region: PerceptualVerdict['region'];
  if (L >= 3) region = 'photopic';
  else if (L >= 0.005) region = 'mesopic';
  else region = 'scotopic';

  let band: PerceptualVerdict['band'];
  if (L < TARGET_LOW_NIT) band = 'under';
  else if (L > TARGET_HIGH_NIT) band = 'over';
  else band = 'in-band';

  let grade: PerceptualGrade;
  let message: string;

  if (L < 0.005) {
    grade = 'D';
    message = '암소시 — 색·디테일 미인지, 윤곽만 보입니다. 빛이 거의 닿지 않는 영역.';
  } else if (L < 1) {
    grade = 'D';
    message = `박명시 하단 — 매우 어두워 색이 거의 안 보입니다 (${L.toFixed(2)} nit). 콘텐츠 감상 부적합.`;
  } else if (L < 3) {
    grade = 'C';
    message = `박명시 — 색이 약하고 어둡게 느껴집니다 (${L.toFixed(1)} nit). 일부 미디어아트 분위기엔 의도적으로 사용 가능.`;
  } else if (L < TARGET_LOW_NIT) {
    grade = 'C';
    message = `명소시이나 권장(30–100 nit) 미달 (${L.toFixed(0)} nit). 콘텐츠가 어둡게 느껴집니다 — 광량/거리/스크린 게인 보강 권장.`;
  } else if (L <= TARGET_HIGH_NIT) {
    grade = 'A';
    message = `미디어아트 권장 대역 (${L.toFixed(0)} nit). 자연스러운 감상 휘도.`;
  } else if (L <= 300) {
    grade = 'B';
    message = `권장 초과 (${L.toFixed(0)} nit). 약한 눈부심 가능, 단시간 노출엔 OK이나 장시간 시청은 피로 유발.`;
  } else {
    grade = 'D';
    message = `과다 휘도 (${L.toFixed(0)} nit). 강한 눈부심·잔상, 장시간 관람 부적합. 광량 줄이거나 게인 낮은 스크린 권장.`;
  }

  return { grade, region, band, message };
}

export const GRADE_COLOR: Record<PerceptualGrade, string> = {
  A: '#22c55e', // emerald-500
  B: '#eab308', // yellow-500
  C: '#f97316', // orange-500
  D: '#ef4444', // red-500
};
