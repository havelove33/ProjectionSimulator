# 4면 프로젝션 시뮬레이터 — PRD

> Product Requirements Document v0.1
> 작성일: 2026-05-06
> 작성자: 곽태진 대표
> 가칭: **ProjStudio** (Projection Studio)

---

## 1. 개요 (Summary)

ProjStudio는 다면 프로젝션 미디어아트 현장에서 **프로젝터 선택과 배치 의사결정을 돕는 웹 기반 3D 시뮬레이터**다. 사용자가 공간(룸) 치수와 프로젝터 사양을 입력하면, 각 프로젝터의 투영면이 어떻게 펼쳐지는지, 합산된 스크린 밝기(루멘/lux/nit)는 얼마인지, 스크린 재질(게인·반사도)에 따라 어떻게 변하는지를 3D 뷰와 수치로 동시에 보여준다.

핵심 사용 시나리오는 사용자(곽태진 대표)가 진행 중인 **4면 프로젝션 미디어아트 프로젝트**다 — 바닥 2대, 좌측면 1대, 우측면 1대, 정면 1대 총 5대 구성을 가상으로 배치하고, 프로젝터 후보들의 사양을 비교 시뮬레이션한 뒤 발주 결정을 내릴 수 있어야 한다.

이 콘텐츠는 **off-axis(비축) 투사 기반의 몰입형(immersive) 미디어아트**다. 즉, 측면·바닥·정면이 물리적으로는 서로 직각이지만 콘텐츠 단계에서 특정 **뷰어 스윗스팟(viewer sweet spot)** 을 기준으로 원근 보정(perspective warping)되어, 그 지점에서 보면 마치 하나의 연속된 가상 공간을 보는 것처럼 인식된다. 따라서 시뮬레이터는 프로젝터 빔뿐 아니라 **(1) 뷰어 스윗스팟의 위치**, **(2) 그 지점에서 본 가상 카메라 뷰**, **(3) 관객이 공간 안에 실제로 서 있을 때 발생하는 그림자/차폐**까지 함께 다뤄야 한다.

## 2. 배경 / 문제 정의 (Why)

미디어아트 현장에서 프로젝터를 선정·배치할 때 통상 다음과 같은 문제가 반복된다.

- 카탈로그상 ANSI 루멘 수치만 보고 골랐다가, 실제 거리·입사각·스크린 재질을 반영한 **체감 밝기(nit)** 가 기대치에 미달.
- 다면 투영 시 **두 대 이상이 겹치는 영역과 공백**이 어디인지 사전에 시각화되지 않아, 콘텐츠 제작·핀쿠션/키스톤 보정 단계에서 재작업.
- 광각/단초점 렌즈, 렌즈 시프트, 줌 범위 등의 **광학 파라미터가 실제 투영 영역에 미치는 영향**을 직관적으로 비교하기 어려움.

ProjStudio는 이 의사결정을 발주 전에 끝낼 수 있도록, **광도학 공식 기반의 정량 시뮬레이션**과 **실시간 3D 시각화**를 한 화면에서 제공한다.

## 3. 목표 사용자 (Personas)

| 페르소나 | 설명 | 주된 의사결정 |
| --- | --- | --- |
| 미디어아트 작가/감독 | 콘텐츠 기획과 공간 연출 동시 담당 | 5대 프로젝터의 화각·겹침·균일도를 한눈에 보고 콘텐츠 캔버스 분할 결정 |
| 테크니컬 디렉터 | 장비 발주·설치·정합 책임 | 후보 프로젝터 A/B/C의 lumen·throw ratio 차이가 실제 lux로 어떻게 나타나는지 비교 |
| 공간 기획·시공 PM | 예산·납기 책임 | 가장 적은 대수/저렴한 모델로 목표 밝기를 충족하는 조합 도출 |

## 4. 핵심 사용 시나리오 (User Scenarios)

### S1. 4면 몰입형 프로젝션 룸 셋업 (1차 타깃 시나리오)
1. 사용자가 룸 치수(예: 8m × 6m × 3m)를 입력한다.
2. 5대 프로젝터를 추가한다 — 바닥 2대(천장에서 바닥 투영), 좌·우·정면 벽 각 1대.
3. 후보 모델 사양(예: 7,000 ANSI lm, throw 0.8:1, 1920×1200, 줌 1.0–1.3)을 입력하거나 사전 등록 라이브러리에서 선택.
4. 각 프로젝터의 위치·각도·렌즈 시프트를 조정하면, 3D 뷰에서 투영 frustum과 벽/바닥에 닿는 사다리꼴이 실시간 갱신된다.
5. **뷰어 스윗스팟**을 룸 중앙(또는 임의 좌표)에 배치하고, 그 지점에서 본 가상 카메라 뷰(off-axis 보정 결과의 미리보기 와이어프레임)를 별도 미니맵으로 확인한다.
6. **관객 더미**는 시작 시 기본 20명이 임의 분포로 배치되어 있으며, 인원 입력값을 0/5/30/50 등으로 변경하면 패턴에 맞춰 즉시 갱신된다. 프로젝터별로 어떤 면에 그림자가 생기는지, 면별 차폐 비율과 평균 lux 저감을 확인한다.
7. 우측 패널에서 각 면의 평균 lux, 최저 lux, 균일도(min/avg), 겹침 영역의 합산 nit, **그림자 영역의 lux 결손**을 확인.
8. 스크린 재질을 White Matte(게인 1.0) → Gray (0.8) → High-Gain(1.5)로 토글하며 nit 변화 비교.
9. 시나리오를 JSON으로 저장 / URL로 공유.

