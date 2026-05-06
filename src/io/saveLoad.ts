/**
 * PRD §FR-11 — localStorage 기반 시나리오 슬롯 저장/불러오기.
 * v1: 슬롯 이름 기반 (사용자 자유 입력), 최대 50개까지 저장 가능.
 */

import type { Scenario } from '../types/scenario';

const STORAGE_KEY = 'projstudio.scenarios.v1';

export interface SlotMeta {
  name: string;
  savedAt: string; // ISO timestamp
  /** 빠른 미리보기 — 룸 치수, 프로젝터 수 */
  summary: string;
}

interface SlotPayload extends SlotMeta {
  scenario: Scenario;
}

interface Storage {
  slots: SlotPayload[];
}

function readStorage(): Storage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { slots: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.slots)) return { slots: [] };
    return parsed as Storage;
  } catch {
    return { slots: [] };
  }
}

function writeStorage(s: Storage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function listSlots(): SlotMeta[] {
  return readStorage().slots.map((s) => ({
    name: s.name,
    savedAt: s.savedAt,
    summary: s.summary,
  }));
}

export function saveSlot(name: string, scenario: Scenario): void {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('시나리오 이름이 비어있습니다.');
  const data = readStorage();
  const summary = `룸 ${scenario.room.size.w}×${scenario.room.size.d}×${scenario.room.size.h}m · 프로젝터 ${scenario.projectors.length}대`;
  const now = new Date().toISOString();
  const cloned: Scenario = { ...scenario, name: trimmed };
  const existing = data.slots.findIndex((s) => s.name === trimmed);
  const payload: SlotPayload = { name: trimmed, savedAt: now, summary, scenario: cloned };
  if (existing >= 0) {
    data.slots[existing] = payload;
  } else {
    data.slots.push(payload);
  }
  writeStorage(data);
}

export function loadSlot(name: string): Scenario | null {
  const data = readStorage();
  const slot = data.slots.find((s) => s.name === name);
  return slot ? slot.scenario : null;
}

export function deleteSlot(name: string): void {
  const data = readStorage();
  data.slots = data.slots.filter((s) => s.name !== name);
  writeStorage(data);
}
