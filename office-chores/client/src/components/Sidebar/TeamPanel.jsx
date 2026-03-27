import { useState } from 'react';
import { Avatar } from '../shared/Avatar';

export function TeamPanel({ members, onManageTeam }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Team</h3>
        <button
          onClick={onManageTeam}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Manage
        </button>
      </div>
      <div className="space-y-2">
        {members.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">No members yet</p>
        )}
        {members.map(m => (
          <div key={m.id} className="flex items-center gap-2">
            <Avatar name={m.name} colorHex={m.color_hex} size="sm" />
            <span className="text-sm text-gray-700 truncate">{m.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
