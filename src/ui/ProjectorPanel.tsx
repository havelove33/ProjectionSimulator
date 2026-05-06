import { useState } from 'react';
import { useScenarioStore, useSelectedProjector } from '../store/scenarioStore';
import { PROJECTOR_LIBRARY } from '../data/projectors';
import { effectiveThrowRatio } from '../physics/frustum';
import { NumberField, SliderField, Section } from './fields';
import type { ProjectorSpec } from '../types/scenario';

/**
 * 좌측 패널의 "프로젝터" 섹션 — M1.
 * 라이브러리에서 추가, 리스트, 선택된 항목의 위치/회전/줌/시프트.
 */
export default function ProjectorPanel() {
  const projectors = useScenarioStore((s) => s.projectors);
  const customSpecs = useScenarioStore((s) => s.customSpecs);
  const addProjector = useScenarioStore((s) => s.addProjector);
  const removeProjector = useScenarioStore((s) => s.removeProjector);
  const updateProjector = useScenarioStore((s) => s.updateProjector);
  const selectProjector = useScenarioStore((s) => s.selectProjector);
  const selectedId = useScenarioStore((s) => s.selectedProjectorId);
  const { instance, spec } = useSelectedProjector();

  const [pickerOpen, setPickerOpen] = useState(false);

  const allSpecs: ProjectorSpec[] = [
    ...PROJECTOR_LIBRARY,
    ...customSpecs.filter((s) => !PROJECTOR_LIBRARY.find((l) => l.id === s.id)),
  ];

  return (
    <Section
      title="프로젝터"
      right={
        <button
          className="rounded bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-emerald-500"
          onClick={() => setPickerOpen((v) => !v)}
        >
          + 추가
        </button>
      }
    >
      {pickerOpen && (
        <div className="mb-2 rounded border border-neutral-700 bg-neutral-950 p-2">
          <div className="mb-1 text-xs text-neutral-400">라이브러리에서 선택:</div>
          <ul className="space-y-1">
            {allSpecs.map((s) => (
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
                    {s.ansiLumen.toLocaleString()} lm · {s.resolution[0]}×{s.resolution[1]} · throw{' '}
                    {s.throwRatio.min}–{s.throwRatio.max}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {projectors.length === 0 && (
        <div className="text-xs text-neutral-500">아직 프로젝터가 없습니다. + 추가를 누르세요.</div>
      )}

      <ul className="space-y-1">
        {projectors.map((p) => {
          const s = customSpecs.find((c) => c.id === p.specId) || PROJECTOR_LIBRARY.find((c) => c.id === p.specId);
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
                {s?.model ?? p.specId}
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
        <div className="mt-3 space-y-2 border-t border-neutral-800 pt-3">
          <div className="text-xs text-neutral-500">
            {spec.model} · throw {effectiveThrowRatio(spec, instance.zoom).toFixed(2)} ·{' '}
            {spec.ansiLumen.toLocaleString()} lm
          </div>

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
                updateProjector(instance.id, { rotation: [v, instance.rotation[1], instance.rotation[2]] })
              }
              step={1}
              suffix="°"
            />
            <NumberField
              label="Yaw"
              value={instance.rotation[1]}
              onChange={(v) =>
                updateProjector(instance.id, { rotation: [instance.rotation[0], v, instance.rotation[2]] })
              }
              step={1}
              suffix="°"
            />
            <NumberField
              label="Roll"
              value={instance.rotation[2]}
              onChange={(v) =>
                updateProjector(instance.id, { rotation: [instance.rotation[0], instance.rotation[1], v] })
              }
              step={1}
              suffix="°"
            />
          </div>

          <SliderField
            label={`Zoom (throw ${spec.throwRatio.min}–${spec.throwRatio.max})`}
            value={instance.zoom}
            onChange={(v) => updateProjector(instance.id, { zoom: v })}
            min={0}
            max={1}
            formatValue={(v) => effectiveThrowRatio(spec, v).toFixed(2)}
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
      )}
    </Section>
  );
}
