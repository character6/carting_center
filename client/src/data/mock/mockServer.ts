// src/data/mock/mockServer.ts

export interface Marshal {
  id: string;
  name: string;
  rating: number;
}

export interface Slot {
  id: string;
  startTime: string; // ISO 8601
  duration: number;
  trackType: 'short' | 'long';
  marshal: Marshal;
  availableSeats: number;
  totalSeats: number;
  hasEquipmentAvailable: boolean;
  basePrice: number;
  equipmentRentalPrice: number;
  status: 'available' | 'full' | 'cancelled_by_center';
  cancelReason?: string;
}

// Пул маршалов-инструкторов (из брифа — их пятеро)
const MARSHALS: Marshal[] = [
  { id: 'marshal_01', name: 'Александр', rating: 4.8 },
  { id: 'marshal_02', name: 'Мария',     rating: 4.9 },
  { id: 'marshal_03', name: 'Дмитрий',   rating: 4.5 },
  { id: 'marshal_04', name: 'Елена',     rating: 4.7 },
  { id: 'marshal_05', name: 'Сергей',    rating: 4.3 },
];

const TRACK_TYPES: Array<'short' | 'long'> = ['short', 'long'];
const START_HOURS = [10, 12, 14, 16, 18, 20];
const CANCEL_REASONS = [
  'Сильный дождь',
  'Гололёд на трассе',
  'Технические работы',
  'Штормовое предупреждение',
];

// Детерминированный "псевдо-рандом" на базе seed, чтобы моки не прыгали между ререндерами
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Генерация слотов один раз при старте модуля
export function generateSlots(): Slot[] {
  const rand = seededRandom(42);
  const slots: Slot[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let slotIndex = 0;

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);

    // 2–3 слота в день
    const slotsPerDay = dayOffset === 0 ? 2 : 2 + Math.floor(rand() * 2);
    const hours = [...START_HOURS].sort(() => rand() - 0.5).slice(0, slotsPerDay);

    for (const hour of hours) {
      const startTime = new Date(date);
      startTime.setHours(hour, 0, 0, 0);

      const marshal = MARSHALS[Math.floor(rand() * MARSHALS.length)];
      const trackType = TRACK_TYPES[Math.floor(rand() * TRACK_TYPES.length)];
      const totalSeats = 14;

      // Распределяем статусы: ~70% available, ~15% full, ~15% cancelled
      const r = rand();
      let status: Slot['status'];
      let availableSeats: number;
      let cancelReason: string | undefined;

      if (r < 0.7) {
        status = 'available';
        // от 1 до 12 свободных мест (чтобы не было слишком пусто)
        availableSeats = 1 + Math.floor(rand() * 12);
      } else if (r < 0.85) {
        status = 'full';
        availableSeats = 0;
      } else {
        status = 'cancelled_by_center';
        availableSeats = 0;
        cancelReason = CANCEL_REASONS[Math.floor(rand() * CANCEL_REASONS.length)];
      }

      slots.push({
        id: `slot_${String(slotIndex + 1).padStart(3, '0')}`,
        startTime: startTime.toISOString(),
        duration: 20,
        trackType,
        marshal,
        availableSeats,
        totalSeats,
        hasEquipmentAvailable: rand() > 0.15, // 85% слотов с экипировкой
        basePrice: trackType === 'long' ? 1800 : 1500,
        equipmentRentalPrice: 500,
        status,
        cancelReason,
      });

      slotIndex++;
    }
  }

  // Сортируем по времени старта
  return slots.sort((a, b) =>
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
}

const MOCK_SLOTS: Slot[] = generateSlots();

// Имитация сетевой задержки
function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Получить слоты в диапазоне [from, to].
 * Даты передаются в ISO 8601 (или как строки от input[type=date] — "YYYY-MM-DD").
 */
export async function getSlots(from: string, to: string): Promise<Slot[]> {
  await delay(300 + Math.random() * 400);

  const fromDate = new Date(from);
  fromDate.setHours(0, 0, 0, 0);

  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  return MOCK_SLOTS.filter((slot) => {
    const t = new Date(slot.startTime).getTime();
    return t >= fromDate.getTime() && t <= toDate.getTime();
  });
}

// ==========================================
// Фича 2: Бронирование
// ==========================================

export interface CreateBookingRequest {
  slotId: string;
  equipmentType: 'own' | 'rental';
  skillLevel: 'beginner' | 'experienced';
}

export interface Booking {
  id: string;
  slotId: string;
  userId: string;
  equipmentType: 'own' | 'rental';
  skillLevel: 'beginner' | 'experienced';
  status: 'active' | 'completed' | 'cancelled_by_client' | 'cancelled_by_center';
  totalPrice: number;
  createdAt: string;
  cancelReason?: string;
  marshalRating?: number;
  marshalComment?: string;
}

// Получить все слоты (для поиска конкретного слота по ID)
let allSlotsCache: Slot[] | null = null;

async function getAllSlots(): Promise<Slot[]> {
  if (!allSlotsCache) {
    allSlotsCache = generateSlots();  // ✅ без параметров
  }
  return allSlotsCache;
}

// Создать бронирование
export async function createBooking(request: CreateBookingRequest): Promise<Booking> {
  await delay(500); // имитация задержки сети

  // С вероятностью 10% возвращаем ошибку NOVICE_LIMIT_EXCEEDED
  if (Math.random() < 0.1) {
    throw {
      error: {
        code: 'NOVICE_LIMIT_EXCEEDED',
        message: 'Превышен лимит новичков на этот заезд (максимум 8)',
      },
    };
  }

  // Получаем все слоты, чтобы найти нужный
  const allSlots = await getAllSlots();
  const slot = allSlots.find((s) => s.id === request.slotId);

  if (!slot) {
    throw {
      error: {
        code: 'SLOT_NOT_FOUND',
        message: 'Слот не найден',
      },
    };
  }

  // Считаем итоговую стоимость
  const totalPrice =
    slot.basePrice + (request.equipmentType === 'rental' ? slot.equipmentRentalPrice : 0);

  // Создаём объект брони
  const booking: Booking = {
    id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    slotId: request.slotId,
    userId: 'user_demo', // для учебного проекта — фиктивный пользователь
    equipmentType: request.equipmentType,
    skillLevel: request.skillLevel,
    status: 'active',
    totalPrice,
    createdAt: new Date().toISOString(),
  };

  // Сохраняем в localStorage
  const existingBookings = getMyBookings();
  existingBookings.push(booking);
  localStorage.setItem('bookings', JSON.stringify(existingBookings));

  return booking;
}

// Получить все мои брони из localStorage
export function getMyBookings(): Booking[] {
  const data = localStorage.getItem('bookings');
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}