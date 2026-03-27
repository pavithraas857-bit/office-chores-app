// Pulsing skeleton shown while calendar data loads
export function CalendarSkeleton({ cellCount = 35 }) {
  return (
    <div className="grid grid-cols-7 flex-1 border-l border-t border-gray-200">
      {Array.from({ length: cellCount }).map((_, i) => (
        <div key={i} className="min-h-[100px] border-b border-r border-gray-200 p-1 bg-white">
          <div className="flex justify-end mb-1">
            <div className="w-5 h-5 rounded-full bg-gray-100 animate-pulse" />
          </div>
          {i % 3 === 0 && (
            <div className="h-4 rounded bg-gray-100 animate-pulse mb-1 w-5/6" />
          )}
          {i % 5 === 1 && (
            <div className="h-4 rounded bg-gray-100 animate-pulse w-4/6" />
          )}
        </div>
      ))}
    </div>
  );
}
