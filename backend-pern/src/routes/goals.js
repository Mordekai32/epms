const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireRole } = require('../middleware/auth');

// Get all goals
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM goals ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Create a new goal
router.post('/', requireRole('admin', 'manager'), async (req, res) => {
  const { employeeNumber, goalTitle, description, targetDate } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO goals
       (employee_number, goal_title, description, target_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [employeeNumber, goalTitle, description, targetDate]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;