import { useEffect, useState } from 'react';
import type { Slot, Booking } from '../../data/mock/mockServer';

interface BookingConfirmationProps {
  slot: Slot;
  booking: Booking;
  onClose: () => void;
}

export function BookingConfirmation({ slot, booking, onClose }: BookingConfirmationProps) {
  const [showToast, setShowToast] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowToast(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Toast-уведомление */}
      {showToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
          <div className="bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <span>📩</span>
            <span className="font-semibold">Запись подтверждена. Ждём вас!</span>
          </div>
        </div>
      )}

      {/* Основной экран */}
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Галочка */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Запись подтверждена!</h1>
            <p className="text-sm text-slate-500 mt-2">
              Мы ждём вас на заезд. Не забудьте приехать за 10 минут до старта.
            </p>
          </div>

          {/* Карточка с деталями */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Детали заезда</h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Дата и время</span>
                <span className="text-sm font-semibold text-slate-900">
                  {new Date(slot.startTime).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                  })}{' '}
                  в{' '}
                  {new Date(slot.startTime).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Трасса</span>
                <span className="text-sm font-semibold text-slate-900">
                  {slot.trackType === 'long' ? 'Длинная' : 'Короткая'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Маршал</span>
                <span className="text-sm font-semibold text-slate-900">
                  {slot.marshal.name}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Экипировка</span>
                <span className="text-sm font-semibold text-slate-900">
                  {booking.equipmentType === 'rental' ? 'Прокат' : 'Своя'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Уровень</span>
                <span className="text-sm font-semibold text-slate-900">
                  {booking.skillLevel === 'beginner' ? 'Новичок' : 'Опытный'}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-slate-900">Итого</span>
                  <span className="text-xl font-bold text-slate-900">
                    {booking.totalPrice} ₽
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Кнопка */}
          <button
            onClick={onClose}
            className="w-full bg-slate-900 text-white font-semibold py-4 rounded-xl hover:bg-slate-700"
          >
            Вернуться к расписанию
          </button>
        </div>
      </div>

      {/* CSS для анимации toast */}
      <style>{`
        @keyframes slide-down {
          from {
            transform: translate(-50%, -100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </>
  );
}