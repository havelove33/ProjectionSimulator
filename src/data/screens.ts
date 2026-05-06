import type { ScreenMaterial } from '../types/scenario';

/**
 * PRD §FR-6 스크린 재질 프리셋 (정면 게인 기준).
 * 페인트 시리즈는 미디어아트 현장에서 자주 쓰이는 무광/반광 마감.
 * 'custom'은 사용자가 직접 게인을 입력하기 위한 자리.
 */
export const SCREEN_MATERIALS: ScreenMaterial[] = [
  { id: 'white-matte', name: '화이트 매트 스크린 (1.0)', gain: 1.0 },
  { id: 'gray-08',     name: '그레이 스크린 (0.8)', gain: 0.8 },
  { id: 'gray-06',     name: '그레이 스크린 (0.6)', gain: 0.6 },
  { id: 'high-gain',   name: '하이게인 스크린 (1.5)', gain: 1.5 },
  { id: 'rear',        name: '후면 투사 스크린 (1.2)', gain: 1.2 },
  { id: 'paint-white', name: '화이트 페인트 무광 (0.9)', gain: 0.9 },
  { id: 'paint-offwhite', name: '오프화이트 페인트 (0.8)', gain: 0.8 },
  { id: 'paint-gray',  name: '그레이 페인트 (0.6)', gain: 0.6 },
  { id: 'paint-black', name: '블랙 페인트 (0.05)', gain: 0.05 },
  { id: 'concrete',    name: '노출 콘크리트 (0.35)', gain: 0.35 },
  { id: 'wood',        name: '원목 (0.45)', gain: 0.45 },
  { id: 'custom',      name: '사용자 정의 (게인 직접 입력)', gain: 1.0 },
];

export function getScreenMaterial(id: string): ScreenMaterial | undefined {
  return SCREEN_MATERIALS.find((m) => m.id === id);
}
