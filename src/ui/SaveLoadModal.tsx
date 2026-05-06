import { useState } from 'react';
import { useScenarioStore } from '../store/scenarioStore';
import { saveSlot, loadSlot, listSlots, deleteSlot, type SlotMeta } from '../io/saveLoad';

type Mode = 'save' | 'load';

export default function SaveLoadModal({ mode, onClose }: { mode: Mode; onClose: () => void }) {
  const getSnapshot = useScenarioStore((s) => s.getScenarioSnapshot);
  const loadScenario = useScenarioStore((s) => s.loadScenario);
  const currentName = useScenarioStore((s) => s.name);

  const [slots, setSlots] = useState<SlotMeta[]>(() => listSlots());
  const [nameInput, setNameInput] = useState(currentName === '새 시나리오' ? '' : currentName);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => setSlots(listSlots());

  const onSave = () => {
    try {
      const trimmed = nameInput.trim();
      if (!trimmed) {
        setError('시나리오 이름을 입력하세요.');
        return;
      }
      const snap = getSnapshot();
      saveSlot(trimmed, snap);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    }
  };

  const onLoad = (name: string) => {
    const sc = loadSlot(name);
    if (sc) {
      loadScenario(sc);
      onClose();
    }
  };

  const onDelete = (name: string) => {
    if (!confirm(`'${name}' 슬롯을 삭제하시겠습니까?`)) return;
    deleteSlot(name);
    refresh();
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-neutral-700 bg-neutral-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <h2 className="text-base font-semibold text-neutral-100">
            {mode === 'save' ? '시나리오 저장' : '시나리오 불러오기'}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {mode === 'save' && (
          <div className="mb-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-neutral-400">시나리오 이름 (같은 이름이면 덮어쓰기)</span>
              <input
                className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-emerald-600"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setError(null);
                }}
                placeholder="예: 4면 5대 시나리오 v1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSave();
                }}
              />
            </label>
            {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
            <button
              onClick={onSave}
              className="mt-3 w-full rounded bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              저장
            </button>
          </div>
        )}

        <div>
          <div className="mb-2 text-xs font-medium text-neutral-400">
            {mode === 'load' ? '저장된 슬롯' : `저장된 슬롯 (${slots.length}개)`}
          </div>
          {slots.length === 0 && (
            <div className="rounded border border-dashed border-neutral-800 p-4 text-center text-xs text-neutral-500">
              저장된 시나리오가 없습니다.
            </div>
          )}
          <ul className="max-h-[50vh] space-y-1 overflow-y-auto">
            {slots
              .slice()
              .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
              .map((s) => (
                <li
                  key={s.name}
                  className="flex items-center gap-2 rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs hover:border-neutral-600"
                >
                  <button
                    className="flex-1 truncate text-left"
                    onClick={() => mode === 'load' ? onLoad(s.name) : setNameInput(s.name)}
                    title={mode === 'load' ? '이 슬롯 불러오기' : '이 이름으로 입력'}
                  >
                    <div className="font-medium text-neutral-100">{s.name}</div>
                    <div className="text-[10px] text-neutral-500">
                      {formatTime(s.savedAt)} · {s.summary}
                    </div>
                  </button>
                  {mode === 'load' && (
                    <button
                      onClick={() => onLoad(s.name)}
                      className="rounded bg-emerald-700 px-2 py-1 text-[11px] text-white hover:bg-emerald-600"
                    >
                      불러오기
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(s.name)}
                    className="rounded p-1 text-neutral-500 hover:text-red-400"
                    title="삭제"
                  >
                    ✕
                  </button>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
