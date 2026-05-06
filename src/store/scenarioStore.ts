import { create } from 'zustand';
import type {
  Scenario,
  Room,
  ProjectorInstance,
  ProjectorSpec,
  ScreenMaterialId,
} from '../types/scenario';
import { DEFAULTS } from '../types/scenario';

const defaultRoom: Room = {
  size: { w: 8, d: 6, h: 4 },
  surfaces: {
    floor: { active: true, material: 'white-matte' },
    ceiling: { active: false, material: 'white-matte' },
    front: { active: true, material: 'white-matte' },
    back: { active: false, material: 'white-matte' },
    left: { active: true, material: 'white-matte' },
    right: { active: true, material: 'white-matte' },
  },
};

export const initialScenario: Scenario = {
  version: '1',
  name: '새 시나리오',
  room: defaultRoom,
  projectors: [],
  customSpecs: [],
  people: [],
  obstacles: [],
  viewers: [],
  units: 'lux',
  sampleResolution: DEFAULTS.sampleResolution,
  customScreenGain: DEFAULTS.customScreenGain,
  occlusion: { enabled: true, softShadow: false },
};

interface UIState {
  selectedProjectorId: string | null;
}

interface ScenarioActions {
  setRoomSize: (partial: Partial<Room['size']>) => void;
  setSurfaceActive: (id: keyof Room['surfaces'], active: boolean) => void;
  /** 모든 면의 스크린 재질을 한 번에 동일하게 설정 */
  setAllSurfaceMaterial: (id: ScreenMaterialId) => void;
  setCustomScreenGain: (gain: number) => void;

  addProjector: (template: ProjectorSpec, init?: Partial<ProjectorInstance>) => string | null;
  removeProjector: (id: string) => void;
  updateProjector: (id: string, partial: Partial<ProjectorInstance>) => void;
  updateSpec: (specId: string, partial: Partial<ProjectorSpec>) => void;
  selectProjector: (id: string | null) => void;

  reset: () => void;
}

const initialUI: UIState = { selectedProjectorId: null };

let nextSeq = 1;
const genId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${nextSeq++}`;

function defaultPlacement(room: Room): {
  position: [number, number, number];
  rotation: [number, number, number];
} {
  const { d, h } = room.size;
  return { position: [0, h * 0.9, -d * 0.4], rotation: [-25, 0, 0] };
}

function defaultDisplayName(existingCount: number): string {
  return `프로젝터 ${existingCount + 1}`;
}

export const useScenarioStore = create<Scenario & UIState & ScenarioActions>((set, get) => ({
  ...initialScenario,
  ...initialUI,

  setRoomSize: (partial) =>
    set((state) => ({
      room: { ...state.room, size: { ...state.room.size, ...partial } },
    })),

  setSurfaceActive: (id, active) =>
    set((state) => ({
      room: {
        ...state.room,
        surfaces: { ...state.room.surfaces, [id]: { ...state.room.surfaces[id], active } },
      },
    })),

  setAllSurfaceMaterial: (id) =>
    set((state) => {
      const next = { ...state.room.surfaces };
      (Object.keys(next) as Array<keyof Room['surfaces']>).forEach((sid) => {
        next[sid] = { ...next[sid], material: id };
      });
      return { room: { ...state.room, surfaces: next } };
    }),

  setCustomScreenGain: (gain) => set({ customScreenGain: gain }),

  addProjector: (template, init = {}) => {
    const state = get();
    if (state.projectors.length >= DEFAULTS.maxProjectors) return null;
    const newSpecId = genId('spec');
    const clonedSpec: ProjectorSpec = { ...template, id: newSpecId };
    const placement = defaultPlacement(state.room);
    const id = genId('proj');
    const instance: ProjectorInstance = {
      id,
      specId: newSpecId,
      displayName: defaultDisplayName(state.projectors.length),
      position: placement.position,
      rotation: placement.rotation,
      zoom: 0,
      shift: { h: 0, v: 0 },
      enabled: true,
      ...init,
    };
    set((s) => ({
      projectors: [...s.projectors, instance],
      customSpecs: [...s.customSpecs, clonedSpec],
      selectedProjectorId: id,
    }));
    return id;
  },

  removeProjector: (id) =>
    set((state) => {
      const removed = state.projectors.find((p) => p.id === id);
      const remainingProjectors = state.projectors.filter((p) => p.id !== id);
      const stillUsed = new Set(remainingProjectors.map((p) => p.specId));
      const remainingSpecs = state.customSpecs.filter(
        (s) => !removed || s.id !== removed.specId || stillUsed.has(s.id),
      );
      return {
        projectors: remainingProjectors,
        customSpecs: remainingSpecs,
        selectedProjectorId: state.selectedProjectorId === id ? null : state.selectedProjectorId,
      };
    }),

  updateProjector: (id, partial) =>
    set((state) => ({
      projectors: state.projectors.map((p) => (p.id === id ? { ...p, ...partial } : p)),
    })),

  updateSpec: (specId, partial) =>
    set((state) => ({
      customSpecs: state.customSpecs.map((s) => (s.id === specId ? { ...s, ...partial } : s)),
    })),

  selectProjector: (id) => set({ selectedProjectorId: id }),

  reset: () => set({ ...initialScenario, ...initialUI }),
}));

export function useSelectedProjector(): {
  instance: ProjectorInstance | null;
  spec: ProjectorSpec | null;
} {
  const id = useScenarioStore((s) => s.selectedProjectorId);
  const projectors = useScenarioStore((s) => s.projectors);
  const customSpecs = useScenarioStore((s) => s.customSpecs);

  const instance = id ? projectors.find((p) => p.id === id) ?? null : null;
  const spec = instance ? customSpecs.find((s) => s.id === instance.specId) ?? null : null;
  return { instance, spec };
}

/**
 * 모든 면이 같은 재질(setAllSurfaceMaterial로 동기화 가정)이라는 전제 하에 현재 재질 ID 반환.
 * 면별로 달랐으면 floor의 재질을 대표값으로 사용.
 */
export function useGlobalScreenMaterialId(): ScreenMaterialId {
  return useScenarioStore((s) => s.room.surfaces.floor.material);
}

/**
 * 현재 시나리오에 적용되는 effective gain.
 * 'custom' 재질이면 customScreenGain, 그 외는 SCREEN_MATERIALS의 gain.
 */
export function effectiveGain(materialId: ScreenMaterialId, customGain: number, materials: { id: string; gain: number }[]): number {
  if (materialId === 'custom') return customGain;
  return materials.find((m) => m.id === materialId)?.gain ?? 1.0;
}
