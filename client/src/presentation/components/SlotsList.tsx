import { useEffect, useMemo, useState } from 'react';
import { fetchSlots } from '../../data/api/api';
import type { Slot, Booking } from '../../data/mock/mockServer';
import { BookingModal } from './BookingModal';
import { BookingConfirmation } from './BookingConfirmation';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-500 text-sm font-semibold">
      ★ {rating.toFixed(1)}
    </span>
  );
}

export function SlotsList() {
  const today = useMemo(() => new Date(), []);
  const defaultTo = useMemo(
    () => new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
    [today]
  );

  const [from, setFrom] = useState<string>(toInputDate(today));
  const [to, setTo] = useState<string>(toInputDate(defaultTo));

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Фича 2: состояние для модалки и подтверждения
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    slot: Slot;
    booking: Booking;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSlots(from, to)
      .then((data) => {
        if (!cancelled) setSlots(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'Не удалось загрузить расписание');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const handleApplyFilter = () => {
    setFrom((v) => v);
    setTo((v) => v);
  };

  // Если показываем экран подтверждения
  if (confirmedBooking) {
    return (
      <BookingConfirmation
        slot={confirmedBooking.slot}
        booking={confirmedBooking.booking}
        onClose={() => {
          setConfirmedBooking(null);
          // Перезагружаем слоты
          setFrom((v) => v);
          setTo((v) => v);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-md mx-auto px-4 py-6">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Расписание</h1>
          <p className="text-sm text-slate-500">Выберите удобный заезд</p>
        </header>

        <div className="bg-white rounded-2xl shadow-sm p-3 mb-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <label className="flex-1 flex flex-col text-xs text-slate-500">
              С
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-900"
              />
            </label>
            <label className="flex-1 flex flex-col text-xs text-slate-500">
              По
              <input
                type="date"
                value={to}
                min={from}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-900"
              />
            </label>
          </div>
          <button
            onClick={handleApplyFilter}
            className="w-full bg-slate-900 text-white text-sm font-medium py-2 rounded-lg active:bg-slate-700"
          >
            Применить
          </button>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
            <p className="font-semibold">Ошибка загрузки</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && slots.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="text-4xl mb-2">🏁</div>
            <p className="text-slate-700 font-semibold">Пока нет доступных заездов</p>
            <p className="text-sm text-slate-500 mt-1">
              Попробуйте выбрать другой диапазон дат
            </p>
          </div>
        )}

        {!loading && !error && slots.length > 0 && (
          <div className="flex flex-col gap-3">
            {slots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                onBook={() => setSelectedSlot(slot)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Модалка бронирования */}
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
    </div>
  );
}

function SlotCard({ slot, onBook }: { slot: Slot; onBook: () => void }) {
  const isFull = slot.status === 'full';
  const isCancelled = slot.status === 'cancelled_by_center';
  const isAvailable = slot.status === 'available';

  return (
    <div
      className={[
        'bg-white rounded-2xl shadow-sm overflow-hidden',
        isFull ? 'opacity-70' : '',
      ].join(' ')}
    >
      {isCancelled && (
        <div className="bg-red-500 text-white px-4 py-2 text-sm font-medium flex items-center gap-2">
          <span>⚠️</span>
          <span>Отменён центром: {slot.cancelReason ?? 'нет причины'}</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              {formatDate(slot.startTime)}
            </div>
            <div className="text-xl font-bold text-slate-900">
              {formatTime(slot.startTime)}
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

        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm">
            {slot.marshal.name[0]}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-900">
              {slot.marshal.name}
            </div>
            <Stars rating={slot.marshal.rating} />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center gap-3">
            <span
              className={[
                'px-2 py-0.5 rounded-md text-xs font-semibold',
                isAvailable ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500',
              ].join(' ')}
            >
              {slot.availableSeats} / {slot.totalSeats} мест
            </span>
            <span
              className={[
                'px-2 py-0.5 rounded-md text-xs font-semibold',
                slot.hasEquipmentAvailable
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-500',
              ].join(' ')}
            >
              {slot.hasEquipmentAvailable ? '🪖 Экипировка есть' : 'Экипировки нет'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <div className="text-xs text-slate-500">от</div>
            <div className="text-lg font-bold text-slate-900">
              {slot.basePrice} ₽
            </div>
            {slot.hasEquipmentAvailable && (
              <div className="text-xs text-slate-500">
                + {slot.equipmentRentalPrice} ₽ прокат
              </div>
            )}
          </div>

          <button
            onClick={onBook}
            disabled={!isAvailable}
            className={[
              'px-5 py-2.5 rounded-xl text-sm font-semibold transition',
              isAvailable
                ? 'bg-slate-900 text-white active:bg-slate-700 hover:bg-slate-700'
                : isFull
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-red-100 text-red-400 cursor-not-allowed',
            ].join(' ')}
          >
            {isAvailable
              ? 'Записаться'
              : isFull
              ? 'Мест нет'
              : 'Отменён'}
          </button>
        </div>
      </div>
    </div>
  );
}