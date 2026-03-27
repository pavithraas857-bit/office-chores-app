import { useMemo } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, format } from 'date-fns';
import { CalendarCell } from './CalendarCell';
import { CalendarSkeleton } from './CalendarSkeleton';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView({ year, month, occurrenceMap, loading, onChipClick }) {
  const cells = useMemo(() => {
    const first = startOfMonth(new Date(year, month));
    const last = endOfMonth(new Date(year, month));
    const gridStart = startOfWeek(first, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(last, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [year, month]);

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
        {DAY_LABELS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && <CalendarSkeleton cellCount={cells.length || 35} />}

      {/* Grid */}
      {!loading && (
        <div className="grid grid-cols-7 border-l border-t border-gray-200">
          {cells.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const occs = occurrenceMap.get(dateStr) || [];
            return (
              <CalendarCell
                key={dateStr}
                date={date}
                isCurrentMonth={isSameMonth(date, new Date(year, month))}
                occurrences={occs}
                onChipClick={onChipClick}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
