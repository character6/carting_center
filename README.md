# Картинг-центр «Апекс» — клиентское приложение

Учебный проект по производственной практике. Реализовано клиентское мобильное приложение (веб-прототип) для картинг-центра «Апекс».

## Стек технологий
- React + Vite + TypeScript
- Tailwind CSS
- Mock-сервер (имитация black-box бэкенда)

## Как запустить

```bash
# Перейти в папку клиента
cd client

# Установить зависимости
npm install

# Запустить dev-сервер
npm run dev
```

Открыть в браузере: http://localhost:5173/

## Структура проекта

### Документация

* brief-karting.md — бриф заказчика
* 01_analytics_requirements.md — ФТ, НФТ, Use Cases, User Stories
* 02_architecture.md — архитектурный план и схема данных
* 03_feature_1_slots.md — реализация Фичи 1 (просмотр слотов)
* 04_feature_2_booking.md — реализация Фичи 2 (бронирование)
* 05_feature_3_cancel.md — реализация Фичи 3 (отмена)
* 06_test_cases.md — тест-кейсы
* 07_bugs.md — найденные и исправленные баги

### Исходный код (client/src/)

* data/mock/mockServer.ts — mock-сервер (имитация API)
* data/api/api.ts — API-клиент
* presentation/components/SlotsList.tsx — экран расписания
* presentation/components/BookingModal.tsx — модалка бронирования
* presentation/components/BookingConfirmation.tsx — экран подтверждения
* presentation/components/MyBookings.tsx — экран «Мои заезды»
* App.tsx — главный компонент с навигацией

### Реализованные фичи

1. Просмотр слотов на 7 дней с фильтрацией по датам
2. Бронирование с выбором экипировки и уровня, обработкой ошибок
3. Отмена брони с проверкой правила «2 часа до старта»

## Автор
Студент 3 курса факультета компьютерных наук Бабаев Дмитрий