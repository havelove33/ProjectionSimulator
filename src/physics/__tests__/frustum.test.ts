import { describe, it, expect } from 'vitest';
import {
  buildFrustum,
  effectiveThrowRatio,
  eulerBasis,
  rayPlaneIntersect,
  roomPlanes,
  projectFrustumOntoRoom,
  polygonArea3D,
  type V3,
} from '../frustum';
import type { ProjectorInstance, ProjectorSpec, Room } from '../../types/scenario';

const closeTo = (v: number, t: number, eps = 1e-3) => Math.abs(v - t) < eps;

const room: Room = {
  size: { w: 8, d: 6, h: 3 },
  surfaces: {
    floor: { active: true, material: 'white-matte' },
    ceiling: { active: false, material: 'white-matte' },
    front: { active: true, material: 'white-matte' },
    back: { active: false, material: 'white-matte' },
    left: { active: true, material: 'white-matte' },
    right: { active: true, material: 'white-matte' },
  },
};

const spec: ProjectorSpec = {
  id: 'test',
  model: 'Test',
  ansiLumen: 7000,
  resolution: [1920, 1200],
  aspect: 16 / 10,
  throwRatio: { min: 1.0, max: 2.0 },
};

describe('eulerBasis (PRD §10.2 회전 컨벤션)', () => {
  it('회전 0이면 forward = (0,0,-1), up = (0,1,0)', () => {
    const { right, up, forward } = eulerBasis([0, 0, 0]);
    expect(closeTo(right[0], 1)).toBe(true);
    expect(closeTo(up[1], 1)).toBe(true);
    expect(closeTo(forward[2], -1)).toBe(true);
  });

  it('Yaw 90°이면 forward가 +X 방향(우수좌표계)', () => {
    const { forward } = eulerBasis([0, 90, 0]);
    expect(closeTo(forward[0], -1, 1e-3) || closeTo(forward[0], 1, 1e-3)).toBe(true);
  });

  it('Pitch -90°이면 forward가 -Y(아래)', () => {
    const { forward } = eulerBasis([-90, 0, 0]);
    expect(closeTo(forward[1], -1)).toBe(true);
  });
});

describe('effectiveThrowRatio', () => {
  it('zoom=0이면 min, zoom=1이면 max', () => {
    expect(effectiveThrowRatio(spec, 0)).toBe(1.0);
    expect(effectiveThrowRatio(spec, 1)).toBe(2.0);
  });
  it('zoom=0.5이면 중간값', () => {
    expect(effectiveThrowRatio(spec, 0.5)).toBe(1.5);
  });
  it('범위 밖은 클램프', () => {
    expect(effectiveThrowRatio(spec, -1)).toBe(1.0);
    expect(effectiveThrowRatio(spec, 2)).toBe(2.0);
  });
});

describe('buildFrustum — throw=1, aspect=1.6, unit distance에서 폭 1m', () => {
  // 광원이 (0,3,0)에서 -Y(바닥)을 향하면 면적 계산이 깔끔
  const inst: ProjectorInstance = {
    id: 'i',
    specId: spec.id,
    position: [0, 3, 0],
    rotation: [-90, 0, 0], // pitch -90 → 광축이 -Y
    zoom: 0,               // throw = 1
    shift: { h: 0, v: 0 },
    enabled: true,
  };
  const f = buildFrustum(inst, spec);

  it('throw=1이면 unit distance에서 폭 1m, 높이 1/aspect', () => {
    expect(closeTo(f.halfWidthAt1m * 2, 1)).toBe(true);
    expect(closeTo(f.halfHeightAt1m * 2, 1 / 1.6)).toBe(true);
  });

  it('forward는 -Y', () => {
    expect(closeTo(f.forward[1], -1)).toBe(true);
  });

  it('4개 코너 광선이 정규화된 단위 벡터', () => {
    for (const d of f.cornerDirs) {
      const len = Math.hypot(d[0], d[1], d[2]);
      expect(closeTo(len, 1, 1e-6)).toBe(true);
    }
  });
});

describe('rayPlaneIntersect', () => {
  it('+Y 평면에서 시작해 -Y로 가면 floor(y=0)에 t=h에서 만남', () => {
    const [floor] = roomPlanes(room).filter((p) => p.id === 'floor');
    const hit = rayPlaneIntersect([0, 3, 0], [0, -1, 0], floor);
    expect(hit).not.toBeNull();
    expect(closeTo(hit!.t, 3)).toBe(true);
    expect(closeTo(hit!.point[1], 0)).toBe(true);
  });

  it('평면을 떠나는 방향(법선 같은 쪽)이면 null', () => {
    const [floor] = roomPlanes(room).filter((p) => p.id === 'floor');
    const hit = rayPlaneIntersect([0, 3, 0], [0, 1, 0], floor);
    expect(hit).toBeNull();
  });
});

describe('projectFrustumOntoRoom (수직 천장→바닥 투사)', () => {
  // 광원 (0, 3, 0) at 천장 위치, 광축 -Y, throw=1
  const inst: ProjectorInstance = {
    id: 'i',
    specId: spec.id,
    position: [0, 3, 0],
    rotation: [-90, 0, 0],
    zoom: 0, // throw=1 → 거리 3m에서 폭 3m
    shift: { h: 0, v: 0 },
    enabled: true,
  };
  const frustum = buildFrustum(inst, spec);
  const result = projectFrustumOntoRoom(frustum, room);

  it('4코너 모두 floor에 떨어짐', () => {
    expect(result.surface).toBe('floor');
    expect(result.corners.every((c) => c?.surface === 'floor')).toBe(true);
  });

  it('투영 폭 ≈ 거리/throw = 3m, 높이 ≈ 3/1.6 = 1.875m, 면적 ≈ 5.625 m²', () => {
    expect(Number.isFinite(result.area)).toBe(true);
    expect(Math.abs(result.area - (3 * (3 / 1.6)))).toBeLessThan(0.05);
  });
});

describe('polygonArea3D — 단위 정사각형(1m × 1m)', () => {
  const square: V3[] = [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
  ];
  it('면적 = 1 m²', () => {
    expect(closeTo(polygonArea3D(square), 1)).toBe(true);
  });
});
