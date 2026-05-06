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
 * 모든 프로젝터를 렌더 — 본체 mesh + frustum 라인 + 면 위 투영 다각형 + 코너 마커.
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

  // 4 코너가 모두 면에 닿으면 그 점들을 polygon fan으로 채움.
  // 면이 다르더라도 시각적 가이드로 그린다 — 정확한 polygon clipping은 M2/3에서.
  const filledCorners =
    projection.corners.every((c) => c !== null)
      ? (projection.corners.map((c) => c!.point) as [V3, V3, V3, V3])
      : null;

  return (
    <group>
      <ProjectorBody inst={inst} color={color} onSelect={onSelect} />
      <FrustumLines frustum={frustum} projection={projection} color={color} />

      {filledCorners && <ProjectionFill corners={filledCorners} color={color} />}

      {/* 광선 끝 마커 */}
      {projection.corners.map((c, i) =>
        c ? <CornerMarker key={i} point={c.point} color={color} /> : null,
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
 * 4 코너로 만든 사각형(키스톤) 메쉬. 두 삼각형으로 분해.
 * - depthWrite=false / polygonOffset로 z-fighting 방지
 * - 면이 다르더라도 시각적 가이드를 그림(코너가 다른 면이면 휘어진 사각형이 됨)
 */
function ProjectionFill({
  corners,
  color,
}: {
  corners: [V3, V3, V3, V3];
  color: string;
}) {
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
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.55}
        side={2 /* DoubleSide */}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  );
}
