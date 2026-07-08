const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireRole } = require('../middleware/auth');

// Get all cycles
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM appraisal_cycles ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get active cycles only
router.get('/active', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM appraisal_cycles WHERE status = 'active' ORDER BY start_date DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Create cycle — admin only
router.post('/', requireRole('admin'), async (req, res) => {
  const { name, startDate, endDate } = req.body;
  if (!name || !startDate || !endDate) {
    return res.status(400).json({ message: 'Name, start date and end date are required.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO appraisal_cycles (name, start_date, end_date, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, startDate, endDate, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Update cycle status — admin only
router.put('/:id/status', requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['active', 'closed', 'draft'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }
  try {
    const result = await pool.query(
      'UPDATE appraisal_cycles SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Cycle not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Delete cycle — admin only
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM appraisal_cycles WHERE id = $1', [id]);
    res.json({ message: 'Cycle deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;