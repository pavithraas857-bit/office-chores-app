import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Modal } from '../shared/Modal';
import { Avatar } from '../shared/Avatar';
import { AddChoreModal } from './AddChoreModal';

const INTERVAL_LABELS = {
  1: 'Every day', 2: 'Every 2 days', 3: 'Every 3 days',
  7: 'Every week', 14: 'Every 2 weeks', 30: 'Every 30 days',
};

function intervalLabel(days) {
  return INTERVAL_LABELS[days] || `Every ${days} days`;
}

export function ChoreDetailModal({ occurrence, members, onMarkComplete, onUnmarkComplete, onDeleteChore, onEditChore, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showEdit, setShowEdit] = useState(false);

  const { choreId, instanceDate, title, description, assignedTo, intervalDays, isCompleted, completedAt, completedBy } = occurrence;

  async function handleToggleComplete() {
    setBusy(true);
    setError('');
    try {
      if (isCompleted) {
        await onUnmarkComplete(choreId, instanceDate);
      } else {
        await onMarkComplete(choreId, instanceDate);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this chore? This will remove all future occurrences.')) return;
    setBusy(true);
    try {
      await onDeleteChore(choreId);
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (showEdit) {
    return (
      <AddChoreModal
        members={members}
        initialChore={{ id: choreId, title, description, assignedTo, startDate: occurrence.startDate, intervalDays }}
        onAdd={async (data) => {
          await onEditChore(choreId, data);
          onClose();
        }}
        onClose={() => setShowEdit(false)}
      />
    );
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        {/* Occurrence date */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CalendarIcon />
          <span>{format(parseISO(instanceDate), 'EEEE, MMMM d, yyyy')}</span>
        </div>

        {/* Recurrence */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <RepeatIcon />
          <span>{intervalLabel(intervalDays)}</span>
        </div>

        {/* Assigned to */}
        <div className="flex items-center gap-2">
          <Avatar name={assignedTo.name} colorHex={assignedTo.colorHex} />
          <span className="text-sm text-gray-700">{assignedTo.name}</span>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{description}</p>
        )}

        {/* Completion status */}
        {isCompleted && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg p-3">
            <CheckIcon />
            <span>
              Completed {completedAt ? format(parseISO(completedAt), 'MMM d, h:mm a') : ''}
              {completedBy ? ` by ${completedBy.name}` : ''}
            </span>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            onClick={handleDelete}
            disabled={busy}
            className="text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            Delete chore
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setShowEdit(true)}
              className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              onClick={handleToggleComplete}
              disabled={busy}
              className={`px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 ${
                isCompleted
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isCompleted ? 'Mark Incomplete' : 'Mark as Done'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="3" width="14" height="12" rx="2"/>
      <path d="M5 1v4M11 1v4M1 7h14"/>
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 4h10l-3-3M15 12H5l3 3"/>
      <path d="M13 4v4a4 4 0 01-4 4H3"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 8l4 4 8-8"/>
    </svg>
  );
}
