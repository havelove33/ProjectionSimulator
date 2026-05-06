import {
  useScenarioStore,
  useGlobalScreenMaterialId,
} from '../store/scenarioStore';
import type { SurfaceId } from '../types/scenario';
import { SCREEN_MATERIALS } from '../data/screens';
import { NumberField, Section } from './fields';
import ProjectorPanel from './ProjectorPanel';

export default function LeftPanel() {
  const room = useScenarioStore((s) => s.room);
  const setRoomSize = useScenarioStore((s) => s.setRoomSize);
  const setSurfaceActive = useScenarioStore((s) => s.setSurfaceActive);
  const setAllSurfaceMaterial = useScenarioStore((s) => s.setAllSurfaceMaterial);
  const customGain = useScenarioStore((s) => s.customScreenGain);
  const setCustomGain = useScenarioStore((s) => s.setCustomScreenGain);
  const materialId = useGlobalScreenMaterialId();

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
          <NumberField label="가로" value={room.size.w} onChange={(v) => setRoomSize({ w: v })} suffix="m" />
          <NumberField label="세로" value={room.size.d} onChange={(v) => setRoomSize({ d: v })} suffix="m" />
          <NumberField label="높이" value={room.size.h} onChange={(v) => setRoomSize({ h: v })} suffix="m" />
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

      <Section title="스크린 재질 (모든 면 일괄)">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-400">프리셋</span>
          <select
            className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-100 outline-none focus:border-neutral-500"
            value={materialId}
            onChange={(e) => setAllSurfaceMaterial(e.target.value as typeof materialId)}
          >
            {SCREEN_MATERIALS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        {materialId === 'custom' && (
          <div className="mt-2">
            <NumberField
              label="사용자 정의 게인"
              value={customGain}
              onChange={setCustomGain}
              min={0}
              max={3}
              step={0.05}
            />
            <div className="mt-1 text-[11px] text-neutral-500">
              0.05–3.0 범위 권장. 무광 페인트는 0.6–0.95, 하이게인 스크린은 1.2–1.8.
            </div>
          </div>
        )}
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
