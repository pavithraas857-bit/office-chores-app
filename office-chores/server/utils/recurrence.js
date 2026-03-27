/**
 * Returns all occurrence dates (as 'YYYY-MM-DD' strings) for a chore
 * that fall within [rangeStart, rangeEnd] (both inclusive, ISO date strings).
 */
function getOccurrencesInRange(chore, rangeStart, rangeEnd) {
  const { start_date, interval_days } = chore;
  const occurrences = [];

  const startMs = dateToMs(start_date);
  const rangeStartMs = dateToMs(rangeStart);
  const rangeEndMs = dateToMs(rangeEnd);

  if (startMs > rangeEndMs) return occurrences;

  // Single-occurrence chore: only appears on its start_date
  if (!interval_days || interval_days === 0) {
    if (startMs >= rangeStartMs && startMs <= rangeEndMs) {
      occurrences.push(start_date);
    }
    return occurrences;
  }

  const intervalMs = interval_days * 86400000;

  // Fast-forward cursor to the first occurrence >= rangeStart
  let cursorMs = startMs;
  if (cursorMs < rangeStartMs) {
    const daysDiff = rangeStartMs - cursorMs;
    const steps = Math.ceil(daysDiff / intervalMs);
    cursorMs = startMs + steps * intervalMs;
  }

  while (cursorMs <= rangeEndMs) {
    occurrences.push(msToDate(cursorMs));
    cursorMs += intervalMs;
  }

  return occurrences;
}

function dateToMs(dateStr) {
  return new Date(dateStr + 'T00:00:00Z').getTime();
}

function msToDate(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

module.exports = { getOccurrencesInRange };
