import { useState } from 'react';
import { format } from 'date-fns';
import { Modal } from '../shared/Modal';

const INTERVAL_OPTIONS = [
  { value: 1, label: 'Every day' },
  { value: 2, label: 'Every 2 days' },
  { value: 3, label: 'Every 3 days' },
  { value: 7, label: 'Every week' },
  { value: 14, label: 'Every 2 weeks' },
  { value: 30, label: 'Every 30 days' },
];

export function AddChoreModal({ members, onAdd, onClose, initialChore = null }) {
  const [title, setTitle] = useState(initialChore?.title || '');
  const [description, setDescription] = useState(initialChore?.description || '');
  const [assignedTo, setAssignedTo] = useState(
    initialChore?.assignedTo?.id?.toString() || (members[0]?.id?.toString() || '')
  );
  const [startDate, setStartDate] = useState(
    initialChore?.startDate || format(new Date(), 'yyyy-MM-dd')
  );
  const [intervalDays, setIntervalDays] = useState(
    initialChore?.intervalDays?.toString() || '1'
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!initialChore;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !assignedTo) return;
    setSubmitting(true);
    setError('');
    try {
      await onAdd({
        title: title.trim(),
        description: description.trim(),
        assigned_to: Number(assignedTo),
        start_date: startDate,
        interval_days: Number(intervalDays),
      });
      onClose();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Edit Chore' : 'Add Chore'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Clean the kitchen"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional details…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To *</label>
          <select
            value={assignedTo}
            onChange={e => setAssignedTo(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">— select a member —</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Repeats</label>
            <select
              value={intervalDays}
              onChange={e => setIntervalDays(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {INTERVAL_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim() || !assignedTo}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isEdit ? 'Save Changes' : 'Add Chore'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
