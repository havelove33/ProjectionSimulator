import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { useScenarioStore } from '../store/scenarioStore';
import Room from './Room';

/**
 * PRD §10.2 — R3F 메인 캔버스. M0에서는 룸 박스 + 그리드 + 조명만 표시.
 */
export default function Scene() {
  const room = useScenarioStore((s) => s.room);

  return (
    <Canvas
      shadows
      camera={{
        position: [room.size.w * 0.9, room.size.h * 1.4, room.size.d * 1.2],
        fov: 45,
      }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#e4e4e7']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={0.85} castShadow />

      <Room />

      <Grid
        args={[40, 40]}
        cellColor="#a1a1aa"
        sectionColor="#71717a"
        infiniteGrid
        fadeDistance={40}
        fadeStrength={2}
        position={[0, -0.001, 0]}
      />

      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
      </GizmoHelper>
    </Canvas>
  );
}