### S2. 프로젝터 후보 비교
- 동일 배치(관객 포함)에서 모델 A vs B를 swap하여 lux/uniformity/그림자 영향 차이를 비교.

### S3. 콘텐츠 캔버스 추출
- 각 프로젝터별 투영 사각형을 UV 맵으로 export → After Effects/TouchDesigner에서 콘텐츠 제작 시 가이드로 사용.
- **뷰어 스윗스팟 기준 가상 카메라 매트릭스(view + projection)** 도 함께 export — 콘텐츠 팀이 동일한 off-axis 워핑을 재현하도록 함.

### S4. 관객 동선/밀도 시뮬레이션
- 관객 수를 1 → 5 → 20 → 50으로 늘려가며 평균 차폐율과 "보존되는 평균 lux" 곡선을 확인, 안전 동선·관객 수용 인원 의사결정에 사용.

## 5. 범위 (Scope)

### In Scope (MVP — v1.0)
- 사용자 정의 치수의 직육면체 룸 (가로/세로/높이 자유 입력)
- 프로젝터 N대 추가/삭제, 위치(x,y,z)·회전(yaw, pitch, roll)·렌즈 시프트(H/V)·줌 비율 조정
- 프로젝터 사양 입력: ANSI 루멘, 네이티브 해상도, 가로세로비, throw ratio (또는 throw 거리 및 화각), 줌 범위, 렌즈 시프트 범위, 콘트라스트, 광원 종류(레이저/램프)
- 실시간 3D 뷰(자유 카메라 + 프리셋: 평면/정면/측면/탑뷰)
- 투영 frustum 시각화 + 벽/바닥과의 교집합으로 실제 투영 다각형 계산 (사다리꼴/키스톤 형상)
- 광도학 계산: 면 위 모든 점에서의 illuminance(lux), 합산 시 luminance(nit) 환산
- 스크린 재질 프리셋(White Matte 1.0 / Gray 0.8 / High-gain 1.5 / Rear-projection 등) + 사용자 정의 게인
- 결과 패널: 면별 평균/최저/최대 lux, 균일도, 겹침 영역 표시(히트맵), 합산 밝기
- 시나리오 JSON import/export, 공유용 URL(상태를 query string으로 직렬화)
- 프로젝터 라이브러리(JSON) — 시드 데이터 10–20종 (현장 흔히 쓰이는 모델)
- **뷰어 스윗스팟(off-axis 기준점) 배치 + 가상 카메라 미리보기 와이어프레임**
- **관객(Person) 배치 — 1명에서 100명까지, 개별 위치/신장/자세 + 배치 패턴 헬퍼(원형/그리드/임의)**
- **관객으로 인한 프로젝터별 그림자/차폐 계산 — 면별 차폐 비율, 그림자 영역 가시화, 차폐 후 평균 lux 저감 산출**
- 한국어 UI (영어 토글은 후순위)

### Out of Scope (v1.0 기준 미포함)
- 비정형 곡면/메쉬 매핑 (v2 이상)
- 색재현(감마/색역) 시뮬레이션 (밝기만 다룸)
- 실측 IES 라이트 프로파일 import
- 실시간 콘텐츠(영상) 미리보기 — 정적 그리드/체커보드 패턴만 표시
- 멀티유저 협업, 클라우드 저장 (v2)
- 모바일 최적화 (데스크톱 1280px 이상 우선)
- 관객의 실시간 이동 애니메이션 / 보행 시뮬레이션 (정적 배치만 v1)
- 관객 신체의 정밀한 골격/팔다리 모델 (v1은 캡슐/실린더 근사)

## 6. 기능 요구사항 (Functional Requirements)

### FR-1. 룸(공간) 정의
- FR-1.1: 가로/세로/높이를 m 단위로 입력 (0.5m–50m, 0.1m 해상도)
- FR-1.2: 좌표계: 룸 중심을 원점으로 하는 우수좌표계, +Y가 위(천장 방향)
- FR-1.3: 4개 벽 + 바닥 + 천장 각각의 투영면 활성/비활성 토글
- FR-1.4: 각 면별로 스크린 재질을 다르게 지정 가능 (예: 바닥은 회색 무광, 벽은 화이트)

