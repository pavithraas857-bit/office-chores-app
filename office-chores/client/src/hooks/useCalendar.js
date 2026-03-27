import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { api } from '../api/client';

export function useCalendar(year, month) {
  const [occurrences, setOccurrences] = useState([]);
  const [loading, setLoading] = useState(true);

  // Visible date range: from Sunday before the 1st to Saturday after the last
  const { start, end } = useMemo(() => {
    const first = startOfMonth(new Date(year, month));
    const last = endOfMonth(new Date(year, month));
    return {
      start: format(startOfWeek(first, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
      end: format(endOfWeek(last, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
    };
  }, [year, month]);

  const [error, setError] = useState(null);

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCalendar(start, end);
      setOccurrences(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  // Subscribe to server-sent events so chore changes in other tabs trigger a refetch
  useEffect(() => {
    const source = new EventSource('/api/events');
    source.onmessage = (e) => {
      const { type } = JSON.parse(e.data);
      if (type === 'chore-changed') fetchCalendar();
    };
    return () => { source.close(); };
  }, [fetchCalendar]);

  // Map: 'YYYY-MM-DD' -> Occurrence[]
  const occurrenceMap = useMemo(() => {
    const map = new Map();
    for (const occ of occurrences) {
      const list = map.get(occ.instanceDate) || [];
      list.push(occ);
      map.set(occ.instanceDate, list);
    }
    return map;
  }, [occurrences]);

  const markComplete = useCallback(async (choreId, instanceDate) => {
    await api.markComplete(choreId, instanceDate);
    setOccurrences(prev =>
      prev.map(o =>
        o.choreId === choreId && o.instanceDate === instanceDate
          ? { ...o, isCompleted: true, completedAt: new Date().toISOString() }
          : o
      )
    );
  }, []);

  const unmarkComplete = useCallback(async (choreId, instanceDate) => {
    await api.unmarkComplete(choreId, instanceDate);
    setOccurrences(prev =>
      prev.map(o =>
        o.choreId === choreId && o.instanceDate === instanceDate
          ? { ...o, isCompleted: false, completedAt: null, completedBy: null }
          : o
      )
    );
  }, []);

  return { occurrenceMap, loading, error, start, end, markComplete, unmarkComplete, refetch: fetchCalendar };
}
