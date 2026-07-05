import { useState } from 'react';
import type { Slot } from '../../data/mock/mockServer';
import { createBooking } from '../../data/api/api';

interface BookingModalProps {
  slot: Slot;
  onClose: () => void;
  onSuccess: (booking: any) => void;
}

export function BookingModal({ slot, onClose, onSuccess }: BookingModalProps) {
  const [equipmentType, setEquipmentType] = useState<'own' | 'rental'>('own');
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'experienced'>('beginner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPrice =
    slot.basePrice + (equipmentType === 'rental' ? slot.equipmentRentalPrice : 0);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const booking = await createBooking({
        slotId: slot.id,
        equipmentType,
        skillLevel,
      });
      onSuccess(booking);
    } catch (e: any) {
      setError(e.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Запись на заезд</h2>
          <p className="text-sm text-slate-500 mt-1">
            {new Date(slot.startTime).toLocaleDateString('ru-RU', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}{' '}
            в{' '}
            {new Date(slot.startTime).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Экипировка */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Экипировка
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEquipmentType('own')}
                className={[
                  'p-4 rounded-xl border-2 text-left transition',
                  equipmentType === 'own'
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300',
                ].join(' ')}
              >
                <div className="text-2xl mb-1">🪖</div>
                <div className="text-sm font-semibold text-slate-900">Своя</div>
                <div className="text-xs text-slate-500 mt-1">
                  Шлем и подшлемник у меня
                </div>
              </button>
              <button
                type="button"
                onClick={() => setEquipmentType('rental')}
                className={[
                  'p-4 rounded-xl border-2 text-left transition',
                  equipmentType === 'rental'
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300',
                ].join(' ')}
              >
                <div className="text-2xl mb-1">🎽</div>
                <div className="text-sm font-semibold text-slate-900">Прокат</div>
                <div className="text-xs text-slate-500 mt-1">
                  +{slot.equipmentRentalPrice} ₽
                </div>
              </button>
            </div>
          </div>

          {/* Уровень */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Уровень подготовки
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSkillLevel('beginner')}
                className={[
                  'p-4 rounded-xl border-2 text-left transition',
                  skillLevel === 'beginner'
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300',
                ].join(' ')}
              >
                <div className="text-2xl mb-1">🌱</div>
                <div className="text-sm font-semibold text-slate-900">Новичок</div>
                <div className="text-xs text-slate-500 mt-1">Катаюсь редко</div>
              </button>
              <button
                type="button"
                onClick={() => setSkillLevel('experienced')}
                className={[
                  'p-4 rounded-xl border-2 text-left transition',
                  skillLevel === 'experienced'
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300',
                ].join(' ')}
              >
                <div className="text-2xl mb-1">🏎️</div>
                <div className="text-sm font-semibold text-slate-900">Опытный</div>
                <div className="text-xs text-slate-500 mt-1">Уверенно за рулём</div>
              </button>
            </div>
          </div>

          {/* Итоговая стоимость */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Итого к оплате:</span>
              <span className="text-2xl font-bold text-slate-900">{totalPrice} ₽</span>
            </div>
            {equipmentType === 'rental' && (
              <div className="text-xs text-slate-500 mt-1">
                Включая прокат экипировки ({slot.equipmentRentalPrice} ₽)
              </div>
            )}
          </div>

          {/* Ошибка */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
              <p className="font-semibold">Не удалось записаться</p>
              <p className="mt-1">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Записываем...' : 'Подтвердить'}
          </button>
        </div>
      </div>
    </div>
  );
}