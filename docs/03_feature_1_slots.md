# Задание 3.1: Реализация фичи «Просмотр слотов на 7 дней»

## Цель
Реализовать экран просмотра расписания заездов картинг-центра «Апекс» с отображением слотов на ближайшие 7 дней, фильтрацией по датам и корректной обработкой всех статусов слотов (доступен / мест нет / отменён центром).

## Требования (из файла 01_analytics_requirements.md)
- **FR-01.1**: Отображать список доступных заездов на ближайшие 7 дней по умолчанию.
- **FR-01.2**: Для каждого слота показывать: время старта, длительность, тип трассы, имя маршала, свободные места, статус экипировки, стоимость.
- **FR-01.3**: Фильтрация слотов по датам за пределами 7-дневного окна.
- **FR-01.4**: Empty State «Пока нет доступных заездов» при отсутствии расписания.
- **US-01**: Как клиент, я хочу видеть свободные слоты на неделю вперёд с указанием цены и типа трассы.

## Промпт для ИИ

```text
Ты — Senior Frontend Developer. Тебе нужно реализовать Фичу 1 клиентского мобильного приложения картинг-центра «Апекс»: «Просмотр слотов на 7 дней».

КОНТЕКСТ:
- Бэкенд — black-box, его нет. Для локальной разработки используем mock-сервер.
- Стек: React (Vite) + TypeScript + Tailwind CSS. Это веб-прототип мобильного приложения.
- Архитектура: Clean Architecture (Presentation / Domain / Data).
- Контракт API уже описан (интерфейс Slot).

ФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ (FR-01):
- FR-01.1: Отображать список слотов на 7 дней по умолчанию.
- FR-01.2: Для каждого слота показывать: время старта, длительность, тип трассы, имя маршала, свободные места, статус экипировки, стоимость.
- FR-01.3: Фильтр по датам за пределами 7-дневного окна.
- FR-01.4: Empty state «Пока нет доступных заездов», если слотов нет.

ЗАДАЧА:
1. Mock-сервер (mockServer.ts) — имитация API с генерацией слотов.
2. API Client (api.ts) — обёртка над mock-сервером.
3. React-компонент SlotsList.tsx с карточками слотов и фильтром по датам.
```

## Структура проекта

```text

client/src/
├── data/
│   ├── api/
│   │   └── api.ts                 ← API-клиент
│   └── mock/
│       └── mockServer.ts          ← Mock-сервер (имитация black-box бэкенда)
├── presentation/
│   └── components/
│       └── SlotsList.tsx          ← Компонент списка слотов
└── App.tsx                        ← Точка подключения
```

## Ключевые фрагменты реализации
### 1. Тип данных Slot (контракт API)

```TypeScript
export interface Slot {
  id: string;
  startTime: string;
  duration: number;
  trackType: 'short' | 'long';
  marshal: { id: string; name: string; rating: number };
  availableSeats: number;
  totalSeats: number;
  hasEquipmentAvailable: boolean;
  basePrice: number;
  equipmentRentalPrice: number;
  status: 'available' | 'full' | 'cancelled_by_center';
  cancelReason?: string;
}
```

### 2. Mock-сервер (имитация GET /slots)

```TypeScript
export async function getSlotsFromServer(from: string, to: string): Promise<Slot[]> {
  await delay(400); // имитация сетевой задержки
  const fromDate = new Date(from);
  const toDate = new Date(to);
  return generateSlots(fromDate, toDate);
}
```
Генерирует 4 слота в день (10:00, 14:00, 18:00, 20:00) со случайным заполнением, разными маршалами, типами трасс и корректными статусами (в т.ч. ~5% слотов со статусом cancelled_by_center с причиной «Сильный дождь» или «Технические работы»).

### 3. Обработка состояний в SlotsList.tsx
```tsx
// Загрузка по умолчанию — 7 дней (FR-01.1)
const defaultTo = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

useEffect(() => {
  fetchSlots(from, to)
    .then((data) => setSlots(data))
    .catch((e) => setError(e?.message ?? 'Не удалось загрузить расписание'))
    .finally(() => setLoading(false));
}, [from, to]);
```
* Loading state: спиннер во время запроса (NFT-01).
* Error state: сообщение об ошибке пользователю (NFT-02).
* Empty state: сообщение «Пока нет доступных заездов» (FR-01.4).

### 4. Отображение карточки слота (FR-01.2)

Каждая карточка показывает:
* Дату (weekday + day + month) и время старта
* Тип трассы (бейдж «Длинная» / «Короткая»)
* Маршала (аватар-инициал + имя + рейтинг ★)
* Свободные места (X / 14 мест)
* Статус экипировки
* Базовую цену + опционально тариф за прокат
* Кнопку «Записаться» (заблокирована для full и cancelled_by_center)

Для слотов со статусом cancelled_by_center отображается красная плашка с причиной отмены.

## Коммит

(https://github.com/character6/carting_center/commit/d3fe092be95f63f006f7e3a1b176a6c8d254a94b)