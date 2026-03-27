const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const error = new Error(err.error || 'Request failed');
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export const api = {
  // Team
  getTeam: () => request('/team'),
  addMember: (name, colorHex) => request('/team', { method: 'POST', body: { name, color_hex: colorHex } }),
  removeMember: (id) => request(`/team/${id}`, { method: 'DELETE' }),

  // Chores
  getChores: () => request('/chores'),
  addChore: (data) => request('/chores', { method: 'POST', body: data }),
  updateChore: (id, data) => request(`/chores/${id}`, { method: 'PUT', body: data }),
  deleteChore: (id) => request(`/chores/${id}`, { method: 'DELETE' }),

  // Calendar
  getCalendar: (start, end) => request(`/calendar?start=${start}&end=${end}`),

  // Instances
  markComplete: (choreId, instanceDate, completedBy) =>
    request('/instances', { method: 'POST', body: { chore_id: choreId, instance_date: instanceDate, completed_by: completedBy } }),
  unmarkComplete: (choreId, instanceDate) =>
    request(`/instances/${choreId}/${instanceDate}`, { method: 'DELETE' }),
};
