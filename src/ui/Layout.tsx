import Scene from '../scene/Scene';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import TopBar from './TopBar';

/**
 * PRD §8 정보 구조 — 좌(컨트롤) / 중앙(3D 뷰포트) / 우(결과)
 * M0 단계에서는 패널들이 placeholder 상태이며, M1 이후 채워진다.
 */
export default function Layout() {
  return (
    <div className="flex h-full w-full flex-col bg-neutral-950 text-neutral-100">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-neutral-800 bg-panel">
          <LeftPanel />
        </aside>
        <main className="relative flex-1 bg-neutral-900">
          <Scene />
        </main>
        <aside className="w-80 shrink-0 overflow-y-auto border-l border-neutral-800 bg-panel">
          <RightPanel />
        </aside>
      </div>
    </div>
  );
}
