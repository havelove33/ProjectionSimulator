import type { ScreenMaterial } from '../types/scenario';

/**
 * PRD §FR-6 스크린 재질 프리셋 (정면 게인 기준).
 * 입사각 cosθ 가중은 §9.3에서 처리.
 */
export const SCREEN_MATERIALS: ScreenMaterial[] = [
  { id: 'white-matte', name: 'White Matte (게인 1.0)', gain: 1.0 },
  { id: 'gray-08', name: 'Gray (0.8)', gain: 0.8 },
  { id: 'gray-06', name: 'Gray (0.6)', gain: 0.6 },
  { id: 'high-gain', name: 'High-gain (1.5)', gain: 1.5 },
  { id: 'rear', name: 'Rear-projection (1.2)', gain: 1.2 },
];
