/**
 * PRD §FR-4 / §9 — 프로젝터 frustum + 룸 면 교차.
 * 좌표계: 룸 중심 = 원점, +Y 위.
 *
 * M1+++++:
 *  - sampleFrustumGrid: frustum image plane을 grid로 샘플링 → 면별 hit 점 그룹
 *  - planeBasis: 면 위 점들을 2D angle sort 하기 위한 plane basis
 */

import type { ProjectorInstance, ProjectorSpec, Room, SurfaceId, Vec3 } from '../types/scenario';

const DEG = Math.PI / 180;

export type V3 = [number, number, number];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const length = (a: V3): number => Math.hypot(a[0], a[1], a[2]);
const normalize = (a: V3): V3 => {
  const L = length(a) || 1;
  return [a[0] / L, a[1] / L, a[2] / L];
};
const lerpV3 = (a: V3, b: V3, t: number): V3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

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
  surface: SurfaceId | null;
  surfaceIsActive: boolean;
  corners: Array<{ surface: SurfaceId; point: V3; isActive: boolean } | null>;
  area: number;
}

export function projectFrustumOntoRoom(
  frustum: ProjectorFrustum,
  room: Room,
): ProjectionPolygon {
  const corners = frustum.cornerDirs.map((dir) =>
    castRayToActiveSurfaces(frustum.origin, dir, room),
  ) as ProjectionPolygon['corners'];

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
  const surfaceIsActive = surface !== null && !!room.surfaces[surface].active;

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

/** 면 normal에 수직인 두 단위벡터(plane basis) 반환. */
export function planeBasis(normal: V3): { u: V3; v: V3 } {
  const ref: V3 = Math.abs(normal[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = normalize(cross(normal, ref));
  const v = normalize(cross(normal, u));
  return { u, v };
}

/** 면 위 점들을 plane basis로 2D 좌표 변환한 뒤 centroid angle 기준으로 시계방향 정렬. */
export function sortPointsByAngle(points: V3[], plane: SurfacePlane): V3[] {
  if (points.length < 3) return points;
  const { u, v } = planeBasis(plane.normal);
  // centroid
  let cx = 0, cy = 0, cz = 0;
  for (const p of points) { cx += p[0]; cy += p[1]; cz += p[2]; }
  cx /= points.length; cy /= points.length; cz /= points.length;
  const c: V3 = [cx, cy, cz];
  const angled = points.map((p) => {
    const rel = sub(p, c);
    const x = dot(rel, u);
    const y = dot(rel, v);
    return { p, a: Math.atan2(y, x) };
  });
  angled.sort((a, b) => a.a - b.a);
  return angled.map((x) => x.p);
}

export interface SurfaceHitGroup {
  surface: SurfaceId;
  isActive: boolean;
  normal: V3;
  /** plane basis로 정렬된 면 위 점들 (시계방향) */
  polygon: V3[];
}

/**
 * frustum image plane을 N+1 × N+1 grid로 샘플링해 광선 발사 → 면별 hit 점 그룹.
 * 면이 갈리는 케이스에서도 면별 부분 polygon 추출 가능.
 */
export function sampleFrustumGrid(
  frustum: ProjectorFrustum,
  room: Room,
  gridN: number = 8,
): SurfaceHitGroup[] {
  const groups = new Map<SurfaceId, V3[]>();
  // cornerDirs: TL=0, TR=1, BR=2, BL=3
  const TL = frustum.cornerDirs[0];
  const TR = frustum.cornerDirs[1];
  const BR = frustum.cornerDirs[2];
  const BL = frustum.cornerDirs[3];

  for (let i = 0; i <= gridN; i++) {
    for (let j = 0; j <= gridN; j++) {
      const u = i / gridN;
      const v = j / gridN;
      const top = lerpV3(TL, TR, u);
      const bot = lerpV3(BL, BR, u);
      const dir = normalize(lerpV3(top, bot, v));
      const hit = castRayToActiveSurfaces(frustum.origin, dir, room);
      if (!hit) continue;
      const arr = groups.get(hit.surface) || [];
      arr.push(hit.point);
      groups.set(hit.surface, arr);
    }
  }

  const planes = roomPlanes(room);
  const result: SurfaceHitGroup[] = [];
  for (const [surface, pts] of groups) {
    if (pts.length < 3) continue;
    const plane = planes.find((p) => p.id === surface)!;
    result.push({
      surface,
      isActive: !!room.surfaces[surface].active,
      normal: plane.normal,
      polygon: sortPointsByAngle(pts, plane),
    });
  }
  return result;
}

export type { Vec3 };

export interface SurfaceQuadGroup {
  surface: SurfaceId;
  isActive: boolean;
  normal: V3;
  /** 각 quad는 [TL, TR, BR, BL] 4점 (월드 좌표) */
  quads: V3[][];
}

/**
 * frustum image plane을 (gridN+1)×(gridN+1) grid로 샘플링하고,
 * 각 grid cell(인접 4점)이 모두 같은 면에 떨어진 경우에만 그 면 그룹에 quad로 추가.
 * fan triangulation 대신 작은 quad들의 합집합으로 구현 — 비-convex 폴리곤 zigzag 문제 회피.
 */
export function sampleFrustumQuads(
  frustum: ProjectorFrustum,
  room: Room,
  gridN: number = 12,
): SurfaceQuadGroup[] {
  const TL = frustum.cornerDirs[0];
  const TR = frustum.cornerDirs[1];
  const BR = frustum.cornerDirs[2];
  const BL = frustum.cornerDirs[3];

  type Hit = { surface: SurfaceId; point: V3; isActive: boolean } | null;
  const hits: Hit[][] = [];
  for (let i = 0; i <= gridN; i++) {
    const row: Hit[] = [];
    for (let j = 0; j <= gridN; j++) {
      const u = i / gridN;
      const v = j / gridN;
      const top = lerpV3(TL, TR, u);
      const bot = lerpV3(BL, BR, u);
      const dir = normalize(lerpV3(top, bot, v));
      row.push(castRayToActiveSurfaces(frustum.origin, dir, room));
    }
    hits.push(row);
  }

  const groups = new Map<SurfaceId, V3[][]>();
  for (let i = 0; i < gridN; i++) {
    for (let j = 0; j < gridN; j++) {
      const a = hits[i][j];
      const b = hits[i + 1][j];
      const c = hits[i + 1][j + 1];
      const d = hits[i][j + 1];
      if (!a || !b || !c || !d) continue;
      if (a.surface !== b.surface || b.surface !== c.surface || c.surface !== d.surface) continue;
      const list = groups.get(a.surface) || [];
      list.push([a.point, b.point, c.point, d.point]);
      groups.set(a.surface, list);
    }
  }

  const planes = roomPlanes(room);
  const result: SurfaceQuadGroup[] = [];
  for (const [surface, quads] of groups) {
    const plane = planes.find((p) => p.id === surface)!;
    result.push({
      surface,
      isActive: !!room.surfaces[surface].active,
      normal: plane.normal,
      quads,
    });
  }
  return result;
}