### FR-2. 프로젝터 사양 입력
- FR-2.1: 필수 입력 — 모델명, ANSI 루멘, 네이티브 해상도, 종횡비, throw ratio (또는 거리 D에서의 폭 W로 입력 가능)
- FR-2.2: 선택 입력 — 줌 범위, 렌즈 시프트(H/V %), 콘트라스트비, 광원(레이저/램프), 발광 효율 감쇠(시간 경과 후 보정)
- FR-2.3: 사용자 정의 모델을 라이브러리에 저장
- FR-2.4: 시드 라이브러리(JSON) — Epson, BenQ, Panasonic, Christie, Barco 등에서 자주 쓰이는 단초점/일반 모델 10–20종

### FR-3. 프로젝터 배치
- FR-3.1: 위치 (x, y, z) 직접 입력 또는 3D 뷰에서 드래그
- FR-3.2: 회전 — yaw / pitch / roll 또는 "타깃 포인트를 향함" 모드
- FR-3.3: 줌 슬라이더(범위 내), 렌즈 시프트 슬라이더(범위 내)
- FR-3.4: "이 프로젝터를 면 X에 자동 정렬" 헬퍼 — 지정 면에 직각으로 향하도록 회전 자동 산출
- FR-3.5: 프로젝터를 "그룹"으로 묶어 동시 이동/복제 (예: 바닥 2대를 그룹화)

### FR-4. 투영면 계산 / 시각화
- FR-4.1: 각 프로젝터의 광학 frustum을 3D에 표시(반투명 콘/피라미드)
- FR-4.2: frustum과 활성 면들과의 교집합 다각형(투영 사각형, 키스톤된 사다리꼴) 실시간 계산
- FR-4.3: 한 프로젝터의 빔이 두 면에 걸칠 경우 각 면별로 분할된 다각형 표시
- FR-4.4: 면 위 그리드(예: 1m × 1m) 오버레이 토글, 픽셀 밀도(ppi) 시각화

### FR-5. 광도/밝기 계산
- FR-5.1: 면 위 격자 샘플(기본 100×100, 사용자 조정 가능)에서 illuminance E (lux) 계산
- FR-5.2: 다중 프로젝터 합산 — 같은 점에 두 대 이상이 닿으면 더해서 표시
- FR-5.3: 스크린 게인을 곱한 luminance L (nit = cd/m²) 환산값 동시 표시
- FR-5.4: 결과 면별 통계: 평균/최저/최대/표준편차/균일도(min/avg)
- FR-5.5: 히트맵 색상 스케일은 사용자가 lux 기준 또는 nit 기준 선택

### FR-6. 스크린 재질
- FR-6.1: 프리셋 — White Matte (gain 1.0), Gray (0.8 / 0.6), High-gain (1.5 / 2.0), Rear-projection screen, Concrete, Wood
- FR-6.2: 게인은 정면(0°) 기준이며, 입사각 θ에 대해 cos θ 가중을 적용 (단순 Lambertian 가정)
- FR-6.3: v1에서는 등방 반사(Lambertian) 근사. 이방성/half-gain angle은 v2에서 도입.

### FR-7. 결과/리포트
- FR-7.1: 면별 결과 표 (평균/최저/균일도/겹침 비율, **차폐 비율, 차폐 후 평균 lux**)
- FR-7.2: 프로젝터별 결과 표 (실 투영 면적, 평균 lux 기여도, **그림자에 가려진 면적 비율**)
- FR-7.3: PDF/PNG export — 3D 스크린샷 + 결과 표
- FR-7.4: JSON 시나리오 export/import

### FR-8. 뷰어 스윗스팟 (Off-axis 보정 기준점)
- FR-8.1: 룸 안에 0~N개의 스윗스팟을 배치(좌표 + 시선 높이, 기본 1.6m)
- FR-8.2: 각 스윗스팟에서 6면(또는 활성 면)을 향한 **off-axis 가상 카메라 매트릭스**(view + projection)를 자동 산출
- FR-8.3: 미니맵에 그 스윗스팟에서 본 결과(각 면이 어떻게 합쳐져 보이는지) 와이어프레임 미리보기 — 정확한 픽셀 렌더가 아닌 **각 면의 윤곽이 어떤 화각으로 들어오는지**의 직관 가이드
- FR-8.4: 스윗스팟 위치를 드래그하면 미리보기 즉시 갱신
- FR-8.5: 스윗스팟 매트릭스를 JSON/CSV로 export (콘텐츠 팀이 워핑에 사용)
- FR-8.6: "관객 평균 위치를 스윗스팟으로" 헬퍼 — 배치된 관객의 무게중심을 자동으로 스윗스팟으로 채택하는 옵션

