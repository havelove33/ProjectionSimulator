import { useScenarioStore } from '../store/scenarioStore';

export default function TopBar() {
  const name = useScenarioStore((s) => s.name);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-neutral-800 bg-panel px-4 text-sm">
      <div className="flex items-center gap-3">
        <span className="font-semibold tracking-tight">Projection Simulator</span>
        <span className="text-neutral-500">v0.1 · M0</span>
        <span className="text-neutral-400">/ {name}</span>
      </div>
      <div className="flex items-center gap-2 text-neutral-400">
        <button className="rounded px-2 py-1 hover:bg-neutral-800" disabled>
          저장
        </button>
        <button className="rounded px-2 py-1 hover:bg-neutral-800" disabled>
          불러오기
        </button>
        <button className="rounded px-2 py-1 hover:bg-neutral-800" disabled>
          공유
        </button>
        <button className="rounded px-2 py-1 hover:bg-neutral-800" disabled>
          Export
        </button>
      </div>
    </header>
  );
}
