# Задание 3.2: Реализация фичи «Бронирование слота»

## Цель
Реализовать модальное окно бронирования слота с выбором экипировки и уровня подготовки, динамическим расчётом итоговой стоимости, обработкой бизнес-ошибок (лимит новичков) и экраном подтверждения записи.

## Требования (из файла 01_analytics_requirements.md)
- **FR-02.1**: При выборе слота пользователь обязан выбрать тип экипировки: «Своя» или «Прокат».
- **FR-02.2**: Пользователь указывает свой уровень подготовки: «Новичок» или «Опытный».
- **FR-02.3**: При ошибке NOVICE_LIMIT_EXCEEDED — показать понятное сообщение пользователю.
- **FR-02.4**: Бронь создаётся только после успешного ответа API.
- **FR-04.1**: Перед подтверждением показывать итоговую стоимость (база + прокат).
- **FR-05.1**: После успешного бронирования — имитация push-уведомления «Запись подтверждена».
- **US-02**: Как клиент, я хочу указать при записи, нужна ли мне прокатная экипировка.
- **US-03**: Как клиент, я хочу самостоятельно указывать свой уровень подготовки.

## Промпт для ИИ
```text
Ты — Senior Frontend Developer. Реализуй Фичу 2 «Бронирование слота» для приложения картинг-центра «Апекс».

КОНТЕКСТ:
- Фича 1 (просмотр слотов) уже реализована. В SlotsList.tsx есть кнопка «Записаться» — сейчас она ничего не делает.
- Стек: React + TypeScript + Tailwind CSS.
- Бэкенд — black-box, используем mock-сервер.

ЧТО НУЖНО:
1. В mockServer.ts добавь функцию createBooking(request), которая имитирует задержку 500 мс, с вероятностью 10% возвращает ошибку NOVICE_LIMIT_EXCEEDED, сохраняет бронь в localStorage.
2. В api.ts добавь функцию createBooking(request), которая вызывает mock-сервер и обрабатывает ошибку.
3. Создай BookingModal.tsx — модальное окно с переключателями экипировки и уровня, динамическим отображением итоговой стоимости, обработкой ошибки NOVICE_LIMIT_EXCEEDED.
4. Создай BookingConfirmation.tsx — экран с галочкой ✓, карточкой деталей брони, toast-уведомлением «📩 Запись подтверждена» (автоскрытие через 4 сек).
5. Интегрируй в SlotsList.tsx — добавь состояние для открытия модалки и подключи кнопку «Записаться».

ВАЖНО:
- Код должен быть рабочим
- Используй только React + Tailwind
- Ответ оформи как Markdown-файл
```

## Структура проекта

```text

client/src/
├── data/
│   ├── api/
│   │   └── api.ts                 ← добавлена функция createBooking()
│   └── mock/
│       └── mockServer.ts          ← добавлены интерфейсы Booking, CreateBookingRequest,
│                                    функции createBooking(), getMyBookings()
├── presentation/
│   └── components/
│       ├── SlotsList.tsx          ← интегрирована модалка и экран подтверждения
│       ├── BookingModal.tsx       ← НОВЫЙ: модальное окно бронирования
│       └── BookingConfirmation.tsx ← НОВЫЙ: экран подтверждения
└── App.tsx
```

## Ключевые фрагменты реализации
### 1. Тип данных Booking (контракт API)

```TypeScript
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

export interface CreateBookingRequest {
  slotId: string;
  equipmentType: 'own' | 'rental';
  skillLevel: 'beginner' | 'experienced';
}
```

### 2. Mock-сервер: создание брони

```TypeScript
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

  // Получаем слот, считаем итоговую стоимость
  const allSlots = await getAllSlots();
  const slot = allSlots.find((s) => s.id === request.slotId);
  const totalPrice = slot.basePrice + (request.equipmentType === 'rental' ? slot.equipmentRentalPrice : 0);

  const booking: Booking = { /* ... */ };

  // Сохраняем в localStorage (для Фичи 3 «Мои заезды»)
  const existingBookings = getMyBookings();
  existingBookings.push(booking);
  localStorage.setItem('bookings', JSON.stringify(existingBookings));

  return booking;
}
```
### 3. Обработка ошибки в API-клиенте
```TypeScript
export async function createBooking(request: CreateBookingRequest): Promise<Booking> {
  try {
    return await mockCreateBooking(request);
  } catch (error: any) {
    if (error?.error?.code) {
      throw new Error(error.error.message);
    }
    throw new Error('Не удалось создать бронирование. Попробуйте ещё раз.');
  }
}
```
### 4. Модальное окно BookingModal.tsx

* Два переключателя: экипировка (Своя / Прокат) и уровень (Новичок / Опытный).
* Динамический расчёт итоговой стоимости: basePrice + (rental ? equipmentRentalPrice : 0).
* При ошибке NOVICE_LIMIT_EXCEEDED отображается сообщение: «На этот заезд уже записалось слишком много новичков».
* Кнопка «Подтвердить» блокируется во время загрузки (FR-02.4).

## 5. Экран подтверждения BookingConfirmation.tsx

* Галочка ✓ и заголовок «Запись подтверждена!».
* Карточка с деталями: дата/время, трасса, маршал, экипировка, уровень, итоговая цена.
* Toast-уведомление «📩 Запись подтверждена. Ждём вас!» с автоскрытием через 4 секунды (FR-05.1).
* Кнопка «Вернуться к расписанию».

## 6. Интеграция в SlotsList.tsx

```tsx 
const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
const [confirmedBooking, setConfirmedBooking] = useState<{slot: Slot; booking: Booking} | null>(null);

// Кнопка «Записаться» открывает модалку
<SlotCard slot={slot} onBook={() => setSelectedSlot(slot)} />

// После успеха — показываем экран подтверждения
{selectedSlot && (
  <BookingModal
    slot={selectedSlot}
    onClose={() => setSelectedSlot(null)}
    onSuccess={(booking) => {
      setConfirmedBooking({ slot: selectedSlot, booking });
      setSelectedSlot(null);
    }}
  />
)}
```

## Коммит

(https://github.com/character6/carting_center/commit/5ca1c89ff1a49e1caf51589eebd2821f4beead0c)