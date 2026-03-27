export function Avatar({ name, colorHex, size = 'sm' }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0 ${sizeClass}`}
      style={{ backgroundColor: colorHex }}
    >
      {initials}
    </span>
  );
}
