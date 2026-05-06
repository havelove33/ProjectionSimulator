import { useState } from 'react';
import { throwRatioFromDistance } from '../physics/throwUtils';
import { NumberField, round2 } from './fields';
import type { ProjectorSpec } from '../types/scenario';

/**
 * 직접 입력 폼 — 빈 spec을 만들고 추가.
 * 카탈로그 표기 ("X인치 거리 Y m")로부터 throw ratio 자동 환산.
 */
export function ManualSpecForm({ onCreate }: { onCreate: (spec: ProjectorSpec) => void }) {
  const [model, setModel] = useState('');
  const [resW, setResW] = useState(1920);
  const [resH, setResH] = useState(1080);
  const [resLabel, setResLabel] = useState('FHD');
  const [ansi, setAnsi] = useState(5000);
  const [contrast, setContrast] = useState(100000);
  const [maxDiag, setMaxDiag] = useState(300);
  const [diagInch, setDiagInch] = useState(100);
  const [distM, setDistM] = useState(2.9);

  const aspect = resW / resH;
  const t = throwRatioFromDistance(diagInch, distM, aspect);

  return (
    <div className="space-y-2 text-xs">
      <label className="flex flex-col gap-1">
        <span className="text-neutral-400">모델명</span>
        <input
          className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-100"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="예: EH-TW7400"
        />
      </label>

      <div className="grid grid-cols-3 gap-1">
        <NumberField label="해상도 W" value={resW} onChange={setResW} step={1} />
        <NumberField label="해상도 H" value={resH} onChange={setResH} step={1} />
        <label className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-xs text-neutral-400">등급</span>
          <input
            className="w-full min-w-0 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-100"
            value={resLabel}
            onChange={(e) => setResLabel(e.target.value)}
            placeholder="WUXGA / FHD"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-1">
        <NumberField label="ANSI 루멘" value={ansi} onChange={setAnsi} step={100} suffix="lm" />
        <NumberField label="명암비" value={contrast} onChange={setContrast} step={1000} suffix=":1" />
      </div>
      <NumberField label="최대화면" value={maxDiag} onChange={setMaxDiag} step={10} suffix="인치" />

      <div className="rounded border border-neutral-800 bg-neutral-900/40 p-2">
        <div className="mb-1 text-[11px] text-neutral-400">
          throw 환산 — "X인치 거리 Y m"
        </div>
        <div className="grid grid-cols-2 gap-1">
          <NumberField label="화면" value={diagInch} onChange={setDiagInch} step={10} suffix="인치" />
          <NumberField label="거리" value={distM} onChange={setDistM} step={0.1} suffix="m" />
        </div>
        <div className="mt-1 text-[11px] text-neutral-300">
          → throw ratio ≈{' '}
          <span className="font-medium">
            {Number.isFinite(t) ? t.toFixed(2) : '—'}
          </span>
          <span className="ml-2 text-neutral-500">aspect {aspect.toFixed(2)}</span>
        </div>
      </div>

      <button
        className="w-full rounded bg-emerald-600 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-neutral-700"
        disabled={!model || !Number.isFinite(t)}
        onClick={() => {
          const tr = round2(t);
          const spec: ProjectorSpec = {
            id: 'manual-' + Date.now().toString(36),
            model: model || '사용자 정의',
            resolutionLabel: resLabel || undefined,
            ansiLumen: ansi,
            resolution: [resW, resH],
            aspect: round2(aspect),
            throwRatio: { min: tr, max: tr },
            contrast: contrast || undefined,
            maxDiagonalInch: maxDiag || undefined,
          };
          onCreate(spec);
        }}
      >
        추가
      </button>
    </div>
  );
}

/**
 * 사양 편집 안에서 카탈로그 거리를 throw로 환산해주는 작은 위젯.
 */
export function ThrowFromDistance({
  aspect,
  onApply,
}: {
  aspect: number;
  onApply: (throwRatio: number, isRange: boolean) => void;
}) {
  const [diag, setDiag] = useState(100);
  const [dist, setDist] = useState(2.9);
  const [applyAsRange, setApplyAsRange] = useState(false);
  const t = throwRatioFromDistance(diag, dist, aspect);

  return (
    <div className="rounded border border-neutral-800 bg-neutral-900/40 p-2">
      <div className="mb-1 text-[11px] text-neutral-400">
        거리→throw 환산 (카탈로그 "X인치 거리 Y m")
      </div>
      <div className="grid grid-cols-2 gap-1">
        <NumberField label="화면" value={diag} onChange={setDiag} step={10} suffix="인치" />
        <NumberField label="거리" value={dist} onChange={setDist} step={0.1} suffix="m" />
      </div>
      <div className="mt-1 text-[11px] text-neutral-300">
        → throw ratio ≈ <span className="font-medium">{Number.isFinite(t) ? t.toFixed(2) : '—'}</span>
      </div>
      <label className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400">
        <input
          type="checkbox"
          checked={applyAsRange}
          onChange={(e) => setApplyAsRange(e.target.checked)}
          className="accent-emerald-500"
        />
        min만 갱신 (max는 유지)
      </label>
      <button
        className="mt-1 w-full rounded bg-emerald-700 py-1 text-xs text-white hover:bg-emerald-600"
        disabled={!Number.isFinite(t)}
        onClick={() => onApply(round2(t), applyAsRange)}
      >
        throw ratio에 적용
      </button>
    </div>
  );
}
