const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

const CHORE_WITH_MEMBER = `
  SELECT c.*, m.name AS member_name, m.color_hex AS member_color
  FROM chores c
  JOIN team_members m ON m.id = c.assigned_to
  WHERE c.is_active = 1
  ORDER BY c.created_at DESC
`;

// GET /api/chores
router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare(CHORE_WITH_MEMBER).all();
  res.json(rows.map(formatChore));
});

// POST /api/chores
router.post('/', (req, res) => {
  const { title, description, assigned_to, start_date, interval_days } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!assigned_to) return res.status(400).json({ error: 'assigned_to is required' });
  if (!start_date) return res.status(400).json({ error: 'start_date is required' });

  const db = getDb();
  const member = db.prepare('SELECT id FROM team_members WHERE id = ?').get(assigned_to);
  if (!member) return res.status(400).json({ error: 'Team member not found' });

  const stmt = db.prepare(
    'INSERT INTO chores (title, description, assigned_to, start_date, interval_days) VALUES (?, ?, ?, ?, ?)'
  );
  const result = stmt.run(
    title.trim(),
    description || '',
    assigned_to,
    start_date,
    interval_days || 1
  );
  const row = db.prepare(`
    SELECT c.*, m.name AS member_name, m.color_hex AS member_color
    FROM chores c JOIN team_members m ON m.id = c.assigned_to
    WHERE c.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(formatChore(row));
});

// PUT /api/chores/:id
router.put('/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const chore = db.prepare('SELECT * FROM chores WHERE id = ? AND is_active = 1').get(id);
  if (!chore) return res.status(404).json({ error: 'Chore not found' });

  const { title, description, assigned_to, start_date, interval_days } = req.body;
  db.prepare(`
    UPDATE chores SET
      title = ?, description = ?, assigned_to = ?, start_date = ?, interval_days = ?
    WHERE id = ?
  `).run(
    title ?? chore.title,
    description ?? chore.description,
    assigned_to ?? chore.assigned_to,
    start_date ?? chore.start_date,
    interval_days ?? chore.interval_days,
    id
  );
  const row = db.prepare(`
    SELECT c.*, m.name AS member_name, m.color_hex AS member_color
    FROM chores c JOIN team_members m ON m.id = c.assigned_to
    WHERE c.id = ?
  `).get(id);
  res.json(formatChore(row));
});

// DELETE /api/chores/:id  (soft delete)
router.delete('/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const result = db.prepare('UPDATE chores SET is_active = 0 WHERE id = ? AND is_active = 1').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Chore not found' });
  res.json({ success: true });
});

function formatChore(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    intervalDays: row.interval_days,
    assignedTo: {
      id: row.assigned_to,
      name: row.member_name,
      colorHex: row.member_color,
    },
    createdAt: row.created_at,
  };
}

module.exports = router;
