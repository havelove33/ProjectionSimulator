# Projection Simulator

다면 프로젝션 미디어아트 시뮬레이터 — 룸 구성, 프로젝터 배치, 광도 계산, 관객 차폐, off-axis 뷰어 스윗스팟까지.

> 자세한 제품 사양과 설계는 [PRD.md](./PRD.md) 참조.

## 데모

배포: <https://havelove33.github.io/ProjectionSimulator/>
(`main` 브랜치에 푸시될 때마다 GitHub Actions가 자동 배포합니다.)

## 빠른 시작

```bash
npm install
npm run dev          # http://localhost:5173
```

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 (Vite) |
| `npm run build` | 프로덕션 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 로컬 미리보기 |
| `npm test` | 단위 테스트 1회 실행 (Vitest) |
| `npm run test:watch` | 단위 테스트 watch 모드 |
| `npm run lint` | ESLint |
| `npm run format` | Prettier 포맷터 |

## 기술 스택

- React 18 + TypeScript + Vite
- Three.js + @react-three/fiber + @react-three/drei
- Tailwind CSS + zustand
- Vitest (단위 테스트, 광도학 계산 검증)
- GitHub Actions → GitHub Pages 자동 배포

## 마일스톤 진행 상황

- [x] **M0** 프로젝트 셋업 + 자동 배포
- [ ] **M1** 룸 + 단일 프로젝터 frustum
- [ ] **M2** 광도학 계산 코어 (lux/nit, 히트맵)
- [ ] **M3** 다중 프로젝터 합산 / 겹침 / 균일도
- [ ] **M4** 사양 라이브러리 + UX
- [ ] **M5** 뷰어 스윗스팟 + Off-axis 매트릭스
- [ ] **M6** 관객 배치 + 그림자 차폐
- [ ] **M7** 저장 / 공유 / Export
- [ ] **M8** 베타 테스트 + 4면 시나리오 검증
- [ ] **M9** v1.0 릴리스

## 라이선스

MIT (예정). 시드 프로젝터 라이브러리는 카탈로그 공칭치 기반이며, 출처는 `src/data/projectors.ts`에 명시.
