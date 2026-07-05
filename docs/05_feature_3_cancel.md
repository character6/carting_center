# Задание 3.3: Реализация фичи «Отмена брони и Мои заезды»

## Цель
Реализовать экран «Мои заезды» со списком бронирований пользователя, возможностью отмены активной брони с проверкой бизнес-правила «2 часа до старта» и корректным отображением всех статусов (активна / отменена клиентом / отменена центром).

## Требования (из файла 01_analytics_requirements.md)
- **FR-03.1**: Пользователь может отменить свою активную запись через приложение не позднее чем за 2 часа до времени старта.
- **FR-03.2**: Если до старта осталось менее 2 часов, кнопка отмены в интерфейсе должна быть заблокирована.
- **FR-03.3**: В случае отмены заезда центром (погода/поломка), запись получает статус «Отменён центром» с указанием причины.
- **US-04**: Как ответственный клиент, я хочу иметь возможность отменить запись за 2 часа до старта, чтобы освободить место для других.
- **US-07**: Как клиент, я хочу видеть статус «Отменён центром» с причиной в своих записях.
- **UC-02**: Сценарий отмены заезда клиентом.

## Промпт для ИИ
```text
Ты — Senior Frontend Developer. Реализуй Фичу 3 «Отмена брони и Мои заезды» для приложения картинг-центра «Апекс».

КОНТЕКСТ:
- Фичи 1 и 2 уже реализованы. Брони сохраняются в localStorage под ключом 'bookings'.
- Стек: React + TypeScript + Tailwind CSS.
- Бэкенд — black-box, используем mock-сервер.

ЧТО НУЖНО:
1. В mockServer.ts добавь функцию cancelBooking(bookingId), которая проверяет правило "2 часа до старта" и возвращает ошибку CANCEL_TOO_LATE, если правило нарушено. Также добавь вспомогательную функцию canCancelBooking(booking, slot) для UI.
2. В api.ts добавь функцию cancelBooking, которая вызывает mock-сервер и обрабатывает ошибки.
3. Создай компонент MyBookings.tsx — экран со списком бронирований, кнопкой "Отменить" (заблокированной, если < 2 часов до старта), отображением статусов.
4. Обнови App.tsx — добавь навигацию между "Расписание" и "Мои заезды".

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
│   │   └── api.ts                 ← добавлена функция cancelBooking()
│   └── mock/
│       └── mockServer.ts          ← добавлены функции cancelBooking(), canCancelBooking()
├── presentation/
│   └── components/
│       ├── SlotsList.tsx          ← без изменений
│       ├── BookingModal.tsx       ← без изменений
│       ├── BookingConfirmation.tsx ← без изменений
│       └── MyBookings.tsx         ← НОВЫЙ: экран "Мои заезды"
└── App.tsx                        ← ОБНОВЛЁН: добавлена навигация
```

## Ключевые фрагменты реализации
### 1. Mock-сервер: отмена брони с проверкой правила

```TypeScript
export async function cancelBooking(bookingId: string): Promise<{ success: boolean }> {
  await delay(400);

  const bookings = getMyBookings();
  const booking = bookings.find((b) => b.id === bookingId);

  if (!booking) {
    throw { error: { code: 'BOOKING_NOT_FOUND', message: 'Бронирование не найдено' } };
  }

  if (booking.status !== 'active') {
    throw { error: { code: 'BOOKING_NOT_ACTIVE', message: 'Бронирование уже не активно' } };
  }

  // Получаем слот и проверяем правило "2 часа до старта" (FR-03.1)
  const allSlots = await getAllSlots();
  const slot = allSlots.find((s) => s.id === booking.slotId);
  const startTime = new Date(slot.startTime);
  const now = new Date();
  const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilStart < 2) {
    throw {
      error: {
        code: 'CANCEL_TOO_LATE',
        message: 'Отмена возможна не позднее чем за 2 часа до старта',
      },
    };
  }
  // Обновляем статус
  const updatedBookings = bookings.map((b) =>
    b.id === bookingId ? { ...b, status: 'cancelled_by_client' as const } : b
  );
  localStorage.setItem('bookings', JSON.stringify(updatedBookings));

  return { success: true };
}
// Вспомогательная функция для UI (блокировка кнопки)
export function canCancelBooking(booking: Booking, slot: Slot): boolean {
  if (booking.status !== 'active') return false;
  const startTime = new Date(slot.startTime);
  const now = new Date();
  const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilStart >= 2;
}
```

### 2. Экран «Мои заезды» (MyBookings.tsx)

* Загружает список броней из localStorage и слоты из API.
* Для каждой брони показывает: дату/время, трассу, маршала, экипировку, уровень, цену.
* Кнопка «Отменить» активна только если canCancelBooking() возвращает true.
* Если до старта < 2 часов — кнопка заблокирована с подписью «Нельзя отменить» и подсказкой.
* Отображает статусы:
    * active — обычная карточка
    * cancelled_by_client — серая плашка «Отменено вами»
    * cancelled_by_center — красная плашка с причиной (FR-03.3)
* При успешной отмене — зелёное сообщение «✓ Бронирование успешно отменено».
* При ошибке — красное сообщение с текстом ошибки.

### 3. Навигация в App.tsx
```tsx
const [currentView, setCurrentView] = useState<'slots' | 'myBookings'>('slots');

<nav className="fixed top-0 left-0 right-0 bg-white border-b">
  <div className="max-w-md mx-auto px-4 py-3 flex gap-2">
    <button onClick={() => setCurrentView('slots')}>📅 Расписание</button>
    <button onClick={() => setCurrentView('myBookings')}>📋 Мои заезды</button>
  </div>
</nav>
```

## Коммит

(https://github.com/character6/carting_center/commit/1faf73dfeb4a1ce9100305f697c228b429d8f3f1)