### FR-9. 관객(Person) 배치
- FR-9.1: 사람을 1명 단위로 추가/삭제 — **새 시나리오 시작 시 기본 20명이 자동 배치됨** (사용자가 인원 수치 입력으로 즉시 변경 가능; 0~100명 범위, 100명은 v1 성능 가드 상한)
- FR-9.2: 개별 사람 속성 — 위치(x,z), 신장(기본 1.7m, 1.4–2.0m), 어깨 폭(기본 0.45m), 자세(서기/앉기/들기 — 캡슐 높이 프리셋), 활성/비활성
- FR-9.3: 배치 패턴 헬퍼 — 원형(중심·반경·인원), 그리드(행·열·간격), 임의 분포(밀도 기반 포아송 디스크 샘플링), CSV import (x,z,height). **기본 20명 시드는 룸 중앙을 중심으로 한 임의 분포(포아송 디스크 샘플링)로 자동 배치되어 첫 화면에서도 즉시 차폐 효과를 확인 가능**
- FR-9.4: 사람을 그룹으로 묶어 일괄 이동/회전/삭제
- FR-9.5: 사람 표현 — 기본은 캡슐(실린더+반구) 단순 형상. 옵션으로 어깨/머리 분리 2단 캡슐(머리 0.2m, 몸통 어깨~허리)
- FR-9.6: 기둥·구조물(임시 가설물) 등을 같은 모델로 추가 가능 (장애물 일반화)
- FR-9.7: 관객 인원 수치를 한 번에 변경하는 "인원 수" 슬라이더/입력 — 값을 늘리면 패턴에 따라 자동 추가, 줄이면 가장 최근 추가된 인원부터 제거 (수동 편집한 사람은 보존하는 옵션 토글)

### FR-10. 그림자 / 차폐(Occlusion) 시뮬레이션
- FR-10.1: 각 샘플점 P에 대해 각 프로젝터 k의 광선 (S_k → P)이 어떤 사람에게도 가려지지 않는지 가시성 V_k(P) ∈ {0,1} 계산
- FR-10.2: 가려진 광선 기여분은 합산에서 제외 (수식은 §9.7 참조)
- FR-10.3: 면 위 그림자 영역을 별도 색으로 가시화 + 히트맵에서 lux 결손 표시
- FR-10.4: 면별/프로젝터별 차폐 통계 — 그림자 면적 / 활성 면적, 평균 lux 저감(차폐 후/차폐 전), 균일도 변화
- FR-10.5: "특정 사람만 음영 분석" 토글 — 한 사람을 선택하면 그가 만드는 그림자만 강조
- FR-10.6: 각 프로젝터별로 어떤 면적이 가장 많이 가려지는지 랭킹(설치 위치 재검토 신호)
- FR-10.7: 사람 캡슐 외에 정적 장애물(가설물·전시 오브제)도 같은 차폐 계산 파이프라인에 포함

### FR-11. 데이터 영속화 / 공유
- FR-11.1: 시나리오 자동 저장 (브라우저 localStorage)
- FR-11.2: URL 공유 — 상태를 LZ-string 등으로 압축해 query에 직렬화
- FR-11.3: 다중 시나리오 슬롯(최소 5개)
- FR-11.4: 관객 배치도 시나리오 일부로 같이 저장/공유

## 7. 비기능 요구사항 (Non-Functional)

| ID | 요구사항 |
| --- | --- |
| NFR-1 | 프로젝터 5대 + 100×100 샘플 + 관객 0명 기준, 파라미터 변경 시 60ms 이내 결과 갱신 (데스크톱 미들레인지 기준) |
| NFR-1b | **기본 시나리오(프로젝터 5대 + 관객 20명 + 100×100 샘플)** 에서 차폐 포함 결과 갱신 150ms 이내. 30~50명까지는 200ms 이내 허용. 50명 초과는 WebWorker로 백그라운드 갱신 + 진행 인디케이터 허용. |
| NFR-2 | Chrome/Edge/Safari 최신 2개 버전 지원 |
| NFR-3 | WebGL2 기반, 폴백 없음(2026년 기준 보편적) |
| NFR-4 | 초기 로드 < 3s (3G fast 기준 < 8s) |
| NFR-5 | 라이선스 — 코드는 MIT, 시드 라이브러리는 출처 표기 |
| NFR-6 | 접근성 — 색상 의존도 낮추기 위해 히트맵에 수치 라벨 병기, 키보드 네비게이션 가능 |
| NFR-7 | 관객 100명 상한 가드 — 초과 입력 시 사용자 경고 + 샘플 해상도 자동 감속 제안 |

## 8. 정보 구조 / UX 플로우 (간단 와이어)

레이아웃 (좌 / 중앙 / 우 + 미니맵):

- **상단바**: 시나리오 이름, 저장, 불러오기, 공유 URL, Export(PNG/PDF/JSON/CSV)
- **좌측 패널 (컨트롤)** — 탭으로 분리
  - 공간: 룸 치수, 면 활성/재질
  - 프로젝터: 리스트, 선택된 항목 파라미터, 라이브러리
  - 뷰어 스윗스팟: 위치/시선 높이, "관객 무게중심으로 자동" 헬퍼
  - 관객(People): 개별 추가/삭제, 패턴 헬퍼(원형/그리드/임의), CSV import, 자세 프리셋
  - 차폐 옵션: 차폐 ON/OFF, 샘플 해상도
