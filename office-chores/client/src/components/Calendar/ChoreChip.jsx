export function ChoreChip({ occurrence, onClick }) {
  const { title, assignedTo, isCompleted } = occurrence;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs font-medium truncate transition-opacity
        ${isCompleted ? 'opacity-50 line-through' : 'hover:brightness-95'}`}
      style={{ backgroundColor: assignedTo.colorHex + '22', color: darken(assignedTo.colorHex) }}
      title={`${title} — ${assignedTo.name}${isCompleted ? ' (done)' : ''}`}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: assignedTo.colorHex }}
      />
      <span className="truncate">{title}</span>
    </button>
  );
}

// Make color slightly darker for text readability
function darken(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.max(0, r - 60)}, ${Math.max(0, g - 60)}, ${Math.max(0, b - 60)})`;
}
