import { useState } from 'react';
import { useScenarioStore } from '../store/scenarioStore';
import SaveLoadModal from './SaveLoadModal';

export default function TopBar() {
  const name = useScenarioStore((s) => s.name);
  const [modal, setModal] = useState<'save' | 'load' | null>(null);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-neutral-800 bg-panel px-4 text-sm">
      <div className="flex items-center gap-3">
        <span className="font-semibold tracking-tight">Projection Simulator</span>
        <span className="text-neutral-500">v0.1 · M1</span>
        <span className="text-neutral-400">/ {name}</span>
      </div>
      <div className="flex items-center gap-2 text-neutral-300">
        <button
          onClick={() => setModal('save')}
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs hover:border-emerald-600 hover:text-emerald-400"
        >
          저장
        </button>
        <button
          onClick={() => setModal('load')}
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs hover:border-emerald-600 hover:text-emerald-400"
        >
          불러오기
        </button>
      </div>

      {modal && <SaveLoadModal mode={modal} onClose={() => setModal(null)} />}
    </header>
  );
}