- **중앙 3D 뷰포트**: R3F + OrbitControls, 카메라 프리셋(Top/Front/Side/Free)
- **미니맵 (우상단 오버레이)**: 활성 스윗스팟에서 본 와이어프레임 미리보기
- **우측 결과 패널**:
  - 면별 통계 (평균/최저/균일도, 차폐 후 lux 저감)
  - 프로젝터별 통계 (실 투영 면적, 그림자 면적 비율)
  - 히트맵 단위 토글 (lux ↔ nit), 그림자 영역 표시 토글

원본 ASCII 와이어 (참고용, 관객/스윗스팟 추가 전 초안):

```
┌────────────────────────────────────────────────────────────┐
│ 상단바: 시나리오 이름 | 저장 | 불러오기 | 공유 | export    │
├────────────────┬──────────────────────────┬────────────────┤
│ 좌측 패널       │   3D 뷰포트              │ 우측 결과 패널 │
│  - 룸 치수      │   (R3F + OrbitControls) │  - 면별 통계   │
│  - 면 활성/재질 │                          │  - 프로젝터별  │
│  - 프로젝터     │   카메라 프리셋 토글     │  - 히트맵 토글 │
│    리스트       │   (Top/Front/Side/Free)  │  - 단위 토글   │
│  - 선택된       │                          │    (lux/nit)   │
│    프로젝터     │                          │                │
│    파라미터     │                          │                │
│  - 라이브러리   │                          │                │
└────────────────┴──────────────────────────┴────────────────┘
```

## 9. 광도학 계산 모델 (수식)

> 단위: 광속 Φ는 lumen(lm), 조도 E는 lux(lm/m²), 휘도 L은 nit(cd/m²).

### 9.1 투영 면적과 평균 조도
프로젝터의 ANSI 루멘을 Φ, 투영 면적을 A(m²), 면 위 평균 illuminance를 E_avg라 할 때 — 손실이 없다면

```
E_avg = Φ / A   [lux]
```

A는 throw ratio, 거리, 줌, 면과의 입사각으로부터 frustum-면 교집합을 계산해 산출한다 (FR-4.2).

### 9.2 한 점에서의 조도 (역제곱·코사인)
면 위 점 P, 프로젝터 광원 위치 S, 광선 방향과 면 법선 사이 각 θ, 광선 방향과 프로젝터 광축 사이 각 α, 거리 d = |P − S|일 때

```
E(P) = I(α) · cos θ / d²        [lux]
```

여기서 I(α)는 광축에서 α만큼 벗어난 방향의 광도(cd). 균일 frustum 가정 하에 화각 안이면

```
I(α) ≈ Φ / Ω    (Ω: 프로젝터의 입체각, sr)
```

화각 밖이면 I = 0. 줌/throw ratio 변화는 Ω를 변화시켜 반영.

### 9.3 휘도 환산 (스크린 게인)
스크린 게인 g, 입사각 θ에서 Lambertian 가정으로

```
L(P) = g · E(P) / π             [nit]
```

(고게인/이방성은 v2에서 BRDF로 교체)

### 9.4 다중 프로젝터 합산 (차폐 포함)
점 P에 닿는 프로젝터 집합 K(P)와 가시성 V_k(P)에 대해

```
E_total(P) = Σ_{k ∈ K(P)} V_k(P) · E_k(P)
L_total(P) = g · E_total(P) / π
```

V_k(P)는 §9.7 참조.

### 9.5 균일도 / 겹침
- 균일도 U = E_min / E_avg (면별로 산출, 차폐 적용 후)
- 겹침 비율 = (둘 이상 프로젝터가 닿고 차폐되지 않은 샘플 수) / (전체 활성 샘플 수)
- 차폐 비율 = (적어도 한 프로젝터로부터 가려진 샘플 수) / (활성 샘플 수)
- 차폐 후 평균 lux 저감 = 1 − E_avg(차폐 적용) / E_avg(차폐 미적용)

### 9.6 가정과 한계
- 광원은 점광원 + 균일한 frustum 광량 분포로 근사 (실제 ANSI 패턴의 9-zone 분포는 v2)
- 표면은 Lambertian (이방성/half-gain은 v2)
- 환경광·간접광·화면 간 상호반사 미고려
- 색재현/감마는 미고려, 백색 기준 광량만 다룸
- 사람은 수직축 캡슐(또는 2단 캡슐)로 근사. 팔다리 동작·세부 윤곽 미반영. 사람 자체에 의한 빛 산란(은은한 반사광) 미고려.
- 정확도 목표: 실측치 대비 ±20% 이내(현장 의사결정용)

