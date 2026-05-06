/**
 * PRD §FR-4 / §9 — 프로젝터 frustum 산출과 룸 면(평면)과의 교차 계산.
 *
 * 좌표계: 룸 중심 = 원점, +Y 위(천장 방향), 우수좌표계.
 * 프로젝터 광축은 자체 로컬에서 -Z 방향(three.js Camera 컨벤션)이며,
 * rotation(yaw, pitch, roll, deg)을 적용해 월드 방향을 산출한다.
 *
 * 단순화 가정 (M1):
 * - 광선은 점광원에서 frustum의 4개 코너 방향으로 발사
 * - 각 코너 광선이 활성된 6면 중 가장 가까운 면(최소 양의 t)에 닿는 점이 투영 사각형 코너
 * - 4개 코너가 서로 다른 면에 걸치는 케이스(모서리에 걸침)는 v2에서 polygon clipping
 * - throwRatio = D/W (거리/투영 폭). zoom 슬라이더 0..1로 throwRatio.min..max 보간
 * - lensShift는 아래 수식의 normalized image plane 좌표를 평행 이동
 */

import type { ProjectorInstance, ProjectorSpec, Room, SurfaceId, Vec3 } from '../types/scenario';

const DEG = Math.PI / 180;

// ---------- 기본 벡터 유틸 (외부 라이브러리 없이) ----------

export type V3 = [number, number, number];
const v: (x: number, y: number, z: number) => V3 = (x, y, z) => [x, y, z];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const length = (a: V3): number => Math.hypot(a[0], a[1], a[2]);
const normalize = (a: V3): V3 => {
  const L = length(a) || 1;
  return [a[0] / L, a[1] / L, a[2] / L];
};

/**
 * Yaw-Pitch-Roll(도) → 3x3 회전행렬을 V3 3개로 표현 (right, up, forward).
 * three.js의 Euler 'YXZ' 컨벤션을 따른다 (Yaw → Pitch → Roll 순):
 *   Ry(yaw) · Rx(pitch) · Rz(roll)
 * forward 벡터는 로컬 -Z를 회전시킨 결과.
 */
export function eulerBasis(rotationDeg: V3): { right: V3; up: V3; forward: V3 } {
  const [pitchD, yawD, rollD] = rotationDeg; // [x, y, z] 각도지만 우리는 [pitch, yaw, roll]로 의미부여
  const cy = Math.cos(yawD * DEG);
  const sy = Math.sin(yawD * DEG);
  const cp = Math.cos(pitchD * DEG);
  const sp = Math.sin(pitchD * DEG);
  const cr = Math.cos(rollD * DEG);
  const sr = Math.sin(rollD * DEG);

  // YXZ: R = Ry · Rx · Rz
  // forward(local -Z): R · (0,0,-1)
  // up(local +Y): R · (0,1,0)
  // right(local +X): R · (1,0,0)
  const right: V3 = [cy * cr + sy * sp * sr, cp * sr, -sy * cr + cy * sp * sr];
  const up: V3 = [-cy * sr + sy * sp * cr, cp * cr, sy * sr + cy * sp * cr];
  const forward: V3 = [-sy * cp, sp, -cy * cp];
  return {
    right: normalize(right),
    up: normalize(up),
    forward: normalize(forward),
  };
}

// ---------- 프로젝터 frustum ----------

export interface ProjectorFrustum {
  origin: V3;       // 광원 위치
  forward: V3;      // 광축 단위 벡터
  /** 프로젝터로부터 unit distance(=1m)에서의 image plane 코너 4점(world 좌표).
   *  순서: [TL, TR, BR, BL] (Top-Left → Top-Right → Bottom-Right → Bottom-Left, 광축에서 본 시점) */
  cornerDirs: [V3, V3, V3, V3];  // 단위 방향 벡터 (origin → corner)
  halfWidthAt1m: number;         // unit distance에서 프로젝션 폭/2
  halfHeightAt1m: number;        // unit distance에서 프로젝션 높이/2
  throwRatio: number;            // 현재 적용된 throw (D/W)
}

