import { useMemo } from 'react';
import { useScenarioStore, useSelectedProjector } from '../store/scenarioStore';
import { buildFrustum, projectFrustumOntoRoom } from '../physics/frustum';
import { averageIlluminance, illuminanceToLuminance } from '../physics/illuminance';
import { SCREEN_MATERIALS } from '../data/screens';
import { Section } from './fields';

const SURFACE_LABEL: Record<string, string> = {
  floor: '바닥',
  ceiling: '천장',
  front: '정면',
  back: '후면',
  left: '좌측',
  right: '우측',
};

/**
 * PRD §8 우측 결과 패널 — M1.
 * 선택된 프로젝터의 throw, 투영 면적, 평균 lux/nit 미리보기.
 * 다중 프로젝터 합산/히트맵/차폐는 M2 이후.
 */
export default function RightPanel() {
  const room = useScenarioStore((s) => s.room);
  const projectors = useScenarioStore((s) => s.projectors);
  const people = useScenarioStore((s) => s.people);
  const { instance, spec } = useSelectedProjector();

  const projection = useMemo(() => {
    if (!instance || !spec) return null;
    const frustum = buildFrustum(instance, spec);
    return projectFrustumOntoRoom(frustum, room);
  }, [instance, spec, room]);

  const stats = useMemo(() => {
    if (!instance || !spec || !projection) return null;
    const area = Number.isFinite(projection.area) ? projection.area : NaN;
    const E_avg = Number.isFinite(area) ? averageIlluminance(spec.ansiLumen, area) : NaN;
    const surfaceMatId = projection.surface ? room.surfaces[projection.surface].material : 'white-matte';
    const mat = SCREEN_MATERIALS.find((m) => m.id === surfaceMatId) ?? SCREEN_MATERIALS[0];
    const L_avg = Number.isFinite(E_avg) ? illuminanceToLuminance(E_avg, mat.gain) : NaN;
    return { area, E_avg, L_avg, gain: mat.gain, materialName: mat.name };
  }, [instance, spec, projection, room.surfaces]);

  const floorArea = room.size.w * room.size.d;

  return (
    <div className="flex flex-col gap-4 p-4 text-sm">
      <Section title="현재 시나리오">
        <ul className="space-y-1 text-neutral-300">
          <li>
            룸: <span className="text-neutral-100">{room.size.w} × {room.size.d} × {room.size.h} m</span>
          </li>
          <li>
            바닥 면적: <span className="text-neutral-100">{floorArea.toFixed(2)} m²</span>
          </li>
          <li>
            프로젝터: <span className="text-neutral-100">{projectors.length}대</span> (활성{' '}
            {projectors.filter((p) => p.enabled).length})
          </li>
          <li>
            관객: <span className="text-neutral-100">{people.length}명</span>
          </li>
        </ul>
      </Section>

      <Section title="선택된 프로젝터 — 단일 광선 미리보기">
        {!instance && <div className="text-xs text-neutral-500">프로젝터를 선택하면 표시됩니다.</div>}

        {instance && spec && stats && (
          <ul className="space-y-1 text-xs text-neutral-300">
            <li>
              모델: <span className="text-neutral-100">{spec.model}</span>
            </li>
            <li>
              ANSI 루멘: <span className="text-neutral-100">{spec.ansiLumen.toLocaleString()} lm</span>
            </li>
            <li>
              현재 throw:{' '}
              <span className="text-neutral-100">
                {(spec.throwRatio.min + (spec.throwRatio.max - spec.throwRatio.min) * instance.zoom).toFixed(2)}
              </span>
            </li>
            <li>
              투영 면:{' '}
              <span className="text-neutral-100">
                {projection?.surface ? SURFACE_LABEL[projection.surface] : '면에 닿지 않음(또는 모서리에 걸침)'}
              </span>
            </li>
            <li>
              투영 면적:{' '}
              <span className="text-neutral-100">
                {Number.isFinite(stats.area) ? `${stats.area.toFixed(2)} m²` : '—'}
              </span>
            </li>
            <li>
              평균 조도 E_avg (Φ/A):{' '}
              <span className="text-neutral-100">
                {Number.isFinite(stats.E_avg) ? `${Math.round(stats.E_avg).toLocaleString()} lux` : '—'}
              </span>
            </li>
            <li>
              스크린 재질: <span className="text-neutral-100">{stats.materialName} (gain {stats.gain})</span>
            </li>
            <li>
              평균 휘도 L_avg (g·E/π):{' '}
              <span className="text-neutral-100">
                {Number.isFinite(stats.L_avg) ? `${stats.L_avg.toFixed(0)} nit` : '—'}
              </span>
            </li>
          </ul>
        )}
        <p className="mt-2 text-[11px] text-neutral-500">
          ※ 손실 없는 단순 평균 가정 (PRD §9.1, §9.3). 점별 lux/nit, 다중 합산, 차폐는 M2 이후.
        </p>
      </Section>

      <Section title="차폐 통계" placeholder>
        M6(관객 + 그림자)에서 활성화됩니다.
      </Section>

      <Section title="감상 품질 평가" placeholder>
        M6.5(인체공학 시감 평가)에서 활성화됩니다.
      </Section>
    </div>
  );
}