### 9.7 가시성 / 차폐 모델 V_k(P)
프로젝터 광원 S_k에서 샘플점 P로 향하는 광선 r(t) = S_k + t·(P − S_k), t ∈ [0,1]에 대해, 사람 집합 H = {h_1, h_2, …}를 수직 캡슐(중심축 a_h, 반경 r_h, 높이 H_h)로 모델링한다.

```
V_k(P) =
  0   if  ∃ h ∈ H,  r(t) ∩ Capsule(h) ≠ ∅  for some  t ∈ (0, 1)
  1   otherwise
```

구현 메모:
- 광선-캡슐 교차는 광선-실린더(무한)와 광선-반구 두 캡 교차의 결합으로 닫힌형 해 존재(상수 시간 O(1)/캡슐).
- 한 광선당 비용 O(|H|). 샘플 N개 × 프로젝터 K대 × 사람 P명 → O(N·K·P). N=10,000, K=5, P=30이면 1.5M 교차 — WebWorker로 분리, 캡슐 BVH로 가속 가능.
- 사람·프로젝터 위치가 변하지 않은 프레임에서는 V_k(P)를 캐싱(샘플 변경 없으면 재계산 불필요).
- 부드러운 음영 효과(반음영)는 v1에서는 하드 섀도우(0/1)만, v2에서 광원 면적을 고려한 PCF/소프트 섀도우 옵션.

### 9.8 Off-axis 가상 카메라 매트릭스 (스윗스팟)
스윗스팟 W(위치)·시선 높이 h에서 활성 면 F의 4개 코너 c1..c4를 지나도록 하는 비대칭(asymmetric) 절두체를 구성한다. 즉 일반적인 perspective(fovy, aspect)가 아니라 **off-center frustum**(left, right, bottom, top, near, far)을 코너에서 직접 산출한다.

```
For each surface F with corners {c_i}:
  view = LookAt(W, F의 중심, up=Y)
  // 코너를 view 공간으로 변환
  c_i^v = view · c_i
  l = min(c_i^v.x / -c_i^v.z) · near
  r = max(c_i^v.x / -c_i^v.z) · near
  b = min(c_i^v.y / -c_i^v.z) · near
  t = max(c_i^v.y / -c_i^v.z) · near
  proj = Frustum(l, r, b, t, near, far)
```

이 (view, proj) 쌍을 면별로 export → 콘텐츠 팀이 동일한 워핑을 재현. v1에서는 미리보기 와이어프레임 + 매트릭스 export까지만 지원하며, 콘텐츠 텍스처를 실제로 면에 매핑해 보여주는 기능은 v2.

## 10. 기술 스택 / 아키텍처

### 10.1 스택
- 빌드: Vite + TypeScript
- UI: React 18 + Tailwind CSS + shadcn/ui
- 3D: three.js + @react-three/fiber + @react-three/drei
- 상태: zustand (전역 시나리오 상태)
- 수치: gl-matrix / three.js Vector / Math.js (필요 시)
- 저장: localStorage + LZ-string (URL 공유)
- 테스트: Vitest (단위 — 광도학 계산), Playwright (e2e — 시나리오 import/export)
- 린트/포맷: ESLint + Prettier
- 배포: GitHub Actions → GitHub Pages (정적 빌드)

### 10.2 모듈 구조 (제안)
```
src/
├── app/                # 라우팅, 레이아웃
├── scene/              # R3F 컴포넌트 (Room, Projector, Frustum, Heatmap, Person, Viewer)
├── physics/            # 광도학 계산 (순수 함수, 테스트 대상)
│   ├── frustum.ts      # frustum-plane intersection
│   ├── illuminance.ts  # 점별 lux 계산
│   ├── occlusion.ts    # 광선-캡슐 교차, V_k(P) 산출
│   ├── offaxis.ts      # 스윗스팟 view/proj 매트릭스
│   └── stats.ts        # 균일도, 겹침, 차폐
├── workers/            # WebWorker — 차폐 계산 분리
├── store/              # zustand store
├── ui/                 # 좌/우 패널, 입력 컴포넌트, 관객/스윗스팟 패널
├── data/               # 시드 프로젝터 라이브러리, 스크린 프리셋
├── io/                 # JSON import/export, URL 직렬화, CSV(관객) import
└── main.tsx
```

