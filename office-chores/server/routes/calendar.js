const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { getOccurrencesInRange } = require('../utils/recurrence');

// GET /api/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/', (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) {
    return res.status(400).json({ error: 'start and end query params are required' });
  }

  const db = getDb();

  // Fetch all active chores whose start_date <= range end
  const chores = db.prepare(`
    SELECT c.*, m.id AS m_id, m.name AS m_name, m.color_hex AS m_color
    FROM chores c
    JOIN team_members m ON m.id = c.assigned_to
    WHERE c.is_active = 1 AND c.start_date <= ?
  `).all(end);

  if (chores.length === 0) return res.json([]);

  // Compute all occurrence dates across all chores
  const allOccurrences = [];
  for (const chore of chores) {
    const dates = getOccurrencesInRange(chore, start, end);
    for (const date of dates) {
      allOccurrences.push({ chore, date });
    }
  }

  if (allOccurrences.length === 0) return res.json([]);

  // Fetch all relevant completion records in one query
  const choreIds = [...new Set(chores.map(c => c.id))];
  const placeholders = choreIds.map(() => '?').join(',');
  const instances = db.prepare(`
    SELECT ci.*, m.name AS completer_name
    FROM chore_instances ci
    LEFT JOIN team_members m ON m.id = ci.completed_by
    WHERE ci.chore_id IN (${placeholders})
      AND ci.instance_date >= ?
      AND ci.instance_date <= ?
  `).all(...choreIds, start, end);

  // Build a lookup map: "choreId|date" -> instance row
  const instanceMap = new Map();
  for (const inst of instances) {
    instanceMap.set(`${inst.chore_id}|${inst.instance_date}`, inst);
  }

  // Merge and format
  const result = allOccurrences.map(({ chore, date }) => {
    const key = `${chore.id}|${date}`;
    const inst = instanceMap.get(key) || null;
    return {
      choreId: chore.id,
      instanceDate: date,
      title: chore.title,
      description: chore.description,
      intervalDays: chore.interval_days,
      startDate: chore.start_date,
      assignedTo: {
        id: chore.m_id,
        name: chore.m_name,
        colorHex: chore.m_color,
      },
      isCompleted: !!inst,
      completedAt: inst ? inst.completed_at : null,
      completedBy: inst && inst.completed_by
        ? { id: inst.completed_by, name: inst.completer_name }
        : null,
    };
  });

  res.json(result);
});

module.exports = router;
