import { useMemo, useState } from 'react';
import { useScenarioStore, useSelectedProjector, effectiveGain } from '../store/scenarioStore';
import { buildFrustum, projectFrustumOntoRoom } from '../physics/frustum';
import { averageIlluminance, illuminanceToLuminance } from '../physics/illuminance';
import { classifyLuminance, GRADE_COLOR } from '../physics/perception';
import { SCREEN_MATERIALS } from '../data/screens';
import { Section } from './fields';
import PerceptualReferenceModal from './PerceptualReferenceModal';

const SURFACE_LABEL: Record<string, string> = {
  floor: '바닥', ceiling: '천장', front: '정면', back: '후면', left: '좌측', right: '우측',
};

export default function RightPanel() {
  const room = useScenarioStore((s) => s.room);
  const projectors = useScenarioStore((s) => s.projectors);
  const people = useScenarioStore((s) => s.people);
  const customScreenGain = useScenarioStore((s) => s.customScreenGain);
  const { instance, spec } = useSelectedProjector();
  const [refOpen, setRefOpen] = useState(false);

  const projection = useMemo(() => {
    if (!instance || !spec) return null;
    const frustum = buildFrustum(instance, spec);
    return projectFrustumOntoRoom(frustum, room);
  }, [instance, spec, room]);

  const stats = useMemo(() => {
    if (!instance || !spec || !projection) return null;
    const area = Number.isFinite(projection.area) ? projection.area : NaN;
    const E_avg = Number.isFinite(area) ? averageIlluminance(spec.ansiLumen, area) : NaN;
    const matId = projection.surface
      ? room.surfaces[projection.surface].material
      : room.surfaces.floor.material;
    const gain = effectiveGain(matId, customScreenGain, SCREEN_MATERIALS);
    const matName =
      matId === 'custom'
        ? `사용자 정의 (gain ${customScreenGain.toFixed(2)})`
        : SCREEN_MATERIALS.find((m) => m.id === matId)?.name ?? '—';
    const L_avg = Number.isFinite(E_avg) ? illuminanceToLuminance(E_avg, gain) : NaN;
    const verdict = Number.isFinite(L_avg) ? classifyLuminance(L_avg) : null;
    return { area, E_avg, L_avg, gain, matName, verdict };
  }, [instance, spec, projection, room.surfaces, customScreenGain]);

  const floorArea = room.size.w * room.size.d;

  return (
    <div className="flex flex-col gap-4 p-4 text-sm">
      <Section title="현재 시나리오">
        <ul className="space-y-1 text-neutral-300">
          <li>룸: <span className="text-neutral-100">{room.size.w} × {room.size.d} × {room.size.h} m</span></li>
          <li>바닥 면적: <span className="text-neutral-100">{floorArea.toFixed(2)} m²</span></li>
          <li>프로젝터: <span className="text-neutral-100">{projectors.length}대</span> (활성 {projectors.filter((p) => p.enabled).length})</li>
          <li>관객: <span className="text-neutral-100">{people.length}명</span></li>
        </ul>
      </Section>

      <Section title="선택된 프로젝터 — 단일 광선 미리보기">
        {!instance && <div className="text-xs text-neutral-500">프로젝터를 선택하면 표시됩니다.</div>}

        {instance && spec && stats && (
          <ul className="space-y-1 text-xs text-neutral-300">
            <li>이름: <span className="text-neutral-100">{instance.displayName}</span></li>
            <li>모델: <span className="text-neutral-100">{spec.model}</span>
              {spec.resolutionLabel && <span className="ml-1 text-neutral-500">({spec.resolutionLabel})</span>}
            </li>
            <li>ANSI 루멘: <span className="text-neutral-100">{spec.ansiLumen.toLocaleString()} lm</span></li>
            <li>현재 throw: <span className="text-neutral-100">
              {(spec.throwRatio.min + (spec.throwRatio.max - spec.throwRatio.min) * instance.zoom).toFixed(2)}
            </span></li>
            <li>주요 투영 면: <span className="text-neutral-100">
              {projection?.surface ? SURFACE_LABEL[projection.surface] : '—'}
              {projection?.surface && !projection.surfaceIsActive && (
                <span className="ml-1 text-amber-400">(비활성 면 — 활성화 권장)</span>
              )}
            </span></li>
            <li>투영 면적: <span className="text-neutral-100">
              {Number.isFinite(stats.area) ? `${stats.area.toFixed(2)} m²` : '—'}
            </span></li>
            <li>평균 조도 E_avg: <span className="text-neutral-100">
              {Number.isFinite(stats.E_avg) ? `${Math.round(stats.E_avg).toLocaleString()} lux` : '—'}
            </span></li>
            <li>스크린 재질: <span className="text-neutral-100">{stats.matName} (gain {stats.gain.toFixed(2)})</span></li>
            <li className="font-medium">반사 후 평균 휘도 L_avg:{' '}
              <span className="text-neutral-100">
                {Number.isFinite(stats.L_avg) ? `${stats.L_avg.toFixed(0)} nit` : '—'}
              </span>
            </li>
          </ul>
        )}
        <p className="mt-2 text-[11px] text-neutral-500">
          ※ 손실 없는 단순 평균 (PRD §9.1, §9.3). 점별/다중 합산/차폐는 M2 이후.
        </p>
      </Section>

      <Section
        title="시감 평가 (인체공학)"
        right={
          <button
            onClick={() => setRefOpen(true)}
            className="rounded border border-neutral-700 bg-neutral-950 px-2 py-0.5 text-[11px] text-neutral-300 hover:border-emerald-600 hover:text-emerald-400"
            title="휘도(nit)별 시감 영향 근거 테이블 열기"
          >
            ⓘ 근거
          </button>
        }
      >
        {!stats?.verdict && (
          <div className="text-xs text-neutral-500">프로젝터를 선택하면 표시됩니다.</div>
        )}
        {stats?.verdict && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="rounded px-2 py-0.5 text-xs font-bold text-neutral-950"
                style={{ backgroundColor: GRADE_COLOR[stats.verdict.grade] }}
              >
                {stats.verdict.grade}
              </span>
              <span className="text-xs text-neutral-300">
                {stats.verdict.region === 'photopic' && '명소시 (color 인지)'}
                {stats.verdict.region === 'mesopic' && '박명시 (color 약화)'}
                {stats.verdict.region === 'scotopic' && '암소시 (color 미인지)'}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-neutral-300">{stats.verdict.message}</p>
            <div className="text-[11px] text-neutral-500">
              ※ 단일 프로젝터·단일 면 평균 기준. M6.5에서 다중 합산·균일도·주변광·관객 차폐를 포함한 정밀 평가.
            </div>
          </div>
        )}
      </Section>

      <Section title="차폐 통계" placeholder>
        M6(관객 + 그림자)에서 활성화됩니다.
      </Section>

      {refOpen && <PerceptualReferenceModal onClose={() => setRefOpen(false)} />}
    </div>
  );
}
