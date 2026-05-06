import { useState } from 'react';
import { useScenarioStore, useSelectedProjector } from '../store/scenarioStore';
import { PROJECTOR_LIBRARY } from '../data/projectors';
import { effectiveThrowRatio } from '../physics/frustum';
import { throwRatioFromDistance } from '../physics/throwUtils';
import { NumberField, SliderField, Section } from './fields';
import { DEFAULTS } from '../types/scenario';
import type { ProjectorSpec } from '../types/scenario';

/**
 * 좌측 패널의 "프로젝터" 섹션 — M1+:
 *  - 라이브러리에서 추가 / 직접 입력으로 추가 (탭 전환)
 *  - 5대 cap, 별명 편집, 인스턴스별 사양 편집
 *  - "100인치 거리 X m" 입력으로 throw ratio 자동 환산
 */
export default function ProjectorPanel() {
  const projectors = useScenarioStore((s) => s.projectors);
  const customSpecs = useScenarioStore((s) => s.customSpecs);
  const addProjector = useScenarioStore((s) => s.addProjector);
  const removeProjector = useScenarioStore((s) => s.removeProjector);
  const updateProjector = useScenarioStore((s) => s.updateProjector);
  const updateSpec = useScenarioStore((s) => s.updateSpec);
  const selectProjector = useScenarioStore((s) => s.selectProjector);
  const selectedId = useScenarioStore((s) => s.selectedProjectorId);
  const { instance, spec } = useSelectedProjector();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'library' | 'manual'>('library');
  const atCap = projectors.length >= DEFAULTS.maxProjectors;

  return (
    <Section
      title={`프로젝터 (${projectors.length}/${DEFAULTS.maxProjectors})`}
      right={
        <button
          disabled={atCap}
          className={`rounded px-2 py-0.5 text-xs font-medium text-white ${
            atCap
              ? 'cursor-not-allowed bg-neutral-700'
              : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
          onClick={() => setPickerOpen((v) => !v)}
        >
          + 추가
        </button>
      }
    >
      {atCap && (
        <div className="mb-2 rounded border border-amber-700/50 bg-amber-950/40 p-2 text-xs text-amber-300">
          최대 5대까지 추가할 수 있습니다.
        </div>
      )}

      {pickerOpen && !atCap && (
        <div className="mb-2 rounded border border-neutral-700 bg-neutral-950 p-2">
          <div className="mb-2 flex gap-1 text-xs">
            <button
              className={`flex-1 rounded px-2 py-1 ${
                pickerMode === 'library'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
              onClick={() => setPickerMode('library')}
            >
              라이브러리
            </button>
            <button
              className={`flex-1 rounded px-2 py-1 ${
                pickerMode === 'manual'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
              onClick={() => setPickerMode('manual')}
            >
              직접 입력
            </button>
          </div>

          {pickerMode === 'library' && (
            <ul className="space-y-1">
              {PROJECTOR_LIBRARY.map((s) => (
                <li key={s.id}>
                  <button
                    className="w-full rounded px-2 py-1 text-left text-xs hover:bg-neutral-800"
                    onClick={() => {
                      addProjector(s);
                      setPickerOpen(false);
                    }}
                  >
                    <div className="text-neutral-200">{s.model}</div>
                    <div className="text-neutral-500">
                      {s.ansiLumen.toLocaleString()} lm · {s.resolution[0]}×{s.resolution[1]} ·
                      throw {s.throwRatio.min}–{s.throwRatio.max}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {pickerMode === 'manual' && (
            <ManualSpecForm
              onCreate={(s) => {
                addProjector(s);
                setPickerOpen(false);
              }}
            />
          )}
        </div>
      )}

      {projectors.length === 0 && !pickerOpen && (
        <div className="text-xs text-neutral-500">아직 프로젝터가 없습니다. + 추가를 누르세요.</div>
      )}

      <ul className="space-y-1">
        {projectors.map((p) => {
          const s = customSpecs.find((c) => c.id === p.specId);
          const selected = p.id === selectedId;
          return (
            <li
              key={p.id}
              className={`flex items-center gap-2 rounded px-2 py-1 text-xs ${
                selected ? 'bg-emerald-900/40 ring-1 ring-emerald-700' : 'hover:bg-neutral-800'
              }`}
            >
              <input
                type="checkbox"
                checked={p.enabled}
                onChange={(e) => updateProjector(p.id, { enabled: e.target.checked })}
                className="accent-emerald-500"
              />
              <button className="flex-1 truncate text-left" onClick={() => selectProjector(p.id)}>
                <div className="text-neutral-100">{p.displayName}</div>
                <div className="text-[10px] text-neutral-500">{s?.model ?? p.specId}</div>
              </button>
              <button
                className="text-neutral-500 hover:text-red-400"
                title="삭제"
                onClick={() => removeProjector(p.id)}
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>

      {instance && spec && (
        <div className="mt-3 space-y-3 border-t border-neutral-800 pt-3">
          {/* 별명 */}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-neutral-400">별명 (Display Name)</span>
            <input
              className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-100 outline-none focus:border-neutral-500"
              value={instance.displayName}
              onChange={(e) => updateProjector(instance.id, { displayName: e.target.value })}
              placeholder="예: 바닥-1, 정면 메인"
            />
          </label>

          {/* 사양 편집 */}
          <details className="rounded border border-neutral-800 bg-neutral-950/50 p-2" open>
            <summary className="cursor-pointer text-xs font-medium text-neutral-300">
              사양 편집
            </summary>
            <div className="mt-2 space-y-2 text-xs">
              <label className="flex flex-col gap-1">
                <span className="text-neutral-400">모델명</span>
                <input
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-100"
                  value={spec.model}
                  onChange={(e) => updateSpec(spec.id, { model: e.target.value })}
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="ANSI 루멘"
                  value={spec.ansiLumen}
                  onChange={(v) => updateSpec(spec.id, { ansiLumen: v })}
                  step={100}
                  suffix="lm"
                />
                <NumberField
                  label="명암비"
                  value={spec.contrast ?? 0}
                  onChange={(v) => updateSpec(spec.id, { contrast: v })}
                  step={1000}
                  suffix=":1"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <NumberField
                  label="해상도 W"
                  value={spec.resolution[0]}
                  onChange={(v) =>
                    updateSpec(spec.id, {
                      resolution: [v, spec.resolution[1]],
                      aspect: v / spec.resolution[1],
                    })
                  }
                  step={1}
                />
                <NumberField
                  label="해상도 H"
                  value={spec.resolution[1]}
                  onChange={(v) =>
                    updateSpec(spec.id, {
                      resolution: [spec.resolution[0], v],
                      aspect: spec.resolution[0] / v,
                    })
                  }
                  step={1}
                />
                <label className="flex flex-col gap-1">
                  <span className="text-neutral-400">등급</span>
                  <input
                    className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-100"
                    value={spec.resolutionLabel ?? ''}
                    placeholder="WUXGA"
                    onChange={(e) => updateSpec(spec.id, { resolutionLabel: e.target.value })}
                  />
                </label>
              </div>

              <div className="text-[11px] text-neutral-500">
                종횡비(aspect) = {spec.aspect.toFixed(3)} (해상도로부터 자동)
              </div>

              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="Throw min"
                  value={spec.throwRatio.min}
                  onChange={(v) =>
                    updateSpec(spec.id, { throwRatio: { ...spec.throwRatio, min: v } })
                  }
                  step={0.05}
                />
                <NumberField
                  label="Throw max"
                  value={spec.throwRatio.max}
                  onChange={(v) =>
                    updateSpec(spec.id, { throwRatio: { ...spec.throwRatio, max: v } })
                  }
                  step={0.05}
                />
              </div>

              {/* 거리 → throw 환산 헬퍼 */}
              <ThrowFromDistance
                aspect={spec.aspect}
                onApply={(throwRatio, isRange) => {
                  if (isRange) {
                    updateSpec(spec.id, {
                      throwRatio: { min: throwRatio, max: spec.throwRatio.max },
                    });
                  } else {
                    updateSpec(spec.id, {
                      throwRatio: { min: throwRatio, max: throwRatio },
                    });
                  }
                }}
              />

              <NumberField
                label="최대화면"
                value={spec.maxDiagonalInch ?? 0}
                onChange={(v) => updateSpec(spec.id, { maxDiagonalInch: v })}
                step={10}
                suffix="인치"
              />
            </div>
          </details>

          {/* 위치 / 회전 / 줌 / 시프트 */}
          <div className="space-y-2 rounded border border-neutral-800 bg-neutral-950/50 p-2">
            <div className="text-xs font-medium text-neutral-300">위치 / 회전</div>
            <div className="grid grid-cols-3 gap-1">
              <NumberField
                label="X"
                value={instance.position[0]}
                onChange={(v) =>
                  updateProjector(instance.id, {
                    position: [v, instance.position[1], instance.position[2]],
                  })
                }
                step={0.1}
                suffix="m"
              />
              <NumberField
                label="Y"
                value={instance.position[1]}
                onChange={(v) =>
                  updateProjector(instance.id, {
                    position: [instance.position[0], v, instance.position[2]],
                  })
                }
                step={0.1}
                suffix="m"
              />
              <NumberField
                label="Z"
                value={instance.position[2]}
                onChange={(v) =>
                  updateProjector(instance.id, {
                    position: [instance.position[0], instance.position[1], v],
                  })
                }
                step={0.1}
                suffix="m"
              />
            </div>
            <div className="grid grid-cols-3 gap-1">
              <NumberField
                label="Pitch"
                value={instance.rotation[0]}
                onChange={(v) =>
                  updateProjector(instance.id, {
                    rotation: [v, instance.rotation[1], instance.rotation[2]],
                  })
                }
                step={1}
                suffix="°"
              />
              <NumberField
                label="Yaw"
                value={instance.rotation[1]}
                onChange={(v) =>
                  updateProjector(instance.id, {
                    rotation: [instance.rotation[0], v, instance.rotation[2]],
                  })
                }
                step={1}
                suffix="°"
              />
              <NumberField
                label="Roll"
                value={instance.rotation[2]}
                onChange={(v) =>
                  updateProjector(instance.id, {
                    rotation: [instance.rotation[0], instance.rotation[1], v],
                  })
                }
                step={1}
                suffix="°"
              />
            </div>

            <SliderField
              label={`Zoom (현재 throw ${effectiveThrowRatio(spec, instance.zoom).toFixed(2)})`}
              value={instance.zoom}
              onChange={(v) => updateProjector(instance.id, { zoom: v })}
              min={0}
              max={1}
              formatValue={(v) =>
                `${effectiveThrowRatio(spec, v).toFixed(2)} (${(v * 100).toFixed(0)}%)`
              }
            />
            <SliderField
              label="Lens shift H"
              value={instance.shift.h}
              onChange={(v) =>
                updateProjector(instance.id, { shift: { ...instance.shift, h: v } })
              }
              min={-50}
              max={50}
              step={1}
              formatValue={(v) => `${v.toFixed(0)}%`}
            />
            <SliderField
              label="Lens shift V"
              value={instance.shift.v}
              onChange={(v) =>
                updateProjector(instance.id, { shift: { ...instance.shift, v: v } })
              }
              min={-50}
              max={50}
              step={1}
              formatValue={(v) => `${v.toFixed(0)}%`}
            />
          </div>
        </div>
      )}
    </Section>
  );
}

/**
 * 카탈로그가 "100인치 화면 거리 2.9m" 형식으로 throw를 줄 때 빠르게 환산해주는 위젯.
 */
function ThrowFromDistance({
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
      <div className="flex items-end gap-1 text-xs">
        <div className="flex-1">
          <NumberField label="화면" value={diag} onChange={setDiag} step={10} suffix="인치" />
        </div>
        <div className="flex-1">
          <NumberField label="거리" value={dist} onChange={setDist} step={0.1} suffix="m" />
        </div>
      </div>
      <div className="mt-1 text-[11px] text-neutral-300">
        → throw ratio ≈ <span className="font-medium">{Number.isFinite(t) ? t.toFixed(3) : '—'}</span>
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
        onClick={() => onApply(t, applyAsRange)}
      >
        throw ratio에 적용
      </button>
    </div>
  );
}

/**
 * 직접 입력 폼 — 빈 spec을 만들고 추가.
 */
function ManualSpecForm({ onCreate }: { onCreate: (spec: ProjectorSpec) => void }) {
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
  const throwRatio = throwRatioFromDistance(diagInch, distM, aspect);

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
        <label className="flex flex-col gap-1">
          <span className="text-neutral-400">등급</span>
          <input
            className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-100"
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
            {Number.isFinite(throwRatio) ? throwRatio.toFixed(3) : '—'}
          </span>
          <span className="ml-2 text-neutral-500">aspect {aspect.toFixed(3)}</span>
        </div>
      </div>

      <button
        className="w-full rounded bg-emerald-600 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-neutral-700"
        disabled={!model || !Number.isFinite(throwRatio)}
        onClick={() => {
          const spec: ProjectorSpec = {
            id: 'manual-' + Date.now().toString(36),
            model: model || '사용자 정의',
            resolutionLabel: resLabel || undefined,
            ansiLumen: ansi,
            resolution: [resW, resH],
            aspect,
            throwRatio: { min: throwRatio, max: throwRatio },
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
