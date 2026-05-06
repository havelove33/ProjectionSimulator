import { useScenarioStore } from '../store/scenarioStore';

/**
 * PRD §8 우측 결과 패널 — M0 단계: 빈 상태/안내만 표시.
 * 광도 통계/차폐/히트맵 토글은 M2 이후 활성화.
 */
export default function RightPanel() {
  const room = useScenarioStore((s) => s.room);
  const projectors = useScenarioStore((s) => s.projectors);
  const people = useScenarioStore((s) => s.people);

  const floorArea = room.size.w * room.size.d;

  return (
    <div className="flex flex-col gap-4 p-4 text-sm">
      <section className="rounded border border-neutral-800 bg-neutral-900/50 p-3">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          현재 시나리오
        </h2>
        <ul className="space-y-1 text-neutral-300">
          <li>
            룸: <span className="text-neutral-100">{room.size.w} × {room.size.d} × {room.size.h} m</span>
          </li>
          <li>
            바닥 면적: <span className="text-neutral-100">{floorArea.toFixed(2)} m²</span>
          </li>
          <li>
            프로젝터: <span className="text-neutral-100">{projectors.length}대</span>
          </li>
          <li>
            관객: <span className="text-neutral-100">{people.length}명</span>
          </li>
        </ul>
      </section>

      <section className="rounded border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-neutral-500">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          밝기 통계
        </h2>
        M2(광도학 계산 코어)에서 활성화됩니다.
      </section>

      <section className="rounded border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-neutral-500">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          차폐 통계
        </h2>
        M6(관객 + 그림자)에서 활성화됩니다.
      </section>
    </div>
  );
}
