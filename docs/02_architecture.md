# Задание 2: Архитектурный план и схема данных

## Промпт для ИИ
> «Ты — Senior Mobile Architect. Сформируй архитектурный план и схему данных для клиентского мобильного приложения картинг-центра «Апекс» на основе прикреплённых файлов (бриф заказчика и функциональные требования). Привяжись к функциональным требованиям FR-01…FR-06 из файла требований. Оформи ответ в виде Markdown-файла со структурой: 1. Архитектурный план клиентского приложения (слои, стек, привязка к FR) 2. Схема данных (контракт API в виде TypeScript-интерфейсов) 3. REST-эндпоинты (таблицы с методами, путями и описаниями) 4. Примеры JSON-ответов для ключевых сценариев»

## Коммит



## 1. Архитектурный план клиентского приложения

### 1.1. Архитектура
Для клиентского мобильного приложения используется **Clean Architecture** с паттерном **MVVM**:

- **Presentation Layer**: UI-компоненты (React Native), ViewModel/StateHolder. Отображение данных и обработка пользовательских событий.
- **Domain Layer**: Use Cases (бизнес-логика). Независимы от UI и источников данных.
- **Data Layer**: Repositories, API Client. Получение данных из REST API и локальное кэширование.

### 1.2. Технологический стек
- **Фреймворк**: React Native (кроссплатформенное мобильное приложение)
- **Язык**: TypeScript
- **State Management**: React Query (для работы с API и кэшированием)
- **HTTP-клиент**: Axios с интерсепторами для JWT-токенов
- **Безопасное хранение**: Keychain (iOS) / EncryptedSharedPreferences (Android) для токенов
- **Push-уведомления**: FCM (Firebase Cloud Messaging)

### 1.3. Привязка к функциональным требованиям (FR)
- **FR-01 (Просмотр слотов)**: SlotsRepository загружает слоты на 7 дней, кэширует локально.
- **FR-02 (Бронирование)**: BookingRepository отправляет запрос с equipmentType и skillLevel, обрабатывает ошибку "Лимит новичков".
- **FR-03 (Отмена)**: Проверяет правило "2 часа до старта" на клиенте, блокирует кнопку.
- **FR-04 (Оплата)**: Отображает итоговую стоимость (база + прокат), без онлайн-оплаты.
- **FR-05 (Уведомления)**: Регистрация push-токена, обработка уведомлений об отмене центра, оценка маршала.
- **FR-06 (Профиль)**: Авторизация по SMS, отображение истории заездов и статуса лояльности.

---


## 2. Схема данных (контракт API)

TypeScript-интерфейсы, описывающие DTO для контракта API. Бэкенд — black-box, схема описывает только то, что клиент ожидает получить и отправить.

```typescript

// ==========================================
// Базовые обертки ответов API
// ==========================================
export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// ==========================================
// FR-06: Пользователь и Авторизация
// ==========================================
export interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  loyaltyStatus: 'regular' | 'frequent';
  totalRides: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SendSmsCodeRequest {
  phone: string;
}

export interface VerifySmsCodeRequest {
  phone: string;
  code: string;
}

// ==========================================
// FR-01: Слоты и Расписание
// ==========================================
export interface Marshal {
  id: string;
  name: string;
  rating: number;
}

export interface Slot {
  id: string;
  startTime: string;
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

export interface GetSlotsRequest {
  from: string;
  to: string;
}

// ==========================================
// FR-02 и FR-03: Бронирование
// ==========================================
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

// ==========================================
// FR-05: Уведомления
// ==========================================
export interface PushTokenRequest {
  platform: 'ios' | 'android';
  token: string;
}

export interface Notification {
  id: string;
  type: 'booking_confirmed' | 'center_cancelled' | 'reminder_1h' | 'rate_marshal';
  title: string;
  body: string;
  payload: {
    bookingId?: string;
    slotId?: string;
    marshalId?: string;
    cancelReason?: string;
  };
  isRead: boolean;
  createdAt: string;
}

export interface RateMarshalRequest {
  rating: number;
  comment?: string;
}

```


---

## 3. REST-эндпоинты

Все эндпоинты требуют заголовок `Authorization: Bearer <accessToken>`, кроме явно указанных как публичные. Базовый URL: `/api/v1`.

### 3.1. FR-06: Авторизация и Профиль

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| POST | `/auth/sms/send` | Отправка SMS-кода (публичный) |
| POST | `/auth/sms/verify` | Подтверждение SMS-кода, возврат AuthTokens (публичный) |
| POST | `/auth/refresh` | Обновление accessToken по refreshToken |
| GET | `/users/me` | Получение профиля текущего клиента (User) |

### 3.2. FR-01: Просмотр слотов

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/slots` | Получение списка слотов. Query params: `from` (ISO 8601), `to` (ISO 8601). По умолчанию: 7 дней. |
| GET | `/slots/:id` | Получение деталей конкретного слота (Slot) |

### 3.3. FR-02 и FR-03: Бронирование

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| POST | `/bookings` | Создание бронирования (CreateBookingRequest → Booking). Бэкенд проверяет лимит новичков (FR-02.3). |
| GET | `/bookings/me` | Получение списка бронирований текущего клиента |
| GET | `/bookings/:id` | Детали конкретного бронирования |
| DELETE | `/bookings/:id` | Отмена бронирования клиентом. Бэкенд проверяет правило "2 часа до старта" (FR-03.1). |

### 3.4. FR-05: Уведомления и обратная связь

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| POST | `/notifications/token` | Регистрация/обновление push-токена устройства |
| GET | `/notifications` | Получение списка уведомлений клиента |
| PATCH | `/notifications/:id/read` | Пометка уведомления как прочитанного |
| POST | `/bookings/:id/rating` | Оценка маршала после заезда (RateMarshalRequest). Доступно только для броней со статусом `completed`. |


---

## 4. Примеры JSON-ответов

### GET /slots (пример ответа)

```json
{
  "data": [
    {
      "id": "slot_001",
      "startTime": "2026-07-06T18:00:00Z",
      "duration": 20,
      "trackType": "long",
      "marshal": {
        "id": "marshal_01",
        "name": "Александр",
        "rating": 4.8
      },
      "availableSeats": 6,
      "totalSeats": 14,
      "hasEquipmentAvailable": true,
      "basePrice": 1500,
      "equipmentRentalPrice": 500,
      "status": "available"
    }
  ]
}
```
### POST /bookings (пример запроса и ответа)
Запрос:

```json
{
  "slotId": "slot_001",
  "equipmentType": "rental",
  "skillLevel": "beginner"
}
```
Ответ (успех):

```json
{
  "data": {
    "id": "booking_123",
    "slotId": "slot_001",
    "userId": "user_456",
    "equipmentType": "rental",
    "skillLevel": "beginner",
    "status": "active",
    "totalPrice": 2000,
    "createdAt": "2026-07-06T12:00:00Z"
  }
}
```

Ответ (ошибка — лимит новичков):

```json
{
  "error": {
    "code": "NOVICE_LIMIT_EXCEEDED",
    "message": "Превышен лимит новичков на этот заезд (максимум 8)"
  }
}
```

DELETE /bookings/:id (ошибка — менее 2 часов до старта):

```json
{
  "error": {
    "code": "CANCEL_TOO_LATE",
    "message": "Отмена возможна не позднее чем за 2 часа до старта"
  }
}
```