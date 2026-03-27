const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// GET /api/team
router.get('/', (req, res) => {
  const db = getDb();
  const members = db.prepare('SELECT * FROM team_members ORDER BY name').all();
  res.json(members);
});

// POST /api/team
router.post('/', (req, res) => {
  const { name, color_hex } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const db = getDb();
  try {
    const stmt = db.prepare(
      'INSERT INTO team_members (name, color_hex) VALUES (?, ?)'
    );
    const result = stmt.run(name.trim(), color_hex || '#6366f1');
    const member = db.prepare('SELECT * FROM team_members WHERE id = ?').get(result.lastInsertRowid);
    req.app.get('broadcast')({ type: 'team-changed' });
    res.status(201).json(member);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'A team member with that name already exists' });
    }
    throw err;
  }
});

// DELETE /api/team/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);

  // Check if member has active chores
  const hasChores = db.prepare(
    'SELECT 1 FROM chores WHERE assigned_to = ? AND is_active = 1 LIMIT 1'
  ).get(id);

  if (hasChores) {
    return res.status(409).json({
      error: 'This team member has assigned chores. Reassign or delete those chores first.'
    });
  }

  const result = db.prepare('DELETE FROM team_members WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Team member not found' });
  }
  req.app.get('broadcast')({ type: 'team-changed' });
  res.json({ success: true });
});

module.exports = router;
