/**
 * PRD §10.3 데이터 모델 — v1 시나리오 타입 정의.
 */

export type Vec3 = [number, number, number];

export type SurfaceId = 'floor' | 'ceiling' | 'front' | 'back' | 'left' | 'right';

export type ScreenMaterialId = 'white-matte' | 'gray-08' | 'gray-06' | 'high-gain' | 'rear';

export interface SurfaceConfig {
  active: boolean;
  material: ScreenMaterialId;
}

export interface Room {
  size: { w: number; d: number; h: number };
  surfaces: Record<SurfaceId, SurfaceConfig>;
}

export interface ProjectorSpec {
  id: string;
  model: string;
  resolutionLabel?: string;
  ansiLumen: number;
  resolution: [number, number];
  aspect: number;
  throwRatio: { min: number; max: number };
  lensShift?: { hPct: [number, number]; vPct: [number, number] };
  contrast?: number;
  maxDiagonalInch?: number;
  source?: 'laser' | 'lamp';
}

export interface ProjectorInstance {
  id: string;
  specId: string;
  displayName: string;
  position: Vec3;
  rotation: Vec3;
  zoom: number;
  shift: { h: number; v: number };
  enabled: boolean;
  groupId?: string;
}

export interface ScreenMaterial {
  id: ScreenMaterialId;
  name: string;
  gain: number;
}

export interface Person {
  id: string;
  position: [number, number];
  height: number;
  shoulderRadius: number;
  posture: 'standing' | 'sitting' | 'raisedArms';
  enabled: boolean;
  groupId?: string;
}

export interface Obstacle {
  id: string;
  shape: 'capsule' | 'box';
  params: Record<string, number>;
  enabled: boolean;
}

export interface Viewer {
  id: string;
  position: Vec3;
  eyeHeight: number;
  active: boolean;
}

export interface Scenario {
  version: '1';
  name: string;
  room: Room;
  projectors: ProjectorInstance[];
  customSpecs: ProjectorSpec[];
  people: Person[];
  obstacles: Obstacle[];
  viewers: Viewer[];
  units: 'lux' | 'nit';
  sampleResolution: number;
  occlusion: {
    enabled: boolean;
    softShadow: false;
  };
}

export const DEFAULTS = {
  peopleCount: 20,
  personHeight: 1.7,
  personShoulderRadius: 0.225,
  personPosture: 'standing' as const,
  audienceLayout: 'poisson' as const,
  sampleResolution: 100,
  maxProjectors: 5,
} as const;
