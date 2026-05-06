import { create } from 'zustand';
import type { Scenario, Room } from '../types/scenario';
import { DEFAULTS } from '../types/scenario';

/**
 * PRD §10.2 store — M0에서는 룸 치수 갱신만 우선 동작.
 * 프로젝터/관객/스윗스팟 액션은 후속 마일스톤에서 추가.
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
  people: [], // M6에서 자동 시드(20명) 적용 예정
  obstacles: [],
  viewers: [],
  units: 'lux',
  sampleResolution: DEFAULTS.sampleResolution,
  occlusion: {
    enabled: true,
    softShadow: false,
  },
};

interface ScenarioActions {
  setRoomSize: (partial: Partial<Room['size']>) => void;
  reset: () => void;
}

export const useScenarioStore = create<Scenario & ScenarioActions>((set) => ({
  ...initialScenario,
  setRoomSize: (partial) =>
    set((state) => ({
      room: {
        ...state.room,
        size: { ...state.room.size, ...partial },
      },
    })),
  reset: () => set({ ...initialScenario }),
}));
