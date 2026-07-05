import { useEffect, useState } from 'react';
import type { Booking, Slot } from '../../data/mock/mockServer';
import { getMyBookings, canCancelBooking } from '../../data/mock/mockServer';
import { cancelBooking } from '../../data/api/api';

interface MyBookingsProps {
  onBack: () => void;
}

export function MyBookings({ onBack }: MyBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const myBookings = getMyBookings();
      setBookings(myBookings);

      // Загружаем слоты, чтобы получить детали (время старта)
      const { fetchSlots } = await import('../../data/api/api');
      const today = new Date();
      const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const allSlots = await fetchSlots(today.toISOString(), in7Days.toISOString());
      setSlots(allSlots);
    } catch (e) {
      setError('Не удалось загрузить бронирования');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Вы уверены, что хотите отменить бронирование?')) return;

    setCancellingId(bookingId);
    setError(null);
    setSuccessMessage(null);

    try {
      await cancelBooking(bookingId);
      setSuccessMessage('Бронирование успешно отменено');
      await loadData(); // Перезагружаем список
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      setError(e.message || 'Не удалось отменить бронирование');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Мои заезды</h1>
            <p className="text-sm text-slate-500">Ваши бронирования</p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-300"
          >
            ← Расписание
          </button>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 mb-4">
            <p className="font-semibold">✓ {successMessage}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4">
            <p className="font-semibold">Ошибка</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {bookings.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-slate-700 font-semibold">У вас пока нет бронирований</p>
            <p className="text-sm text-slate-500 mt-1">
              Перейдите в расписание и запишитесь на заезд
            </p>
          </div>
        )}

        {/* Список бронирований */}
        <div className="flex flex-col gap-3">
          {bookings.map((booking) => {
            const slot = slots.find((s) => s.id === booking.slotId);
            if (!slot) return null;

            const canCancel = canCancelBooking(booking, slot);
            const isCancelled = booking.status === 'cancelled_by_client';
            const isCancelledByCenter = booking.status === 'cancelled_by_center';
            const isActive = booking.status === 'active';

            return (
              <div
                key={booking.id}
                className={[
                  'bg-white rounded-2xl shadow-sm overflow-hidden',
                  !isActive && 'opacity-70',
                ].join(' ')}
              >
                {/* Статус "Отменён центром" */}
                {isCancelledByCenter && (
                  <div className="bg-red-500 text-white px-4 py-2 text-sm font-medium flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Отменён центром: {booking.cancelReason ?? 'нет причины'}</span>
                  </div>
                )}

                {/* Статус "Отменён клиентом" */}
                {isCancelled && (
                  <div className="bg-slate-500 text-white px-4 py-2 text-sm font-medium flex items-center gap-2">
                    <span>✗</span>
                    <span>Отменено вами</span>
                  </div>
                )}

                <div className="p-4">
                  {/* Дата и время */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide">
                        {new Date(slot.startTime).toLocaleDateString('ru-RU', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'long',
                        })}
                      </div>
                      <div className="text-xl font-bold text-slate-900">
                        {new Date(slot.startTime).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        <span className="text-sm font-normal text-slate-500 ml-1">
                          · {slot.duration} мин
                        </span>
                      </div>
                    </div>
                    <span
                      className={[
                        'px-2 py-1 rounded-lg text-xs font-semibold',
                        slot.trackType === 'long'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-emerald-100 text-emerald-700',
                      ].join(' ')}
                    >
                      {slot.trackType === 'long' ? 'Длинная' : 'Короткая'}
                    </span>
                  </div>

                  {/* Маршал */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm">
                      {slot.marshal.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">
                        {slot.marshal.name}
                      </div>
                      <span className="text-yellow-500 text-xs font-semibold">
                        ★ {slot.marshal.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Детали брони */}
                  <div className="flex items-center gap-3 text-sm mb-4">
                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-700">
                      {booking.equipmentType === 'rental' ? '🎽 Прокат' : '🪖 Своя'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-100 text-purple-700">
                      {booking.skillLevel === 'beginner' ? '🌱 Новичок' : '🏎️ Опытный'}
                    </span>
                  </div>

                  {/* Цена и кнопка */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div>
                      <div className="text-xs text-slate-500">Оплачено</div>
                      <div className="text-lg font-bold text-slate-900">
                        {booking.totalPrice} ₽
                      </div>
                    </div>

                    {isActive && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={!canCancel || cancellingId === booking.id}
                        className={[
                          'px-5 py-2.5 rounded-xl text-sm font-semibold transition',
                          canCancel
                            ? 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700'
                            : 'bg-slate-200 text-slate-500 cursor-not-allowed',
                        ].join(' ')}
                      >
                        {cancellingId === booking.id
                          ? 'Отменяем...'
                          : canCancel
                          ? 'Отменить'
                          : 'Нельзя отменить'}
                      </button>
                    )}
                  </div>

                  {/* Подсказка для заблокированной кнопки */}
                  {isActive && !canCancel && (
                    <div className="mt-2 text-xs text-slate-500 text-right">
                      Отмена возможна не позднее чем за 2 часа до старта
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}