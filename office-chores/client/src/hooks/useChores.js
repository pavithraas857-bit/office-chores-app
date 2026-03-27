import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useChores() {
  const [chores, setChores] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChores = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getChores();
      setChores(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChores(); }, [fetchChores]);

  const addChore = useCallback(async (data) => {
    const chore = await api.addChore(data);
    setChores(prev => [chore, ...prev]);
    return chore;
  }, []);

  const removeChore = useCallback(async (id) => {
    await api.deleteChore(id);
    setChores(prev => prev.filter(c => c.id !== id));
  }, []);

  const updateChore = useCallback(async (id, data) => {
    const chore = await api.updateChore(id, data);
    setChores(prev => prev.map(c => c.id === id ? chore : c));
    return chore;
  }, []);

  return { chores, loading, addChore, removeChore, updateChore, refetch: fetchChores };
}
