import { useScenarioStore } from '../store/scenarioStore';

/**
 * PRD §8 좌측 패널 — M0 단계: 룸 치수 입력만 우선 동작.
 * 프로젝터/스윗스팟/관객 패널은 M1~M6에서 활성화.
 */
export default function LeftPanel() {
  const room = useScenarioStore((s) => s.room);
  const setRoomSize = useScenarioStore((s) => s.setRoomSize);

  return (
    <div className="flex flex-col gap-4 p-4 text-sm">
      <Section title="공간(룸) 치수">
        <div className="grid grid-cols-3 gap-2">
          <NumberField
            label="가로 (m)"
            value={room.size.w}
            onChange={(v) => setRoomSize({ w: v })}
          />
          <NumberField
            label="세로 (m)"
            value={room.size.d}
            onChange={(v) => setRoomSize({ d: v })}
          />
          <NumberField
            label="높이 (m)"
            value={room.size.h}
            onChange={(v) => setRoomSize({ h: v })}
          />
        </div>
      </Section>

      <Section title="프로젝터" placeholder>
        M1에서 활성화 — 프로젝터 추가, 사양 입력, 위치/회전/줌
      </Section>

      <Section title="뷰어 스윗스팟 (Off-axis)" placeholder>
        M5에서 활성화 — 스윗스팟 위치, 면별 view/proj 매트릭스 export
      </Section>

      <Section title="관객 (People)" placeholder>
        M6에서 활성화 — 기본 20명, 0–100명 슬라이더, 패턴 헬퍼
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
  placeholder = false,
}: {
  title: string;
  children: React.ReactNode;
  placeholder?: boolean;
}) {
  return (
    <section className="rounded border border-neutral-800 bg-neutral-900/50 p-3">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
        {title}
      </h2>
      <div className={placeholder ? 'text-xs text-neutral-500' : ''}>{children}</div>
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0.5,
  max = 50,
  step = 0.1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-neutral-400">{label}</span>
      <input
        type="number"
        className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-100 outline-none focus:border-neutral-500"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (!Number.isNaN(v)) onChange(v);
        }}
      />
    </label>
  );
}
