import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { useScenarioStore } from '../store/scenarioStore';
import { PROJECTOR_LIBRARY } from '../data/projectors';
import {
  buildFrustum,
  projectFrustumOntoRoom,
  type ProjectorFrustum,
  type V3,
} from '../physics/frustum';
import type { ProjectorInstance, ProjectorSpec, Room } from '../types/scenario';

const SELECTED = '#22c55e';     // emerald-500
const UNSELECTED = '#facc15';   // yellow-400

/**
 * 모든 프로젝터를 렌더 — 프로젝터 본체 mesh + frustum 라인 + 면 위 투영 다각형.
 */
export default function Projectors() {
  const projectors = useScenarioStore((s) => s.projectors);
  const customSpecs = useScenarioStore((s) => s.customSpecs);
  const room = useScenarioStore((s) => s.room);
  const selectedId = useScenarioStore((s) => s.selectedProjectorId);
  const selectProjector = useScenarioStore((s) => s.selectProjector);

  return (
    <group>
      {projectors.map((p) => {
        if (!p.enabled) return null;
        const spec =
          customSpecs.find((c) => c.id === p.specId) ||
          PROJECTOR_LIBRARY.find((c) => c.id === p.specId);
        if (!spec) return null;
        return (
          <ProjectorRender
            key={p.id}
            inst={p}
            spec={spec}
            room={room}
            selected={p.id === selectedId}
            onSelect={() => selectProjector(p.id)}
          />
        );
      })}
    </group>
  );
}

function ProjectorRender({
  inst,
  spec,
  room,
  selected,
  onSelect,
}: {
  inst: ProjectorInstance;
  spec: ProjectorSpec;
  room: Room;
  selected: boolean;
  onSelect: () => void;
}) {
  const frustum = useMemo(() => buildFrustum(inst, spec), [inst, spec]);
  const projection = useMemo(() => projectFrustumOntoRoom(frustum, room), [frustum, room]);
  const color = selected ? SELECTED : UNSELECTED;

  return (
    <group>
      {/* 프로젝터 본체: 작은 박스 + 광축 표시 */}
      <ProjectorBody inst={inst} color={color} onSelect={onSelect} />

      {/* Frustum 라인: 4개 코너 광선이 면에 닿는 점까지 */}
      <FrustumLines frustum={frustum} projection={projection} color={color} />

      {/* 면 위 투영 사각형 (4 코너가 같은 면에 떨어진 경우만) */}
      {projection.surface && projection.corners.every((c) => c !== null) && (
        <ProjectionPolygon
          corners={projection.corners.map((c) => c!.point) as [V3, V3, V3, V3]}
          color={color}
        />
      )}
    </group>
  );
}

function ProjectorBody({
  inst,
  color,
  onSelect,
}: {
  inst: ProjectorInstance;
  color: string;
  onSelect: () => void;
}) {
  // rotation은 도(deg) → three.js Euler(rad)로
  const rad = (d: number) => (d * Math.PI) / 180;
  const [px, py, pz] = inst.position;
  const [rx, ry, rz] = inst.rotation;

  return (
    <group position={[px, py, pz]} rotation={[rad(rx), rad(ry), rad(rz)]}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <boxGeometry args={[0.3, 0.18, 0.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* 광축 화살표 (로컬 -Z 방향) */}
      <mesh position={[0, 0, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.05, 0.12, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function FrustumLines({
  frustum,
  projection,
  color,
}: {
  frustum: ProjectorFrustum;
  projection: ReturnType<typeof projectFrustumOntoRoom>;
  color: string;
}) {
  const points = useMemo(() => {
    const segs: V3[][] = [];
    // 4개 코너 광선
    projection.corners.forEach((corner, i) => {
      // 면에 닿으면 닿은 지점까지, 못 닿으면 unit distance 두 배 정도까지 표시
      let end: V3;
      if (corner) {
        end = corner.point;
      } else {
        const dir = frustum.cornerDirs[i];
        end = [
          frustum.origin[0] + dir[0] * 5,
          frustum.origin[1] + dir[1] * 5,
          frustum.origin[2] + dir[2] * 5,
        ];
      }
      segs.push([frustum.origin, end]);
    });

    // 면 위 사각형 외곽선 (4코너가 모두 같은 면일 때만)
    if (projection.surface && projection.corners.every((c) => c !== null)) {
      const pts = projection.corners.map((c) => c!.point) as V3[];
      segs.push([pts[0], pts[1]]);
      segs.push([pts[1], pts[2]]);
      segs.push([pts[2], pts[3]]);
      segs.push([pts[3], pts[0]]);
    }
    return segs;
  }, [frustum, projection]);

  return (
    <>
      {points.map((seg, i) => (
        <Line key={i} points={seg} color={color} lineWidth={1.2} transparent opacity={0.85} />
      ))}
    </>
  );
}

function ProjectionPolygon({
  corners,
  color,
}: {
  corners: [V3, V3, V3, V3];
  color: string;
}) {
  // 4코너로 사각형 메쉬 — 두 삼각형으로 분해
  const positions = useMemo(() => {
    const a = corners[0];
    const b = corners[1];
    const c = corners[2];
    const d = corners[3];
    return new Float32Array([
      a[0], a[1], a[2],
      b[0], b[1], b[2],
      c[0], c[1], c[2],
      a[0], a[1], a[2],
      c[0], c[1], c[2],
      d[0], d[1], d[2],
    ]);
  }, [corners]);

  return (
    <mesh>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
        />
      </bufferGeometry>
      <meshBasicMaterial color={color} transparent opacity={0.25} side={2 /* DoubleSide */} />
    </mesh>
  );
}