/**
 * 줌 슬라이더 값(0..1)으로 throwRatio.min..max를 선형 보간.
 */
export function effectiveThrowRatio(spec: ProjectorSpec, zoom: number): number {
  const t = Math.max(0, Math.min(1, zoom));
  return spec.throwRatio.min + (spec.throwRatio.max - spec.throwRatio.min) * t;
}

/**
 * 프로젝터 인스턴스 + 사양 → frustum.
 * shift(h/v)는 -100..100 범위로 가정하며, ±100%면 image plane을 폭/높이만큼 옆으로 평행 이동.
 */
export function buildFrustum(inst: ProjectorInstance, spec: ProjectorSpec): ProjectorFrustum {
  const origin = inst.position as V3;
  const { right, up, forward } = eulerBasis(inst.rotation as V3);
  const throwRatio = effectiveThrowRatio(spec, inst.zoom);

  // unit distance(1m)에서 폭 W = 1 / throwRatio, 높이 H = W / aspect
  const W = 1 / throwRatio;
  const H = W / spec.aspect;
  const halfWidthAt1m = W / 2;
  const halfHeightAt1m = H / 2;

  // lens shift: % 단위. ±100%면 image plane을 폭/높이의 절반만큼 옆으로 추가 이동.
  const sx = ((inst.shift?.h ?? 0) / 100) * halfWidthAt1m;
  const sy = ((inst.shift?.v ?? 0) / 100) * halfHeightAt1m;

  // unit distance image plane 위 4코너의 월드 위치 = origin + forward + (±W/2 + sx)·right + (±H/2 + sy)·up
  const center1m = add(origin, forward);
  const TL = add(add(center1m, scale(right, -halfWidthAt1m + sx)), scale(up, halfHeightAt1m + sy));
  const TR = add(add(center1m, scale(right, halfWidthAt1m + sx)), scale(up, halfHeightAt1m + sy));
  const BR = add(add(center1m, scale(right, halfWidthAt1m + sx)), scale(up, -halfHeightAt1m + sy));
  const BL = add(add(center1m, scale(right, -halfWidthAt1m + sx)), scale(up, -halfHeightAt1m + sy));

  const cornerDirs: [V3, V3, V3, V3] = [
    normalize(sub(TL, origin)),
    normalize(sub(TR, origin)),
    normalize(sub(BR, origin)),
    normalize(sub(BL, origin)),
  ];

  return { origin, forward, cornerDirs, halfWidthAt1m, halfHeightAt1m, throwRatio };
}

// ---------- 룸 면(평면) 정의 ----------

export interface SurfacePlane {
  id: SurfaceId;
  point: V3;   // 평면 위 한 점
  normal: V3;  // 안쪽(룸 내부)을 향하는 단위 법선
}

/**
 * 룸 중심을 원점으로 한 6개 면의 평면. normal은 룸 내부 방향.
 */
export function roomPlanes(room: Room): SurfacePlane[] {
  const { w, d, h } = room.size;
  return [
    { id: 'floor',   point: [0, 0, 0],         normal: [0, 1, 0] },   // y=0, 위로
    { id: 'ceiling', point: [0, h, 0],         normal: [0, -1, 0] },  // y=h, 아래로
    { id: 'front',   point: [0, h / 2, -d / 2], normal: [0, 0, 1] },  // z=-d/2, 안쪽(+Z)
    { id: 'back',    point: [0, h / 2, d / 2],  normal: [0, 0, -1] }, // z=+d/2, 안쪽(-Z)
    { id: 'left',    point: [-w / 2, h / 2, 0], normal: [1, 0, 0] },  // x=-w/2, 안쪽(+X)
    { id: 'right',   point: [w / 2, h / 2, 0],  normal: [-1, 0, 0] }, // x=+w/2, 안쪽(-X)
  ];
}

/**
 * 광선-평면 교차. ray(t) = origin + t·dir.
 * 반환: t > eps & 평면의 안쪽(dir·normal < 0)인 경우만, 그 외에는 null.
 */
