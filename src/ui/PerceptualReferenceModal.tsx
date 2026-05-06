/**
 * 휘도(nit)별 시감 영향 근거 테이블 모달.
 * 출처: SMPTE 196M (영화관), DCI/SMPTE RP 431-2 (디지털 시네마),
 * BBC 가이드라인 (방송), CIE 191:2010 (mesopic), 미디어아트 현장 경험.
 */

interface Row {
  range: string;
  region: string;
  feel: string;
  bg: string;
}

const ROWS: Row[] = [
  {
    range: '< 0.005 nit',
    region: '암소시 (scotopic)',
    feel: '간상세포만 작동. 색 인지 불가, 윤곽만 흐릿하게 보임. 콘텐츠 감상 부적합.',
    bg: '#7f1d1d',
  },
  {
    range: '0.005 – 1 nit',
    region: '박명시 하단 (mesopic)',
    feel: '색이 매우 약하게 인지됨. 영상이 어둡고 디테일 손실 큼. 분위기 연출용 외엔 부적합.',
    bg: '#9a3412',
  },
  {
    range: '1 – 3 nit',
    region: '박명시 (mesopic)',
    feel: '색채는 있지만 어둡게 느껴짐. 의도적으로 어두운 미디어아트 표현엔 사용 가능.',
    bg: '#b45309',
  },
  {
    range: '3 – 30 nit',
    region: '명소시 하단 (photopic)',
    feel: '색·디테일은 보이나 권장 대역(30 nit~) 미달. "어둡다"는 첫인상.',
    bg: '#a16207',
  },
  {
    range: '30 – 100 nit',
    region: '명소시 권장 대역',
    feel: '미디어아트 갤러리 권장. 자연스러운 감상 휘도. 장시간 관람도 무리 없음.',
    bg: '#15803d',
  },
  {
    range: '~ 48 nit (14 fL)',
    region: '디지털 시네마 (DCI)',
    feel: 'SMPTE 196M / DCI 표준 화이트 휘도. 어두운 극장 환경용 기준점.',
    bg: '#166534',
  },
  {
    range: '100 – 300 nit',
    region: '권장 초과',
    feel: '약한 눈부심. 단시간 노출엔 OK이나 30분 이상 관람 시 시각 피로 누적.',
    bg: '#b45309',
  },
  {
    range: '300 – 700 nit',
    region: '옥외 사이니지',
    feel: '밝은 환경(쇼핑몰·옥외)용. 어두운 갤러리에서는 강한 눈부심·잔상 유발.',
    bg: '#9a3412',
  },
  {
    range: '> 700 nit',
    region: 'HDR / 강한 광원',
    feel: '단시간 강조용. 장시간 관람 부적합. 동공 적응 시간 필요(2–10분).',
    bg: '#7f1d1d',
  },
];

export default function PerceptualReferenceModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-100">
              휘도(nit)별 시감 영향 — 근거 테이블
            </h2>
            <p className="mt-1 text-xs text-neutral-400">
              스크린에 도달한 휘도가 사람의 눈에 어떻게 느껴지는지, 학회/표준과 현장 경험을 종합한 가이드.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="overflow-hidden rounded border border-neutral-800">
          <table className="w-full text-xs">
            <thead className="bg-neutral-950 text-neutral-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">휘도 범위</th>
                <th className="px-3 py-2 text-left font-medium">시감 영역 / 분류</th>
                <th className="px-3 py-2 text-left font-medium">사람이 느끼는 정도</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={i} className="border-t border-neutral-800">
                  <td className="px-3 py-2 align-top">
                    <span
                      className="inline-block rounded px-2 py-0.5 font-mono text-neutral-100"
                      style={{ backgroundColor: r.bg }}
                    >
                      {r.range}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top text-neutral-200">{r.region}</td>
                  <td className="px-3 py-2 align-top text-neutral-300 leading-relaxed">{r.feel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-2 text-[11px] text-neutral-500">
          <p>
            <strong className="text-neutral-300">출처</strong> · SMPTE 196M (영화관 화이트 휘도 14 fL = 48 nit) ·
            SMPTE RP 431-2 / DCI (디지털 시네마) · BBC R&D 가이드라인 (방송 환경 휘도) ·
            CIE 191:2010 (mesopic 모델) · 미디어아트 현장 경험치(30–100 nit, 갤러리 어두운 조명 가정).
          </p>
          <p>
            <strong className="text-neutral-300">참고</strong> · 실제 체감은 콘텐츠의 평균 화소 휘도(APL),
            관객 눈의 적응 상태, 주변광 대비, 노출 시간에 영향을 받습니다. 본 표는 단일 화면 평균 휘도 기준의 1차 근사입니다.
          </p>
          <p>
            <strong className="text-neutral-300">단위</strong> · 1 nit = 1 cd/m². 1 fL ≈ 3.426 cd/m². E (lux) → L (nit) 환산은 g·E/π (Lambertian 가정).
          </p>
        </div>
      </div>
    </div>
  );
}
