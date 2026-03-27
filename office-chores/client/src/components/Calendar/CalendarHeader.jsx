import { format } from 'date-fns';

export function CalendarHeader({ year, month, onPrev, onNext, onToday }) {
  const date = new Date(year, month);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2">
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Today
        </button>
        <div className="flex items-center">
          <button
            onClick={onPrev}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Previous month"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={onNext}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Next month"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
      <h1 className="text-lg font-semibold text-gray-900">
        {format(date, 'MMMM yyyy')}
      </h1>
      <div className="w-32" /> {/* spacer to center the title */}
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M10.5 3L5.5 8l5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M5.5 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
