// src/data/api/api.ts

import { getSlots, type Slot } from '../mock/mockServer';

/**
 * Получить список слотов.
 * Если даты не переданы — берём диапазон "сегодня → +7 дней" (FR-01.1).
 */
export async function fetchSlots(from?: string, to?: string): Promise<Slot[]> {
  const fromDate = from ?? new Date().toISOString();
  const toDate =
    to ??
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return getSlots(fromDate, toDate);
}