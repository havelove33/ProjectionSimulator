/**
 * 좌측 패널에서 재사용하는 작은 입력 컴포넌트들.
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
    <label className="flex flex-col gap-1">
      <span className="text-xs text-neutral-400">
        {label}
        {suffix ? <span className="ml-1 text-neutral-500">({suffix})</span> : null}
      </span>
      <input
        type="number"
        className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-100 outline-none focus:border-neutral-500"
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
    <label className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-400">{label}</span>
        <span className="text-neutral-200 tabular-nums">
          {formatValue ? formatValue(value) : value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        className="accent-emerald-500"
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
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{title}</h2>
        {right}
      </header>
      <div className={placeholder ? 'text-xs text-neutral-500' : ''}>{children}</div>
    </section>
  );
}
