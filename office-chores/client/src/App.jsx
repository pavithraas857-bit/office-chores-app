import { useState } from 'react';
import { useTeamMembers } from './hooks/useTeamMembers';
import { useChores } from './hooks/useChores';
import { useCalendar } from './hooks/useCalendar';
import { CalendarHeader } from './components/Calendar/CalendarHeader';
import { CalendarView } from './components/Calendar/CalendarView';
import { TeamPanel } from './components/Sidebar/TeamPanel';
import { ManageTeamModal } from './components/Modals/ManageTeamModal';
import { AddChoreModal } from './components/Modals/AddChoreModal';
import { ChoreDetailModal } from './components/Modals/ChoreDetailModal';
import { Toast } from './components/shared/Toast';

function App() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showAddChore, setShowAddChore] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState(null);
  const [toast, setToast] = useState(null);

  const { members, addMember, removeMember } = useTeamMembers();
  const { addChore, removeChore, updateChore } = useChores();
  const { occurrenceMap, loading, error: calendarError, markComplete, unmarkComplete, refetch } = useCalendar(year, month);

  function showError(msg) {
    setToast(msg);
  }

  function goToPrev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function goToNext() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function goToToday() {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  async function handleAddChore(data) {
    await addChore(data);
    refetch();
  }

  async function handleDeleteChore(id) {
    await removeChore(id);
    refetch();
  }

  async function handleEditChore(id, data) {
    await updateChore(id, data);
    refetch();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside className="w-52 bg-white border-r border-gray-200 flex flex-col shadow-sm shrink-0">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧹</span>
            <span className="font-semibold text-gray-900 text-sm">Office Chores</span>
          </div>
        </div>

        {/* Add Chore button */}
        <div className="px-4 py-3 border-b border-gray-200">
          <button
            onClick={() => setShowAddChore(true)}
            disabled={members.length === 0}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            title={members.length === 0 ? 'Add a team member first' : ''}
          >
            <span className="text-base leading-none">+</span>
            Add Chore
          </button>
          {members.length === 0 && (
            <p className="mt-2 text-xs text-gray-400 text-center">Add a team member to get started</p>
          )}
        </div>

        {/* Team panel */}
        <div className="flex-1 overflow-y-auto">
          <TeamPanel members={members} onManageTeam={() => setShowTeamModal(true)} />
        </div>
      </aside>

      {/* Main calendar area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <CalendarHeader
          year={year}
          month={month}
          onPrev={goToPrev}
          onNext={goToNext}
          onToday={goToToday}
        />

        {/* Calendar error banner */}
        {calendarError && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700 flex items-center justify-between">
            <span>Could not load calendar: {calendarError}</span>
            <button onClick={refetch} className="font-medium underline hover:no-underline">Retry</button>
          </div>
        )}

        <CalendarView
          year={year}
          month={month}
          occurrenceMap={occurrenceMap}
          loading={loading}
          onChipClick={setSelectedOccurrence}
        />
      </main>

      {/* Modals */}
      {showTeamModal && (
        <ManageTeamModal
          members={members}
          onAddMember={addMember}
          onRemoveMember={removeMember}
          onClose={() => setShowTeamModal(false)}
        />
      )}

      {showAddChore && (
        <AddChoreModal
          members={members}
          onAdd={handleAddChore}
          onClose={() => setShowAddChore(false)}
        />
      )}

      {selectedOccurrence && (
        <ChoreDetailModal
          occurrence={selectedOccurrence}
          members={members}
          onMarkComplete={async (choreId, date) => {
            await markComplete(choreId, date);
            setSelectedOccurrence(null);
          }}
          onUnmarkComplete={async (choreId, date) => {
            await unmarkComplete(choreId, date);
            setSelectedOccurrence(null);
          }}
          onDeleteChore={handleDeleteChore}
          onEditChore={handleEditChore}
          onClose={() => setSelectedOccurrence(null)}
        />
      )}

      {/* Error toast */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

export default App;
