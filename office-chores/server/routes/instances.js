const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// POST /api/instances  — mark an occurrence complete
router.post('/', (req, res) => {
  const { chore_id, instance_date, completed_by } = req.body;
  if (!chore_id || !instance_date) {
    return res.status(400).json({ error: 'chore_id and instance_date are required' });
  }

  const db = getDb();

  // Verify chore exists and is active
  const chore = db.prepare('SELECT id FROM chores WHERE id = ? AND is_active = 1').get(chore_id);
  if (!chore) return res.status(404).json({ error: 'Chore not found' });

  db.prepare(`
    INSERT INTO chore_instances (chore_id, instance_date, completed_at, completed_by)
    VALUES (?, ?, datetime('now'), ?)
    ON CONFLICT(chore_id, instance_date) DO UPDATE SET
      completed_at = excluded.completed_at,
      completed_by = excluded.completed_by
  `).run(chore_id, instance_date, completed_by || null);

  res.status(201).json({ success: true });
});

// DELETE /api/instances/:choreId/:instanceDate  — unmark complete
router.delete('/:choreId/:instanceDate', (req, res) => {
  const db = getDb();
  const { choreId, instanceDate } = req.params;
  const result = db.prepare(
    'DELETE FROM chore_instances WHERE chore_id = ? AND instance_date = ?'
  ).run(Number(choreId), instanceDate);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Instance not found' });
  }
  res.json({ success: true });
});

module.exports = router;
