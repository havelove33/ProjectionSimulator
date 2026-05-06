import { Edges } from '@react-three/drei';
import { useScenarioStore } from '../store/scenarioStore';
import { DoubleSide } from 'three';

/**
 * 룸 박스(직육면체) 시각화. 좌표계: 룸 중심 = 원점, +Y가 위(천장).
 * 활성된 면은 반투명 면으로, 모든 면의 모서리는 라인으로 표시.
 */
export default function Room() {
  const { size, surfaces } = useScenarioStore((s) => s.room);
  const w = size.w;
  const d = size.d;
  const h = size.h;

  // 박스 중심을 (0, h/2, 0)에 두어 바닥이 y=0이 되도록 함
  return (
    <group position={[0, h / 2, 0]}>
      {/* 와이어프레임 박스 */}
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshBasicMaterial visible={false} />
        <Edges color="#27272a" threshold={1} />
      </mesh>

      {/* 활성된 면을 반투명 패널로 표현 (M2에서 광도 히트맵으로 교체될 자리) */}
      {surfaces.floor.active && (
        <mesh position={[0, -h / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color="#52525b" side={DoubleSide} />
        </mesh>
      )}
      {surfaces.front.active && (
        <mesh position={[0, 0, -d / 2]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color="#52525b" side={DoubleSide} transparent opacity={0.85} />
        </mesh>
      )}
      {surfaces.back.active && (
        <mesh position={[0, 0, d / 2]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color="#52525b" side={DoubleSide} transparent opacity={0.85} />
        </mesh>
      )}
      {surfaces.left.active && (
        <mesh position={[-w / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[d, h]} />
          <meshStandardMaterial color="#52525b" side={DoubleSide} transparent opacity={0.85} />
        </mesh>
      )}
      {surfaces.right.active && (
        <mesh position={[w / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[d, h]} />
          <meshStandardMaterial color="#52525b" side={DoubleSide} transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  );
}
