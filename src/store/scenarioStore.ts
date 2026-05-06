import { create } from 'zustand';
import type { Scenario, Room, ProjectorInstance, ProjectorSpec } from '../types/scenario';
import { DEFAULTS } from '../types/scenario';

/**
 * PRD §10.2 store.
 * M1: 프로젝터 추가/선택/위치·회전·줌·시프트 갱신·삭제 + 단일 프로젝터 frustum 컨텍스트.
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

  addProjector: (spec: ProjectorSpec, init?: Partial<ProjectorInstance>) => string;
  removeProjector: (id: string) => void;
  updateProjector: (id: string, partial: Partial<ProjectorInstance>) => void;
  selectProjector: (id: string | null) => void;

  reset: () => void;
}

const initialUI: UIState = {
  selectedProjectorId: null,
};

let nextId = 1;
const genId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${nextId++}`;

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

export const useScenarioStore = create<Scenario & UIState & ScenarioActions>((set, get) => ({
  ...initialScenario,
  ...initialUI,

  setRoomSize: (partial) =>
    set((state) => ({
      room: {
        ...state.room,
        size: { ...state.room.size, ...partial },
      },
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

  addProjector: (spec, init = {}) => {
    const id = genId('proj');
    const placement = defaultPlacement(get().room);
    const instance: ProjectorInstance = {
      id,
      specId: spec.id,
      position: placement.position,
      rotation: placement.rotation,
      zoom: 0,
      shift: { h: 0, v: 0 },
      enabled: true,
      ...init,
    };
    set((state) => ({
      projectors: [...state.projectors, instance],
      customSpecs: state.customSpecs.find((s) => s.id === spec.id)
        ? state.customSpecs
        : [...state.customSpecs, spec],
      selectedProjectorId: id,
    }));
    return id;
  },

  removeProjector: (id) =>
    set((state) => ({
      projectors: state.projectors.filter((p) => p.id !== id),
      selectedProjectorId: state.selectedProjectorId === id ? null : state.selectedProjectorId,
    })),

  updateProjector: (id, partial) =>
    set((state) => ({
      projectors: state.projectors.map((p) => (p.id === id ? { ...p, ...partial } : p)),
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
