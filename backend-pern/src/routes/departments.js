const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireRole } = require('../middleware/auth');

// GET — all roles can view
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST — admin only
router.post('/', requireRole('admin'), async (req, res) => {
  const { departmentCode, departmentName } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO departments (department_code, department_name) VALUES ($1, $2) RETURNING *',
      [departmentCode, departmentName]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Department already exists.' });
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT — admin only
router.put('/:departmentCode', requireRole('admin'), async (req, res) => {
  const { departmentCode } = req.params;
  const { departmentName } = req.body;
  try {
    const result = await pool.query(
      'UPDATE departments SET department_name = $1 WHERE department_code = $2 RETURNING *',
      [departmentName, departmentCode]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Department not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE — admin only
router.delete('/:departmentCode', requireRole('admin'), async (req, res) => {
  const { departmentCode } = req.params;
  try {
    await pool.query('DELETE FROM departments WHERE department_code = $1', [departmentCode]);
    res.json({ message: 'Department deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;