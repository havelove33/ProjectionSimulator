import { useScenarioStore } from '../store/scenarioStore';
import type { SurfaceId } from '../types/scenario';
import { NumberField, Section } from './fields';
import ProjectorPanel from './ProjectorPanel';

/**
 * PRD §8 좌측 패널 — M1: 룸 + 프로젝터 활성화.
 * 스윗스팟/관객은 후속 마일스톤.
 */
export default function LeftPanel() {
  const room = useScenarioStore((s) => s.room);
  const setRoomSize = useScenarioStore((s) => s.setRoomSize);
  const setSurfaceActive = useScenarioStore((s) => s.setSurfaceActive);

  const surfaceList: { id: SurfaceId; label: string }[] = [
    { id: 'floor', label: '바닥' },
    { id: 'ceiling', label: '천장' },
    { id: 'front', label: '정면' },
    { id: 'back', label: '후면' },
    { id: 'left', label: '좌측' },
    { id: 'right', label: '우측' },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 text-sm">
      <Section title="공간(룸) 치수">
        <div className="grid grid-cols-3 gap-2">
          <NumberField
            label="가로"
            value={room.size.w}
            onChange={(v) => setRoomSize({ w: v })}
            suffix="m"
          />
          <NumberField
            label="세로"
            value={room.size.d}
            onChange={(v) => setRoomSize({ d: v })}
            suffix="m"
          />
          <NumberField
            label="높이"
            value={room.size.h}
            onChange={(v) => setRoomSize({ h: v })}
            suffix="m"
          />
        </div>

        <div className="mt-3">
          <div className="mb-1 text-xs text-neutral-400">활성 면</div>
          <div className="grid grid-cols-3 gap-1">
            {surfaceList.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-1 rounded border border-neutral-800 px-2 py-1 text-xs"
              >
                <input
                  type="checkbox"
                  checked={room.surfaces[s.id].active}
                  onChange={(e) => setSurfaceActive(s.id, e.target.checked)}
                  className="accent-emerald-500"
                />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
        </div>
      </Section>

      <ProjectorPanel />

      <Section title="뷰어 스윗스팟 (Off-axis)" placeholder>
        M5에서 활성화 — 스윗스팟 위치, 면별 view/proj 매트릭스 export
      </Section>

      <Section title="관객 (People)" placeholder>
        M6에서 활성화 — 기본 20명, 0–100명 슬라이더, 패턴 헬퍼
      </Section>
    </div>
  );
}
