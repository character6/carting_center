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

import { createBooking as mockCreateBooking, type CreateBookingRequest, type Booking } from '../mock/mockServer';

// Создать бронирование
export async function createBooking(request: CreateBookingRequest): Promise<Booking> {
  try {
    return await mockCreateBooking(request);
  } catch (error: any) {
    // Если это ошибка API (с полем error)
    if (error?.error?.code) {
      throw new Error(error.error.message);
    }
    // Иначе — общая ошибка
    throw new Error('Не удалось создать бронирование. Попробуйте ещё раз.');
  }
}

import { cancelBooking as mockCancelBooking } from '../mock/mockServer';

// Отменить бронирование
export async function cancelBooking(bookingId: string): Promise<{ success: boolean }> {
  try {
    return await mockCancelBooking(bookingId);
  } catch (error: any) {
    if (error?.error?.code) {
      throw new Error(error.error.message);
    }
    throw new Error('Не удалось отменить бронирование. Попробуйте ещё раз.');
  }
}