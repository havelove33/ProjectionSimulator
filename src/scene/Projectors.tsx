import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { useScenarioStore } from '../store/scenarioStore';
import { PROJECTOR_LIBRARY } from '../data/projectors';
import {
  buildFrustum,
  projectFrustumOntoRoom,
  roomPlanes,
  type ProjectorFrustum,
  type V3,
} from '../physics/frustum';
import type { ProjectorInstance, ProjectorSpec, Room, SurfaceId } from '../types/scenario';

/** 프로젝터별 색상 팔레트 — 추가 순서대로 순환 (5대 cap이라 wrap-around는 거의 안 일어남). */
const PALETTE = [
  '#22c55e', // emerald
  '#facc15', // yellow
  '#3b82f6', // blue
  '#ec4899', // pink
  '#f97316', // orange
  '#06b6d4', // cyan
  '#a855f7', // purple
  '#ef4444', // red
];
const SELECTED_RING = '#ffffff';

/**
 * 프로젝터 N대 렌더 — 본체 + 광축 + frustum 라인 + 면 위 투영 다각형 + 코너 마커.
 * - 인스턴스마다 PALETTE 색상으로 구분
 * - 4코너가 모두 같은 면에 떨어진 경우에만 fill mesh를 그리고, 그 면 normal 방향으로 0.005m 오프셋해 면에 정확히 부착
 */
export default function Projectors() {
  const projectors = useScenarioStore((s) => s.projectors);
  const customSpecs = useScenarioStore((s) => s.customSpecs);
  const room = useScenarioStore((s) => s.room);
  const selectedId = useScenarioStore((s) => s.selectedProjectorId);
  const selectProjector = useScenarioStore((s) => s.selectProjector);

  return (
    <group>
      {projectors.map((p, idx) => {
        if (!p.enabled) return null;
        const spec =
          customSpecs.find((c) => c.id === p.specId) ||
          PROJECTOR_LIBRARY.find((c) => c.id === p.specId);
        if (!spec) return null;
        const color = PALETTE[idx % PALETTE.length];
        return (
          <ProjectorRender
            key={p.id}
            inst={p}
            spec={spec}
            room={room}
            color={color}
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
  color,
  selected,
  onSelect,
}: {
  inst: ProjectorInstance;
  spec: ProjectorSpec;
  room: Room;
  color: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const frustum = useMemo(() => buildFrustum(inst, spec), [inst, spec]);
  const projection = useMemo(() => projectFrustumOntoRoom(frustum, room), [frustum, room]);

  // 4 corner가 모두 같은 면(dominant surface) 위에 있을 때만 fill 그림 → 면에 정확히 부착됨
  const allSameSurface =
    projection.surface !== null &&
    projection.corners.every((c) => c?.surface === projection.surface);

  const surfaceNormal: V3 | null = useMemo(() => {
    if (!projection.surface) return null;
    const plane = roomPlanes(room).find((p) => p.id === projection.surface);
    return plane ? plane.normal : null;
  }, [projection.surface, room]);

  const filledCorners =
    allSameSurface && projection.corners.every((c) => c !== null)
      ? (projection.corners.map((c) => c!.point) as [V3, V3, V3, V3])
      : null;

  return (
    <group>
      <ProjectorBody inst={inst} color={color} selected={selected} onSelect={onSelect} />
      <FrustumLines frustum={frustum} projection={projection} color={color} />

      {filledCorners && surfaceNormal && (
        <ProjectionFill
          corners={filledCorners}
          color={color}
          normal={surfaceNormal}
        />
      )}

      {projection.corners.map((c, i) =>
        c ? <CornerMarker key={i} point={c.point} color={color} /> : null,
      )}
    </group>
  );
}

function ProjectorBody({
  inst,
  color,
  selected,
  onSelect,
}: {
  inst: ProjectorInstance;
  color: string;
  selected: boolean;
  onSelect: () => void;
}) {
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
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 0.4 : 0.15} />
      </mesh>
      {/* 광축 화살표 */}
      <mesh position={[0, 0, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.05, 0.12, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* 선택 시 외곽 ring */}
      {selected && (
        <mesh>
          <boxGeometry args={[0.34, 0.22, 0.44]} />
          <meshBasicMaterial color={SELECTED_RING} wireframe transparent opacity={0.85} />
        </mesh>
      )}
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
  const segs = useMemo(() => {
    const out: V3[][] = [];
    projection.corners.forEach((corner, i) => {
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
      out.push([frustum.origin, end]);
    });
    if (projection.corners.every((c) => c !== null)) {
      const pts = projection.corners.map((c) => c!.point) as V3[];
      out.push([pts[0], pts[1]]);
      out.push([pts[1], pts[2]]);
      out.push([pts[2], pts[3]]);
      out.push([pts[3], pts[0]]);
    }
    return out;
  }, [frustum, projection]);

  return (
    <>
      {segs.map((seg, i) => (
        <Line key={i} points={seg} color={color} lineWidth={1.4} transparent opacity={0.9} />
      ))}
    </>
  );
}

function CornerMarker({ point, color }: { point: V3; color: string }) {
  return (
    <mesh position={point}>
      <sphereGeometry args={[0.06, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

/**
 * 4 corner가 모두 같은 면 위에 있을 때 그 면에 딱 붙는 사각형 mesh.
 * 면 normal 방향으로 epsilon만큼 띄워 z-fighting 방지하면서 시각적으로는 면에 부착된 것처럼 보임.
 */
function ProjectionFill({
  corners,
  color,
  normal,
}: {
  corners: [V3, V3, V3, V3];
  color: string;
  normal: V3;
}) {
  const positions = useMemo(() => {
    const eps = 0.005;
    const offset = (p: V3): V3 => [
      p[0] + normal[0] * eps,
      p[1] + normal[1] * eps,
      p[2] + normal[2] * eps,
    ];
    const a = offset(corners[0]);
    const b = offset(corners[1]);
    const c = offset(corners[2]);
    const d = offset(corners[3]);
    return new Float32Array([
      a[0], a[1], a[2],
      b[0], b[1], b[2],
      c[0], c[1], c[2],
      a[0], a[1], a[2],
      c[0], c[1], c[2],
      d[0], d[1], d[2],
    ]);
  }, [corners, normal]);

  return (
    <mesh>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
        />
      </bufferGeometry>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.6}
        side={2 /* DoubleSide */}
        depthWrite={false}
      />
    </mesh>
  );
}

// SurfaceId는 import만 하고 직접 사용하지는 않지만 Room 타입에서 참조
export type { SurfaceId };
