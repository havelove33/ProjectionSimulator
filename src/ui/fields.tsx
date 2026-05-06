/**
 * 좌측 패널에서 재사용하는 작은 입력 컴포넌트들.
 * - 모든 입력은 grid 안에서도 폭이 늘어나지 않도록 min-w-0 + w-full 적용.
 */

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="truncate text-xs text-neutral-400">
        {label}
        {suffix ? <span className="ml-1 text-neutral-500">({suffix})</span> : null}
      </span>
      <input
        type="number"
        className="w-full min-w-0 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-100 outline-none focus:border-neutral-500"
        value={Number.isFinite(value) ? value : 0}
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

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.01,
  formatValue,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  formatValue?: (v: number) => string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-neutral-400">{label}</span>
        <span className="shrink-0 text-neutral-200 tabular-nums">
          {formatValue ? formatValue(value) : value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        className="w-full accent-emerald-500"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function Section({
  title,
  children,
  placeholder = false,
  right,
}: {
  title: string;
  children: React.ReactNode;
  placeholder?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded border border-neutral-800 bg-neutral-900/50 p-3">
      <header className="mb-2 flex items-center justify-between gap-2">
        <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-neutral-400">
          {title}
        </h2>
        {right}
      </header>
      <div className={placeholder ? 'text-xs text-neutral-500' : ''}>{children}</div>
    </section>
  );
}

/** 표시용 소수 자릿수 헬퍼 — 저장값은 그대로지만 UI에 반영 시 소수점 N자리로 반올림. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