### 10.3 데이터 모델 (요약)
```ts
type Vec3 = [number, number, number];

interface Room {
  size: { w: number; d: number; h: number };  // m
  surfaces: {
    floor:   { active: boolean; material: ScreenMaterialId };
    ceiling: { active: boolean; material: ScreenMaterialId };
    front:   { active: boolean; material: ScreenMaterialId };
    back:    { active: boolean; material: ScreenMaterialId };
    left:    { active: boolean; material: ScreenMaterialId };
    right:   { active: boolean; material: ScreenMaterialId };
  };
}

interface ProjectorSpec {
  id: string;
  model: string;
  ansiLumen: number;
  resolution: [number, number];
  aspect: number;
  throwRatio: { min: number; max: number };  // 줌 범위
  lensShift?: { hPct: [number, number]; vPct: [number, number] };
  contrast?: number;
  source?: 'laser' | 'lamp';
}

interface ProjectorInstance {
  id: string;
  specId: string;
  position: Vec3;
  rotation: Vec3;     // yaw, pitch, roll (deg)
  zoom: number;       // throwRatio 보간 0..1
  shift: { h: number; v: number };  // %
  enabled: boolean;
  groupId?: string;
}

interface ScreenMaterial {
  id: string;
  name: string;
  gain: number;       // 정면 기준
  // v2: halfGainAngle, anisotropy
}

interface Person {
  id: string;
  position: [number, number];   // (x, z) — y는 바닥
  height: number;               // m, default 1.7
  shoulderRadius: number;       // m, default 0.225 (어깨 폭/2)
  posture: 'standing' | 'sitting' | 'raisedArms';
  enabled: boolean;
  groupId?: string;
}

interface Obstacle {
  id: string;
  shape: 'capsule' | 'box';
  // capsule: position(x,z) + radius + height
  // box: position + size + rotation
  params: Record<string, number>;
  enabled: boolean;
}

interface Viewer {            // off-axis 스윗스팟
  id: string;
  position: Vec3;             // 룸 좌표
  eyeHeight: number;          // m, default 1.6
  active: boolean;
  // 자동 산출되는 view/proj 매트릭스는 파생값이라 저장 안 함
}

interface Scenario {
  version: '1';
  name: string;
  room: Room;
  projectors: ProjectorInstance[];
  customSpecs: ProjectorSpec[];
  people: Person[];           // default: 20명 (Poisson-disk 분포로 시드)
  obstacles: Obstacle[];
  viewers: Viewer[];
  units: 'lux' | 'nit';
  sampleResolution: number;
  occlusion: {
    enabled: boolean;
    softShadow: false;        // v1 fixed
  };
}

// 시나리오 초기화 헬퍼
const DEFAULTS = {
  peopleCount: 20,
  personHeight: 1.7,
  personShoulderRadius: 0.225,
  personPosture: 'standing' as const,
  audienceLayout: 'poisson' as const, // 'poisson' | 'grid' | 'circle'
};
```

## 11. 마일스톤 / 일정 (제안)

| 마일스톤 | 기간 (영업일) | 산출물 |
| --- | --- | --- |
| M0. 프로젝트 셋업 | 1 | Vite/React/TS/R3F 보일러플레이트, GH Actions로 Pages 자동배포 파이프라인 |
| M1. 룸 + 단일 프로젝터 frustum | 3 | 룸 치수 입력 → 1대 프로젝터 frustum 시각화 + 면 교집합 |
| M2. 광도학 계산 코어 | 4 | 단일 프로젝터의 lux/nit 계산 + 히트맵, 단위 테스트(Vitest) |
| M3. 다중 프로젝터 + 합산 | 3 | N대 추가/삭제, 합산/겹침/균일도 |
| M4. 사양 라이브러리 + UX | 3 | 시드 라이브러리, 좌/우 패널, 카메라 프리셋 |
| M5. 뷰어 스윗스팟 + Off-axis 매트릭스 | 2 | 스윗스팟 배치, 면별 view/proj 산출, 미니맵 미리보기, 매트릭스 export |
| M6. 관객 배치 + 그림자 차폐 | 4 | Person/Obstacle 데이터, 배치 패턴 헬퍼, 광선-캡슐 교차, 차폐 통계, WebWorker 분리 |
| M7. 저장/공유/Export | 2 | JSON import/export(관객 포함), URL 공유, PNG 캡처, CSV 관객 import |
| M8. 베타 테스트 + 4면 시나리오 검증 | 3 | 사용자(곽 대표) 실제 시나리오 dry run — 5대 + 30명 관객 부하/정합 검증 |
| M9. v1.0 릴리스 | 1 | README, 사용자 가이드, 데모 시나리오 3종(빈 공간 / 5명 / 30명) |

총 ≈ **26영업일 (약 5–6주)** — 1인 풀타임 기준. 파트타임이면 10–12주. 관객·차폐 기능 추가로 M6, M8이 증가했다.

## 12. 배포 전략 (GitHub Pages)

1. 리포지토리 생성 — `projstudio` (혹은 사용자 지정)
2. `vite.config.ts`에 `base: '/projstudio/'` 설정
3. `.github/workflows/deploy.yml` —
   - `main` 푸시 시 `pnpm install && pnpm build` → `dist/`를 `gh-pages` 브랜치 또는 GitHub Pages 액션으로 배포
4. 도메인은 기본 `https://<user>.github.io/projstudio/`. 추후 커스텀 도메인 옵션.
5. PR 프리뷰는 v1.1에서 도입(Surge 또는 Cloudflare Pages 보조).

## 13. 성공 지표 (KPIs)

