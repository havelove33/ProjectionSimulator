import { useState } from 'react';
import { useScenarioStore, useSelectedProjector } from '../store/scenarioStore';
import { PROJECTOR_LIBRARY } from '../data/projectors';
import { effectiveThrowRatio } from '../physics/frustum';
import { NumberField, SliderField, Section } from './fields';
import { ManualSpecForm, ThrowFromDistance } from './ManualSpecForm';
import { DEFAULTS } from '../types/scenario';

const INSTANCE_PALETTE = [
  '#22c55e', '#facc15', '#3b82f6', '#ec4899', '#f97316', '#06b6d4', '#a855f7', '#ef4444',
];

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
            atCap ? 'cursor-not-allowed bg-neutral-700' : 'bg-emerald-600 hover:bg-emerald-500'
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
        {projectors.map((p, idx) => {
          const s = customSpecs.find((c) => c.id === p.specId);
          const selected = p.id === selectedId;
          const color = INSTANCE_PALETTE[idx % INSTANCE_PALETTE.length];
          return (
            <li
              key={p.id}
              className={`flex items-center gap-2 rounded px-2 py-1 text-xs ${
                selected ? 'bg-neutral-800 ring-1 ring-neutral-500' : 'hover:bg-neutral-800'
              }`}
            >
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
                title="3D 뷰의 이 프로젝터 색상"
              />
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
          <label className="flex flex-col gap-1">
            <span className="text-xs text-neutral-400">별명 (Display Name)</span>
            <input
              className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-100 outline-none focus:border-neutral-500"
              value={instance.displayName}
              onChange={(e) => updateProjector(instance.id, { displayName: e.target.value })}
              placeholder="예: 바닥-1, 정면 메인"
            />
          </label>

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
                <label className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-neutral-400">등급</span>
                  <input
                    className="w-full min-w-0 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-100"
                    value={spec.resolutionLabel ?? ''}
                    placeholder="WUXGA"
                    onChange={(e) => updateSpec(spec.id, { resolutionLabel: e.target.value })}
                  />
                </label>
              </div>

              <div className="text-[11px] text-neutral-500">
                aspect = {spec.aspect.toFixed(2)} (해상도로부터 자동)
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

              <ThrowFromDistance
                aspect={spec.aspect}
                onApply={(t, isRange) => {
                  if (isRange) {
                    updateSpec(spec.id, { throwRatio: { min: t, max: spec.throwRatio.max } });
                  } else {
                    updateSpec(spec.id, { throwRatio: { min: t, max: t } });
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
