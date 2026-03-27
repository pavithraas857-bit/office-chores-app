import { useState } from 'react';
import { format, isToday } from 'date-fns';
import { ChoreChip } from './ChoreChip';

const MAX_CHIPS = 3;

export function CalendarCell({ date, isCurrentMonth, occurrences = [], onChipClick }) {
  const [showAll, setShowAll] = useState(false);

  const dateStr = format(date, 'yyyy-MM-dd');
  const dayNum = format(date, 'd');
  const today = isToday(date);
  const overflow = occurrences.length - MAX_CHIPS;
  const visible = showAll ? occurrences : occurrences.slice(0, MAX_CHIPS);

  return (
    <div
      className={`min-h-[100px] border-b border-r border-gray-200 p-1 flex flex-col gap-0.5
        ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}`}
    >
      {/* Date number */}
      <div className="flex justify-end mb-0.5">
        <span
          className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
            ${today
              ? 'bg-blue-600 text-white'
              : isCurrentMonth ? 'text-gray-700' : 'text-gray-400'
            }`}
        >
          {dayNum}
        </span>
      </div>

      {/* Chore chips */}
      <div className="flex flex-col gap-0.5">
        {visible.map((occ, i) => (
          <ChoreChip
            key={`${occ.choreId}-${occ.instanceDate}-${i}`}
            occurrence={occ}
            onClick={() => onChipClick(occ)}
          />
        ))}

        {!showAll && overflow > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="text-xs text-blue-600 hover:text-blue-800 text-left px-1.5 py-0.5 font-medium"
          >
            +{overflow} more
          </button>
        )}
        {showAll && overflow > 0 && (
          <button
            onClick={() => setShowAll(false)}
            className="text-xs text-gray-400 hover:text-gray-600 text-left px-1.5 py-0.5"
          >
            show less
          </button>
        )}
      </div>
    </div>
  );
}