- **검증**: 곽 대표의 4면 5프로젝터 실제 시나리오에서 시뮬레이션 평균 lux와 현장 실측치 오차 ±20% 이내
- **사용성**: 첫 시나리오 구성(룸 입력 → 프로젝터 5대 배치 → 결과 확인)까지 신규 사용자 평균 10분 이내
- **공유**: 외부 협업자(콘텐츠 제작 팀)가 URL만으로 동일한 뷰 재현 가능
- **확장성**: 사용자 정의 프로젝터 사양 추가가 코드 수정 없이 가능

## 14. 리스크 & 대응

| 리스크 | 영향 | 대응 |
| --- | --- | --- |
| 광도학 모델이 과도한 단순화 | 의사결정 오류 | M2에서 알려진 시나리오(단일 프로젝터, 평면 스크린) 손계산과 결과 비교; ±20% 가드레일 |
| GPU 성능 한계로 100×100 샘플 갱신 지연 | 인터랙션 저하 | 샘플 해상도 사용자 조정 + 디바운스 + WebWorker로 계산 분리 |
| frustum-plane 교집합 엣지 케이스 (모서리에 걸침) | 시각/계산 오류 | three.js Plane.clip 방식 + 단위 테스트(코너 케이스 10종) |
| 실제 프로젝터 카탈로그 사양 부정확 | 신뢰도 하락 | 시드 라이브러리 출처 명기, 사용자가 직접 수정/오버라이드 가능 |
| 관객 30명+ 차폐 계산 비용으로 인터랙션 정지 | 사용성 저하 | WebWorker, 캡슐 BVH, 사람·프로젝터 위치 변하지 않은 프레임 V_k(P) 캐싱, 자동 샘플 해상도 감속 |
| 캡슐 근사가 실제 사람 윤곽과 차이 — 그림자 형상 차이 | 신뢰도 하락 | v1은 "면적·비율" 통계가 주된 의사결정 지표라 형상 정밀도 영향 제한적임을 사용자 가이드에 명시; v2에서 어깨/머리 분리 캡슐 기본 채택 |
| Off-axis 미리보기와 실제 워핑 결과 사이 시각 차이 | 콘텐츠 팀 혼선 | 미리보기는 "와이어프레임 가이드"임을 UI 상시 라벨링, 매트릭스 export 정확성 단위 테스트 |

## 15. 향후 확장 (v2+)

- 비정형/곡면 메쉬 매핑 + UV 언랩
- 이방성 BRDF 스크린 재질 (half-gain angle)
- IES 라이트 프로파일 import
- 콘텐츠 영상 텍스처 미리보기 + off-axis 워핑 실시간 적용 (스윗스팟에서 본 통합 화면 렌더)
- 관객 보행/동선 애니메이션 + 시간 평균 차폐율
- 어깨/머리 분리 2단 캡슐 → 실제 골격 기반 휴머노이드 모델
- 소프트 섀도우 (광원 면적 + PCF)
- 멀티 스윗스팟 가중 평균 (관객 분포에 따른 콘텐츠 최적 시점)
- 멀티유저 협업 (Vercel + Supabase로 이전 검토)
- 모바일 뷰어 모드(읽기 전용)
- LED 월/하이브리드 셋업 비교

## 16. 오픈 이슈 (PRD 검토에서 결정 필요)

- O-1: v1에서 천장 면 투영도 지원할지 (현재 4면 시나리오에는 없으나 모델은 6면 다 지원)
- O-2: 시드 프로젝터 라이브러리에 어떤 모델 우선 등록할지 (사용자 자주 쓰는 모델 리스트 필요)
- O-3: 결과 export 형식 — PDF 단일 vs PNG + JSON + CSV 분리
- O-4: GitHub 리포지토리 이름과 가시성(public/private)
- O-5: 프로젝터 발광 효율 감쇠(사용시간 경과)를 v1에 넣을지 v2로 미룰지
- O-6: 관객 자세 프리셋 — 서기/앉기 외에 "팔 든 자세(촬영/리액션)" 등 추가할지
- O-7: 관객 캡슐 기본 치수 — 한국 성인 평균 신장 기준(남 173cm/여 160cm)으로 시드할지, 사용자 지정 평균만 받을지
- O-8: 스윗스팟이 여러 개일 때 콘텐츠 export는 각 스윗스팟별로 독립 매트릭스 세트인지, 가중 합성인지
- O-9: 관객으로 인한 그림자가 다른 관객에게 떨어지는 경우(관객 위에 빛 차단)도 시각화 대상에 포함할지 — v1은 "면 위 그림자"만 다룰지 결정

**확정된 결정 (Resolved)**
- ✅ 관객 디폴트 인원: **20명** (포아송 디스크 임의 분포로 자동 시드, 사용자가 0~100 범위에서 즉시 변경 가능) — 2026-05-06 결정

---

*이 PRD는 v0.1 — 곽 대표의 검토 후 v1.0 확정 → 즉시 M0 셋업 시작.*
