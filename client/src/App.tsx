import { useState } from 'react';
import { SlotsList } from './presentation/components/SlotsList';
import { MyBookings } from './presentation/components/MyBookings';

export default function App() {
  const [currentView, setCurrentView] = useState<'slots' | 'myBookings'>('slots');

  return (
    <div className="relative">
      {/* Навигация */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-40">
        <div className="max-w-md mx-auto px-4 py-3 flex gap-2">
          <button
            onClick={() => setCurrentView('slots')}
            className={[
              'flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition',
              currentView === 'slots'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            ].join(' ')}
          >
            📅 Расписание
          </button>
          <button
            onClick={() => setCurrentView('myBookings')}
            className={[
              'flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition',
              currentView === 'myBookings'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            ].join(' ')}
          >
            📋 Мои заезды
          </button>
        </div>
      </nav>

      {/* Контент */}
      <div className="pt-16">
        {currentView === 'slots' ? (
          <SlotsList />
        ) : (
          <MyBookings onBack={() => setCurrentView('slots')} />
        )}
      </div>
    </div>
  );
}