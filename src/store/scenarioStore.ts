import { create } from 'zustand';
import type { Scenario, Room, ProjectorInstance, ProjectorSpec } from '../types/scenario';
import { DEFAULTS } from '../types/scenario';

/**
 * PRD §10.2 store.
 * M1+: 프로젝터 5대 cap, 별명, 인스턴스별 사양 편집(spec 복제 모델).
 */

const defaultRoom: Room = {
  size: { w: 8, d: 6, h: 3 },
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
  occlusion: {
    enabled: true,
    softShadow: false,
  },
};

interface UIState {
  selectedProjectorId: string | null;
}

interface ScenarioActions {
  setRoomSize: (partial: Partial<Room['size']>) => void;
  setSurfaceActive: (id: keyof Room['surfaces'], active: boolean) => void;

  /** spec을 복제해서 새 인스턴스 추가. 5대 cap 초과 시 null 반환. */
  addProjector: (
    template: ProjectorSpec,
    init?: Partial<ProjectorInstance>,
  ) => string | null;
  removeProjector: (id: string) => void;
  updateProjector: (id: string, partial: Partial<ProjectorInstance>) => void;
  /** 인스턴스에 매핑된 spec(customSpecs[i])을 부분 갱신. */
  updateSpec: (specId: string, partial: Partial<ProjectorSpec>) => void;
  selectProjector: (id: string | null) => void;

  reset: () => void;
}

const initialUI: UIState = {
  selectedProjectorId: null,
};

let nextSeq = 1;
const genId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${nextSeq++}`;

function defaultPlacement(room: Room): {
  position: [number, number, number];
  rotation: [number, number, number];
} {
  const { d, h } = room.size;
  return {
    position: [0, h * 0.9, -d * 0.4],
    rotation: [-25, 0, 0],
  };
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
        surfaces: {
          ...state.room.surfaces,
          [id]: { ...state.room.surfaces[id], active },
        },
      },
    })),

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
      const stillUsedSpecIds = new Set(remainingProjectors.map((p) => p.specId));
      // 다른 인스턴스가 안 쓰는 customSpec은 정리
      const remainingSpecs = state.customSpecs.filter(
        (s) => !removed || s.id !== removed.specId || stillUsedSpecIds.has(s.id),
      );
      return {
        projectors: remainingProjectors,
        customSpecs: remainingSpecs,
        selectedProjectorId:
          state.selectedProjectorId === id ? null : state.selectedProjectorId,
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
