import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { useScenarioStore } from '../store/scenarioStore';
import { PROJECTOR_LIBRARY } from '../data/projectors';
import {
  buildFrustum,
  projectFrustumOntoRoom,
  sampleFrustumQuads,
  type ProjectorFrustum,
  type SurfaceQuadGroup,
  type V3,
} from '../physics/frustum';
import type { ProjectorInstance, ProjectorSpec, Room } from '../types/scenario';

const PALETTE = [
  '#22c55e', '#facc15', '#3b82f6', '#ec4899', '#f97316', '#06b6d4', '#a855f7', '#ef4444',
];
const SELECTED_RING = '#ffffff';

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
  const quadGroups = useMemo(() => sampleFrustumQuads(frustum, room, 16), [frustum, room]);

  return (
    <group>
      <ProjectorBody inst={inst} color={color} selected={selected} onSelect={onSelect} />
      <FrustumLines frustum={frustum} projection={projection} color={color} />

      {quadGroups.map((g) => (
        <SurfaceQuadFill key={g.surface} group={g} color={color} />
      ))}

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
      <mesh onClick={(e) => { e.stopPropagation(); onSelect(); }}>
        <boxGeometry args={[0.3, 0.18, 0.4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 0.4 : 0.15} />
      </mesh>
      <mesh position={[0, 0, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.05, 0.12, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
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
    return out;
  }, [frustum, projection]);

  return (
    <>
      {segs.map((seg, i) => (
        <Line key={i} points={seg} color={color} lineWidth={1.2} transparent opacity={0.6} />
      ))}
    </>
  );
}

function CornerMarker({ point, color }: { point: V3; color: string }) {
  return (
    <mesh position={point}>
      <sphereGeometry args={[0.05, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

/**
 * 면별 quad 그룹 → 두 삼각형씩 잘게 쪼개어 mesh.
 * fan triangulation이 비-convex에서 깨지는 문제를 회피.
 * 면 normal로 0.005m 띄움.
 */
function SurfaceQuadFill({ group, color }: { group: SurfaceQuadGroup; color: string }) {
  const positions = useMemo(() => {
    const eps = 0.005;
    const ofs = (p: V3): V3 => [
      p[0] + group.normal[0] * eps,
      p[1] + group.normal[1] * eps,
      p[2] + group.normal[2] * eps,
    ];
    const arr: number[] = [];
    for (const q of group.quads) {
      const a = ofs(q[0]);
      const b = ofs(q[1]);
      const c = ofs(q[2]);
      const d = ofs(q[3]);
      arr.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      arr.push(a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]);
    }
    return new Float32Array(arr);
  }, [group]);

  if (positions.length === 0) return null;
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
      />
    </mesh>
  );
}
