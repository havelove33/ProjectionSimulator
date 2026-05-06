/**
 * PRD §FR-4 / §9 — 프로젝터 frustum + 룸 면 교차.
 * 좌표계: 룸 중심 = 원점, +Y 위.
 *
 * M1++ 변경:
 *  - 광선이 비활성 면에 떨어지면 active 면이 없을 때 fallback으로 사용
 *  - 4코너의 dominant surface(가장 많이 떨어진 면)을 surface로 결정
 */

import type { ProjectorInstance, ProjectorSpec, Room, SurfaceId, Vec3 } from '../types/scenario';

const DEG = Math.PI / 180;

export type V3 = [number, number, number];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const length = (a: V3): number => Math.hypot(a[0], a[1], a[2]);
const normalize = (a: V3): V3 => {
  const L = length(a) || 1;
  return [a[0] / L, a[1] / L, a[2] / L];
};

export function eulerBasis(rotationDeg: V3): { right: V3; up: V3; forward: V3 } {
  const [pitchD, yawD, rollD] = rotationDeg;
  const cy = Math.cos(yawD * DEG);
  const sy = Math.sin(yawD * DEG);
  const cp = Math.cos(pitchD * DEG);
  const sp = Math.sin(pitchD * DEG);
  const cr = Math.cos(rollD * DEG);
  const sr = Math.sin(rollD * DEG);

  const right: V3 = [cy * cr + sy * sp * sr, cp * sr, -sy * cr + cy * sp * sr];
  const up: V3 = [-cy * sr + sy * sp * cr, cp * cr, sy * sr + cy * sp * cr];
  const forward: V3 = [-sy * cp, sp, -cy * cp];
  return { right: normalize(right), up: normalize(up), forward: normalize(forward) };
}

export interface ProjectorFrustum {
  origin: V3;
  forward: V3;
  cornerDirs: [V3, V3, V3, V3];
  halfWidthAt1m: number;
  halfHeightAt1m: number;
  throwRatio: number;
}

export function effectiveThrowRatio(spec: ProjectorSpec, zoom: number): number {
  const t = Math.max(0, Math.min(1, zoom));
  return spec.throwRatio.min + (spec.throwRatio.max - spec.throwRatio.min) * t;
}

export function buildFrustum(inst: ProjectorInstance, spec: ProjectorSpec): ProjectorFrustum {
  const origin = inst.position as V3;
  const { right, up, forward } = eulerBasis(inst.rotation as V3);
  const throwRatio = effectiveThrowRatio(spec, inst.zoom);

  const W = 1 / throwRatio;
  const H = W / spec.aspect;
  const halfWidthAt1m = W / 2;
  const halfHeightAt1m = H / 2;

  const sx = ((inst.shift?.h ?? 0) / 100) * halfWidthAt1m;
  const sy = ((inst.shift?.v ?? 0) / 100) * halfHeightAt1m;

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

export interface SurfacePlane {
  id: SurfaceId;
  point: V3;
  normal: V3;
}

export function roomPlanes(room: Room): SurfacePlane[] {
  const { w, d, h } = room.size;
  return [
    { id: 'floor',   point: [0, 0, 0],          normal: [0, 1, 0] },
    { id: 'ceiling', point: [0, h, 0],          normal: [0, -1, 0] },
    { id: 'front',   point: [0, h / 2, -d / 2], normal: [0, 0, 1] },
    { id: 'back',    point: [0, h / 2, d / 2],  normal: [0, 0, -1] },
    { id: 'left',    point: [-w / 2, h / 2, 0], normal: [1, 0, 0] },
    { id: 'right',   point: [w / 2, h / 2, 0],  normal: [-1, 0, 0] },
  ];
}

export function rayPlaneIntersect(
  origin: V3,
  dir: V3,
  plane: SurfacePlane,
  eps = 1e-6,
): { t: number; point: V3 } | null {
  const denom = dot(dir, plane.normal);
  if (denom > -eps) return null;
  const t = dot(sub(plane.point, origin), plane.normal) / denom;
  if (t <= eps) return null;
  return { t, point: add(origin, scale(dir, t)) };
}

/**
 * 광선이 닿는 면. 활성 면 우선. 활성 면에 못 닿으면 비활성 면(천장 등)에 fallback.
 * 빛은 물리적으로 어떤 면이든 닿는 게 정상이므로 거의 항상 not-null 반환.
 */
export function castRayToActiveSurfaces(
  origin: V3,
  dir: V3,
  room: Room,
): { surface: SurfaceId; point: V3; t: number; isActive: boolean } | null {
  let bestActive: { surface: SurfaceId; point: V3; t: number; isActive: boolean } | null = null;
  let bestAny: { surface: SurfaceId; point: V3; t: number; isActive: boolean } | null = null;
  for (const plane of roomPlanes(room)) {
    const hit = rayPlaneIntersect(origin, dir, plane);
    if (!hit) continue;
    const isActive = !!room.surfaces[plane.id].active;
    const candidate = { surface: plane.id, point: hit.point, t: hit.t, isActive };
    if (isActive && (!bestActive || hit.t < bestActive.t)) bestActive = candidate;
    if (!bestAny || hit.t < bestAny.t) bestAny = candidate;
  }
  return bestActive ?? bestAny;
}

export interface ProjectionPolygon {
  /** 4코너의 dominant surface (가장 많이 떨어진 면). 모든 코너 null이면 null. */
  surface: SurfaceId | null;
  /** dominant surface가 활성 면인지. 비활성 면(천장 등)에 닿은 경우 false. */
  surfaceIsActive: boolean;
  corners: Array<{ surface: SurfaceId; point: V3; isActive: boolean } | null>;
  /** 4코너 평면 위 다각형 면적(m²). dominant surface 평면 기준 근사. */
  area: number;
}

export function projectFrustumOntoRoom(
  frustum: ProjectorFrustum,
  room: Room,
): ProjectionPolygon {
  const corners = frustum.cornerDirs.map((dir) =>
    castRayToActiveSurfaces(frustum.origin, dir, room),
  ) as ProjectionPolygon['corners'];

  // dominant surface 산출 (가장 많이 떨어진 면)
  const counts = new Map<SurfaceId, number>();
  for (const c of corners) {
    if (!c) continue;
    counts.set(c.surface, (counts.get(c.surface) ?? 0) + 1);
  }
  let surface: SurfaceId | null = null;
  let max = 0;
  for (const [id, n] of counts) {
    if (n > max) {
      max = n;
      surface = id;
    }
  }
  const surfaceIsActive =
    surface !== null && !!room.surfaces[surface].active;

  let area = NaN;
  if (corners.every((c) => c !== null)) {
    const pts = corners.map((c) => c!.point) as V3[];
    area = polygonArea3D(pts);
  }

  return { surface, surfaceIsActive, corners, area };
}

export function polygonArea3D(pts: V3[]): number {
  if (pts.length < 3) return 0;
  let cx = 0, cy = 0, cz = 0;
  for (const p of pts) { cx += p[0]; cy += p[1]; cz += p[2]; }
  cx /= pts.length; cy /= pts.length; cz /= pts.length;
  const c: V3 = [cx, cy, cz];
  let nx = 0, ny = 0, nz = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = sub(pts[i], c);
    const b = sub(pts[(i + 1) % pts.length], c);
    nx += a[1] * b[2] - a[2] * b[1];
    ny += a[2] * b[0] - a[0] * b[2];
    nz += a[0] * b[1] - a[1] * b[0];
  }
  return Math.hypot(nx, ny, nz) / 2;
}

export type { Vec3 };