export function rayPlaneIntersect(
  origin: V3,
  dir: V3,
  plane: SurfacePlane,
  eps = 1e-6,
): { t: number; point: V3 } | null {
  const denom = dot(dir, plane.normal);
  // dir이 normal과 같은 방향이면 광선은 평면을 떠나는 방향 → 교차 안 함.
  // 평행이면 denom=0.
  if (denom > -eps) return null;
  const t = dot(sub(plane.point, origin), plane.normal) / denom;
  if (t <= eps) return null;
  return { t, point: add(origin, scale(dir, t)) };
}

/**
 * 한 광선이 활성된 모든 면 중 가장 먼저 만나는 면을 찾아 반환.
 * 비활성 면은 무시.
 */
export function castRayToActiveSurfaces(
  origin: V3,
  dir: V3,
  room: Room,
): { surface: SurfaceId; point: V3; t: number } | null {
  let best: { surface: SurfaceId; point: V3; t: number } | null = null;
  for (const plane of roomPlanes(room)) {
    if (!room.surfaces[plane.id].active) continue;
    const hit = rayPlaneIntersect(origin, dir, plane);
    if (hit && (!best || hit.t < best.t)) {
      best = { surface: plane.id, point: hit.point, t: hit.t };
    }
  }
  return best;
}

// ---------- 투영 다각형 ----------

export interface ProjectionPolygon {
  /** 4개 코너가 모두 같은 면에 떨어진 경우의 면 ID. 다른 면에 걸치면 null. */
  surface: SurfaceId | null;
  /** 4개 광선의 면 위 교차점(없으면 null). 순서는 frustum.cornerDirs와 동일. */
  corners: Array<{ surface: SurfaceId; point: V3 } | null>;
  /** 4 코너가 같은 면에 떨어졌을 때 면 위 폴리곤 면적(m²). 그렇지 않으면 NaN. */
  area: number;
}

/**
 * frustum의 4개 코너 광선을 활성 면들로 투사 → 다각형 정보 반환.
 * 4코너가 같은 면에 떨어지면 area 계산(2D 사각형, 사다리꼴 가능).
 */
export function projectFrustumOntoRoom(
  frustum: ProjectorFrustum,
  room: Room,
): ProjectionPolygon {
  const corners = frustum.cornerDirs.map((dir) =>
    castRayToActiveSurfaces(frustum.origin, dir, room),
  ) as ProjectionPolygon['corners'];

  // 모두 같은 면인지
  const surfaces = new Set(corners.map((c) => c?.surface));
  let surface: SurfaceId | null = null;
  if (corners.every((c) => c !== null) && surfaces.size === 1) {
    surface = corners[0]!.surface;
  }

  let area = NaN;
  if (surface) {
    // 4 코너의 평면 위 다각형 면적 — 면 평면에 투영된 2D 좌표로 계산
    const pts = corners.map((c) => c!.point);
    area = polygonArea3D(pts as V3[]);
  }

  return { surface, corners, area };
}

/**
 * 평면 위(또는 거의 평면) 폴리곤의 면적. 셔플 안 된 corner 순서 가정.
 * |Σ (Pi × Pi+1)| / 2 (3D 폴리곤). 폴리곤이 비평면이면 근사.
 */
export function polygonArea3D(pts: V3[]): number {
  if (pts.length < 3) return 0;
  let cx = 0,
    cy = 0,
    cz = 0;
  for (const p of pts) {
    cx += p[0];
    cy += p[1];
    cz += p[2];
  }
  cx /= pts.length;
  cy /= pts.length;
  cz /= pts.length;
  const c: V3 = [cx, cy, cz];
  let nx = 0,
    ny = 0,
    nz = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = sub(pts[i], c);
    const b = sub(pts[(i + 1) % pts.length], c);
    nx += a[1] * b[2] - a[2] * b[1];
    ny += a[2] * b[0] - a[0] * b[2];
    nz += a[0] * b[1] - a[1] * b[0];
  }
  return Math.hypot(nx, ny, nz) / 2;
}

// ---------- export 별칭 ----------
export { v as _vec3 };
export type { Vec3 };
