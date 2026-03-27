import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useTeamMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getTeam();
      setMembers(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // Subscribe to server-sent events so team changes in other tabs trigger a refetch
  useEffect(() => {
    const source = new EventSource('/api/events');
    source.onmessage = (e) => {
      const { type } = JSON.parse(e.data);
      if (type === 'team-changed') fetchMembers();
    };
    return () => { source.close(); };
  }, [fetchMembers]);

  const addMember = useCallback(async (name, colorHex) => {
    const member = await api.addMember(name, colorHex);
    setMembers(prev => [...prev, member].sort((a, b) => a.name.localeCompare(b.name)));
    return member;
  }, []);

  const removeMember = useCallback(async (id) => {
    await api.removeMember(id);
    setMembers(prev => prev.filter(m => m.id !== id));
  }, []);

  return { members, loading, error, addMember, removeMember, refetch: fetchMembers };
}
