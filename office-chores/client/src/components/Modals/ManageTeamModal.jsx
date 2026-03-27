import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Avatar } from '../shared/Avatar';

const PRESET_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6',
];

export function ManageTeamModal({ members, onAddMember, onRemoveMember, onClose }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await onAddMember(name.trim(), color);
      setName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id) {
    setDeleteError('');
    try {
      await onRemoveMember(id);
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  return (
    <Modal title="Manage Team Members" onClose={onClose}>
      {/* Add member form */}
      <form onSubmit={handleAdd} className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">New Member Name</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Alice"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>

        {/* Color picker */}
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? '#1e293b' : 'transparent',
                }}
              />
            ))}
          </div>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>

      {/* Member list */}
      <div className="space-y-2">
        {members.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No team members yet.</p>
        )}
        {members.map(m => (
          <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <Avatar name={m.name} colorHex={m.color_hex} />
              <span className="text-sm font-medium text-gray-800">{m.name}</span>
            </div>
            <button
              onClick={() => handleRemove(m.id)}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      {deleteError && <p className="mt-3 text-sm text-red-600">{deleteError}</p>}
    </Modal>
  );
}
